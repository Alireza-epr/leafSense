import { ReactNode, useCallback } from "react";
import chartHeaderItemOptionsStyle from "./ChartHeaderItemOptions.module.scss";
import Section from "./Section";
import RangeInput from "./RangeInput";
import { IChartHeaderItemOption } from "../types/generalTypes";
import { useMapStore } from "../store/mapStore";

export interface ChartHeaderItemOptionsProps {
  activeItem?: number;
  isList?: boolean;
  options: IChartHeaderItemOption[];
  onOption: (a_Valud: IChartHeaderItemOption) => void;
  "data-testid"?: string
}

const ChartHeaderItemOptions = (props: ChartHeaderItemOptionsProps) => {
  const onSelectOption = useCallback((a_Option: IChartHeaderItemOption) => {
    props.onOption(a_Option);
  }, []);

  const onChangeOption = useCallback(
    (a_Value: string, a_Option: IChartHeaderItemOption) => {
      props.onOption({
        ...a_Option,
        value: a_Value,
      });
    },
    [],
  );

  return (
    <div
      className={` ${chartHeaderItemOptionsStyle.wrapper}`}
      style={{
        right: props.options.every((o) => o.subtitle) ? 0 : "",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {props.isList
        ? props.options.map((option, index) => (
            <Section
              title={option.title}
              key={index}
              onSection={() => onSelectOption(option)}
              active={props.activeItem == option.id}
            >
              {option.subtitle}
            </Section>
          ))
        : props.options.map((option, index) => (
            <Section title={option.title + " - " + option.value} key={index}>
              <RangeInput
                value={option.value}
                onRangeChange={(v) => onChangeOption(v, option)}
                max={option.max}
                min={option.min}
                step={option.step}
                data-testid={index == 0 ? props["data-testid"]: ""}
              ></RangeInput>
            </Section>
          ))}
    </div>
  );
};

export default ChartHeaderItemOptions;
