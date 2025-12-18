import { INDVISample } from "../store/mapStore";
import chartListItemsStyles from "./ChartListRows.module.scss";
import ChartListRow from "./ChartListRow";
import ChartListRowHeader from "./ChartListRowHeader";

export interface IChartListItemsProps {
  items: INDVISample[];
}

const ChartListRows = (props: IChartListItemsProps) => {
  return (
    <div className={` ${chartListItemsStyles.wrapper}`}>
      <ChartListRowHeader />
      {props.items
        .sort((a, b) => a.id - b.id)
        .map((sample, index) => (
          <ChartListRow item={sample} key={index} />
        ))}
    </div>
  );
};

export default ChartListRows;
