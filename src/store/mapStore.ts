import { getLocaleISOString } from "../utils/dateUtils";
import { Marker, Subscription } from "maplibre-gl";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export enum EMarkerType {
  point= "point",
  polygon= "polygon"
}
export interface IMarker {
  type: EMarkerType,
  marker: Marker
}

export type TMarker = Record<EMarkerType, boolean>

export interface IMapStoreStates {
  marker: TMarker;
  markers: IMarker[]
  startDate: string;
  endDate: string;
  cloudCover: string
  showChart: boolean
}

export interface IMapStoreActions {
  // Accept either direct value or functional update
  setMarker: (a_Marker: TMarker | ((prev: TMarker) => TMarker)) => void;
  setMarkers: (a_Markers: IMarker[] | ((prev: IMarker[]) => IMarker[])) => void;
  setStartDate: (a_Start: string | ((prev: string) => string)) => void;
  setEndDate: (a_End: string | ((prev: string) => string)) => void;
  setCloudCover: (a_CloudCover: string | ((a_Prev: string) => string)) => void
  setShowChart: (a_Value: boolean | ((prev: boolean) => boolean)) => void;
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
      startDate: getLocaleISOString(new Date()), // 2025-10-31T14:43:33
      endDate: getLocaleISOString(new Date()), // 2025-10-31T14:43:33
      cloudCover: "10",
      showChart: false,
    },
    (set) => ({
      // Actions
      setMarker: (a_Marker: TMarker | ((a_Prev: TMarker) => TMarker)) =>
        set((state) => ({
          marker: typeof a_Marker === "function" ? a_Marker(state.marker) : a_Marker,
        })),

      setMarkers: (a_Markers: IMarker[] | ((a_Prev: IMarker[]) => IMarker[])) =>
        set((state) => ({
          markers: typeof a_Markers === "function" ? a_Markers(state.markers) : a_Markers,
        })),

      setStartDate: (a_Start: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          startDate: typeof a_Start === "function" ? a_Start(state.startDate) : a_Start,
        })),

      setEndDate: (a_End: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          endDate: typeof a_End === "function" ? a_End(state.endDate) : a_End,
        })),
      
      setCloudCover: (a_CloudCover: string | ((a_Prev: string) => string)) =>
        set((state) => ({
          cloudCover: typeof a_CloudCover === "function" ? a_CloudCover(state.cloudCover) : a_CloudCover,
        })),

      setShowChart: (a_Value: boolean | ((prev: boolean) => boolean)) =>
        set((state) => ({
          showChart: typeof a_Value === "function" ? a_Value(state.showChart) : a_Value,
        })),

    })
  )
);
