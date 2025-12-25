import {
  EMarkerType,
  INDVISample,
  INDVISmoothed,
  useMapStore,
} from "../store/mapStore";
import chartStyles from "./Chart.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import ChartFooterItem from "./ChartFooterItem";
import ChartHeaderItem from "./ChartHeaderItem";
import ChartListRows from "./ChartListRows";
import ChartSummaryRows from "./ChartSummaryRows";
import { IChartSummaryRow } from "./ChartSummaryRow";
import { downloadCSV, toFirstLetterUppercase } from "../utils/generalUtils";
import { detectChangePointsZScore, getSmoothNDVISamples } from "../utils/calculationUtils";
import { EAggregationMethod, IChartHeaderItemOption } from "../types/generalTypes";
import ChartHeaderItemOptions from "./ChartHeaderItemOptions";

export interface IChartProps {
  children: React.ReactNode;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  items?: number;
  latency?: number;
}

const Chart = (props: IChartProps) => {
  const samples = useMapStore((state) => state.samples);
  const setSamples = useMapStore((state) => state.setSamples);
  const markers = useMapStore((state) => state.markers);
  const fetchFeatures = useMapStore((state) => state.fetchFeatures);
  const globalLoading = useMapStore((state) => state.globalLoading);
  const setFetchFeatures = useMapStore((state) => state.setFetchFeatures);

  const smoothingWindow = useMapStore((state) => state.smoothingWindow);
  const setSmoothingWindow = useMapStore((state) => state.setSmoothingWindow);

  const changeDetection = useMapStore((state) => state.changeDetection);
  const setChangeDetection = useMapStore((state) => state.setChangeDetection);

  
  const changePoints = useMapStore((state) => state.changePoints);
  const setChangePoints = useMapStore((state) => state.setChangePoints);

  const yAxis = useMapStore((state) => state.yAxis);
  const setYAxis = useMapStore((state) => state.setYAxis);

  const polygons = useMapStore((state) => state.polygons);

  const nextPage = useMapStore((state) => state.nextPage);
  const previousPage = useMapStore((state) => state.previousPage);
  const notValidSamples = useMapStore((state) => state.notValidSamples);
  const [maxNDVI, setMaxNDVI] = useState<number>(0);
  const [meanNDVI, setMeanNDVI] = useState<number>(0);
  const [minNDVI, setMinNDVI] = useState<number>(0);

  const [showList, setShowList] = useState(false);
  const [showToggleChart, setShowToggleChart] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSmoothingOptions, showShowSmoothingOptions] = useState(false);
  const [showDetectionOptions, showShowDetectionOptions] = useState(false);
  const [summaryItems, setSummaryItems] = useState<IChartSummaryRow[]>([
    { id: 1, title: "Total / Used Scenes", value: "-" },
    { id: 2, title: "Average Valid Pixels", value: "-" },
    { id: 3, title: "First Date", value: "-" },
    { id: 4, title: "Last Date", value: "-" },
    { id: 5, title: "Latency", value: "-" },
  ]);
  const [enableHeaderOption, setEnableHeaderOption] = useState(false);
  //const [smoothed, setSmoothed] = useState(false);


  useEffect(() => {
    if (samples.length !== 0) {
      let max = -Infinity;
      let min = Infinity;
      let sum = 0;
      let count = 0;
      for (const s of samples) {
        if (s.meanNDVI) {
          if (s.meanNDVI > max) {
            max = s.meanNDVI;
          }
          if (s.meanNDVI < min) {
            min = s.meanNDVI;
          }
          sum += s.meanNDVI;
          ++count;
        }
      }
      setMaxNDVI(max);
      setMinNDVI(min);
      setMeanNDVI(count > 0 ? sum / count : 0);

    } else {
      setMaxNDVI(0);
      setMeanNDVI(0);
      setMinNDVI(0);
    }
  }, [samples]);

  useEffect(() => {
    const hasPolygon =
      markers.filter((m) => m.type === EMarkerType.polygon).length === 4;
    const hasPoint =
      markers.filter((m) => m.type === EMarkerType.point).length === 1;
    if (hasPolygon && hasPoint) {
      setShowToggleChart(true);
    } else {
      setShowToggleChart(false);
    }
  }, []);

  useEffect(() => {
    if (!globalLoading && samples.length > 0) {
      setEnableHeaderOption(true);
    } else {
      setEnableHeaderOption(false);
    }
  }, [globalLoading]);

  useEffect(()=>{
    setSamples(prev=>getSmoothNDVISamples(prev, Number(smoothingWindow[0].value)))
  },[smoothingWindow])

  useEffect(()=>{
    const points = detectChangePointsZScore(
      samples,
      +changeDetection.find( o => o.id == 1 )!.value,
      +changeDetection.find( o => o.id == 2 )!.value,
      +changeDetection.find( o => o.id == 3 )!.value,
    )
    setChangePoints(points)
  },[changeDetection])

  const getValidity = () => {
    return props.items ? `${samples.length}/${props.items}` : "-";
  };

  const handleListItems = () => {
    setShowSummary(false);
    setShowList(!showList);
  };

  const handleToggleChart = () => {
    const nextFetchFeatures =
      fetchFeatures === EMarkerType.polygon
        ? EMarkerType.point
        : EMarkerType.polygon;
    setFetchFeatures(nextFetchFeatures);
  };

  const getLatency = () =>
    props.latency ? `${(props.latency / 1000).toFixed(2)} s` : "-";

  const handleToggleSummary = useCallback(
    (a_AllSamples: INDVISample[]) => {
      setShowList(false);
      setShowSummary(!showSummary);

      // Total / Used Scenes
      const validsLen = a_AllSamples.filter((s) => s.meanNDVI).length;
      const totalUsed = `${validsLen} / ${a_AllSamples.length}`;

      // Average Valid Pixels
      const sumValidPixels = a_AllSamples
        .filter((s) => s.meanNDVI)
        .map((s) => s.valid_fraction)
        .reduce((a, b) => a + b, 0);
      const averageValidPixels = validsLen !== 0 ? (sumValidPixels / validsLen).toFixed(2) : "-" ;

      // First / Last Date
      const sortedValids = a_AllSamples
        .filter((s) => s.meanNDVI)
        .sort((a, b) => a.id - b.id);

      const firstDate = validsLen !== 0 ? sortedValids[0].datetime : "-" ;
      const lastDate = validsLen !== 0 ? sortedValids[validsLen - 1].datetime : "-" ;

      setSummaryItems([
        { id: 1, title: "Used / Total Scenes", value: totalUsed },
        { id: 2, title: "Average Valid Pixels", value: averageValidPixels },
        { id: 3, title: "First Date", value: firstDate },
        { id: 4, title: "Last Date", value: lastDate },
        { id: 5, title: "Latency", value: getLatency() },
      ]);
    }
  ,[showSummary, props.latency]);

  const handleToggleSmoothingOptions = () => {
    showShowDetectionOptions(false)
    showShowSmoothingOptions(!showSmoothingOptions)
  }

  const handleToggleDetectionOptions = () => {
    showShowSmoothingOptions(false)
    showShowDetectionOptions(!showDetectionOptions)
  }

  const handleSmoothingWindow = (a_Window: IChartHeaderItemOption) => {
    setSmoothingWindow([a_Window])
  }

  const handleChangeDetection = (a_Option: IChartHeaderItemOption) => {
    setChangeDetection(prev =>
      prev.map(o => (o.id === a_Option.id ? a_Option : o))
    )
  }

  const handleExportCSV = useCallback(
    (a_Samples: INDVISample[]) => {
      const validSamples = a_Samples.filter((s) => s.meanNDVI);
      const thiNotValidSamples = a_Samples.filter((s) => !s.meanNDVI);
      const allSamples = [...validSamples, ...thiNotValidSamples].sort(
        (a, b) => a.id - b.id,
      );

      downloadCSV(allSamples, changePoints);
    }
  ,[changePoints]);
  const handleToggleYAxis = () => {
    setYAxis(prev => {
      if(prev == EAggregationMethod.Mean){
        return EAggregationMethod.Median
      } else {
        return EAggregationMethod.Mean
      }
    })
  }

  const handlePrevious = () => {
    if(!globalLoading && props.onPrevious){
      props.onPrevious()
    }
  }

  const handleNext = () => {
    if(!globalLoading && props.onNext){
      props.onNext()
    }
  }


  return (
    <div className={` ${chartStyles.wrapper}`}>
      <div className={` ${chartStyles.buttonsWrapper}`}>
        <div className={` ${chartStyles.title}`}>
          {`Chart of ${fetchFeatures == EMarkerType.point ? toFirstLetterUppercase(fetchFeatures) : "Zonal Nr."+polygons.at(-1)?.id}`}
        </div>
        <ChartHeaderItem
          title="Series Summary"
          alt="Series Summary"
          onClick={() => handleToggleSummary([...samples, ...notValidSamples])}
          icon="info"
          disabled={!enableHeaderOption}
          active={showSummary}
        />
        <ChartHeaderItem
          title="Export CSV"
          alt="Export CSV"
          onClick={() => handleExportCSV([...samples, ...notValidSamples])}
          icon="export-csv"
          disabled={!enableHeaderOption}
        />
        <ChartHeaderItem
          title={"Change Detection"}
          alt="Change Detection"
          onClick={handleToggleDetectionOptions}
          icon="detection"
          disabled={!enableHeaderOption}
          active={showDetectionOptions}
        >
          { showDetectionOptions
            ? <ChartHeaderItemOptions 
                options={changeDetection} 
                onOption={handleChangeDetection} 
              />
            : <></>
          }
        </ ChartHeaderItem>
        <ChartHeaderItem
          title={"Switch Y Axis"}
          alt="Aggregation"
          onClick={handleToggleYAxis}
          icon="y-axis"
          disabled={!enableHeaderOption}
        />
        <ChartHeaderItem
          title="Smooth Chart"
          alt="Smooth Chart"
          onClick={handleToggleSmoothingOptions}
          icon="smoothing"
          disabled={!enableHeaderOption}
          active={showSmoothingOptions}
        >
          { showSmoothingOptions
            ? <ChartHeaderItemOptions 
                options={smoothingWindow} 
                onOption={handleSmoothingWindow} 
              />
            : <></>
          }
        </ChartHeaderItem>
        <ChartHeaderItem
          title="Toggle Chart"
          alt="Toggle Chart"
          onClick={handleToggleChart}
          icon="toggle"
          disabled={!showToggleChart}
        />
        <ChartHeaderItem
          title="List"
          alt="List"
          onClick={handleListItems}
          icon="list"
          active={showList}
        />
        <ChartHeaderItem
          title="Close Chart"
          alt="Close"
          onClick={props.onClose}
          isClose={true}
        >
          X
        </ChartHeaderItem>
      </div>
      {showList ? (
        <div className={` ${chartStyles.listWrapper}`}>
          <ChartListRows items={[...samples, ...notValidSamples]} />
        </div>
      ) : (
        <></>
      )}
      {showSummary ? (
        <div className={` ${chartStyles.listWrapper}`}>
          <ChartSummaryRows items={summaryItems} />
        </div>
      ) : (
        <></>
      )}
      <div className={` ${chartStyles.children}`}>
        {previousPage && props.onPrevious && (
          <div
            className={`${chartStyles.arrow} ${chartStyles.previous}`}
            onClick={handlePrevious}
            style={{
              backgroundColor: globalLoading ? "grey" : ""
            }}
          >
            <img
              src="/images/prev-page.svg"
              alt="previous-page"
              title="Previous Page"
            />
          </div>
        )}
        {props.children}
        {nextPage && props.onNext && (
          <div
            className={`${chartStyles.arrow} ${chartStyles.next}`}
            onClick={handleNext}
            style={{
              backgroundColor: globalLoading ? "grey" : ""
            }}
          >
            <img
              src="/images/next-page.svg"
              alt="next-page"
              title="Next Page"
            />
          </div>
        )}
      </div>
      <div className={` ${chartStyles.footer}`}>
        <ChartFooterItem title="Max NDVI" value={maxNDVI} />
        <ChartFooterItem title="Mean NDVI" value={meanNDVI} />
        <ChartFooterItem title="Min NDVI" value={minNDVI} />
        <ChartFooterItem title="Latency" value={getLatency()} />
        <ChartFooterItem title="Validity" value={getValidity()} />
      </div>
    </div>
  );
};

export default Chart;
