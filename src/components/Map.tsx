import mapStyle from "./Map.module.scss";
import { useRef, useEffect, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import { Map as MapLibre } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { EMarkerType, ERequestContext, IMarker, IPolygon } from "../types";
import { useMapStore } from "../store/mapStore";
import type { Feature, Polygon } from "geojson";
import { useFilterSTAC, useNDVI } from "../lib/stac";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
  BarChart,
  ReferenceLine,
  Bar,
  Cell,
  Legend,
  LabelList,
  Brush,
} from "recharts";
import {
  ESTACCollections,
  EStacLinkRel,
  ISTACFilterRequest,
  ITemporalItem,
  spatialItems,
  TCloudCoverFilter,
  temporalItems,
  TSnowCoverFilter,
  TSpatialFilter,
} from "../types/apiTypes";
import Loading from "./Loading";
import {
  EAggregationMethod,
  ELoadingSize,
  ELogLevel,
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
  getChartDataKey,
  getChartPoints,
  getGapDataKey,
  isDateValid,
  isOperatorValid,
  isROIValid,
  isValidFilter,
  isValidRange,
  log,
  toFirstLetterUppercase,
  isValidAnnotation,
} from "../utils/generalUtils";
import CustomizedDot from "./CustomizedDot";
import CustomizedDotComparison from "./CustomizedDotComparison";
import CustomNote from "./CustomNote";
import ChartTextarea from "./ChartTextarea";
import { useCurrentPng } from "recharts-to-png";
import { getLocaleISOString } from "../utils/dateUtils";

let start: number, end: number;
let startComparison: number, endComparison: number;

const Home = () => {
  const [getPng, { ref }] = useCurrentPng({
    backgroundColor: "#008b8b",
  });
  const { getFeatures } = useFilterSTAC();
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
  const notValidSamples = useMapStore((state) => state.notValidSamples);
  const responseFeatures = useMapStore((state) => state.responseFeatures);
  const errorFeatures = useMapStore((state) => state.errorFeatures);
  const errorNDVI = useMapStore((state) => state.errorNDVI);
  const doneFeature = useMapStore((state) => state.doneFeature);
  const temporalOp = useMapStore((state) => state.temporalOp);
  const spatialOp = useMapStore((state) => state.spatialOp);
  const limit = useMapStore((state) => state.limit);
  const radius = useMapStore((state) => state.radius);
  const nextPage = useMapStore((state) => state.nextPage);
  const previousPage = useMapStore((state) => state.previousPage);
  const sampleFilter = useMapStore((state) => state.sampleFilter);
  const smoothingWindow = useMapStore((state) => state.smoothingWindow);
  const yAxis = useMapStore((state) => state.yAxis);
  const polygons = useMapStore((state) => state.polygons);
  const annotations = useMapStore((state) => state.annotations);
  const nearestPoint = useMapStore((state) => state.nearestPoint);
  const chartIndex = useMapStore((state) => state.chartIndex);
  // Avoiding BarChart to reset after adding annotation
  const [showBarChart, setShowBarChart] = useState(true);

  const setChartIndex = useMapStore((state) => state.setChartIndex);
  const setNearestPoint = useMapStore((state) => state.setNearestPoint);
  const setAnnotations = useMapStore((state) => state.setAnnotations);
  const setLatency = useMapStore((state) => state.setLatency);
  const setPolygons = useMapStore((state) => state.setPolygons);
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
  const setRadius = useMapStore((state) => state.setRadius);
  const setMarker = useMapStore((state) => state.setMarker);

  const mapContainer = useRef<HTMLDivElement>(null);
  //const mapObject = useRef<MapLibre | null>(null);

  //const [latency, setLatency] = useState<number>();

  // Create a stable debounced function that always calls the latest getFeatures:
  // - useRef stores the current getFeatures so we can access the latest version even if it changes each render
  // - useEffect updates the ref whenever getFeatures changes
  // - useCallback wraps the debounced function so its reference stays stable across renders - the timer stays intact, preserving debounce behavior
  const getFeaturesRef = useRef(getFeatures);

  useEffect(() => {
    getFeaturesRef.current = getFeatures;
  }, [getFeatures]);

  const debouncedGetFeatures = useCallback(
    debounce(
      (postBody, a_RequestContext) =>
        getFeaturesRef.current(postBody, a_RequestContext),
      300,
    ),
    [],
  );

  const throttledGetFeatures = useCallback(
    throttle(
      (postBody, a_RequestContext) =>
        getFeaturesRef.current(postBody, a_RequestContext),
      10000,
    ),
    [],
  );

  const debouncedThrottledGetFeatures = throttle(
    debounce(
      (postBody, a_RequestContext) =>
        getFeaturesRef.current(postBody, a_RequestContext),
      300,
    ),
    1000,
  );

  const polygonsRef = useRef(polygons);
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
      if (!map) return;
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
      if (a_Event.originalEvent.button === 2 && map) {
        const polygonMarkers = markersRef.current.filter(
          (m) => m.type == EMarkerType.polygon,
        );
        if (polygonMarkers.length >= 3) {
          setPolygons((prev) => {

            let lastId = 0
            for(const p of prev){
              if(p.id > lastId){
                lastId= p.id
              }
            }

            return [
              ...prev,
              { id: lastId+1, markers: polygonMarkers },
            ]
          });
          setMarker((prev) => {
            return {
              ...prev,
              zonal: false,
            };
          });
        }
      }
      if (a_Event.originalEvent.button === 0 && map) {
        addMarker(
          [a_Event.lngLat.lng, a_Event.lngLat.lat],
          map,
          EMarkerType.polygon,
        );
      }
    },
    [map, addMarker, setPolygons, setMarker],
  );

  const removePolygonLayer = useCallback(
    (a_PolygonId: string) => {
      if (map) {
        const polygonLayer = map.getLayer(a_PolygonId);
        if (polygonLayer) {
          map.removeLayer(`${a_PolygonId}_label`);
          map.removeLayer(a_PolygonId);
          map.removeSource(a_PolygonId);

          /* const id = a_PolygonId.substring( a_PolygonId.indexOf("_") + 1 )
          const polygon = polygonsRef.current.find( p => p.id == Number(id) )
          if(polygon){
            polygon.markers.forEach( m => m.marker.remove() )
          } */
        }
      }
    },
    [map],
  );

  const removePolygonLayers = useCallback(() => {
    if (map) {
      const polygonLayers = map
        .getLayersOrder()
        .filter((l) => l.includes("polygon") && !l.includes("label"));
      if (polygonLayers) {
        polygonLayers.forEach((l) => {
          removePolygonLayer(l);
        });
      }
    }
  }, [map]);

  const drawPolygon = useCallback(
    (a_Polygon: IPolygon) => {
      if (!map) return;
      const polygonCoords = a_Polygon.markers.map((m) => {
        const lngLat = m.marker.getLngLat();
        return [lngLat.lng, lngLat.lat];
      });

      const polygonId = "polygon_" + a_Polygon.id;

      const geojson: Feature<Polygon> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [polygonCoords], // array of arrays
        },
        properties: {
          polygonId: a_Polygon.id,
        },
      };

      if (!map!.getStyle()) {
        return;
      }

      removePolygonLayer(polygonId);

      map!.addSource(polygonId, {
        type: "geojson",
        data: geojson,
      });

      map!.addLayer({
        id: polygonId,
        type: "fill",
        source: polygonId,
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.5,
        },
        metadata: {
          feature: geojson,
        },
      });

      map!.addLayer({
        id: `${polygonId}_label`,
        type: "symbol",
        source: polygonId,
        layout: {
          "text-field": ["get", "polygonId"],
          "text-size": 24,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#0f0",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });

      setMarkers((prev) => prev.filter((m) => m.type !== EMarkerType.polygon));
    },
    [map, removePolygonLayer, setMarkers],
  );

  const drawPolygons = useCallback(() => {
    polygonsRef.current.forEach((polygon) => {
      drawPolygon(polygon);
    });
  }, [polygons]);

  const redrawCircle = useCallback(() => {
    const point = markers.find((m) => m.type === EMarkerType.point);
    if (!point) return;

    const center: [number, number] = [
      point.marker.getLngLat().lng,
      point.marker.getLngLat().lat,
    ];

    drawCircle(center);
  }, [markers, drawCircle]);

  const getCoordinatesFromMarkers = useCallback(
    (a_RequestContext: ERequestContext): [number, number][] => {
      let thisFetchFeatures = fetchFeaturesRef.current[a_RequestContext];
      if (!thisFetchFeatures) return [];
      if (thisFetchFeatures.type === EMarkerType.polygon) {
        let index = polygonsRef.current.findIndex(
          (p) => p.id === thisFetchFeatures.id,
        );
        const thisPolygonLayer = polygonsRef.current.at(index);
        if (!thisPolygonLayer) return [];
        let coordinates: [number, number][] = thisPolygonLayer.markers
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
        if (!map) return [];
        const circleLayer = map.getLayer("circle");
        if (!circleLayer) return [];

        const metadata = circleLayer.metadata as ILayerMetadata;
        const feature = metadata?.feature;
        return feature?.geometry?.coordinates?.[0] || [];
      }
    },
    [map],
  );

  const getPostBody = useCallback(
    (a_RequestContext: ERequestContext) => {
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
            coordinates: [getCoordinatesFromMarkers(a_RequestContext)],
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
    },
    [
      cloudCover,
      snowCover,
      startDate,
      endDate,
      spatialOp,
      temporalOp,
      limit,
      getCoordinatesFromMarkers,
    ],
  );

  const showMap = useCallback(() => {
    setShowError(false);
    setShowChart(false);
    /* setFetchFeatures({
      "main": null,
      "comparison": null
    }); */
    setGlobalLoading({
      main: false,
      comparison: false,
    });
  }, [setShowError, setShowChart, setGlobalLoading]);

  const showLoadingModal = useCallback(() => {
    setShowError(false);
    setShowChart(false);
    /* setGlobalLoading(prev=>({
      ...prev,
      [a_RequestContext]: true
    })); */
  }, [setShowError, setShowChart, setGlobalLoading]);

  const showChartModal = useCallback(() => {
    setShowError(false);
    setShowChart(true);
    setGlobalLoading({
      main: false,
      comparison: false,
    });
  }, [setShowError, setShowChart, setGlobalLoading]);

  const showErrorModal = useCallback(() => {
    setShowError(true);
    setShowChart(false);
    setGlobalLoading({
      main: false,
      comparison: false,
    });
  }, [setShowError, setShowChart, setGlobalLoading]);

  const resetStates = useCallback(
    (a_RequestContext: ERequestContext) => {
      if (a_RequestContext == ERequestContext.main) {
        start = Date.now();
      } else {
        startComparison = Date.now();
      }
      setLatency((prev) => ({
        ...prev,
        [a_RequestContext]: 0,
      }));
      setSamples((prev) => ({
        ...prev,
        [a_RequestContext]: [],
      }));
      setNotValidSamples((prev) => ({
        ...prev,
        [a_RequestContext]: [],
      }));
      setResponseFeatures((prev) => ({
        ...prev,
        [a_RequestContext]: null,
      }));
      setErrorFeatures((prev) => ({
        ...prev,
        [a_RequestContext]: null,
      }));
    },
    [
      setLatency,
      setSamples,
      setNotValidSamples,
      setResponseFeatures,
      setErrorFeatures,
    ],
  );

  const handleCloseChart = useCallback(() => {
    setFetchFeatures({
      main: null,
      comparison: null,
    });
    setResponseFeatures({
      main: null,
      comparison: null,
    });
    setNearestPoint({
      x: 0,
      y: 0,
      note: "",
      featureId: "",
      datetime: "",
    });
    setChartIndex({
      start: undefined,
      end: undefined,
    });
    showMap();
  }, [setFetchFeatures, setResponseFeatures, setNearestPoint, setChartIndex, showMap]);

  const handleNextPageChart = useCallback(async () => {
    if (nextPage?.body) {
      const postBody: ISTACFilterRequest = {
        sortby: [{ field: "properties.datetime", direction: "asc" }],
        ...nextPage.body,
      };

      log("Next Request", postBody);
      setGlobalLoading((prev) => ({
        ...prev,
        main: true,
      }));
      setFetchFeatures((prev) => ({
        ...prev,
        comparison: null,
      }));
      resetStates(ERequestContext.main);
      debouncedGetFeatures(postBody, ERequestContext.main);
    }
  }, [nextPage, resetStates, debouncedGetFeatures]);

  const handlePreviousPageChart = useCallback(async () => {
    if (previousPage?.body) {
      const postBody: ISTACFilterRequest = {
        sortby: [{ field: "properties.datetime", direction: "asc" }],
        ...previousPage.body,
      };

      log("Previous Request", postBody);
      setGlobalLoading((prev) => ({
        ...prev,
        main: true,
      }));
      setFetchFeatures((prev) => ({
        ...prev,
        comparison: null,
      }));
      resetStates(ERequestContext.main);
      debouncedGetFeatures(postBody, ERequestContext.main);
    }
  }, [previousPage, resetStates, debouncedGetFeatures]);

  const handleFlyToROI = useCallback(
    (a_To: EMarkerType, a_Zoom: number) => {
      if (a_To === EMarkerType.polygon) {
        const lastPolygonLayer = map!
          .getLayersOrder()
          .filter((l) => l.includes("polygon") && !l.includes("label"))
          .at(-1);
        if (!lastPolygonLayer) return;
        const polygonLayer = map!.getLayer(lastPolygonLayer);
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

  const getYAxisLabel = () => {
    let smoothingStatus = smoothingWindow[0].value !== "1" ? `smoothed` : "raw";
    let yAxisStatus = yAxis == EAggregationMethod.Mean ? "Mean" : "Median";
    const full = yAxisStatus + " - " + smoothingStatus;
    return full;
  };

  const getChartLegend = (a_RequestContext: ERequestContext) => {
    const thisFetchFeature = fetchFeaturesRef.current[a_RequestContext];
    if (!thisFetchFeature) return;

    return `${toFirstLetterUppercase(a_RequestContext)} Area NDVI (${
      thisFetchFeature.type == EMarkerType.point
        ? toFirstLetterUppercase(thisFetchFeature.type)
        : "Zonal Nr." + thisFetchFeature.id
    })`;
  };

  const getPoints = useCallback(
    (a_StartIndex?: number, a_EndIndex?: number) =>
      getChartPoints(
        samples,
        notValidSamples,
        annotations,
        a_StartIndex,
        a_EndIndex,
      ),
    [samples, notValidSamples, annotations],
  );

  const handleChartClick = (e) => {
    if (!e || !e.activeIndex) return;

    const point = getPoints()[e.activeIndex];
    setShowBarChart(false);
    setNearestPoint({
      x: e.activeCoordinate.x,
      y: e.activeCoordinate.y,
      datetime: point.datetime,
      note: point.note ? point.note.trim() : "",
      featureId: point.featureId,
    });
  };

  const handleChartDbClick = () => {
    setChartIndex({
      start: undefined,
      end: undefined,
    });
  };

  const handleChangeTextarea = (a_Text: string) => {
    setNearestPoint((prev) => ({
      ...prev,
      note: a_Text,
    }));
  };

  const handleCloseTextarea = () => {
    setNearestPoint({
      datetime: "",
      note: "",
      featureId: "",
      x: 0,
      y: 0,
    });
    setShowBarChart(true);
  };

  const handleBrushChange = (ev) => {
    setChartIndex({
      start: ev.startIndex,
      end: ev.endIndex,
    });
  };

  const handleExportPNG = async () => {
    const png = await getPng();
    if (png) {
      const link = document.createElement("a");
      link.download = `exportedPNG_${getLocaleISOString(new Date(Date.now()))}.png`;
      link.href = png;
      link.click();
    } else {
      log("Failed to export PNG", png, ELogLevel.error);
    }
  };

  // Follow Annotation Note
  useEffect(() => {
    if (nearestPoint.featureId === "") return;
    setAnnotations((prev) => {
      const index = prev.findIndex(
        (a) => a.featureId === nearestPoint.featureId,
      );

      if (index !== -1) {
        return prev.map((a) =>
          a.featureId === nearestPoint.featureId
            ? { ...a, note: nearestPoint.note }
            : a,
        );
      }

      if (!nearestPoint.note.trim()) {
        return prev;
      }

      return [
        ...prev,
        {
          note: nearestPoint.note,
          featureId: nearestPoint.featureId,
          datetime: nearestPoint.datetime,
        },
      ];
    });
  }, [nearestPoint]);

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
      dragRotate: false,
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

  // Follow Changing Polygons
  useEffect(() => {
    polygonsRef.current = polygons;
    if (polygons.length === 0) {
      removePolygonLayers();
    } else {
      drawPolygons();
    }
  }, [polygons]);

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

  // Follow Changing Markers
  useEffect(() => {
    if (!map) return;
    markersRef.current = markers;

    const pointMarker = markers.filter((m) => m.type == EMarkerType.point);

    if (pointMarker.length === 0) {
      showMap();
      removeCircleLayer();
    }
  }, [markers]);

  // Read URLParams
  useEffect(() => {
    if (!map) return;

    const params = new URLSearchParams(window.location.search);

    // point or zonal
    const pointROI = params.get(EURLParams.pointROI);
    let zonalROIs = new Map<string, string>();
    for (const [key, value] of params.entries()) {
      if (key.startsWith(EURLParams.zonalROI + "-") && value) {
        zonalROIs.set(key, value);
      }
    }

    if (pointROI) {
      if (isROIValid(pointROI, EMarkerType.point)) {
        removeCircleLayer();
        removeMarker(EMarkerType.point);

        setTimeout(() => {
          if (!map) {
            log(
              "Read URLParams",
              "Failed to use URLParam: Map is not ready",
              ELogLevel.warning,
            );
            return;
          }
          const parsedROI = JSON.parse(pointROI) as [[number, number], string];
          const [center, radius] = parsedROI;
          addMarker(center, map, EMarkerType.point, { color: "green" });
          setRadius(radius);
          drawCircle(center);
        }, 100);
      } else {
        log(
          "Read URLParams",
          "Failed to use URLParam: pointROI does not match",
          ELogLevel.warning,
        );
      }
    }
    if (zonalROIs.size > 0) {
      setPolygons([]);
       
      zonalROIs.forEach((zonalROI, key) => {
        if (isROIValid(zonalROI, EMarkerType.polygon)) {
          removeMarker(EMarkerType.polygon);
          setTimeout(() => {
            const parsedROI: [number, number][] = JSON.parse(zonalROI);
            let thisPolygonMarkers: IMarker[] = [];
            parsedROI.forEach((coordinate) => {
              const [lng, lat] = coordinate;
              if (!map) {
                log(
                  "Read URLParams",
                  "Failed to use URLParam: Map is not ready",
                  ELogLevel.warning,
                );
                return;
              }
              const markerElement = new maplibregl.Marker()
                .setLngLat([lng, lat])
                .addTo(map);

              const newMarker = {
                type: EMarkerType.polygon,
                marker: markerElement,
              };

              thisPolygonMarkers.push(newMarker);
            });
            setPolygons((prev) => [
              ...prev,
              { id: +key.substring( key.lastIndexOf("-")+1 ), markers: thisPolygonMarkers },
            ]);
          }, 100);
        } else {
          log(
            "Read URLParams",
            "Failed to use URLParam: "+
              (key) +
              " does not match",
            ELogLevel.warning,
          );
        }
      });
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
        log(
          "Read URLParams",
          "Failed to use URLParam: startdate does not match",
          ELogLevel.warning,
        );
      }
    }
    if (endDateParam) {
      if (isDateValid(endDateParam)) {
        setEndDate(endDateParam);
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
    const temporalOpParam = params.get(EURLParams.temporalOp);
    if (temporalOpParam) {
      if (isOperatorValid(temporalOpParam, temporalItems)) {
        setTemporalOp(
          temporalItems.find(
            (i) => i.title.toLowerCase() == temporalOpParam.toLowerCase(),
          )!.value,
        );
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
        setCloudCover(cloudParam);
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
        setSnowCover(snowParam);
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
        setLimit(limitParam);
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
        setCoverageThreshold(coverageParam);
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
        setSampleFilter(
          ["none", "z-score", "IQR"].find(
            (i) => i.toLowerCase() == filterParam.toLowerCase(),
          ) as ESampleFilter,
        );
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
        setAnnotations(JSON.parse(annotationsParam));
      } else {
        log(
          "Read URLParams",
          "Failed to use URLParam: annotations does not match",
          ELogLevel.warning,
        );
      }
    }
  }, [map]);

  // Write URLParams
  useEffect(() => {
    if (!map) return;

    const pointMarkers = markers.filter((m) => m.type === EMarkerType.point);

    const params = new URLSearchParams();
    const existingParams = new URLSearchParams(window.location.search);
    const loglevel = existingParams.get(EURLParams.loglevel);
    if (loglevel) {
      params.set(EURLParams.loglevel, loglevel);
    }

    if (polygons.length > 0) {
      polygons.forEach((polygon) => {
        const polygonCoords = polygon.markers.map((m) => {
          const lngLat = m.marker.getLngLat();
          return [lngLat.lng, lngLat.lat];
        });
        params.set(
          EURLParams.zonalROI + "-" + polygon.id,
          JSON.stringify(polygonCoords),
        );
      });
    }
    if (pointMarkers.length > 0) {
      const pointCoords = pointMarkers.map((m) => {
        const lngLat = m.marker.getLngLat();
        return [lngLat.lng, lngLat.lat];
      });
      const point = [...pointCoords, Number(radius)];
      params.set(EURLParams.pointROI, JSON.stringify(point));
    }
    params.set(EURLParams.startDate, startDate);
    params.set(EURLParams.endDate, endDate);
    params.set(
      EURLParams.temporalOp,
      temporalItems.find((i) => i.value === temporalOp)!.title.toLowerCase(),
    );
    params.set(
      EURLParams.spatialOp,
      spatialItems.find((i) => i.value === spatialOp)!.title.toLowerCase(),
    );
    params.set(EURLParams.cloud, cloudCover);
    params.set(EURLParams.snow, snowCover);
    params.set(EURLParams.limit, limit);
    params.set(EURLParams.coverage, coverageThreshold);
    params.set(EURLParams.filter, sampleFilter);

    if (annotations.length > 0) {
      params.set(EURLParams.annotations, JSON.stringify(annotations));
    }

    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [
    map,
    markers,
    polygons,
    radius,
    startDate,
    endDate,
    temporalOp,
    spatialOp,
    cloudCover,
    snowCover,
    limit,
    coverageThreshold,
    sampleFilter,
    annotations,
  ]);

  // Get NDVI for STAC Items

  // 1. Get Features
  useEffect(() => {
    fetchFeaturesRef.current.main = fetchFeatures.main;

    if (fetchFeatures.main) {
      const postBody = getPostBody(ERequestContext.main);
      resetStates(ERequestContext.main);
      log("Request Body_" + ERequestContext.main, postBody);
      setGlobalLoading((prev) => ({
        ...prev,
        main: true,
      }));
      debouncedGetFeatures(postBody, ERequestContext.main);
    } else {
      resetStates(ERequestContext.main);
      showMap();
    }
  }, [fetchFeatures.main]);

  useEffect(() => {
    //comparisonItemRef.current = comparisonItem
    fetchFeaturesRef.current.comparison = fetchFeatures.comparison;
    if (fetchFeatures.comparison) {
      const postBody = getPostBody(ERequestContext.comparison);
      resetStates(ERequestContext.comparison);
      startComparison = Date.now();
      log("Request Body_" + ERequestContext.comparison, postBody);
      setGlobalLoading((prev) => ({
        ...prev,
        comparison: true,
      }));
      debouncedGetFeatures(postBody, ERequestContext.comparison);
    } else {
      resetStates(ERequestContext.comparison);
    }
  }, [fetchFeatures.comparison]);

  useEffect(() => {
    if (errorFeatures[ERequestContext.main]) {
      log("Failed to get features", errorFeatures, ELogLevel.error);
      resetStates(ERequestContext.main);
      setNextPage(null);
      setPreviousPage(null);
      showErrorModal();
    }
  }, [errorFeatures]);

  // 2. Calculate NDVI
  useEffect(() => {
    if (responseFeatures.main) {
      const nextLink = responseFeatures[ERequestContext.main].links?.find(
        (l) => l.rel == EStacLinkRel.next,
      );
      const previousLink = responseFeatures[ERequestContext.main].links?.find(
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

      const hasResponseFeatureLength =
        responseFeatures.main.features.length !== 0;
      if (hasResponseFeatureLength) {
        const NDVIItem: INDVIPanel = {
          filter: sampleFilter,
          coverageThreshold: Number(coverageThreshold),
        };
        //console.log(new Date(Date.now()).toISOString()+" STAC item numbers: " + responseFeatures.features.length)
        getNDVI(
          responseFeatures[ERequestContext.main].features,
          getCoordinatesFromMarkers(ERequestContext.main),
          NDVIItem,
          ERequestContext.main,
        );
      } else {
        showErrorModal();
      }
    }
  }, [responseFeatures.main]);

  useEffect(() => {
    if (responseFeatures.comparison) {
      const hasResponseFeatureLength =
        responseFeatures.comparison.features.length !== 0;
      if (hasResponseFeatureLength) {
        const NDVIItem: INDVIPanel = {
          filter: sampleFilter,
          coverageThreshold: Number(coverageThreshold),
        };
        //console.log(new Date(Date.now()).toISOString()+" STAC item numbers: " + responseFeatures.features.length)
        getNDVI(
          responseFeatures[ERequestContext.comparison].features,
          getCoordinatesFromMarkers(ERequestContext.comparison),
          NDVIItem,
          ERequestContext.comparison,
        );
      } else {
        log(
          `responseFeatures.comparison.features.length`,
          responseFeatures.comparison.features.length,
          ELogLevel.warning,
        );
        //showErrorModal();
      }
    }
  }, [responseFeatures.comparison]);

  useEffect(() => {
    if (errorNDVI[ERequestContext.main]) {
      log("Failed to calculate NDVI", errorNDVI, ELogLevel.error);
      resetStates(ERequestContext.main);
      setNextPage(null);
      setPreviousPage(null);
      showErrorModal();
    }
  }, [errorNDVI]);

  // 3. Show Chart
  useEffect(() => {
    if (globalLoading.main) {
      start = Date.now();
      showLoadingModal();
    } else {
      if (responseFeatures[ERequestContext.main] == null) return; // avoding show Chart on mounting
      if (samples[ERequestContext.main].every((s) => !s.meanNDVI)) {
        showErrorModal();
        end = Date.now();
        setLatency((prev) => ({
          ...prev,
          main: end - start,
        }));
      } else {
        end = Date.now();
        setLatency((prev) => ({
          ...prev,
          main: end - start,
        }));
        showChartModal();
      }
    }
  }, [globalLoading.main]);

  useEffect(() => {
    if (globalLoading.comparison) {
      startComparison = Date.now();
    } else {
      if (responseFeatures[ERequestContext.comparison] == null) return; // avoding show Chart on mounting
      endComparison = Date.now();
      setLatency((prev) => ({
        ...prev,
        comparison: endComparison - startComparison,
      }));
    }
  }, [globalLoading.comparison]);

  return (
    <div className={` ${mapStyle.wrapper}`}>
      {polygons.length !== 0 ? (
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
        style={{ width: "100%", height: "100%", pointerEvents: fetchFeatures.comparison !== null || fetchFeatures.main !== null ? 'none' : 'auto' }}
        ref={mapContainer}
        data-testid="map-container"
      />
      {showChart ? (
        <Chart
          onClose={handleCloseChart}
          onNext={handleNextPageChart}
          onPrevious={handlePreviousPageChart}
          onExportPNG={handleExportPNG}
          items={responseFeatures[ERequestContext.main]?.features.length ?? 0}
        >
          <ResponsiveContainer width="100%" height="80%">
            {/* resize automatically */}
            {/* array of objects */}
            {nearestPoint.x !== 0 && nearestPoint.y !== 0 ? (
              <ChartTextarea
                value={nearestPoint.note}
                x={nearestPoint.x}
                y={nearestPoint.y}
                onChange={handleChangeTextarea}
                onClose={handleCloseTextarea}
              />
            ) : (
              <></>
            )}
            <LineChart
              data={getPoints(chartIndex.start, chartIndex.end)}
              onClick={handleChartClick}
              ref={ref}
              margin={{ right: 150 }}
            >
              <XAxis
                dataKey={"id"}
                stroke="white"
                tickFormatter={(id) =>
                  getPoints(chartIndex.start, chartIndex.end)
                    .find((d) => d.id === id)!
                    .datetime.substring(0, 10)
                }
              />
              {/* Y automatically scale to fit the data */}
              <YAxis stroke="white" domain={[-1, 1]}>
                <Label
                  style={{
                    textAnchor: "middle",
                    fontSize: "1.1rem",
                    fill: "white",
                  }}
                  angle={270}
                  value={getYAxisLabel()}
                />
              </YAxis>
              {/* popup tooltip by hovering */}
              <Tooltip
                content={CustomTooltip}
                position={{ x: -200, y: -100 }}
                wrapperStyle={{ maxWidth: "15%" }}
              />
              <Legend />
              {/* MAIN */}
              <Line
                type="linear"
                dataKey={getChartDataKey(
                  ERequestContext.main,
                  yAxis,
                  smoothingWindow[0].value,
                )}
                stroke="#00ff1eff"
                dot={CustomizedDot}
                width={2}
                name={getChartLegend(ERequestContext.main)}
                legendType="line"
              >
                <LabelList dataKey="note" content={<CustomNote />} />
              </Line>

              <Line
                type="linear"
                dataKey={getGapDataKey(ERequestContext.main, yAxis)}
                stroke="#00ff1eff"
                opacity={0.5}
                width={2}
                legendType={"none"}
              />
              {fetchFeatures.comparison ? (
                <>
                  <Line
                    type="linear"
                    dataKey={getChartDataKey(
                      ERequestContext.comparison,
                      yAxis,
                      smoothingWindow[0].value,
                    )}
                    stroke="#ffb300ff"
                    dot={CustomizedDotComparison}
                    width={2}
                    name={getChartLegend(ERequestContext.comparison)}
                    legendType="line"
                  />

                  <Line
                    type="linear"
                    dataKey={getGapDataKey(ERequestContext.comparison, yAxis)}
                    stroke="#ffb300ff"
                    opacity={0.5}
                    width={2}
                    legendType={"none"}
                  />
                </>
              ) : (
                <></>
              )}
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height="20%">
            {showBarChart ? (
              <BarChart
                data={getPoints()}
                margin={{ left: 60, right: 150 }}
                onDoubleClick={handleChartDbClick}
              >
                <XAxis dataKey={"id"} stroke="white" hide />
                <YAxis domain={[0, 100]} hide />

                <ReferenceLine
                  y={Number(coverageThreshold)}
                  stroke="#ff6b6b"
                  strokeDasharray="4 4"
                >
                  <Label
                    style={{
                      textAnchor: "middle",
                      fontSize: "1.01rem",
                      fill: "#dad458ff",
                    }}
                    value={Number(coverageThreshold) + "%"}
                  />
                </ReferenceLine>

                <Bar dataKey={"valid_fraction"} barSize={20}>
                  {getPoints(chartIndex.start, chartIndex.end).map(
                    (sample, index) => (
                      <Cell
                        key={sample.id}
                        fill={
                          sample.valid_fraction < Number(coverageThreshold)
                            ? "rgba(255, 0, 0, 0.77)"
                            : "rgba(56,161,105,0.8)"
                        }
                      />
                    ),
                  )}
                </Bar>
                <Tooltip
                  content={CustomTooltip}
                  position={{ x: -200, y: -100 }}
                  wrapperStyle={{ maxWidth: "15%" }}
                />
                <Brush
                  dataKey="id"
                  height={20}
                  stroke="#b4e373ff"
                  startIndex={chartIndex.start}
                  endIndex={chartIndex.end}
                  onChange={handleBrushChange}
                  tickFormatter={(id) =>
                    getPoints()
                      .find((d) => d.id === id)!
                      .datetime.substring(0, 10)
                  }
                />
              </BarChart>
            ) : (
              <></>
            )}
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
              {responseFeatures[ERequestContext.main] &&
              responseFeatures[ERequestContext.main].features &&
              responseFeatures[ERequestContext.main]?.features.length == 0
                ? "No STAC Item found!"
                : "No Valid Scene found! Check the list for more information."}
            </div>
          </div>
        </Chart>
      ) : (
        <></>
      )}
      {globalLoading.main ? (
        <Chart
          onClose={handleCloseChart}
          onNext={handleNextPageChart}
          onPrevious={handlePreviousPageChart}
        >
          <Loading
            text={
              fetchFeatures.comparison
                ? responseFeatures[ERequestContext.comparison]?.features.length
                  ? `${doneFeature[ERequestContext.comparison]}/${responseFeatures[ERequestContext.comparison]?.features.length} `
                  : "N/A"
                : responseFeatures[ERequestContext.main]?.features.length
                  ? `${doneFeature[ERequestContext.main]}/${responseFeatures[ERequestContext.main]?.features.length} `
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

export default Home;
