import { useState, useRef, useEffect } from 'react'
import { type PendingMarkerBase } from '../stores/useMapStore'

interface Props {
  pendingMarker: PendingMarkerBase
  position: { x: number; y: number }
  onConfirm: (description: string, screenshots: string[]) => void
  onCancel: () => void
  // 编辑模式专用
  isEditing?: boolean
  initialDescription?: string
  initialScreenshots?: string[]
  onDelete?: () => void
}

export default function MarkerEditModal({
  pendingMarker,
  position,
  onConfirm,
  onCancel,
  isEditing = false,
  initialDescription = '',
  initialScreenshots = [],
  onDelete,
}: Props) {
  const [description, setDescription] = useState(initialDescription)
  const [screenshots, setScreenshots] = useState<string[]>(initialScreenshots)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pos, setPos] = useState({ x: position.x, y: position.y })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const posStart = useRef({ x: 0, y: 0 })

  const popupWidth = 320
  const popupHeight = 480
  const padding = 16

  // 计算初始位置：智能判断弹窗显示在标点上方还是下方
  const getInitialPos = () => {
    const spaceBelow = window.innerHeight - position.y
    const spaceAbove = position.y

    let x = position.x - popupWidth / 2
    let y: number

    if (spaceBelow >= popupHeight + 20 || spaceBelow > spaceAbove) {
      // 放下方
      y = position.y + 10
    } else {
      // 上方
      y = position.y - popupHeight - 10
    }

    // 边界限制
    x = Math.max(padding, Math.min(x, window.innerWidth - popupWidth - padding))
    y = Math.max(padding, Math.min(y, window.innerHeight - popupHeight - padding))

    return { x, y }
  }

  useEffect(() => {
    setPos(getInitialPos())
  }, [position])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y

      let newX = posStart.current.x + dx
      let newY = posStart.current.y + dy

      newX = Math.max(padding, Math.min(newX, window.innerWidth - popupWidth - padding))
      newY = Math.max(padding, Math.min(newY, window.innerHeight - popupHeight - padding))

      setPos({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'BUTTON' || target.closest('button')) return

    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    posStart.current = { x: pos.x, y: pos.y }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setScreenshots(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    onConfirm(description, screenshots)
  }

  return (
    <div
      className="absolute z-50 bg-re2-dark/95 border border-gray-600 rounded-lg shadow-2xl overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: popupWidth, maxHeight: '80vh' }}
    >
      {/* 可拖动的头部 */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-600 bg-gray-800/50 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="text-white font-medium text-sm">{isEditing ? '编辑标点' : '编辑标点信息'}</span>
        <button
          onClick={onCancel}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
        >
          ×
        </button>
      </div>

      <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
            <img src={pendingMarker.icon} alt="" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{pendingMarker.name}</p>
            <p className="text-gray-400 text-xs mt-1">
              {pendingMarker.character === 'leon' ? '里昂线' : pendingMarker.character === 'claire' ? '克莱尔线' : '双线'} /
              {pendingMarker.mode === 'normal' ? '普通' : '专家'}模式
            </p>
          </div>
        </div>

        {/* 道具名称 */}
        <div className="mb-4">
          <p className="text-gray-400 text-xs mb-2">道具名称</p>
          <input
            type="text"
            defaultValue={pendingMarker.name}
            className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:border-re2-accent focus:outline-none"
            placeholder="输入道具名称"
          />
        </div>

        <div className="mb-4">
          <p className="text-gray-400 text-xs mb-2">道具描述（支持 Markdown）</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入道具描述..."
            className="w-full h-24 px-3 py-2 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:border-re2-accent focus:outline-none resize-none"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs">相关截图</p>
            <span className="text-gray-500 text-xs">{screenshots.length} 张</span>
          </div>

          {screenshots.length > 0 && (
            <div className="space-y-2 mb-2">
              {screenshots.map((src, index) => (
                <div key={index} className="relative group">
                  <img src={src} alt={`截图 ${index + 1}`} className="w-full h-auto rounded border border-gray-600" />
                  <button
                    onClick={() => removeScreenshot(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 bg-gray-800 text-gray-300 text-sm rounded border border-dashed border-gray-600 hover:border-re2-accent hover:text-white transition-colors"
          >
            + 添加截图
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="px-3 py-2 border-t border-gray-600 bg-gray-800/50">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={onDelete}
              className="flex-1 py-2 px-4 bg-red-600/80 hover:bg-red-600 text-white rounded font-medium transition-colors"
            >
              删除标点
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 px-4 bg-re2-accent hover:bg-re2-accent/80 text-white rounded font-medium transition-colors"
            >
              保存修改
            </button>
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            className="w-full py-2 px-4 bg-re2-accent hover:bg-re2-accent/80 text-white rounded font-medium transition-colors"
          >
            确认添加
          </button>
        )}
      </div>
    </div>
  )
}