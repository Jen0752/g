import { useState, useRef } from 'react'
import { useMapStore } from '../stores/useMapStore'
import { CATEGORIES } from '../data/markers'

interface FilterPanelProps {
  onClose: () => void
}

export default function FilterPanel({ onClose }: FilterPanelProps) {
  const { activeCategories, toggleCategory, setCategories } = useMapStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const allSubIds = CATEGORIES.flatMap(cat => cat.subCategories.map(sub => sub.id))
  const allOn = activeCategories.size === allSubIds.length && allSubIds.every(id => activeCategories.has(id))

  const handleToggleAll = () => {
    if (allOn) {
      setCategories(new Set())
    } else {
      // 全选所有二级分类
      const allSubIds = CATEGORIES.flatMap(cat => cat.subCategories.map(sub => sub.id))
      setCategories(new Set(allSubIds))
    }
  }

  const handleSubCategoryToggle = (subId: string) => {
    toggleCategory(subId)
  }

  const handleToggleCategorySubs = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId)
    if (!cat) return
    const subIds = cat.subCategories.map(sub => sub.id)
    const allSelected = subIds.every(id => activeCategories.has(id))
    if (allSelected) {
      subIds.forEach(id => {
        if (activeCategories.has(id)) toggleCategory(id)
      })
    } else {
      subIds.forEach(id => {
        if (!activeCategories.has(id)) toggleCategory(id)
      })
    }
  }

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId)
    const element = document.getElementById(`category-${catId}`)
    if (element && scrollRef.current) {
      const containerTop = scrollRef.current.getBoundingClientRect().top
      const elementTop = element.getBoundingClientRect().top
      const scrollTop = scrollRef.current.scrollTop + (elementTop - containerTop) - 20
      scrollRef.current.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
    }
  }

  const handleCategoryDoubleClick = (catId: string) => {
    handleToggleCategorySubs(catId)
  }

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-20 bg-re2-dark/95 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">道具筛选</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 操作栏 */}
      <div className="px-4 py-2 border-b border-gray-800">
        <button
          onClick={handleToggleAll}
          className="w-full py-2 px-3 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors text-sm"
        >
          {allOn ? '取消全选' : '全选'}
        </button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：一级分类列表 */}
        <div className="w-20 border-r border-gray-800 overflow-y-auto">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory
            const iconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                onDoubleClick={() => handleCategoryDoubleClick(cat.id)}
                className={`w-full p-2 flex flex-col items-center gap-1 border-b border-gray-800 transition-colors ${
                  isActive ? 'bg-re2-accent/20' : 'hover:bg-gray-800'
                }`}
              >
                <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                  <img
                    src={iconPath}
                    alt={cat.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400">{cat.name}</span>
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )
          })}
        </div>

        {/* 右侧：所有二级分类（按一级分类分组） */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {CATEGORIES.map((cat) => {
            const iconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`

            return (
              <div
                key={cat.id}
                id={`category-${cat.id}`}
                className="mb-6"
              >
                {/* 一级分类标题 */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={iconPath}
                        alt={cat.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleToggleCategorySubs(cat.id)}
                    className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {cat.subCategories.every(sub => activeCategories.has(sub.id)) ? '取消' : '全选'}
                  </button>
                </div>
                {/* 二级分类网格 */}
                <div className="grid grid-cols-4 gap-2">
                  {cat.subCategories.map((sub) => {
                    const isActive = activeCategories.has(sub.id)
                    const subIconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${sub.icon}`

                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubCategoryToggle(sub.id)}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                          isActive
                            ? 'bg-re2-accent/30 border-2 border-re2-accent'
                            : 'bg-gray-800 border-2 border-transparent hover:bg-gray-700'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                          <img
                            src={subIconPath}
                            alt={sub.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                        <span className={`text-xs ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {sub.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}