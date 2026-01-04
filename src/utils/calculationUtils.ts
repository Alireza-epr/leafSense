import {
  ELogLevel,
  IChangePoint,
  INDVISample, 
  ESTACURLS, 
  ITokenCollection
} from "../types";
import { log } from "./generalUtils";

export const getFeatureToken = async (
  a_Id: string,
): Promise<ITokenCollection | null> => {
  const resp = await fetch(`${ESTACURLS.collectionTokenURL}${a_Id}`);
  if (!resp.ok) {
    const respJSON = await resp.json();
    log("Failed to get the collection token: ", respJSON, ELogLevel.error);
    return null;
  }
  const respJSON = await resp.json();
  return respJSON;
};

export const isTokenExpired = (a_Token: ITokenCollection): boolean => {
  const expiredDateUTCString = a_Token["msft:expiry"]; // '2025-11-26T11:08:13Z'
  const expiredDateUTC = new Date(expiredDateUTCString).getTime(); // ms since 1970
  const nowDateUTC = Date.now(); // ms since 1970

  return nowDateUTC >= expiredDateUTC;
};

export const getSignedURL = async (a_Url: string) => {
  const resp = await fetch(`${ESTACURLS.signURL}${a_Url}`);
  /* console.log("resp")
  console.log(resp) */
  if (!resp.ok) {
    const respJSON = await resp.json();
    log("Failed to get the signed URL: ", respJSON.message, ELogLevel.error);
    return "";
  }
  const respJSON = await resp.json();
  return respJSON.href;
};

export const lngLatToPixel2 = (
  a_ROILngLat: [number, number][],
  a_STACItemBBox: [number, number, number, number],
  a_Width: number,
  a_Height: number,
) => {
  const [minLon, minLat, maxLon, maxLat] = a_STACItemBBox;

  const xs = a_ROILngLat.map(([lon]) =>
    Math.floor(((lon - minLon) / (maxLon - minLon)) * a_Width),
  );
  const ys = a_ROILngLat.map(([_, lat]) =>
    Math.floor(((maxLat - lat) / (maxLat - minLat)) * a_Height),
  );

  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  //const p1 = pixelToLngLat(x0, y0, a_STACItemBBox, a_Width, a_Height);
  //const p2 = pixelToLngLat(x1, y1, a_STACItemBBox, a_Width, a_Height);

  return [x0, y0, x1, y1];
};

export const pixelToLngLat = (
  x: number,
  y: number,
  bbox: [number, number, number, number],
  width: number,
  height: number,
) => {
  const [minLon, minLat, maxLon, maxLat] = bbox;

  const lng = minLon + (x / width) * (maxLon - minLon);
  const lat = maxLat - (y / height) * (maxLat - minLat);

  return { lng, lat };
};

export const getMeanNDVI = (a_NDVI: Float32Array<ArrayBufferLike>) => {
  let sum = 0;
  let count = 0;

  for (const n of a_NDVI) {
    if (!isNaN(n) && isFinite(n)) {
      sum += n;
      ++count;
    }
  }

  return count > 0 ? sum / count : null;
};

export const getMedianNDVI = (a_NDVI: Float32Array<ArrayBufferLike>) => {
  const sorted = Float32Array.from(a_NDVI)
    .filter((n) => !isNaN(n) && isFinite(n))
    .sort((a, b) => a - b);
  if (sorted.length == 0) {
    return null;
  }
  const len = sorted.length;
  if (len == 1) {
    return sorted[0] as number;
  }
  const mid = Math.floor(len / 2);
  if (len % 2) {
    // Even
    return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  } else {
    //Odd
    return sorted[mid] as number;
  }
};

export const getMean = (a_Array: (number | null)[]) => {
  let sum = 0;
  let count = 0;

  for (const n of a_Array) {
    if (n !== null && !isNaN(n) && isFinite(n)) {
      sum += n;
      ++count;
    }
  }

  return count > 0 ? sum / count : null;
};

export const validateImportedROI = (a_JSON: any) => {

  if (!Array.isArray(a_JSON)) {
    return { valid: false, message: "Data must be an array of zones or points" };
  }

  for (let idx = 0; idx < a_JSON.length; idx++) {
    const item = a_JSON[idx];
    const key = Object.keys(item)[0]; // e.g., "zonal-1" or "point"
    const value = item[key];

    if (!value || !value.coordinates) {
      return { valid: false, message: `Missing 'coordinates' for '${key}'` };
    }

    const coords = value.coordinates;

    if (!Array.isArray(coords)) {
      return { valid: false, message: `'coordinates' for '${key}' must be an array` };
    }

    // Validate each coordinate pair
    for (let i = 0; i < coords.length; i++) {
      const pair = coords[i];

      if (
        !Array.isArray(pair) ||
        pair.length !== 2 ||
        typeof pair[0] !== "number" ||
        typeof pair[1] !== "number"
      ) {
        return {
          valid: false,
          message: `Invalid coordinate at index ${i} for '${key}'. Expected [number, number].`,
        };
      }
    }

    // Zones must have at least 3 coordinates
    if (key.startsWith("zonal") && coords.length < 3) {
      return { valid: false, message: `'${key}' must have at least 3 coordinates` };
    }

    // Points must have exactly 1 coordinate; radius is optional
    if (key === "point" && coords.length !== 1) {
      return { valid: false, message: `'point' must have exactly 1 coordinate` };
    }

    if (key === "point" && value.radius !== undefined && typeof value.radius !== "number") {
      return { valid: false, message: `'radius' for 'point' must be a number if provided` };
    }
  }

  return { valid: true };
};

export const isGoodPixel = (sclValue: number) => {
  const bad = new Set([0, 1, 3, 6, 8, 9, 10]);
  //0 - NO_DATA
  //1 - SATURATED_OR_DEFECTIVE
  //3 - CLOUD_SHADOWS
  //6 - WATER
  //8 - CLOUD_MEDIUM_PROBABILITY
  //9 - CLOUD_HIGH_PROBABILITY
  //10 - THIN_CIRRUS
  return !bad.has(sclValue);
  const noBad = new Set([0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11]);
  return noBad.has(sclValue);
};

const meterToDegreeOffsets = (a_Lat: number, a_Meters = 5) => {
  // Earth radius approximation
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((a_Lat * Math.PI) / 180);

  const dy = a_Meters / metersPerDegLat;
  const dx = a_Meters / metersPerDegLng;

  return { dx, dy };
};

export const getLngLatsFromMarker = (
  a_LngLat: maplibregl.LngLat,
): [number, number][] => {
  /* 
  ( lng - dx , lat + dy ) ----> ( lng + dx , lat + dy )
      ^                         |
      |     (lng , lat)         |
      |                         v
  ( lng - dx , lat - dy ) <---- ( lng + dx , lat - dy ) 
  */
  const { lng, lat } = a_LngLat;
  const { dx, dy } = meterToDegreeOffsets(a_LngLat.lat);

  const lngLats: [number, number][] = [
    [lng - dx, lat + dy],
    [lng + dx, lat + dy],
    [lng + dx, lat - dy],
    [lng - dx, lat - dy],
  ];

  return lngLats;
};

export const rejectOutliersIQR = (a_NDVI: Float32Array) => {
  const validSortedNDVI = Array.from(a_NDVI)
    .filter((v) => !isNaN(v))
    .sort((a, b) => a - b);

  const q1Index = Math.floor(0.25 * validSortedNDVI.length);
  const q3Index = Math.floor(0.75 * validSortedNDVI.length);
  const q1 = validSortedNDVI[q1Index];
  const q3 = validSortedNDVI[q3Index];
  const IQR = q3 - q1;
  const lowIQR = q1 - 1.5 * IQR;
  const highIQR = q3 + 1.5 * IQR;
  const filteredNDVI = a_NDVI.filter(
    (ndvi) => ndvi >= lowIQR && ndvi <= highIQR,
  );

  const fractionValid = (filteredNDVI.length / a_NDVI.length) * 100;

  return {
    ndviArray: new Float32Array(filteredNDVI),
    fraction: a_NDVI.length == 0 ? 0 : fractionValid,
  };
};

export const rejectOutliersZScore = (a_NDVI: Float32Array, a_Threshold = 2) => {
  const validNDVI = Array.from(a_NDVI).filter((v) => !isNaN(v));

  if (validNDVI.length === 0) {
    return { ndviArray: new Float32Array(), fraction: 0 };
  }

  const mean = validNDVI.reduce((sum, val) => sum + val, 0) / validNDVI.length;

  const variance =
    validNDVI.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
    validNDVI.length;
  const stdDev = Math.sqrt(variance);

  const filteredNDVI = validNDVI.filter(
    (ndvi) => Math.abs(ndvi - mean) <= a_Threshold * stdDev,
  );

  const fractionValid = (filteredNDVI.length / a_NDVI.length) * 100;

  return {
    ndviArray: new Float32Array(filteredNDVI),
    fraction: fractionValid,
  };
};

export const getSmoothNDVISamples = (
  a_Samples: INDVISample[],
  a_WindowSize: number = 3,
): INDVISample[] => {
  if (a_WindowSize < 2) return a_Samples;

  const half = Math.floor(a_WindowSize / 2);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return a_Samples.map((sample, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(a_Samples.length - 1, i + half);

    const window = a_Samples.slice(start, end + 1);

    const meanValues = window
      .map((s) => s.meanNDVI)
      .filter((v): v is number => v !== null);

    const medianValues = window
      .map((s) => s.medianNDVI)
      .filter((v): v is number => v !== null);
    return {
      ...sample,
      meanNDVISmoothed: meanValues.length ? avg(meanValues) : sample.meanNDVI,
      medianNDVISmoothed: medianValues.length
        ? avg(medianValues)
        : sample.medianNDVI,
    };
  });
};

export const detectChangePointsZScore = (
  a_ValidSamples: INDVISample[],
  a_Window = 5,
  a_ZThreshold = 2.5,
  a_MinSeparation = 2,
): IChangePoint[] => {
  const ndvi = a_ValidSamples.map((s) => s.meanNDVI as number);
  const datetimes = a_ValidSamples.map((s) => s.datetime);

  const deltas: number[] = [];

  for (let i = 1; i < ndvi.length; i++) {
    deltas.push(ndvi[i] - ndvi[i - 1]);
  }
  const changes: IChangePoint[] = [];
  let lastIndex = -Infinity;

  for (let i = a_Window; i < deltas.length; i++) {
    const slice = deltas.slice(i - a_Window, i);

    const mean = slice.reduce((s, v) => s + v, 0) / slice.length;

    const variance =
      slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length;

    const std = Math.sqrt(variance);
    if (std === 0) continue;

    const z = (deltas[i] - mean) / std;

    if (Math.abs(z) >= a_ZThreshold && i - lastIndex >= a_MinSeparation) {
      changes.push({
        id: a_ValidSamples[i + 1].id,
        datetime: datetimes[i + 1],
        delta: deltas[i],
        z,
        reason: "z-score",
      });
      lastIndex = i;
    }
  }

  return changes;
};
