import { useRef } from "react";
import selectStyles from "./CSelect.module.scss";

export interface ICSelectProps {
  value: string;
  name: string;
  onSelectClick: (a_Selected: string) => void;
  disabled?: boolean;
  options: string[];
}

const CSelect = (props: ICSelectProps) => {
  const handleSelectChange = (v: React.ChangeEvent<HTMLSelectElement>) => {
    if (props.disabled) {
      return;
    } else {
      props.onSelectClick(v.target.value);
    }
  };

  return (
    <div
      className={` ${selectStyles.wrapper}`}
      style={{ backgroundColor: props.disabled ? "grey" : "" }}
    >
      <div
        className={` ${selectStyles.label}`}
        style={{ color: props.disabled ? "darkgrey" : "" }}
      >
        {props.name}
      </div>
      <select
        className={` ${selectStyles.select}`}
        name={props.name}
        id={props.name}
        onChange={(v) => handleSelectChange(v)}
        disabled={props.disabled}
        style={{
          backgroundColor: props.disabled ? "grey" : "",
          color: props.disabled ? "darkgrey" : "",
        }}
        value={props.value}
      >
        {props.options.map((option, index) => (
          <option
            value={option}
            key={index}
            className={` ${selectStyles.option}`}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CSelect;
