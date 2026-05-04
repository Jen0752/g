import { useState, useRef, useEffect } from 'react'
import { useMapStore } from '../stores/useMapStore'
import { CATEGORIES } from '../data/markers'

interface FilterPanelProps {
  onClose: () => void
}

export default function FilterPanel({ onClose }: FilterPanelProps) {
  const { activeCategories, toggleCategory, setCategories } = useMapStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    // 入场动画
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // 禁止背景滚动
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    // 等待动画结束后再关闭
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
      document.body.style.overflow = ''
      onClose()
    }, 300)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const allSubIds = CATEGORIES.flatMap(cat => cat.subCategories.map(sub => sub.id))
  const allOn = activeCategories.size === allSubIds.length && allSubIds.every(id => activeCategories.has(id))

  const handleToggleAll = () => {
    if (allOn) {
      setCategories(new Set())
    } else {
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

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      {/* 弹窗面板 */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[50vh] bg-white rounded-t-2xl shadow-lifted flex flex-col transition-transform duration-300 ease-out ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        onClick={e => e.stopPropagation()}
        style={{ zIndex: 60 }}
      >
        {/* 顶部拖动条 */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-re2-subtle rounded-full" />
        </div>

        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-re2-subtle">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-re2-text">道具筛选</h2>
            <button
              onClick={handleToggleAll}
              className="px-5 py-2 rounded-xl bg-re2-accent/10 hover:bg-re2-accent/20 text-re2-accent text-sm font-medium transition-colors shadow-soft"
            >
              {allOn ? '取消全选' : '全选'}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-re2-subtle/50 hover:bg-re2-subtle flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-re2-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：一级分类列表 */}
          <div className="w-20 border-r border-re2-subtle overflow-y-auto bg-re2-subtle/10 scrollbar-minimal">
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory
              const iconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  onDoubleClick={() => handleCategoryDoubleClick(cat.id)}
                  className={`w-full px-2 py-2.5 flex items-center gap-2 border-b border-re2-subtle transition-colors ${
                    isActive ? 'bg-white' : 'hover:bg-white/50'
                  }`}
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-soft flex-shrink-0">
                    <img
                      src={iconPath}
                      alt={cat.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                  <span className={`text-xs flex-1 text-left ${isActive ? 'text-re2-text font-medium' : 'text-re2-muted'}`}>{cat.name}</span>
                  <svg className="w-3 h-3 text-re2-subtle flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>

          {/* 右侧：所有二级分类（按一级分类分组） */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scrollbar-minimal">
            {CATEGORIES.map((cat) => {
              const iconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`

              return (
                <div
                  key={cat.id}
                  id={`category-${cat.id}`}
                  className="mb-6"
                >
                  {/* 一级分类标题 */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-re2-subtle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-soft">
                        <img
                          src={iconPath}
                          alt={cat.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-re2-text">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleToggleCategorySubs(cat.id)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-re2-subtle/50 text-re2-muted hover:bg-re2-subtle transition-colors"
                    >
                      {cat.subCategories.every(sub => activeCategories.has(sub.id)) ? '取消' : '全选'}
                    </button>
                  </div>
                  {/* 二级分类网格 */}
                  <div className="grid grid-cols-4 gap-2.5">
                    {cat.subCategories.map((sub) => {
                      const isActive = activeCategories.has(sub.id)
                      const subIconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${sub.icon}`

                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSubCategoryToggle(sub.id)}
                          className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-150 ${
                            isActive
                              ? 'bg-re2-accent/10 ring-2 ring-re2-accent/30 shadow-soft'
                              : 'bg-white border border-transparent hover:shadow-soft hover:border-re2-subtle'
                          }`}
                        >
                          <div className="w-10 h-10 bg-re2-subtle/30 rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                              src={subIconPath}
                              alt={sub.name}
                              className="w-7 h-7 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          </div>
                          <span className={`text-xs ${isActive ? 'text-re2-text font-medium' : 'text-re2-muted'}`}>
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
    </div>
  )
}
