import chartSummaryRowsStyles from "./ChartListRows.module.scss";
import ChartSummaryRow, { IChartSummaryRow } from "./ChartSummaryRow";
import ChartListRowHeader from "./ChartListRowHeader";

export interface IChartSummaryRowsProps {
  title: string,
  items: IChartSummaryRow[];
}

const ChartSummaryRows = (props: IChartSummaryRowsProps) => {
  return (
    <div className={` ${chartSummaryRowsStyles.wrapper}`}>
      <div className={` ${chartSummaryRowsStyles.title}`}>{props.title}</div>
      {props.items.map((i, index) => (
        <ChartSummaryRow
          title={i.title}
          value={i.value}
          id={i.id}
          key={index}
        />
      ))}
    </div>
  );
};

export default ChartSummaryRows;
