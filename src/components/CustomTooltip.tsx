import { INDVISample, useMapStore } from "../store/mapStore";
import customTooltipStyles from "./CustomTooltip.module.scss";
import { TooltipContentProps } from "recharts";
import CustumTooltipItem from "./CustumTooltipItem";
import { getDatetime } from "../utils/dateUtils";
import { ESampleStatus, IChartPoint } from "../types/generalTypes";

const CustomTooltip = (props: TooltipContentProps<string, string>) => {
  const smoothingWindow = useMapStore((state) => state.smoothingWindow);
  const changePoints = useMapStore((state) => state.changePoints);
  const annotations = useMapStore((state) => state.annotations);
  if (props.active && props.payload && props.payload.length) {
    const ndviSample: IChartPoint = props.payload[0].payload;
    return (
      <div
        className={` ${customTooltipStyles.wrapper}`}
        style={{
          backgroundColor: !ndviSample.meanNDVI ? "#c8ab87ff" : "",
        }}
      >
        <CustumTooltipItem
          label={"Status"}
          value={ndviSample.meanNDVI !== null ? ESampleStatus.Included : ESampleStatus.Excluded}
        />
        <CustumTooltipItem
          label={"Date"}
          value={getDatetime(ndviSample.datetime)}
        />
        <CustumTooltipItem
          label={"Mean"}
          value={ndviSample.meanNDVI ?? "N/A"}
        />
        {ndviSample.comparison_meanNDVI !== undefined ? (
          <CustumTooltipItem
            isAbnormal={true}
            label={"Comparison Mean"}
            value={ndviSample.comparison_meanNDVI ?? "N/A"}
          />
        ) : (
          <></>
        )}
        {smoothingWindow[0].value !== "1" ? (
          <>
            <CustumTooltipItem
              label={"Mean (Smoothed)"}
              value={ndviSample.meanNDVISmoothed ?? "N/A"}
            />
            {ndviSample.comparison_meanNDVI !== undefined ? (
              <CustumTooltipItem
                isAbnormal={true}
                label={"Comparison Mean (Smoothed)"}
                value={ndviSample.comparison_meanNDVISmoothed ?? "N/A"}
              />
            ) : (
              <></>
            )}
          </>
        ) : (
          <></>
        )}
        <CustumTooltipItem
          label={"Median"}
          value={ndviSample.medianNDVI ?? "N/A"}
        />
        {ndviSample.comparison_meanNDVI !== undefined ? (
          <CustumTooltipItem
            isAbnormal={true}
            label={"Comparison Median"}
            value={ndviSample.comparison_medianNDVI ?? "N/A"}
          />
        ) : (
          <></>
        )}
        {smoothingWindow[0].value !== "1" ? (
          <>
            <CustumTooltipItem
              label={"Median (Smoothed)"}
              value={ndviSample.medianNDVISmoothed ?? "N/A"}
            />
            {ndviSample.comparison_meanNDVI !== undefined ? (
              <CustumTooltipItem
                isAbnormal={true}
                label={"Comparison Median (Smoothed)"}
                value={ndviSample.comparison_meanNDVISmoothed ?? "N/A"}
              />
            ) : (
              <></>
            )}
          </>
        ) : (
          <></>
        )}
        <CustumTooltipItem label={"Valid Pixels"} value={ndviSample.n_valid} />
        <CustumTooltipItem
          label={"Valid Fraction"}
          value={ndviSample.valid_fraction.toFixed(2) + "%"}
        />
        <CustumTooltipItem label={"Filter"} value={ndviSample.filter} />
        <CustumTooltipItem
          label={"Filter Fraction"}
          value={ndviSample.filter_fraction.toFixed(2) + "%"}
        />
        {changePoints.main.findIndex((p) => p.id == ndviSample.id) !== -1 ? (
          <CustumTooltipItem
            label={"Z-Score"}
            value={
              changePoints.main.find((p) => p.id == ndviSample.id)?.z.toFixed(2) ??
              ""
            }
          />
        ) : (
          <></>
        )}
        {changePoints.comparison.findIndex((p) => p.id == ndviSample.comparison_id) !== -1 ? (
          <CustumTooltipItem
            isAbnormal={true}
            label={"Comparison Z-Score"}
            value={
              changePoints.comparison.find((p) => p.id == ndviSample.comparison_id)?.z.toFixed(2) ??
              ""
            }
          />
        ) : (
          <></>
        )}
        {annotations.findIndex((a) => a.featureId == ndviSample.featureId) !== -1 ? (
          <CustumTooltipItem
            label={"Annotation"}
            value={
              annotations.find((a) => a.featureId == ndviSample.featureId)?.note ??
              ""
            }
          />
        ) : (
          <></>
        )}
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
