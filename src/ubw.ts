import isSameDay from "date-fns/esm/isSameDay";

import { sleep } from "./utils";

const ADD_WORK_ORDER_BUTTON_SELECTOR = 'a[data-qtip="Legg til arb.oppgave"]';

const WORK_ORDER_INPUT_SELECTOR =
  'input[placeholder="Søk i prosjekt eller arbeidsordre"]';

const SAVE_WORK_ORDER_BUTTON_ID =
  '[data-u4id="addToTimesheetBtn"]:not(.x-disabled)';

const FIRST_DAY_HEADER_VALUE =
  '.abw-pcb-timesheet-grid-column-header[data-u4id="regValue1"]';

export async function addWorkOrder(
  workTask: string,
  workOrder: string,
  description: string,
  hours: number,
  date: Date,
  activity: string | undefined = undefined
): Promise<void> {
  if (!document.title.includes("Timeliste")) {
    console.log("Not in timeliste page");
    return;
  }

  const workorder = `${workTask}-${workOrder}`;

  console.info(
    `Adding work order: ${workorder} with activity ${activity} for ${hours} hours in ${date.toLocaleDateString()} with description: "${description}"`
  );

  const regValueId = getDaysInTimeSheet().filter(day =>
    isSameDay(day[1], date)
  );

  if (regValueId.length === 0) {
    console.warn(
      "Could not find a matching date for the current work order in this time sheet... skipping"
    );
    return;
  }

  const existingRowWithSameDescription = document.querySelector(
    `[data-qtip="${description}"]`
  ) as HTMLElement;

  if (existingRowWithSameDescription === null) {
    console.info("Adding NEW ROW because we didn't find an existing");
    const addWorkOrderButton = document.querySelector(
      ADD_WORK_ORDER_BUTTON_SELECTOR
    ) as HTMLButtonElement;
    if (addWorkOrderButton === null) {
      console.error("Could not find addWorkOrderButton element");
      return;
    }

    addWorkOrderButton.click();

    await sleep(100);

    // Find input field and input the work order + sub work order ("project")
    const workOrderInput = document.querySelector(
      WORK_ORDER_INPUT_SELECTOR
    ) as HTMLInputElement;
    if (workOrderInput === null) {
      console.error("Could not find workOrderInput element");
      closeAddWorkOrderPopup();
      return;
    }

    workOrderInput.value = workorder;
    workOrderInput.dispatchEvent(new Event("keyup")); // Make UBW register a change in this field
    await sleep(1250);

    // Click the correct element in the popup list
    const workOrderOption = document.querySelector(
      `[data-qtip="${workorder}"]`
    ) as HTMLElement;
    if (workOrderOption === null) {
      console.error(`Could not find a work order for the id ${workorder}`);
      closeAddWorkOrderPopup();
      return;
    }

    // Select the work order
    workOrderOption.click();
    await sleep(750);

    // If activity specified, set it
    if (activity !== undefined) {
      const activityOption = document.querySelector(
        `[data-recordid="${activity}"]`
      ) as HTMLElement;
      if (activityOption === null) {
        console.error(`Could not find an activity for the id ${activity}`);
        closeAddWorkOrderPopup();
        return;
      }
      activityOption.click();
      await sleep(10);
    }

    const saveWorkOrderButton = document.querySelector(
      SAVE_WORK_ORDER_BUTTON_ID
    ) as HTMLElement;
    if (saveWorkOrderButton === null) {
      console.error(
        "Could not find the save work order button... Or it is disabled."
      );
      closeAddWorkOrderPopup();
      return;
    }

    saveWorkOrderButton.click();
    await sleep(500);
  } else {
    console.info("Found existing description row and I'll reuse it");
    existingRowWithSameDescription.click();
    sleep(100);
  }

  console.debug("Entering description");
  const descriptionField = document.querySelector(
    'table[data-u4id="descriptionEditor"] input'
  ) as HTMLInputElement;

  if (descriptionField === null) {
    console.error("Could not find description field");
    closeAddWorkOrderPopup();
    return;
  }

  descriptionField.value = description;
  await sleep(750);

  console.debug("Entering hours per day etc");

  const dayHoursInput = document.querySelector(
    `input[name="${regValueId[0][0]}"]`
  ) as HTMLInputElement;

  if (dayHoursInput === null) {
    console.log(
      "Could not find where to input hours, looked for",
      `input[name="${regValueId[0][0]}"]`
    );
    console.error("Could not find where to input hours");
    return;
  }

  dayHoursInput.value = hours.toString();
  await sleep(250);

  return Promise.resolve();
}

export async function addWorkOrderFromEntry(
  workOrderEntry: string,
  description: string,
  hours: number,
  date: Date,
  activity: string | undefined
) {
  const workTask = workOrderEntry.split("-")[0];
  const workOrder = workOrderEntry.split("-")[1];
  return addWorkOrder(workTask, workOrder, description, hours, date, activity);
}

// UBW utility functions
function getFirstDayOfTimesheetWeek() {
  const firstDayElem = document.querySelector(
    FIRST_DAY_HEADER_VALUE
  ) as HTMLElement;

  if (firstDayElem === null) {
    console.error("Could not find first day element");
    return null;
  }

  const firstDayStringValue = firstDayElem.children[0].children[0].innerHTML
    .toString()
    .split("<br>")[1]
    .split("/");

  // Only support dates in current year because well i cba anything else
  const firstDate = new Date(
    new Date().getFullYear(),
    parseInt(firstDayStringValue[1], 10) - 1,
    parseInt(firstDayStringValue[0], 10)
  );

  console.log("Timesheet week starts on", firstDate);
  return firstDate;
}

function getDateFromHeaderRow(headerElem: HTMLElement): Date {
  const dateElem = headerElem.children[0].children[0].innerHTML
    .toString()
    .split("<br>")[1]
    .split("/");

  return new Date(
    new Date().getFullYear(),
    parseInt(dateElem[1], 10) - 1,
    parseInt(dateElem[0], 10)
  );
}

function getDaysInTimeSheet(): Array<[string, Date]> {
  return (
    [...Array(15)] // Hopefully there are never more than 15 days in an active time sheet
      .map(
        (_, n) =>
          document.querySelector(
            `.abw-pcb-timesheet-grid-column-header[data-u4id="regValue${n}"]`
          ) as HTMLElement
      )
      .filter(elem => elem !== null && elem !== undefined)
      .filter(
        elem =>
          elem.style["display"] === undefined ||
          elem.style["display"] !== "none"
      )
      // Remove any elements with undefined dataset!["u4id"]
      .filter(
        elem => elem.dataset !== undefined && elem.dataset["u4id"] !== undefined
      )
      // Forcefully cast elem.dataset[] to string since we know it can't be undefined after the filter above
      .map(elem => [elem.dataset["u4id"] as string, getDateFromHeaderRow(elem)])
  );
}

function closeAddWorkOrderPopup(): void {
  const workOrderPopup = document.querySelector(
    'div[data-u4id="addNewWorkTaskOverlay"]'
  );
  if (workOrderPopup === null) {
    console.error("Workorder popup is null");
    return;
  }

  // @ts-ignore keyCode 27 is the Escape key to trigger the menu to close.
  workOrderPopup.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));
}
