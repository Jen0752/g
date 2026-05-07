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
- Vite (构建工具)

## 核心功能
- [x] 楼层图片切换显示 (B3/B2/B2o/B1o/B1/1F/2F/3F)
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
- [x] 人物线筛选（里昂/克莱尔/共有）
- [x] 模式筛选（普通/专家/共有）

## 部署方式
- GitHub Pages：仓库 Settings → Pages → Source 选 `main` 分支 + `/docs` 文件夹
- 构建命令：`npm run build`，输出到 `docs/` 目录
- Vite 配置：`base: './'`，使用环境变量区分开发/生产路径

## 路径处理（重要）
```typescript
// Map.tsx - 根据环境决定路径前缀
const BASE_PATH = import.meta.env.PROD ? './' : '/'
const FLOOR_IMAGES = {
  'B3': `${BASE_PATH}re2_map_sewer/re2_sewer_B3.png`,
  // ...
}
```
- 开发环境 (`npm run dev`)：使用 `/` 前缀
- 生产环境 (`npm run build`)：使用 `./` 相对路径

## 已知 Bug 修复
- [x] **标点位置偏移 Bug**：移除 wrapper 上的 `position: relative`
- [x] **路线删除后不隐藏 Bug**：清理地图图层时检查 visibleRouteIds
- [x] **编辑模式切换 Bug**：Toolbar 按钮逻辑错误 `!isEditingMarkers` → `!isEditingRoutes`
- [x] **路线可见性依赖 Bug**：useEffect 添加 `editingRouteId` 和 `activeRoutes` 依赖
- [x] **GitHub Pages 资源 404 Bug**：图片路径从绝对路径改为相对路径/环境判断路径
- [x] **TypeScript 类型错误**：setCharacter/setMode 参数类型添加 `'both'`

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
public/
├── re2_map_sewer/       - 楼层背景图片（已压缩）
└── re2_map_sewer_ui/   - UI 图标资源
docs/                   - GitHub Pages 部署目录
map save/              - 楼层图片备份（原图）
```

## 状态管理 (useMapStore)
- `character`: Character | 'both' - 当前人物线
- `mode`: GameMode | 'both' - 当前模式
- `isEditingMarkers`: 标点编辑模式
- `isEditingRoutes`: 路线编辑模式
- `editingRouteId`: 当前编辑的路线 ID
- `activeRoutes`: Set<string> 选中的路线（用于显示）
- `routes: Route[]`: 所有路线数据
- `customMarkers`: 自定义标点数组

## UI/UX 优化
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
- [x] 人物/模式选择弹窗未选中状态文字颜色加深（text-re2-dark → text-gray-700）
- [x] 道具选择弹窗固定在收起按钮下方（absolute right-0 top-full mt-2）
- [x] 路线编辑器弹窗：宽度缩小至 w-60，高度缩小至 h-[60vh]，添加右侧圆角 rounded-r-xl
- [x] 颜色选择按钮：添加 flex-shrink-0 使用 flex-wrap 防止超出宽度
- [x] 点击放置标点按钮时关闭其他弹窗（人物/模式/楼层选择）

## GitHub 仓库
- 仓库地址：https://github.com/Jen0752/g
- 部署地址：https://Jen0752.github.io/g/
- 分支：main
- 部署方式：GitHub Pages (docs 目录)

## 资源优化
- [x] 楼层图片压缩：8张图从 ~13MB 压缩至 ~600KB（减少96%）
- 原始图片备份在 `map save/` 目录

## 待完成功能
- [ ] 路线显示开关（目前需要退出编辑才显示）
- [ ] 更多标点分类
- [ ] B2o 楼层标点数据

## 新增道具（bullet 类别）
- [x] 火药 (gunpoweder.png)
- [x] 火药（大）(gunpowder（big）.png)
- [x] 高级火药 (advanced gunpowder.png)