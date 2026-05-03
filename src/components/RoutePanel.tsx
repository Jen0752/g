import { useMapStore } from '../stores/useMapStore'

interface RoutePanelProps {
  onClose: () => void
}

const ROUTES = [
  { id: 'route_a', name: 'A路线 - 美术馆', color: '#3b82f6' },
  { id: 'route_b', name: 'B路線 - 警局', color: '#ef4444' },
  { id: 'route_c', name: 'C路线 - 下水道', color: '#22c55e' },
]

export default function RoutePanel({ onClose }: RoutePanelProps) {
  const { activeRoutes, toggleRoute } = useMapStore()

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-re2-dark/95 backdrop-blur-sm rounded-t-2xl">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">路线选择</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 路线列表 */}
      <div className="p-4 space-y-3">
        {ROUTES.map((route) => {
          const isActive = activeRoutes.has(route.id)

          return (
            <button
              key={route.id}
              onClick={() => toggleRoute(route.id)}
              className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-gray-700 border-2'
                  : 'bg-gray-800 border-2 border-transparent'
              }`}
              style={{
                borderColor: isActive ? route.color : 'transparent'
              }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: route.color }}
              />
              <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {route.name}
              </span>
              {isActive && (
                <svg className="w-5 h-5 ml-auto text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* 提示信息 */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-500 text-center">
          选择路线后在地图上显示对应路线
        </p>
      </div>
    </div>
  )
}
