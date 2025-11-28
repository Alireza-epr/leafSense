import sectionStyles from "./Section.module.scss";
import React, { useEffect, useRef } from "react";

export interface ISectionProps {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}
const Section = (props: ISectionProps) => {
  return (
    <div
      className={` ${sectionStyles.wrapper}`}
      style={{
        pointerEvents: props.disabled ? "none" : "auto",
        backgroundColor: props.disabled ? "lightgray" : "",
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
