import { Style } from "maplibre-gl";
import buttonStyles from "./CButton.module.scss";
import { useEffect, useRef } from "react";

export interface ICButtonProps {
  title: string;
  active?: boolean;
  onButtonClick: () => void;
  disable?: boolean;
  icon?: string;
  "data-testid"?: string
  isFocused?: boolean
}
const CButton = (props: ICButtonProps) => {
  const handleButtonClick = () => {
    if (props.disable) {
      return;
    } else {
      props.onButtonClick();
    }
  };

  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(props.isFocused && buttonRef.current){
      buttonRef.current.focus()
    }
  },[props.isFocused])

  return (
    <div
      ref={buttonRef}
      className={` ${buttonStyles.wrapper}`}
      onClick={handleButtonClick}
      data-testid={props["data-testid"]}
      style={{
        backgroundColor: props.disable
          ? "grey"
          : props.active
            ? "rgb(28, 215, 206)"
            : "",
        color: props.disable ? "darkgray" : "",
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleButtonClick();
        }
      }}
      role="button" // announce as button
      tabIndex={props.disable ? -1 : 0} // skip disabled buttons in tab order
      aria-pressed={props.active ?? false} // indicates toggle state
      aria-disabled={props.disable ?? false} // disabled state
      aria-label={props.title} // screen reader label
    >
      <div className={` ${buttonStyles.button}`}>{props.title}</div>
      {props.icon && props.icon.length > 0 ? (
        <div className={` ${buttonStyles.imageWrapper}`}>
          <img
            src={`/images/${props.icon}.svg`}
            alt="" // icon is decorative; label is on button
            aria-hidden="true"
            className={` ${buttonStyles.image}`}
          />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default CButton;
