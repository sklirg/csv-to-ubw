import { expect } from "chai";
import "mocha";

import { accumulateSameDayTimeEntries } from "./utils";
import { IEntry } from "./models";
import { addDays } from "date-fns";

const mockTimeEntry: IEntry = {
  description: "test entry",
  activity: "",
  date: new Date(),
  minutes: 10,
  workorder: ""
};

describe("accumulateSameDayTimeEntries", () => {
  it("should keep a single entry on the same day as one entry", () => {
    const expected = mockTimeEntry.minutes;
    const entries = accumulateSameDayTimeEntries([], mockTimeEntry);

    const acc = entries.reduce((prev, next) => prev + next.minutes, 0);

    expect(entries.length).to.equal(1);
    expect(acc).to.equal(expected);
  });

  it("should accumulate entries on the same day into one set of hours", () => {
    const expected = mockTimeEntry.minutes * 2;
    const entries = accumulateSameDayTimeEntries(
      [mockTimeEntry],
      mockTimeEntry
    );
    const acc = entries.reduce((prev, next) => prev + next.minutes, 0);

    expect(entries.length).to.equal(1);
    expect(acc).to.equal(expected);
  });

  it("should keep entries on different days as separate sets of hours", () => {
    const expected = mockTimeEntry.minutes;

    const entries = accumulateSameDayTimeEntries([mockTimeEntry], {
      ...mockTimeEntry,
      date: addDays(new Date(), 1)
    });

    expect(entries.length).to.equal(2);
    expect(entries[0].minutes).to.equal(expected);
    expect(entries[1].minutes).to.equal(expected);
  });
});
