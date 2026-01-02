import {
  EAggregationMethod,
  EPastTime,
  ESampleFilter,
  IAnnotationItem,
  IChangePoint,
  IChartHeaderItemOption,
  IChartIndex,
  IFetchItem,
  INearestPoint,
  IRejection,
} from "../types/generalTypes";
import { getLocaleISOString } from "../utils/dateUtils";
import { Map, Marker, Subscription } from "maplibre-gl";
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
import {
  TMarker,
  IMarker,
  TFetchFeature,
  TGlobalLoading,
  TChangePoint,
  TSample,
  TResponseFeature,
  TErrorFeature,
  TErrorNDVI,
  TDoneFeature,
  IPolygon,
  TLatency,
  TSummaryItem,
  EMarkerType,
  INDVISample,
} from "../types";

export interface IMapStoreStates {
  map: Map | null;
  marker: TMarker;
  markers: IMarker[];
  startDate: string;
  endDate: string;
  cloudCover: string;
  coverageThreshold: string;
  snowCover: string;
  limit: string;
  radius: string;
  showChart: boolean;
  showError: boolean;
  fetchFeatures: TFetchFeature;
  globalLoading: TGlobalLoading;
  smoothingWindow: IChartHeaderItemOption[];
  changeDetection: IChartHeaderItemOption[];
  toggleOptions: IChartHeaderItemOption[];
  changePoints: TChangePoint;
  samples: TSample;
  notValidSamples: TSample;
  responseFeatures: TResponseFeature;
  errorFeatures: TErrorFeature;
  errorNDVI: TErrorNDVI;
  tokenCollection: ITokenCollection | null;
  doneFeature: TDoneFeature;
  temporalOp: TTemporalComparison;
  spatialOp: TSpatialComparison;
  showROI: boolean;
  nextPage: StacLink | null;
  previousPage: StacLink | null;
  sampleFilter: ESampleFilter;
  yAxis: EAggregationMethod;
  polygons: IPolygon[];
  summaryItem: TSummaryItem;
  latency: TLatency;
  nearestPoint: INearestPoint;
  annotations: IAnnotationItem[];
  chartIndex: IChartIndex;
}

export interface IMapStoreActions {
  setMap: (a_Map: Map | null | ((prev: Map | null) => Map)) => void;
  // Accept either direct value or functional update
  setMarker: (a_Marker: TMarker | ((prev: TMarker) => TMarker)) => void;
  setMarkers: (a_Markers: IMarker[] | ((prev: IMarker[]) => IMarker[])) => void;
  setStartDate: (a_Start: string | ((prev: string) => string)) => void;
  setEndDate: (a_End: string | ((prev: string) => string)) => void;
  setCloudCover: (a_CloudCover: string | ((a_Prev: string) => string)) => void;
  setSnowCover: (a_SnowCover: string | ((a_Prev: string) => string)) => void;
  setCoverageThreshold: (
    a_Value: string | ((a_Prev: string) => string),
  ) => void;
  setShowChart: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setShowROI: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setShowError: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
  setFetchFeatures: (
    a_Value: TFetchFeature | ((prev: TFetchFeature) => TFetchFeature),
  ) => void;
  setGlobalLoading: (
    a_Value: TGlobalLoading | ((prev: TGlobalLoading) => TGlobalLoading),
  ) => void;
  setSmoothingWindow: (
    a_Value:
      | IChartHeaderItemOption[]
      | ((prev: IChartHeaderItemOption[]) => IChartHeaderItemOption[]),
  ) => void;
  setSamples: (a_Value: TSample | ((prev: TSample) => TSample)) => void;
  setNotValidSamples: (a_Value: TSample | ((prev: TSample) => TSample)) => void;
  setResponseFeatures: (
    a_Value: TResponseFeature | ((prev: TResponseFeature) => TResponseFeature),
  ) => void;
  setErrorFeatures: (
    a_Value: TErrorFeature | ((prev: TErrorFeature) => TErrorFeature),
  ) => void;
  setErrorNDVI: (
    a_Value: TErrorNDVI | ((prev: TErrorNDVI) => TErrorNDVI),
  ) => void;
  setTokenCollection: (
    a_Value:
      | (ITokenCollection | null)
      | ((prev: ITokenCollection | null) => ITokenCollection | null),
  ) => void;
  setDoneFeature: (
    a_Value: TDoneFeature | ((prev: TDoneFeature) => TDoneFeature),
  ) => void;
  setLimit: (a_Value: string | ((prev: string) => string)) => void;
  setRadius: (a_Value: string | ((prev: string) => string)) => void;
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
  setSampleFilter: (
    a_Filter: ESampleFilter | ((prev: ESampleFilter) => ESampleFilter),
  ) => void;
  setYAxis: (
    a_Value:
      | EAggregationMethod
      | ((prev: EAggregationMethod) => EAggregationMethod),
  ) => void;
  setChangeDetection: (
    a_Value:
      | IChartHeaderItemOption[]
      | ((prev: IChartHeaderItemOption[]) => IChartHeaderItemOption[]),
  ) => void;
  setToggleOptions: (
    a_Value:
      | IChartHeaderItemOption[]
      | ((prev: IChartHeaderItemOption[]) => IChartHeaderItemOption[]),
  ) => void;
  setChangePoints: (
    a_Value: TChangePoint | ((prev: TChangePoint) => TChangePoint),
  ) => void;
  setPolygons: (
    a_Value: IPolygon[] | ((prev: IPolygon[]) => IPolygon[]),
  ) => void;
  setSummaryItem: (
    a_Value: TSummaryItem | ((prev: TSummaryItem) => TSummaryItem),
  ) => void;
  setLatency: (a_Value: TLatency | ((prev: TLatency) => TLatency)) => void;
  setNearestPoint: (
    a_Value: INearestPoint | ((prev: INearestPoint) => INearestPoint),
  ) => void;
  setAnnotations: (
    a_Value:
      | IAnnotationItem[]
      | ((prev: IAnnotationItem[]) => IAnnotationItem[]),
  ) => void;
  setChartIndex: (
    a_Value: IChartIndex | ((prev: IChartIndex) => IChartIndex),
  ) => void;
}

export const useMapStore = create<IMapStoreStates & IMapStoreActions>(
  combine(
    {
      // States
      map: null as Map | null,
      marker: {
        [EMarkerType.point]: false,
        [EMarkerType.polygon]: false,
      } as TMarker,
      markers: [] as IMarker[],
      polygons: [] as IPolygon[],
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
      radius: "10",
      spatialOp: spatialItems[0].value,
      temporalOp: temporalItems[0].value,
      //features
      tokenCollection: null as ITokenCollection | null,
      fetchFeatures: {
        main: null as IFetchItem | null,
        comparison: null as IFetchItem | null,
      },
      responseFeatures: {
        main: null as IStacSearchResponse | null,
        comparison: null as IStacSearchResponse | null,
      },
      errorFeatures: {
        main: null as Error | null,
        comparison: null as Error | null,
      },
      errorNDVI: {
        main: null as Error | null,
        comparison: null as Error | null,
      },
      showChart: false,
      showError: false,
      globalLoading: {
        main: false,
        comparison: false,
      },
      doneFeature: {
        main: 1,
        comparison: 1,
      },
      showROI: false,
      nextPage: null as StacLink | null,
      previousPage: null as StacLink | null,
      //NDVI
      samples: {
        main: [] as INDVISample[],
        comparison: [] as INDVISample[],
      },
      sampleFilter: ESampleFilter.none,
      notValidSamples: {
        main: [] as INDVISample[],
        comparison: [] as INDVISample[],
      },
      smoothingWindow: [
        {
          title: "Window (1=off)",
          id: 1,
          value: "1",
          min: 1,
          max: 7,
          step: 2,
        },
      ] as IChartHeaderItemOption[],
      yAxis: EAggregationMethod.Mean,
      changeDetection: [
        {
          title: "Window (1=off)",
          id: 1,
          value: "1",
          min: 1,
          max: 7,
          step: 2,
        },
        {
          title: "Z-Threshold",
          id: 2,
          value: "2.5",
          min: 1.5,
          max: 4,
          step: 0.1,
        },
        {
          title: "Separation",
          id: 3,
          value: "3",
          min: 1,
          max: 10,
          step: 1,
        },
      ] as IChartHeaderItemOption[],
      changePoints: {
        main: [] as IChangePoint[],
        comparison: [] as IChangePoint[],
      },
      toggleOptions: [] as IChartHeaderItemOption[],
      summaryItem: {
        main: [
          { id: 1, title: "Total / Used Scenes", value: "-" },
          { id: 2, title: "Average Valid Pixels", value: "-" },
          { id: 3, title: "First Date", value: "-" },
          { id: 4, title: "Last Date", value: "-" },
          { id: 5, title: "Latency", value: "-" },
        ],
        comparison: [
          { id: 1, title: "Total / Used Scenes", value: "-" },
          { id: 2, title: "Average Valid Pixels", value: "-" },
          { id: 3, title: "First Date", value: "-" },
          { id: 4, title: "Last Date", value: "-" },
          { id: 5, title: "Latency", value: "-" },
        ],
      } as TSummaryItem,
      latency: {
        main: 0,
        comparison: 0,
      },
      nearestPoint: {
        x: 0,
        y: 0,
        note: "",
        featureId: "",
        datetime: "",
      } as INearestPoint,
      annotations: [] as IAnnotationItem[],
      chartIndex: {
        start: undefined,
        end: undefined,
      } as IChartIndex,
    },
    (set) => ({
      // Actions
      setMap: (a_Map) =>
        set((state) => ({
          map: typeof a_Map === "function" ? a_Map(state.map) : a_Map,
        })),
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

      setDoneFeature: (a_Value) =>
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

      setRadius: (a_Value) =>
        set((state) => ({
          radius:
            typeof a_Value === "function" ? a_Value(state.radius) : a_Value,
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

      setFetchFeatures: (a_Value) =>
        set((state) => ({
          fetchFeatures:
            typeof a_Value === "function"
              ? a_Value(state.fetchFeatures)
              : a_Value,
        })),

      setSamples: (a_Samples) =>
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

      setGlobalLoading: (a_Value) =>
        set((state) => ({
          globalLoading:
            typeof a_Value === "function"
              ? a_Value(state.globalLoading)
              : a_Value,
        })),

      setSmoothingWindow: (a_Value) =>
        set((state) => ({
          smoothingWindow:
            typeof a_Value === "function"
              ? a_Value(state.smoothingWindow)
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

      setSampleFilter: (a_Value) =>
        set((state) => ({
          sampleFilter:
            typeof a_Value === "function"
              ? a_Value(state.sampleFilter)
              : a_Value,
        })),

      setYAxis: (a_Value) =>
        set((state) => ({
          yAxis: typeof a_Value === "function" ? a_Value(state.yAxis) : a_Value,
        })),

      setChangeDetection: (a_Value) =>
        set((state) => ({
          changeDetection:
            typeof a_Value === "function"
              ? a_Value(state.changeDetection)
              : a_Value,
        })),

      setChangePoints: (a_Value) =>
        set((state) => ({
          changePoints:
            typeof a_Value === "function"
              ? a_Value(state.changePoints)
              : a_Value,
        })),

      setToggleOptions: (a_Value) =>
        set((state) => ({
          toggleOptions:
            typeof a_Value === "function"
              ? a_Value(state.toggleOptions)
              : a_Value,
        })),

      setPolygons: (a_Value) =>
        set((state) => ({
          polygons:
            typeof a_Value === "function" ? a_Value(state.polygons) : a_Value,
        })),

      setSummaryItem: (a_Value) =>
        set((state) => ({
          summaryItem:
            typeof a_Value === "function"
              ? a_Value(state.summaryItem)
              : a_Value,
        })),

      setLatency: (a_Value) =>
        set((state) => ({
          latency:
            typeof a_Value === "function" ? a_Value(state.latency) : a_Value,
        })),

      setNearestPoint: (a_Value) =>
        set((state) => ({
          nearestPoint:
            typeof a_Value === "function"
              ? a_Value(state.nearestPoint)
              : a_Value,
        })),

      setAnnotations: (a_Value) =>
        set((state) => ({
          annotations:
            typeof a_Value === "function"
              ? a_Value(state.annotations)
              : a_Value,
        })),

      setChartIndex: (a_Value) =>
        set((state) => ({
          chartIndex:
            typeof a_Value === "function" ? a_Value(state.chartIndex) : a_Value,
        })),
    }),
  ),
);
