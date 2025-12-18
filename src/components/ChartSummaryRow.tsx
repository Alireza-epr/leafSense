import chartSummaryRowStyles from "./ChartSummaryRow.module.scss";
import ChartListRowItem from "./ChartListRowItem";

export interface IChartSummaryRow {
  id: number;
  title: string;
  value: string | number;
}

const ChartSummaryRow = (props: IChartSummaryRow) => {
  return (
    <div className={` ${chartSummaryRowStyles.wrapper}`}>
      <ChartListRowItem title={props.title} isHeaderItem={true}>
        {props.title}
      </ChartListRowItem>
      <ChartListRowItem title={String(props.value)} isSummaryItem={true}>
        {props.value}
      </ChartListRowItem>
    </div>
  );
};

export default ChartSummaryRow;
