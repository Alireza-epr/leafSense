import {
  computeFeatureNDVI,
  getFeatureToken,
  getMeanNDVI,
  getSignedURL,
  isTokenExpired,
  readBandCOG,
} from "@/utils/calculationUtils";
import { useMapStore } from "../store/mapStore";
import { EStacBands, IStacItem } from "../types/apiTypes";
import { TypedArray } from "geotiff";

export const useNDVI = () => {
  const tokenCollection = useMapStore((state) => state.tokenCollection);
  const setSamples = useMapStore((state) => state.setSamples);
  const doneFeature = useMapStore((state) => state.doneFeature);
  const setDoneFeature = useMapStore((state) => state.setDoneFeature);

  const getNDVI = async (
    a_Features: IStacItem[],
    a_Coordinates: [number, number][],
  ) => {
    const bandKeys = [EStacBands.nir, EStacBands.red];
    const rasters: { band: EStacBands; raster: TypedArray | null }[] =
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

    const sortedFeatures = a_Features.reverse()

    try {
      setDoneFeature(1);
      for (const feature of sortedFeatures) {
        //console.log(new Date(Date.now()).toISOString()+" Start Calculating NDVI for STAC Item id "+ feature.id)

        for (const bandKey of bandKeys) {
          const bandAsset = feature.assets[bandKey];
          const bandURL = bandAsset.href;

          if (!bandURL) {
            console.error(`${bandKey}: URL not defined`);
            continue;
          }
          const bandSignedURL = `${bandURL}?${tokenCollection?.token}`;
          const bandRaster = await readBandCOG(
            bandSignedURL,
            a_Coordinates,
            feature.bbox as [number, number, number, number],
          );

          const raster = rasters.find((r) => r.band == bandKey);
          raster!.raster = bandRaster as TypedArray;
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
        if (nirRaster && redRaster) {
          const featureNDVI = computeFeatureNDVI(redRaster, nirRaster);
          //console.log(new Date(Date.now()).toISOString()+ " " +featureNDVI.length + " pixels from the Sentinel-2 image for the given ROI")
          const featureMeanNDVI = getMeanNDVI(
            featureNDVI,
            feature.properties.datetime,
          );
          //console.log(new Date(Date.now()).toISOString()+" NDVI for "+ feature.id)
          //console.log(featureMeanNDVI)

          meanNDVIs.push({ ...featureMeanNDVI, id: countId });
        } else {
          meanNDVIs.push({
            id: countId,
            NDVI: null,
            datetime: feature.properties.datetime,
          });
        }
        ++countId;
        setDoneFeature((prev) => ++prev);
      }

      setSamples(meanNDVIs);
    } catch (error) {
      setSamples([]);
      console.error("useNDVI error");
      console.error(error);
    }
  };

  return {
    getNDVI,
  };
};
