import { ERequestContext, INDVISample, useMapStore } from "../store/mapStore";
import {
  ESTACURLS,
  ISTACFilterRequest,
  EStacAssetsKey,
  IStacItem,
  ESTACCollections,
  ITokenCollection,
} from "../types/apiTypes";
import { CacheHandler } from "../utils/apiUtils";
import {
  readBandCOG,
  getFeatureToken,
  isTokenExpired,
  getNDVISample,
} from "../utils/calculationUtils";
import { ReadRasterResult, TypedArray } from "geotiff";
import { ELogLevel, INDVIPanel } from "../types/generalTypes";
import { log } from "../utils/generalUtils";

const cache = new CacheHandler();
let tokenCollection: ITokenCollection | null = null;
let inFlight: Promise<ITokenCollection | null> | null = null;

export const setTokenCollection = async (): Promise<ITokenCollection | null> => {
  try {
    if (
      !tokenCollection ||
      isTokenExpired(tokenCollection)
    ) {
      if (!inFlight) {
        inFlight = getFeatureToken(ESTACCollections.Sentinel2l2a)
          .finally(() => {
            inFlight = null;
          });
      }
      tokenCollection = await inFlight;
    }
    return tokenCollection;
  } catch (error) {
    log("setTokenCollection error", error, ELogLevel.error);
    tokenCollection = null;
    inFlight = null;
    return null;
  }
};

export const useFilterSTAC = () => {
  const setResponseFeatures = useMapStore((state) => state.setResponseFeatures);
  const setErrorFeatures = useMapStore((state) => state.setErrorFeatures);

  const getFeatures = async (a_STACRequest: ISTACFilterRequest, a_RequestContext: ERequestContext) => {
    if (cache.getCache(a_STACRequest)) {
      const respJSON = cache.getCache(a_STACRequest);
      log("Cached Features hit"+`_${a_RequestContext}`, respJSON);
      const token = await setTokenCollection()
      if(!token) {
        throw new Error("[useFilterSTAC] Failed to get token")
      }
      setResponseFeatures(prev=>({
        ...prev,
        [a_RequestContext]: respJSON
      }));
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
        log("Cached Features missed"+`_${a_RequestContext}`, respJSON);
        cache.setCache(a_STACRequest, respJSON);
        const token = await setTokenCollection()
        if(!token) {
          throw new Error("[useFilterSTAC] Failed to get token")
        }
        setResponseFeatures(prev=>({
          ...prev,
          [a_RequestContext]: respJSON
        }));
        return;
      } catch (err: any) {
        if (i == retry - 1) {
          setErrorFeatures(prev=>({
            ...prev,
            [a_RequestContext]: err
          })); //give up
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
  const setSamples = useMapStore((state) => state.setSamples);
  const setNotValidSamples = useMapStore((state) => state.setNotValidSamples);
  const doneFeature = useMapStore((state) => state.doneFeature);
  const setDoneFeature = useMapStore((state) => state.setDoneFeature);
  const setGlobalLoading = useMapStore((state) => state.setGlobalLoading);

  const getNDVI = async (
    a_Features: IStacItem[],
    a_Coordinates: [number, number][],
    a_NDVIPanel: INDVIPanel,
    a_RequestContext: ERequestContext
  ) => {
    const bandKeys = [
      EStacAssetsKey.nir,
      EStacAssetsKey.red,
      EStacAssetsKey.scl,
    ];
    const rasters: { band: EStacAssetsKey; raster: ReadRasterResult | null }[] =
      bandKeys.map((b) => {
        return {
          band: b,
          raster: null,
        };
      });
    let counter = {
      main: 1,
      comparison: 1
    };

    setDoneFeature(prev=>({
      ...prev,
      [a_RequestContext]: 1
    }));
    setSamples(prev=>({
      ...prev,
      [a_RequestContext]: []
    }));
    setNotValidSamples(prev=>({
      ...prev,
      [a_RequestContext]: []
    }));
    for (const feature of a_Features) {
      const cacheKey = `${JSON.stringify(a_Coordinates)}_${feature.id}_${JSON.stringify(a_NDVIPanel)}`;
      try {
        //console.log(new Date(Date.now()).toISOString()+" Start Calculating NDVI for STAC Item id "+ feature.id)
        if (cache.getCache(cacheKey)) {
          const cachedNDVI = cache.getCache(cacheKey) as INDVISample;
          const updatedId: INDVISample = {
            ...cachedNDVI,
            id: counter[a_RequestContext],
          };
          log("Cached NDVI hit"+`_${a_RequestContext}`,updatedId);
          if (cachedNDVI.meanNDVI) {
            setSamples(prev=>({
              ...prev,
              [a_RequestContext]: [...prev[a_RequestContext], updatedId]
            }));
          } else {
            setNotValidSamples(prev=>({
              ...prev,
              [a_RequestContext]: [...prev[a_RequestContext], updatedId]
            }));
          }
          counter[a_RequestContext] = counter[a_RequestContext] + 1;
          setDoneFeature(prev=>({
            ...prev,
            [a_RequestContext]: prev[a_RequestContext] + 1
          }));
          continue;
        }

        for (const bandKey of bandKeys) {
          const bandAsset = feature.assets[bandKey];
          const bandURL = bandAsset.href;

          if (!bandURL) {
            log("[getNDVI] BandURL not defined", `${bandKey}`, ELogLevel.error);
            continue;
          }
          const bandSignedURL = `${bandURL}?${tokenCollection?.token}`;
          if (bandSignedURL.length == 0) {
            log("[getNDVI] SignedURL not defined", `${bandKey}`, ELogLevel.error);
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
        const nirRaster = rasters.find(
          (r) => r.band == EStacAssetsKey.nir,
        )?.raster;
        const redRaster = rasters.find(
          (r) => r.band == EStacAssetsKey.red,
        )?.raster;
        const SCLRaster = rasters.find(
          (r) => r.band == EStacAssetsKey.scl,
        )?.raster;
        if (nirRaster && redRaster && SCLRaster) {
          const ndviSample = getNDVISample(
            counter[a_RequestContext],
            redRaster,
            nirRaster,
            SCLRaster,
            a_NDVIPanel,
            feature,
          );
          //console.log(new Date(Date.now()).toISOString()+ " " +featureNDVI.length + " pixels from the Sentinel-2 image for the given ROI")
          //console.log(new Date(Date.now()).toISOString()+" NDVI for "+ feature.id)
          log("Cached NDVI missed"+`_${a_RequestContext}`, ndviSample);
          cache.setCache(cacheKey, ndviSample);
          setSamples(prev=>({
            ...prev,
            [a_RequestContext]: [...prev[a_RequestContext], ndviSample]
          }));
        } else {
          throw new Error("Scene rejected: rasters are undefined");
        }

        counter[a_RequestContext] = counter[a_RequestContext] +1;
        setDoneFeature(prev=>({
          ...prev,
          [a_RequestContext]: prev[a_RequestContext] + 1
        }));
      } catch (error: any) {
        if(!error.cause){
          log("Unexpected error getNDVI", error, ELogLevel.error)
          continue
        }

        const ndviSampleNotValid: INDVISample = {
          featureId: feature.id,
          id: counter[a_RequestContext],
          datetime: feature.properties.datetime,
          preview: feature.assets.rendered_preview.href,
          ndviArray: error.cause.ndviArray ?? null,
          meanNDVI: null,
          meanNDVISmoothed: null,
          medianNDVI: null,
          medianNDVISmoothed: null,
          filter: a_NDVIPanel.filter,
          filter_fraction: 0,
          n_valid: error.cause.n_valid ?? 0,
          valid_fraction: error.cause.valid_fraction ?? 0,
          not_valid_fraction: error.cause.not_valid_fraction ?? null,
        };
        log("Cached NDVI missed"+`_${a_RequestContext}`, ndviSampleNotValid);
        cache.setCache(cacheKey, ndviSampleNotValid);
        setNotValidSamples(prev=>({
            ...prev,
            [a_RequestContext]: [...prev[a_RequestContext], ndviSampleNotValid]
          }));
        counter[a_RequestContext] = counter[a_RequestContext] +1;
        setDoneFeature(prev=>({
          ...prev,
          [a_RequestContext]: prev[a_RequestContext] + 1
        }));
        continue;
      }
    }
    setGlobalLoading(prev=>({
      ...prev,
      [a_RequestContext]: false
    }));
  };

  return {
    getNDVI,
  };
};

