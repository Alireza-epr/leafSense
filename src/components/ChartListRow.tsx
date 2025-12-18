import { getDatetime, getLocaleISOString } from "../utils/dateUtils";
import { INDVISample } from "../store/mapStore";
import chartListItemStyles from "./ChartListRow.module.scss";
import ChartListRowItem from "./ChartListRowItem";

export interface IChartListItemProps {
  item: INDVISample;
}

const ChartListRow = (props: IChartListItemProps) => {
  const handleDownloadScene = () => {
    const exportedScene = props.item;

    const link = document.createElement("a");
    link.download = `exportedScene${props.item.id}_${getLocaleISOString(new Date(Date.now()))}.json`;

    const blob = new Blob([JSON.stringify(exportedScene, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    link.href = url;

    link.click();

    URL.revokeObjectURL(url);
  };

  const handleDownloadPreview = () => {
    const exportedPreview = props.item.preview;

    const link = document.createElement("a");

    const url = exportedPreview;
    link.href = url;
    link.target = "_blank";

    link.click();
  };
  return (
    <div className={` ${chartListItemStyles.wrapper}`}>
      <ChartListRowItem
        title="Preview"
        isSceneNotValid={props.item.meanNDVI == null}
      >
        <img
          src={props.item.preview}
          alt="Preview"
          onClick={handleDownloadPreview}
        />
      </ChartListRowItem>

      <ChartListRowItem
        title={getDatetime(props.item.datetime)}
        isSceneNotValid={props.item.meanNDVI == null}
      >
        {getDatetime(props.item.datetime)}
      </ChartListRowItem>

      <ChartListRowItem
        title={`${props.item.meanNDVI}`}
        isSceneNotValid={props.item.meanNDVI == null}
      >
        {props.item.meanNDVI ?? "N/A"}
      </ChartListRowItem>

      <ChartListRowItem
        title={`${props.item.medianNDVI}`}
        isSceneNotValid={props.item.meanNDVI == null}
      >
        {props.item.medianNDVI ?? "N/A"}
      </ChartListRowItem>

      <ChartListRowItem
        title={`${props.item.n_valid}`}
        isSceneNotValid={props.item.meanNDVI == null}
      >
        {props.item.n_valid}
      </ChartListRowItem>

      <ChartListRowItem
        title={`${props.item.valid_fraction}`}
        isSceneNotValid={props.item.meanNDVI == null}
      >
        {props.item.valid_fraction}
      </ChartListRowItem>

      <ChartListRowItem
        title={`${props.item.filter}`}
        isSceneNotValid={props.item.meanNDVI == null}
      >
        {props.item.filter}
      </ChartListRowItem>

      <ChartListRowItem
        title={`${props.item.filter_fraction}`}
        isSceneNotValid={props.item.meanNDVI == null}
      >
        {props.item.filter_fraction}
      </ChartListRowItem>

      <ChartListRowItem
        title="Download Scene"
        isSceneNotValid={props.item.meanNDVI == null}
      >
        <img
          src="./images/download.svg"
          alt="Download"
          style={{ width: "60%", border: "0" }}
          onClick={handleDownloadScene}
        />
      </ChartListRowItem>
    </div>
  );
};

export default ChartListRow;
