import type { MarkerItem } from '../stores/useMapStore'

export const FLOOR_ORDER = ['3F', '2F', '1F', 'B1', 'B1o', 'B2', 'B2o', 'B3'] as const

export interface SubCategory {
  id: string
  name: string
  icon: string
}

export const CATEGORIES: Array<{ id: string; name: string; icon: string; subCategories: SubCategory[] }> = [
  {
    id: 'bullet',
    name: '弹药',
    icon: '1_bullet.png',
    subCategories: [
      { id: 'acid bomb', name: '酸弹', icon: 'acid bomb.png' },
      { id: 'fire bomb', name: '火弹', icon: 'fire bomb.png' },
      { id: 'magnum bullet', name: '马格南子弹', icon: 'magnum bullet.png' },
      { id: 'pistol bullets', name: '手枪子弹', icon: 'pistol bullets.png' },
      { id: 'shotgun bullet', name: '霰弹', icon: 'shotgun bullet.png' },
      { id: 'submachine gun bullets', name: '冲锋枪子弹', icon: 'submachine gun bullets.png' },
      { id: 'gunpowder', name: '火药', icon: 'gunpoweder.png' },
      { id: 'gunpowder big', name: '火药（大）', icon: 'gunpowder（big）.png' },
      { id: 'advanced gunpowder', name: '高级火药', icon: 'advanced gunpowder.png' },
    ],
  },
  {
    id: 'checkpoint',
    name: '存档点',
    icon: '1_Checkpoint.png',
    subCategories: [
      { id: 'lnk ribbon', name: '墨带', icon: 'lnk ribbon.png' },
      { id: 'typewriter', name: '打字机', icon: 'typewriter.png' },
    ],
  },
  {
    id: 'collection',
    name: '收集品',
    icon: '1_collection.png',
    subCategories: [
      { id: 'Fanny pack', name: '腰包', icon: 'Fanny pack.png' },
      { id: 'document', name: '文件', icon: 'document.png' },
      { id: 'locked container', name: '锁闭容器', icon: 'locked container.png' },
      { id: 'map', name: '地图', icon: 'map.png' },
      { id: 'raccoon toy', name: '浣熊玩具', icon: 'raccoon toy.png' },
    ],
  },
  {
    id: 'door',
    name: '门',
    icon: '1_door.png',
    subCategories: [
      { id: 'keygate', name: '钥匙门', icon: 'keygate.png' },
    ],
  },
  {
    id: 'enemy',
    name: '敌人',
    icon: '1_enemy.png',
    subCategories: [
      { id: 'enemy', name: '普通敌人', icon: 'enemy.png' },
      { id: 'mutated enemy', name: '变异敌人', icon: 'mutated enemy.png' },
    ],
  },
  {
    id: 'medicine',
    name: '药品',
    icon: '1_medicine.png',
    subCategories: [
      { id: 'blue grass', name: '蓝草', icon: 'blue grass.png' },
      { id: 'first aid spray', name: '急救喷雾', icon: 'first aid spray.png' },
      { id: 'green grass', name: '绿草', icon: 'green grass.png' },
      { id: 'red grass', name: '红草', icon: 'red grass.png' },
    ],
  },
  {
    id: 'projectile',
    name: '投掷物',
    icon: '1_projectile.png',
    subCategories: [
      { id: 'dagger', name: '飞刀', icon: 'dagger.png' },
      { id: 'flashbang', name: '闪光弹', icon: 'flashbang.png' },
      { id: 'grenade', name: '手雷', icon: 'grenade.png' },
    ],
  },
  {
    id: 'puzzle item',
    name: '谜题道具',
    icon: '1_Puzzle Item.png',
    subCategories: [
      { id: 'important props', name: '重要道具', icon: 'important props.png' },
      { id: 'key', name: '钥匙', icon: 'key.png' },
    ],
  },
  {
    id: 'tip',
    name: '提示',
    icon: '1_tips.png',
    subCategories: [
      { id: 'guidance tips', name: '引导提示', icon: 'guidance tips.png' },
      { id: 'mechanisms', name: '机关', icon: 'mechanisms.png' },
      { id: 'street sign', name: '路标', icon: 'street sign.png' },
    ],
  },
  {
    id: 'weapon',
    name: '武器',
    icon: '1_weapon.png',
    subCategories: [
      { id: 'Weapon accessories', name: '武器配件', icon: 'Weapon accessories.png' },
      { id: 'Weapon', name: '武器', icon: 'Weapon.png' },
    ],
  },
]

// 示例标点数据 (坐标为相对位置 0-1)
export const SAMPLE_MARKERS: MarkerItem[] = [
  // B1 楼层 - 弹药
  {
    id: 'bullet_1',
    name: '手枪弹药',
    category: 'bullet',
    character: 'both',
    mode: 'both',
    coordinates: [0.3, 0.4],
  },
  {
    id: 'bullet_2',
    name: '霰弹枪弹药',
    category: 'bullet',
    character: 'leon',
    mode: 'both',
    coordinates: [0.5, 0.3],
  },
  // B1 楼层 - 存档点
  {
    id: 'checkpoint_1',
    name: '打字机',
    category: 'checkpoint',
    character: 'both',
    mode: 'both',
    coordinates: [0.4, 0.5],
  },
  // B1 楼层 - 门
  {
    id: 'door_1',
    name: '铁门',
    category: 'door',
    character: 'both',
    mode: 'both',
    coordinates: [0.6, 0.4],
  },
  // B1 楼层 - 敌人
  {
    id: 'enemy_1',
    name: 'G第一形态',
    category: 'enemy',
    character: 'both',
    mode: 'expert',
    coordinates: [0.7, 0.3],
  },
  // B2 楼层 - 药品
  {
    id: 'medicine_1',
    name: '红草',
    category: 'medicine',
    character: 'both',
    mode: 'both',
    coordinates: [0.35, 0.45],
  },
  {
    id: 'medicine_2',
    name: '蓝草',
    category: 'medicine',
    character: 'both',
    mode: 'both',
    coordinates: [0.45, 0.55],
  },
  // B2 楼层 - 武器
  {
    id: 'weapon_1',
    name: '霰弹枪',
    category: 'weapon',
    character: 'leon',
    mode: 'normal',
    coordinates: [0.55, 0.4],
  },
  // 1F 楼层 - 收集品
  {
    id: 'collection_1',
    name: '文件',
    category: 'collection',
    character: 'both',
    mode: 'both',
    coordinates: [0.4, 0.35],
  },
  // 2F 楼层 - 投掷物
  {
    id: 'projectile_1',
    name: '闪光弹',
    category: 'projectile',
    character: 'both',
    mode: 'both',
    coordinates: [0.5, 0.45],
  },
]