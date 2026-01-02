import chartFooterItemStyles from "./ChartFooterItem.module.scss";

export interface IChartFooterItemProps {
  title: string;
  value: string | number;
  subValue?: string | number | null
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
      {props.subValue !== undefined && props.subValue !== null
      ?
        <div
          className={` ${chartFooterItemStyles.footerItemValue}`}
          title={`${props.value}`}
          style={{ color: "#ffb300ff"}}
        >
          {typeof props.subValue == "string" ? props.subValue : props.subValue.toFixed(3)}
        </div>
      :
        <></>
      }
    </div>
  );
};

export default ChartFooterItem;
