export enum EPastTime {
  days = "days",
  weeks = "weeks",
  months = "months",
  years = "years",
}
export interface IPastTime {
  unit: EPastTime;
  value: number;
}
export enum ELoadingSize {
  sm = "sm",
  md = "md",
  lg = "lg",
}
