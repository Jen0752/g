---
name: project_state
description: RE2 sewer map 项目当前开发状态
type: project
---

# RE2 Sewer Map 项目开发状态

## 项目概述
移动端友好的交互式 RE2  sewer 地图应用，支持自定义标点放置和管理。

## 技术栈
- React + TypeScript
- Zustand (状态管理)
- MapLibre GL JS (原生，非 react-map-gl)
- Tailwind CSS

## 核心功能
- [x] 楼层图片切换显示 (B3/B2/B1o/B1/1F/2F/3F)
- [x] 自定义标点放置（放置模式 → 点击 → 填写信息 → 确认）
- [x] 标点属性：floor, character, mode
- [x] 标点拖拽移动
- [x] 标点详情弹窗
- [x] 标点导入/导出 JSON
- [x] 当前楼层只显示当前楼层标点

## 已知 Bug 修复
- [x] **标点位置偏移 Bug**：移除 wrapper 上的 `position: relative`，避免干扰 MapLibre Marker anchor 定位

## 项目文件结构
```
src/
├── components/
│   ├── Map.tsx      - 地图组件，标点渲染
│   └── Toolbar.tsx  - 工具栏，标点选择器
├── stores/
│   └── useMapStore.ts - Zustand 状态管理
├── data/
│   └── markers.ts   - 标点分类数据
└── App.tsx
```

## 待完成功能
- 筛选功能（按 character/mode/category 筛选）
- 路线显示功能
- 更多标点分类
