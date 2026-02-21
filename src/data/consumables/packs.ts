/**
 * 扩展包数据（15种）
 * 按照官方规则，扩展包分为5种类型，每种类型有3种尺寸
 */

export type PackType = 'standard' | 'arcana' | 'celestial' | 'buffoon' | 'spectral';
export type PackSize = 'normal' | 'jumbo' | 'mega';

export interface BoosterPack {
  id: string;
  type: PackType;
  size: PackSize;
  name: string;
  description: string;
  cost: number;
  choices: number;      // 展示的卡牌数量
  selectCount: number;  // 可以选择的卡牌数量
}

/**
 * 15种扩展包定义
 */
export const BOOSTER_PACKS: BoosterPack[] = [
  // Standard Packs - 游戏牌
  { id: 'pack_standard_normal', type: 'standard', size: 'normal', name: '标准卡包', description: '从最多3张游戏牌中选择1张', cost: 4, choices: 3, selectCount: 1 },
  { id: 'pack_standard_jumbo', type: 'standard', size: 'jumbo', name: '巨型标准卡包', description: '从最多5张游戏牌中选择1张', cost: 6, choices: 5, selectCount: 1 },
  { id: 'pack_standard_mega', type: 'standard', size: 'mega', name: '超级标准卡包', description: '从最多5张游戏牌中选择2张', cost: 8, choices: 5, selectCount: 2 },

  // Arcana Packs - 塔罗牌
  { id: 'pack_arcana_normal', type: 'arcana', size: 'normal', name: '秘术卡包', description: '从最多3张塔罗牌中选择1张', cost: 4, choices: 3, selectCount: 1 },
  { id: 'pack_arcana_jumbo', type: 'arcana', size: 'jumbo', name: '巨型秘术卡包', description: '从最多5张塔罗牌中选择1张', cost: 6, choices: 5, selectCount: 1 },
  { id: 'pack_arcana_mega', type: 'arcana', size: 'mega', name: '超级秘术卡包', description: '从最多5张塔罗牌中选择2张', cost: 8, choices: 5, selectCount: 2 },

  // Celestial Packs - 星球牌
  { id: 'pack_celestial_normal', type: 'celestial', size: 'normal', name: '天体卡包', description: '从最多3张星球牌中选择1张', cost: 4, choices: 3, selectCount: 1 },
  { id: 'pack_celestial_jumbo', type: 'celestial', size: 'jumbo', name: '巨型天体卡包', description: '从最多5张星球牌中选择1张', cost: 6, choices: 5, selectCount: 1 },
  { id: 'pack_celestial_mega', type: 'celestial', size: 'mega', name: '超级天体卡包', description: '从最多5张星球牌中选择2张', cost: 8, choices: 5, selectCount: 2 },

  // Buffoon Packs - 小丑牌
  { id: 'pack_buffoon_normal', type: 'buffoon', size: 'normal', name: '小丑卡包', description: '从最多2张小丑牌中选择1张', cost: 4, choices: 2, selectCount: 1 },
  { id: 'pack_buffoon_jumbo', type: 'buffoon', size: 'jumbo', name: '巨型小丑卡包', description: '从最多4张小丑牌中选择1张', cost: 6, choices: 4, selectCount: 1 },
  { id: 'pack_buffoon_mega', type: 'buffoon', size: 'mega', name: '超级小丑卡包', description: '从最多4张小丑牌中选择2张', cost: 8, choices: 4, selectCount: 2 },

  // Spectral Packs - 幻灵牌
  { id: 'pack_spectral_normal', type: 'spectral', size: 'normal', name: '幻灵卡包', description: '从最多2张幻灵牌中选择1张', cost: 4, choices: 2, selectCount: 1 },
  { id: 'pack_spectral_jumbo', type: 'spectral', size: 'jumbo', name: '巨型幻灵卡包', description: '从最多4张幻灵牌中选择1张', cost: 6, choices: 4, selectCount: 1 },
  { id: 'pack_spectral_mega', type: 'spectral', size: 'mega', name: '超级幻灵卡包', description: '从最多4张幻灵牌中选择2张', cost: 8, choices: 4, selectCount: 2 }
];

/**
 * 卡包出现权重
 */
export const PACK_WEIGHTS: Record<PackType, Record<PackSize, number>> = {
  standard: { normal: 4, jumbo: 2, mega: 0.5 },
  arcana: { normal: 4, jumbo: 2, mega: 0.5 },
  celestial: { normal: 4, jumbo: 2, mega: 0.5 },
  buffoon: { normal: 1.2, jumbo: 0.6, mega: 0.15 },
  spectral: { normal: 0.6, jumbo: 0.3, mega: 0.07 }
};

/**
 * 根据ID获取扩展包
 */
export function getPackById(id: string): BoosterPack | undefined {
  return BOOSTER_PACKS.find(pack => pack.id === id);
}

/**
 * 根据类型获取扩展包
 */
export function getPacksByType(type: PackType): BoosterPack[] {
  return BOOSTER_PACKS.filter(pack => pack.type === type);
}

/**
 * 获取所有扩展包
 */
export function getAllPacks(): BoosterPack[] {
  return [...BOOSTER_PACKS];
}

/**
 * 获取随机扩展包（按权重）
 */
export function getRandomPack(): BoosterPack {
  const totalWeight = Object.values(PACK_WEIGHTS).reduce(
    (sum, weights) => sum + Object.values(weights).reduce((a, b) => a + b, 0),
    0
  );
  
  let random = Math.random() * totalWeight;
  
  for (const pack of BOOSTER_PACKS) {
    const weight = PACK_WEIGHTS[pack.type][pack.size];
    random -= weight;
    if (random <= 0) {
      return pack;
    }
  }
  
  return BOOSTER_PACKS[0];
}

/**
 * 获取多个随机扩展包
 */
export function getRandomPacks(count: number): BoosterPack[] {
  const packs: BoosterPack[] = [];
  for (let i = 0; i < count; i++) {
    packs.push(getRandomPack());
  }
  return packs;
}

/**
 * 扩展包统计信息
 */
export const PACK_STATS = {
  total: BOOSTER_PACKS.length,
  byType: {
    standard: BOOSTER_PACKS.filter(p => p.type === 'standard').length,
    arcana: BOOSTER_PACKS.filter(p => p.type === 'arcana').length,
    celestial: BOOSTER_PACKS.filter(p => p.type === 'celestial').length,
    buffoon: BOOSTER_PACKS.filter(p => p.type === 'buffoon').length,
    spectral: BOOSTER_PACKS.filter(p => p.type === 'spectral').length
  },
  bySize: {
    normal: BOOSTER_PACKS.filter(p => p.size === 'normal').length,
    jumbo: BOOSTER_PACKS.filter(p => p.size === 'jumbo').length,
    mega: BOOSTER_PACKS.filter(p => p.size === 'mega').length
  }
};
