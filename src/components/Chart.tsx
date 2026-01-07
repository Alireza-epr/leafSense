import {
  EMarkerType,
  ERequestContext,
  INDVISample,
  INDVISmoothed,
  TSample,
} from "../types";
import { useMapStore } from "../store/mapStore";
import chartStyles from "./Chart.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import ChartFooterItem from "./ChartFooterItem";
import ChartHeaderItem from "./ChartHeaderItem";
import ChartListRows from "./ChartListRows";
import ChartSummaryRows from "./ChartSummaryRows";
import { IChartSummaryRow } from "./ChartSummaryRow";
import {
  downloadCSV,
  getAllSamples,
  getLatency,
  getMainItem,
  getSummaryInfo,
  getValidity,
  handleCopyProvenance,
  mapPolygonOptions,
  toFirstLetterUppercase,
} from "../utils/generalUtils";
import {
  detectChangePointsZScore,
  getSmoothNDVISamples,
} from "../utils/calculationUtils";
import {
  EAggregationMethod,
  EChartHeaderOptions,
  EChartHeaderWindows,
  IChartHeaderItemOption,
} from "../types/generalTypes";
import ChartHeaderItemOptions from "./ChartHeaderItemOptions";

export interface IChartProps {
  children: React.ReactNode;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onExportPNG?: () => void;
  items?: number;
}

const Chart = (props: IChartProps) => {
  const samples = useMapStore((state) => state.samples);
  const setSamples = useMapStore((state) => state.setSamples);
  const markers = useMapStore((state) => state.markers);
  const fetchFeatures = useMapStore((state) => state.fetchFeatures);
  const responseFeatures = useMapStore((state) => state.responseFeatures);
  const globalLoading = useMapStore((state) => state.globalLoading);
  const latency = useMapStore((state) => state.latency);
  const setFetchFeatures = useMapStore((state) => state.setFetchFeatures);
  const fetchFeaturesRef = useRef(fetchFeatures);

  const smoothingWindow = useMapStore((state) => state.smoothingWindow);
  const setSmoothingWindow = useMapStore((state) => state.setSmoothingWindow);

  const summaryItem = useMapStore((state) => state.summaryItem);
  const setSummaryItem = useMapStore((state) => state.setSummaryItem);

  const changeDetection = useMapStore((state) => state.changeDetection);
  const setChangeDetection = useMapStore((state) => state.setChangeDetection);

  const toggleOptions = useMapStore((state) => state.toggleOptions);
  const setToggleOptions = useMapStore((state) => state.setToggleOptions);

  const annotations = useMapStore((state) => state.annotations);
  const changePoints = useMapStore((state) => state.changePoints);
  const setChangePoints = useMapStore((state) => state.setChangePoints);

  const yAxis = useMapStore((state) => state.yAxis);
  const setYAxis = useMapStore((state) => state.setYAxis);

  const polygons = useMapStore((state) => state.polygons);

  const nextPage = useMapStore((state) => state.nextPage);
  const previousPage = useMapStore((state) => state.previousPage);
  const notValidSamples = useMapStore((state) => state.notValidSamples);
  const [maxNDVI, setMaxNDVI] = useState<Record<ERequestContext, number>>({
    main: 0,
    comparison: 0,
  });
  const [meanNDVI, setMeanNDVI] = useState<Record<ERequestContext, number>>({
    main: 0,
    comparison: 0,
  });
  const [minNDVI, setMinNDVI] = useState<Record<ERequestContext, number>>({
    main: 0,
    comparison: 0,
  });

  const [showList, setShowList] = useState(false);
  const [showMethods, setShowMethods] = useState(false);
  const [showListComparison, setShowListComparison] = useState(false);
  const [showToggleChart, setShowToggleChart] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSmoothingOptions, setShowSmoothingOptions] = useState(false);
  const [showDetectionOptions, setShowDetectionOptions] = useState(false);
  const [showComparisonOptions, setShowComparisonOptions] = useState(false);
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
      setMaxNDVI((prev) => ({
        ...prev,
        main: max,
      }));
      setMinNDVI((prev) => ({
        ...prev,
        main: min,
      }));
      setMeanNDVI((prev) => ({
        ...prev,
        main: count > 0 ? sum / count : 0,
      }));
    } else {
      setMaxNDVI((prev) => ({
        ...prev,
        main: 0,
      }));
      setMinNDVI((prev) => ({
        ...prev,
        main: 0,
      }));
      setMeanNDVI((prev) => ({
        ...prev,
        main: 0,
      }));
    }
  }, [samples.main]);

  useEffect(() => {
    if (samples[ERequestContext.comparison].length !== 0) {
      let max = -Infinity;
      let min = Infinity;
      let sum = 0;
      let count = 0;
      for (const s of samples[ERequestContext.comparison]) {
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
      setMaxNDVI((prev) => ({
        ...prev,
        comparison: max,
      }));
      setMinNDVI((prev) => ({
        ...prev,
        comparison: min,
      }));
      setMeanNDVI((prev) => ({
        ...prev,
        comparison: count > 0 ? sum / count : 0,
      }));
    } else {
      setMaxNDVI((prev) => ({
        ...prev,
        comparison: 0,
      }));
      setMinNDVI((prev) => ({
        ...prev,
        comparison: 0,
      }));
      setMeanNDVI((prev) => ({
        ...prev,
        comparison: 0,
      }));
    }
  }, [samples.comparison]);

  useEffect(() => {
    fetchFeaturesRef.current = fetchFeatures;
    const mainItem = getMainItem(fetchFeaturesRef.current);
    if (!mainItem) {
      setToggleOptions([]);
      return;
    }

    let options: IChartHeaderItemOption[] = [];

    options = mapPolygonOptions(polygons);
    const lastId = options.at(-1)?.id;
    const point = markers.find((m) => m.type === EMarkerType.point);
    if (point) {
      options.push({
        id: lastId ? lastId + 1 : 1,
        title: "Point",
        value: "Point",
      });
    }

    setToggleOptions(options);
  }, [fetchFeatures, polygons]);

  useEffect(() => {
    if (!globalLoading.main && samples[ERequestContext.main].length > 0) {
      setEnableHeaderOption(true);
    } else {
      setEnableHeaderOption(false);
    }
  }, [globalLoading]);

  useEffect(() => {
    if (smoothingWindow[0].value === "1") return;
    setSamples((prev) => ({
      [ERequestContext.comparison]: getSmoothNDVISamples(
        prev[ERequestContext.comparison],
        Number(smoothingWindow[0].value),
      ),
      [ERequestContext.main]: getSmoothNDVISamples(
        prev[ERequestContext.main],
        Number(smoothingWindow[0].value),
      ),
    }));
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
      comparison: comparisonPoints,
    });
  }, [changeDetection]);

  const handleListItems = () => {
    disappearWindowExcept(EChartHeaderWindows.mainList);
    setShowList(!showList);
  };

  const handleListComparisonItems = () => {
    disappearWindowExcept(EChartHeaderWindows.comparisonList);
    setShowListComparison(!showListComparison);
  };

  const handleToggleChart = (a_ToggleOptions: IChartHeaderItemOption[]) => {
    const mainItem = fetchFeaturesRef.current.main;
    if (!mainItem || a_ToggleOptions.length <= 1) return;
    const currentIndex = a_ToggleOptions.findIndex((o) => o.id === mainItem.id);
    const nextIndex =
      currentIndex === -1 || currentIndex === a_ToggleOptions.length - 1
        ? 0
        : currentIndex + 1;
    const nextOption = a_ToggleOptions[nextIndex];
    const nextMainItem = {
      id: nextOption.id,
      type:
        nextOption.title === "Point" ? EMarkerType.point : EMarkerType.polygon,
    };
    setFetchFeatures({
      [ERequestContext.main]: nextMainItem,
      [ERequestContext.comparison]: null,
    });
  };

  const handleToggleSummary = useCallback(
    (a_Samples: TSample, a_NotValidSamples: TSample) => {
      disappearWindowExcept(EChartHeaderWindows.summary);
      setShowSummary(!showSummary);

      const mainSamples = getAllSamples(
        a_Samples[ERequestContext.main],
        a_NotValidSamples[ERequestContext.main],
      );

      const comparisonSamples = getAllSamples(
        a_Samples[ERequestContext.comparison],
        a_NotValidSamples[ERequestContext.comparison],
      );

      // Main
      const { totalUsed, averageValidPixels, firstDate, lastDate } =
        getSummaryInfo(mainSamples);
      const {
        totalUsed: totalUsedComparison,
        averageValidPixels: averageValidPixelsComparison,
        firstDate: firstDateComparison,
        lastDate: lastDateComparison,
      } = getSummaryInfo(comparisonSamples);

      setSummaryItem({
        main: [
          { id: 1, title: "Used / Total Scenes", value: totalUsed },
          { id: 2, title: "Average Valid Pixels", value: averageValidPixels },
          { id: 3, title: "First Date", value: firstDate },
          { id: 4, title: "Last Date", value: lastDate },
          {
            id: 5,
            title: "Latency",
            value: getLatency(ERequestContext.main, latency),
          },
        ],
        comparison: [
          { id: 1, title: "Used / Total Scenes", value: totalUsedComparison },
          {
            id: 2,
            title: "Average Valid Pixels",
            value: averageValidPixelsComparison,
          },
          { id: 3, title: "First Date", value: firstDateComparison },
          { id: 4, title: "Last Date", value: lastDateComparison },
          {
            id: 5,
            title: "Latency",
            value: getLatency(ERequestContext.comparison, latency),
          },
        ],
      });
    },
    [showSummary, latency],
  );

  const disappearOptionsExcept = (a_Option: EChartHeaderOptions) => {
    switch (a_Option) {
      case EChartHeaderOptions.smoothing:
        setShowMethods(false);
        setShowDetectionOptions(false);
        setShowComparisonOptions(false);
        break;
      case EChartHeaderOptions.detection:
        setShowMethods(false);
        setShowSmoothingOptions(false);
        setShowComparisonOptions(false);
        break;
      case EChartHeaderOptions.comparison:
        setShowMethods(false);
        setShowSmoothingOptions(false);
        setShowDetectionOptions(false);
        break;
      case EChartHeaderOptions.methods:
        setShowSmoothingOptions(false);
        setShowDetectionOptions(false);
        setShowComparisonOptions(false);
        break;
    }
  };

  const disappearWindowExcept = (a_Window: EChartHeaderWindows) => {
    switch (a_Window) {
      case EChartHeaderWindows.summary:
        setShowList(false);
        setShowListComparison(false);
        break;
      case EChartHeaderWindows.mainList:
        setShowSummary(false);
        setShowListComparison(false);
        break;
      case EChartHeaderWindows.comparisonList:
        setShowSummary(false);
        setShowList(false);
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
    setChangeDetection((prev) =>
      prev.map((o, index) => {
        if (index === 0) {
          return {
            ...o,
            value: "1",
          };
        } else {
          return o;
        }
      }),
    );
  };
  const disableSmoothingDetection = () => {
    setSmoothingWindow((prev) =>
      prev.map((o, index) => {
        if (index === 0) {
          return {
            ...o,
            value: "1",
          };
        } else {
          return o;
        }
      }),
    );
  };

  const handleChangeComparison = (a_Option: IChartHeaderItemOption) => {
    const comparisonItem = fetchFeaturesRef.current.comparison;
    if (comparisonItem && comparisonItem.id === a_Option.id) {
      setFetchFeatures((prev) => ({
        ...prev,
        comparison: null,
      }));
    } else {
      disableSmoothingDetection();
      disableChangePointDetection();
      const comparisonOption = {
        id: a_Option.id,
        type:
          a_Option.title === "Point" ? EMarkerType.point : EMarkerType.polygon,
      };
      setFetchFeatures((prev) => ({
        ...prev,
        comparison: comparisonOption,
      }));
    }
    setShowComparisonOptions(false);
  };

  const handleExportCSV = useCallback(
    (a_Samples: TSample, a_NotValidSamples: TSample) => {
      const mainSamples = getAllSamples(
        a_Samples[ERequestContext.main],
        a_NotValidSamples[ERequestContext.main],
      );

      const comparisonSamples = getAllSamples(
        a_Samples[ERequestContext.comparison],
        a_NotValidSamples[ERequestContext.comparison],
      );

      downloadCSV(mainSamples, comparisonSamples, changePoints, annotations);
    },
    [changePoints, annotations],
  );

  const handleCopyList = useCallback(
    (a_Samples: TSample, a_NotValidSamples: TSample) => {
      const mainSamples = getAllSamples(
        a_Samples[ERequestContext.main],
        a_NotValidSamples[ERequestContext.main],
      );

      const comparisonSamples = getAllSamples(
        a_Samples[ERequestContext.comparison],
        a_NotValidSamples[ERequestContext.comparison],
      );

      handleCopyProvenance(mainSamples, comparisonSamples);
    },
    [changePoints, annotations],
  );

  const handleExportPNG = useCallback(() => {
    if (props.onExportPNG) {
      props.onExportPNG();
    }
  }, []);
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
    if (!globalLoading.main && props.onPrevious) {
      props.onPrevious();
    }
  };

  const handleNext = () => {
    if (!globalLoading.main && props.onNext) {
      props.onNext();
    }
  };

  const methodsOptions: IChartHeaderItemOption[] = [
    {
      id: 1,
      title: "• NDVI:",
      subtitle:
        "NDVI measures vegetation greenness using near-infrared and red light.",
      value: ``,
    },
    {
      id: 2,
      title: "• Formula:",
      subtitle: "NDVI = (NIR − Red) / (NIR + Red)",
      value: ``,
    },
    {
      id: 3,
      title: "• Masking:",
      subtitle:
        "Clouds, shadows, and water pixels are removed using Sentinel-2 scene classification.",
      value: ``,
    },
    {
      id: 4,
      title: "• Coverage:",
      subtitle: "Scenes with too few valid pixels are excluded.",
      value: ``,
    },
    {
      id: 5,
      title: "• Smoothing:",
      subtitle: "Optional smoothing reduces noise by averaging nearby dates.",
      value: ``,
    },
    {
      id: 6,
      title: "• Change detection:",
      subtitle:
        "Sudden changes are detected when NDVI shifts more than expected.",
      value: ``,
    },
  ];

  const onMethods = () => {
    disappearOptionsExcept(EChartHeaderOptions.methods);
    setShowMethods(!showMethods);
  };

  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(chartRef.current){
      chartRef.current.focus()
    }
  },[])

  useEffect(() => {

    const handleFocusOut = (e) => {
      if (e.target.role === "slider" ) {
        console.log("role slider")
          chartRef.current?.focus();
      }
    };

    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return (
    <div className={` ${chartStyles.wrapper}`} 
      ref={chartRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          props.onClose()
        }
      }}
      role="application"
      aria-label="Chart showing data trends"
    > 
      <div className={` ${chartStyles.closeWrapper}`}>
        <ChartHeaderItem
          title="Methods"
          alt="Methods"
          onClick={onMethods}
          icon="book"
          active={showMethods}
          isClose
        >
          {showMethods ? (
            <ChartHeaderItemOptions
              options={methodsOptions}
              onOption={() => undefined}
              isList={true}
            />
          ) : (
            <></>
          )}
        </ChartHeaderItem>

        <ChartHeaderItem
          title="Close Chart"
          alt="Close"
          onClick={props.onClose}
          isClose
        >
          X
        </ChartHeaderItem>
      </div>
      <div className={` ${chartStyles.buttonsWrapper}`}>
        <ChartHeaderItem
          title="Toggle Chart"
          alt="Toggle Chart"
          onClick={() => handleToggleChart(toggleOptions)}
          icon="toggle"
          disabled={
            globalLoading.main ||
            toggleOptions.filter((o) => o.id !== fetchFeatures.main?.id)
              .length === 0
          }
        />
        <ChartHeaderItem
          title={"Comparison With"}
          alt="Comparison"
          onClick={handleToggleComparisonOptions}
          icon="comparison"
          disabled={
            globalLoading.main ||
            toggleOptions.filter((o) => o.id !== fetchFeatures.main?.id)
              .length === 0
          }
          active={fetchFeatures.comparison !== null}
        >
          {showComparisonOptions ? (
            <ChartHeaderItemOptions
              options={toggleOptions.filter(
                (o) => o.id !== fetchFeatures.main?.id,
              )}
              onOption={handleChangeComparison}
              isList={true}
              activeItem={fetchFeatures.comparison?.id}
            />
          ) : (
            <></>
          )}
        </ChartHeaderItem>

        <ChartHeaderItem
          title="Main Panel"
          alt="Main Panel"
          onClick={handleListItems}
          icon="list"
          active={showList}
        />

        <ChartHeaderItem
          title="Comparison Panel"
          alt="Comparison Panel"
          onClick={handleListComparisonItems}
          icon="list-comparison"
          active={showListComparison}
          disabled={!fetchFeatures.comparison}
        />
        <ChartHeaderItem
          title={"Change Detection"}
          alt="Change Detection"
          onClick={handleToggleDetectionOptions}
          icon="detection"
          disabled={!enableHeaderOption}
          active={changeDetection[0].value !== "1"}
          data-testid="change-point"
        >
          {showDetectionOptions ? (
            <ChartHeaderItemOptions
              options={changeDetection}
              onOption={handleChangeDetection}
              data-testid="change-point-window"
            />
          ) : (
            <></>
          )}
        </ChartHeaderItem>

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
          title={"Switch Y Axis"}
          alt="Aggregation"
          onClick={handleToggleYAxis}
          icon="y-axis"
          disabled={!enableHeaderOption}
        />
        <ChartHeaderItem
          title="Export CSV"
          alt="Export CSV"
          onClick={() => handleExportCSV(samples, notValidSamples)}
          icon="export-csv"
          disabled={globalLoading.main}
          data-testid="export-csv"
        />
        <ChartHeaderItem
          title="Export PNG"
          alt="Export PNG"
          onClick={() => handleExportPNG()}
          icon="export-png"
          disabled={globalLoading.main}
          data-testid="export-png"
        />
        <ChartHeaderItem
          title="Copy Provenance"
          alt="Copy Provenance"
          onClick={() => handleCopyList(samples, notValidSamples)}
          icon="copy"
          disabled={globalLoading.main}
        />
        <ChartHeaderItem
          title="Series Summary"
          alt="Series Summary"
          onClick={() => handleToggleSummary(samples, notValidSamples)}
          icon="info"
          disabled={globalLoading.main}
          active={showSummary}
        />
      </div>
      {showList ? (
        <div className={` ${chartStyles.listWrapper}`}>
          <ChartListRows
            items={[
              ...samples[ERequestContext.main],
              ...notValidSamples[ERequestContext.main],
            ]}
          />
        </div>
      ) : (
        <></>
      )}
      {showSummary ? (
        <div className={` ${chartStyles.summaryWrapper}`}>
          <ChartSummaryRows
            items={summaryItem.main}
            title={"Main Samples Summary"}
          />
          {fetchFeatures.comparison ? (
            <ChartSummaryRows
              items={summaryItem.comparison}
              title={"Comparison Samples Summary"}
            />
          ) : (
            <></>
          )}
        </div>
      ) : (
        <></>
      )}
      {showListComparison ? (
        <div className={` ${chartStyles.listWrapper}`}>
          <ChartListRows
            items={[
              ...samples[ERequestContext.comparison],
              ...notValidSamples[ERequestContext.comparison],
            ]}
          />
        </div>
      ) : (
        <></>
      )}
      <div className={` ${chartStyles.children}`} data-testid="chart-area">
        {previousPage && props.onPrevious && (
          <div
            className={`${chartStyles.arrow} ${chartStyles.previous}`}
            onClick={handlePrevious}
            style={{
              backgroundColor: globalLoading.main ? "grey" : "",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " ) {
                handlePrevious()
              }
            }}
            tabIndex={globalLoading.main ? -1 : 0} // skip focus when disabled
            role="button" // announce as button
            aria-label="Previous page" // screen reader label
            aria-disabled={globalLoading.main ? true : false}
          >
            <img
              src="/images/prev-page.svg"
              alt="previous-page"
              title="Previous Page"
              aria-hidden="true"
            />
          </div>
        )}
        {props.children}
        {nextPage && props.onNext && (
          <div
            className={`${chartStyles.arrow} ${chartStyles.next}`}
            onClick={handleNext}
            style={{
              backgroundColor: globalLoading.main ? "grey" : "",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " ) {
                handleNext()
              }
            }}
            tabIndex={globalLoading.main ? -1 : 0} // skip focus when disabled
            role="button" // announce as button
            aria-label="Next page" // screen reader label
            aria-disabled={globalLoading.main ? true : false}
          >
            <img
              src="/images/next-page.svg"
              alt="next-page"
              title="Next Page"
              aria-hidden="true" // hide image from screen readers
            />
          </div>
        )}
      </div>
      <div className={` ${chartStyles.footer}`}>
        <ChartFooterItem
          title="Max NDVI"
          value={maxNDVI.main}
          subValue={fetchFeatures.comparison ? maxNDVI.comparison : null}
        />
        <ChartFooterItem
          title="Mean NDVI"
          value={meanNDVI.main}
          subValue={fetchFeatures.comparison ? meanNDVI.comparison : null}
        />
        <ChartFooterItem
          title="Min NDVI"
          value={minNDVI.main}
          subValue={fetchFeatures.comparison ? minNDVI.comparison : null}
        />
        <ChartFooterItem
          title="Latency"
          value={getLatency(ERequestContext.main, latency)}
          subValue={
            fetchFeatures.comparison
              ? getLatency(ERequestContext.comparison, latency)
              : null
          }
        />
        <ChartFooterItem
          title="Validity"
          value={getValidity(
            samples.main.length,
            responseFeatures.main?.features.length,
          )}
          subValue={
            fetchFeatures.comparison
              ? getValidity(
                  samples.comparison.length,
                  responseFeatures.comparison?.features.length,
                )
              : null
          }
        />
      </div>
    </div>
  );
};

export default Chart;
