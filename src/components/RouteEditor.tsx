import { useState, useEffect, useCallback } from 'react'
import { useMapStore, type Route } from '../stores/useMapStore'

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
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

  // 退出编辑模式时清除 editingRouteId
  useEffect(() => {
    if (!isEditingRoutes && editingRouteId) {
      setEditingRouteId(null)
    }
  }, [isEditingRoutes, editingRouteId, setEditingRouteId])

  // 导出路线数据
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

  // 导入路线数据
  const handleImportRoutes = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.routes && Array.isArray(data.routes)) {
          data.routes.forEach((r: Route) => {
            // 检查是否已存在相同ID的路线
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
    <div className="absolute top-0 left-0 z-20 w-72 h-full bg-re2-dark/95 backdrop-blur-sm border-r border-gray-700 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">路线编辑</h2>
        <button
          onClick={() => setIsEditingRoutes(false)}
          className="w-8 h-8 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 路线列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 创建新路线 */}
        {isCreating ? (
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <input
              type="text"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              placeholder="路线名称"
              className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-re2-accent focus:outline-none mb-2"
            />
            <div className="flex gap-2 mb-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewRouteColor(color)}
                  className={`w-6 h-6 rounded-full ${newRouteColor === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 px-3 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleCreateRoute}
                className="flex-1 py-2 px-3 bg-re2-accent text-white text-sm rounded hover:bg-re2-accent/80"
              >
                创建
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-3 bg-gray-800 text-gray-300 text-sm rounded border border-dashed border-gray-600 hover:border-re2-accent hover:text-white mb-3"
          >
            + 创建新路线
          </button>
        )}

        {/* 导入/导出按钮 */}
        {routes.length > 0 && (
          <div className="flex gap-2 mb-3 border-b border-gray-700 pb-3">
            <label className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleImportRoutes}
                className="hidden"
              />
              <div className="text-xs text-center text-gray-400 hover:text-white cursor-pointer bg-gray-800 rounded py-1.5 px-2">
                导入
              </div>
            </label>
            <button
              onClick={handleExportRoutes}
              className="flex-1 text-xs text-gray-400 hover:text-white bg-gray-800 rounded py-1.5 px-2"
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
              className={`bg-gray-800 rounded-lg p-3 cursor-pointer transition-colors ${
                editingRouteId === route.id ? 'border-2' : 'border-2 border-transparent'
              }`}
              style={{ borderColor: editingRouteId === route.id ? route.color : 'transparent' }}
              onClick={() => setEditingRouteId(route.id === editingRouteId ? null : route.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: route.color }}
                />
                <span className="text-white text-sm font-medium flex-1">{route.name}</span>
                <span className="text-gray-500 text-xs">{route.waypoints.length} 点</span>
              </div>

              {/* 编辑中的路线详情 */}
              {editingRouteId === route.id && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  {/* 路线名称编辑 */}
                  <div className="mb-3">
                    <label className="text-gray-400 text-xs mb-1 block">路线名称</label>
                    <input
                      type="text"
                      value={route.name}
                      onChange={(e) => updateRoute(route.id, { name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-re2-accent focus:outline-none"
                    />
                  </div>

                  {/* 颜色选择 */}
                  <div className="mb-3">
                    <label className="text-gray-400 text-xs mb-1 block">颜色</label>
                    <div className="flex gap-1">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => updateRoute(route.id, { color })}
                          className={`w-5 h-5 rounded-full ${route.color === color ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 路径点列表 */}
                  <div className="mb-3">
                    <label className="text-gray-400 text-xs mb-1 block">
                      路径点 (点击地图添加)
                    </label>
                    {route.waypoints.length === 0 ? (
                      <p className="text-gray-500 text-xs italic">暂无路径点，点击地图添加</p>
                    ) : (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {route.waypoints.map((wp, index) => (
                          <div
                            key={wp.id}
                            className="flex items-center gap-2 bg-gray-700 rounded px-2 py-1"
                          >
                            <span className="text-gray-400 text-xs w-4">{index + 1}.</span>
                            <span className="text-white text-xs flex-1">
                              {wp.coordinates[0].toFixed(3)}, {wp.coordinates[1].toFixed(3)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveWaypoint(wp.id)
                              }}
                              className="text-red-400 hover:text-red-300 text-xs"
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
                    className="w-full py-1.5 px-3 bg-red-600/50 text-red-300 text-xs rounded hover:bg-red-600"
                  >
                    删除路线
                  </button>
                </div>
              )}
            </div>
          ))}

          {routes.length === 0 && !isCreating && (
            <p className="text-gray-500 text-sm text-center py-4">
              暂无路线，点击上方创建
            </p>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          {editingRouteId ? '点击地图添加路径点' : '选择路线后在地图上添加路径点'}
        </p>
      </div>
    </div>
  )
}

// 导出添加路径点的方法供 Map 组件调用
export { COLORS }
