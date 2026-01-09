import React, { useEffect, useState } from "react";
import coordinatesStyles from "./Coordinates.module.scss";
import Coordinate from "./Coordinate";
import CButton from "./CButton";
import BrowseButton from "./BrowseButton";
import { LngLat, now } from "maplibre-gl";
import { ECoordinate } from "../types/coordinateTypes";
import { EMarkerType, IMarker, IPolygon } from "../types";
import { useMapStore } from "../store/mapStore";
import maplibregl from "maplibre-gl";
import { validateImportedROI } from "../utils/calculationUtils";
import { getLocaleISOString } from "../utils/dateUtils";
import { ELogLevel } from "../types/generalTypes";
import { log } from "../utils/generalUtils";

export interface ICoordinate {
  id: number | string;
  lngLat: [number, number];
}

export interface IImportedCoors {
  coordinates: number[][];
  radius?: number;
}

export type TImportedROI = Record<string, IImportedCoors>;

export interface ICoordinatesProps {
  disable: boolean;
}

const Coordinates = (props: ICoordinatesProps) => {
  const markers = useMapStore((state) => state.markers);
  const setMarkers = useMapStore((state) => state.setMarkers);
  const map = useMapStore((state) => state.map);

  const radius = useMapStore((state) => state.radius);
  const setRadius = useMapStore((state) => state.setRadius);

  const polygons = useMapStore((state) => state.polygons);
  const setPolygons = useMapStore((state) => state.setPolygons);

  const handleDrawROI = (a_ImportedROI: TImportedROI[]) => {
    if (!map) return;
    log("Imported ROI", a_ImportedROI);
    const importedPoint = a_ImportedROI.find((i) => i["point"]);
    if (importedPoint) {
      const markerElement = new maplibregl.Marker({ color: "green" })
        .setLngLat([
          importedPoint.point.coordinates[0][0],
          importedPoint.point.coordinates[0][1],
        ])
        .addTo(map);

      const newMarker = {
        type: EMarkerType.point,
        marker: markerElement,
      };

      if (importedPoint.point.radius) {
        setRadius((prev) =>
          prev === String(importedPoint.point.radius)
            ? String(+prev + 1)
            : String(importedPoint.point.radius),
        );
      } else {
        setRadius((prev) =>
          prev === "100" ? String(+prev - 1) : String(+prev + 1),
        );
      }

      setMarkers((prevMarkers) => {
        const prevPoint = prevMarkers.filter(
          (m) => m.type == EMarkerType.point,
        );
        prevPoint.forEach((p) => p.marker.remove());
        const prevPolygons = prevMarkers.filter(
          (m) => m.type !== EMarkerType.point,
        );
        return [...prevPolygons, newMarker];
      });
    }

    const importedPolygons: IPolygon[] = [];

    for (const polygon of polygons) {
      polygon.markers.forEach((m) => m.marker.remove());
    }

    for (const roi of a_ImportedROI) {
      const key = Object.keys(roi)[0];
      if (!key.startsWith("zonal")) continue;

      const markers: IMarker[] = roi[key].coordinates.map(([lng, lat]) => {
        const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);

        return {
          type: EMarkerType.polygon,
          marker,
        };
      });

      importedPolygons.push({
        id: Number(key.split("-")[1]),
        markers,
      });
    }

    setPolygons(importedPolygons);
  };

  const handleSelectFile = (a_JSON: TImportedROI[]) => {
    const isImportedROIValid = validateImportedROI(a_JSON);

    if (!isImportedROIValid.valid) {
      log(
        "Failed importing ROI: ",
        isImportedROIValid.message,
        ELogLevel.error,
      );
      return;
    }

    handleDrawROI(a_JSON);
  };

  const handleDownloadCoordinates = () => {
    let exportedROI: TImportedROI[] = [];

    if (polygons.length > 0) {
      const exportedPolygons = polygons.map((p) => {
        return {
          [`zonal-${p.id}`]: {
            coordinates: p.markers.map((m) => [
              m.marker.getLngLat().lng,
              m.marker.getLngLat().lat,
            ]),
          },
        };
      });
      exportedROI = exportedPolygons;
    }

    const pointROI = markers.find((m) => m.type === EMarkerType.point);
    if (pointROI) {
      const exportedPoint = {
        point: {
          coordinates: markers
            .filter((m) => m.type === EMarkerType.point)
            .map((m) => [m.marker.getLngLat().lng, m.marker.getLngLat().lat]),
          radius: Number(radius),
        },
      };
      exportedROI.push(exportedPoint);
    }

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

  const isExportDisabled = () => {
    return (
      markers.find((m) => m.type === EMarkerType.point) == undefined &&
      polygons.length == 0
    );
  };

  const help = [
    "Zones or points model, e.g.:",
    "[",
    "  {",
    "    'zonal-1': {",
    "      coordinates: [",
    "        [lng1, lat1],",
    "        [lng2, lat2],",
    "        [lng3, lat3]",
    "      ]",
    "    }",
    "  },",
    "  {",
    "    'zonal-2': {",
    "      coordinates: [",
    "        [lng1, lat1],",
    "        [lng2, lat2],",
    "        [lng3, lat3],",
    "        [lng4, lat4]",
    "      ]",
    "    }",
    "  },",
    "  {",
    "    'point': {",
    "      coordinates: [[lng, lat]],",
    "      radius: 40 // optional",
    "    }",
    "  }",
    "]",
    "Notes:",
    "- Each zone must have at least 3 coordinates.",
    "- A point must have a single coordinate; radius is optional.",
  ];

  return (
    <div className={` ${coordinatesStyles.wrapper}`}>
      <BrowseButton
        title="Import ROI"
        onFileSelect={handleSelectFile}
        help={help}
        disabled={props.disable}
      />
      <CButton
        onButtonClick={handleDownloadCoordinates}
        disable={isExportDisabled() || props.disable}
        title="Export ROI"
      />
    </div>
  );
};

export default Coordinates;
