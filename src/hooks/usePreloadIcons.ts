import { CATEGORIES } from '../data/markers'

// FilterPanel 需要加载的所有图标路径
const FILTER_ICONS = CATEGORIES.flatMap(cat => [
  // 一级分类图标
  `./re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`,
  // 二级分类图标
  ...cat.subCategories.map(sub => `./re2_map_sewer_ui/loot%20ping/${cat.id}/${sub.icon}`)
])

/**
 * 预加载筛选面板图标（在打开筛选面板时调用）
 */
export function preloadFilterIcons(): void {
  // 创建 DOM img 元素让浏览器并发下载（不在 DOM 中显示）
  FILTER_ICONS.forEach(iconPath => {
    const img = document.createElement('img')
    img.src = iconPath
    img.loading = 'lazy'
    img.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
    document.body.appendChild(img)
    // 加载完成后移除
    img.onload = () => img.remove()
  })
}