import "@/App.css"
import Map from "@/components/Map"
import Sidebar from "@/components/Sidebar"

const App = () => {
  
  return (
    <>
      <div className='app-wrapper'>
        <header className='app-header'></header>
        <main className='app-main'>
          <Sidebar />
          <Map />
        </main>
      </div>
    </>
  )
}

export default App
