import chartListRowItem from "./ChartListRowItem.module.scss";

export interface IChartListRowItemProps {
  isSummaryItem?: boolean;
  isHeaderItem?: boolean;
  isSceneNotValid?: boolean;
  title: string;
  children: React.ReactNode;
}

const ChartListRowItem = (props: IChartListRowItemProps) => {
  return (
    <div
      className={` ${chartListRowItem.wrapper}`}
      title={props.title}
      style={{
        backgroundColor: props.isSceneNotValid
          ? "#e29c45"
          : props.isHeaderItem
            ? "#476d6c"
            : "#3aac1aff",
        margin: props.isSummaryItem ? "0 1vh" : "",
      }}
    >
      <div
        className={` ${chartListRowItem.item}`}
        style={{
          fontSize: props.isHeaderItem || props.isSummaryItem ? "1rem" : "",
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

export default ChartListRowItem;
