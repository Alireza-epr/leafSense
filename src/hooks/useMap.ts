import { useCallback, useEffect, useRef } from "react";
import { useMapStore } from "../store/mapStore"
import { EMarkerType, ERequestContext, ICircle, ILayerMetadata, IMarker, IPolygon, TROIType, Units } from "../types";
import { log } from "../utils";

const mapMarkers = new Map<TROIType, maplibregl.Marker[]>()
    

export const useMap = () => {

    const map = useMapStore((state) => state.map);

    const marker = useMapStore((state) => state.marker);
    const setMarker = useMapStore((state) => state.setMarker);

    const circle = useMapStore((state) => state.circle);
    const circleRef = useRef(circle);
    const setCircle = useMapStore((state) => state.setCircle);

    const radius = useMapStore((state) => state.radius);
    const radiusRef = useRef(radius)
    const setRadius = useMapStore((state) => state.setRadius);

    const polygons = useMapStore((state) => state.polygons);
    const polygonsRef = useRef(polygons)
    const setPolygons = useMapStore((state) => state.setPolygons);

    const fetchFeatures = useMapStore((state) => state.fetchFeatures);
    const fetchFeaturesRef = useRef(fetchFeatures)
    const setFetchFeatures = useMapStore((state) => state.setFetchFeatures);


    
  const addMarker = async (
    a_LngLat: [number, number],
    a_Type: TROIType,
    a_Options?: maplibregl.MarkerOptions,
  ) => {
    const mapCallback = (maplibre) => {
      if(a_Type == EMarkerType.point){
        console.log("mapCallback")
        removeMarker(EMarkerType.point)
      }
      const markerElement: maplibregl.Marker = new maplibre.Marker(a_Options)
        .setLngLat(a_LngLat)
        .addTo(map);

        if(mapMarkers.has(a_Type) && a_Type !== "point"){
          const prevMarker = mapMarkers.get(a_Type)
          if(prevMarker && prevMarker.length)
          mapMarkers.set( a_Type, [...prevMarker, markerElement] )
          else
          mapMarkers.set( a_Type, [markerElement] )  
        } else {
          mapMarkers.set( a_Type, [markerElement] )
        }
      return markerElement
    }

    const marker = await import("maplibre-gl").then((maplibre)=>mapCallback(maplibre))
    log("add marker "+a_Type, marker)
      
    return marker
  }

  const removeMarker = (a_MarkerType: TROIType) => {
    const markers = mapMarkers.get(a_MarkerType)
    if(markers){
      log("removeMarker in", a_MarkerType)
        if(markers){
        markers.forEach( m => {
          m.remove()
        })
      }
      mapMarkers.delete(a_MarkerType)  
    }
    if(a_MarkerType == EMarkerType.point){
      setCircle(undefined);
    } else {
      setPolygons((prev) => prev.filter((p) => p.id !== a_MarkerType));
    }
  }

  const removeCircleLayer = () => {
    if (map) {
      const circleLayer = map.getLayer("circle");
      if (circleLayer) {
        map.removeLayer("circle");
        map.removeSource("circle");
      }
    }
  };

  const drawCircle = async (a_Circle: ICircle) => {
    if (!map) return;
    const options = { units: "meters" as Units };
    await addMarker(a_Circle.center, EMarkerType.point)
    const circleCallback = async (turf) => {
      console.log("a_Circle")
      console.log(a_Circle)
      const circleFeature = turf.circle(a_Circle.center, a_Circle.radius, options);
      removeCircleLayer(); 
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
          center: a_Circle.center,
          },
      });
    }
    await import("@turf/circle").then((turf)=>circleCallback(turf))
  }

  const addPointMarker = useCallback( async (a_Event: maplibregl.MapMouseEvent) => {
    if (a_Event.originalEvent.button === 0 && map) {

      const center: [number, number] = [
        a_Event.lngLat.lng,
        a_Event.lngLat.lat,
      ];
      //const marker = await addMarker(center, EMarkerType.point, { color: "green" });

      setCircle({
        center: center,
        radius: radiusRef.current
      })
      //drawCircle(center)
    }
  }, [])

  const addPolygonMarker = async (a_Event: maplibregl.MapMouseEvent) => {
    if (a_Event.originalEvent.button === 2 && map) {

      const lastZonalLayerId = getLastZonalLayerId()
      if(lastZonalLayerId === undefined) return 
      const markersToAdd = mapMarkers.get( `${EMarkerType.polygon}-${lastZonalLayerId+1}` )
      if(markersToAdd && markersToAdd.length >= 3){
        setPolygons((prev) => {
          return [
            ...prev,
            { id: `${EMarkerType.polygon}-${lastZonalLayerId+1}`, markers: markersToAdd },
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

      const lastExistingId = getLastZonalLayerId()
      if(lastExistingId === undefined) return 

      await addMarker(
        [a_Event.lngLat.lng, a_Event.lngLat.lat],
        `${EMarkerType.polygon}-${lastExistingId + 1}`,
      );
    }
  }

  const getAllZonalLayer = () => {
    if(!map) return 
    return map
    .getLayersOrder()
    .filter((l) => l.includes(`${EMarkerType.polygon}`) && !l.includes("label"))
  }

  const getLastZonalLayerId = () => {
    if(!map) return 
    const allZonalLayer = getAllZonalLayer()
    if(allZonalLayer) {
      const prefix = `${EMarkerType.polygon}-`;
      const lastId = allZonalLayer
      .map( zonal => +zonal.substring( prefix.length ) )
      .reduce( (acc, curr) => { if(curr > acc) return curr; else return acc }, 0 )
      return lastId
    } else {
      return 0
    }
  }


  const removePolygonLayer = (a_PolygonId: string) => {
      if (map) {
        const polygonLayer = map.getLayer(a_PolygonId);
        if (polygonLayer) {
          map.removeLayer(`${a_PolygonId}-label`);
          map.removeLayer(a_PolygonId);
          map.removeSource(a_PolygonId);

          /* const id = a_PolygonId.substring( a_PolygonId.indexOf("_") + 1 )
          const polygon = polygonsRef.current.find( p => p.id == Number(id) )
          if(polygon){
            polygon.markers.forEach( m => m.marker.remove() )
          } */
        }
      }
    }

  const removePolygonLayers = () => {
    if (map) {
      const polygonLayers = map
        .getLayersOrder()
        .filter((l) => l.includes(`${EMarkerType.polygon}`) && !l.includes("label"));
      if (polygonLayers) {
        polygonLayers.forEach((l) => {
          removePolygonLayer(l);
        });
      }
    }
  }

  const drawPolygon = async (a_Polygon: IPolygon) => {
      if (!map) return;
      let polygonCoords: GeoJSON.Position[] = []
      if(!a_Polygon.markers){
        if(a_Polygon.coordinates) {
          polygonCoords = a_Polygon.coordinates
          for(const coordinate of a_Polygon.coordinates){
            await addMarker(coordinate, a_Polygon.id)
          }
        }
      } else {
        polygonCoords = a_Polygon.markers.map((m) => {
          const lngLat = m.getLngLat();
          return [lngLat.lng, lngLat.lat];
        })
      }

      const polygonId = a_Polygon.id;

      const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
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
        id: `${polygonId}-label`,
        type: "symbol",
        source: polygonId,
        layout: {
          "text-field": ["get", "polygonId"],
          "text-size": 20,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#089",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });

    }

  const drawPolygons = () => {

    polygonsRef.current.forEach((polygon) => {
      drawPolygon(polygon);
    });
  }

  const redrawCircle = () => {
    if (!circle) return;
    console.log("redrawCircle")
    setCircle({
      radius: radiusRef.current,
      center: circle.center
    })

    //drawCircle(center);
  };

  
    const flyToROI = (a_To: EMarkerType, a_Zoom: number) => {
        if (a_To === EMarkerType.polygon) {
          const lastPolygonLayer = map!
            .getLayersOrder()
            .filter((l) => l.includes(`${EMarkerType.polygon}`) && !l.includes("label"))
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
    }

    const coordinatesFromMarkers = (a_RequestContext: ERequestContext): [number, number][] => {
        let thisFetchFeatures = fetchFeaturesRef.current[a_RequestContext];
        if (!thisFetchFeatures) return [];
        if (thisFetchFeatures.type === EMarkerType.polygon) {
          let index = polygonsRef.current.findIndex(
            (p) => p.id === thisFetchFeatures.id,
          );
          const thisPolygonLayer = polygonsRef.current.at(index);
          console.log("thisPolygonLayer")
          console.log(thisPolygonLayer)
          if (!thisPolygonLayer || !thisPolygonLayer.coordinates) return [];
          let coordinates: [number, number][] = thisPolygonLayer.coordinates
  
          // Close the polygon
          if (coordinates.length > 0) {
            coordinates.push(coordinates[0]);
          }
  
          return coordinates;
        } else {
          if (!map) return [];
          const circleLayer = map.getLayer("circle");
          console.log("circleLayer")
          console.log(circleLayer)
          if (!circleLayer) return [];
  
          const metadata = circleLayer.metadata as ILayerMetadata;
          const feature = metadata?.feature;
          return feature?.geometry?.coordinates?.[0] || [];
        }
    }
      

  // Follow Changing Radius
    useEffect(() => {
      radiusRef.current = radius;
      /* console.log("radius")
      console.log(radius) */

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
      if (!map || !circle) return;

      console.log("drawCircle")
      console.log(circle)
      drawCircle(circle)
      /* if(point.length === 1){
        console.log("drawCircle")
        drawCircle([point[0].coordinates[0][0], point[0].coordinates[0][1]])
      } */
    }, [circle]);

  return {
    addMarker,
    removeMarker,
    removeCircleLayer,
    drawCircle,
    addPointMarker,
    addPolygonMarker,
    removePolygonLayer,
    removePolygonLayers,
    drawPolygon,
    drawPolygons,
    redrawCircle,
    flyToROI,
    coordinatesFromMarkers,
    getLastZonalLayerId
  }

}