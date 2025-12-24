import { spatialItems } from "../types/apiTypes";
import { EMarkerType, INDVISample } from "../store/mapStore";
import { getLocaleISOString } from "./dateUtils";
import { IChangePoint } from "src/types/generalTypes";

export const toFirstLetterUppercase = (a_String: string | null) => {
  if (!a_String) return;

  const firstLetter = a_String[0];
  const allLetters = a_String.split("");
  allLetters[0] = firstLetter.toUpperCase();
  return allLetters.join("");
};

export const jsonToCsv = (a_NDVISamples: INDVISample[], a_ChangePoints: IChangePoint[]) => {
  if (!a_NDVISamples.length) return "";

  const excludedSamples = a_NDVISamples.map(
    ({ ndviArray, preview, ...rest }) => {
      let exportedSample = {
        ...rest,
        valid_fraction: rest.valid_fraction.toFixed(2)+"%",
        filter_fraction: rest.filter_fraction.toFixed(2)+"%"
      }
      const changePoint = a_ChangePoints.find( p => p.id === rest.id )
      if(changePoint){
        return {
          ...exportedSample,
          "change point": true,
          "Z-Score": changePoint.z >= 0 ? `+${changePoint.z.toFixed(2)}` : `${changePoint.z.toFixed(2)}`
        }
      } else {
        return {
          ...exportedSample,
          "change point": false,
          "Z-Score": null
        }
      }
    },
  );


  const headers = Object.keys(excludedSamples[0]);

  const delimiter = ";";

  const csvRows = [
    headers.join(delimiter), // header row
    ...excludedSamples.map((sample) =>
      headers
        .map((header) => {
          const value = sample[header];
          // handle null / undefined safely
          return value === null || value === undefined
            ? "N/A"
            : `"${String(value).replace(/"/g, '""')}"`; //If a value itself contains a double quote ("), CSV requires it to be escaped by doubling it.
        })
        .join(delimiter),
    ),
  ];

  return csvRows.join("\n");
};

export const downloadCSV = (a_NDVISamples: INDVISample[], a_ChangePoints: IChangePoint[]) => {
  const csvString = jsonToCsv(a_NDVISamples, a_ChangePoints);

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const fileName = `exportedScenes_${getLocaleISOString(new Date(Date.now()))}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const isROIValid = (a_ROI: string, a_Marker: EMarkerType) => {
  let roi: any;

  try {
    roi = JSON.parse(a_ROI);
  } catch {
    return false;
  }

  switch (a_Marker) {
    case EMarkerType.point: {
      // Expected: [[lng, lat], radius]
      if (!Array.isArray(roi) || roi.length !== 2) return false;

      const [center, radius] = roi;
      if (!Array.isArray(center) || center.length !== 2) return false;
      for (const c of center) {
        if (isNaN(Number(c))) return false;
      }

      if (isNaN(Number(radius)) || Number(radius) <= 0) return false;

      return true;
    }
    case EMarkerType.polygon: {
      // Expected: [[lng, lat], [lng, lat], ...]
      if (!Array.isArray(roi) && roi.length < 4) return false;

      for (const coordinate of roi) {
        if (!Array.isArray(coordinate) || coordinate.length !== 2) return false;
        for (const l of coordinate) {
          if (isNaN(Number(l))) return false;
        }
      }
      return true;
    }
    default:
      return false;
  }
};

export const isDateValid = (a_Datetime: string) => {
  // Expected: 2025-12-12T09:48:12
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  return regex.test(a_Datetime);
};

export const isOperatorValid = (
  a_Op: string,
  a_Items: { title: string; value: string }[],
) => {
  return (
    a_Items.findIndex((i) => i.title.toLowerCase() == a_Op.toLowerCase()) !== -1
  );
};

export const isValidRange = (a_num: string, a_Min: number, a_Max: number) => {
  const number = Number(a_num);
  return !isNaN(number) && number >= a_Min && number <= a_Max;
};

export const isValidFilter = (a_Filter: string) => {
  return ["none", "z-score", "IQR"]
    .map((i) => i.toLowerCase())
    .includes(a_Filter.toLowerCase());
};

export const isValidBoolean = (a_Boolean: string) => {
  return ["false", "true"]
    .map((i) => i.toLowerCase())
    .includes(a_Boolean.toLowerCase());
};
