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
  "data-testid"?: string
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
        flexGrow: props.isClose ? "0" : "",
        width: props.isClose ? "5%" : "",
        minWidth: props.isClose ? "5%" : "",
      }}
      onClick={() => !props.disabled && props.onClick()}
      tabIndex={props.disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if(!props.disabled){
            props.onClick()
          }
        }
      }}
      data-testid={props["data-testid"]}
      role="button" // marks it as a button
      aria-label={props.title} // screen readers announce the title
      aria-pressed={props.active ? true : false} // toggle state if applicable
      aria-disabled={props.disabled ? true : false}
    >
      {props.icon ? (
        <img src={`/images/${props.icon}.svg`} alt={props.alt} />
      ) : (
        <></>
      )}
      {props.children ? <>{props.children}</> : <></>}
      {!props.isClose ? (
        <div className={` ${chartHeaderItem.footer}`}>{props.title}</div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default ChartHeaderItem;
