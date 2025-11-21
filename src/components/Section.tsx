import sectionStyles from "./Section.module.scss";
import React from "react";

export interface ISectionProps {
    title: string
    children: React.ReactNode
}
const Section = (props: ISectionProps) => {
  return (
    <div className={` ${sectionStyles.wrapper}`}>
      <div className={` ${sectionStyles.headerWrapper}`}>
        <div className={` ${sectionStyles.titleWrapper}`}>
            { props.title }
        </div>
      </div>
      <div className={` ${sectionStyles.contentWrapper}`}>
        { props.children }
      </div>
    </div>
  )
}

export default Section
