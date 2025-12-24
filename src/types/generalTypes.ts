import { IFeature } from "./geoJSON";

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
  none = "none",
  zScore = "z-score",
  IQR = "IQR",
}

export interface INDVIPanel {
  filter: ESampleFilter;
  coverageThreshold: number;
}

export type Units =
  | "meters"
  | "metres"
  | "millimeters"
  | "millimetres"
  | "centimeters"
  | "centimetres"
  | "kilometers"
  | "kilometres"
  | "miles"
  | "nauticalmiles"
  | "inches"
  | "yards"
  | "feet"
  | "radians"
  | "degrees";

export interface ILayerMetadata {
  feature: IFeature;
  center: [number, number];
}

export enum EURLParams {
  pointROI = "point-roi",
  zonalROI = "zonal-roi",
  startDate = "startdate",
  endDate = "enddate",
  spatialOp = "spatialop",
  temporalOp = "temporalop",
  cloud = "cloud",
  snow = "snow",
  limit = "limit",
  coverage = "coverage",
  smoothing = "smoothing",
  filter = "filter",
}

export enum EAggregationMethod {
  Mean= "mean",
  Median= "median"
}
export interface IChangePoint {
  id: number;
  datetime: string;
  delta: number;
  z: number;
  reason: "z-score";
}
export interface IChartHeaderItemOption {
  title: string,
  id: number,
  value: string,
  min: number, 
  max: number,
  step: number
}
