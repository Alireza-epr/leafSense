import React from "react";
import rangeInputStyles from "./RangeInput.module.scss";

export interface IRangeInput {
  value: string;
  disabled?: boolean;
  onRangeChange: (a_Date: string) => void;
  min?: number
  max?: number
}

const RangeInput = (props: IRangeInput) => {
  const onRangeChange = (a_Value: React.ChangeEvent<HTMLInputElement>) => {
    if (!props.disabled) {
      props.onRangeChange(a_Value.target.value);
    }
  };

  return (
    <div className={` ${rangeInputStyles.wrapper}`}>
      <input
        type="range"
        value={props.value}
        onChange={(v) => onRangeChange(v)}
        min={props.min ?? "0"}
        max={props.max ?? "100"}
        disabled={props.disabled}
        className={` ${rangeInputStyles.input}`}
      />
    </div>
  );
};

export default RangeInput;
