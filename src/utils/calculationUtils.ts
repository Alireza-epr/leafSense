import { INDVISample, TPercentage } from "../store/mapStore";
import { ESTACURLS, IStacItem, ITokenCollection } from "../types/apiTypes";
import { ESampleFilter, IChangePoint, INDVIPanel } from "../types/generalTypes";
import GeoTIFF, {
  fromUrl,
  GeoTIFFImage,
  ReadRasterResult,
  TypedArray,
} from "geotiff";
import proj4 from "proj4";

export const getFeatureToken = async (
  a_Id: string,
): Promise<ITokenCollection | null> => {
  const resp = await fetch(`${ESTACURLS.collectionTokenURL}${a_Id}`);
  if (!resp.ok) {
    const respJSON = await resp.json();
    console.error("Failed to get the collection token: ");
    console.error(respJSON);
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
    console.error("Failed to get the signed URL: " + respJSON.message);
    return "";
  }
  const respJSON = await resp.json();
  return respJSON.href;
};

export const readBandCOG = async (
  a_Url: string,
  a_Coordinates: [number, number][],
  a_ItemBBOX: [number, number, number, number],
) => {
  //console.log(new Date(Date.now()).toISOString()+ " fromURL start")
  const tiff = await fromUrl(a_Url);
  //console.log(new Date(Date.now()).toISOString()+ " getImage start")
  const image = await tiff.getImage();
  //console.log(new Date(Date.now()).toISOString()+ " readRasters start")
  /* const window = lngLatToPixel2(
    a_Coordinates,
    a_ItemBBOX,
    image.getWidth(),
    image.getHeight(),
  ); */

  const window = lngLatToPixel(a_Coordinates, image);
  const raster = await image.readRasters({ window });
  //console.log(new Date(Date.now()).toISOString()+ " readRasters end")
  return raster;
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

export const lngLatToPixel = (
  a_ROILngLat: [number, number][],
  a_Image: GeoTIFFImage,
) => {
  // 1. MapLibre gives coordinates in WGS84 / EPSG:4326 (lon/lat in degrees).
  // 2. GeoTIFF (e.g., Sentinel-2) is projected in UTM / EPSG:32632 (meters)
  // so conversion is required to transform MapLibre coordinates to the same projection before computing pixel indices.

  // Get the first tiepoint (top-left corner in projected coords)
  const tie = a_Image.getTiePoints()[0]; // {x, y, z, i, j, k}
  const originX = tie.x;
  const originY = tie.y;

  // Get pixel resolution
  const [resX, resY] = a_Image.getResolution(); // resX > 0, resY < 0
  const projection = a_Image.getGeoKeys().ProjectedCSTypeGeoKey
    ? `EPSG:${a_Image.getGeoKeys().ProjectedCSTypeGeoKey}`
    : "EPSG:4326"; // fallback

  // Transform each coordinate from WGS84 to TIFF CRS
  const pixels = a_ROILngLat.map(([lon, lat]) => {
    // Convert MapLibre lon/lat (degrees) → GeoTIFF CRS (meters) for pixel calculation
    const [x, y] = proj4("EPSG:4326", projection, [lon, lat]); // lon/lat -> projected
    const px = Math.floor((x - originX) / resX);
    const py = Math.floor((originY - y) / Math.abs(resY));
    // px, py = column (width) and row (height) of the pixel in the raster grid
    return [px, py];
  });

  // Compute window bounding box
  const xs = pixels.map(([px]) => px);
  const ys = pixels.map(([_, py]) => py);

  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);

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

export const toFloat32Array = (a_Arr: TypedArray): Float32Array => {
  if (a_Arr instanceof Float32Array) return a_Arr;
  return new Float32Array(a_Arr);
};

export const getNDVISample = (
  a_Id: number,
  a_Red: ReadRasterResult,
  a_Nir: ReadRasterResult,
  a_SCL: ReadRasterResult,
  a_NDVIPanel: INDVIPanel,
  a_Feature: IStacItem,
): INDVISample => {
  // Upscaling SCL
  const upscaledSCL: Uint8Array<ArrayBuffer> = getUpscaledSCL(
    a_SCL[0],
    a_SCL.width,
    a_SCL.height,
    a_Red.width,
    a_Red.height,
  );

  const r = toFloat32Array(a_Red[0] as TypedArray);
  const n = toFloat32Array(a_Nir[0] as TypedArray);
  const scl = upscaledSCL;
  let len = r.length;
  const ndviArray = new Float32Array(len);

  let validPixels = 0;
  let notValidPixels = 0;

  // Masking bad pixels
  for (let i = 0; i < len; i++) {
    if (isGoodPixel(scl[i])) {
      ++validPixels;
      ndviArray[i] = (n[i] - r[i]) / (n[i] + r[i]);
    } else {
      ++notValidPixels;
      ndviArray[i] = NaN;
    }
  }
  const validPixelsPercentage = (validPixels / len) * 100;
  const coverageThreshold = a_NDVIPanel.coverageThreshold;
  if (validPixelsPercentage < coverageThreshold) {
    const err = new Error(
      `Scene rejected: ${validPixelsPercentage.toFixed(2)}% valid pixels (required ≥ ${coverageThreshold}%).`,
    );
    err.cause = {
      ndviArray,
      n_valid: validPixels,
      valid_fraction: validPixelsPercentage,
    };
    throw err;
  }

  // Reject Outliers
  let filteredNDVIArray: {
    ndviArray: Float32Array<ArrayBuffer>;
    fraction: number;
  };
  switch (a_NDVIPanel.filter) {
    case ESampleFilter.IQR:
      filteredNDVIArray = rejectOutliersIQR(ndviArray);
      break;
    case ESampleFilter.zScore:
      filteredNDVIArray = rejectOutliersZScore(ndviArray);
      break;
    default:
      filteredNDVIArray = { ndviArray, fraction: 100 };
  }

  // Calculating mean and median
  const meanNDVI = getMeanNDVI(ndviArray);
  const medianNDVI = getMedianNDVI(ndviArray);

  return {
    featureId: a_Feature.id,
    id: a_Id,
    datetime: a_Feature.properties.datetime,
    preview: a_Feature.assets.rendered_preview.href,
    ndviArray: ndviArray,

    meanNDVI: meanNDVI,
    meanNDVISmoothed: meanNDVI,
    medianNDVI: medianNDVI,
    medianNDVISmoothed: medianNDVI,

    n_valid: validPixels,
    valid_fraction: validPixelsPercentage,

    filter: a_NDVIPanel.filter,
    filter_fraction: filteredNDVIArray.fraction,
  };
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

export const validateImportedROI = (a_JSON: any) => {
  // 1. Must contain "coordinates"
  if (!a_JSON || !a_JSON.coordinates) {
    return { valid: false, message: "Missing 'coordinates' key" };
  }

  const coords = a_JSON.coordinates;

  // 2. coordinates must be an array
  if (!Array.isArray(coords)) {
    return { valid: false, message: "'coordinates' must be an array" };
  }

  // 3. Validate each coordinate pair
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
        message: `Invalid coordinate at index ${i}. Expected [number, number].`,
      };
    }
  }

  // 4. Ensure at least 4 coordinate points
  if (coords.length < 4) {
    return { valid: false, message: "Minimum 4 coordinates required" };
  }

  return { valid: true };
};

export const getUpscaledSCL = (
  scl: number | TypedArray,
  sclWidth: number,
  sclHeight: number,
  targetWidth: number,
  targetHeight: number,
) => {
  const out = new Uint8Array(targetWidth * targetHeight);

  // Compute scale ratios between target (red) and source (scl)
  const scaleX = targetWidth / sclWidth; // e.g., 2/1 = 2
  const scaleY = targetHeight / sclHeight; // e.g., 3/2 = 1.5

  for (let y = 0; y < targetHeight; y++) {
    // Map high-res row back to low-res SCL row (nearest neighbor)
    // Example: red rows 0,1,2 → scl rows 0,1,1
    const srcY = Math.min(Math.floor(y / scaleY), sclHeight - 1);

    for (let x = 0; x < targetWidth; x++) {
      // Map high-res column back to low-res SCL column
      // Example: red cols 0,1 → scl col 0
      const srcX = Math.min(Math.floor(x / scaleX), sclWidth - 1);

      // Index in the source SCL array
      const srcIndex = srcY * sclWidth + srcX;

      // Index in the output array
      const dstIndex = y * targetWidth + x;

      // Copy nearest SCL pixel
      out[dstIndex] = scl[srcIndex];
    }
  }

  return out;
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

  const fractionValid = ((filteredNDVI.length / a_NDVI.length) * 100);

  return {
    ndviArray: new Float32Array(filteredNDVI),
    fraction: fractionValid,
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

  const fractionValid = ((filteredNDVI.length / a_NDVI.length) * 100);

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
      medianNDVISmoothed: medianValues.length ? avg(medianValues) : sample.medianNDVI,
    };
  });
};

export const detectChangePointsZScore = (
  a_ValidSamples: INDVISample[],
  a_Window = 5,
  a_ZThreshold = 2.5,
  a_MinSeparation = 2
): IChangePoint[] => {
  
  const ndvi = a_ValidSamples.map( s => s.meanNDVI as number )
  const datetimes = a_ValidSamples.map( s => s.datetime )

  const deltas: number[] = [];

  for (let i = 1; i < ndvi.length; i++) {
    deltas.push(ndvi[i] - ndvi[i - 1]);
  }
  const changes: IChangePoint[] = [];
  let lastIndex = -Infinity;

  for (let i = a_Window; i < deltas.length; i++) {
    const slice = deltas.slice(i - a_Window, i);

    const mean =
      slice.reduce((s, v) => s + v, 0) / slice.length;

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
}

