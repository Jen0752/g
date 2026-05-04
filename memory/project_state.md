---
name: project_state
description: RE2 sewer map 项目当前开发状态
type: project
---

# RE2 Sewer Map 项目开发状态

## 项目概述
移动端友好的交互式 RE2 sewer 地图应用，支持自定义标点放置、管理和路线编辑。

## 技术栈
- React + TypeScript
- Zustand (状态管理)
- MapLibre GL JS (原生，非 react-map-gl)
- Tailwind CSS

## 核心功能
- [x] 楼层图片切换显示 (B3/B2/B1o/B1/1F/2F/3F)
- [x] 自定义标点放置（放置模式 → 点击 → 填写信息 → 确认）
- [x] 标点属性：floor, character, mode, name, description, screenshots
- [x] 标点拖拽移动
- [x] 标点详情弹窗（查看模式）和编辑弹窗（编辑模式）
- [x] 标点导入/导出 JSON
- [x] 当前楼层只显示当前楼层标点
- [x] 筛选功能（按 category 筛选）
- [x] 路线编辑功能（创建/编辑/删除路线）
- [x] 路线导入/导出 JSON
- [x] 工具栏图标更换为 SVG 图标

## 路线编辑功能
- 左侧 RouteEditor 面板（编辑模式时显示）
- 创建路线：名称 + 颜色选择
- 添加路径点：编辑模式下点击地图添加
- 路线显示：需在路线选择面板中勾选才显示
- 导出/导入：JSON 格式

## 已知 Bug 修复
- [x] **标点位置偏移 Bug**：移除 wrapper 上的 `position: relative`
- [x] **路线删除后不隐藏 Bug**：清理地图图层时检查 visibleRouteIds
- [x] **编辑模式切换 Bug**：Toolbar 按钮逻辑错误 `!isEditingMarkers` → `!isEditingRoutes`
- [x] **路线可见性依赖 Bug**：useEffect 添加 `editingRouteId` 和 `activeRoutes` 依赖

## 项目文件结构
```
src/
├── components/
│   ├── Map.tsx          - 地图组件，标点/路线渲染
│   ├── Toolbar.tsx      - 工具栏（筛选/楼层/人物/模式/路线/编辑按钮）
│   ├── MarkerEditModal.tsx  - 标点编辑弹窗（可拖动）
│   ├── FilterPanel.tsx      - 筛选面板
│   ├── RoutePanel.tsx       - 路线选择面板（底部）
│   └── RouteEditor.tsx      - 路线编辑器（左侧）
├── stores/
│   └── useMapStore.ts   - Zustand 状态管理
├── data/
│   └── markers.ts       - 标点分类数据
└── App.tsx
```

## 状态管理 (useMapStore)
- `character`: 'leon' | 'claire' | 'both' - 当前人物线
- `mode`: 'normal' | 'expert' | 'both' - 当前模式
- `isEditingMarkers`: 标点编辑模式
- `isEditingRoutes`: 路线编辑模式
- `editingRouteId`: 当前编辑的路线 ID
- `activeRoutes`: Set<string> 选中的路线（用于显示）
- `routes: Route[]`: 所有路线数据
- `customMarkers`: 自定义标点数组

## UI/UX 优化（2024年完成）
- [x] FilterPanel 改为底部弹窗（50vh高度）
- [x] 工具栏8个按钮各有独特边框颜色匹配图标
- [x] 地图缩放控制移至右下角，自定义样式
- [x] 人物线筛选：里昂线显示里昂+共有，克莱尔线显示克莱尔+共有
- [x] 模式筛选：普通模式显示普通+共有，专家模式显示专家+共有
- [x] 放置标点弹窗默认人物线='both'，模式='both'
- [x] 各弹窗背景颜色与对应按钮边框颜色统一
- [x] 字体颜色加深：text-re2-text → text-gray-700
- [x] 筛选面板选中分类背景加深，未选中添加悬停效果
- [x] 标点详情弹窗改为极简悬浮面板风格（无边界、去分割线）
- [x] 标点详情弹窗添加可拖动功能
- [x] 标点详情弹窗自动调整位置（避免超出屏幕）

## 待完成功能
- [ ] 路线显示开关（目前需要退出编辑才显示）
- [ ] 更多标点分类
