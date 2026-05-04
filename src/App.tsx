import { useCallback, useState } from 'react'
import Map from './components/Map'
import Toolbar from './components/Toolbar'
import FilterPanel from './components/FilterPanel'
import RoutePanel from './components/RoutePanel'
import RouteEditor from './components/RouteEditor'
import { useMapStore } from './stores/useMapStore'

function App() {
  const [showFilter, setShowFilter] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const floor = useMapStore(s => s.floor)

  const handleFilterToggle = useCallback(() => {
    setShowRoutes(false)
    setShowFilter(prev => !prev)
  }, [])

  const handleRouteToggle = useCallback(() => {
    setShowFilter(false)
    setShowRoutes(prev => !prev)
  }, [])

  return (
    <div className="w-full h-full relative overflow-hidden bg-re2-dark">
      <Map key={floor} />

      <Toolbar
        onFilterToggle={handleFilterToggle}
        onRouteToggle={handleRouteToggle}
        showFilter={showFilter}
        showRoutes={showRoutes}
      />

      {showFilter && (
        <FilterPanel onClose={() => setShowFilter(false)} />
      )}

      {showRoutes && (
        <RoutePanel onClose={() => setShowRoutes(false)} />
      )}

      <RouteEditor />
    </div>
  )
}

export default App
