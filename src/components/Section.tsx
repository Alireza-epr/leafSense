import sectionStyles from "./Section.module.scss";
import React, { useEffect, useRef } from "react";

export interface ISectionProps {
  active?: boolean;
  title: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onSection?: () => void;
}
const Section = (props: ISectionProps) => {
  return (
    <div
      className={` ${sectionStyles.wrapper}`}
      style={{
        pointerEvents: props.disabled ? "none" : "auto",
        backgroundColor: props.disabled
          ? "lightgrey"
          : props.active
            ? "rgb(28, 215, 206)"
            : "",
      }}
      onClick={props.onSection}
      role="button" // interactive panel header acts as button
      aria-expanded={props.active ?? false} // indicates open/closed state
      aria-disabled={props.disabled ?? false} // indicates disabled state
      aria-label={props.title} // label for screen readers
      onKeyDown={(e) => {
        if (!props.disabled && (e.key === "Enter" || e.key === " ")) {
          props.onSection?.();
        }
      }}
    >
      <div className={` ${sectionStyles.headerWrapper}`}>
        <div className={` ${sectionStyles.titleWrapper}`}>{props.title}</div>
      </div>
      <div className={` ${sectionStyles.contentWrapper}`}>{props.children}</div>
    </div>
  );
};

export default Section;
