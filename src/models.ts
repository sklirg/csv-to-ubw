export interface IEntry {
  workorder: string;
  activity: string | undefined;
  minutes: number;
  description: string;
  date: Date;
}
