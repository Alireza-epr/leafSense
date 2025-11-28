import { Style } from "maplibre-gl";
import buttonStyles from "./CButton.module.scss";

export interface ICButtonProps {
  title: string;
  active?: boolean;
  onButtonClick: () => void;
  disable?: boolean;
  icon?: string
}
const CButton = (props: ICButtonProps) => {
  const handleButtonClick = () => {
    if (props.disable) {
      return;
    } else {
      props.onButtonClick();
    }
  };

  return (
    <div
      className={` ${buttonStyles.wrapper}`}
      onClick={handleButtonClick}
      style={{
        backgroundColor: props.disable ? "grey" : props.active ? "rgb(28, 215, 206)" : "",
        color: props.disable ? "darkgray" : "",
      }}
    >
      <div className={` ${buttonStyles.button}`}>{props.title}</div>
      { props.icon && props.icon.length > 0
        ?
        <div className={` ${buttonStyles.imageWrapper}`}>
          <img src={`./src/assets/images/${props.icon}.svg`} alt={props.icon} className={` ${buttonStyles.image}`}/>
        </div>
        :
        <></>
      }
    </div>
  );
};

export default CButton;
