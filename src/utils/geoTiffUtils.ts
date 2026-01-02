import GeoTIFF, {
  fromUrl,
  GeoTIFFImage,
  ReadRasterResult,
  TypedArray,
} from "geotiff";
import proj4 from "proj4";
import { getMeanNDVI, getMedianNDVI, isGoodPixel, rejectOutliersIQR, rejectOutliersZScore } from "./index";
import { ERejection, ESampleFilter, INDVIPanel, INDVISample, IRejection, IStacItem } from "../types";

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
  let notValidPixels: IRejection = {
    NO_DATA: 0,
    SATURATED_OR_DEFECTIVE: 0,
    CLOUD_SHADOWS: 0,
    WATER: 0,
    CLOUD_MEDIUM_PROBABILITY: 0,
    CLOUD_HIGH_PROBABILITY: 0,
    THIN_CIRRUS: 0,
  };

  // Masking bad pixels
  for (let i = 0; i < len; i++) {
    if (isGoodPixel(scl[i])) {
      ++validPixels;
      ndviArray[i] = (n[i] - r[i]) / (n[i] + r[i]);
    } else {
      switch (scl[i]) {
        case ERejection.NO_DATA:
          ++notValidPixels.NO_DATA;
          break;
        case ERejection.SATURATED_OR_DEFECTIVE:
          ++notValidPixels.SATURATED_OR_DEFECTIVE;
          break;
        case ERejection.CLOUD_SHADOWS:
          ++notValidPixels.CLOUD_SHADOWS;
          break;
        case ERejection.WATER:
          ++notValidPixels.WATER;
          break;
        case ERejection.CLOUD_MEDIUM_PROBABILITY:
          ++notValidPixels.CLOUD_MEDIUM_PROBABILITY;
          break;
        case ERejection.CLOUD_HIGH_PROBABILITY:
          ++notValidPixels.CLOUD_HIGH_PROBABILITY;
          break;
        case ERejection.THIN_CIRRUS:
          ++notValidPixels.THIN_CIRRUS;
          break;
      }
      ndviArray[i] = NaN;
    }
  }
  const validPixelsPercentage = (validPixels / len) * 100;
  const notValidPixelsPercentage = Object.keys(notValidPixels).reduce(
    (acc, key) => {
      const k = key as keyof IRejection;
      acc[k] = (notValidPixels[k] / len) * 100;
      return acc;
    },
    {} as IRejection,
  );

  const coverageThreshold = a_NDVIPanel.coverageThreshold;
  if (validPixelsPercentage < coverageThreshold) {
    const err = new Error(
      `Scene rejected: ${validPixelsPercentage.toFixed(2)}% valid pixels (required ≥ ${coverageThreshold}%).`,
    );
    err.cause = {
      ndviArray,
      n_valid: validPixels,
      valid_fraction: validPixelsPercentage,
      not_valid_fraction: notValidPixelsPercentage,
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
    not_valid_fraction: notValidPixelsPercentage,

    filter: a_NDVIPanel.filter,
    filter_fraction: filteredNDVIArray.fraction,
  };
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