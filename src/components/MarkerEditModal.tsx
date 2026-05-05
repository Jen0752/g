import { useState, useRef, useEffect } from 'react'
import { type PendingMarkerBase } from '../stores/useMapStore'

interface Props {
  pendingMarker: PendingMarkerBase
  position: { x: number; y: number }
  onConfirm: (description: string, screenshots: string[]) => void
  onCancel: () => void
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

  const popupWidth = 280
  const popupHeight = 420
  const padding = 16

  const getInitialPos = () => {
    const spaceBelow = window.innerHeight - position.y
    const spaceAbove = position.y

    let x = position.x - popupWidth / 2
    let y: number

    if (spaceBelow >= popupHeight + 20 || spaceBelow > spaceAbove) {
      y = position.y + 10
    } else {
      y = position.y - popupHeight - 10
    }

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
      className="absolute z-50 bg-orange-200/80 backdrop-blur-md border border-orange-200/80 rounded-xl shadow-lifted overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: popupWidth, maxHeight: '80vh' }}
    >
      {/* 可拖动的头部 */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-re2-subtle bg-re2-subtle/30 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="text-gray-700 font-medium text-sm">{isEditing ? '编辑标点' : '编辑标点信息'}</span>
        <button
          onClick={onCancel}
          className="w-6 h-6 flex items-center justify-center text-re2-muted hover:text-gray-700 hover:bg-re2-subtle rounded-btn transition-colors"
        >
          ×
        </button>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-re2-subtle/50 rounded-xl flex items-center justify-center overflow-hidden shadow-soft">
            <img src={pendingMarker.icon} alt="" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <p className="text-gray-700 text-sm font-medium">{pendingMarker.name}</p>
            <p className="text-re2-muted text-xs mt-1">
              {pendingMarker.character === 'leon' ? '里昂线' : pendingMarker.character === 'claire' ? '克莱尔线' : '双线'} /
              {pendingMarker.mode === 'normal' ? '普通' : '专家'}模式
            </p>
          </div>
        </div>

        {/* 道具名称 */}
        <div className="mb-4">
          <p className="text-gray-500 text-xs mb-1.5">道具名称</p>
          <input
            type="text"
            defaultValue={pendingMarker.name}
            className="w-full px-3 py-2.5 bg-re2-subtle/30 text-gray-700 text-sm rounded-lg border border-re2-subtle focus:border-re2-accent focus:outline-none transition-colors"
            placeholder="输入道具名称"
          />
        </div>

        <div className="mb-4">
          <p className="text-re2-muted text-xs mb-1.5">道具描述（支持 Markdown）</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入道具描述..."
            className="w-full h-20 px-3 py-2.5 bg-re2-subtle/30 text-gray-700 text-sm rounded-lg border border-re2-subtle focus:border-re2-accent focus:outline-none resize-none transition-colors"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-re2-muted text-xs">相关截图</p>
            <span className="text-re2-muted text-xs">{screenshots.length} 张</span>
          </div>

          {screenshots.length > 0 && (
            <div className="space-y-2 mb-2">
              {screenshots.map((src, index) => (
                <div key={index} className="relative group">
                  <img src={src} alt={`截图 ${index + 1}`} className="w-full h-auto rounded-lg border border-re2-subtle shadow-soft" />
                  <button
                    onClick={() => removeScreenshot(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-white/90 text-red-500 text-xs rounded-full shadow-soft opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 bg-re2-subtle/30 text-re2-muted text-sm rounded-lg border-2 border-dashed border-re2-subtle hover:border-re2-accent hover:text-gray-700 transition-colors"
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

      <div className="px-4 py-3 border-t border-re2-subtle bg-re2-subtle/20">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={onDelete}
              className="flex-1 py-2.5 px-4 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              删除标点
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 bg-re2-accent text-white rounded-lg hover:bg-re2-accent/80 transition-colors text-sm font-medium"
            >
              保存修改
            </button>
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            className="w-full py-2.5 px-4 bg-re2-accent text-white rounded-lg hover:bg-re2-accent/80 transition-colors text-sm font-medium"
          >
            确认添加
          </button>
        )}
      </div>
    </div>
  )
}