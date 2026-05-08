import { useEffect } from 'react'
import { preloadImages } from '../utils/preload'
import { CATEGORIES } from '../data/markers'

// FilterPanel 需要加载的所有图标路径
const FILTER_ICONS = CATEGORIES.flatMap(cat => [
  // 一级分类图标
  `./re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`,
  // 二级分类图标
  ...cat.subCategories.map(sub => `./re2_map_sewer_ui/loot%20ping/${cat.id}/${sub.icon}`)
])

// 地图标点图标（从 CATEGORIES 提取所有子分类图标）
const MARKER_ICONS = CATEGORIES.flatMap(cat =>
  cat.subCategories.map(sub => sub.icon)
)

// 去重
const ALL_ICONS = [...new Set([...FILTER_ICONS, ...MARKER_ICONS])]

/**
 * 在应用启动时预加载所有图标
 * 在 App.tsx 或 Map 组件中调用一次即可
 */
export function usePreloadIcons() {
  useEffect(() => {
    // 使用较小的并发数，避免阻塞主线程
    preloadImages(ALL_ICONS, 3)
  }, [])
}