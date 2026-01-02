import { ChangeEvent, KeyboardEvent, useEffect, useRef } from "react";
import ChartHeaderItem from "./ChartHeaderItem";
import chartTextareaStyle from "./ChartTextarea.module.scss";

export interface ChartTextareaProps {
  value: string;
  onChange: (a_Text: string) => void;
  onClose: () => void;
  x: number;
  y: number;
}

const ChartTextarea = (props: ChartTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOnChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    props.onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, [props.x, props.y]);
  return (
    <div
      className={` ${chartTextareaStyle.wrapper}`}
      style={{
        left: props.x + "px",
        top: props.y + "px",
      }}
    >
      <div className={` ${chartTextareaStyle.close}`} onClick={props.onClose}>
        X
      </div>
      <textarea
        ref={textareaRef}
        className={` ${chartTextareaStyle.textarea}`}
        maxLength={120}
        value={props.value}
        onChange={handleOnChange}
        style={{
          left: 0,
          top: 0,
        }}
        onKeyDown={(ev) => handleKeyDown(ev)}
      />
    </div>
  );
};

export default ChartTextarea;
