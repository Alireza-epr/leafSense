import customTooltipItemStyle from "./CustomTooltipItem.module.scss";

export interface ICustomTooltipItemProps {
  label: string;
  value: string | number;
  isAbnormal?: boolean
}
const CustumTooltipItem = (props: ICustomTooltipItemProps) => {
  return (
    <div 
      className={` ${customTooltipItemStyle.wrapper}`}
      style={{
        color: props.isAbnormal ? "orange" : ""
      }}
    >
      <div className={` ${customTooltipItemStyle.label}`}>{props.label}</div>
      <div className={` ${customTooltipItemStyle.value}`}>{props.value}</div>
    </div>
  );
};

export default CustumTooltipItem;
