import mapStyle from "./Map.module.scss";
import { useRef, useEffect, useCallback, use, useState } from "react";
import maplibregl from "maplibre-gl";
import { Map as MapLibre } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { EMarkerType, IMarker, useMapStore } from "../store/mapStore";
import type { Feature, FeatureCollection, Polygon } from "geojson";
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
import { ELoadingSize } from "../types/generalTypes";
import Chart from "./Chart";
import { debounce, throttle } from "../utils/apiUtils";
import { getLngLatsFromMarker } from "../utils/calculationUtils";

let start: number, end: number

const Map = () => {
  const { getFeatures } = useFilterSTAC();
  const { getTokenCollection } = useTokenCollection();
  const { getNDVI } = useNDVI();

  const marker = useMapStore((state) => state.marker);
  const startDate = useMapStore((state) => state.startDate);
  const endDate = useMapStore((state) => state.endDate);
  const cloudCover = useMapStore((state) => state.cloudCover);
  const snowCover = useMapStore((state) => state.snowCover);
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
  const nextPage = useMapStore((state) => state.nextPage);
  const previousPage = useMapStore((state) => state.previousPage);
   
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
  const setGlobalLoading = useMapStore((state) => state.setGlobalLoading);
  const setResponseFeatures = useMapStore((state) => state.setResponseFeatures);
  const setErrorFeatures = useMapStore((state) => state.setErrorFeatures);
  const setErrorNDVI = useMapStore((state) => state.setErrorNDVI);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapObject = useRef<MapLibre | null>(null);

  const [ latency, setLatency ] = useState<number>()

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
    []
  );

  const throttledGetFeatures = useCallback(
    throttle((postBody) => getFeaturesRef.current(postBody), 10000),
    []
  );

  const debouncedThrottledGetFeatures = throttle(
    debounce((postBody) => getFeaturesRef.current(postBody), 300),
    1000
  );

  const handlePointMarker = (a_Event: maplibregl.MapMouseEvent) => {
    if (mapObject.current) {
      addMarker(
        [a_Event.lngLat.lng, a_Event.lngLat.lat],
        mapObject.current,
        EMarkerType.point,
        { draggable: true },
      );
    }
  };

  const markersRef = useRef(markers)

  const handlePolygonMarker = (a_Event: maplibregl.MapMouseEvent) => {
    if(a_Event.originalEvent.button === 2){
      removePolygon()

      const lngLats = getLngLatsFromMarker(a_Event.lngLat)
      lngLats.forEach( lngLat => {
        if(!mapObject.current) return
        addMarker(
          lngLat,
          mapObject.current,
          EMarkerType.polygon
        )
      })

    } else if (a_Event.originalEvent.button == 0 && mapObject.current) {
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

  const removePolygonLayer = () => {
    if (mapObject.current) {
      const polygonLayer = mapObject.current.getLayer("polygon");
      if (polygonLayer) {
        mapObject.current.removeLayer("polygon");
        mapObject.current.removeSource("polygon");
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
    });
  };

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
    let coordinates: [number, number][] = markers.map((m) => {
      const lng = m.marker.getLngLat().lng;
      const lat = m.marker.getLngLat().lat;
      return [lng, lat];
    });
    // Close the polygon
    coordinates.push(coordinates[0]);

    return coordinates;
  };

  const showMap = () => {
    setShowError(false);
    setShowChart(false);
    setFetchFeatures(false)
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
    setSamples([]);
    setResponseFeatures(null);
    setErrorFeatures(null);
  };

  const handleCloseChart = () => {
    setFetchFeatures(false);
    showMap();
  };

  const handleNextPageChart = async () => {
    if(nextPage && nextPage.body){
      const postBody: ISTACFilterRequest = {
        sortby: [{
          field: "properties.datetime", 
          direction: "asc" 
        }],
        ...nextPage.body
      }
      
      console.log("Next Request")
      console.log(postBody)
      showLoadingModal();
      resetStates();
      await getFeatures(postBody);
    }
  }

  const handlePreviousPageChart = async () => {
    if(previousPage && previousPage.body){
      const postBody: ISTACFilterRequest = {
        sortby: [{
          field: "properties.datetime", 
          direction: "asc" 
        }],
        ...previousPage.body
      }
      
      console.log("Previous Request")
      console.log(postBody)
      showLoadingModal();
      resetStates();
      await getFeatures(postBody);
    }
  }

  const handleFlyToROI = (a_Zoom: number) => {
    const coordinates = getCoordinatesFromMarkers()
    mapObject.current!.fitBounds([
      coordinates[0],
      coordinates[1],
    ], {zoom: a_Zoom});
  } 


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

    window.addEventListener( "contextmenu" , (ev) => {ev.preventDefault()})

    return () => {
      // By component unmounting
      mapObject.current?.remove();
      mapObject.current = null;
    };
  }, []);

  // Handle Marker
  useEffect(() => {
    if (!mapObject.current) return;

    if (marker.polygon) {
      mapObject.current.on("mousedown", handlePolygonMarker);
    } else {
      mapObject.current.off("mousedown", handlePolygonMarker);
    }

    return () => {
      mapObject.current?.off("mousedown", handlePolygonMarker);
    };
  }, [marker]);

  // Handle Polygon Drawing
  useEffect(() => {
    if (!mapObject.current) return;
    markersRef.current = markers
    if (markers.length !== 0 && markers.some((m) => !m.marker._map)) {
      addMarkersToMap();
      return;
    }

    const polygonMarkers = markers.filter((m) => m.type == EMarkerType.polygon);

    if (polygonMarkers.length === 0) {
      //setShowChart(false);
      showMap()
      removePolygonLayer();
      return;
    }

    if (polygonMarkers.length < 4) {
      //console.log("not enough polygon points");
      //setShowChart(false);
      showMap()
      return;
    }

    if (polygonMarkers.length > 4) {
      const newPolygonMarker = polygonMarkers[polygonMarkers.length - 1].marker;
      const lngLat = newPolygonMarker.getLngLat();

      //console.log("removing polygon");
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

  // Show ROI
  /* useEffect(()=>{
    if(showROI){
      console.log("markers")
      console.log(markers)
      //drawPolygon(markers)
    }
  }
  ,[showROI]) */

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
    if (fetchFeatures) {
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

      let temporalFilter = ''

      switch(temporalOp){
        case "t_during":
          temporalFilter = `${startDate.substring(0, startDate.indexOf("T"))}/${endDate.substring(0, endDate.indexOf("T"))}`
          break;
        case "t_after":
          temporalFilter = `${startDate.substring(0, startDate.indexOf("T"))}/`
          break;
        case "t_before":
          temporalFilter = `/${endDate.substring(0, endDate.indexOf("T"))}`
          break;
      }

      const postBody: ISTACFilterRequest = {
        sortby: [{
          field: "properties.datetime", 
          direction: "asc" 
        }],
        collections: [ESTACCollections.Sentinel2l2a],
        filter: {
          op: "and",
          args: [cloudCoverFilter, snowCoverFilter, geometryFilter],
        },
        datetime: temporalFilter,
        limit: Number(limit)
      };
      console.log("Request")
      console.log(postBody)
      showLoadingModal();
      resetStates();
      start = Date.now()
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
      setNextPage(null)
      setPreviousPage(null)
      showErrorModal();
    }
  }, [errorFeatures]);

  // 2. Get Token
  useEffect(() => {
    if (responseFeatures) {
      const nextLink = responseFeatures.links?.find( l => l.rel == EStacLinkRel.next )
      const previousLink = responseFeatures.links?.find( l => l.rel == EStacLinkRel.previous )
      if(nextLink){
        setNextPage(nextLink)
      } else {
        setNextPage(null)
      }
      if(previousLink){
        setPreviousPage(previousLink)
      } else {
        setPreviousPage(null)
      }
      if(responseFeatures.features.length !== 0){
        getTokenCollection();
      } else {
        showErrorModal()
      }
    }
  }, [responseFeatures]);

  // 3. Calculate NDVI
  useEffect(() => {
    if (tokenCollection) {
      if (responseFeatures) {
        //console.log(new Date(Date.now()).toISOString()+" STAC item numbers: " + responseFeatures.features.length)
        if (responseFeatures.features.length > 0) {
          getNDVI(responseFeatures.features, getCoordinatesFromMarkers());
        }
      }
    } else {
      resetStates();
      //showErrorModal()
    }
  }, [tokenCollection]);
  useEffect(() => {
    if (errorNDVI) {
      console.error("Failed to calculate NDVI");
      console.error(errorNDVI);
      //resetStates();
      setNextPage(null)
      setPreviousPage(null)
      showErrorModal();
    }
  }, [errorNDVI]);

  // 4. Show Chart
  useEffect(() => {
    if (samples.length !== 0) {
      if (samples.every((s) => !s.NDVI)) {
        showErrorModal();
      } else {
        showChartModal();
        end = Date.now()
        setLatency( end - start )
      }
    } else {
      if (!globalLoading) {
        showMap();
      }
    }
  }, [samples]);

  return (
    <div className={` ${mapStyle.wrapper}`}>
      {
        markers.filter((m) => m.type == EMarkerType.polygon).length === 4
        ?
          <div 
            className={` ${mapStyle.flyTo}`} 
            onClick={()=>handleFlyToROI(mapObject.current!.getZoom())}
          >
            <img src="/images/marker-fly.svg" alt="marker-fly" className={` ${mapStyle.flyToImage}`} />
          </div>
        :
          <></>
      }
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
              <YAxis stroke="white" />
              {/* popup tooltip by hovering */}
              <Tooltip />
              <Line type="linear" dataKey="NDVI" stroke="#2ecc71" />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
      ) : (
        <></>
      )}
      {showError ? (
        <Chart onClose={handleCloseChart}>
          <div className={` ${mapStyle.errorWrapper}`}>
            <div className={` ${mapStyle.error}`}>
              {
                responseFeatures && responseFeatures.features && responseFeatures?.features.length == 0
                ?
                "No STAC Item found!"
                :
                "Problem by getting NDVI samples!"
              }
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
