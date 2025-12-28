import {
  EMarkerType,
  ERequestContext,
  INDVISample,
  INDVISmoothed,
  TSample,
  useMapStore,
} from "../store/mapStore";
import chartStyles from "./Chart.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import ChartFooterItem from "./ChartFooterItem";
import ChartHeaderItem from "./ChartHeaderItem";
import ChartListRows from "./ChartListRows";
import ChartSummaryRows from "./ChartSummaryRows";
import { IChartSummaryRow } from "./ChartSummaryRow";
import { downloadCSV, getAllSamples, toFirstLetterUppercase } from "../utils/generalUtils";
import {
  detectChangePointsZScore,
  getSmoothNDVISamples,
} from "../utils/calculationUtils";
import {
  EAggregationMethod,
  EChartHeaderOptions,
  IChartHeaderItemOption,
} from "../types/generalTypes";
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

  const comparisonOptions = useMapStore((state) => state.comparisonOptions);
  const setComparisonOptions = useMapStore(
    (state) => state.setComparisonOptions,
  );

  const comparisonItem = useMapStore((state) => state.comparisonItem);
  const setComparisonItem = useMapStore((state) => state.setComparisonItem);
  const comparisonItemRef = useRef(comparisonItem);
  useEffect(()=>{comparisonItemRef.current = comparisonItem},[comparisonItem])

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
  const [showSmoothingOptions, setShowSmoothingOptions] = useState(false);
  const [showDetectionOptions, setShowDetectionOptions] = useState(false);
  const [showComparisonOptions, setShowComparisonOptions] = useState(false);
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
    if (samples[ERequestContext.main].length !== 0) {
      let max = -Infinity;
      let min = Infinity;
      let sum = 0;
      let count = 0;
      for (const s of samples[ERequestContext.main]) {
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
    const hasPolygon = polygons.length > 0;
    const hasPoint =
      markers.filter((m) => m.type === EMarkerType.point).length === 1;
    if (hasPolygon && hasPoint) {
      setShowToggleChart(true);
    } else {
      setShowToggleChart(false);
    }
    const polygonOptions = fetchFeatures[ERequestContext.main] !== EMarkerType.point ? polygons.slice(0, -1) : polygons
    const chartHeaderOption: IChartHeaderItemOption[] = polygonOptions
      .map((polygon) => {
        return {
          id: polygon.id,
          title: `Polygon ${polygon.id}`,
          value: `Polygon ${polygon.id}`,
        };
      });
    if (hasPoint && fetchFeatures[ERequestContext.main] !== EMarkerType.point) {
      chartHeaderOption.push({
        id: chartHeaderOption.length + 1,
        title: "Point",
        value: "Point",
      });
    }
    setComparisonOptions(chartHeaderOption);
  }, []);

  useEffect(() => {
    if (!globalLoading && samples[ERequestContext.main].length > 0) {
      setEnableHeaderOption(true);
    } else {
      setEnableHeaderOption(false);
    }
  }, [globalLoading]);

  useEffect(() => {
    if(smoothingWindow[0].value === "1") return
    setSamples(prev=>({
      [ERequestContext.comparison]: getSmoothNDVISamples(prev[ERequestContext.comparison], Number(smoothingWindow[0].value)),
      [ERequestContext.main]: getSmoothNDVISamples(prev[ERequestContext.main], Number(smoothingWindow[0].value))
    }))
  }, [smoothingWindow]);

  useEffect(() => {
    const points = detectChangePointsZScore(
      samples[ERequestContext.main],
      +changeDetection.find((o) => o.id == 1)!.value,
      +changeDetection.find((o) => o.id == 2)!.value,
      +changeDetection.find((o) => o.id == 3)!.value,
    );
    const comparisonPoints = detectChangePointsZScore(
      samples[ERequestContext.comparison],
      +changeDetection.find((o) => o.id == 1)!.value,
      +changeDetection.find((o) => o.id == 2)!.value,
      +changeDetection.find((o) => o.id == 3)!.value,
    );
    setChangePoints({
      main: points,
      comparison: comparisonPoints
    });
  }, [changeDetection]);

  const getValidity = () => {
    return props.items ? `${samples[ERequestContext.main].length}/${props.items}` : "-";
  };

  const handleListItems = () => {
    setShowSummary(false);
    setShowList(!showList);
  };

  const handleToggleChart = () => {
    const nextFetchFeatures =
      fetchFeatures[ERequestContext.main] === EMarkerType.polygon
        ? EMarkerType.point
        : EMarkerType.polygon;
    setFetchFeatures(prev=>({
      ...prev,
      [ERequestContext.main]: nextFetchFeatures
    }));
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
      const averageValidPixels =
        validsLen !== 0 ? (sumValidPixels / validsLen).toFixed(2) : "-";

      // First / Last Date
      const sortedValids = a_AllSamples
        .filter((s) => s.meanNDVI)
        .sort((a, b) => a.id - b.id);

      const firstDate = validsLen !== 0 ? sortedValids[0].datetime : "-";
      const lastDate =
        validsLen !== 0 ? sortedValids[validsLen - 1].datetime : "-";

      setSummaryItems([
        { id: 1, title: "Used / Total Scenes", value: totalUsed },
        { id: 2, title: "Average Valid Pixels", value: averageValidPixels },
        { id: 3, title: "First Date", value: firstDate },
        { id: 4, title: "Last Date", value: lastDate },
        { id: 5, title: "Latency", value: getLatency() },
      ]);
    },
    [showSummary, props.latency],
  );

  const disappearOptionsExcept = (a_Option: EChartHeaderOptions) => {
    switch (a_Option) {
      case EChartHeaderOptions.smoothing:
        setShowDetectionOptions(false);
        setShowComparisonOptions(false);
        break;
      case EChartHeaderOptions.detection:
        setShowSmoothingOptions(false);
        setShowComparisonOptions(false);
        break;
      case EChartHeaderOptions.comparison:
        setShowSmoothingOptions(false);
        setShowDetectionOptions(false);
        break;
    }
  };

  const handleToggleSmoothingOptions = () => {
    disappearOptionsExcept(EChartHeaderOptions.smoothing);
    setShowSmoothingOptions(!showSmoothingOptions);
  };

  const handleToggleDetectionOptions = () => {
    disappearOptionsExcept(EChartHeaderOptions.detection);
    setShowDetectionOptions(!showDetectionOptions);
  };

  const handleToggleComparisonOptions = () => {
    disappearOptionsExcept(EChartHeaderOptions.comparison);
    setShowComparisonOptions(!showComparisonOptions);
  };

  const handleSmoothingWindow = (a_Window: IChartHeaderItemOption) => {
    setSmoothingWindow([a_Window]);
  };

  const handleChangeDetection = (a_Option: IChartHeaderItemOption) => {
    setChangeDetection((prev) =>
      prev.map((o) => (o.id === a_Option.id ? a_Option : o)),
    );
  };

  const disableChangePointDetection = () => {
    setChangeDetection((prev)=>prev.map( (o, index) =>{
      if(index === 0){
        return {
          ...o,
          value: "1"
        }
      } else {
        return o
      }
    }))
  }
  const disableSmoothingDetection = () => {
    setSmoothingWindow((prev)=>prev.map( (o, index) =>{
      if(index === 0){
        return {
          ...o,
          value: "1"
        }
      } else {
        return o
      }
    }))
  }

  const handleChangeComparison = (a_Option: IChartHeaderItemOption) => {
    if(comparisonItemRef.current && comparisonItemRef.current.id === a_Option.id){
      setComparisonItem(null)
    } else {
      disableSmoothingDetection()
      disableChangePointDetection()
      setComparisonItem({
        id: a_Option.id,
        type:
          a_Option.title === "Point" ? EMarkerType.point : EMarkerType.polygon,
      });
    }
  };

  const handleExportCSV = useCallback(
    (a_Samples: TSample, a_NotValidSamples: TSample) => {
      
      const mainSamples = getAllSamples(
        a_Samples[ERequestContext.main],
        a_NotValidSamples[ERequestContext.main]
      );

      const comparisonSamples = getAllSamples(
        a_Samples[ERequestContext.comparison],
        a_NotValidSamples[ERequestContext.comparison]
      );

      downloadCSV(mainSamples, comparisonSamples, changePoints);
    },
    [changePoints],
  );
  const handleToggleYAxis = () => {
    setYAxis((prev) => {
      if (prev == EAggregationMethod.Mean) {
        return EAggregationMethod.Median;
      } else {
        return EAggregationMethod.Mean;
      }
    });
  };

  const handlePrevious = () => {
    if (!globalLoading && props.onPrevious) {
      props.onPrevious();
    }
  };

  const handleNext = () => {
    if (!globalLoading && props.onNext) {
      props.onNext();
    }
  };

  return (
    <div className={` ${chartStyles.wrapper}`}>
      <div className={` ${chartStyles.buttonsWrapper}`}>
        <div className={` ${chartStyles.title}`}>
          {`Chart of ${fetchFeatures[ERequestContext.main] == EMarkerType.point ? toFirstLetterUppercase(fetchFeatures[ERequestContext.main]) : "Zonal Nr." + polygons.at(-1)?.id}`}
        </div>
        <ChartHeaderItem
          title={"Comparison "}
          alt="Comparison"
          onClick={handleToggleComparisonOptions}
          icon="comparison"
          disabled={!enableHeaderOption || comparisonOptions.length === 0}
          active={comparisonItem !== null}
        >
          {showComparisonOptions ? (
            <ChartHeaderItemOptions
              options={comparisonOptions}
              onOption={handleChangeComparison}
              isList={true}
            />
          ) : (
            <></>
          )}
        </ChartHeaderItem>
        <ChartHeaderItem
          title="Series Summary"
          alt="Series Summary"
          onClick={() => handleToggleSummary([...samples[ERequestContext.main], ...notValidSamples[ERequestContext.main]])}
          icon="info"
          disabled={!enableHeaderOption}
          active={showSummary}
        />
        <ChartHeaderItem
          title="Export CSV"
          alt="Export CSV"
          onClick={() => handleExportCSV(samples, notValidSamples)}
          icon="export-csv"
          disabled={!enableHeaderOption}
        />
        <ChartHeaderItem
          title={"Change Detection"}
          alt="Change Detection"
          onClick={handleToggleDetectionOptions}
          icon="detection"
          disabled={!enableHeaderOption}
          active={changeDetection[0].value !== "1"}
        >
          {showDetectionOptions ? (
            <ChartHeaderItemOptions
              options={changeDetection}
              onOption={handleChangeDetection}
            />
          ) : (
            <></>
          )}
        </ChartHeaderItem>
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
          active={smoothingWindow[0].value !== "1"}
        >
          {showSmoothingOptions ? (
            <ChartHeaderItemOptions
              options={smoothingWindow}
              onOption={handleSmoothingWindow}
            />
          ) : (
            <></>
          )}
        </ChartHeaderItem>
        <ChartHeaderItem
          title="Toggle Chart"
          alt="Toggle Chart"
          onClick={handleToggleChart}
          icon="toggle"
          disabled={!enableHeaderOption || !showToggleChart}
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
          <ChartListRows items={[...samples[ERequestContext.main], ...notValidSamples[ERequestContext.main]]} />
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
              backgroundColor: globalLoading ? "grey" : "",
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
              backgroundColor: globalLoading ? "grey" : "",
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
