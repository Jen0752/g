// 资源预加载工具

// 图片加载缓存
const imageCache = new Set<string>()

// 正在加载的图片 Promise 缓存，避免重复请求
const loadingPromises = new Map<string, Promise<void>>()

export function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src)) {
    return Promise.resolve()
  }

  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!
  }

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      imageCache.add(src)
      loadingPromises.delete(src)
      resolve()
    }
    img.onerror = () => {
      loadingPromises.delete(src)
      resolve() // 即使加载失败也不阻塞
    }
    img.src = src
  })

  loadingPromises.set(src, promise)
  return promise
}

// 批量预加载图片，带并发限制
export async function preloadImages(
  urls: string[],
  concurrency = 5
): Promise<void> {
  const chunks: string[][] = []
  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency))
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(src => preloadImage(src)))
  }
}

// 清理缓存（仅在内存紧张时调用）
export function clearImageCache(): void {
  imageCache.clear()
  loadingPromises.clear()
}

// 楼层图片缓存（MapLibre 图片源）
const floorImageCache = new Set<string>()

// 预加载楼层图片（利用浏览器缓存）
export function preloadFloorImage(src: string): void {
  if (floorImageCache.has(src)) return
  floorImageCache.add(src)
  const img = new Image()
  img.src = src
}

// 预加载所有楼层图片
export function preloadAllFloorImages(imageMap: Record<string, string>): void {
  Object.values(imageMap).forEach(src => preloadFloorImage(src))
}