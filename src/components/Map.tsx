import mapStyle from './Map.module.scss'
import { useRef, useEffect, useCallback } from 'react';
import maplibregl, { LngLat } from 'maplibre-gl';
import { Map as MapLibre } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../store/mapStore';
import type { Feature, FeatureCollection, Polygon } from 'geojson'

const Map = () => {

    const enableROI = useMapStore( state => state.enableROI )
    const enableMarker = useMapStore( state => state.enableMarker )
    const setROI = useMapStore( state => state.setROI)

    const mapContainer = useRef<HTMLDivElement>(null)
    const mapObject = useRef<MapLibre | null>(null)

    const polygonCoords = useRef<[number, number][]>([])

    const handleMarker = (a_Event: maplibregl.MapMouseEvent) => {
        if(enableMarker){
            a_Event.preventDefault()
            const event = {
                lngLat: a_Event.lngLat,
                originalEvent: a_Event.originalEvent,
                point: a_Event.point,
                target: a_Event.target,
                type: a_Event.type
            }

            if(mapObject.current){
                const marker = new maplibregl.Marker({draggable: true})
                .setLngLat([event.lngLat.lng, event.lngLat.lat])
                .addTo(mapObject.current);

                console.log("Marker")
                console.log(marker)

            }

        } else {

            if(mapObject.current){
                
            }
        }
    }

    const handleROI = (a_Event: maplibregl.MapMouseEvent) => {

        polygonCoords.current.push([a_Event.lngLat.lng, a_Event.lngLat.lat])
        const marker = new maplibregl.Marker({draggable: true})
                .setLngLat([a_Event.lngLat.lng, a_Event.lngLat.lat])
                .addTo(mapObject.current!);


        if(polygonCoords.current.length < 4) {
           return 
        } 

        if(polygonCoords.current.length > 4) {
            polygonCoords.current = []
            polygonCoords.current.push([a_Event.lngLat.lng, a_Event.lngLat.lat])
            return 
        } 

        console.log("Draw polygon")
        console.log(polygonCoords.current)
        setROI(polygonCoords.current)
        polygonCoords.current.push( polygonCoords.current[0] )


        if(mapObject.current){
            
            clearROI()

            const geojson: Feature<Polygon> = {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [polygonCoords.current] // note: array of arrays
                },
                properties: {}
            }
            
            mapObject.current.addSource("roi-polygon", {
                type: "geojson",
                data: geojson
            });

            mapObject.current.addLayer({
                id: "roi-polygon",
                type: "fill",
                source: "roi-polygon",
                paint: {
                    "fill-color": "#088",
                    "fill-opacity": 0.5
                }
            });
        }
       
    }

    const clearROI = useCallback(() => {
        if(mapObject.current){
            const roi = mapObject.current.getLayer("roi-polygon")
            
            if(roi){
                mapObject.current.removeLayer("roi-polygon")
                mapObject.current.removeSource("roi-polygon")
            }
        }
    }, [])

    // Loading Map
    useEffect(()=> {

        if( mapObject.current || !mapContainer.current) return
        
        const map = new maplibregl.Map({
            container: mapContainer.current, 
            //style: 'https://demotiles.maplibre.org/globe.json', 
            style: 'https://demotiles.maplibre.org/style.json',
            center: [29, 39], // [lng, lat]
            zoom: 3 
        });

        mapObject.current = map
        
        return ( ) => {
            // By component unmounting
            mapObject.current?.remove()
            mapObject.current = null
        }

    }, [])

    // Handle Marker State
    useEffect(()=> {
        if( !mapObject.current ) return 

        if(enableMarker){
            // Arrow function causes the function reference to change
            mapObject.current.on("click", handleMarker)
        } else {
            mapObject.current.off("click", handleMarker)
        }

        return () => {
            mapObject.current?.off("click", handleMarker)
        }

    }, [enableMarker])

    // Handle ROI State
    useEffect(()=> {
        if( !mapObject.current ) return 

        if(enableROI){
            clearROI()
            polygonCoords.current = []

            mapObject.current.on("click", handleROI)
        } else {
            mapObject.current.off("click", handleROI)
        }

        return () => {
            mapObject.current?.off("click", handleROI)
        }

    }, [enableROI])


    return (
        <div 
            className={` ${mapStyle.wrapper}`}
            style={{width: "100%",height: "100%"}}
            ref={mapContainer}
            data-testid="map-container"
        />            
    )
}

export default Map
