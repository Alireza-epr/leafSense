import mapStyle from "./Map.module.scss";
import { useRef, useEffect, useCallback, use, useState } from "react";
import maplibregl from "maplibre-gl";
import { Map as MapLibre } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { EMarkerType, IMarker, useMapStore } from "../store/mapStore";
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
  TCloudCoverFilter,
  TDateTimeFilter,
  TSnowCoverFilter,
  TSpatialFilter,
} from "../types/apiTypes";
import Loading from "./Loading";
import { ELoadingSize, ILayerMetadata, INDVIPanel, Units } from "../types/generalTypes";
import Chart from "./Chart";
import { debounce, throttle } from "../utils/apiUtils";
import CustomTooltip from "./CustomTooltip";
import circle from "@turf/circle"

let start: number, end: number;

const Map = () => {
  const { getFeatures } = useFilterSTAC();
  const { getTokenCollection } = useTokenCollection();
  const { getNDVI } = useNDVI();

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

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapObject = useRef<MapLibre | null>(null);

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
  
  const addPointMarker = (a_Event: maplibregl.MapMouseEvent) => {
    if(a_Event.originalEvent.button == 0 && mapObject.current) {
      removeMarker(EMarkerType.point)

      const center: [number, number] = [a_Event.lngLat.lng, a_Event.lngLat.lat]
      addMarker(center, mapObject.current, EMarkerType.point, {color: "green"});

      drawCircle(center)
    }
  }

  const addPolygonMarker = (a_Event: maplibregl.MapMouseEvent) => {
    if (a_Event.originalEvent.button == 0 && mapObject.current) {
      addMarker(
        [a_Event.lngLat.lng, a_Event.lngLat.lat],
        mapObject.current,
        EMarkerType.polygon,
      );
    }
  };

  const addMarker = (
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
  };

  const removeMarker = (a_MarkerType: EMarkerType) => {
    setMarkers((prev) => {
      const toRemove = prev.filter((m) => m.type === a_MarkerType);
      toRemove.forEach((m) => m.marker.remove());

      return prev.filter((m) => m.type !== a_MarkerType);
    });
  }

  const removePolygonLayer = () => {
    if (mapObject.current) {
      const polygonLayer = mapObject.current.getLayer("polygon");
      if (polygonLayer) {
        mapObject.current.removeLayer("polygon");
        mapObject.current.removeSource("polygon");
      }
    }
  };

  const removeCircleLayer = () => {
    if (mapObject.current) {
      const circleLayer = mapObject.current.getLayer("circle");
      if (circleLayer) {
        mapObject.current.removeLayer("circle");
        mapObject.current.removeSource("circle");
      }
    }
  };

  const removePolygon = () => {
    if (mapObject.current) {
      // Remove polygon points
      markersRef.current.forEach((m) => {
        if (m.type === EMarkerType.polygon) {
          m.marker.remove();
        }
      });
      setMarkers((prev) => prev.filter((m) => m.type !== EMarkerType.polygon));

      // Remove polygon layer
      removePolygonLayer();
    }
  };

  const drawPolygon = (a_PolygonMarkers: IMarker[]) => {
    const polygonCoords = a_PolygonMarkers.map((m) => {
      const lngLat = m.marker.getLngLat();
      return [lngLat.lng, lngLat.lat];
    });

    const geojson: Feature<Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [polygonCoords], // note: array of arrays
      },
      properties: {},
    };

    removePolygonLayer();

    if (!mapObject.current!.getStyle()) {
      return;
    }

    mapObject.current!.addSource("polygon", {
      type: "geojson",
      data: geojson,
    });

    mapObject.current!.addLayer({
      id: "polygon",
      type: "fill",
      source: "polygon",
      paint: {
        "fill-color": "#088",
        "fill-opacity": 0.5,
      },
      metadata: {
        feature: geojson
      }
    });
  };

  const drawCircle = (a_Center: [number, number]) => {

    const radius = Number(radiusRef.current) 
    const options = {units: "meters" as Units};
    const circleFeature = circle( a_Center, radius, options )
    
    removeCircleLayer();

    if (!mapObject.current!.getStyle()) {
      return;
    }

    mapObject.current!.addSource("circle", {
      type: "geojson",
      data: circleFeature,
    });

    mapObject.current!.addLayer({
      id: "circle",
      type: "fill",
      source: "circle",
      paint: {
        "fill-color": "rgba(4, 185, 64, 1)",
        "fill-opacity": 0.5,
      },
      metadata: {
        feature: circleFeature,
        center: a_Center
      }
    });
  };

  const redrawCircle = () => {
    const point = markers.find( m => m.type === EMarkerType.point )
    if(!point) return 
    const center: [number, number] = [point.marker.getLngLat().lng, point.marker.getLngLat().lat]
    drawCircle(center)
  }

  const addMarkersToMap = () => {
    setMarkers((prev) => {
      const updated: IMarker[] = [];

      for (const marker of prev) {
        if (marker.marker._map) {
          updated.push(marker);
          continue;
        }

        const newMarkerWithMap = new maplibregl.Marker()
          .setLngLat(marker.marker.getLngLat())
          .addTo(mapObject.current!);

        updated.push({
          type: marker.type,
          marker: newMarkerWithMap,
        });
      }
      return updated;
    });
  };

  const getCoordinatesFromMarkers = (): [number, number][] => {
    
    if(fetchFeaturesRef.current === EMarkerType.polygon){
      let coordinates: [number, number][] = markersRef.current.filter( m => m.type === EMarkerType.polygon ).map((m) => {
        const lng = m.marker.getLngLat().lng;
        const lat = m.marker.getLngLat().lat;
        return [lng, lat];
      });
      // Close the polygon
      coordinates.push(coordinates[0]);
      return coordinates;
    } else {
      const circleLayer = mapObject.current!.getLayer("circle");
      const metadata = circleLayer!.metadata as ILayerMetadata
      const feature = metadata!.feature
      return feature.geometry.coordinates[0]
    }
  };

  const getPostBody = () => {
    const cloudCoverFilter: TCloudCoverFilter = {
      op: "<=",
      args: [
        {
          property: "eo:cloud_cover",
        },
        Number(cloudCover),
      ],
    };
    const snowCoverFilter: TSnowCoverFilter = {
      op: "<=",
      args: [
        {
          property: "s2:snow_ice_percentage",
        },
        Number(snowCover),
      ],
    };
    const datetimeFilter: TDateTimeFilter = {
      op: "t_during",
      args: [
        {
          property: "datetime",
        },
        {
          interval: [startDate, endDate],
        },
      ],
    };
    const geometryFilter: TSpatialFilter = {
      op: spatialOp,
      args: [
        {
          property: "geometry",
        },
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
      sortby: [
        {
          field: "properties.datetime",
          direction: "asc",
        },
      ],
      collections: [ESTACCollections.Sentinel2l2a],
      filter: {
        op: "and",
        args: [cloudCoverFilter, snowCoverFilter, geometryFilter],
      },
      datetime: temporalFilter,
      limit: Number(limit),
    };

    return postBody
  }

  const showMap = () => {
    setShowError(false);
    setShowChart(false);
    setFetchFeatures(null);
    setGlobalLoading(false);
  };

  const showLoadingModal = () => {
    setShowError(false);
    setShowChart(false);
    setGlobalLoading(true);
  };

  const showChartModal = () => {
    setShowError(false);
    setShowChart(true);
    setGlobalLoading(false);
  };

  const showErrorModal = () => {
    setShowError(true);
    setShowChart(false);
    setGlobalLoading(false);
  };

  const resetStates = () => {
    start = Date.now();
    setLatency(0)
    setSamples([]);
    setNotValidSamples([])
    setResponseFeatures(null);
    setErrorFeatures(null);
  };

  const handleCloseChart = () => {
    setFetchFeatures(null);
    showMap();
  };

  const handleNextPageChart = async () => {
    if (nextPage && nextPage.body) {
      const postBody: ISTACFilterRequest = {
        sortby: [
          {
            field: "properties.datetime",
            direction: "asc",
          },
        ],
        ...nextPage.body,
      };

      console.log("Next Request");
      console.log(postBody);
      showLoadingModal();
      resetStates();
      debouncedGetFeatures(postBody);
    }
  };

  const handlePreviousPageChart = async () => {
    if (previousPage && previousPage.body) {
      const postBody: ISTACFilterRequest = {
        sortby: [
          {
            field: "properties.datetime",
            direction: "asc",
          },
        ],
        ...previousPage.body,
      };

      console.log("Previous Request");
      console.log(postBody);
      showLoadingModal();
      resetStates();
      debouncedGetFeatures(postBody);
    }
  };

  const handleFlyToROI = (a_To: EMarkerType,a_Zoom: number) => {
    if(a_To == EMarkerType.polygon) {
      const polygonLayer = mapObject.current!.getLayer("polygon");
      const metadata = polygonLayer!.metadata as ILayerMetadata
      const feature = metadata!.feature
      const coordinates: [number, number][][] = feature.geometry.coordinates
      mapObject.current!.fitBounds([coordinates[0][0], coordinates[0][1]], {
        zoom: a_Zoom,
      });
    } 
    if(a_To == EMarkerType.point) {
      const circleLayer = mapObject.current!.getLayer("circle");
      const metadata = circleLayer!.metadata as ILayerMetadata
      const center = metadata!.center
      mapObject.current!.fitBounds([center, center], {
        zoom: a_Zoom,
      });
    }
    
  };

  // Loading Map
  useEffect(() => {
    if (mapObject.current || !mapContainer.current) return;

    const map = new maplibregl.Map({
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

    map.addControl(new maplibregl.NavigationControl());

    mapObject.current = map;

    window.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
    });

    return () => {
      // By component unmounting
      mapObject.current?.remove();
      mapObject.current = null;
    };
  }, []);

  // Follow Changing Radius
  useEffect(()=>{
    radiusRef.current = radius
    redrawCircle()
  },[radius])

  // Handle Marker
  useEffect(() => {
    if (!mapObject.current) return;

    if (marker.zonal) {
      mapObject.current.on("mousedown", addPolygonMarker);
    } else {
      mapObject.current.off("mousedown", addPolygonMarker);
    }

    if (marker.point) {
      mapObject.current.on("mousedown", addPointMarker);
    } else {
      mapObject.current.off("mousedown", addPointMarker);
    }

    return () => {
      mapObject.current?.off("mousedown", addPolygonMarker);
      mapObject.current?.off("mousedown", addPointMarker);
    };
  }, [marker]);

  // Handle Polygon Drawing
  useEffect(() => {
    if (!mapObject.current) return;
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

      addMarker(
        [lngLat.lng, lngLat.lat],
        mapObject.current,
        EMarkerType.polygon,
      );
      return;
    }

    //console.log("start drawing polygon");
    //console.log(markers);
    drawPolygon(polygonMarkers);
  }, [markers]);

  // Read URLParams
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const polygonCoordsParam = params.get("roi");
    const startDateParam = params.get("startDate");
    const endDateParam = params.get("endDate");
    const cloudParam = params.get("cloud");

    if (polygonCoordsParam) {
      let polygonCoords: [number, number][] = JSON.parse(polygonCoordsParam);

      // Clear polygon points
      setMarkers((prev) => {
        const pointMarkers = prev.filter((m) => m.type === EMarkerType.point);

        return pointMarkers;
      });

      // Add polygon markers
      setTimeout(() => {
        polygonCoords.forEach((coordinate) => {
          const [lng, lat] = coordinate;
          if (!mapObject.current) {
            console.log("Map is not ready to set markers from URL");
            return;
          }
          addMarker([lng, lat], mapObject.current, EMarkerType.polygon);
        });
      }, 100);
    }
    if (startDateParam) {
      setStartDate(startDateParam);
    }
    if (endDateParam) {
      setEndDate(endDateParam);
    }
    if (cloudParam) {
      setCloudCover(cloudParam);
    }
  }, []);

  // Write URLParams
  useEffect(() => {
    const polygonMarkers = markers.filter(
      (m) => m.type === EMarkerType.polygon,
    );

    const params = new URLSearchParams();

    if (polygonMarkers.length > 0) {
      const polygonCoords = polygonMarkers.map((m) => {
        const lngLat = m.marker.getLngLat();
        return [lngLat.lng, lngLat.lat];
      });
      params.set("roi", JSON.stringify(polygonCoords));
    }
    if (startDate) {
      params.set("startDate", startDate);
    }
    if (endDate) {
      params.set("endDate", endDate);
    }
    if (cloudCover) {
      params.set("cloud", cloudCover);
    }

    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [markers, startDate, endDate, cloudCover]);

  // Get NDVI for STAC Items

  // 1. Get Features
  useEffect(() => {
    if (fetchFeatures !== null) {
      fetchFeaturesRef.current = fetchFeatures
      const postBody = getPostBody()
      showLoadingModal();
      resetStates();
      start = Date.now();
      console.log("Request Body")
      console.log(postBody)
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
      if(responseFeatures && responseFeatures.features.length !== 0){
        showErrorModal()
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
    if(globalLoading) {
      showLoadingModal()
    } else {
      if(responseFeatures == null) return // avoding show Chart on mounting
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
          onClick={() => handleFlyToROI(EMarkerType.polygon ,mapObject.current!.getZoom())}
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
          onClick={() => handleFlyToROI(EMarkerType.point, mapObject.current!.getZoom())}
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
