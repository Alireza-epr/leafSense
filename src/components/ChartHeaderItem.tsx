import chartHeaderItem from "./ChartHeaderItem.module.scss";

export interface IChartHeaderItemProps {
  title: string;
  alt: string;
  icon?: string;
  children?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  isClose?: boolean;
}

const ChartHeaderItem = (props: IChartHeaderItemProps) => {
  return (
    <div
      className={` ${chartHeaderItem.wrapper}`}
      title={props.title}
      style={{
        backgroundColor: props.disabled
          ? "grey"
          : props.active
            ? "rgb(28, 215, 206)"
            : "",
        color: props.disabled ? "darkgray" : "",
        marginLeft: props.isClose ? "5%" : "",
        flexGrow: props.isClose ? "0" : "",   
        width: props.isClose ? "5%" : "",   
        minWidth: props.isClose ? "5%" : "",   
      }}
      onClick={() => !props.disabled && props.onClick()}
    >
      {props.icon ? (
        <img src={`/images/${props.icon}.svg`} alt={props.alt} />
      ) : (
        <></>
      )}
      {props.children ? <>{props.children}</> : <></>}
      {!props.isClose ?
        <div className={` ${chartHeaderItem.footer}`}>
          {props.title}
        </div>
        : <></>
      }
    </div>
  );
};

export default ChartHeaderItem;
