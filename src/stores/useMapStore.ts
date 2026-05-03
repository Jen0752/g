import { create } from 'zustand'

export type Character = 'leon' | 'claire'
export type GameMode = 'normal' | 'expert'
export type Floor = '1F' | '2F' | '3F' | 'B1' | 'B1o' | 'B2' | 'B3'

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
  category: string
  icon: string
  coordinates: [number, number]
}

interface MapStore {
  // 角色
  character: Character
  setCharacter: (c: Character) => void

  // 模式
  mode: GameMode
  setMode: (m: GameMode) => void

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

  floor: 'B1',
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
}))
