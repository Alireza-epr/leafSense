import React from "react";
import dateInputStyles from "./DateInput.module.scss";
import { getLocaleISOString } from "../utils/dateUtils";

export interface IDateInput {
  value: string;
  disabled?: boolean;
  onDateChange: (a_Date: string) => void;
}

const DateInput = (props: IDateInput) => {
  const onDateChange = (a_Value: React.ChangeEvent<HTMLInputElement>) => {
    if (!props.disabled) {
      props.onDateChange(a_Value.target.value);
    }
  };

  return (
    <div className={` ${dateInputStyles.wrapper}`}>
      <input
        type="datetime-local"
        value={props.value}
        onChange={(v) => onDateChange(v)}
        min="2017-01-01T00:00"
        max={getLocaleISOString(new Date())}
        disabled={props.disabled}
        className={` ${dateInputStyles.input}`}
      />
    </div>
  );
};

export default DateInput;
