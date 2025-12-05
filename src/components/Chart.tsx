import { useMapStore } from "@/store/mapStore";
import chartStyles from "./Chart.module.scss";
import { useEffect, useState } from "react";
import ChartFooterItem from "./ChartFooterItem";

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
  const nextPage = useMapStore((state) => state.nextPage);
  const previousPage = useMapStore((state) => state.previousPage);
  const notValidSamples = useMapStore((state) => state.notValidSamples);
  const [maxNDVI, setMaxNDVI] = useState<number>(0);
  const [meanNDVI, setMeanNDVI] = useState<number>(0);
  const [minNDVI, setMinNDVI] = useState<number>(0);

  useEffect(() => {
    if (samples.length !== 0) {
      let max = -Infinity;
      let min = Infinity;
      let sum = 0;
      let count = 0;
      for (const s of samples) {
        if (s.NDVI) {
          if (s.NDVI > max) {
            max = s.NDVI;
          }
          if (s.NDVI < min) {
            min = s.NDVI;
          }
          sum += s.NDVI;
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

  const getValidity = () => {
    return props.items ? `${samples.length}/${( props.items )}` : '-'
  }

  return (
    <div className={` ${chartStyles.wrapper}`}>
      <div className={` ${chartStyles.close}`} onClick={props.onClose}>
        X
      </div>
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
        <ChartFooterItem title="Latency" value={props.latency ? `${props.latency.toFixed(1)} ms` : "-"} />
        <ChartFooterItem title="Validity" value={getValidity()} />
      </div>
    </div>
  );
};

export default Chart;
