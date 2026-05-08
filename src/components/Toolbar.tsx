import { useState, useCallback } from 'react'
import { useMapStore, type Character, type GameMode, type CustomMarker } from '../stores/useMapStore'
import { FLOOR_ORDER, CATEGORIES } from '../data/markers'

interface ToolbarProps {
  onFilterToggle: () => void
  onRouteToggle: () => void
  showFilter: boolean
  showRoutes: boolean
}

// 统一风格的线性图标 - 每个图标有独立的未选中/选中颜色
const FilterIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-5 h-5 transition-colors ${active ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const FloorIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-5 h-5 transition-colors ${active ? 'text-blue-500' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const CharacterIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-5 h-5 transition-colors ${active ? 'text-green-500' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const PathIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-5 h-5 transition-colors ${active ? 'text-purple-500' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
)

const PinIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-5 h-5 transition-colors ${active ? 'text-rose-500' : 'text-rose-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const EditIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-5 h-5 transition-colors ${active ? 'text-orange-500' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const SettingsIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-5 h-5 transition-colors ${active ? 'text-teal-500' : 'text-teal-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

export default function Toolbar({ onFilterToggle, onRouteToggle, showFilter, showRoutes }: ToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const character = useMapStore(s => s.character)
  const mode = useMapStore(s => s.mode)
  const floor = useMapStore(s => s.floor)
  const isPlacingMarker = useMapStore(s => s.isPlacingMarker)
  const isEditingMarkers = useMapStore(s => s.isEditingMarkers)
  const isEditingRoutes = useMapStore(s => s.isEditingRoutes)
  const setCharacter = useMapStore(s => s.setCharacter)
  const setMode = useMapStore(s => s.setMode)
  const setFloor = useMapStore(s => s.setFloor)
  const setIsPlacingMarker = useMapStore(s => s.setIsPlacingMarker)
  const setIsEditingMarkers = useMapStore(s => s.setIsEditingMarkers)
  const setIsEditingRoutes = useMapStore(s => s.setIsEditingRoutes)
  const setSelectedMarkerIcon = useMapStore(s => s.setSelectedMarkerIcon)
  const setTempMarker = useMapStore(s => s.setTempMarker)

  const [showCharacterPicker, setShowCharacterPicker] = useState(false)
  const [showMarkerPicker, setShowMarkerPicker] = useState(false)
  const [showModePicker, setShowModePicker] = useState(false)
  const [showFloorPicker, setShowFloorPicker] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
    const cat = CATEGORIES.find(c => c.id === selectedCategory)
    if (!cat) return
    const iconPath = `./re2_map_sewer_ui/loot%20ping/${cat.id}/${sub.icon}`
    console.log('select subcategory:', sub.name, 'path:', iconPath)
    setSelectedMarkerIcon(iconPath)
    setIsPlacingMarker(true)
    setShowMarkerPicker(false)
    setSelectedCategory(null)
    console.log('after set:', useMapStore.getState().isPlacingMarker, useMapStore.getState().selectedMarkerIcon)
  }, [selectedCategory, setSelectedMarkerIcon, setIsPlacingMarker])

  const customMarkers = useMapStore(s => s.customMarkers)
  const addCustomMarker = useMapStore(s => s.addCustomMarker)

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

  // 按钮通用样式
  const buttonBase = "w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100/80 hover:bg-slate-200 shadow-soft transition-all duration-150 hover:shadow-card hover:scale-105 active:scale-95"

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
            <svg className={`w-5 h-5 transition-colors ${mode === 'expert' ? 'text-red-500' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
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