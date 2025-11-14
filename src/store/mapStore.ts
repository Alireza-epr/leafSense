import { create } from "zustand";
import { combine } from "zustand/middleware";

export interface IMapStoreStates {
    enableMarker: boolean
    enableROI: boolean
    roi: any | null;
    startDate: string;
    endDate: string;
}

export interface IMapStoreActions {
    setEnableROI: (a_Value: boolean) => void
    setEnableMarker: (a_Value: boolean) => void
    setROI: (a_ROI: any) => void;
    setStartDate: (a_Start: string) => void;
    setEndDate: (a_End: string) => void;
}

export const useMapStore = create<IMapStoreStates & IMapStoreActions>( 
    combine(
        {
            //States
            enableMarker: false,
            enableROI: false,
            roi: null,
            startDate: '',
            endDate: '',
        },
        (set) => ({
            //Actions
            setEnableROI: (a_Value: boolean) => set( () => ({ enableROI : a_Value })), 
            setEnableMarker: (a_Value: boolean) => set( () => ({ enableMarker : a_Value })), 
            setROI: (a_ROI: any) => set( () => ({ roi : a_ROI })), 
            setStartDate: (a_Start: string) => set( () => ({ startDate : a_Start })), 
            setEndDate: (a_End: string) => set( () => ({ endDate : a_End })), 
        })
    )
)