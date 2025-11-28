import { useMapStore } from "@/store/mapStore";
import chartStyles from "./Chart.module.scss";
import { useEffect, useState } from "react";

export interface IChartProps {
  children: React.ReactNode;
  onClose: () => void;
}

const Chart = (props: IChartProps) => {
  const samples = useMapStore((state) => state.samples);
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

  return (
    <div className={` ${chartStyles.wrapper}`}>
      <div className={` ${chartStyles.close}`} onClick={props.onClose}>
        X
      </div>
      <div className={` ${chartStyles.children}`}>{props.children}</div>
      <div className={` ${chartStyles.footer}`}>
        <div className={` ${chartStyles.footerItem}`}>
          <div className={` ${chartStyles.footerItemTitle}`}>Max NDVI</div>
          <div className={` ${chartStyles.footerItemValue}`}>{maxNDVI}</div>
        </div>
        <div className={` ${chartStyles.footerItem}`}>
          <div className={` ${chartStyles.footerItemTitle}`}>Mean NDVI</div>
          <div className={` ${chartStyles.footerItemValue}`}>{meanNDVI}</div>
        </div>
        <div className={` ${chartStyles.footerItem}`}>
          <div className={` ${chartStyles.footerItemTitle}`}>Min NDVI</div>
          <div className={` ${chartStyles.footerItemValue}`}>{minNDVI}</div>
        </div>
      </div>
    </div>
  );
};

export default Chart;
