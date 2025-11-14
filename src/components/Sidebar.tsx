import sidebarStyles from "./Sidebar.module.scss"
import CButton from "../components/CButton"
import { useMapStore } from "../store/mapStore"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { parseURL, serializeURL } from "../utils/url"

const Sidebar = () => {

  const enableMarker = useMapStore( state => state.enableMarker)
  const setEnableMarker = useMapStore( state => state.setEnableMarker)

  const enableROI = useMapStore( state => state.enableROI)
  const setEnableROI = useMapStore( state => state.setEnableROI)

  const handleSetMarkerClick = () => {
    setEnableMarker(!enableMarker)
  }

  const handleSetROIClick = () => {
    setEnableROI(!enableROI)
  }

  //TODO: define series page
  const [ showChart, setShowChart ] = useState<boolean>(false)
  const handleSetStaticChart = () => {
    setShowChart(!showChart)
  }

  const sampleData = [
    { date: '2025-01-01', ndvi: 0.4 },
    { date: '2025-02-01', ndvi: 0.5 },
    { date: '2025-03-01', ndvi: 0.55 },
  ];

  // Read URLParams
  const setROI = useMapStore( state => state.setROI)
  const setStartDate = useMapStore( state => state.setStartDate)
  const setEndDate = useMapStore( state => state.setEndDate)

  useEffect(()=> {
    const params = new URLSearchParams(window.location.search)

    const roiParam = params.get("roi")
    const startDateParam = params.get("startDate")
    const endDateParam = params.get("endDate")

    if(roiParam){
      let newROI = JSON.parse(roiParam)
      setROI(newROI)
      console.log("URL state / ROI")
      console.log(newROI)
    }
    if(startDateParam){
      setStartDate(startDateParam)
      console.log("URL state / StartDate")
      console.log(startDateParam)
    }
    if(endDateParam){
      setEndDate(endDateParam)
      console.log("URL state / EndDate")
      console.log(endDateParam)
    }
  }, [])

  // Write URLParams
  const roi = useMapStore( state => state.roi)
  const startDate = useMapStore( state => state.startDate)
  const endDate = useMapStore( state => state.endDate)
  useEffect(()=>{
    const params = new URLSearchParams();
    if(roi){
      params.set("roi", JSON.stringify(roi))
    }
    if(startDate){
      params.set("startDate", startDate)
    }
    if(endDate){
      params.set("endDate", endDate)
    }

    /* console.log("roi")
    console.log(roi)
    const serializedURL = serializeURL(roi, startDate, endDate)
    window.history.replaceState( null, '', serializedURL) */

    window.history.replaceState( null, '', `?${params.toString()}`)
    console.log("URL state updated")
  }, [roi])


  return (
    <div className={` ${sidebarStyles.wrapper}`}>
      <CButton 
        title={ !enableMarker ? "Enable Marker" : "Disable Marker" }
        onButtonClick={handleSetMarkerClick}
      /> 
      <CButton 
        title={ !enableROI ? "Enable ROI" : "Disable ROI" }
        onButtonClick={handleSetROIClick}
      /> 
      <CButton 
        title={ !showChart ? "Static Chart" : "Hide Chart" }
        onButtonClick={handleSetStaticChart}
      /> 
      { showChart 
        ?
          <div className={` ${sidebarStyles.staticChart}`}>
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
        :
          <></>
      }
      
    </div>
  )
}

export default Sidebar
