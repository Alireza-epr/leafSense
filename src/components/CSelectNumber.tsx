import { useRef } from "react";
import cselectNumberStyles from "./CSelectNumber.module.scss";

export interface ICSelectNumberProps {
  value: string;
  name: string;
  onSelectClick: (a_Selected: string) => void;
  disabled?: boolean;
  options: string[];
}

const CSelectNumber = (props: ICSelectNumberProps) => {
  const handleSelectChange = (a_Option: string) => {
    if (props.disabled) {
      return;
    } else {
      props.onSelectClick(a_Option);
    }
  };

  return (
    <div
      className={` ${cselectNumberStyles.wrapper}`}
      style={{ backgroundColor: props.disabled ? "grey" : "" }}
    >
      <div
        className={` ${cselectNumberStyles.label}`}
        style={{ color: props.disabled ? "darkgrey" : "" }}
      >
        {props.name}
      </div>
      <div
        className={` ${cselectNumberStyles.select}`}
        style={{
          backgroundColor: props.disabled ? "grey" : "",
          color: props.disabled ? "darkgrey" : "",
        }}
      >
        {props.options.map((option, index) => (
          <div
            key={index}
            className={` ${cselectNumberStyles.option}`}
            onClick={() => handleSelectChange(option)}
            style={{
              backgroundColor: props.disabled
                ? "grey"
                : props.value === option
                  ? "rgb(28, 215, 206)"
                  : "",
              color: props.disabled ? "darkgray" : "",
            }}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CSelectNumber;
