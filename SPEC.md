# RE2 Sewer Map - 互动地图

## 项目概述

移动端优先的 RE2 下水道互动地图，支持道具筛选、角色切换、楼层选择、专家模式、路线规划。

## 技术栈

- **框架**: React 18 + Vite
- **地图**: MapLibre GL JS (开源免费，无需 token)
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **地图组件**: react-map-gl (MapLibre)
- **部署**: Vercel / Netlify

## 功能清单

### 1. 地图显示
- 楼层图片叠加为地图底层（自定义 image layer）
- 支持 7 个楼层：1F, 2F, 3F, B1, B1o, B2, B3
- 视野内标点过滤优化

### 2. 角色选择
- Leon / Claire 两个角色
- 不同角色显示不同标点

### 3. 道具筛选
- 分类：bullet, checkpoint, collection, door, enemy, medicine, projectile, puzzle item, tip, weapon
- 点击分类显示/隐藏该类型标点
- 每个分类有独立图标

### 4. 楼层选择
- 切换显示不同楼层地图
- 当前楼层高亮

### 5. 模式切换
- 普通模式 / 专家模式
- 不同模式标点有区别

### 6. 路线选择
- 预设路线选择
- 显示/隐藏路线

### 7. 地图标点
- 点击地图添加自定义标点
- 选择道具图标作为标记

## 数据结构

### 道具标点 (GeoJSON)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      "properties": {
        "id": "item_1",
        "name": "handgun bullets",
        "category": "bullet",
        "character": "both",
        "mode": "normal"
      }
    }
  ]
}
```

### 分类定义
| 分类 | 中文 | 图标 |
|------|------|------|
| bullet | 弹药 | 1_bullet.png |
| checkpoint | 存档点 | 1_Checkpoint.png |
| collection | 收集品 | 1_collection.png |
| door | 门 | 1_door.png |
| enemy | 敌人 | 1_enemy.png |
| medicine | 药品 | 1_medicine.png |
| projectile | 投掷物 | 1_projectile.png |
| puzzle item | 谜题道具 | - |
| tip | 提示 | - |
| weapon | 武器 | - |

## UI 布局

```
┌─────────────────────────────┐
│  [角色] [筛选] [楼层] [模式]  │  ← 顶部工具栏
├─────────────────────────────┤
│                             │
│                             │
│         地图区域             │
│                             │
│                             │
├─────────────────────────────┤
│  ← 路线选择 →               │  ← 底部路线栏（可选）
└─────────────────────────────┘
```

## 移动端优化

- 触摸友好的按钮尺寸 (min 44x44px)
- 底部工具栏，单手操作
- 视野内标点按需渲染
- 防误触的点击区域
- 禁用双击缩放

## 素材路径

- 楼层图片: `/re2_map_sewer/re2_sewer_{floor}.png`
- UI 图标: `/re2_map_sewer_ui/loot ping/{category}/{icon}.png`
- 分类图标: `/re2_map_sewer_ui/loot ping/{category}/1_{category}.png`
