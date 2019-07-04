import { IEntry } from "./models";
import { isSameDay } from "date-fns";

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const filereader = new FileReader();
    filereader.readAsText(file);
    filereader.onload = () => {
      if (filereader.result !== null) {
        console.log("typeof result", typeof filereader.result);
        return resolve(filereader.result.toString());
      }
      return reject(new Error("Failed to read file contents"));
    };
  });
}

export function accumulateSameDayTimeEntries(
  currentEntries: IEntry[],
  newEntry: IEntry
): IEntry[] {
  const elem = currentEntries.find(
    elem =>
      elem.description === newEntry.description &&
      isSameDay(elem.date, newEntry.date)
  );

  // If we find an element in the current entries with the same description on the same date, update it
  if (elem) {
    return [
      ...currentEntries.filter(
        elem => elem.description !== newEntry.description
      ),
      { ...elem, minutes: elem.minutes + newEntry.minutes }
    ];
  }
  return [...currentEntries, newEntry];
}

export function minutesToWorkHours(minutes: number): number {
  return Math.ceil(minutes / 30) * 0.5;
}
