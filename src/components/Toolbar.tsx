import { useState, useCallback } from 'react'
import { useMapStore, type Character, type GameMode, type CustomMarker } from '../stores/useMapStore'
import { FLOOR_ORDER, CATEGORIES } from '../data/markers'

interface ToolbarProps {
  onFilterToggle: () => void
  onRouteToggle: () => void
  showFilter: boolean
  showRoutes: boolean
}

// UI 图标路径
const UI_ICONS = {
  character: '/re2_map_sewer_ui/character selection.png',
  filter: '/re2_map_sewer_ui/filter.png',
  floor: '/re2_map_sewer_ui/floor selection.png',
  mode: '/re2_map_sewer_ui/model selection.png',
  path: '/re2_map_sewer_ui/Path selection.png',
  punctuation: '/re2_map_sewer_ui/punctuation marking.png',
}

export default function Toolbar({ onFilterToggle, onRouteToggle, showFilter, showRoutes }: ToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const character = useMapStore(s => s.character)
  const mode = useMapStore(s => s.mode)
  const floor = useMapStore(s => s.floor)
  const isPlacingMarker = useMapStore(s => s.isPlacingMarker)
  const setCharacter = useMapStore(s => s.setCharacter)
  const setMode = useMapStore(s => s.setMode)
  const setFloor = useMapStore(s => s.setFloor)
  const setIsPlacingMarker = useMapStore(s => s.setIsPlacingMarker)
  const setSelectedMarkerIcon = useMapStore(s => s.setSelectedMarkerIcon)

  const [showCharacterPicker, setShowCharacterPicker] = useState(false)
  const [showMarkerPicker, setShowMarkerPicker] = useState(false)
  const [showModePicker, setShowModePicker] = useState(false)
  const [showFloorPicker, setShowFloorPicker] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleCharacterChange = useCallback((c: Character) => {
    setCharacter(c)
    setShowCharacterPicker(false)
  }, [setCharacter])

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
    } else {
      setShowMarkerPicker(prev => !prev)
    }
  }, [isPlacingMarker, setIsPlacingMarker, setSelectedMarkerIcon])

  const handleSelectCategory = useCallback((catId: string) => {
    setSelectedCategory(catId)
  }, [])

  const handleSelectSubCategory = useCallback((sub: { id: string; name: string; icon: string }) => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory)
    if (!cat) return
    const iconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${sub.icon}`
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

  return (
    <div className="absolute top-0 right-0 z-10 flex items-start">
      {/* 收起/展开按钮 */}
      <button
        onClick={() => setIsCollapsed(prev => !prev)}
        className="w-8 h-8 bg-re2-dark/95 border border-gray-700 rounded-l flex items-center justify-center hover:bg-gray-700 transition-colors"
      >
        <svg
          className={`w-4 h-4 text-white transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 工具栏主体 */}
      {!isCollapsed && (
        <>
        {/* 右侧垂直工具栏 */}
        <div className="flex flex-col gap-1 p-2 bg-re2-dark/95 backdrop-blur-sm">
        {/* 当前楼层显示 */}
        <div className="flex items-center justify-center py-1 px-3 border-b border-gray-700">
          <span className="text-lg font-bold text-white">{floor}</span>
        </div>

        {/* 筛选按钮 */}
        <button
          onClick={() => {
            onFilterToggle()
            setShowModePicker(false)
            setShowFloorPicker(false)
            setShowCharacterPicker(false)
          }}
          className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
            showFilter ? 'border-re2-accent' : 'border-transparent hover:border-white/30'
          }`}
        >
          <img
            src={UI_ICONS.filter}
            alt="筛选"
            className="w-full h-full object-contain bg-gray-800"
          />
        </button>

        {/* 楼层选择按钮 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFloorPicker(prev => !prev)
              setShowModePicker(false)
              setShowCharacterPicker(false)
              setShowMarkerPicker(false)
            }}
            className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
              showFloorPicker ? 'border-re2-accent' : 'border-transparent hover:border-white/30'
            }`}
            style={{ padding: 0 }}
          >
            <img
              src={UI_ICONS.floor}
              alt="楼层"
              className="w-full h-full object-contain bg-gray-800"
            />
          </button>

          {/* 楼层选择面板 */}
          {showFloorPicker && (
            <div className="absolute right-full top-0 mr-1 bg-re2-dark/98 border border-gray-700 rounded-lg overflow-hidden shadow-xl z-20">
              <div className="py-1">
                {FLOOR_ORDER.map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFloorChange(f)}
                    className={`w-full px-4 py-2 text-left text-sm whitespace-nowrap transition-colors ${
                      floor === f ? 'bg-re2-accent/30 text-white font-medium' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 角色选择按钮 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCharacterPicker(prev => !prev)
              setShowModePicker(false)
              setShowFloorPicker(false)
              setShowMarkerPicker(false)
            }}
            className="w-12 h-12 rounded overflow-hidden border-2 border-transparent hover:border-white/30 transition-colors"
            style={{ padding: 0 }}
          >
            <img
              src={UI_ICONS.character}
              alt="角色切换"
              className="w-full h-full object-contain bg-gray-800"
            />
          </button>

          {/* 角色选择面板 */}
          {showCharacterPicker && (
            <div className="absolute right-full top-0 mr-1 bg-re2-dark/98 border border-gray-700 rounded-lg overflow-hidden shadow-xl z-20">
              <button
                onClick={() => handleCharacterChange('leon')}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  character === 'leon' ? 'bg-blue-600/30 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                里昂
              </button>
              <button
                onClick={() => handleCharacterChange('claire')}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  character === 'claire' ? 'bg-red-600/30 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                克莱尔
              </button>
            </div>
          )}
        </div>

        {/* 模式切换按钮 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowModePicker(prev => !prev)
              setShowFloorPicker(false)
              setShowCharacterPicker(false)
              setShowMarkerPicker(false)
            }}
            className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
              mode === 'expert' ? 'border-red-500' : 'border-transparent hover:border-white/30'
            }`}
          >
            <img
              src={UI_ICONS.mode}
              alt="模式切换"
              className="w-full h-full object-contain bg-gray-800"
            />
          </button>

          {/* 模式选择面板 */}
          {showModePicker && (
            <div className="absolute right-full top-0 mr-1 bg-re2-dark/98 border border-gray-700 rounded-lg overflow-hidden shadow-xl z-20 min-w-[120px]">
              <button
                onClick={() => handleModeChange('normal')}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  mode === 'normal' ? 'bg-green-600/30 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                普通模式
              </button>
              <button
                onClick={() => handleModeChange('expert')}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  mode === 'expert' ? 'bg-red-600/30 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                专家模式
              </button>
            </div>
          )}
        </div>

        {/* 路线按钮 */}
        <button
          onClick={() => {
            onRouteToggle()
            setShowModePicker(false)
            setShowFloorPicker(false)
            setShowCharacterPicker(false)
            setShowMarkerPicker(false)
          }}
          className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
            showRoutes ? 'border-re2-accent' : 'border-transparent hover:border-white/30'
          }`}
        >
          <img
            src={UI_ICONS.path}
            alt="路线"
            className="w-full h-full object-contain bg-gray-800"
          />
        </button>

        {/* 标点标记按钮 */}
        <button
          onClick={handleAddMarkerClick}
          className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
            isPlacingMarker ? 'border-re2-accent' : 'border-transparent hover:border-white/30'
          }`}
        >
          <img
            src={UI_ICONS.punctuation}
            alt="标点"
            className="w-full h-full object-contain bg-gray-800"
          />
        </button>
      </div>

      {/* 标点选择器 */}
      {showMarkerPicker && (
        <div className="absolute right-full top-0 mr-1 bg-re2-dark/98 border border-gray-700 rounded-lg p-3 z-20 w-64">
          {/* 导入/导出按钮 */}
          <div className="flex gap-2 mb-3 border-b border-gray-700 pb-3">
            <label className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleImportMarkers}
                className="hidden"
              />
              <div className="text-xs text-center text-gray-400 hover:text-white cursor-pointer bg-gray-800 rounded py-1 px-2">
                导入
              </div>
            </label>
            <button
              onClick={handleExportMarkers}
              className="flex-1 text-xs text-gray-400 hover:text-white bg-gray-800 rounded py-1 px-2"
            >
              导出
            </button>
          </div>

          {!selectedCategory ? (
            <>
              <p className="text-xs text-gray-400 mb-2">选择一级分类：</p>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => {
                  const iconPath = `/re2_map_sewer_ui/loot%20ping/${cat.id}/${cat.icon}`
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className="aspect-square bg-gray-800 rounded overflow-hidden hover:bg-gray-700 transition-colors"
                      title={cat.name}
                    >
                      <img
                        src={iconPath.replace('loot%20ping', 'loot ping')}
                        alt={cat.name}
                        className="w-full h-full object-contain p-1"
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
                className="text-xs text-gray-400 hover:text-white mb-2 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
              <p className="text-xs text-gray-400 mb-2">
                {CATEGORIES.find(c => c.id === selectedCategory)?.name} - 选择二级分类：
              </p>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.find(c => c.id === selectedCategory)?.subCategories.map((sub) => {
                  const iconPath = `/re2_map_sewer_ui/loot%20ping/${selectedCategory}/${sub.icon}`
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubCategory(sub)}
                      className="aspect-square bg-gray-800 rounded overflow-hidden hover:bg-gray-700 transition-colors flex items-center justify-center p-1"
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
        </>
      )}
    </div>
  )
}
