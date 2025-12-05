import { EPastTime } from "../types/generalTypes";
import { getLocaleISOString } from "../utils/dateUtils";
import { Marker, Subscription } from "maplibre-gl";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import {
  StacLink,
  IStacSearchResponse,
  ITokenCollection,
  spatialItems,
  temporalItems,
  TSpatialComparison,
  TTemporalComparison,
} from "../types/apiTypes";

export enum EMarkerType {
  point = "point",
  polygon = "polygon",
}
export interface IMarker {
  type: EMarkerType;
  marker: Marker;
}

export interface INDVISample {
  id: number;
  datetime: string;
  NDVI: number | null;
}

export type TMarker = Record<EMarkerType, boolean>;

export interface IMapStoreStates {
  marker: TMarker;
  markers: IMarker[];
  startDate: string;
  endDate: string;
  cloudCover: string;
  coverageThreshold : string;
  snowCover: string;
  limit: string;
  showChart: boolean;
  showError: boolean;
  fetchFeatures: boolean;
  globalLoading: boolean;
  samples: INDVISample[];
  notValidSamples: INDVISample[];
  responseFeatures: IStacSearchResponse | null;
  errorFeatures: Error | null;
  errorNDVI: Error | null;
  tokenCollection: ITokenCollection | null;
  doneFeature: number;
  temporalOp: TTemporalComparison;
  spatialOp: TSpatialComparison;
  showROI: boolean;
  nextPage: StacLink | null;
  previousPage: StacLink | null;
}

export interface IMapStoreActions {
  // Accept either direct value or functional update
  setMarker: (a_Marker: TMarker | ((prev: TMarker) => TMarker)) => void;
  setMarkers: (a_Markers: IMarker[] | ((prev: IMarker[]) => IMarker[])) => void;
  setStartDate: (a_Start: string | ((prev: string) => string)) => void;
  setEndDate: (a_End: string | ((prev: string) => string)) => void;
  setCloudCover: (a_CloudCover: string | ((a_Prev: string) => string)) => void;
  setSnowCover: (a_SnowCover: string | ((a_Prev: string) => string)) => void;
  setCoverageThreshold : (a_Value: string | ((a_Prev: string) => string)) => void;
  setShowChart: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setShowROI: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setShowError: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setFetchFeatures: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setGlobalLoading: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setSamples: (
    a_Value: INDVISample[] | ((prev: INDVISample[]) => INDVISample[]),
  ) => void;
  setNotValidSamples: (
    a_Value: INDVISample[] | ((prev: INDVISample[]) => INDVISample[]),
  ) => void;
  setResponseFeatures: (
    a_Value:
      | (IStacSearchResponse | null)
      | ((prev: IStacSearchResponse | null) => IStacSearchResponse | null),
  ) => void;
  setErrorFeatures: (
    a_Value: (Error | null) | ((prev: Error | null) => Error | null),
  ) => void;
  setErrorNDVI: (
    a_Value: (Error | null) | ((prev: Error | null) => Error | null),
  ) => void;
  setTokenCollection: (
    a_Value:
      | (ITokenCollection | null)
      | ((prev: ITokenCollection | null) => ITokenCollection | null),
  ) => void;
  setDoneFeature: (a_Value: number | ((prev: number) => number)) => void;
  setLimit: (a_Value: string | ((prev: string) => string)) => void;
  setTemporalOp: (
    a_Start:
      | TTemporalComparison
      | ((prev: TTemporalComparison) => TTemporalComparison),
  ) => void;
  setSpatialOp: (
    a_Start:
      | TSpatialComparison
      | ((prev: TSpatialComparison) => TSpatialComparison),
  ) => void;
  setPreviousPage: (
    a_Link: (StacLink | null) | ((prev: StacLink | null) => StacLink | null),
  ) => void;
  setNextPage: (
    a_Link: (StacLink | null) | ((prev: StacLink | null) => StacLink | null),
  ) => void;
}

export const useMapStore = create<IMapStoreStates & IMapStoreActions>(
  combine(
    {
      // States
      marker: {
        [EMarkerType.point]: false,
        [EMarkerType.polygon]: false,
      } as TMarker,
      markers: [] as IMarker[],
      //filter
      startDate: getLocaleISOString(new Date(), {
        unit: EPastTime.months,
        value: 1,
      }), // 2025-09-31T14:43:33
      endDate: getLocaleISOString(new Date()), // 2025-10-31T14:43:33
      cloudCover: "30",
      snowCover: "50",
      coverageThreshold: "70",
      limit: "20",
      spatialOp: spatialItems[0].value,
      temporalOp: temporalItems[0].value,
      //features
      tokenCollection: null as ITokenCollection | null,
      fetchFeatures: false,
      responseFeatures: null as IStacSearchResponse | null,
      errorFeatures: null as Error | null,
      errorNDVI: null as Error | null,
      showChart: false,
      showError: false,
      globalLoading: false,
      doneFeature: 1,
      showROI: false,
      nextPage: null as StacLink | null,
      previousPage: null as StacLink | null,
      //NDVI
      samples: [] as INDVISample[],
      notValidSamples: [] as INDVISample[],
    },
    (set) => ({
      // Actions
      setMarker: (a_Marker: TMarker | ((a_Prev: TMarker) => TMarker)) =>
        set((state) => ({
          marker:
            typeof a_Marker === "function" ? a_Marker(state.marker) : a_Marker,
        })),

      setMarkers: (a_Markers: IMarker[] | ((a_Prev: IMarker[]) => IMarker[])) =>
        set((state) => ({
          markers:
            typeof a_Markers === "function"
              ? a_Markers(state.markers)
              : a_Markers,
        })),

      setTokenCollection: (
        a_Value:
          | (ITokenCollection | null)
          | ((prev: ITokenCollection | null) => ITokenCollection | null),
      ) =>
        set((state) => ({
          tokenCollection:
            typeof a_Value === "function"
              ? a_Value(state.tokenCollection)
              : a_Value,
        })),

      setPreviousPage: (a_Link) =>
        set((state) => ({
          previousPage:
            typeof a_Link === "function" ? a_Link(state.previousPage) : a_Link,
        })),

      setNextPage: (a_Link) =>
        set((state) => ({
          nextPage:
            typeof a_Link === "function" ? a_Link(state.nextPage) : a_Link,
        })),

      setStartDate: (a_Start: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          startDate:
            typeof a_Start === "function" ? a_Start(state.startDate) : a_Start,
        })),

      setDoneFeature: (a_Value: number | ((a_Prev: number) => number)) =>
        set((state) => ({
          doneFeature:
            typeof a_Value === "function"
              ? a_Value(state.doneFeature)
              : a_Value,
        })),

      setLimit: (a_Value: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          limit: typeof a_Value === "function" ? a_Value(state.limit) : a_Value,
        })),

      setEndDate: (a_End: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          endDate: typeof a_End === "function" ? a_End(state.endDate) : a_End,
        })),

      setCloudCover: (a_CloudCover: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          cloudCover:
            typeof a_CloudCover === "function"
              ? a_CloudCover(state.cloudCover)
              : a_CloudCover,
        })),

      setSnowCover: (a_SnowCover: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          snowCover:
            typeof a_SnowCover === "function"
              ? a_SnowCover(state.snowCover)
              : a_SnowCover,
        })),
      
      setCoverageThreshold: (a_Value) =>
        set((state) => ({
          coverageThreshold:
            typeof a_Value === "function"
              ? a_Value(state.coverageThreshold)
              : a_Value,
        })),

      setShowChart: (a_Value: boolean | ((prev: boolean) => boolean)) =>
        set((state) => ({
          showChart:
            typeof a_Value === "function" ? a_Value(state.showChart) : a_Value,
        })),

      setShowROI: (a_Value: boolean | ((prev: boolean) => boolean)) =>
        set((state) => ({
          showROI:
            typeof a_Value === "function" ? a_Value(state.showROI) : a_Value,
        })),

      setShowError: (a_Value: boolean | ((prev: boolean) => boolean)) =>
        set((state) => ({
          showError:
            typeof a_Value === "function" ? a_Value(state.showError) : a_Value,
        })),

      setFetchFeatures: (a_Value: boolean | ((prev: boolean) => boolean)) =>
        set((state) => ({
          fetchFeatures:
            typeof a_Value === "function"
              ? a_Value(state.fetchFeatures)
              : a_Value,
        })),

      setSamples: (
        a_Samples: INDVISample[] | ((a_Prev: INDVISample[]) => INDVISample[]),
      ) =>
        set((state) => ({
          samples:
            typeof a_Samples === "function"
              ? a_Samples(state.samples)
              : a_Samples,
        })),

      setNotValidSamples: (a_Samples) =>
        set((state) => ({
          notValidSamples:
            typeof a_Samples === "function"
              ? a_Samples(state.notValidSamples)
              : a_Samples,
        })),

      setGlobalLoading: (a_Value: boolean | ((prev: boolean) => boolean)) =>
        set((state) => ({
          globalLoading:
            typeof a_Value === "function"
              ? a_Value(state.globalLoading)
              : a_Value,
        })),

      setResponseFeatures: (a_Value) =>
        set((state) => ({
          responseFeatures:
            typeof a_Value === "function"
              ? a_Value(state.responseFeatures)
              : a_Value,
        })),

      setErrorFeatures: (a_Value) =>
        set((state) => ({
          errorFeatures:
            typeof a_Value === "function"
              ? a_Value(state.errorFeatures)
              : a_Value,
        })),

      setErrorNDVI: (a_Value) =>
        set((state) => ({
          errorNDVI:
            typeof a_Value === "function" ? a_Value(state.errorNDVI) : a_Value,
        })),

      setTemporalOp: (a_Value) =>
        set((state) => ({
          temporalOp:
            typeof a_Value === "function" ? a_Value(state.temporalOp) : a_Value,
        })),

      setSpatialOp: (a_Value) =>
        set((state) => ({
          spatialOp:
            typeof a_Value === "function" ? a_Value(state.spatialOp) : a_Value,
        })),
    }),
  ),
);
