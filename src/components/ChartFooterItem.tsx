import chartFooterItemStyles from "./ChartFooterItem.module.scss";

export interface IChartFooterItemProps {
  title: string;
  value: string | number;
}
const ChartFooterItem = (props: IChartFooterItemProps) => {
  return (
    <div className={` ${chartFooterItemStyles.footerItem}`}>
      <div className={` ${chartFooterItemStyles.footerItemTitle}`}>
        {props.title}
      </div>
      <div
        className={` ${chartFooterItemStyles.footerItemValue}`}
        title={`${props.value}`}
      >
        {typeof props.value == "string" ? props.value : props.value.toFixed(3)}
      </div>
    </div>
  );
};

export default ChartFooterItem;
