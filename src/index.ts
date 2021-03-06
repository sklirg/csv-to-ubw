import { grabRelevantDataFromTogglCsv } from "./toggl";
import { IEntry } from "./models";
import { addWorkOrderFromEntry } from "./ubw";
import {
  readFile,
  minutesToWorkHours,
  accumulateSameDayTimeEntries
} from "./utils";

export interface IUBWEntry extends IEntry {
  hours: number;
}

console.info("[CTU] CSV to UBW extension enabled");

// Overriding dragover event to allow dropping files into the website without redirecting to the dropped file
document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", async e => {
  e.preventDefault();

  if (e.dataTransfer === null) {
    console.error("[CTU] File drop datatransfer event was null");
    return;
  }

  // Finding a CSV file in the dropped item(s)
  const csvFile = [...e.dataTransfer.items].find(i => i.type === "text/csv");

  if (csvFile === null || csvFile === undefined) {
    console.error("[CTU] Unrecognizable CSV file");
    return;
  }

  const fileData = csvFile.getAsFile();

  if (fileData === null) {
    console.error("[CTU] Failed to get dropped item content as a file");
    return;
  }

  const data = await readFile(fileData);

  console.groupCollapsed("[toggl-conv]");
  const ubwData: IUBWEntry[] = grabRelevantDataFromTogglCsv(data.split("\n"))
    // Make sure entries on the same date get accumulated
    .reduce<IEntry[]>(accumulateSameDayTimeEntries, [])
    .map(entry => ({
      ...entry,
      hours: minutesToWorkHours(entry.minutes)
    }));
  console.groupEnd();

  console.group("Source data");
  console.table(ubwData);
  console.groupEnd();

  // Using a for loop to support awaiting the previous task before continuing the loop.
  for (const row of ubwData) {
    console.group(`${row.description} (${row.workorder}-${row.activity})`);
    console.debug(
      `Adding row with ${row.minutes} minutes => ${row.hours} hours`
    );

    await addWorkOrderFromEntry(
      row.workorder,
      row.description,
      row.hours,
      row.date,
      row.activity
    );

    console.groupEnd();
  }

  console.info("[CTU] Done entering from dropped CSV!");
});
