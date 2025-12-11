import chartListRowItem from "./ChartListRowItem.module.scss"

export interface IChartListRowItemProps {
  isHeaderItem?: boolean,
  isSceneNotValid?: boolean
  title: string,
  children: React.ReactNode
}

const ChartListRowItem = (props: IChartListRowItemProps) => {
  return (
    <div 
      className={` ${chartListRowItem.wrapper}`} 
      title={props.title}
      style={{
        backgroundColor: props.isSceneNotValid ? "#e29c45" : props.isHeaderItem ? "#476d6c" : ""
      }}
    >
      <div className={` ${chartListRowItem.item}`}>
        {props.children}
      </div>
    </div>
  )
}

export default ChartListRowItem
