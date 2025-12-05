import { useMapStore } from "@/store/mapStore";
import {
  ESTACURLS,
  ISTACFilterRequest,
  EStacBands,
  IStacItem,
  ESTACCollections,
} from "../types/apiTypes";
import { CacheHandler } from "@/utils/apiUtils";
import {
  computeFeatureNDVI,
  getMeanNDVI,
  readBandCOG,
  getFeatureToken,
  isTokenExpired,
  upscaleSCL,
} from "../utils/calculationUtils";
import { ReadRasterResult, TypedArray } from "geotiff";

const cache = new CacheHandler();

export const useFilterSTAC = () => {
  const setResponseFeatures = useMapStore((state) => state.setResponseFeatures);
  const setErrorFeatures = useMapStore((state) => state.setErrorFeatures);

  const getFeatures = async (a_STACRequest: ISTACFilterRequest) => {
    if (cache.getCache(a_STACRequest)) {
      const respJSON = cache.getCache(a_STACRequest);
      console.log("Cached Features");
      console.log(respJSON);
      setResponseFeatures(respJSON);
      return;
    }

    // Retry: If the STAC request fails (network error, 500, 503, 429),
    // automatically try again a few times instead of failing immediately.

    // Backoff: After each failed attempt, wait longer before retrying
    // (e.g., 200ms → 400ms → 800ms). Prevents hammering the server.

    //console.log(new Date(Date.now()).toISOString()+" Get STAC Items")
    const retry = 5;
    let delay = 200;
    for (let i = 0; i <= retry; i++) {
      try {
        //console.log(new Date(Date.now()).toISOString()+" Get STAC Items: try"+ (i+1))
        const resp = await fetch(ESTACURLS.searchURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(a_STACRequest),
        });

        if (!resp.ok) {
          throw new Error("[useFilterSTAC] Response not ok");
        }

        const respJSON = await resp.json();
        console.log("Features");
        console.log(respJSON);
        cache.setCache(a_STACRequest, respJSON);
        setResponseFeatures(respJSON);
        return;
      } catch (err: any) {
        if (i == retry - 1) {
          setErrorFeatures(err); //give up
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  return {
    getFeatures,
  };
};

export const useNDVI = () => {
  const tokenCollection = useMapStore((state) => state.tokenCollection);
  const setSamples = useMapStore((state) => state.setSamples);
  const setNotValidSamples = useMapStore((state) => state.setNotValidSamples);
  const doneFeature = useMapStore((state) => state.doneFeature);
  const setDoneFeature = useMapStore((state) => state.setDoneFeature);
  const setErrorNDVI = useMapStore((state) => state.setErrorNDVI);

  const getNDVI = async (
    a_Features: IStacItem[],
    a_Coordinates: [number, number][],
    a_CoverageThreshold: number
  ) => {
    const bandKeys = [EStacBands.nir, EStacBands.red, EStacBands.scl];
    const rasters: { band: EStacBands; raster: ReadRasterResult | null }[] =
      bandKeys.map((b) => {
        return {
          band: b,
          raster: null,
        };
      });
    let meanNDVIs: {
      id: number;
      datetime: string;
      NDVI: number | null;
    }[] = [];
    let countId = 1;

    setDoneFeature(1);
    for (const feature of a_Features) {
      try {
        //console.log(new Date(Date.now()).toISOString()+" Start Calculating NDVI for STAC Item id "+ feature.id)
        const cacheKey = `${JSON.stringify(a_Coordinates)}_${feature.id}_${a_CoverageThreshold}`;
        if (cache.getCache(cacheKey)) {
          console.log("Cached NDVI");
          const cachedFeature = cache.getCache(cacheKey);
          console.log(cachedFeature);
          meanNDVIs.push(cachedFeature);
          ++countId;
          setDoneFeature((prev) => ++prev);
          continue;
        }

        for (const bandKey of bandKeys) {
          const bandAsset = feature.assets[bandKey];
          const bandURL = bandAsset.href;

          if (!bandURL) {
            console.error(`${bandKey}: URL not defined`);
            continue;
          }
          const bandSignedURL = `${bandURL}?${tokenCollection?.token}`;
          if (bandSignedURL.length == 0) {
            console.error(`${bandKey}: SignedURL not defined`);
            continue;
          }
          const bandRasterResult = await readBandCOG(
            bandSignedURL,
            a_Coordinates,
            feature.bbox as [number, number, number, number],
          );
          const bandRaster = rasters.find((r) => r.band == bandKey);
          bandRaster!.raster = bandRasterResult;
        }

        //Each NDVI value corresponds to one pixel, i.e., 10m × 10m on the ground.
        /* 
        ndvi[0]  = pixel at (xMin, yMin)       ← top-left of your ROI
        ndvi[1]  = next pixel to the right
        ndvi[2]  = next pixel to the right
        ...

        */
        const nirRaster = rasters.find((r) => r.band == EStacBands.nir)?.raster;
        const redRaster = rasters.find((r) => r.band == EStacBands.red)?.raster;
        const SCLRaster = rasters.find((r) => r.band == EStacBands.scl)?.raster;
        if (nirRaster && redRaster && SCLRaster) {
          let upscaledSCL: Uint8Array<ArrayBuffer> = upscaleSCL(
            SCLRaster[0],
            SCLRaster.width,
            SCLRaster.height,
            redRaster.width,
            redRaster.height,
          );
          const featureNDVI = computeFeatureNDVI(
            redRaster[0] as TypedArray,
            nirRaster[0] as TypedArray,
            upscaledSCL as TypedArray,
            a_CoverageThreshold
          );
          //console.log(new Date(Date.now()).toISOString()+ " " +featureNDVI.length + " pixels from the Sentinel-2 image for the given ROI")
          const featureMeanNDVI = getMeanNDVI(
            featureNDVI,
            feature.properties.datetime,
          );
          //console.log(new Date(Date.now()).toISOString()+" NDVI for "+ feature.id)

          cache.setCache(cacheKey, { ...featureMeanNDVI, id: countId });
          meanNDVIs.push({ ...featureMeanNDVI, id: countId });
        } else {
          throw new Error("Scene rejected: rasters are undefined");
        }

        ++countId;
        setDoneFeature((prev) => ++prev);
      } catch (error: any) {
        meanNDVIs.push({
          id: countId,
          NDVI: null,
          datetime: feature.properties.datetime,
        });
        console.error(error);
        ++countId;
        setDoneFeature((prev) => ++prev);
        continue;
      }
    }
    const validSamples = meanNDVIs.filter((m) => m.NDVI);
    const notValidSamples = meanNDVIs.filter((m) => !m.NDVI);
    setNotValidSamples(notValidSamples);
    if (validSamples.length > 0) {
      setSamples(validSamples);
    } else {
      setErrorNDVI(new Error("No valid scene"));
    }
  };

  return {
    getNDVI,
  };
};

export const useTokenCollection = () => {
  const tokenCollection = useMapStore((state) => state.tokenCollection);
  const setTokenCollection = useMapStore((state) => state.setTokenCollection);

  const getTokenCollection = async () => {
    try {
      if (!tokenCollection) {
        const token = await getFeatureToken(ESTACCollections.Sentinel2l2a);
        setTokenCollection(token);
      } else if (isTokenExpired(tokenCollection)) {
        const token = await getFeatureToken(ESTACCollections.Sentinel2l2a);
        setTokenCollection(token);
      } else {
        setTokenCollection((prev) => {
          const validToken = prev!.token;
          return {
            "msft:expiry": prev?.["msft:expiry"] ? prev?.["msft:expiry"] : "",
            token: validToken,
          };
        });
      }
    } catch (error) {
      console.log("useTokenCollection error");
      console.log(error);
      setTokenCollection(null);
    }
  };

  return {
    getTokenCollection,
  };
};
