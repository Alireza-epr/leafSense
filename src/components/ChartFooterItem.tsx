import chartFooterItemStyles from "./ChartFooterItem.module.scss"

export interface IChartFooterItemProps {
    title: string,
    value: string | number
}
const ChartFooterItem = (props: IChartFooterItemProps) => {
  return (
    <div className={` ${chartFooterItemStyles.footerItem}`}>
        <div className={` ${chartFooterItemStyles.footerItemTitle}`}>{props.title}</div>
        <div className={` ${chartFooterItemStyles.footerItemValue}`} title={`${props.value}`}>{props.value}</div>
    </div>
  )
}

export default ChartFooterItem
