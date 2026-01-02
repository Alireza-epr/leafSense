import { Map, Marker, Subscription } from "maplibre-gl";
import {
  ESampleFilter,
  IRejection,
  IFetchItem,
  IStacSearchResponse,
  IChangePoint,
} from "./index";
import { IChartSummaryRow } from "../components/ChartSummaryRow";

export enum EMarkerType {
  point = "point",
  polygon = "zonal",
}
export interface IMarker {
  type: EMarkerType;
  marker: Marker;
}

export type TPercentage = `${number | string}%`;
export interface INDVISmoothed {
  meanNDVISmoothed: number | null;
  medianNDVISmoothed: number | null;
}

export interface INDVISample {
  featureId: string;
  id: number;
  datetime: string;
  preview: string;
  ndviArray: Float32Array<ArrayBuffer> | null;
  meanNDVI: number | null;
  meanNDVISmoothed: number | null;
  medianNDVI: number | null;
  medianNDVISmoothed: number | null;
  n_valid: number;
  valid_fraction: number; // 0 - 100
  not_valid_fraction: IRejection;
  filter: ESampleFilter;
  filter_fraction: number; // 0 - 100
}

export enum ERequestContext {
  main = "main",
  comparison = "comparison",
}

export type TSample = Record<ERequestContext, INDVISample[]>;
export type TFetchFeature = Record<ERequestContext, IFetchItem | null>;
export type TResponseFeature = Record<
  ERequestContext,
  IStacSearchResponse | null
>;
export type TErrorFeature = Record<ERequestContext, Error | null>;
export type TErrorNDVI = Record<ERequestContext, Error | null>;
export type TDoneFeature = Record<ERequestContext, number>;
export type TChangePoint = Record<ERequestContext, IChangePoint[]>;
export type TSummaryItem = Record<ERequestContext, IChartSummaryRow[]>;
export type TLatency = Record<ERequestContext, number>;
export type TGlobalLoading = Record<ERequestContext, boolean>;

export type TMarker = Record<EMarkerType, boolean>;

export interface IPolygon {
  id: number;
  markers: IMarker[];
}
