import {
  ELogLevel,
  EMarkerType,
  ESampleFilter,
  EURLParams,
  ITemporalItem,
  TURLState,
  spatialItems,
  temporalItems,
} from "../types";
import { isDateValid, isOperatorValid, isROIValid, isValidAnnotation, isValidFilter, isValidRange, log } from "./generalUtils";



export const parseUrl = (search: string): TURLState => {
  const params = new URLSearchParams(search);
  const state: TURLState = {};

  // point and zonal
  const pointROI = params.get(EURLParams.pointROI);
  if (pointROI) {
    if (isROIValid(pointROI, EMarkerType.point)){
      const parsed = JSON.parse(pointROI) as [[number, number], string];
      state.pointROI = {
        center: parsed[0],
        radius: parsed[1],
      };
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: pointROI does not match",
        ELogLevel.warning,
      )   
    }
  }

  const zonalROIs: Record<number, [number, number][]> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith(EURLParams.zonalROI + "-")) {
      if (isROIValid(value, EMarkerType.polygon)){
        const id = Number(key.split("-").pop());
        zonalROIs[id] = JSON.parse(value);
      } else {
        log(
          "Read URLParams",
          "Failed to use URLParam: Map is not ready",
          ELogLevel.warning,
        );
      }
    }
  }
  if (Object.keys(zonalROIs).length) {
    state.zonalROIs = zonalROIs;
  }

  // start and end date
  const startDateParam = params.get(EURLParams.startDate);
  const endDateParam = params.get(EURLParams.endDate);

  let isStartValid = false;
  let isEndValid = false;

  if (startDateParam) {
    if (isDateValid(startDateParam)) {
      state.startDate = startDateParam
      isStartValid = true;
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: startdate does not match",
        ELogLevel.warning,
      );
    }
  }
  if (endDateParam) {
    if (isDateValid(endDateParam)) {
      state.endDate = endDateParam
      isEndValid = true;
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: enddate does not match",
        ELogLevel.warning,
      );
    }
  }

  // Temporal Op
  let temporal: ITemporalItem = { title: "During", value: "t_during" };
  const temporalOpParam = params.get(EURLParams.temporalOp);
  if (temporalOpParam) {
    if (isOperatorValid(temporalOpParam, temporalItems)) {
      const temporalOp = temporalItems.find(
        (i) => i.title.toLowerCase() == temporalOpParam.toLowerCase(),
      )
      if(temporalOp){
        state.temporalOp = temporalOp.value
      }
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: temporalOp does not match",
        ELogLevel.warning,
      );
    }
  } else {
    if (isStartValid && isEndValid) {
      temporal = { title: "During", value: "t_during" };
      state.temporalOp = temporal.value;
    } else if (isStartValid) {
      temporal = { title: "After Start", value: "t_after" };
      state.temporalOp = temporal.value;
    } else if (isEndValid) {
      temporal = { title: "Before End", value: "t_before" };
      state.temporalOp = temporal.value;
    }
  }


  // Spatial Op
  const spatialOpParam = params.get(EURLParams.spatialOp);
  if (spatialOpParam) {
    if (isOperatorValid(spatialOpParam, spatialItems)) {
      const spatialItem = spatialItems.find(
        (i) => i.title.toLowerCase() == spatialOpParam.toLowerCase(),
      )
      if(spatialItem){
        state.spatialOp = spatialItem.value
      }
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: spatialOp does not match",
        ELogLevel.warning,
      );
    }
  }

  // Cloud
  const cloudParam = params.get(EURLParams.cloud);
  if (cloudParam) {
    if (isValidRange(cloudParam, 0, 100)) {
      state.cloudCover = cloudParam
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: cloud does not match",
        ELogLevel.warning,
      );
    }
  }

  // Snow
  const snowParam = params.get(EURLParams.snow);
  if (snowParam) {
    if (isValidRange(snowParam, 0, 100)) {
      state.snowCover = snowParam
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: snow does not match",
        ELogLevel.warning,
      );
    }
  }

  // Limit
  const limitParam = params.get(EURLParams.limit);
  if (limitParam) {
    if (isValidRange(limitParam, 1, 50)) {
      state.limit = limitParam
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: limit does not match",
        ELogLevel.warning,
      );
    }
  }

  // Coverage
  const coverageParam = params.get(EURLParams.coverage);
  if (coverageParam) {
    if (isValidRange(coverageParam, 0, 100)) {
      state.coverageThreshold = coverageParam
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: coverage does not match",
        ELogLevel.warning,
      );
    }
  }

  // Outlier Rejection
  const filterParam = params.get(EURLParams.filter) as ESampleFilter;
  if (filterParam) {
    if (isValidFilter(filterParam)) {
      const filter = ["none", "z-score", "IQR"].find(
        (i) => i.toLowerCase() == filterParam.toLowerCase(),
      ) as ESampleFilter
      if(filter){
        state.sampleFilter = filter
      }
      
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: filter does not match",
        ELogLevel.warning,
      );
    }
  }

  const annotationsParam = params.get(EURLParams.annotations);
  if (annotationsParam) {
    if (isValidAnnotation(annotationsParam)) {
      state.annotations = JSON.parse(annotationsParam)
    } else {
      log(
        "Read URLParams",
        "Failed to use URLParam: annotations does not match",
        ELogLevel.warning,
      );
    }
  }

  log("Parsing URL", state)
  return state;
}

export const buildUrl = (state: TURLState): URLSearchParams => {
  const params = new URLSearchParams();

  const existingParams = new URLSearchParams(window.location.search);
  const loglevel = existingParams.get(EURLParams.loglevel);
  if (loglevel) {
    params.set(EURLParams.loglevel, loglevel);
  }

  if (state.pointROI) {
    params.set(
      EURLParams.pointROI,
      JSON.stringify([state.pointROI.center, state.pointROI.radius])
    );
  }

  if (state.zonalROIs) {
    Object.entries(state.zonalROIs).forEach(([id, coords]) => {
      params.set(
        `${EURLParams.zonalROI}-${id}`,
        JSON.stringify(coords)
      );
    });
  }

  const setIf = (k: string, v?: any) =>
    v !== undefined && v !== "" && params.set(k, String(v));

  setIf(EURLParams.startDate, state.startDate);
  setIf(EURLParams.endDate, state.endDate);
  params.set(
    EURLParams.temporalOp,
    temporalItems.find((i) => i.value === state.temporalOp)!.title.toLowerCase(),
  );
  params.set(
    EURLParams.spatialOp,
    spatialItems.find((i) => i.value === state.spatialOp)!.title.toLowerCase(),
  );
  setIf(EURLParams.cloud, state.cloudCover);
  setIf(EURLParams.snow, state.snowCover);
  setIf(EURLParams.limit, state.limit);
  setIf(EURLParams.coverage, state.coverageThreshold);
  setIf(EURLParams.filter, state.sampleFilter);

  if (state.annotations?.length) {
    params.set(EURLParams.annotations, JSON.stringify(state.annotations));
  }

  log("Building URL", params)
  return params;
}
