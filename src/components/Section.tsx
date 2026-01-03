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
    >
      <div className={` ${sectionStyles.headerWrapper}`}>
        <div className={` ${sectionStyles.titleWrapper}`}>{props.title}</div>
      </div>
      <div className={` ${sectionStyles.contentWrapper}`}>{props.children}</div>
    </div>
  );
};

export default Section;
