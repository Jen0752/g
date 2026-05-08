import { useMapStore, type Floor } from '../stores/useMapStore'

interface RoutePanelProps {
  onClose: () => void
}

export default function RoutePanel({ onClose }: RoutePanelProps) {
  const { activeRoutes, toggleRoute, routes, setFloor } = useMapStore()

  const handleFloorClick = (e: React.MouseEvent, routeFloor: Floor, routeId: string) => {
    e.stopPropagation()
    setFloor(routeFloor)
    toggleRoute(routeId)
    onClose()
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-purple-100/95 backdrop-blur-md rounded-t-2xl shadow-lifted">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-re2-subtle">
        <h2 className="text-base font-semibold text-gray-700">路线选择</h2>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-btn bg-re2-subtle/50 hover:bg-re2-subtle flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-re2-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 路线列表 */}
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {routes.length === 0 ? (
          <p className="text-re2-muted text-sm text-center py-6">
            暂无路线，请在编辑模式中创建
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {routes.map((route) => {
              const isActive = activeRoutes.has(route.id)

              return (
                <button
                  key={route.id}
                  onClick={() => toggleRoute(route.id)}
                  className={`p-2.5 rounded-lg flex items-center gap-2 transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-re2-accent/10 ring-2 ring-re2-accent/30 shadow-soft'
                      : 'bg-re2-subtle/30 hover:bg-re2-subtle/50'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <span className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-gray-700' : 'text-re2-muted'}`}>
                    {route.name}
                  </span>
                  <span className="text-re2-muted text-xs bg-re2-subtle/50 px-2 py-1 rounded flex-shrink-0 cursor-pointer hover:bg-re2-subtle transition-colors"
                    onClick={(e) => handleFloorClick(e, route.floor, route.id)}>{route.floor}</span>
                  {isActive && (
                    <svg className="w-4 h-4 text-re2-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="px-4 pb-4">
        <p className="text-xs text-re2-muted text-center">
          选择路线后在地图上显示对应路线
        </p>
      </div>
    </div>
  )
}