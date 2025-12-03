import sidebarStyles from "./Sidebar.module.scss";
import CButton from "../components/CButton";
import Section from "./Section";
import { EMarkerType, TMarker, useMapStore } from "../store/mapStore";
import { useEffect, useState } from "react";
import DateInput from "./DateInput";
import RangeInput from "./RangeInput";
import Coordinates from "./Coordinates";
import CSelect from "./CSelect";
import { spatialItems, temporalItems, TSpatialComparison } from "@/types/apiTypes";

const Sidebar = () => {
  const marker = useMapStore((state) => state.marker);
  const setMarker = useMapStore((state) => state.setMarker);

  const markers = useMapStore((state) => state.markers);
  const setMarkers = useMapStore((state) => state.setMarkers);

  const showROI = useMapStore((state) => state.showROI);
  const setShowChart = useMapStore((state) => state.setShowChart);

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

  const setTemporalOp = useMapStore((state) => state.setTemporalOp);
  const setSpatialOp = useMapStore((state) => state.setSpatialOp);


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
        m.marker.remove();
      });
      return [];
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

  const handleCloudCoverChange = (a_Range: string) => {
    setCloudCover(a_Range);
  };

  const handleSnowCoverChange = (a_Range: string) => {
    setSnowCover(a_Range);
  };

  const handleLimitChange = (a_Range: string) => {
    setLimit(a_Range);
  };

  const handleSpatialClick = (a_Selected: string) => {
    setSpatialOp(spatialItems.find( i => i.title == a_Selected )!.value)
  }

  const handleTemporalClick = (a_Selected: string) => {
    setTemporalOp(temporalItems.find( i => i.title == a_Selected )!.value)
  }

  
  return (
    <div className={` ${sidebarStyles.wrapper}`}>
      <div className={` ${sidebarStyles.buttonsWrapper}`}>
        <Section title="Drawing" disabled={fetchFeatures}>
          <div className={` ${sidebarStyles.buttonRowWrapper}`}>
            <CButton
              title={"Marker"}
              active={marker.polygon}
              onButtonClick={handlePolygonClick}
              icon="marker-add"
            />
            <CButton
              title={"Clear Markers"}
              onButtonClick={handleClearPoint}
              disable={
                markers.length == 0
              }
              icon="marker-clear"
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
          title={`Max Cloud Cover - ${cloudCover}%`}
          disabled={fetchFeatures}
        >
          <RangeInput value={cloudCover} onRangeChange={handleCloudCoverChange} />
        </Section>

        <Section
          title={`Max Snow Cover - ${snowCover}%`}
          disabled={fetchFeatures}
        >
          <RangeInput value={snowCover} onRangeChange={handleSnowCoverChange} />
        </Section>

        <Section
          title={`Page Limit - ${limit}`}
          disabled={fetchFeatures}
        >
          <RangeInput value={limit} onRangeChange={handleLimitChange} max={50}/>
        </Section>

        <Section 
          title="Chart"
        >
          <CSelect 
            name="Temporal"
            disabled={fetchFeatures}
            options={temporalItems.map( i => i.title )}
            onSelectClick={handleTemporalClick}
          />

          <CSelect 
            name="Spatial"
            disabled={fetchFeatures}
            options={spatialItems.map( i => i.title )}
            onSelectClick={handleSpatialClick}
          />

          <CButton
            title={!fetchFeatures ? "Show Chart" : "Hide Chart"}
            onButtonClick={handleSetFetchFeatures}
            disable={
              markers.filter((m) => m.type == EMarkerType.polygon).length < 4
            }
          />
        </Section>

        <Section title="ROI" disabled={fetchFeatures}>
          <Coordinates />
        </Section>
      </div>
    </div>
  );
};

export default Sidebar;
