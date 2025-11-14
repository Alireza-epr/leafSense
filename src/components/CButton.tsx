import buttonStyles from "./CButton.module.scss"

export interface ICButtonProps {
    title: string,
    onButtonClick: () => void
}
const CButton = (props: ICButtonProps) => {
  return (
    <div 
        className={` ${buttonStyles.wrapper}`} 
        onClick={props.onButtonClick}
    >
      <div
        className={` ${buttonStyles.button}`}
      >
        { props.title }
      </div>
    </div>
  )
}

export default CButton
