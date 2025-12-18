import chartListItemStyles from "./ChartListRow.module.scss";
import ChartListRowItem from "./ChartListRowItem";

const ChartListRowHeader = () => {
  return (
    <div className={` ${chartListItemStyles.wrapper}`}>
      <ChartListRowItem title="Preview" isHeaderItem={true}>
        Preview
      </ChartListRowItem>

      <ChartListRowItem title="Datetime" isHeaderItem={true}>
        Datetime
      </ChartListRowItem>

      <ChartListRowItem title="Mean" isHeaderItem={true}>
        Mean
      </ChartListRowItem>

      <ChartListRowItem title="Median" isHeaderItem={true}>
        Median
      </ChartListRowItem>

      <ChartListRowItem title="Valid Pixels" isHeaderItem={true}>
        Valid Pixels
      </ChartListRowItem>

      <ChartListRowItem title="Valid Fraction" isHeaderItem={true}>
        Valid Fraction
      </ChartListRowItem>

      <ChartListRowItem title="Filter" isHeaderItem={true}>
        Filter
      </ChartListRowItem>

      <ChartListRowItem title="Filter Fraction" isHeaderItem={true}>
        Filter Fraction
      </ChartListRowItem>

      <ChartListRowItem title="Download" isHeaderItem={true}>
        Download
      </ChartListRowItem>
    </div>
  );
};

export default ChartListRowHeader;
