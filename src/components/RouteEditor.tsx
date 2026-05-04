import { useState, useEffect, useCallback } from 'react'
import { useMapStore, type Route } from '../stores/useMapStore'

const COLORS = [
  '#4a90d9', '#e05a5a', '#4caf50', '#f5a623',
  '#9c6ade', '#e91e8c', '#00bcd4', '#8bc34a'
]

export default function RouteEditor() {
  const {
    routes,
    addRoute,
    updateRoute,
    removeRoute,
    isEditingRoutes,
    setIsEditingRoutes,
    editingRouteId,
    setEditingRouteId,
  } = useMapStore()

  const [newRouteName, setNewRouteName] = useState('')
  const [newRouteColor, setNewRouteColor] = useState(COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  const editingRoute = routes.find(r => r.id === editingRouteId)

  useEffect(() => {
    if (!isEditingRoutes && editingRouteId) {
      setEditingRouteId(null)
    }
  }, [isEditingRoutes, editingRouteId, setEditingRouteId])

  const handleExportRoutes = useCallback(() => {
    const data = {
      version: 1,
      routes: routes
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `re2-routes-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [routes])

  const handleImportRoutes = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.routes && Array.isArray(data.routes)) {
          data.routes.forEach((r: Route) => {
            const existing = routes.find(existing => existing.id === r.id)
            if (!existing) {
              addRoute(r)
            }
          })
        }
      } catch (err) {
        console.error('Failed to import routes:', err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [routes, addRoute])

  const handleCreateRoute = () => {
    if (!newRouteName.trim()) return

    const newRoute: Route = {
      id: `route_${Date.now()}`,
      name: newRouteName.trim(),
      color: newRouteColor,
      waypoints: []
    }

    addRoute(newRoute)
    setNewRouteName('')
    setNewRouteColor(COLORS[0])
    setIsCreating(false)
    setEditingRouteId(newRoute.id)
  }

  const handleDeleteRoute = (id: string) => {
    removeRoute(id)
    if (editingRouteId === id) {
      setEditingRouteId(null)
    }
  }

  const handleRemoveWaypoint = (wpId: string) => {
    if (!editingRouteId || !editingRoute) return

    updateRoute(editingRouteId, {
      waypoints: editingRoute.waypoints.filter(wp => wp.id !== wpId)
    })
  }

  if (!isEditingRoutes) return null

  return (
    <div className="absolute top-0 left-0 z-20 w-72 h-full bg-white/95 backdrop-blur-md border-r border-re2-subtle shadow-lifted flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-re2-subtle">
        <h2 className="text-base font-semibold text-re2-text">路线编辑</h2>
        <button
          onClick={() => setIsEditingRoutes(false)}
          className="w-8 h-8 rounded-btn bg-re2-subtle/50 hover:bg-re2-subtle flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-re2-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 路线列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 创建新路线 */}
        {isCreating ? (
          <div className="bg-re2-subtle/30 rounded-xl p-3 mb-3">
            <input
              type="text"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              placeholder="路线名称"
              className="w-full px-3 py-2 bg-white text-re2-text text-sm rounded-lg border border-re2-subtle focus:border-re2-accent focus:outline-none mb-3"
            />
            <div className="flex gap-2 mb-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewRouteColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${newRouteColor === color ? 'ring-2 ring-offset-2 ring-re2-accent scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 px-3 bg-white text-re2-muted text-sm rounded-lg hover:bg-re2-subtle/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateRoute}
                className="flex-1 py-2 px-3 bg-re2-accent text-white text-sm rounded-lg hover:bg-re2-accent/80 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 px-3 bg-re2-subtle/30 text-re2-muted text-sm rounded-xl border-2 border-dashed border-re2-subtle hover:border-re2-accent hover:text-re2-text hover:bg-re2-accent/5 transition-all mb-3"
          >
            + 创建新路线
          </button>
        )}

        {/* 导入/导出按钮 */}
        {routes.length > 0 && (
          <div className="flex gap-2 mb-3 border-b border-re2-subtle pb-3">
            <label className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleImportRoutes}
                className="hidden"
              />
              <div className="text-xs text-center text-re2-muted hover:text-re2-text bg-re2-subtle/30 hover:bg-re2-subtle cursor-pointer py-2 px-2 rounded-lg transition-colors">
                导入
              </div>
            </label>
            <button
              onClick={handleExportRoutes}
              className="flex-1 text-xs text-center text-re2-muted hover:text-re2-text bg-re2-subtle/30 hover:bg-re2-subtle py-2 px-2 rounded-lg transition-colors"
            >
              导出
            </button>
          </div>
        )}

        {/* 路线列表 */}
        <div className="space-y-2">
          {routes.map(route => (
            <div
              key={route.id}
              className={`bg-re2-subtle/20 rounded-xl p-3 cursor-pointer transition-all duration-150 ${
                editingRouteId === route.id ? 'ring-2 ring-re2-accent/40 bg-white shadow-soft' : 'hover:bg-re2-subtle/30'
              }`}
              onClick={() => setEditingRouteId(route.id === editingRouteId ? null : route.id)}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: route.color }}
                />
                <span className="text-re2-text text-sm font-medium flex-1">{route.name}</span>
                <span className="text-re2-muted text-xs">{route.waypoints.length} 点</span>
              </div>

              {editingRouteId === route.id && (
                <div className="mt-3 pt-3 border-t border-re2-subtle">
                  {/* 路线名称编辑 */}
                  <div className="mb-3">
                    <label className="text-re2-muted text-xs mb-1.5 block">路线名称</label>
                    <input
                      type="text"
                      value={route.name}
                      onChange={(e) => updateRoute(route.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-re2-text text-sm rounded-lg border border-re2-subtle focus:border-re2-accent focus:outline-none"
                    />
                  </div>

                  {/* 颜色选择 */}
                  <div className="mb-3">
                    <label className="text-re2-muted text-xs mb-1.5 block">颜色</label>
                    <div className="flex gap-1.5">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => updateRoute(route.id, { color })}
                          className={`w-5 h-5 rounded-full transition-transform ${route.color === color ? 'ring-2 ring-offset-1 ring-re2-accent scale-110' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 路径点列表 */}
                  <div className="mb-3">
                    <label className="text-re2-muted text-xs mb-1.5 block">
                      路径点 (点击地图添加)
                    </label>
                    {route.waypoints.length === 0 ? (
                      <p className="text-re2-muted text-xs italic py-2">暂无路径点，点击地图添加</p>
                    ) : (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {route.waypoints.map((wp, index) => (
                          <div
                            key={wp.id}
                            className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 shadow-soft"
                          >
                            <span className="text-re2-muted text-xs w-4">{index + 1}.</span>
                            <span className="text-re2-text text-xs flex-1">
                              {wp.coordinates[0].toFixed(3)}, {wp.coordinates[1].toFixed(3)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveWaypoint(wp.id)
                              }}
                              className="text-re2-muted hover:text-red-500 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRoute(route.id)
                    }}
                    className="w-full py-2 px-3 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100 transition-colors"
                  >
                    删除路线
                  </button>
                </div>
              )}
            </div>
          ))}

          {routes.length === 0 && !isCreating && (
            <p className="text-re2-muted text-sm text-center py-6">
              暂无路线，点击上方创建
            </p>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2.5 border-t border-re2-subtle bg-re2-subtle/20">
        <p className="text-xs text-re2-muted text-center">
          {editingRouteId ? '点击地图添加路径点' : '选择路线后在地图上添加路径点'}
        </p>
      </div>
    </div>
  )
}

export { COLORS }