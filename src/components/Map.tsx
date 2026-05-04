import { useRef, useEffect, useState } from 'react'
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl'
import { useMapStore, type CustomMarker, type TempMarker } from '../stores/useMapStore'
import 'maplibre-gl/dist/maplibre-gl.css'

// 楼层图片映射
const FLOOR_IMAGES: Record<string, string> = {
  'B3': '/re2_map_sewer/re2_sewer_B3.png',
  'B2': '/re2_map_sewer/re2_sewer_B2.png',
  'B1o': '/re2_map_sewer/re2_sewer_B1o.png',
  'B1': '/re2_map_sewer/re2_sewer_B1.png',
  '1F': '/re2_map_sewer/re2_sewer_1F.png',
  '2F': '/re2_map_sewer/re2_sewer_2F.png',
  '3F': '/re2_map_sewer/re2_sewer_3F.png',
}

// 图片宽高比 (从实际图片尺寸得出)
const FLOOR_RATIOS: Record<string, number> = {
  'B3': 2.302,   // 3106x1349
  'B2': 0.583,   // 1564x2681
  'B1o': 1.176,  // 2220x1888
  'B1': 1.328,   // 2359x1776
  '1F': 1.000,   // 2048x2048
  '2F': 1.207,   // 2249x1863
  '3F': 1.641,   // 2622x1598
}

// 根据宽高比获取图片坐标
// MapLibre image source: coordinates are [topLeft, topRight, bottomRight, bottomLeft]
// 坐标范围 [0,0] 到 [1,1]
function getFloorCoordinates(floor: string): number[][] {
  const ratio = FLOOR_RATIOS[floor] || 1
  if (ratio >= 1) {
    // 横向图片（宽>高）：宽度撑满1，高度按比例
    const h = 1 / ratio
    return [[0, h], [1, h], [1, 0], [0, 0]]
  } else {
    // 纵向图片（高>宽）：高度撑满1，宽度按比例
    const w = ratio
    const xOffset = (1 - w) / 2
    return [[xOffset, 1], [xOffset + w, 1], [xOffset + w, 0], [xOffset, 0]]
  }
}

// 获取当前楼层的地理边界
function getFloorBounds(floor: string): { minX: number; minY: number; maxX: number; maxY: number } {
  const coords = getFloorCoordinates(floor)
  return {
    minX: Math.min(...coords.map(c => c[0])),
    minY: Math.min(...coords.map(c => c[1])),
    maxX: Math.max(...coords.map(c => c[0])),
    maxY: Math.max(...coords.map(c => c[1])),
  }
}

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState<{x: number; y: number} | null>(null)
  const [showMarkerForm, setShowMarkerForm] = useState(false)
  const [markerFormPosition, setMarkerFormPosition] = useState<{x: number; y: number} | null>(null)
  const [pendingMarker, setPendingMarker] = useState<{coordinates: [number, number]; icon: string; category: string} | null>(null)

  // 临时标点引用
  const tempMarkerRef = useRef<maplibregl.Marker | null>(null)

  const {
    floor,
    isPlacingMarker,
    selectedMarkerIcon,
    customMarkers,
    addCustomMarker,
    tempMarker,
    setTempMarker,
    updateTempMarker,
    confirmTempMarker,
  } = useMapStore()

  // 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#1a1a1a' },
          },
        ],
      },
      center: [0, 0],
      zoom: 0,
      minZoom: 0,
      maxZoom: 22,
      attributionControl: false,
      scrollZoom: true,
      boxZoom: true,
      dragRotate: false,
      touchZoomRotate: true,
      keyboard: true,
      doubleClickZoom: false,
      dragPan: true,
    })

    mapRef.current = map

    map.on('load', () => {
      // 添加楼层图片作为地图层
      const imageUrl = FLOOR_IMAGES[floor]
      if (imageUrl) {
        map.addSource('floor-image', {
          type: 'image',
          url: imageUrl,
          coordinates: getFloorCoordinates(floor),
        })

        map.addLayer({
          id: 'floor-layer',
          type: 'raster',
          source: 'floor-image',
        })
      }

      map.addControl(new maplibregl.NavigationControl(), 'top-left')

      // 设置初始视图以适应图片
      const coords = getFloorCoordinates(floor)
      const minX = Math.min(...coords.map(c => c[0]))
      const minY = Math.min(...coords.map(c => c[1]))
      const maxX = Math.max(...coords.map(c => c[0]))
      const maxY = Math.max(...coords.map(c => c[1]))
      map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 0, animate: false })

      // 点击事件监听 - 在 map 初始化后设置
      map.on('click', (e) => {
        const state = useMapStore.getState()
        if (!state.isPlacingMarker || !state.selectedMarkerIcon) return

        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat]
        const screenPos = map.project(e.lngLat)
        const popupWidth = 280
        const popupHeight = 340
        const padding = 16

        let left = screenPos.x - popupWidth / 2
        left = Math.max(padding, Math.min(left, window.innerWidth - popupWidth - padding))

        let top = screenPos.y - popupHeight - 16
        if (top < padding) {
          top = screenPos.y + 40
        }
        top = Math.max(padding, Math.min(top, window.innerHeight - popupHeight - padding))

        setMarkerFormPosition({ x: left, y: top })
        setPendingMarker({
          coordinates,
          icon: state.selectedMarkerIcon,
          category: state.selectedMarkerIcon.split('/')[5],
        })
        setShowMarkerForm(true)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // 监听临时标点变化，更新地图上的临时标点
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 移除旧的临时标点
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove()
      tempMarkerRef.current = null
    }

    if (!tempMarker) return

    // 创建临时标点包装器
    const wrapper = document.createElement('div')
    wrapper.className = 'map-marker-wrapper'
    wrapper.style.cssText = `
      width: 36px;
      height: 42px;
      cursor: grab;
      position: relative;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
      z-index: 100;
    `

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '36')
    svg.setAttribute('height', '42')
    svg.setAttribute('viewBox', '0 0 36 42')
    svg.style.cssText = 'position:absolute;top:0;left:0;z-index:1;overflow:visible;'

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M 18,0 C 5,0 0,12 0,18 C 0,27 5,34 18,42 C 31,34 36,27 36,18 C 36,12 31,0 18,0 Z')
    path.setAttribute('fill', 'white')
    svg.appendChild(path)
    wrapper.appendChild(svg)

    const img = document.createElement('img')
    img.src = tempMarker.icon
    img.style.cssText = `
      position: absolute;
      top: 5px;
      left: 50%;
      transform: translateX(-50%);
      width: 26px;
      height: 26px;
      object-fit: contain;
      pointer-events: none;
      z-index: 2;
    `
    wrapper.appendChild(img)

    // 创建临时标点
    const marker = new maplibregl.Marker({
      element: wrapper,
      anchor: 'bottom',
    })
      .setLngLat(tempMarker.coordinates)
      .addTo(map)

    tempMarkerRef.current = marker
    console.log('temp marker at', tempMarker.coordinates)
  }, [tempMarker])

  // 监听自定义标点变化，更新地图
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 清除旧的标记
    document.querySelectorAll('.map-marker-wrapper').forEach(el => el.remove())

    // 只显示当前楼层的标点
    const floorMarkers = customMarkers.filter(m => m.floor === floor)

    // 添加新的标记
    floorMarkers.forEach((marker, index) => {
      // 创建包装器
      const wrapper = document.createElement('div')
      wrapper.className = 'map-marker-wrapper'
      wrapper.style.cssText = `
        width: 36px;
        height: 42px;
        cursor: grab;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
        z-index: ${10 + index};
      `
      wrapper.dataset.markerId = marker.id

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '36')
      svg.setAttribute('height', '42')
      svg.setAttribute('viewBox', '0 0 36 42')
      svg.style.cssText = 'position:absolute;top:0;left:0;z-index:1;overflow:visible;'

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', 'M 18,0 C 5,0 0,12 0,18 C 0,27 5,34 18,42 C 31,34 36,27 36,18 C 36,12 31,0 18,0 Z')
      path.setAttribute('fill', 'white')
      svg.appendChild(path)
      wrapper.appendChild(svg)

      const img = document.createElement('img')
      img.src = marker.icon
      img.style.cssText = `
        position: absolute;
        top: 5px;
        left: 50%;
        transform: translateX(-50%);
        width: 26px;
        height: 26px;
        object-fit: contain;
        pointer-events: none;
        z-index: 2;
      `
      wrapper.appendChild(img)

      // 手动拖动实现
      let isDragging = false
      let hasMoved = false
      let startX = 0
      let startY = 0
      let startLngLat: [number, number] = [0, 0]

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        isDragging = true
        hasMoved = false
        startX = e.clientX
        startY = e.clientY
        startLngLat = mapMarker.getLngLat()
        wrapper.style.cursor = 'grabbing'
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return

        const map = mapRef.current
        if (!map) return

        const dx = e.clientX - startX
        const dy = e.clientY - startY

        if (!hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          hasMoved = true
          setSelectedMarkerId(null)
        }

        const startPoint = map.project(startLngLat)
        const newPoint = { x: startPoint.x + dx, y: startPoint.y + dy }
        const newLngLat = map.unproject([newPoint.x, newPoint.y])

        mapMarker.setLngLat(newLngLat)

        if (selectedMarkerId === marker.id && hasMoved) {
          const screenPos = map.project(newLngLat)
          setPopupPosition({ x: screenPos.x, y: screenPos.y })
        }
      }

      const onMouseUp = () => {
        if (!isDragging) return
        isDragging = false
        wrapper.style.cursor = 'grab'

        if (hasMoved) {
          const lngLat = mapMarker.getLngLat()
          const markerId = wrapper.dataset.markerId
          if (markerId) {
            useMapStore.getState().updateCustomMarker(markerId, {
              coordinates: [lngLat.lng, lngLat.lat],
            })
          }
        }
      }

      wrapper.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)

      // 点击标点显示详情弹窗
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation()
        const markerId = wrapper.dataset.markerId
        if (!markerId) return

        const rect = wrapper.getBoundingClientRect()
        setPopupPosition({
          x: rect.left + rect.width / 2,
          y: rect.top,
        })
        setSelectedMarkerId(markerId)
      })

      // 创建地图标记
      const mapMarker = new maplibregl.Marker({
        element: wrapper,
        anchor: 'bottom',
      })
        .setLngLat(marker.coordinates)
        .addTo(map)
    })
  }, [customMarkers, floor])

  // 楼层变化时更新图片
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const imageUrl = FLOOR_IMAGES[floor]
    if (!imageUrl) return

    const updateImage = () => {
      if (map.getLayer('floor-layer')) {
        map.removeLayer('floor-layer')
      }
      if (map.getSource('floor-image')) {
        map.removeSource('floor-image')
      }

      map.addSource('floor-image', {
        type: 'image',
        url: imageUrl,
        coordinates: getFloorCoordinates(floor),
      })

      map.addLayer({
        id: 'floor-layer',
        type: 'raster',
        source: 'floor-image',
      })
    }

    if (map.isStyleLoaded()) {
      updateImage()
    } else {
      map.once('load', updateImage)
    }
  }, [floor])

  // 楼层变化时重新加载图片
  useEffect(() => {
    setImageError(null)
  }, [floor])

  // 当地图移动/缩放时更新弹窗位置
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedMarkerId || !popupPosition) return

    const updatePosition = () => {
      const marker = customMarkers.find(m => m.id === selectedMarkerId)
      if (!marker) return

      const screenPos = map.project(marker.coordinates)
      setPopupPosition({ x: screenPos.x, y: screenPos.y })
    }

    map.on('move', updatePosition)
    map.on('zoom', updatePosition)

    return () => {
      map.off('move', updatePosition)
      map.off('zoom', updatePosition)
    }
  }, [selectedMarkerId, customMarkers])

  // 点击地图空白区域关闭弹窗
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedMarkerId) return

    const handleMapClick = () => {
      setSelectedMarkerId(null)
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [selectedMarkerId])

  // ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMarkerId) {
        setSelectedMarkerId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedMarkerId])

  return (
    <div className="w-full h-full relative">
      {/* 地图层 */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* 图片加载错误提示 */}
      {imageError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-900/50">
          <div className="text-white text-center p-4">
            <p className="font-bold">图片加载失败</p>
            <p className="text-sm mt-2">{imageError}</p>
          </div>
        </div>
      )}

      {/* 标点模式提示 */}
      {isPlacingMarker && !showMarkerForm && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-re2-accent text-white px-4 py-2 rounded-full text-sm">
          点击地图选择位置
        </div>
      )}

      {/* 标点信息填写表单 */}
      {showMarkerForm && pendingMarker && markerFormPosition && (
        <div
          className="absolute z-50 bg-re2-dark/95 border border-gray-600 rounded-lg shadow-2xl overflow-hidden"
          style={{
            left: markerFormPosition.x,
            top: markerFormPosition.y,
            transform: 'none',
            width: '280px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 底部小三角指向标点 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              bottom: '-8px',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #4b5563',
            }}
          />
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600 bg-gray-800/50">
            <span className="text-white font-medium text-sm">填写标点信息</span>
            <button
              onClick={() => {
                setShowMarkerForm(false)
                setPendingMarker(null)
              }}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-3">
            {/* 标点图标预览 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={pendingMarker.icon}
                  alt=""
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{pendingMarker.category}</p>
                <p className="text-gray-400 text-xs mt-1">坐标: {pendingMarker.coordinates.join(', ')}</p>
              </div>
            </div>

            {/* 人物选择 */}
            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-2">人物</p>
              <div className="flex gap-2">
                <button
                  onClick={() => useMapStore.getState().setCharacter('leon')}
                  className={`flex-1 py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().character === 'leon'
                      ? 'bg-blue-600/30 text-white border border-blue-500'
                      : 'bg-gray-800 text-gray-300 border border-transparent hover:bg-gray-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  里昂
                </button>
                <button
                  onClick={() => useMapStore.getState().setCharacter('claire')}
                  className={`flex-1 py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().character === 'claire'
                      ? 'bg-red-600/30 text-white border border-red-500'
                      : 'bg-gray-800 text-gray-300 border border-transparent hover:bg-gray-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  克莱尔
                </button>
              </div>
            </div>

            {/* 模式选择 */}
            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-2">模式</p>
              <div className="flex gap-2">
                <button
                  onClick={() => useMapStore.getState().setMode('normal')}
                  className={`flex-1 py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().mode === 'normal'
                      ? 'bg-green-600/30 text-white border border-green-500'
                      : 'bg-gray-800 text-gray-300 border border-transparent hover:bg-gray-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  普通
                </button>
                <button
                  onClick={() => useMapStore.getState().setMode('expert')}
                  className={`flex-1 py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().mode === 'expert'
                      ? 'bg-red-600/30 text-white border border-red-500'
                      : 'bg-gray-800 text-gray-300 border border-transparent hover:bg-gray-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  专家
                </button>
              </div>
            </div>

            {/* 确认按钮 */}
            <button
              onClick={() => {
                const state = useMapStore.getState()
                const marker: CustomMarker = {
                  id: `custom_${Date.now()}`,
                  category: pendingMarker.category,
                  icon: pendingMarker.icon,
                  coordinates: pendingMarker.coordinates,
                  floor: state.floor,
                  character: state.character,
                  mode: state.mode,
                }
                state.addCustomMarker(marker)
                setShowMarkerForm(false)
                setPendingMarker(null)
                state.setIsPlacingMarker(false)
                state.setSelectedMarkerIcon(null)
              }}
              className="w-full py-2 px-4 bg-re2-accent hover:bg-re2-accent/80 text-white rounded font-medium transition-colors"
            >
              确认添加
            </button>
          </div>
        </div>
      )}

      {/* 标点详情弹窗 */}
      {selectedMarkerId && popupPosition && (
        <div
          className="absolute z-50 bg-re2-dark/95 border border-gray-600 rounded-lg shadow-2xl overflow-hidden"
          style={{
            left: popupPosition.x,
            top: popupPosition.y - 10,
            transform: 'translate(-50%, -100%)',
            maxWidth: '280px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 弹窗头部 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600 bg-gray-800/50">
            <span className="text-white font-medium text-sm">标点详情</span>
            <button
              onClick={() => setSelectedMarkerId(null)}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              ×
            </button>
          </div>
          {/* 弹窗内容 */}
          <div className="p-3">
            {/* 标点图标 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={customMarkers.find(m => m.id === selectedMarkerId)?.icon}
                  alt=""
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {customMarkers.find(m => m.id === selectedMarkerId)?.category || '未分类'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  坐标: {customMarkers.find(m => m.id === selectedMarkerId)?.coordinates?.join(', ')}
                </p>
              </div>
            </div>
            {/* 提示文字 */}
            <p className="text-gray-400 text-xs">
              提示：拖动标点可移动位置，点击其他区域关闭此弹窗
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
