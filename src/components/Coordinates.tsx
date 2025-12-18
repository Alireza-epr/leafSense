import React, { useEffect, useState } from "react";
import coordinatesStyles from "./Coordinates.module.scss";
import Coordinate from "./Coordinate";
import CButton from "./CButton";
import BrowseButton from "./BrowseButton";
import { LngLat, now } from "maplibre-gl";
import { ECoordinate } from "../types/coordinateTypes";
import { EMarkerType, IMarker, useMapStore } from "../store/mapStore";
import maplibregl from "maplibre-gl";
import { validateImportedROI } from "../utils/calculationUtils";
import { getLocaleISOString } from "../utils/dateUtils";

export interface ICoordinate {
  id: number | string;
  lngLat: [number, number];
}

export interface IImportedROI {
  coordinates: [number, number][];
}

export interface ICoordinatesProps {
  disable: boolean;
}

const Coordinates = (props: ICoordinatesProps) => {
  const markers = useMapStore((state) => state.markers);
  const setMarkers = useMapStore((state) => state.setMarkers);

  const handleDrawROI = (a_Coordinates: ICoordinate[]) => {
    const markersWithoutMap: IMarker[] = a_Coordinates.map((c) => {
      const markerWithThisCoordinate =
        markers.find((m) => m.marker.getLngLat().lng === c.lngLat[0]) &&
        markers.find((m) => m.marker.getLngLat().lat === c.lngLat[1]);

      const markerElement = new maplibregl.Marker().setLngLat(c.lngLat);

      const markerWithoutMap = {
        type: EMarkerType.polygon,
        marker: markerElement,
      };

      return markerWithThisCoordinate
        ? markerWithThisCoordinate
        : markerWithoutMap;
    });

    setMarkers((prev) => {
      const existingPointMarkers = prev.filter(
        (m) => m.type === EMarkerType.point,
      );
      prev.forEach((m) => {
        m.marker.remove();
      });
      return [...existingPointMarkers, ...markersWithoutMap];
    });
  };

  const handleSelectFile = (a_JSON: Record<string, any>) => {
    const isImportedROIValid = validateImportedROI(a_JSON);

    if (!isImportedROIValid.valid) {
      console.error("Failed importing ROI: " + isImportedROIValid.message);
      return;
    }

    const importedCoordinates: ICoordinate[] = (
      a_JSON as IImportedROI
    ).coordinates.map((coordinate, index) => {
      return {
        id: `imported_${index + 1}`,
        lngLat: coordinate,
      };
    });

    handleDrawROI(importedCoordinates);
  };

  const handleDownloadCoordinates = () => {
    const exportedROI = {
      coordinates: markers.map((m) => [
        m.marker.getLngLat().lng,
        m.marker.getLngLat().lat,
      ]),
    };

    const link = document.createElement("a");
    link.download = `exportedROI_${getLocaleISOString(new Date(Date.now()))}.json`;

    const blob = new Blob([JSON.stringify(exportedROI, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    link.href = url;

    link.click();

    URL.revokeObjectURL(url);
  };
  return (
    <div className={` ${coordinatesStyles.wrapper}`}>
      <BrowseButton
        title="Import ROI"
        onFileSelect={handleSelectFile}
        help={[
          "Minimum 4 coordinates, e.g.:",
          "{",
          "  coordinates: [",
          "    [lng1, lat1],",
          "    [lng2, lat2],",
          "    [lng3, lat3],",
          "    [lng4, lat4]",
          "  ]",
          "}",
        ]}
        disabled={props.disable}
      />
      <CButton
        onButtonClick={handleDownloadCoordinates}
        disable={markers.length == 0 || props.disable}
        title="Export ROI"
      />
      {markers.map((m, index) => (
        <Coordinate
          lngLat={[m.marker.getLngLat().lng, m.marker.getLngLat().lat]}
          key={index}
          id={index + 1}
        />
      ))}
    </div>
  );
};

export default Coordinates;
