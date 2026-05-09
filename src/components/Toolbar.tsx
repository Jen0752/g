import { useState, useCallback, useMemo } from 'react'
import { useMapStore, type Character, type GameMode, type CustomMarker } from '../stores/useMapStore'
import { FLOOR_ORDER, CATEGORIES } from '../data/markers'
import { preloadFilterIcons } from '../hooks/usePreloadIcons'
import {
  FilterIcon,
  FloorIcon,
  CharacterIcon,
  PathIcon,
  PinIcon,
  EditIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ModeIcon,
} from './Icons'

interface ToolbarProps {
  onFilterToggle: () => void
  onRouteToggle: () => void
  showFilter: boolean
  showRoutes: boolean
}

export default function Toolbar({ onFilterToggle, onRouteToggle, showFilter, showRoutes }: ToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Single selector - one subscription instead of 14
  const {
    character,
    mode,
    floor,
    isPlacingMarker,
    isEditingMarkers,
    isEditingRoutes,
    customMarkers,
    setCharacter,
    setMode,
    setFloor,
    setIsPlacingMarker,
    setIsEditingMarkers,
    setIsEditingRoutes,
    setSelectedMarkerIcon,
    setTempMarker,
    addCustomMarker,
  } = useMapStore()

  const [showCharacterPicker, setShowCharacterPicker] = useState(false)
  const [showMarkerPicker, setShowMarkerPicker] = useState(false)
  const [showModePicker, setShowModePicker] = useState(false)
  const [showFloorPicker, setShowFloorPicker] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Memoize category lookup to avoid repeated find()
  const selectedCategoryData = useMemo(
    () => CATEGORIES.find(c => c.id === selectedCategory) ?? null,
    [selectedCategory]
  )

  const handleCharacterChange = useCallback((c: Character) => {
    setCharacter(c)
    if (c === 'claire') {
      setFloor('B3')
    }
    setShowCharacterPicker(false)
  }, [setCharacter, setFloor])

  const handleModeChange = useCallback((m: GameMode) => {
    setMode(m)
    setShowModePicker(false)
  }, [setMode])

  const handleFloorChange = useCallback((f: typeof FLOOR_ORDER[number]) => {
    setFloor(f)
    setShowFloorPicker(false)
  }, [setFloor])

  const handleAddMarkerClick = useCallback(() => {
    if (isPlacingMarker) {
      setIsPlacingMarker(false)
      setSelectedMarkerIcon(null)
      setShowMarkerPicker(false)
      setTempMarker(null)
    } else {
      setShowCharacterPicker(false)
      setShowModePicker(false)
      setShowFloorPicker(false)
      setShowMarkerPicker(prev => !prev)
    }
  }, [isPlacingMarker, setIsPlacingMarker, setSelectedMarkerIcon, setTempMarker])

  const handleSelectCategory = useCallback((catId: string) => {
    setSelectedCategory(catId)
  }, [])

  const handleSelectSubCategory = useCallback((sub: { id: string; name: string; icon: string }) => {
    if (!selectedCategoryData) return
    const iconPath = `./re2_map_sewer_ui/loot%20ping/${selectedCategoryData.id}/${sub.icon}`
    console.log('select subcategory:', sub.name, 'path:', iconPath)
    setSelectedMarkerIcon(iconPath)
    setIsPlacingMarker(true)
    setShowMarkerPicker(false)
    setSelectedCategory(null)
    console.log('after set:', useMapStore.getState().isPlacingMarker, useMapStore.getState().selectedMarkerIcon)
  }, [selectedCategoryData, setSelectedMarkerIcon, setIsPlacingMarker])

  const handleExportMarkers = useCallback(() => {
    const data = {
      version: 1,
      floor: floor,
      markers: customMarkers,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `re2-markers-${floor}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [customMarkers, floor])

  const handleImportMarkers = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.markers && Array.isArray(data.markers)) {
          data.markers.forEach((m: CustomMarker) => addCustomMarker(m))
        }
      } catch (err) {
        console.error('Failed to import markers:', err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [addCustomMarker])

  // 按钮通用样式 - 使用 CSS 类选择器实现 hover 优化
  const buttonBase = "toolbar-btn w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100/80 shadow-soft transition-all duration-150 active:scale-95"

  return (
    <div className="absolute top-3 right-3 z-10 flex items-start gap-2">
      {/* 收起/展开按钮 */}
      <div className="relative">
        <button
          onClick={() => setIsCollapsed(prev => !prev)}
          className={`${buttonBase} ${isCollapsed ? '' : 'bg-white/60'}`}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>

        {/* 标点选择器 - 固定在收起按钮下方 */}
        {showMarkerPicker && (
          <div className="absolute right-0 top-full mt-2 bg-rose-200/80 backdrop-blur-md rounded-xl shadow-lifted p-4 z-20 w-72">
            {/* 导入/导出按钮 */}
            <div className="flex gap-2 mb-4 border-b border-re2-subtle pb-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportMarkers}
                  className="hidden"
                />
                <div className="text-xs text-center text-re2-muted hover:text-gray-700 bg-re2-subtle/50 hover:bg-re2-subtle cursor-pointer py-2 px-3 rounded-btn transition-colors">
                  导入
                </div>
              </label>
              <button
                onClick={handleExportMarkers}
                className="flex-1 text-xs text-center text-re2-muted hover:text-gray-700 bg-re2-subtle/50 hover:bg-re2-subtle py-2 px-3 rounded-btn transition-colors"
              >
                导出
              </button>
            </div>

            {!selectedCategory ? (
              <>
                <p className="text-xs text-re2-muted mb-3">选择分类</p>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => {
                    const iconPath = `./re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.id)}
                        className="aspect-square bg-white rounded-lg overflow-hidden hover:shadow-soft transition-all duration-150 hover:scale-105 active:scale-95"
                        title={cat.name}
                      >
                        <img
                          src={iconPath.replace('loot%20ping', 'loot ping')}
                          alt={cat.name}
                          className="w-full h-full object-contain p-1.5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-re2-muted hover:text-gray-700 mb-3 flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  返回
                </button>
                <p className="text-xs text-re2-muted mb-3">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.subCategories.map((sub) => {
                    const iconPath = `./re2_map_sewer_ui/loot%20ping/${selectedCategory}/${sub.icon}`
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectSubCategory(sub)}
                        className="aspect-square bg-white rounded-lg overflow-hidden hover:shadow-soft transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center p-1.5"
                        title={sub.name}
                      >
                        <img
                          src={iconPath.replace('loot%20ping', 'loot ping')}
                          alt={sub.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 工具栏主体 */}
      {!isCollapsed && (
        <>
        {/* 右侧垂直工具栏 - 毛玻璃效果 */}
        <div className="flex flex-col gap-1.5 p-2 bg-white/85 backdrop-blur-md rounded-xl shadow-card">
        {/* 当前楼层显示 */}
        <div className="flex items-center justify-center py-1.5 px-3 mb-1 bg-re2-subtle/50 rounded-lg">
          <span className="text-base font-semibold text-blue-500">{floor}</span>
        </div>

        {/* 分隔线 */}
        <div className="h-px bg-re2-subtle mx-1" />

        {/* 筛选按钮 - 灰蓝色边框 */}
        <button
          onClick={() => {
            if (!showFilter) {
              preloadFilterIcons()
            }
            onFilterToggle()
            setShowModePicker(false)
            setShowFloorPicker(false)
            setShowCharacterPicker(false)
          }}
          className={`${buttonBase} ${showFilter ? 'border-2 border-slate-300/80 bg-re2-accent/5' : 'border border-slate-200/80'}`}
          title="筛选"
        >
          <FilterIcon active={showFilter} />
        </button>

        {/* 楼层选择按钮 - 柔和蓝边框 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFloorPicker(prev => !prev)
              setShowModePicker(false)
              setShowCharacterPicker(false)
              setShowMarkerPicker(false)
            }}
            className={`${buttonBase} ${showFloorPicker ? 'border-2 border-blue-300/80 bg-re2-accent/5' : 'border border-blue-200/80'}`}
            title="楼层"
          >
            <FloorIcon active={showFloorPicker} />
          </button>

          {/* 楼层选择面板 */}
          {showFloorPicker && (
            <div className="absolute right-full top-0 mr-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lifted overflow-hidden z-20 min-w-[80px]">
              <div className="py-1.5">
                {FLOOR_ORDER.map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFloorChange(f)}
                    className={`w-full px-4 py-2 text-center text-sm whitespace-nowrap transition-all duration-150 ${
                      floor === f
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 角色选择按钮 - 柔和绿边框 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCharacterPicker(prev => !prev)
              setShowModePicker(false)
              setShowFloorPicker(false)
              setShowMarkerPicker(false)
            }}
            className={`${buttonBase} ${showCharacterPicker ? 'border-2 border-green-300/80 bg-re2-accent/5' : 'border border-green-200/80'}`}
            title="角色"
          >
            <CharacterIcon active={showCharacterPicker} />
          </button>

          {/* 角色选择面板 */}
          {showCharacterPicker && (
            <div className="absolute right-full top-0 mr-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lifted overflow-hidden z-20 min-w-[120px]">
              <button
                onClick={() => handleCharacterChange('leon')}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 whitespace-nowrap transition-all duration-150 ${
                  character === 'leon' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500"></span>
                里昂
              </button>
              <button
                onClick={() => handleCharacterChange('claire')}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 whitespace-nowrap transition-all duration-150 ${
                  character === 'claire' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-red-500"></span>
                克莱尔
              </button>
            </div>
          )}
        </div>

        {/* 模式切换按钮 - 柔和黄边框 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowModePicker(prev => !prev)
              setShowFloorPicker(false)
              setShowCharacterPicker(false)
              setShowMarkerPicker(false)
            }}
            className={`${buttonBase} ${showModePicker ? 'border-2 border-amber-300/80 bg-re2-accent/5' : 'border border-amber-200/80'} ${mode === 'expert' ? 'ring-2 ring-red-400/40' : ''}`}
            title="模式"
          >
            <ModeIcon active={showModePicker || mode === 'expert'} />
          </button>

          {/* 模式选择面板 */}
          {showModePicker && (
            <div className="absolute right-full top-0 mr-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lifted overflow-hidden z-20 min-w-[130px]">
              <button
                onClick={() => handleModeChange('normal')}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 whitespace-nowrap transition-all duration-150 ${
                  mode === 'normal' ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-green-500"></span>
                普通模式
              </button>
              <button
                onClick={() => handleModeChange('expert')}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 whitespace-nowrap transition-all duration-150 ${
                  mode === 'expert' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-red-500"></span>
                专家模式
              </button>
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="h-px bg-re2-subtle mx-1" />

        {/* 标点标记按钮 - 柔和玫瑰边框 */}
        <button
          onClick={handleAddMarkerClick}
          className={`${buttonBase} ${isPlacingMarker ? 'border-2 border-rose-300/80 bg-re2-accent/5' : 'border border-rose-200/80'}`}
          title="添加标点"
        >
          <PinIcon active={isPlacingMarker} />
        </button>

        {/* 路线按钮 - 柔和紫边框 */}
        <button
          onClick={() => {
            onRouteToggle()
            setShowModePicker(false)
            setShowFloorPicker(false)
            setShowCharacterPicker(false)
            setShowMarkerPicker(false)
          }}
          className={`${buttonBase} ${showRoutes ? 'border-2 border-purple-300/80 bg-re2-accent/5' : 'border border-purple-200/80'}`}
          title="路线"
        >
          <PathIcon active={showRoutes} />
        </button>

        {/* 路线编辑按钮 - 柔和青边框 */}
        <button
          onClick={() => {
            setIsEditingRoutes(!isEditingRoutes)
            setShowModePicker(false)
            setShowFloorPicker(false)
            setShowCharacterPicker(false)
            setShowMarkerPicker(false)
            if (isPlacingMarker) {
              setIsPlacingMarker(false)
              setSelectedMarkerIcon(null)
            }
            if (isEditingMarkers) {
              setIsEditingMarkers(false)
            }
          }}
          className={`${buttonBase} ${isEditingRoutes ? 'border-2 border-teal-300/80 bg-purple-50/50' : 'border border-teal-200/80'}`}
          title="编辑路线"
        >
          <SettingsIcon active={isEditingRoutes} />
        </button>

        {/* 编辑标点按钮 - 柔和橙边框 */}
        <button
          onClick={() => {
            setShowModePicker(false)
            setShowFloorPicker(false)
            setShowCharacterPicker(false)
            setShowMarkerPicker(false)
            if (isEditingMarkers) {
              setIsEditingMarkers(false)
            } else {
              if (isPlacingMarker) {
                setIsPlacingMarker(false)
                setSelectedMarkerIcon(null)
              }
              setIsEditingMarkers(true)
            }
          }}
          className={`${buttonBase} ${isEditingMarkers ? 'border-2 border-orange-300/80 bg-re2-accent/5' : 'border border-orange-200/80'}`}
          title="编辑标点"
        >
          <EditIcon active={isEditingMarkers} />
        </button>
      </div>
        </>
      )}
    </div>
  )
}