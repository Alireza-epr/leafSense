export const parseURL = (a_Search: string) => {
  const params = new URLSearchParams(a_Search);
  const roi = params.get("roi");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");

  console.log("parseURL");
  console.log({
    roi: roi ? JSON.parse(roi) : [],
    startDate: startDate || "",
    endDate: endDate || "",
  });

  return {
    roiParam: roi ? JSON.parse(roi) : [],
    startDateParam: startDate || "",
    endDateParam: endDate || "",
  };
};

export const serializeURL = (
  a_ROI: number[][],
  a_StartDate: string,
  a_EndDate: string,
) => {
  const params = new URLSearchParams();
  if (a_ROI) params.set("roi", JSON.stringify(a_ROI));
  if (a_StartDate) params.set("startDate", a_StartDate);
  if (a_EndDate) params.set("endDate", a_EndDate);
  console.log("serializeURL");
  console.log(`?${params.toString()}`);
  return `?${params.toString()}`;
};
