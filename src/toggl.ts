import { IEntry } from "./models";

export function grabRelevantDataFromTogglCsv(data: string[]) {
  const headerRow = data[0].split(",");
  const indices: IWorkOrderIndices = {
    projectIndex: headerRow.indexOf("Project"),
    taskIndex: headerRow.indexOf("Task"),
    descriptionIndex: headerRow.indexOf("Description"),
    durationIndex: headerRow.indexOf("Duration"),
    tagsIndex: headerRow.indexOf("Tags"),
    dateIndex: headerRow.indexOf("Start date")
  };

  console.debug("Indices:", indices);

  return (
    data
      .slice(1)
      // Split unless a space is following the , because that's probably inside the tag list and we don't want to split that
      .map(row => row.split(/,(?! )/))
      .filter(entry => entry.length > 1) // Might get one element with "" in it, so skip that
      .map(entry => getRelevantData(entry, indices))
  );
}

function getRelevantData(entry: string[], indices: IWorkOrderIndices): IEntry {
  console.debug("[toggl-convert] Mapping entry", entry);

  const description = entry[indices.descriptionIndex];
  const activityMatch = entry[indices.tagsIndex].match(/aktivitet:(\d+)/);

  console.group(`[toggl-convert] ${description}`);

  let activity = undefined;
  if (activityMatch !== null) {
    activity = activityMatch[1];
  }

  const durationValue = entry[indices.durationIndex];
  const stringDate = `1970-01-01T${durationValue}Z`;

  // Add hours for start of every 30 minutes
  const minutes = new Date(stringDate).getTime() / 1000 / 60;

  console.log(
    `Converting hours for ${description} from ${durationValue} to ${minutes} minutes`
  );

  console.groupEnd();

  return {
    activity,
    description,
    minutes,
    workorder: getWorkOrderFromEntry(entry, indices),
    date: new Date(entry[indices.dateIndex])
  };
}

function getWorkOrderFromEntry(
  entry: string[],
  indices: IWorkOrderIndices
): string {
  const workOrderFromProject = getWorkTask(entry[indices.projectIndex]);

  if (workOrderFromProject.length > 1) {
    console.debug("Found work task in toggl project");

    if (workOrderFromProject.indexOf("-") === -1) {
      console.debug("Getting work order for task");
      const workOrder = getWorkOrder(entry[indices.tagsIndex]);
      return `${workOrderFromProject}-${workOrder}`;
    }

    return workOrderFromProject;
  }

  const workOrderFromTask = getWorkTask(entry[indices.taskIndex]);

  if (workOrderFromTask.length > 1) {
    console.debug("Found work task in toggl task");

    if (workOrderFromTask.indexOf("-") === -1) {
      console.debug("Getting work order for task");
      const workOrder = getWorkOrder(entry[indices.tagsIndex]);
      return `${workOrderFromTask}-${workOrder}`;
    }

    return workOrderFromTask;
  }

  const workOrderFromTags = getWorkTask(entry[indices.tagsIndex]);

  if (workOrderFromTags.length > 1) {
    console.debug("Found work task in toggl tags");

    if (workOrderFromTags.indexOf("-") === -1) {
      console.debug("Getting work order for task");
      const workOrder = getWorkOrder(entry[indices.tagsIndex]);
      return `${workOrderFromTags}-${workOrder}`;
    }

    return workOrderFromTags;
  }

  console.error("Could not find work task information");
  return "";
}

function getWorkTask(entry: string): string {
  const workTaskMatch = entry.match(/\d+-\d+/);
  if (workTaskMatch !== null) {
    // If we match full work order, return immediately
    console.debug("Matched full work task+order; returning");
    return workTaskMatch[0];
  }

  const togglProject = entry.match(/\d+(-\d+)?/);
  console.log("getWorkTask => ", togglProject);

  if (togglProject === null) {
    // @ fetch from somewhere else
    console.error("togglProject was null -- cannot find work task/work order");
    return "";
  }

  if (togglProject[0].indexOf("-") !== -1) {
    // We have work task and work order
    console.debug("Have both task and order");
    return togglProject[0];
  }

  return togglProject[0];
}

function getWorkOrder(entry: string): string {
  const workOrderMatch = entry.match(/ordre:\d+/);
  if (workOrderMatch === null) {
    console.warn("Couldn't find a work order match in", entry);
    return "";
  }

  console.debug("Matched for work order", workOrderMatch);

  return workOrderMatch[0].replace("ordre:", "");
}

interface IWorkOrderIndices {
  [key: string]: number;
}
