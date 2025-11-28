import React from "react";
import coordinateStyles from "./Coordinate.module.scss";
import { ECoordinate } from "@/types/coordinateTypes";

export interface ICoordinateProps {
  lngLat: [number, number];
  id: number | string;
  disabled?: boolean;
  onCoordinateChange?: (
    id: number | string,
    coordinate: ECoordinate,
    value: string,
  ) => void;
}

const Coordinate = (props: ICoordinateProps) => {
  const onCoordinateChange = (
    a_Value: React.ChangeEvent<HTMLInputElement>,
    a_Coordinate: ECoordinate,
  ) => {
    if (!props.disabled && props.onCoordinateChange) {
      props.onCoordinateChange(props.id, a_Coordinate, a_Value.target.value);
    }
  };

  return (
    <div className={` ${coordinateStyles.wrapper}`}>
      <div className={` ${coordinateStyles.counter}`}>{props.id}</div>
      <div className={` ${coordinateStyles.contentWrapper}`}>
        <div className={` ${coordinateStyles.value}`}>
          <input
            type="number"
            maxLength={10}
            placeholder={ECoordinate.longitude}
            value={props.lngLat[0]}
            onChange={(ev) => onCoordinateChange(ev, ECoordinate.longitude)}
            readOnly
          />
        </div>
      </div>
      <div className={` ${coordinateStyles.contentWrapper}`}>
        <div className={` ${coordinateStyles.value}`}>
          <input
            type="number"
            maxLength={10}
            placeholder={ECoordinate.latitude}
            onChange={(ev) => onCoordinateChange(ev, ECoordinate.latitude)}
            value={props.lngLat[1]}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default Coordinate;
