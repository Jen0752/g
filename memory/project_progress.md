# RE2 Sewer Map 项目进度总结

## 最近更新 (2026/05/10)

### 1. 移动端楼层地图加载优化 (本次重点)

**问题描述：**
- 移动端首次加载时，楼层地图图片加载极慢
- 切换楼层时，如果不先访问该楼层，地图永远不会加载
- 切换楼层时进度条重复出现（因为 key={floor} 导致组件重建）

**排查过程：**
1. 最初认为问题是 MapLibre image source 只在需要时才加载
2. 添加了预加载所有楼层图片到 MapLibre 缓存的代码
3. 发现切换楼层时仍需等待图片加载
4. 发现 `map.hasImage()` 检查有效，但 source/layer 重建开销大
5. 最后发现根本原因：`App.tsx` 中 `<Map key={floor} />` 导致每次切换楼层组件都重建

**最终解决方案：**
1. 预加载所有楼层图片到 MapLibre 缓存（map.addImage）
2. 切换楼层时用 `source.updateImage()` 复用已有 source/layer
3. 移除 `key={floor}` 避免组件重建
4. 进度条只在首次加载时显示

**修改文件：**
- `src/components/Map.tsx`：
  - map.load 事件中用 Promise.all 预加载所有楼层图片
  - 切换楼层时优先使用 updateImage() 复用
  - 添加 isMapLoading 状态控制进度条
- `src/App.tsx`：
  - 移除 `<Map key={floor} />` 中的 key 属性

### 2. 楼层地图图片压缩

**压缩结果（256色量化）：**
| 文件 | 原始大小 | 压缩后 | 压缩率 |
|------|---------|--------|--------|
| re2_sewer_1F.png | 1.95MB | 203KB | 89.6% |
| re2_sewer_2F.png | 1.46MB | 103KB | 93.0% |
| re2_sewer_3F.png | 1.45MB | 174KB | 88.0% |
| re2_sewer_B1.png | 1.91MB | 177KB | 90.7% |
| re2_sewer_B1o.png | 2.00MB | 186KB | 90.7% |
| re2_sewer_B2.png | 2.22MB | 247KB | 88.9% |
| re2_sewer_B2o.png | 33KB | 31KB | 7.1% |
| re2_sewer_B3.png | 2.13MB | 195KB | 90.8% |
| **总计** | **13MB** | **1.4MB** | **~90%** |

**修改位置：**
- `re2_map_sewer/*.png` - 已压缩
- `public/re2_map_sewer/*.png` - 已更新为压缩版本

### 3. 修复 Source 重复添加 Bug

**错误信息：**
```
Error: Source "floor-image" already exists.
```

**原因：**
map.load 事件触发时存在异步竞态，MapLibre 内部某些操作会触发 style change

**修复：**
```typescript
if (!map.getSource('floor-image')) {
  map.addSource('floor-image', {...})
}
```

### 4. 进度条文字简化

原来显示"加载楼层地图..." → "加载标点..." → "完成"
现在只显示"加载楼层地图..." → "完成"

---

## 历史更新 (2026/05/08)

### 移动端优化
- 代码分割：RouteEditor 使用 React.lazy() 懒加载
- Icon组件：从 Toolbar.tsx 提取 10 个图标组件到 Icons.tsx
- Zustand优化：14个 selector 合并为一次 destructuring
- CSS hover媒体查询优化

### 数据同步
- re2_point_2.0.json → src/data/defaultMarkers.json
- re2_route_1.0.json → src/data/defaultRoutes.json

### 标点交互修复
- 只有编辑模式才能拖动标点
- 弹窗背景色跟随人物线

---

## Git 状态
- 有未提交更改待推送
- 需：git add . && git commit && git push

## 已知问题
- 构建时 chunk size 警告 (>500KB)，但不影响功能