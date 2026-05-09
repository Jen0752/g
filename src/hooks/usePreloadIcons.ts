import { CATEGORIES } from '../data/markers'

// FilterPanel 需要加载的所有图标路径
const FILTER_ICONS = CATEGORIES.flatMap(cat => [
  // 一级分类图标
  `./re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`,
  // 二级分类图标
  ...cat.subCategories.map(sub => `./re2_map_sewer_ui/loot%20ping/${cat.id}/${sub.icon}`)
])

// 地图标点图标（从 CATEGORIES 提取所有子分类图标）
export const MARKER_ICONS = CATEGORIES.flatMap(cat =>
  cat.subCategories.map(sub => sub.icon)
)

const iconsLoaded = new Set<string>()

/**
 * 立即触发图标加载（不让浏览器排队）
 */
export function preloadIconsImmediately(icons: string[]): void {
  icons.forEach(iconPath => {
    if (iconsLoaded.has(iconPath)) return
    iconsLoaded.add(iconPath)

    const img = new Image()
    img.src = iconPath
    img.loading = 'lazy'
  })
}

/**
 * 预加载筛选面板图标（在打开筛选面板时调用）
 */
export function preloadFilterIcons(): void {
  preloadIconsImmediately(FILTER_ICONS)
}