import { create } from 'zustand'

export type Character = 'leon' | 'claire'
export type GameMode = 'normal' | 'expert'
export type Floor = '1F' | '2F' | '3F' | 'B1' | 'B1o' | 'B2' | 'B2o' | 'B3'

export interface MarkerItem {
  id: string
  name: string
  category: string
  character: Character | 'both'
  mode: GameMode | 'both'
  coordinates: [number, number]
}

export interface CustomMarker {
  id: string
  name: string
  category: string
  icon: string
  coordinates: [number, number]
  floor: Floor
  character: Character | 'both'
  mode: GameMode | 'both'
  description?: string
  screenshots?: string[]
}

// 临时标点 - 放置模式下只有一个
export interface TempMarker {
  category: string
  icon: string
  coordinates: [number, number]
}

// 放置模式下，完成人物/模式选择后的中间状态
export interface PendingMarkerBase {
  name: string
  category: string
  icon: string
  coordinates: [number, number]
  character: Character | 'both'
  mode: GameMode | 'both'
}

// 路线路径点
export interface Waypoint {
  id: string
  coordinates: [number, number] // [x, y] 0-1范围
}

// 路线
export interface Route {
  id: string
  name: string
  color: string
  waypoints: Waypoint[]
}

interface MapStore {
  // 角色
  character: Character | 'both'
  setCharacter: (c: Character | 'both') => void

  // 模式
  mode: GameMode | 'both'
  setMode: (m: GameMode | 'both') => void

  // 楼层
  floor: Floor
  setFloor: (f: Floor) => void

  // 筛选的分类
  activeCategories: Set<string>
  toggleCategory: (cat: string) => void
  setCategories: (cats: Set<string>) => void

  // 路线
  activeRoutes: Set<string>
  toggleRoute: (route: string) => void

  // 路线编辑
  routes: Route[]
  addRoute: (route: Route) => void
  updateRoute: (id: string, updates: Partial<Route>) => void
  removeRoute: (id: string) => void

  // 路线编辑模式
  isEditingRoutes: boolean
  setIsEditingRoutes: (v: boolean) => void
  editingRouteId: string | null
  setEditingRouteId: (id: string | null) => void

  // 自定义标点
  customMarkers: CustomMarker[]
  addCustomMarker: (marker: CustomMarker) => void
  updateCustomMarker: (id: string, updates: Partial<CustomMarker>) => void
  removeCustomMarker: (id: string) => void

  // 标点模式
  isPlacingMarker: boolean
  setIsPlacingMarker: (v: boolean) => void
  selectedMarkerIcon: string | null
  setSelectedMarkerIcon: (icon: string | null) => void

  // 临时标点（放置模式下的单个标点）
  tempMarker: TempMarker | null
  setTempMarker: (marker: TempMarker | null) => void
  updateTempMarker: (updates: Partial<TempMarker>) => void

  // 放置模式第二步：完成人物/模式选择后的中间状态
  pendingMarker: PendingMarkerBase | null
  setPendingMarker: (marker: PendingMarkerBase | null) => void

  // 编辑/查看弹窗
  editingMarkerId: string | null
  setEditingMarkerId: (id: string | null) => void

  // 编辑模式（点击标点直接编辑，而非查看）
  isEditingMarkers: boolean
  setIsEditingMarkers: (v: boolean) => void
}

const ALL_CATEGORIES = [
  'bullet', 'checkpoint', 'collection', 'door', 'enemy',
  'medicine', 'projectile', 'puzzle item', 'tip', 'weapon'
]

export const useMapStore = create<MapStore>((set) => ({
  character: 'leon',
  setCharacter: (c) => set({ character: c }),

  mode: 'normal',
  setMode: (m) => set({ mode: m }),

  floor: '3F',
  setFloor: (f) => set({ floor: f }),

  activeCategories: new Set(ALL_CATEGORIES),
  toggleCategory: (cat) => set((state) => {
    const newCategories = new Set(state.activeCategories)
    if (newCategories.has(cat)) {
      newCategories.delete(cat)
    } else {
      newCategories.add(cat)
    }
    return { activeCategories: newCategories }
  }),
  setCategories: (cats) => set({ activeCategories: cats }),

  activeRoutes: new Set(),
  toggleRoute: (route) => set((state) => {
    const newRoutes = new Set(state.activeRoutes)
    if (newRoutes.has(route)) {
      newRoutes.delete(route)
    } else {
      newRoutes.add(route)
    }
    return { activeRoutes: newRoutes }
  }),

  // 路线编辑
  routes: [],
  addRoute: (route) => set((state) => ({
    routes: [...state.routes, route]
  })),
  updateRoute: (id, updates) => set((state) => ({
    routes: state.routes.map(r =>
      r.id === id ? { ...r, ...updates } : r
    )
  })),
  removeRoute: (id) => set((state) => ({
    routes: state.routes.filter(r => r.id !== id)
  })),

  // 路线编辑模式
  isEditingRoutes: false,
  setIsEditingRoutes: (v) => set({ isEditingRoutes: v }),
  editingRouteId: null,
  setEditingRouteId: (id) => set({ editingRouteId: id }),

  customMarkers: [],
  addCustomMarker: (marker) => set((state) => ({
    customMarkers: [...state.customMarkers, marker]
  })),
  updateCustomMarker: (id, updates) => set((state) => ({
    customMarkers: state.customMarkers.map(m =>
      m.id === id ? { ...m, ...updates } : m
    )
  })),
  removeCustomMarker: (id) => set((state) => ({
    customMarkers: state.customMarkers.filter(m => m.id !== id)
  })),

  isPlacingMarker: false,
  setIsPlacingMarker: (v) => set({ isPlacingMarker: v }),
  selectedMarkerIcon: null,
  setSelectedMarkerIcon: (icon) => set({ selectedMarkerIcon: icon }),

  // 临时标点
  tempMarker: null,
  setTempMarker: (marker) => set({ tempMarker: marker }),
  updateTempMarker: (updates) => set((state) => ({
    tempMarker: state.tempMarker ? { ...state.tempMarker, ...updates } : null
  })),

  // 放置模式第二步
  pendingMarker: null,
  setPendingMarker: (marker) => set({ pendingMarker: marker }),

  // 编辑/查看弹窗
  editingMarkerId: null,
  setEditingMarkerId: (id) => set({ editingMarkerId: id }),

  // 编辑模式
  isEditingMarkers: false,
  setIsEditingMarkers: (v) => set({ isEditingMarkers: v }),
}))
