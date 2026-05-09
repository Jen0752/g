// 默认标点数据
import defaultMarkersData from './defaultMarkers.json'
import defaultRoutesData from './defaultRoutes.json'

import type { CustomMarker } from '../stores/useMapStore'
import type { Route } from '../stores/useMapStore'

// 导出原始数据
export const defaultMarkers = defaultMarkersData.markers || []
export const defaultRoutes = defaultRoutesData.routes || []

// 加载默认数据到 store
export function initDefaultData(store: {
  addCustomMarker: (marker: CustomMarker) => void
  addRoute: (route: Route) => void
  customMarkers: CustomMarker[]
  routes: Route[]
}) {
  // 避免重复加载
  if (store.customMarkers.length > 0 || store.routes.length > 0) {
    console.log('[initDefaultData] Already loaded, skipping')
    return
  }

  console.log('[initDefaultData] Starting load, defaultMarkers:', defaultMarkers.length)

  // 加载标点
  ;(defaultMarkers as CustomMarker[]).forEach((marker) => {
    store.addCustomMarker(marker)
  })

  console.log('[initDefaultData] Done, store.customMarkers:', store.customMarkers.length)

  // 加载路线
  ;(defaultRoutes as Route[]).forEach((route) => {
    store.addRoute(route)
  })
}