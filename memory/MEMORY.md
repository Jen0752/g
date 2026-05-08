# 项目记忆索引

## 用户信息
- [user_role.md](user_role.md) - 用户角色和偏好

## 经验教训
- [bug_marker_position_offset.md](bug_marker_position_offset.md) - 标点位置偏移 Bug 经验总结

## 项目状态
- [project_state.md](project_state.md) - 当前项目开发状态

---

# RE2 Sewer Map (d:\re2_sewer_map)

A React + TypeScript + MapLibre GL JS interactive map for Resident Evil 2 sewers.

## Recent Changes (2026-05-08)

**路线编辑功能:**
- 每条路线绑定 `floor` 字段，创建时自动设为当前楼层
- 点击不同楼层的路线自动切换到该楼层
- 路线只在对应楼层显示，切换楼层时收起编辑状态
- 路线名称输入添加 `stopPropagation` 防止点击隐藏，Enter 键创建
- 路线列表和选择面板显示楼层标签

**路线选择面板 (RoutePanel):**
- 一行两条路线布局
- 楼层标签可点击：切换到该楼层并选中路线
- 楼层标签增大便于点击

**角色切换:**
- 选择克莱尔时自动切换到 B3 楼层

**标点筛选功能:**
- 筛选逻辑：通过标点 `name` 找到对应子分类 ID，检查 `activeCategories`
- 默认全选所有子分类（新建 `categoryIds.ts` 存储所有子分类 ID）
- 找不到子分类映射的标点默认显示

**Bug 修复:**
- 修复 "Style is not done loading" 错误
- 移除未使用的 `floor` 变量

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