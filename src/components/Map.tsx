import { useRef, useEffect, useState } from 'react'
import maplibregl, { Marker as MapMarker } from 'maplibre-gl'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useMapStore, type CustomMarker } from '../stores/useMapStore'
import { CATEGORIES } from '../data/markers'
import { preloadAllFloorImages } from '../utils/preload'
import 'maplibre-gl/dist/maplibre-gl.css'
import MarkerEditModal from './MarkerEditModal'

// 楼层图片映射
const BASE_PATH = import.meta.env.PROD ? './' : '/'
const FLOOR_IMAGES: Record<string, string> = {
  'B3': `${BASE_PATH}re2_map_sewer/re2_sewer_B3.png`,
  'B2': `${BASE_PATH}re2_map_sewer/re2_sewer_B2.png`,
  'B2o': `${BASE_PATH}re2_map_sewer/re2_sewer_B2o.png`,
  'B1o': `${BASE_PATH}re2_map_sewer/re2_sewer_B1o.png`,
  'B1': `${BASE_PATH}re2_map_sewer/re2_sewer_B1.png`,
  '1F': `${BASE_PATH}re2_map_sewer/re2_sewer_1F.png`,
  '2F': `${BASE_PATH}re2_map_sewer/re2_sewer_2F.png`,
  '3F': `${BASE_PATH}re2_map_sewer/re2_sewer_3F.png`,
}

// 图片宽高比 (从实际图片尺寸得出)
const FLOOR_RATIOS: Record<string, number> = {
  'B3': 2.302,   // 3106x1349
  'B2': 0.583,   // 1564x2681
  'B2o': 1.111,  // 2158x1942
  'B1o': 1.176,  // 2220x1888
  'B1': 1.328,   // 2359x1776
  '1F': 1.000,   // 2048x2048
  '2F': 1.207,   // 2249x1863
  '3F': 1.641,   // 2622x1598
}

// 根据宽高比获取图片坐标
// MapLibre image source: coordinates are [topLeft, topRight, bottomRight, bottomLeft]
// 坐标范围 [0,0] 到 [1,1]
function getFloorCoordinates(floor: string): [[number, number], [number, number], [number, number], [number, number]] {
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

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState<{x: number; y: number} | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const popupDragging = useRef(false)
  const popupDragStart = useRef({ x: 0, y: 0 })
  const popupPosStart = useRef({ x: 0, y: 0 })
  const popupWidth = 320
  const popupHeight = 200
  const popupPadding = 16
  const [showMarkerForm, setShowMarkerForm] = useState(false)
  const [markerFormPosition, setMarkerFormPosition] = useState<{x: number; y: number} | null>(null)
  const [pendingMarker, setPendingMarker] = useState<{name: string; coordinates: [number, number]; icon: string; category: string} | null>(null)
  const [editingMarker, setEditingMarker] = useState<{marker: CustomMarker; position: {x: number; y: number}} | null>(null)

  // 临时标点引用
  const tempMarkerRef = useRef<maplibregl.Marker | null>(null)

  // 路线路径点引用
  const waypointMarkersRef = useRef<MapMarker[]>([])

  // 标点更新涓流 ref
  const markerUpdateRafId = useRef<number | null>(null)

  // 标点 Map（用于视口裁剪，按 ID 快速查找）
  const markerMapRef = useRef<Record<string, maplibregl.Marker>>({})

  // 当前可见的标点 ID 集合
  const visibleMarkerIdsRef = useRef<Set<string>>(new Set())

  // 标点数据快照（用于在 RAF 中访问最新值）
  const markerDataRef = useRef<{ floor: string; character: string; mode: string; activeCategories: Set<string> }>({
    floor: '', character: '', mode: '', activeCategories: new Set()
  })

  const {
    floor,
    character,
    mode,
    isPlacingMarker,
    isEditingMarkers,
    customMarkers,
    tempMarker,
    routes,
    activeRoutes,
    isEditingRoutes,
    editingRouteId,
    setEditingRouteId,
    activeCategories,
  } = useMapStore()

  // 初始化地图
  useEffect(() => {
    // 预加载所有楼层图片（利用浏览器缓存）
    preloadAllFloorImages(FLOOR_IMAGES)

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
            paint: { 'background-color': '#e8eaed' },
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

      // 不使用默认的 NavigationControl，我们用自定义样式按钮

      // 设置初始视图以适应图片
      const coords = getFloorCoordinates(floor)
      const minX = Math.min(...coords.map(c => c[0]))
      const minY = Math.min(...coords.map(c => c[1]))
      const maxX = Math.max(...coords.map(c => c[0]))
      const maxY = Math.max(...coords.map(c => c[1]))
      map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 0, animate: false })

      // 延迟500ms后再初始化标点，确保地图已完全渲染
      setTimeout(() => {
        console.log('[Map] Delayed init - customMarkers:', useMapStore.getState().customMarkers.length)
      }, 500)

      // 点击事件监听 - 在 map 初始化后设置
      map.on('click', (e) => {
        const state = useMapStore.getState()

        // 路线编辑模式：添加路径点
        if (state.isEditingRoutes && state.editingRouteId) {
          const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat]
          const route = state.routes.find(r => r.id === state.editingRouteId)
          if (route) {
            const newWaypoint = {
              id: `wp_${Date.now()}`,
              coordinates
            }
            state.updateRoute(state.editingRouteId, {
              waypoints: [...route.waypoints, newWaypoint]
            })
          }
          return
        }

        // 标点放置模式
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
        const cat = CATEGORIES.find(c => state.selectedMarkerIcon?.includes(`/${c.id}/`))
        const iconName = state.selectedMarkerIcon?.split('/').pop() || ''
        const subCat = cat?.subCategories.find(s => s.icon === iconName)
        setPendingMarker({
          name: subCat?.name || cat?.name || iconName,
          category: cat?.id || state.selectedMarkerIcon?.split('/')[5] || 'unknown',
          icon: state.selectedMarkerIcon,
          coordinates,
        })
        state.setCharacter('both')
        state.setMode('both')
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

  // 监听自定义标点变化，更新地图（标记 Map + 视口裁剪）
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 更新快照数据
    markerDataRef.current = {
      floor,
      character,
      mode,
      activeCategories: activeCategories
    }

    // 辅助函数：通过标点 name 找到对应的子分类 id
    const getSubCategoryId = (marker: CustomMarker): string | null => {
      const cat = CATEGORIES.find(c => c.id === marker.category)
      if (!cat) return null
      const sub = cat.subCategories.find(s => s.name === marker.name)
      return sub?.id || null
    }

    // 过滤出应该在当前楼层显示的标点
    const getFloorMarkers = () => {
      const data = markerDataRef.current
      return customMarkers.filter(m => {
        if (m.floor !== data.floor) return false
        if (data.character === 'leon' && m.character !== 'leon' && m.character !== 'both') return false
        if (data.character === 'claire' && m.character !== 'claire' && m.character !== 'both') return false
        if (data.mode === 'normal' && m.mode !== 'normal' && m.mode !== 'both') return false
        if (data.mode === 'expert' && m.mode !== 'expert' && m.mode !== 'both') return false
        const subCategoryId = getSubCategoryId(m)
        if (subCategoryId && !data.activeCategories.has(subCategoryId)) return false
        return true
      })
    }

    // 创建单个标点
    const createMarkerElement = (marker: CustomMarker, index: number): HTMLElement => {
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
      img.loading = 'lazy'
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
      return wrapper
    }

    // 更新可见标点（根据视口，分批创建避免阻塞）
    const updateVisibleMarkers = () => {
      if (markerUpdateRafId.current) return
      markerUpdateRafId.current = requestAnimationFrame(() => {
        markerUpdateRafId.current = null
        const map = mapRef.current
        if (!map) return

        const bounds = map.getBounds()
        const floorMarkers = getFloorMarkers()
        const newVisibleIds = new Set<string>()

        // 需要创建的新标点
        const toCreate: CustomMarker[] = []
        floorMarkers.forEach(marker => {
          const isVisible = bounds.contains(marker.coordinates)
          const existingMarker = markerMapRef.current[marker.id]

          if (isVisible) {
            newVisibleIds.add(marker.id)
            if (!existingMarker) {
              toCreate.push(marker)
            }
          } else {
            if (existingMarker) {
              existingMarker.remove()
              delete markerMapRef.current[marker.id]
            }
          }
        })

        // 分批创建标点，每帧10个
        const BATCH_SIZE = 10
        let index = 0

        console.log('[Map] updateVisibleMarkers called, toCreate:', toCreate.length)

        const processBatch = () => {
          const batch = toCreate.slice(index, index + BATCH_SIZE)
          batch.forEach(marker => {
            const wrapper = createMarkerElement(marker, 0)
            setupMarkerEvents(wrapper, marker)

            const mapMarker = new maplibregl.Marker({
              element: wrapper,
              anchor: 'bottom',
            })
              .setLngLat(marker.coordinates)
              .addTo(map)

            markerMapRef.current[marker.id] = mapMarker
          })

          index += BATCH_SIZE
          if (index < toCreate.length) {
            requestAnimationFrame(processBatch)
          }
        }

        if (toCreate.length > 0) {
          requestAnimationFrame(processBatch)
        }

        visibleMarkerIdsRef.current = newVisibleIds
      })
    }

    // 设置标点事件
    const setupMarkerEvents = (wrapper: HTMLElement, marker: CustomMarker) => {
      let isDragging = false
      let hasMoved = false
      let startX = 0
      let startY = 0
      let startLngLat: [number, number] = [0, 0]
      let mapMarker: maplibregl.Marker | null = null

      const onMouseDown = (e: MouseEvent) => {
        // 只有在编辑模式下才允许拖动标点
        if (!isEditingMarkers) return
        e.preventDefault()
        e.stopPropagation()
        isDragging = true
        hasMoved = false
        startX = e.clientX
        startY = e.clientY
        mapMarker = markerMapRef.current[marker.id] || null
        if (mapMarker) {
          startLngLat = [mapMarker.getLngLat().lng, mapMarker.getLngLat().lat]
        }
        wrapper.style.cursor = 'grabbing'
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        const map = mapRef.current
        if (!map || !mapMarker) return

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

        if (hasMoved && mapMarker) {
          const lngLat = mapMarker.getLngLat()
          useMapStore.getState().updateCustomMarker(marker.id, {
            coordinates: [lngLat.lng, lngLat.lat],
          })
        }
      }

      wrapper.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)

      // 点击标点显示详情弹窗或编辑弹窗
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation()
        const markerData = customMarkers.find(m => m.id === marker.id)
        if (!markerData) return

        const rect = wrapper.getBoundingClientRect()
        const pos = {
          x: rect.left + rect.width / 2,
          y: rect.top + 42,
        }

        if (isEditingMarkers) {
          setEditingMarker({ marker: markerData, position: pos })
          setSelectedMarkerId(null)
        } else {
          setPopupPosition(pos)
          setSelectedMarkerId(marker.id)
        }
      })
    }

    // 清除当前楼层不在过滤条件内的标点
    const currentFloorMarkers = getFloorMarkers()
    const currentFloorMarkerIds = new Set(currentFloorMarkers.map(m => m.id))

    // 移除不属于当前楼层或不符合过滤条件的标点
    Object.keys(markerMapRef.current).forEach(markerId => {
      if (!currentFloorMarkerIds.has(markerId)) {
        markerMapRef.current[markerId].remove()
        delete markerMapRef.current[markerId]
      }
    })

    // 初始化可见性检查（首次加载时全部显示，因为还没监听 moveend）
    updateVisibleMarkers()

    // 监听地图移动/缩放事件，更新可见标点
    const handleMapMove = () => {
      updateVisibleMarkers()
    }

    map.on('moveend', handleMapMove)
    map.on('zoomend', handleMapMove)

    return () => {
      map.off('moveend', handleMapMove)
      map.off('zoomend', handleMapMove)
    }
  }, [customMarkers, floor, character, mode, isEditingMarkers, activeCategories])

  // 楼层变化时更新图片
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const imageUrl = FLOOR_IMAGES[floor]
    if (!imageUrl) return

    const updateFloorImage = () => {
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

      // 调整视图以适应新楼层
      const coords = getFloorCoordinates(floor)
      const minX = Math.min(...coords.map(c => c[0]))
      const minY = Math.min(...coords.map(c => c[1]))
      const maxX = Math.max(...coords.map(c => c[0]))
      const maxY = Math.max(...coords.map(c => c[1]))
      map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 0, animate: false })
    }

    if (map.isStyleLoaded()) {
      updateFloorImage()
    } else {
      map.once('load', updateFloorImage)
    }
  }, [floor])

  // 楼层变化时重新加载图片
  useEffect(() => {
    setImageError(null)
  }, [floor])

  // 楼层切换时收起路线编辑
  useEffect(() => {
    if (editingRouteId) {
      const route = routes.find(r => r.id === editingRouteId)
      if (route && route.floor !== floor) {
        setEditingRouteId(null)
      }
    }
  }, [floor, editingRouteId, routes, setEditingRouteId])

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

  // 当地图移动/缩放时更新编辑弹窗位置
  useEffect(() => {
    const map = mapRef.current
    if (!map || !editingMarker) return

    const updatePosition = () => {
      const screenPos = map.project(editingMarker.marker.coordinates)
      setEditingMarker(prev => prev ? {
        ...prev,
        position: { x: screenPos.x, y: screenPos.y }
      } : null)
    }

    map.on('move', updatePosition)
    map.on('zoom', updatePosition)

    return () => {
      map.off('move', updatePosition)
      map.off('zoom', updatePosition)
    }
  }, [editingMarker])

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

  // 点击地图空白区域关闭编辑弹窗
  useEffect(() => {
    const map = mapRef.current
    if (!map || !editingMarker) return

    const handleMapClick = () => {
      setEditingMarker(null)
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [editingMarker])

  // ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMarkerId(null)
        setEditingMarker(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 拖动标点详情弹窗
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!popupDragging.current) return
      const dx = e.clientX - popupDragStart.current.x
      const dy = e.clientY - popupDragStart.current.y
      setPopupPos({
        x: popupPosStart.current.x + dx,
        y: popupPosStart.current.y + dy,
      })
    }

    const handleMouseUp = () => {
      popupDragging.current = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // 初始化弹窗位置
  useEffect(() => {
    if (popupPosition) {
      const spaceBelow = window.innerHeight - popupPosition.y
      const spaceAbove = popupPosition.y

      let x = popupPosition.x - popupWidth / 2
      let y: number

      if (spaceBelow >= popupHeight + 20 || spaceBelow > spaceAbove) {
        y = popupPosition.y + 10
      } else {
        y = popupPosition.y - popupHeight - 10
      }

      x = Math.max(popupPadding, Math.min(x, window.innerWidth - popupWidth - popupPadding))
      y = Math.max(popupPadding, Math.min(y, window.innerHeight - popupHeight - popupPadding))

      setPopupPos({ x, y })
    }
  }, [popupPosition])

  // 渲染路线和路径点
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 清除旧的路径点标记
    waypointMarkersRef.current.forEach(marker => marker.remove())
    waypointMarkersRef.current = []

    // 计算应该显示的路线ID（包括 activeRoutes 和正在编辑的路线，但必须匹配当前楼层）
    const visibleRouteIds = new Set([
      ...routes.filter(r => r.waypoints.length >= 2 && activeRoutes.has(r.id) && r.floor === floor).map(r => r.id),
      editingRouteId
    ].filter(Boolean))

    // 移除所有不在 visibleRouteIds 中的路线图层和数据源
    const existingSources = Object.keys(map.getStyle()?.sources || {})
    existingSources.forEach(sourceId => {
      if (sourceId.startsWith('route-source-')) {
        const routeId = sourceId.replace('route-source-', '')
        if (!visibleRouteIds.has(routeId)) {
          if (map.getLayer(`route-line-${routeId}`)) {
            map.removeLayer(`route-line-${routeId}`)
          }
          map.removeSource(sourceId)
        }
      }
    })

    // 只显示有路径点且在 activeRoutes 中选中的路线，或正在编辑的路线，且必须匹配当前楼层
    const routesWithWaypoints = routes.filter(r =>
      r.waypoints.length >= 2 && (activeRoutes.has(r.id) || r.id === editingRouteId) && r.floor === floor
    )
    if (routesWithWaypoints.length === 0) return

    // 为每条路线添加线段和路径点
    routesWithWaypoints.forEach(route => {
      // 添加路线路径
      if (route.waypoints.length >= 2) {
        const lineCoordinates = route.waypoints.map(wp => wp.coordinates)

        const addRouteLayer = () => {
          // 如果源不存在，则添加
          if (!map.getSource(`route-source-${route.id}`)) {
            map.addSource(`route-source-${route.id}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: lineCoordinates
                }
              }
            })

            map.addLayer({
              id: `route-line-${route.id}`,
              type: 'line',
              source: `route-source-${route.id}`,
              paint: {
                'line-color': route.color,
                'line-width': 4,
                'line-opacity': 0.8
              }
            })
          } else {
            // 如果源已存在但路径点有变化，更新数据
            const source = map.getSource(`route-source-${route.id}`) as maplibregl.GeoJSONSource
            source.setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: lineCoordinates
              }
            })
          }
        }

        if (map.isStyleLoaded()) {
          addRouteLayer()
        } else {
          map.once('load', addRouteLayer)
        }
      }

      // 添加路径点标记
      route.waypoints.forEach((wp) => {
        const el = document.createElement('div')
        el.className = 'waypoint-marker'
        el.style.cssText = `
          width: 16px;
          height: 16px;
          background-color: ${route.color};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 1000;
        `

        const marker = new MapMarker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(wp.coordinates)
          .addTo(map)

        waypointMarkersRef.current.push(marker)
      })
    })
  }, [routes, editingRouteId, activeRoutes, floor])

  // 路线编辑模式提示
  useEffect(() => {
    // This is just for the hint display, actual click handling is in the map click handler
  }, [isEditingRoutes, editingRouteId])

  return (
    <div className="w-full h-full relative">
      {/* 地图容器 - 带圆角和阴影 */}
      <div
        ref={mapContainerRef}
        className="absolute inset-2 rounded-xl shadow-card overflow-hidden"
        style={{ zIndex: 1, backgroundColor: '#e8eaed' }}
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md text-gray-700 px-5 py-2.5 rounded-full text-sm shadow-card">
          点击地图选择位置
        </div>
      )}

      {/* 自定义地图缩放按钮 - 右下角 */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => {
            const map = mapRef.current
            if (!map) return
            const coords = getFloorCoordinates(floor)
            const minX = Math.min(...coords.map(c => c[0]))
            const minY = Math.min(...coords.map(c => c[1]))
            const maxX = Math.max(...coords.map(c => c[0]))
            const maxY = Math.max(...coords.map(c => c[1]))
            map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 0, animate: true })
          }}
          className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center shadow-soft hover:bg-slate-100 hover:shadow-card transition-all duration-150 active:scale-95"
          title="还原默认缩放"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center shadow-soft hover:bg-slate-100 hover:shadow-card transition-all duration-150 active:scale-95"
          title="放大"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center shadow-soft hover:bg-slate-100 hover:shadow-card transition-all duration-150 active:scale-95"
          title="缩小"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
          </svg>
        </button>
      </div>

      {/* 路线编辑模式提示 */}
      {isEditingRoutes && editingRouteId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-purple-50 text-purple-600 px-5 py-2.5 rounded-full text-sm shadow-card ring-2 ring-purple-200">
          点击地图添加路径点
        </div>
      )}

      {/* 标点信息填写表单 */}
      {showMarkerForm && pendingMarker && markerFormPosition && (
        <div
          className="absolute z-50 bg-white/95 backdrop-blur-md border border-re2-subtle rounded-xl shadow-lifted overflow-hidden"
          style={{
            left: markerFormPosition.x,
            top: markerFormPosition.y,
            transform: 'none',
            width: '360px',
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
              borderTop: '8px solid #e2e8f0',
            }}
          />
          <div className="flex items-center justify-between px-4 py-3 border-b border-re2-subtle bg-re2-subtle/30">
            <span className="text-gray-700 font-medium text-sm">填写标点信息</span>
            <button
              onClick={() => {
                setShowMarkerForm(false)
                setPendingMarker(null)
              }}
              className="w-6 h-6 flex items-center justify-center text-re2-muted hover:text-gray-700 hover:bg-re2-subtle rounded-btn transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            {/* 标点图标预览 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-re2-subtle/50 rounded-xl flex items-center justify-center overflow-hidden shadow-soft">
                <img
                  src={pendingMarker.icon}
                  alt=""
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <p className="text-gray-700 text-sm font-medium">{pendingMarker.category}</p>
                <p className="text-re2-muted text-xs mt-1">坐标: {pendingMarker.coordinates.join(', ')}</p>
              </div>
            </div>

            {/* 人物选择 */}
            <div className="mb-4">
              <p className="text-re2-muted text-xs mb-2">人物</p>
              <div className="flex gap-2">
                <button
                  onClick={() => useMapStore.getState().setCharacter('leon')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().character === 'leon'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-re2-subtle/30 text-re2-muted border border-transparent hover:bg-re2-subtle/50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  里昂
                </button>
                <button
                  onClick={() => useMapStore.getState().setCharacter('claire')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().character === 'claire'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-re2-subtle/30 text-re2-muted border border-transparent hover:bg-re2-subtle/50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  克莱尔
                </button>
                <button
                  onClick={() => useMapStore.getState().setCharacter('both')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().character === 'both'
                      ? 'bg-purple-50 text-purple-600 border border-purple-200'
                      : 'bg-re2-subtle/30 text-re2-muted border border-transparent hover:bg-re2-subtle/50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  共有
                </button>
              </div>
            </div>

            {/* 模式选择 */}
            <div className="mb-4">
              <p className="text-re2-muted text-xs mb-2">模式</p>
              <div className="flex gap-2">
                <button
                  onClick={() => useMapStore.getState().setMode('normal')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().mode === 'normal'
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-re2-subtle/30 text-re2-muted border border-transparent hover:bg-re2-subtle/50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  普通
                </button>
                <button
                  onClick={() => useMapStore.getState().setMode('expert')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().mode === 'expert'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-re2-subtle/30 text-re2-muted border border-transparent hover:bg-re2-subtle/50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  专家
                </button>
                <button
                  onClick={() => useMapStore.getState().setMode('both')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    useMapStore.getState().mode === 'both'
                      ? 'bg-purple-50 text-purple-600 border border-purple-200'
                      : 'bg-re2-subtle/30 text-re2-muted border border-transparent hover:bg-re2-subtle/50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  共有
                </button>
              </div>
            </div>

            {/* 确认按钮 */}
            <button
              onClick={() => {
                const state = useMapStore.getState()
                const marker: CustomMarker = {
                  id: `custom_${Date.now()}`,
                  name: pendingMarker.name,
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
              className="w-full py-2.5 px-4 bg-re2-accent hover:bg-re2-accent/80 text-white rounded-lg font-medium transition-colors shadow-soft hover:shadow-card"
            >
              确认添加
            </button>
          </div>
        </div>
      )}

      {/* 标点详情弹窗 */}
      {selectedMarkerId && (
        (() => {
          const marker = customMarkers.find(m => m.id === selectedMarkerId)
          if (!marker) return null
          return (
            <div
              className={`absolute z-50 backdrop-blur-md rounded-xl shadow-lifted overflow-hidden ${
                character === 'leon'
                  ? 'bg-blue-200/90 border border-blue-400/60'
                  : character === 'claire'
                  ? 'bg-red-200/90 border border-red-400/60'
                  : 'bg-white/95 border border-gray-200'
              }`}
              style={{
                left: popupPos.x,
                top: popupPos.y,
                width: '320px',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement
                if (target.tagName === 'BUTTON' || target.closest('button')) return
                popupDragging.current = true
                popupDragStart.current = { x: e.clientX, y: e.clientY }
                popupPosStart.current = { x: popupPos.x, y: popupPos.y }
              }}
            >
              {/* 关闭按钮 */}
              <div className="flex justify-end px-4 pt-3">
                <button
                  onClick={() => setSelectedMarkerId(null)}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
              {/* 主标题：图标 + 名称 */}
              <div className="flex items-center gap-3 px-5 pb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={marker.icon} alt="" className="w-7 h-7 object-contain" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-500 text-xs">{marker.category}</span>
                  <span className="text-gray-800 text-base font-semibold">{marker.name}</span>
                </div>
              </div>
              {/* 描述 */}
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-gray-400 text-xs">描述</span>
                  {marker.description ? (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{marker.description}</p>
                  ) : (
                    <span className="text-gray-400 text-sm">无</span>
                  )}
                </div>
              </div>
              {/* 截图 */}
              {marker.screenshots && marker.screenshots.length > 0 && (
                <div className="px-5 pb-5">
                  <span className="text-gray-400 text-xs">截图</span>
                  <div className="space-y-2 mt-1.5">
                    {marker.screenshots.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`截图 ${idx + 1}`}
                        className="w-full h-auto rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()
      )}

      {/* 编辑模式下的编辑弹窗 */}
      {editingMarker && (
        <MarkerEditModal
          pendingMarker={{
            name: editingMarker.marker.name,
            category: editingMarker.marker.category,
            icon: editingMarker.marker.icon,
            coordinates: editingMarker.marker.coordinates,
            character: editingMarker.marker.character as 'leon' | 'claire' | 'both',
            mode: editingMarker.marker.mode as 'normal' | 'expert' | 'both',
          }}
          position={editingMarker.position}
          isEditing={true}
          initialDescription={editingMarker.marker.description || ''}
          initialScreenshots={editingMarker.marker.screenshots || []}
          onConfirm={(description, screenshots) => {
            useMapStore.getState().updateCustomMarker(editingMarker.marker.id, {
              description,
              screenshots,
            })
            setEditingMarker(null)
          }}
          onCancel={() => setEditingMarker(null)}
          onDelete={() => {
            useMapStore.getState().removeCustomMarker(editingMarker.marker.id)
            setEditingMarker(null)
          }}
        />
      )}
    </div>
  )
}
