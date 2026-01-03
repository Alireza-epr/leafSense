import { DotItemDotProps } from "recharts";
import { INDVISample } from "../types";
import { useMapStore } from "../store/mapStore";

const CustomizedDot = (props: DotItemDotProps) => {
  const { cx, cy, r, payload } = props;

  const changePoints = useMapStore((state) => state.changePoints);

  if (cx == null || cy == null) {
    return <g />;
  }

  const changePoint = changePoints.main.find(
    (p) => p.id === (payload as INDVISample).id,
  );
  if (changePoint) {
    return (
      <svg x={cx - 10} y={cy - 10} width={20} height={20} viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke={changePoint.z >= 0 ? "red" : "#205de3ff"}
          strokeWidth="2"
        />

        <circle
          cx="10"
          cy="10"
          r="3"
          stroke={changePoint.z >= 0 ? "red" : "#205de3ff"}
        />
      </svg>
    );
  }

  return (
    <svg x={cx - 5} y={cy - 5} width={10} height={10} viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="4" fill="#00ff1eff" />
    </svg>
  );
};

export default CustomizedDot;
