import sidebarStyles from "./Sidebar.module.scss";
import CButton from "../components/CButton";
import Section from "./Section";
import { EMarkerType, ERequestContext, IPolygon, TMarker } from "../types";
import { useMapStore } from "../store/mapStore";
import { useEffect, useState } from "react";
import DateInput from "./DateInput";
import RangeInput from "./RangeInput";
import Coordinates from "./Coordinates";
import CSelect from "./CSelect";
import {
  spatialItems,
  temporalItems,
  TSpatialComparison,
} from "../types/apiTypes";
import { ESampleFilter } from "../types/generalTypes";

const Sidebar = () => {
  const map = useMapStore((state) => state.map);
  const marker = useMapStore((state) => state.marker);
  const setMarker = useMapStore((state) => state.setMarker);

  const markers = useMapStore((state) => state.markers);
  const setMarkers = useMapStore((state) => state.setMarkers);

  const coverageThreshold = useMapStore((state) => state.coverageThreshold);
  const setCoverageThreshold = useMapStore(
    (state) => state.setCoverageThreshold,
  );

  const fetchFeatures = useMapStore((state) => state.fetchFeatures);
  const setFetchFeatures = useMapStore((state) => state.setFetchFeatures);

  const startDate = useMapStore((state) => state.startDate);
  const setStartDate = useMapStore((state) => state.setStartDate);

  const endDate = useMapStore((state) => state.endDate);
  const setEndDate = useMapStore((state) => state.setEndDate);

  const cloudCover = useMapStore((state) => state.cloudCover);
  const setCloudCover = useMapStore((state) => state.setCloudCover);

  const snowCover = useMapStore((state) => state.snowCover);
  const setSnowCover = useMapStore((state) => state.setSnowCover);

  const limit = useMapStore((state) => state.limit);
  const setLimit = useMapStore((state) => state.setLimit);

  const radius = useMapStore((state) => state.radius);
  const setRadius = useMapStore((state) => state.setRadius);

  const temporalOp = useMapStore((state) => state.temporalOp);
  const setTemporalOp = useMapStore((state) => state.setTemporalOp);

  const spatialOp = useMapStore((state) => state.spatialOp);
  const setSpatialOp = useMapStore((state) => state.setSpatialOp);

  const sampleFilter = useMapStore((state) => state.sampleFilter);
  const setSampleFilter = useMapStore((state) => state.setSampleFilter);

  const polygons = useMapStore((state) => state.polygons);
  const setPolygons = useMapStore((state) => state.setPolygons);

  const handlePointClick = () => {
    setMarker((prev) => {
      if (prev.point) {
        return {
          ...prev,
          point: false,
        };
      } else {
        const markerKeys = Object.keys(prev);
        let newMarker = {} as any;
        for (const key of markerKeys) {
          newMarker[key] = key == EMarkerType.point;
        }
        return newMarker;
      }
    });
  };

  const handlePolygonClick = () => {
    setMarker((prev) => {
      if (prev.zonal) {
        return {
          ...prev,
          zonal: false,
        };
      } else {
        const markerKeys = Object.keys(prev);
        let newMarker = {} as any;
        for (const key of markerKeys) {
          newMarker[key] = key == EMarkerType.polygon;
        }
        return newMarker;
      }
    });
  };

  const handleClearPoint = () => {
    setMarkers((prev) => {
      const toRemove = prev.filter((m) => m.type === EMarkerType.point);
      toRemove.forEach((m) => m.marker.remove());

      return prev.filter((m) => m.type !== EMarkerType.point);
    });
  };

  const handleClearZonal = (a_Polygons: IPolygon[]) => {
    const lastPolygonLayer = a_Polygons.at(-1);
    if (!map || !lastPolygonLayer) return;

    lastPolygonLayer.markers.forEach((m) => {
      m.marker.remove();
    });

    const polygonId = "polygon_" + lastPolygonLayer.id;

    const polygonLayer = map.getLayer(polygonId);
    if (polygonLayer) {
      map.removeLayer(`${polygonId}_label`);
      map.removeLayer(polygonId);
      map.removeSource(polygonId);
    }

    setPolygons((prev) => prev.filter((p) => p.id !== lastPolygonLayer.id));
  };

  const handleSetPolygonFetchFeatures = (a_Polygons: IPolygon[]) => {
    const lastPolygon = a_Polygons.at(-1);
    if (!lastPolygon) return;
    setFetchFeatures({
      main: {
        type: EMarkerType.polygon,
        id: lastPolygon.id,
      },
      comparison: null,
    });
  };

  const handleSetPointFetchFeatures = (a_Polygons: IPolygon[]) => {
    const lastPolygon = a_Polygons.at(-1);
    setFetchFeatures({
      main: {
        type: EMarkerType.point,
        id: lastPolygon ? lastPolygon.id + 1 : 1,
      },
      comparison: null,
    });
  };

  const handleStartDateChange = (a_Date: string) => {
    setStartDate(a_Date);
  };

  const handleEndDateChange = (a_Date: string) => {
    setEndDate(a_Date);
  };

  const handleCloudCoverChange = (a_Range: string) => {
    setCloudCover(a_Range);
  };

  const handleCoverageThresholdChange = (a_Range: string) => {
    setCoverageThreshold(a_Range);
  };

  const handleSnowCoverChange = (a_Range: string) => {
    setSnowCover(a_Range);
  };

  const handleLimitChange = (a_Range: string) => {
    setLimit(a_Range);
  };

  const handleRadiusChange = (a_Range: string) => {
    setRadius(a_Range);
  };

  const handleSpatialClick = (a_Selected: string) => {
    setSpatialOp(spatialItems.find((i) => i.title == a_Selected)!.value);
  };

  const handleTemporalClick = (a_Selected: string) => {
    setTemporalOp(temporalItems.find((i) => i.title == a_Selected)!.value);
  };

  const handleSampleFilter = (a_Type: ESampleFilter) => {
    setSampleFilter(a_Type);
  };

  const [isSidebarDisabled, setIsSidebarDisabled] = useState(false);

  useEffect(() => {
    const fetchAnyFeature =
      fetchFeatures.comparison !== null || fetchFeatures.main !== null;
    if (fetchAnyFeature) {
      setIsSidebarDisabled(true);
    } else {
      setIsSidebarDisabled(false);
    }
  }, [fetchFeatures]);

  return (
    <div className={` ${sidebarStyles.wrapper}`}>
      <div className={` ${sidebarStyles.buttonsWrapper}`}>
        <Section title="Drawing" disabled={isSidebarDisabled}>
          <div className={` ${sidebarStyles.buttonRowWrapper}`}>
            <CButton
              title={"Zonal"}
              active={marker.zonal}
              onButtonClick={handlePolygonClick}
              disable={isSidebarDisabled}
              icon="polygon"
            />
            <CButton
              title={
                polygons.length > 0
                  ? "Remove Zonal Nr." + polygons.at(-1)?.id
                  : "Remove Zonal"
              }
              onButtonClick={() => handleClearZonal(polygons)}
              disable={polygons.length == 0 || isSidebarDisabled}
            />
            <CButton
              title={
                polygons.length > 0
                  ? "Chart of Zonal Nr." + polygons.at(-1)?.id
                  : "Chart of Zonal"
              }
              onButtonClick={() => handleSetPolygonFetchFeatures(polygons)}
              disable={polygons.length == 0 || isSidebarDisabled}
            />
          </div>

          <div className={` ${sidebarStyles.buttonRowWrapper}`}>
            <CButton
              title={"Point"}
              active={marker.point}
              onButtonClick={handlePointClick}
              disable={isSidebarDisabled}
              icon="point"
            />
            <CButton
              title={"Remove Point"}
              onButtonClick={handleClearPoint}
              disable={
                markers.filter((m) => m.type == EMarkerType.point).length ==
                  0 || isSidebarDisabled
              }
            />
            <CButton
              title={"Chart of Point"}
              onButtonClick={() => handleSetPointFetchFeatures(polygons)}
              disable={
                markers.filter((m) => m.type == EMarkerType.point).length ===
                  0 || isSidebarDisabled
              }
            />
          </div>
          {`Radius - ${radius} meter(s)`}
          <RangeInput
            min={10}
            value={radius}
            onRangeChange={handleRadiusChange}
          />
        </Section>

        <Section title="STAC" disabled={isSidebarDisabled}>
          <Section title="Start Date" disabled={isSidebarDisabled}>
            <DateInput
              value={startDate}
              onDateChange={handleStartDateChange}
              disabled={isSidebarDisabled}
            />
          </Section>

          <Section title="End Date" disabled={isSidebarDisabled}>
            <DateInput
              value={endDate}
              onDateChange={handleEndDateChange}
              disabled={isSidebarDisabled}
            />
          </Section>

          <Section title="Operation" disabled={isSidebarDisabled}>
            <CSelect
              name="Temporal"
              disabled={isSidebarDisabled}
              options={temporalItems.map((i) => i.title)}
              onSelectClick={handleTemporalClick}
              value={temporalItems.find((i) => i.value == temporalOp)!.title}
            />

            <CSelect
              name="Spatial"
              disabled={isSidebarDisabled}
              options={spatialItems.map((i) => i.title)}
              onSelectClick={handleSpatialClick}
              value={spatialItems.find((i) => i.value == spatialOp)!.title}
            />
          </Section>

          <Section
            title={`Max Cloud Cover - ${cloudCover}%`}
            disabled={isSidebarDisabled}
          >
            <RangeInput
              value={cloudCover}
              onRangeChange={handleCloudCoverChange}
            />
          </Section>

          <Section
            title={`Max Snow Cover - ${snowCover}%`}
            disabled={isSidebarDisabled}
          >
            <RangeInput
              value={snowCover}
              onRangeChange={handleSnowCoverChange}
            />
          </Section>

          <Section title={`Page Limit - ${limit}`} disabled={isSidebarDisabled}>
            <RangeInput
              value={limit}
              onRangeChange={handleLimitChange}
              max={100}
              min={1}
            />
          </Section>
        </Section>

        <Section title="NDVI" disabled={isSidebarDisabled}>
          <Section
            title={`Min Coverage Threshold  - ${coverageThreshold}%`}
            disabled={isSidebarDisabled}
          >
            <RangeInput
              value={coverageThreshold}
              onRangeChange={handleCoverageThresholdChange}
            />
          </Section>
          <Section title="Filter" disabled={isSidebarDisabled}>
            <div className={` ${sidebarStyles.buttonRowWrapper}`}>
              <CButton
                title={"No filter"}
                onButtonClick={() => handleSampleFilter(ESampleFilter.none)}
                active={sampleFilter == ESampleFilter.none}
                disable={isSidebarDisabled}
              />
              <CButton
                title={"Z-Score"}
                onButtonClick={() => handleSampleFilter(ESampleFilter.zScore)}
                active={sampleFilter == ESampleFilter.zScore}
                disable={isSidebarDisabled}
              />
              <CButton
                title={"IQR"}
                onButtonClick={() => handleSampleFilter(ESampleFilter.IQR)}
                active={sampleFilter == ESampleFilter.IQR}
                disable={isSidebarDisabled}
              />
            </div>
          </Section>
        </Section>

        <Section title="ROI" disabled={isSidebarDisabled}>
          <Coordinates disable={isSidebarDisabled} />
        </Section>
      </div>
    </div>
  );
};

export default Sidebar;
