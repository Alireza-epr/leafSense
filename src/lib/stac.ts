import { INDVISample, useMapStore } from "../store/mapStore";
import {
  ESTACURLS,
  ISTACFilterRequest,
  EStacAssetsKey,
  IStacItem,
  ESTACCollections,
} from "../types/apiTypes";
import { CacheHandler } from "../utils/apiUtils";
import {
  readBandCOG,
  getFeatureToken,
  isTokenExpired,
  getNDVISample,
} from "../utils/calculationUtils";
import { ReadRasterResult, TypedArray } from "geotiff";
import { INDVIPanel } from "../types/generalTypes";

const cache = new CacheHandler();

export const useFilterSTAC = () => {
  const setResponseFeatures = useMapStore((state) => state.setResponseFeatures);
  const setErrorFeatures = useMapStore((state) => state.setErrorFeatures);

  const getFeatures = async (a_STACRequest: ISTACFilterRequest) => {
    if (cache.getCache(a_STACRequest)) {
      const respJSON = cache.getCache(a_STACRequest);
      console.log("Cached Features hit");
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
        console.log("Cached Features missed");
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
  const setGlobalLoading = useMapStore((state) => state.setGlobalLoading);

  const getNDVI = async (
    a_Features: IStacItem[],
    a_Coordinates: [number, number][],
    a_NDVIPanel: INDVIPanel,
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
    let countId = 1;

    setDoneFeature(1);
    setSamples([]);
    setNotValidSamples([]);
    for (const feature of a_Features) {
      try {
        //console.log(new Date(Date.now()).toISOString()+" Start Calculating NDVI for STAC Item id "+ feature.id)
        const cacheKey = `${JSON.stringify(a_Coordinates)}_${feature.id}_${JSON.stringify(a_NDVIPanel)}`;
        if (cache.getCache(cacheKey)) {
          console.log("Cached NDVI hit");
          const cachedNDVI = cache.getCache(cacheKey) as INDVISample;
          console.log(cachedNDVI);
          if (cachedNDVI.meanNDVI) {
            setSamples((prev) => [...prev, cachedNDVI]);
          } else {
            setNotValidSamples((prev) => [...prev, cachedNDVI]);
          }
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
            countId,
            redRaster,
            nirRaster,
            SCLRaster,
            a_NDVIPanel,
            feature,
          );
          //console.log(new Date(Date.now()).toISOString()+ " " +featureNDVI.length + " pixels from the Sentinel-2 image for the given ROI")
          //console.log(new Date(Date.now()).toISOString()+" NDVI for "+ feature.id)
          console.log("Cached NDVI missed");
          console.log(ndviSample);
          cache.setCache(cacheKey, ndviSample);
          setSamples((prev) => [...prev, ndviSample]);
        } else {
          throw new Error("Scene rejected: rasters are undefined");
        }

        ++countId;
        setDoneFeature((prev) => ++prev);
      } catch (error: any) {
        const ndviSampleNotValid: INDVISample = {
          featureId: feature.id,
          id: countId,
          datetime: feature.properties.datetime,
          preview: feature.assets.rendered_preview.href,
          ndviArray: error.cause.ndviArray ?? null,
          meanNDVI: null,
          medianNDVI: null,
          filter: a_NDVIPanel.filter,
          filter_fraction: "N/A",
          n_valid: error.cause.n_valid ?? 0,
          valid_fraction: error.cause.valid_fraction ?? "N/A",
        };
        setNotValidSamples((prev) => [...prev, ndviSampleNotValid]);
        ++countId;
        setDoneFeature((prev) => ++prev);
        continue;
      }
    }
    setGlobalLoading(false);
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
