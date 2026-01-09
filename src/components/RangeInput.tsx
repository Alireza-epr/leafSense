import React from "react";
import rangeInputStyles from "./RangeInput.module.scss";

export interface IRangeInput {
  title: string;
  value: string;
  disabled?: boolean;
  onRangeChange: (a_Date: string) => void;
  min?: number;
  max?: number;
  step?: number;
  "data-testid"?: string;
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
        data-testid={props["data-testid"]}
        type="range"
        value={props.value}
        onChange={(v) => onRangeChange(v)}
        min={props.min ?? "0"}
        max={props.max ?? "100"}
        step={props.step ?? "1"}
        disabled={props.disabled}
        className={` ${rangeInputStyles.input}`}
        aria-label={props.title} // short descriptive label
        aria-valuemin={props.min ?? 0} // minimum value
        aria-valuemax={props.max ?? 100} // maximum value
        aria-valuenow={+props.value} // current value
        aria-valuetext={`${props.value}`} // optional descriptive text
      />
    </div>
  );
};

export default RangeInput;
