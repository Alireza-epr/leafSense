import sidebarStyles from "./Sidebar.module.scss";
import CButton from "../components/CButton";
import Section from "./Section";
import { EMarkerType, TMarker, useMapStore } from "../store/mapStore";
import { useEffect, useState } from "react";
import DateInput from "./DateInput";
import RangeInput from "./RangeInput";
import Coordinates from "./Coordinates";

const Sidebar = () => {
  const marker = useMapStore((state) => state.marker);
  const setMarker = useMapStore((state) => state.setMarker);

  const markers = useMapStore((state) => state.markers);
  const setMarkers = useMapStore((state) => state.setMarkers);

  const showChart = useMapStore((state) => state.showChart);
  const setShowChart = useMapStore((state) => state.setShowChart);

  const fetchFeatures = useMapStore((state) => state.fetchFeatures);
  const setFetchFeatures = useMapStore((state) => state.setFetchFeatures);

  const startDate = useMapStore((state) => state.startDate);
  const setStartDate = useMapStore((state) => state.setStartDate);

  const endDate = useMapStore((state) => state.endDate);
  const setEndDate = useMapStore((state) => state.setEndDate);

  const cloudCover = useMapStore((state) => state.cloudCover);
  const setCloudCover = useMapStore((state) => state.setCloudCover);

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
      if (prev.polygon) {
        return {
          ...prev,
          polygon: false,
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
      prev.forEach((m) => {
        if (m.type === EMarkerType.point) {
          m.marker.remove();
        }
      });
      return prev.filter((m) => m.type !== EMarkerType.point);
    });
  };

  const handleClearPolygon = () => {
    setMarkers((prev) => {
      const toRemove = prev.filter((m) => m.type === EMarkerType.polygon);
      toRemove.forEach((m) => m.marker.remove());

      return prev.filter((m) => m.type !== EMarkerType.polygon);
    });
  };

  const handleSetFetchFeatures = () => {
    setFetchFeatures(!fetchFeatures);
  };

  const handleStartDateChange = (a_Date: string) => {
    setStartDate(a_Date);
  };

  const handleEndDateChange = (a_Date: string) => {
    setEndDate(a_Date);
  };

  const handleRangeChange = (a_Range: string) => {
    setCloudCover(a_Range);
  };
  return (
    <div className={` ${sidebarStyles.wrapper}`}>
      <div className={` ${sidebarStyles.buttonsWrapper}`}>
        <Section title="Drawing" disabled={fetchFeatures}>
          <div className={` ${sidebarStyles.buttonRowWrapper}`}>
            <CButton
              title={!marker.point ? "Enable Marker" : "Disable Marker"}
              onButtonClick={handlePointClick}
            />
            <CButton
              title={"Clear Markers"}
              onButtonClick={handleClearPoint}
              disable={
                markers.filter((m) => m.type == EMarkerType.point).length == 0
              }
            />
          </div>
          <div className={` ${sidebarStyles.buttonRowWrapper}`}>
            <CButton
              title={!marker.polygon ? "Enable ROI" : "Disable ROI"}
              onButtonClick={handlePolygonClick}
            />
            <CButton
              title={"Clear ROI"}
              onButtonClick={handleClearPolygon}
              disable={
                markers.filter((m) => m.type == EMarkerType.polygon).length < 4
              }
            />
          </div>
        </Section>

        <Section title="Start Date" disabled={fetchFeatures}>
          <DateInput value={startDate} onDateChange={handleStartDateChange} />
        </Section>

        <Section title="End Date" disabled={fetchFeatures}>
          <DateInput value={endDate} onDateChange={handleEndDateChange} />
        </Section>

        <Section
          title={`Cloud Cover - ${cloudCover}%`}
          disabled={fetchFeatures}
        >
          <RangeInput value={cloudCover} onRangeChange={handleRangeChange} />
        </Section>

        <Section title="Chart">
          <CButton
            title={!fetchFeatures ? "Show Chart" : "Hide Chart"}
            onButtonClick={handleSetFetchFeatures}
            disable={
              markers.filter((m) => m.type == EMarkerType.polygon).length < 4
            }
          />
        </Section>

        <Section title="ROI Coordinates" disabled={fetchFeatures}>
          <Coordinates />
        </Section>
      </div>
    </div>
  );
};

export default Sidebar;
