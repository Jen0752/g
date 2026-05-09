# 项目记忆索引

## 用户信息
- [user_role.md](user_role.md) - 用户角色和偏好

## 经验教训
- [bug_marker_position_offset.md](bug_marker_position_offset.md) - 标点位置偏移 Bug 经验总结

## 项目状态
- [project_state.md](project_state.md) - 当前项目开发状态
- [project_progress.md](project_progress.md) - 最近更新进度总结

---

# RE2 Sewer Map (d:\re2_sewer_map)

A React + TypeScript + MapLibre GL JS interactive map for Resident Evil 2 sewers.

## Recent Changes (2026-05-08)

**移动端优化 (已完成):**
- React.lazy() 懒加载 RouteEditor
- Icon组件提取到 Icons.tsx
- Zustand selector 合并优化
- useMemo memoization
- CSS hover 媒体查询优化

**标点交互修复:**
- 只有编辑模式才能拖动标点
- 弹窗背景色跟随人物线（里昂=蓝色，克莱尔=深红色）

**资源补充:**
- B2o 楼层图片
- gunpowder 类图标

**网站图标:**
- 64x64 WebP 格式 favicon.webp

## 技术栈
- React + TypeScript + Vite
- MapLibre GL JS
- Zustand (状态管理)
- Tailwind CSS

## 关键文件
- `src/components/Map.tsx` - 地图主组件
- `src/components/RouteEditor.tsx` - 路线编辑面板
- `src/components/RoutePanel.tsx` - 路线选择面板
- `src/components/Toolbar.tsx` - 工具栏
- `src/components/FilterPanel.tsx` - 筛选面板
- `src/stores/useMapStore.ts` - Zustand store
- `src/data/markers.ts` - 标点分类数据
- `src/data/categoryIds.ts` - 所有子分类 ID 列表

## 待优化
- 打包文件过大（1MB+），可考虑代码分割