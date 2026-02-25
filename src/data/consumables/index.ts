/**
 * 消耗品数据统一导出
 * 按照最初方案文档的要求，将消耗品按类型分离到不同文件
 */

// ==================== 类型定义 ====================
export type {
  ConsumableData,
  TarotData,
  PlanetData,
  SpectralData,
  ConsumableDataType
} from './types';

// ==================== 通用工具函数 ====================
// 工具函数通过上面的统一导出函数间接使用，不直接导出

// ==================== 塔罗牌数据（22张）====================
export {
  TAROT_CARDS,
  TAROT_CONSUMABLES,
  getTarotById,
  getRandomTarots,
  getRandomTarot
} from './tarot';

// ==================== 星球牌数据（12张）====================
export {
  PLANET_CARDS,
  getPlanetCardByHandType,
  getPlanetConsumableByHandType,
  getAllPlanetCards,
  PLANET_CONSUMABLES,
  getPlanetById,
  getRandomPlanets,
  getRandomPlanet
} from './planets';

// ==================== 幻灵牌数据（19张）====================
export {
  SPECTRAL_CONSUMABLES,
  getSpectralById,
  getRandomSpectrals,
  getRandomSpectral
} from './spectral';

// ==================== 扩展包数据（15种）====================
export type { PackType, PackSize, BoosterPack } from './packs';
export {
  BOOSTER_PACKS,
  PACK_WEIGHTS,
  getPackById,
  getPacksByType,
  getAllPacks,
  getRandomPack,
  getRandomPacks,
  PACK_STATS
} from './packs';

// ==================== 优惠券数据（32张，16对）====================
export type { Voucher, VoucherPair } from './vouchers';
export {
  VOUCHER_PAIRS,
  VOUCHERS,
  getVoucherById,
  getVoucherPair,
  getBaseVouchers,
  getUpgradedVouchers,
  getAllVouchers,
  getRandomVoucherPair,
  getRandomBaseVoucher,
  isBaseVoucher,
  isUpgradedVoucher,
  getUpgradedVersion,
  getBaseVersion,
  VOUCHER_STATS
} from './vouchers';

// ==================== 统一导出所有消耗品数据 ====================
import { Consumable } from '../../models/Consumable';
import { ConsumableType } from '../../types/consumable';
import { TAROT_CONSUMABLES, getTarotById, getRandomTarots } from './tarot';
import { PLANET_CONSUMABLES, getPlanetById, getRandomPlanets } from './planets';
import { SPECTRAL_CONSUMABLES, getSpectralById } from './spectral';
import { TAROT_CARDS } from './tarot';
import { PLANET_CARDS } from './planets';
import { BOOSTER_PACKS } from './packs';
import { VOUCHERS } from './vouchers';
import { getConsumableById as getConsumableByIdUtil, getRandomConsumables as getRandomConsumablesUtil, getRandomConsumable as getRandomConsumableUtil } from './utils';
import type { ConsumableDataType } from './types';
import type { BoosterPack } from './packs';
import type { Voucher } from './vouchers';

/**
 * 所有消耗品实例（塔罗牌、星球牌、幻灵牌）
 */
export const ALL_CONSUMABLE_INSTANCES: Consumable[] = [
  ...TAROT_CONSUMABLES,
  ...PLANET_CONSUMABLES,
  ...SPECTRAL_CONSUMABLES
];

/**
 * 所有消耗品实例（别名，兼容旧代码）
 */
export const CONSUMABLES = ALL_CONSUMABLE_INSTANCES;

/**
 * 所有消耗品数据（塔罗牌、星球牌）
 * 注意：幻灵牌只有 Consumable 实例，没有独立的数据对象
 */
export const ALL_CONSUMABLES: ConsumableDataType[] = [
  ...TAROT_CARDS,
  ...PLANET_CARDS
];

/**
 * 根据ID获取消耗品实例
 */
export function getConsumableById(id: string): Consumable | undefined {
  return getConsumableByIdUtil(ALL_CONSUMABLE_INSTANCES, id);
}

/**
 * 根据类型获取消耗品实例
 */
export function getConsumablesByType(type: ConsumableType): Consumable[] {
  return ALL_CONSUMABLE_INSTANCES
    .filter(consumable => consumable.type === type)
    .map(c => c.clone() as Consumable);
}

/**
 * 获取随机消耗品实例
 * @param count 数量
 * @param type 可选的类型过滤 ('tarot' | 'planet' | 'spectral')
 */
export function getRandomConsumables(count: number, type?: 'tarot' | 'planet' | 'spectral'): Consumable[] {
  let pool = ALL_CONSUMABLE_INSTANCES;
  if (type) {
    pool = pool.filter(c => c.type === type);
  }
  return getRandomConsumablesUtil(pool, count);
}

/**
 * 获取单张随机消耗品实例
 */
export function getRandomConsumable(): Consumable {
  return getRandomConsumableUtil(ALL_CONSUMABLE_INSTANCES);
}

/**
 * 根据ID获取消耗品数据
 */
export function getConsumableDataById(id: string): ConsumableDataType | undefined {
  return ALL_CONSUMABLES.find(c => c.id === id);
}

/**
 * 获取所有消耗品数据
 */
export function getAllConsumables(): ConsumableDataType[] {
  return [...ALL_CONSUMABLES];
}

/**
 * 获取消耗品总数
 */
export function getConsumableCount(): number {
  return ALL_CONSUMABLES.length;
}

/**
 * 统计信息
 */
export const CONSUMABLE_STATS = {
  consumables: {
    total: ALL_CONSUMABLES.length,
    tarot: TAROT_CARDS.length,
    planet: PLANET_CARDS.length,
    spectral: 0 // 幻灵牌只有 Consumable 实例，没有独立数据对象
  },
  consumableInstances: {
    total: ALL_CONSUMABLE_INSTANCES.length,
    tarot: TAROT_CONSUMABLES.length,
    planet: PLANET_CONSUMABLES.length,
    spectral: SPECTRAL_CONSUMABLES.length
  },
  packs: {
    total: BOOSTER_PACKS.length
  },
  vouchers: {
    total: VOUCHERS.length,
    pairs: VOUCHERS.length / 2
  }
};

/**
 * 获取所有商店物品数据（消耗品、扩展包、优惠券）
 */
export function getAllShopItems(): {
  consumables: ConsumableDataType[];
  packs: BoosterPack[];
  vouchers: Voucher[];
} {
  return {
    consumables: [...ALL_CONSUMABLES],
    packs: [...BOOSTER_PACKS],
    vouchers: [...VOUCHERS]
  };
}
