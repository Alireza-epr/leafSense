import mapStyle from "./Map.module.scss";
import { useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Map as MapLibre } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { EMarkerType, IMarker, useMapStore } from "../store/mapStore";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { useFilterSTAC } from "@/hooks/apiHook";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Map = () => {

  /* const { response, error, isLoading, fetchData } = useFilterSTAC()

  useEffect( () => {
    console.log("response")
    console.log(response)
  }, [response])
  useEffect( () => {
    console.log("error")
    console.log(error)
  }, [error])
  useEffect( () => {
    console.log("isLoading")
    console.log(isLoading)
  }, [isLoading]) */

 
  const marker = useMapStore((state) => state.marker);
  const startDate = useMapStore((state) => state.startDate);
  const endDate = useMapStore((state) => state.endDate);
  const cloudCover = useMapStore((state) => state.cloudCover);
  const markers = useMapStore((state) => state.markers);
  const showChart = useMapStore((state) => state.showChart);

  const setMarkers = useMapStore((state) => state.setMarkers);
  const setStartDate = useMapStore((state) => state.setStartDate);
  const setEndDate = useMapStore((state) => state.setEndDate);
  const setCloudCover = useMapStore((state) => state.setCloudCover);
  
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapObject = useRef<MapLibre | null>(null);

  const handlePointMarker = (a_Event: maplibregl.MapMouseEvent) => {
    if (mapObject.current) {
      addMarker([a_Event.lngLat.lng, a_Event.lngLat.lat], mapObject.current, EMarkerType.point, { draggable: true})
    }
  };

  const handlePolygonMarker = (a_Event: maplibregl.MapMouseEvent) => {
    if (mapObject.current) {
      addMarker([a_Event.lngLat.lng, a_Event.lngLat.lat], mapObject.current, EMarkerType.polygon)
    }
  };


  const addMarker = (a_LngLat: [number, number], a_Map: maplibregl.Map, a_Type: EMarkerType, a_Options?: maplibregl.MarkerOptions ) => {
    const markerElement = new maplibregl.Marker(a_Options)
      .setLngLat(a_LngLat)
      .addTo(a_Map)

    const newMarker = {
      type: a_Type,
      marker: markerElement
    }

    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
  } 

  const removePolygonLayer = () => {
    if(mapObject.current){
      const polygonLayer = mapObject.current.getLayer("polygon");
      if (polygonLayer) {
        mapObject.current.removeLayer("polygon");
        mapObject.current.removeSource("polygon");
      }
    }
  }

  const removePolygon = () => {
    if (mapObject.current) {
      // Remove polygon points
      markers.forEach( m => {
        if(m.type === EMarkerType.polygon){
          m.marker.remove()
        }
      })
      setMarkers((prev) => prev.filter( m => m.type !== EMarkerType.polygon )  )

      // Remove polygon layer
      removePolygonLayer()
    }
  }

  const drawPolygon = (a_PolygonMarkers: IMarker[] ) => {
    const polygonCoords = a_PolygonMarkers.map( m => {
      const lngLat = m.marker.getLngLat()
      return [lngLat.lng, lngLat.lat]
    })
    
    const geojson: Feature<Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [polygonCoords], // note: array of arrays
      },
      properties: {},
    };
    
    removePolygonLayer()
    
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

  }

  const addMarkersToMap = () => {
    setMarkers( (prev) => {
      const updated: IMarker[] = []

      for(const marker of prev){
        if(marker.marker._map){
          updated.push(marker)
          continue
        }

        const newMarkerWithMap = new maplibregl.Marker()
          .setLngLat( marker.marker.getLngLat() )
          .addTo(mapObject.current!)
        
        updated.push({
          type: marker.type,
          marker: newMarkerWithMap
        })
      }
      return updated
    })
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

    return () => {
      // By component unmounting
      mapObject.current?.remove();
      mapObject.current = null;
    };
  }, []);

  // Handle Marker
  useEffect(() => {
    if (!mapObject.current) return;

    if (marker.point) {
      // Arrow function causes the function reference to change
      mapObject.current.on("click", handlePointMarker);
    } else {
       mapObject.current.off("click", handlePointMarker);
    }

    if (marker.polygon) {
      mapObject.current.on("click", handlePolygonMarker);
    } else {
      mapObject.current.off("click", handlePolygonMarker);
    }

    return () => {
      mapObject.current?.off("click", handlePointMarker);
      mapObject.current?.off("click", handlePolygonMarker);
    };
  }, [marker]);


  // Handle Polygon Drawing
  useEffect(() => {
    if(!mapObject.current) return

    if(markers.length !== 0 && markers.some( m => !m.marker._map )){    
      addMarkersToMap()
      return
    }
    
    const polygonMarkers = markers.filter( m => m.type == EMarkerType.polygon )

    if(polygonMarkers.length === 0){
      removePolygonLayer()
      return 
    }

    if(polygonMarkers.length < 4) {
      console.log("not enough polygon points")
      return
    }

    if(polygonMarkers.length > 4) {
      const newPolygonMarker = polygonMarkers[ polygonMarkers.length- 1].marker
      const lngLat = newPolygonMarker.getLngLat()

      console.log("removing polygon")
      removePolygon()

      addMarker([lngLat.lng, lngLat.lat], mapObject.current, EMarkerType.polygon)
      return
    }

    console.log("start drawing polygon")
    console.log(markers)
    drawPolygon(polygonMarkers)

  }, [markers])

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
      setMarkers( (prev) => {
        const pointMarkers = prev.filter( m => m.type === EMarkerType.point )

        return pointMarkers
      })

      // Add polygon markers
      setTimeout(()=>{
        polygonCoords.forEach( coordinate => {
          const [ lng, lat ] = coordinate
          if(!mapObject.current) {
            console.log("Map is not ready to set markers from URL")
            return
          }
          addMarker([ lng, lat ], mapObject.current, EMarkerType.polygon  )
        })
      }, 100)
      

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
    const polygonMarkers = markers.filter( m => m.type === EMarkerType.polygon )
    
    const params = new URLSearchParams();
    

    if (polygonMarkers.length > 0) {
      const polygonCoords = polygonMarkers.map( m => {
        const lngLat = m.marker.getLngLat()
        return [lngLat.lng, lngLat.lat] 
      })
      params.set("roi", JSON.stringify(polygonCoords));
    }
    if (startDate) {
      params.set("startDate", startDate);
    }
    if (endDate) {
      params.set("endDate", endDate);
    }
    if(cloudCover){
      params.set("cloud", cloudCover);
    }

    window.history.replaceState(null, "", `?${params.toString()}`);

  }, [markers, startDate, endDate, cloudCover]);

  const sampleData = [
    { date: "2025-01-01", ndvi: 0.4 },
    { date: "2025-02-01", ndvi: 0.5 },
    { date: "2025-03-01", ndvi: 0.55 },
  ];

  return (
    <div className={` ${mapStyle.wrapper}`}>
      <div
        className={` ${mapStyle.mapWrapper}`}
        style={{ width: "100%", height: "100%" }}
        ref={mapContainer}
        data-testid="map-container"
      />
      {showChart ? (
        <div className={` ${mapStyle.staticChart}`}>
          {/* resize automatically */}
          <ResponsiveContainer width="100%" height="100%">
            {/* array of objects */}
            <LineChart data={sampleData}>
              <XAxis dataKey="date" />
              {/* Y automatically scale to fit the data */}
              <YAxis />
              {/* popup tooltip by hovering */}
              <Tooltip />
              <Line type="linear" dataKey="ndvi" stroke="#2ecc71" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <></>
      )}
    </div >
  );
};

export default Map;
