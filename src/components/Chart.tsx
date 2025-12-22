import {
  EMarkerType,
  INDVISample,
  INDVISmoothed,
  useMapStore,
} from "../store/mapStore";
import chartStyles from "./Chart.module.scss";
import { useEffect, useRef, useState } from "react";
import ChartFooterItem from "./ChartFooterItem";
import ChartHeaderItem from "./ChartHeaderItem";
import ChartListRows from "./ChartListRows";
import ChartSummaryRows from "./ChartSummaryRows";
import { IChartSummaryRow } from "./ChartSummaryRow";
import { downloadCSV, toFirstLetterUppercase } from "../utils/generalUtils";
import { getSmoothNDVISamples } from "../utils/calculationUtils";
import { EAggregationMethod } from "../types/generalTypes";

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

  const smoothing = useMapStore((state) => state.smoothing);
  const setSmoothing = useMapStore((state) => state.setSmoothing);

  const yAxis = useMapStore((state) => state.yAxis);
  const setYAxis = useMapStore((state) => state.setYAxis);

  const nextPage = useMapStore((state) => state.nextPage);
  const previousPage = useMapStore((state) => state.previousPage);
  const notValidSamples = useMapStore((state) => state.notValidSamples);
  const [maxNDVI, setMaxNDVI] = useState<number>(0);
  const [meanNDVI, setMeanNDVI] = useState<number>(0);
  const [minNDVI, setMinNDVI] = useState<number>(0);

  const [showList, setShowList] = useState(false);
  const [showToggleChart, setShowToggleChart] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryItems, setSummaryItems] = useState<IChartSummaryRow[]>([
    { id: 1, title: "Total / Used Scenes", value: "-" },
    { id: 2, title: "Average Valid Pixels", value: "-" },
    { id: 3, title: "First Date", value: "-" },
    { id: 4, title: "Last Date", value: "-" },
    { id: 5, title: "Latency", value: "-" },
  ]);
  const [showSmoothChart, setShowSmoothChart] = useState(false);
  //const [smoothed, setSmoothed] = useState(false);

  let notSmoothedSamples = useRef<INDVISample[]>([]);

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

      notSmoothedSamples.current = samples;
    } else {
      setMaxNDVI(0);
      setMeanNDVI(0);
      setMinNDVI(0);
    }
  }, [globalLoading]);

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
      setShowSmoothChart(true);
    } else {
      setShowSmoothChart(false);
    }
  }, [globalLoading]);

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

  const getValidFraction = (
    a_Fraction: `${string}%` | `${number}%` | "N/A",
  ) => {
    if (a_Fraction == "N/A") return 0;
    const num = a_Fraction.substring(0, a_Fraction.indexOf("%"));
    return Number(num);
  };

  const handleToggleSummary = (a_AllSamples: INDVISample[]) => {
    setShowList(false);
    setShowSummary(!showSummary);

    // Total / Used Scenes
    const validsLen = a_AllSamples.filter((s) => s.meanNDVI).length;
    const totalUsed = `${validsLen} / ${a_AllSamples.length}`;

    // Average Valid Pixels
    const sumValidPixels = a_AllSamples
      .filter((s) => s.meanNDVI)
      .map((s) => getValidFraction(s.valid_fraction))
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
  };

  const handleSmoothChart = () => {
    setSmoothing(!smoothing);
  };

  const handleExportCSV = (a_Samples: INDVISample[]) => {
    const validSamples = a_Samples.filter((s) => s.meanNDVI);
    const notValidSamples = a_Samples.filter((s) => !s.meanNDVI);
    const smoothedSamples = getSmoothNDVISamples(validSamples);
    const allSamples = [...validSamples, ...notValidSamples].sort(
      (a, b) => a.id - b.id,
    );
    const exportCSV: (INDVISample & INDVISmoothed)[] = allSamples.map((s) => {
      const smoothedSample = smoothedSamples.find(
        (smoothed) => smoothed.id === s.id,
      );
      return {
        ...s,
        meanNDVISmoothed: smoothedSample ? smoothedSample.meanNDVI : null,
        medianNDVISmoothed: smoothedSample ? smoothedSample.medianNDVI : null,
      };
    });

    downloadCSV(exportCSV);
  };

  const handleToggleYAxis = () => {
    setYAxis(prev => {
      if(prev == EAggregationMethod.Mean){
        return EAggregationMethod.Median
      } else {
        return EAggregationMethod.Mean
      }
    })
  }

  useEffect(() => {
    if (smoothing) {
      const smoothedNDVISamples = getSmoothNDVISamples(samples);
      setSamples(smoothedNDVISamples);
    } else {
      setSamples(notSmoothedSamples.current);
    }
  }, [smoothing]);

  const getTitleInfo = () => {
    let smoothingStatus = smoothing ? "smoothed" : "raw"
    let yAxisStatus = yAxis == EAggregationMethod.Mean ? "Mean" : "Median"
    const full = "( " + yAxisStatus + " - " + smoothingStatus + " )"
    return full
  }

  return (
    <div className={` ${chartStyles.wrapper}`}>
      <div className={` ${chartStyles.buttonsWrapper}`}>
        <div className={` ${chartStyles.title}`}>
          {`Chart of ${fetchFeatures == EMarkerType.point ? toFirstLetterUppercase(fetchFeatures) : "Zonal"} ${getTitleInfo()}`}
        </div>
        <ChartHeaderItem
          title="Series Summary"
          alt="Series Summary"
          onClick={() => handleToggleSummary([...samples, ...notValidSamples])}
          icon="info"
          disabled={[...samples, ...notValidSamples].length == 0}
          active={showSummary}
        />
        <ChartHeaderItem
          title="Export CSV"
          alt="Export CSV"
          onClick={() => handleExportCSV([...samples, ...notValidSamples])}
          icon="export-csv"
          disabled={[...samples, ...notValidSamples].length == 0}
        />
        <ChartHeaderItem
          title={yAxis}
          alt="Aggregation"
          onClick={handleToggleYAxis}
          icon="y-axis"
          disabled={globalLoading}
        />
        <ChartHeaderItem
          title="Smooth Chart"
          alt="Smooth Chart"
          onClick={handleSmoothChart}
          icon="smoothing"
          disabled={!showSmoothChart}
          active={smoothing}
        />
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
            onClick={props.onPrevious}
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
            onClick={props.onNext}
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
