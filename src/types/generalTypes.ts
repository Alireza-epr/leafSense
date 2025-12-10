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

export enum ESampleFilter {
  none= "none",
  zScore= "z-score",
  IQR= "IQR"
}

export interface INDVIPanel {
  filter: ESampleFilter,
  coverageThreshold: number
}
