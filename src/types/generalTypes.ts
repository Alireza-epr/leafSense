import { EMarkerType, INDVISample } from "../types";
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
  loglevel = "loglevel",
  annotations = "annotations",
}

export enum ELogLevel {
  message = "message",
  warning = "warning",
  error = "error",
}

export enum EAggregationMethod {
  Mean = "mean",
  Median = "median",
}
export interface IChangePoint {
  id: number;
  datetime: string;
  delta: number;
  z: number;
  reason: "z-score";
}
export interface IChartHeaderItemOption {
  title: string;
  id: number;
  value: string;
  subtitle?: string;
  min?: number;
  max?: number;
  step?: number;
}

export enum EChartHeaderOptions {
  smoothing = "smoothing",
  detection = "detection",
  comparison = "comparison",
  methods = "methods",
  caveats = "caveats",
}

export enum EChartHeaderWindows {
  summary = "summary",
  mainList = "mainList",
  comparisonList = "comparisonList",
}

export interface IFetchItem {
  type: EMarkerType;
  id: number;
}

export interface INDVISampleExtended {
  main_meanNDVI?: number | null;
  main_meanNDVISmoothed?: number | null;
  main_medianNDVI?: number | null;
  main_medianNDVISmoothed?: number | null;
  main_meanNDVI_gap?: number | null;
  main_medianNDVI_gap?: number | null;

  // COMPARISON
  comparison_meanNDVI?: number | null;
  comparison_meanNDVISmoothed?: number | null;
  comparison_medianNDVI?: number | null;
  comparison_medianNDVISmoothed?: number | null;
  comparison_meanNDVI_gap?: number | null;
  comparison_medianNDVI_gap?: number | null;
  comparison_id?: number;

  // Additionals
  note: string | null;
}

export type IChartPoint = INDVISample & INDVISampleExtended;

export interface IAnnotationItem {
  featureId: string;
  datetime: string;
  note: string;
}

export interface IChartIndex {
  start: number | undefined;
  end: number | undefined;
}

export interface INearestPoint {
  x: number;
  y: number;
  note: string;
  featureId: string;
  datetime: string;
}

export enum ERejection {
  NO_DATA = 0,
  SATURATED_OR_DEFECTIVE = 1,
  CLOUD_SHADOWS = 3,
  WATER = 6,
  CLOUD_MEDIUM_PROBABILITY = 8,
  CLOUD_HIGH_PROBABILITY = 9,
  THIN_CIRRUS = 10,
}

export interface IRejection {
  NO_DATA: number;
  SATURATED_OR_DEFECTIVE: number;
  CLOUD_SHADOWS: number;
  WATER: number;
  CLOUD_MEDIUM_PROBABILITY: number;
  CLOUD_HIGH_PROBABILITY: number;
  THIN_CIRRUS: number;
}

export enum ESampleStatus {
  Included = "Included",
  Excluded = "Excluded",
}
