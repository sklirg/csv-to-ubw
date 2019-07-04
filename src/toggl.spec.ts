import { cleanDescription, grabRelevantDataFromTogglCsv } from "./toggl";
import { expect } from "chai";
import "mocha";
import { IEntry } from "./models";

describe("toggl", () => {
  it("should clean descriptions", () => {
    const description = 'hello "world"';
    const expected = "hello world";
    expect(cleanDescription(description)).to.equal(expected);
  });

  it("should work", () => {
    const lines = [
      // csv header
      "User,Email,Client,Project,Task,Description,Billable,Start date,Start time,End date,End time,Duration,Tags,Amount ()",
      // csv content
      'username,username@example.org,c,proj 123,,desc,No,2019-07-01,10:10:41,2019-07-01,10:58:41,00:48:00,"ordre:2, aktivitet:24",'
    ];
    const expected: IEntry[] = [
      {
        description: "desc",
        workorder: "123-2",
        date: new Date(),
        activity: "24",
        minutes: 48
      }
    ];

    const result = grabRelevantDataFromTogglCsv(lines);

    expect(result.length).to.equal(1);
    expect(result[0].activity).to.equal(expected[0].activity);
    expect(result[0].workorder).to.equal(expected[0].workorder);
    expect(result[0].minutes).to.equal(expected[0].minutes);
    expect(result[0].description).to.equal(expected[0].description);
  });

  it("should match work order if specified in project name", () => {
    const lines = [
      // csv header
      "User,Email,Client,Project,Task,Description,Billable,Start date,Start time,End date,End time,Duration,Tags,Amount ()",
      // csv content
      "username,username@example.org,c,proj 123-2,,desc,No,2019-07-01,10:10:41,2019-07-01,10:58:41,00:48:00,aktivitet:24,"
    ];

    expect(grabRelevantDataFromTogglCsv(lines)[0].workorder).to.equal("123-2");
  });

  it("should match work order if specified in tags", () => {
    const lines = [
      // csv header
      "User,Email,Client,Project,Task,Description,Billable,Start date,Start time,End date,End time,Duration,Tags,Amount ()",
      // csv content
      'username,username@example.org,c,proj 123,,desc,No,2019-07-01,10:10:41,2019-07-01,10:58:41,00:48:00,"ordre:2, aktivitet:24",'
    ];

    expect(grabRelevantDataFromTogglCsv(lines)[0].workorder).to.equal("123-2");
  });
});
