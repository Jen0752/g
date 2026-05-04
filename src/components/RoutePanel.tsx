import { useMapStore } from '../stores/useMapStore'

interface RoutePanelProps {
  onClose: () => void
}

export default function RoutePanel({ onClose }: RoutePanelProps) {
  const { activeRoutes, toggleRoute, routes } = useMapStore()

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md rounded-t-2xl shadow-lifted">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-re2-subtle">
        <h2 className="text-base font-semibold text-re2-text">路线选择</h2>
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
      <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
        {routes.length === 0 ? (
          <p className="text-re2-muted text-sm text-center py-6">
            暂无路线，请在编辑模式中创建
          </p>
        ) : (
          routes.map((route) => {
            const isActive = activeRoutes.has(route.id)

            return (
              <button
                key={route.id}
                onClick={() => toggleRoute(route.id)}
                className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all duration-150 ${
                  isActive
                    ? 'bg-re2-accent/10 ring-2 ring-re2-accent/30 shadow-soft'
                    : 'bg-re2-subtle/30 hover:bg-re2-subtle/50'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: route.color }}
                />
                <span className={`text-sm font-medium ${isActive ? 'text-re2-text' : 'text-re2-muted'}`}>
                  {route.name}
                </span>
                {isActive && (
                  <svg className="w-5 h-5 ml-auto text-re2-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })
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