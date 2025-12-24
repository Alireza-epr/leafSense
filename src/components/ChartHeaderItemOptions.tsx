
import { ReactNode, useCallback } from "react"
import chartHeaderItemOptionsStyle from "./ChartHeaderItemOptions.module.scss"
import Section from "./Section"
import RangeInput from "./RangeInput"
import { IChartHeaderItemOption } from "src/types/generalTypes"

export interface ChartHeaderItemOptionsProps {
    //active: string,
    options: IChartHeaderItemOption[],
    onOption: (a_Valud: IChartHeaderItemOption) => void
}

const ChartHeaderItemOptions = (props: ChartHeaderItemOptionsProps) => {

    const onChangeOption = useCallback((a_Value: string, a_Option: IChartHeaderItemOption)=>{
        props.onOption({
            ...a_Option,
            value: a_Value
        })
    },[])

    return (
        <div className={` ${chartHeaderItemOptionsStyle.wrapper}`} onClick={(e) => e.stopPropagation()}>
            {props.options.map((option, index )=>
                <Section
                    title={option.title+ " - " + option.value}
                    key={index}
                >
                    <RangeInput
                        value={option.value}
                        onRangeChange={(v)=>onChangeOption(v, option)}
                        max={option.max}
                        min={option.min}
                        step={option.step}
                    >
                    </RangeInput>
                </Section>
            )}
        </div>
    )
}

export default ChartHeaderItemOptions
