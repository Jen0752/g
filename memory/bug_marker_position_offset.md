---
name: bug_marker_position_offset
description: MapLibre Marker 标点位置偏移 - 根本原因是 CSS position: relative 干扰了 anchor 定位计算
type: bug_fix
---

# 标点位置偏移 Bug 经验总结

## Bug 现象
点击地图位置后，标点图标出现在视觉位置上向下偏移的位置。

## 根本原因
Marker wrapper 元素上设置了 `position: relative`，干扰了 MapLibre 的 `anchor: 'bottom'` 定位计算。

**关键代码** (Map.tsx):
```typescript
wrapper.style.cssText = `
  width: 36px;
  height: 42px;
  cursor: grab;
  position: relative;  // ← 罪魁祸首
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
  z-index: ${10 + index};
`
```

## 排查过程

### 1. 日志对比屏幕坐标
通过 `map.project(coords)` 对比点击位置和标点位置的屏幕坐标：
```
CLICK: {screenX: '558.0', screenY: '284.0'}
MARKER: {screenX: '558.0', screenY: '284.0'}
```
屏幕坐标完全一致 → 证明坐标存储是正确的

### 2. 缩小范围
- 屏幕坐标一致 + 视觉位置偏移 → 问题在渲染层
- 屏幕坐标不一致 → 问题在坐标转换

### 3. 逐层 CSS 审查
发现 wrapper 上的 `position: relative` 改变了定位上下文，导致 MapLibre Marker 的 anchor 计算出错。

## 修复方案
移除 wrapper 上的 `position: relative`。

**修复后代码**:
```typescript
wrapper.style.cssText = `
  width: 36px;
  height: 42px;
  cursor: grab;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
  z-index: ${10 + index};
`
```

## 经验教训

### 核心原则
**MapLibre Marker 的 anchor 定位依赖正常文档流**，CSS `position: relative/absolute` 会干扰其计算。

### 调试方法
用 `map.project()` 对比屏幕坐标：
- 如果屏幕坐标一致但视觉位置不对 → 问题在渲染（CSS/定位）
- 如果屏幕坐标不一致 → 问题在坐标转换逻辑

### 涉及文件
- `src/components/Map.tsx` - 标点渲染逻辑
  - 第 257 行：marker wrapper 样式定义
  - 第 381 行：Marker 创建和 setLngLat

### 相关技术栈
- MapLibre GL JS (native, not react-map-gl)
- 自定义 SVG teardrop marker shape
- anchor: 'bottom' 定位模式
