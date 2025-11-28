import React, { CSSProperties } from "react";
import loadingStyle from "./Loading.module.scss";
import { ELoadingSize } from "../types/generalTypes";

export interface ILoadingProps {
  text?: string;
  size: ELoadingSize;
  marginVertical?: React.CSSProperties["margin"];
}

const Loading = (props: ILoadingProps) => {
  return (
    <div className={` ${loadingStyle.wrapper}`}>
      {props.text && props.text ? (
        <div className={` ${loadingStyle.text}`}>{props.text}</div>
      ) : (
        <></>
      )}
      <div
        className={` ${loadingStyle.loader} ${props.size ? loadingStyle[props.size] : ""}`}
        style={{
          marginTop: props.marginVertical ? `${props.marginVertical}` : "",
          marginBottom: props.marginVertical ? `${props.marginVertical}` : "",
        }}
      />
    </div>
  );
};

export default Loading;
