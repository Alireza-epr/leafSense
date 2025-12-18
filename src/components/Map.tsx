import mapStyle from "./Map.module.scss";
import { useRef, useEffect, useCallback, use, useState } from "react";
import maplibregl from "maplibre-gl";
import { Map as MapLibre } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { EMarkerType, IMarker, TMarker, useMapStore } from "../store/mapStore";
import type { Feature, Polygon } from "geojson";
import { useFilterSTAC, useNDVI, useTokenCollection } from "../lib/stac";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ESTACCollections,
  EStacLinkRel,
  ISTACFilterRequest,
  ITemporalItem,
  spatialItems,
  TCloudCoverFilter,
  TDateTimeFilter,
  temporalItems,
  TSnowCoverFilter,
  TSpatialFilter,
} from "../types/apiTypes";
import Loading from "./Loading";
import {
  ELoadingSize,
  ESampleFilter,
  EURLParams,
  ILayerMetadata,
  INDVIPanel,
  Units,
} from "../types/generalTypes";
import Chart from "./Chart";
import { debounce, throttle } from "../utils/apiUtils";
import CustomTooltip from "./CustomTooltip";
import circle from "@turf/circle";
import {
  isDateValid,
  isOperatorValid,
  isROIValid,
  isValidBoolean,
  isValidFilter,
  isValidRange,
} from "../utils/generalUtils";

let start: number, end: number;

const Map = () => {
  const { getFeatures } = useFilterSTAC();
  const { getTokenCollection } = useTokenCollection();
  const { getNDVI } = useNDVI();

  const map = useMapStore((state) => state.map);
  const setMap = useMapStore((state) => state.setMap);

  const marker = useMapStore((state) => state.marker);
  const startDate = useMapStore((state) => state.startDate);
  const endDate = useMapStore((state) => state.endDate);
  const cloudCover = useMapStore((state) => state.cloudCover);
  const snowCover = useMapStore((state) => state.snowCover);
  const coverageThreshold = useMapStore((state) => state.coverageThreshold);
  const markers = useMapStore((state) => state.markers);
  const showChart = useMapStore((state) => state.showChart);
  const showError = useMapStore((state) => state.showError);
  const fetchFeatures = useMapStore((state) => state.fetchFeatures);
  const globalLoading = useMapStore((state) => state.globalLoading);
  const samples = useMapStore((state) => state.samples);
  const responseFeatures = useMapStore((state) => state.responseFeatures);
  const errorFeatures = useMapStore((state) => state.errorFeatures);
  const errorNDVI = useMapStore((state) => state.errorNDVI);
  const tokenCollection = useMapStore((state) => state.tokenCollection);
  const doneFeature = useMapStore((state) => state.doneFeature);
  const temporalOp = useMapStore((state) => state.temporalOp);
  const spatialOp = useMapStore((state) => state.spatialOp);
  const limit = useMapStore((state) => state.limit);
  const radius = useMapStore((state) => state.radius);
  const nextPage = useMapStore((state) => state.nextPage);
  const previousPage = useMapStore((state) => state.previousPage);
  const sampleFilter = useMapStore((state) => state.sampleFilter);
  const smoothing = useMapStore((state) => state.smoothing);

  const setNextPage = useMapStore((state) => state.setNextPage);
  const setPreviousPage = useMapStore((state) => state.setPreviousPage);
  const setMarkers = useMapStore((state) => state.setMarkers);
  const setStartDate = useMapStore((state) => state.setStartDate);
  const setEndDate = useMapStore((state) => state.setEndDate);
  const setCloudCover = useMapStore((state) => state.setCloudCover);
  const setShowChart = useMapStore((state) => state.setShowChart);
  const setShowROI = useMapStore((state) => state.setShowROI);
  const setShowError = useMapStore((state) => state.setShowError);
  const setFetchFeatures = useMapStore((state) => state.setFetchFeatures);
  const setSamples = useMapStore((state) => state.setSamples);
  const setNotValidSamples = useMapStore((state) => state.setNotValidSamples);
  const setGlobalLoading = useMapStore((state) => state.setGlobalLoading);
  const setResponseFeatures = useMapStore((state) => state.setResponseFeatures);
  const setErrorFeatures = useMapStore((state) => state.setErrorFeatures);
  const setErrorNDVI = useMapStore((state) => state.setErrorNDVI);
  const setTemporalOp = useMapStore((state) => state.setTemporalOp);
  const setSpatialOp = useMapStore((state) => state.setSpatialOp);
  const setSnowCover = useMapStore((state) => state.setSnowCover);
  const setLimit = useMapStore((state) => state.setLimit);
  const setCoverageThreshold = useMapStore(
    (state) => state.setCoverageThreshold,
  );
  const setSampleFilter = useMapStore((state) => state.setSampleFilter);
  const setSmoothing = useMapStore((state) => state.setSmoothing);
  const setRadius = useMapStore((state) => state.setRadius);

  const mapContainer = useRef<HTMLDivElement>(null);
  //const mapObject = useRef<MapLibre | null>(null);

  const [latency, setLatency] = useState<number>();

  // Create a stable debounced function that always calls the latest getFeatures:
  // - useRef stores the current getFeatures so we can access the latest version even if it changes each render
  // - useEffect updates the ref whenever getFeatures changes
  // - useCallback wraps the debounced function so its reference stays stable across renders - the timer stays intact, preserving debounce behavior
  const getFeaturesRef = useRef(getFeatures);

  useEffect(() => {
    getFeaturesRef.current = getFeatures;
  }, [getFeatures]);

  const debouncedGetFeatures = useCallback(
    debounce((postBody) => getFeaturesRef.current(postBody), 300),
    [],
  );

  const throttledGetFeatures = useCallback(
    throttle((postBody) => getFeaturesRef.current(postBody), 10000),
    [],
  );

  const debouncedThrottledGetFeatures = throttle(
    debounce((postBody) => getFeaturesRef.current(postBody), 300),
    1000,
  );

  const markersRef = useRef(markers);
  const radiusRef = useRef(radius);
  const fetchFeaturesRef = useRef(fetchFeatures);

  const addMarker = useCallback(
    (
      a_LngLat: [number, number],
      a_Map: maplibregl.Map,
      a_Type: EMarkerType,
      a_Options?: maplibregl.MarkerOptions,
    ) => {
      const markerElement = new maplibregl.Marker(a_Options)
        .setLngLat(a_LngLat)
        .addTo(a_Map);

      const newMarker = {
        type: a_Type,
        marker: markerElement,
      };

      setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
    },
    [setMarkers],
  );

  const removeMarker = useCallback(
    (a_MarkerType: EMarkerType) => {
      setMarkers((prev) => {
        const toRemove = prev.filter((m) => m.type === a_MarkerType);
        toRemove.forEach((m) => m.marker.remove());

        return prev.filter((m) => m.type !== a_MarkerType);
      });
    },
    [setMarkers],
  );

  const removeCircleLayer = useCallback(() => {
    if (map) {
      const circleLayer = map.getLayer("circle");
      if (circleLayer) {
        map.removeLayer("circle");
        map.removeSource("circle");
      }
    }
  }, [map]);

  const drawCircle = useCallback(
    (a_Center: [number, number]) => {
      const radius = Number(radiusRef.current);
      const options = { units: "meters" as Units };
      const circleFeature = circle(a_Center, radius, options);

      removeCircleLayer(); // make sure removeCircleLayer is also stable

      if (!map!.getStyle()) {
        return;
      }

      map!.addSource("circle", {
        type: "geojson",
        data: circleFeature,
      });

      map!.addLayer({
        id: "circle",
        type: "fill",
        source: "circle",
        paint: {
          "fill-color": "rgba(4, 185, 64, 1)",
          "fill-opacity": 0.5,
        },
        metadata: {
          feature: circleFeature,
          center: a_Center,
        },
      });
    },
    [map, removeCircleLayer], // dependencies used inside
  );

  const addPointMarker = useCallback(
    (a_Event: maplibregl.MapMouseEvent) => {
      if (a_Event.originalEvent.button === 0 && map) {
        removeMarker(EMarkerType.point);

        const center: [number, number] = [
          a_Event.lngLat.lng,
          a_Event.lngLat.lat,
        ];
        addMarker(center, map, EMarkerType.point, { color: "green" });

        drawCircle(center);
      }
    },
    [map, addMarker, removeMarker, drawCircle],
  );

  const addPolygonMarker = useCallback(
    (a_Event: maplibregl.MapMouseEvent) => {
      if (a_Event.originalEvent.button === 0 && map) {
        addMarker(
          [a_Event.lngLat.lng, a_Event.lngLat.lat],
          map,
          EMarkerType.polygon,
        );
      }
    },
    [map, addMarker],
  );

  const removePolygonLayer = useCallback(() => {
    if (map) {
      const polygonLayer = map.getLayer("polygon");
      if (polygonLayer) {
        map.removeLayer("polygon");
        map.removeSource("polygon");
      }
    }
  }, [map]);

  const removePolygon = useCallback(() => {
    if (map) {
      // Remove polygon markers
      markersRef.current.forEach((m) => {
        if (m.type === EMarkerType.polygon) {
          m.marker.remove();
        }
      });

      // Update state
      setMarkers((prev) => prev.filter((m) => m.type !== EMarkerType.polygon));

      // Remove polygon layer
      removePolygonLayer();
    }
  }, [map, setMarkers, removePolygonLayer]);
  const drawPolygon = useCallback(
    (a_PolygonMarkers: IMarker[]) => {
      const polygonCoords = a_PolygonMarkers.map((m) => {
        const lngLat = m.marker.getLngLat();
        return [lngLat.lng, lngLat.lat];
      });

      const geojson: Feature<Polygon> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [polygonCoords], // array of arrays
        },
        properties: {},
      };

      removePolygonLayer(); // must be stable

      if (!map!.getStyle()) {
        return;
      }

      map!.addSource("polygon", {
        type: "geojson",
        data: geojson,
      });

      map!.addLayer({
        id: "polygon",
        type: "fill",
        source: "polygon",
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.5,
        },
        metadata: {
          feature: geojson,
        },
      });
    },
    [map, removePolygonLayer],
  );

  const redrawCircle = useCallback(() => {
    const point = markers.find((m) => m.type === EMarkerType.point);
    if (!point) return;

    const center: [number, number] = [
      point.marker.getLngLat().lng,
      point.marker.getLngLat().lat,
    ];

    drawCircle(center);
  }, [markers, drawCircle]);

  const addMarkersToMap = useCallback(() => {
    setMarkers((prev) => {
      const updated: IMarker[] = [];

      for (const marker of prev) {
        if (marker.marker._map) {
          updated.push(marker);
          continue;
        }

        const newMarkerWithMap = new maplibregl.Marker()
          .setLngLat(marker.marker.getLngLat())
          .addTo(map!);

        updated.push({
          type: marker.type,
          marker: newMarkerWithMap,
        });
      }

      return updated;
    });
  }, [map, setMarkers]);

  const getCoordinatesFromMarkers = useCallback((): [number, number][] => {
    if (fetchFeaturesRef.current === EMarkerType.polygon) {
      let coordinates: [number, number][] = markersRef.current
        .filter((m) => m.type === EMarkerType.polygon)
        .map((m) => {
          const lng = m.marker.getLngLat().lng;
          const lat = m.marker.getLngLat().lat;
          return [lng, lat];
        });

      // Close the polygon
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }

      return coordinates;
    } else {
      const circleLayer = map!.getLayer("circle");
      if (!circleLayer) return [];

      const metadata = circleLayer.metadata as ILayerMetadata;
      const feature = metadata?.feature;
      return feature?.geometry?.coordinates?.[0] || [];
    }
  }, [map]);

  const getPostBody = useCallback(() => {
    const cloudCoverFilter: TCloudCoverFilter = {
      op: "<=",
      args: [{ property: "eo:cloud_cover" }, Number(cloudCover)],
    };

    const snowCoverFilter: TSnowCoverFilter = {
      op: "<=",
      args: [{ property: "s2:snow_ice_percentage" }, Number(snowCover)],
    };

    const geometryFilter: TSpatialFilter = {
      op: spatialOp,
      args: [
        { property: "geometry" },
        {
          type: "Polygon",
          coordinates: [getCoordinatesFromMarkers()],
        },
      ],
    };

    let temporalFilter = "";

    switch (temporalOp) {
      case "t_during":
        temporalFilter = `${startDate.substring(0, startDate.indexOf("T"))}/${endDate.substring(0, endDate.indexOf("T"))}`;
        break;
      case "t_after":
        temporalFilter = `${startDate.substring(0, startDate.indexOf("T"))}/`;
        break;
      case "t_before":
        temporalFilter = `/${endDate.substring(0, endDate.indexOf("T"))}`;
        break;
    }

    const postBody: ISTACFilterRequest = {
      sortby: [{ field: "properties.datetime", direction: "asc" }],
      collections: [ESTACCollections.Sentinel2l2a],
      filter: {
        op: "and",
        args: [cloudCoverFilter, snowCoverFilter, geometryFilter],
      },
      datetime: temporalFilter,
      limit: Number(limit),
    };

    return postBody;
  }, [
    cloudCover,
    snowCover,
    startDate,
    endDate,
    spatialOp,
    temporalOp,
    limit,
    getCoordinatesFromMarkers,
  ]);

  const showMap = useCallback(() => {
    setShowError(false);
    setShowChart(false);
    setFetchFeatures(null);
    setGlobalLoading(false);
  }, [setShowError, setShowChart, setFetchFeatures, setGlobalLoading]);

  const showLoadingModal = useCallback(() => {
    setShowError(false);
    setShowChart(false);
    setGlobalLoading(true);
  }, [setShowError, setShowChart, setGlobalLoading]);

  const showChartModal = useCallback(() => {
    setShowError(false);
    setShowChart(true);
    setGlobalLoading(false);
  }, [setShowError, setShowChart, setGlobalLoading]);

  const showErrorModal = useCallback(() => {
    setShowError(true);
    setShowChart(false);
    setGlobalLoading(false);
  }, [setShowError, setShowChart, setGlobalLoading]);

  const resetStates = useCallback(() => {
    start = Date.now();
    setLatency(0);
    setSamples([]);
    setNotValidSamples([]);
    setResponseFeatures(null);
    setErrorFeatures(null);
  }, [
    setLatency,
    setSamples,
    setNotValidSamples,
    setResponseFeatures,
    setErrorFeatures,
  ]);

  const handleCloseChart = useCallback(() => {
    setFetchFeatures(null);
    showMap();
  }, [setFetchFeatures, showMap]);

  const handleNextPageChart = useCallback(async () => {
    if (nextPage?.body) {
      const postBody: ISTACFilterRequest = {
        sortby: [{ field: "properties.datetime", direction: "asc" }],
        ...nextPage.body,
      };

      console.log("Next Request", postBody);
      showLoadingModal();
      resetStates();
      debouncedGetFeatures(postBody);
    }
  }, [nextPage, showLoadingModal, resetStates, debouncedGetFeatures]);

  const handlePreviousPageChart = useCallback(async () => {
    if (previousPage?.body) {
      const postBody: ISTACFilterRequest = {
        sortby: [{ field: "properties.datetime", direction: "asc" }],
        ...previousPage.body,
      };

      console.log("Previous Request", postBody);
      showLoadingModal();
      resetStates();
      debouncedGetFeatures(postBody);
    }
  }, [previousPage, showLoadingModal, resetStates, debouncedGetFeatures]);

  const handleFlyToROI = useCallback(
    (a_To: EMarkerType, a_Zoom: number) => {
      if (a_To === EMarkerType.polygon) {
        const polygonLayer = map!.getLayer("polygon");
        const metadata = polygonLayer!.metadata as ILayerMetadata;
        const feature = metadata!.feature;
        const coordinates: [number, number][][] = feature.geometry.coordinates;
        map!.fitBounds([coordinates[0][0], coordinates[0][1]], {
          zoom: a_Zoom,
        });
      }

      if (a_To === EMarkerType.point) {
        const circleLayer = map!.getLayer("circle");
        const metadata = circleLayer!.metadata as ILayerMetadata;
        const center = metadata!.center;
        map!.fitBounds([center, center], { zoom: a_Zoom });
      }
    },
    [map],
  );

  // Loading Map
  useEffect(() => {
    if (map || !mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [7.4711617988066905, 51.36223529413988], // [lng, lat]
      zoom: 15,
      maxZoom: 18,
    });

    mapInstance.addControl(new maplibregl.NavigationControl());
    setMap(mapInstance);

    window.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
    });

    return () => {
      // By component unmounting
      setMap(null);
    };
  }, []);

  // Follow Changing Radius
  useEffect(() => {
    radiusRef.current = radius;
    redrawCircle();
  }, [radius]);

  // Handle Marker
  useEffect(() => {
    if (!map) return;

    if (marker.zonal) {
      map.on("mousedown", addPolygonMarker);
    } else {
      map.off("mousedown", addPolygonMarker);
    }

    if (marker.point) {
      map.on("mousedown", addPointMarker);
    } else {
      map.off("mousedown", addPointMarker);
    }

    return () => {
      map?.off("mousedown", addPolygonMarker);
      map?.off("mousedown", addPointMarker);
    };
  }, [marker]);

  // Handle Polygon Drawing
  useEffect(() => {
    if (!map) return;
    markersRef.current = markers;
    if (markers.length !== 0 && markers.some((m) => !m.marker._map)) {
      addMarkersToMap();
      return;
    }

    const polygonMarkers = markers.filter((m) => m.type == EMarkerType.polygon);
    const pointMarker = markers.filter((m) => m.type == EMarkerType.point);

    if (pointMarker.length === 0) {
      showMap();
      removeCircleLayer();
    }

    if (polygonMarkers.length === 0) {
      showMap();
      removePolygonLayer();
    }

    if (polygonMarkers.length < 4) {
      showMap();
      return;
    }

    if (polygonMarkers.length > 4) {
      const newPolygonMarker = polygonMarkers[polygonMarkers.length - 1].marker;
      const lngLat = newPolygonMarker.getLngLat();

      removePolygon();

      addMarker([lngLat.lng, lngLat.lat], map, EMarkerType.polygon);
      return;
    }

    //console.log("start drawing polygon");
    //console.log(markers);
    drawPolygon(polygonMarkers);
  }, [markers]);

  // Read URLParams
  useEffect(() => {
    if(!map) return 

    const params = new URLSearchParams(window.location.search);

    // point or zonal
    const pointROI = params.get(EURLParams.pointROI);
    const zonalROI = params.get(EURLParams.zonalROI);

    if (pointROI) {
      if (isROIValid(pointROI, EMarkerType.point)) {
        removeCircleLayer();
        removeMarker(EMarkerType.point);

        setTimeout(() => {
          if (!map) {
            console.warn("Failed to use URLParam: Map is not ready");
            return;
          }
          const parsedROI = JSON.parse(pointROI) as [[number, number], string];
          const [center, radius] = parsedROI;
          addMarker(center, map, EMarkerType.point, { color: "green" });
          setRadius(radius);
          drawCircle(center);
        }, 100);
      } else {
        console.warn("Failed to use URLParam: pointROI does not match");
      }
    }
    if (zonalROI) {
      if (isROIValid(zonalROI, EMarkerType.polygon)) {
        removePolygonLayer();
        removeMarker(EMarkerType.polygon);
        setTimeout(() => {
          const parsedROI: [number, number][] = JSON.parse(zonalROI);
          parsedROI.forEach((coordinate) => {
            const [lng, lat] = coordinate;
            if (!map) {
              console.warn("Failed to use URLParam: Map is not ready");
              return;
            }
            addMarker([lng, lat], map, EMarkerType.polygon);
          });
        }, 100);
      } else {
        console.warn("Failed to use URLParam: zonalROI does not match");
      }
    }

    // start and end date
    const startDateParam = params.get(EURLParams.startDate);
    const endDateParam = params.get(EURLParams.endDate);
    let temporal: ITemporalItem = { title: "During", value: "t_during" };

    let isStartValid = false;
    let isEndValid = false;
    if (startDateParam) {
      if (isDateValid(startDateParam)) {
        setStartDate(startDateParam);
        isStartValid = true;
      } else {
        console.warn("Failed to use URLParam: startdate does not match");
      }
    }
    if (endDateParam) {
      if (isDateValid(endDateParam)) {
        setEndDate(endDateParam);
        isEndValid = true;
      } else {
        console.warn("Failed to use URLParam: enddate does not match");
      }
    }

    // Temporal Op
    const temporalOpParam = params.get(EURLParams.temporalOp);
    if(temporalOpParam){
      if (isOperatorValid(temporalOpParam, temporalItems)) {
        setTemporalOp(
          temporalItems.find(
            (i) => i.title.toLowerCase() == temporalOpParam.toLowerCase(),
          )!.value,
        );
      } else {
        console.warn("Failed to use URLParam: temporalOp does not match");
      }
    } else {
      if (isStartValid && isEndValid) {
        temporal = { title: "During", value: "t_during" };
        setTemporalOp(temporal.value);
      } else if (isStartValid) {
        temporal = { title: "After Start", value: "t_after" };
        setTemporalOp(temporal.value);
      } else if (isEndValid) {
        temporal = { title: "Before End", value: "t_before" };
        setTemporalOp(temporal.value);
      }
    }

    // Spatial Op
    const spatialOpParam = params.get(EURLParams.spatialOp);
    if (spatialOpParam) {
      if (isOperatorValid(spatialOpParam, spatialItems)) {
        setSpatialOp(
          spatialItems.find(
            (i) => i.title.toLowerCase() == spatialOpParam.toLowerCase(),
          )!.value,
        );
      } else {
        console.warn("Failed to use URLParam: spatialOp does not match");
      }
    }

    // Cloud
    const cloudParam = params.get(EURLParams.cloud);
    if (cloudParam) {
      if (isValidRange(cloudParam, 0, 100)) {
        setCloudCover(cloudParam);
      } else {
        console.warn("Failed to use URLParam: cloud does not match");
      }
    }

    // Snow
    const snowParam = params.get(EURLParams.snow);
    if (snowParam) {
      if (isValidRange(snowParam, 0, 100)) {
        setSnowCover(snowParam);
      } else {
        console.warn("Failed to use URLParam: snow does not match");
      }
    }

    // Limit
    const limitParam = params.get(EURLParams.limit);
    if (limitParam) {
      if (isValidRange(limitParam, 1, 50)) {
        setLimit(limitParam);
      } else {
        console.warn("Failed to use URLParam: limit does not match");
      }
    }

    // Coverage
    const coverageParam = params.get(EURLParams.coverage);
    if (coverageParam) {
      if (isValidRange(coverageParam, 0, 100)) {
        setCoverageThreshold(coverageParam);
      } else {
        console.warn("Failed to use URLParam: coverage does not match");
      }
    }

    // Outlier Rejection
    const filterParam = params.get(EURLParams.filter) as ESampleFilter;
    if (filterParam) {
      if (isValidFilter(filterParam)) {
        setSampleFilter(
          ["none", "z-score", "IQR"].find(
            (i) => i.toLowerCase() == filterParam.toLowerCase(),
          ) as ESampleFilter,
        );
      } else {
        console.warn("Failed to use URLParam: filter does not match");
      }
    }

    // Smoothing
    const smoothingParam = params.get(EURLParams.smoothing);
    if (smoothingParam) {
      if (isValidBoolean(smoothingParam)) {
        const isTrue = smoothingParam == "true";
        setSmoothing(isTrue);
      } else {
        console.warn("Failed to use URLParam: smoothing does not match");
      }
    }
  }, [map]);

  // Write URLParams
  useEffect(() => {
    if(!map) return 

    const polygonMarkers = markers.filter(
      (m) => m.type === EMarkerType.polygon,
    );
    const pointMarkers = markers.filter(
      (m) => m.type === EMarkerType.point,
    );

    const params = new URLSearchParams();

    if (polygonMarkers.length > 0) {
      const polygonCoords = polygonMarkers.map((m) => {
        const lngLat = m.marker.getLngLat();
        return [lngLat.lng, lngLat.lat];
      });
      params.set(EURLParams.zonalROI, JSON.stringify(polygonCoords));
    }
    if (pointMarkers.length > 0) {
      const pointCoords = pointMarkers.map((m) => {
        const lngLat = m.marker.getLngLat();
        return [lngLat.lng, lngLat.lat];
      });
      const point = [ ...pointCoords, Number(radius) ]
      params.set(EURLParams.pointROI, JSON.stringify(point));
    }
    params.set(EURLParams.startDate, startDate);
    params.set(EURLParams.endDate, endDate);
    params.set(EURLParams.temporalOp, temporalItems.find(i => i.value === temporalOp)!.title.toLowerCase());
    params.set(EURLParams.spatialOp, spatialItems.find(i => i.value === spatialOp)!.title.toLowerCase());
    params.set(EURLParams.cloud, cloudCover);
    params.set(EURLParams.snow, snowCover);
    params.set(EURLParams.limit, limit);
    params.set(EURLParams.coverage, coverageThreshold);
    params.set(EURLParams.filter, sampleFilter);
    params.set(EURLParams.smoothing, smoothing ? "true" : "false");



    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [
    markers,
    radius, 
    startDate, 
    endDate, 
    spatialOp,
    cloudCover,
    snowCover,
    limit,
    coverageThreshold,
    sampleFilter,
    smoothing
  ]);

  // Get NDVI for STAC Items

  // 1. Get Features
  useEffect(() => {
    if (fetchFeatures !== null) {
      fetchFeaturesRef.current = fetchFeatures;
      const postBody = getPostBody();
      showLoadingModal();
      resetStates();
      start = Date.now();
      console.log("Request Body");
      console.log(postBody);
      debouncedGetFeatures(postBody);
    } else {
      resetStates();
      showMap();
    }
  }, [fetchFeatures]);

  useEffect(() => {
    if (errorFeatures) {
      console.error("Failed to get features");
      console.error(errorFeatures);
      //resetStates();
      setNextPage(null);
      setPreviousPage(null);
      showErrorModal();
    }
  }, [errorFeatures]);

  // 2. Get Token
  useEffect(() => {
    if (responseFeatures) {
      const nextLink = responseFeatures.links?.find(
        (l) => l.rel == EStacLinkRel.next,
      );
      const previousLink = responseFeatures.links?.find(
        (l) => l.rel == EStacLinkRel.previous,
      );
      if (nextLink) {
        setNextPage(nextLink);
      } else {
        setNextPage(null);
      }
      if (previousLink) {
        setPreviousPage(previousLink);
      } else {
        setPreviousPage(null);
      }
      if (responseFeatures.features.length !== 0) {
        getTokenCollection();
      } else {
        showErrorModal();
      }
    }
  }, [responseFeatures]);

  // 3. Calculate NDVI
  useEffect(() => {
    if (tokenCollection) {
      if (responseFeatures) {
        //console.log(new Date(Date.now()).toISOString()+" STAC item numbers: " + responseFeatures.features.length)
        if (responseFeatures.features.length > 0) {
          const NDVIItem: INDVIPanel = {
            filter: sampleFilter,
            coverageThreshold: Number(coverageThreshold),
          };
          getNDVI(
            responseFeatures.features,
            getCoordinatesFromMarkers(),
            NDVIItem,
          );
        }
      }
    } else {
      console.log("tokenCollection error")
      console.log(responseFeatures)
      if (responseFeatures && responseFeatures.features.length !== 0) {
        showErrorModal();
      }
      resetStates();
    }
  }, [tokenCollection]);
  useEffect(() => {
    if (errorNDVI) {
      console.error("Failed to calculate NDVI");
      console.error(errorNDVI);
      //resetStates();
      setNextPage(null);
      setPreviousPage(null);
      showErrorModal();
    }
  }, [errorNDVI]);

  // 4. Show Chart
  useEffect(() => {
    if (globalLoading) {
      showLoadingModal();
    } else {
      if (responseFeatures == null) return; // avoding show Chart on mounting
      if (samples.every((s) => !s.meanNDVI)) {
        showErrorModal();
      } else {
        showChartModal();
        end = Date.now();
        setLatency(end - start);
      }
    }
  }, [globalLoading]);

  return (
    <div className={` ${mapStyle.wrapper}`}>
      {markers.filter((m) => m.type == EMarkerType.polygon).length === 4 ? (
        <div
          className={` ${mapStyle.flyTo}`}
          onClick={() => handleFlyToROI(EMarkerType.polygon, map!.getZoom())}
        >
          <img
            src="/images/go_polygon.svg"
            alt="marker-fly"
            className={` ${mapStyle.flyToImage}`}
          />
        </div>
      ) : (
        <></>
      )}
      {markers.filter((m) => m.type == EMarkerType.point).length !== 0 ? (
        <div
          className={` ${mapStyle.flyTo} ${mapStyle.flyToPoint}`}
          onClick={() => handleFlyToROI(EMarkerType.point, map!.getZoom())}
        >
          <img
            src="/images/go_point.svg"
            alt="marker-fly"
            className={` ${mapStyle.flyToImage}`}
          />
        </div>
      ) : (
        <></>
      )}
      <div
        className={` ${mapStyle.mapWrapper}`}
        style={{ width: "100%", height: "100%" }}
        ref={mapContainer}
        data-testid="map-container"
      />
      {showChart ? (
        <Chart
          onClose={handleCloseChart}
          onNext={handleNextPageChart}
          onPrevious={handlePreviousPageChart}
          items={responseFeatures?.features.length ?? 0}
          latency={latency}
        >
          <ResponsiveContainer width="100%" height="100%">
            {/* resize automatically */}
            {/* array of objects */}
            <LineChart data={samples}>
              <XAxis
                dataKey={"id"}
                stroke="white"
                tickFormatter={(id) =>
                  samples.find((d) => d.id === id)!.datetime.substring(0, 10)
                }
              />
              {/* Y automatically scale to fit the data */}
              <YAxis stroke="white" domain={[-1, 1]} />
              {/* popup tooltip by hovering */}
              <Tooltip content={CustomTooltip} />
              <Line type="linear" dataKey="meanNDVI" stroke="#2ecc71" />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
      ) : (
        <></>
      )}
      {showError ? (
        <Chart
          onClose={handleCloseChart}
          onNext={handleNextPageChart}
          onPrevious={handlePreviousPageChart}
        >
          <div className={` ${mapStyle.errorWrapper}`}>
            <div className={` ${mapStyle.error}`}>
              {responseFeatures &&
              responseFeatures.features &&
              responseFeatures?.features.length == 0
                ? "No STAC Item found!"
                : "Problem with getting NDVI samples! Check the list for more information."}
            </div>
          </div>
        </Chart>
      ) : (
        <></>
      )}
      {globalLoading ? (
        <Chart
          onClose={handleCloseChart}
          onNext={handleNextPageChart}
          onPrevious={handlePreviousPageChart}
        >
          <Loading
            text={
              responseFeatures?.features.length
                ? `${doneFeature}/${responseFeatures?.features.length} `
                : "N/A"
            }
            size={ELoadingSize.md}
            marginVertical={"1vh"}
          />
        </Chart>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Map;
