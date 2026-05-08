import { useCallback, useState, lazy, Suspense, useEffect } from 'react'
import Map from './components/Map'
import Toolbar from './components/Toolbar'
import FilterPanel from './components/FilterPanel'
import RoutePanel from './components/RoutePanel'
import { useMapStore } from './stores/useMapStore'
import { usePreloadIcons } from './hooks/usePreloadIcons'
import { initDefaultData } from './data/defaultData'

const RouteEditor = lazy(() => import('./components/RouteEditor'))

function App() {
  const [showFilter, setShowFilter] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const floor = useMapStore(s => s.floor)

  // 预加载所有图标，避免 FilterPanel 等弹窗首次打开时卡顿
  usePreloadIcons()

  // 加载默认标点和路线数据
  useEffect(() => {
    const store = useMapStore.getState()
    initDefaultData(store)
  }, [])

  const handleFilterToggle = useCallback(() => {
    setShowRoutes(false)
    setShowFilter(prev => !prev)
  }, [])

  const handleRouteToggle = useCallback(() => {
    setShowFilter(false)
    setShowRoutes(prev => !prev)
  }, [])

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
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

      <Suspense fallback={null}>
        <RouteEditor />
      </Suspense>
    </div>
  )
}

export default App
