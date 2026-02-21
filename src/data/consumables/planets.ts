import { ConsumableType, type ConsumableEffectContext, type ConsumableEffectResult } from '../../types/consumable';
import { PokerHandType } from '../../types/pokerHands';
import type { PlanetData } from './types';
import { Consumable } from '../../models/Consumable';
import { getConsumableById, getRandomConsumables, getRandomConsumable } from './utils';

/**
 * 创建星球牌数据
 * 工厂函数，用于创建包含 createUseFunction 的星球牌数据
 */
function createPlanetCard(
  id: string,
  name: string,
  description: string,
  cost: number,
  handType: PokerHandType,
  chipBonus: number,
  multBonus: number
): PlanetData {
  return {
    id,
    name,
    description,
    type: ConsumableType.PLANET,
    cost,
    handType,
    chipBonus,
    multBonus,
    createUseFunction(): (context: ConsumableEffectContext) => ConsumableEffectResult {
      return (): ConsumableEffectResult => ({
        success: true,
        message: `${name}: ${description} (+${chipBonus}筹码, +${multBonus}倍率)`,
        affectedCards: [],
        handTypeUpgrade: handType
      });
    }
  };
}

/**
 * 星球牌数据（12张）
 * 每张星球牌对应一种牌型，用于升级该牌型
 */
export const PLANET_CARDS: PlanetData[] = [
  createPlanetCard(
    'planet_mercury', '水星', '升级对子',
    4, PokerHandType.OnePair, 15, 1
  ),
  createPlanetCard(
    'planet_venus', '金星', '升级三条',
    4, PokerHandType.ThreeOfAKind, 20, 2
  ),
  createPlanetCard(
    'planet_earth', '地球', '升级葫芦',
    4, PokerHandType.FullHouse, 25, 2
  ),
  createPlanetCard(
    'planet_mars', '火星', '升级四条',
    6, PokerHandType.FourOfAKind, 30, 3
  ),
  createPlanetCard(
    'planet_jupiter', '木星', '升级同花',
    5, PokerHandType.Flush, 15, 2
  ),
  createPlanetCard(
    'planet_saturn', '土星', '升级顺子',
    5, PokerHandType.Straight, 30, 3
  ),
  createPlanetCard(
    'planet_uranus', '天王星', '升级两对',
    4, PokerHandType.TwoPair, 20, 1
  ),
  createPlanetCard(
    'planet_neptune', '海王星', '升级同花顺',
    6, PokerHandType.StraightFlush, 40, 4
  ),
  createPlanetCard(
    'planet_pluto', '冥王星', '升级高牌',
    3, PokerHandType.HighCard, 10, 1
  ),
  createPlanetCard(
    'planet_planet_x', '行星X', '升级五条',
    7, PokerHandType.FiveOfAKind, 35, 3
  ),
  createPlanetCard(
    'planet_ceres', '谷神星', '升级同花葫芦',
    7, PokerHandType.FlushHouse, 40, 4
  ),
  createPlanetCard(
    'planet_eris', '阋神星', '升级同花五条',
    7, PokerHandType.FlushFive, 50, 3
  )
];

/**
 * 根据牌型获取对应的星球牌
 */
export function getPlanetCardByHandType(handType: PokerHandType): PlanetData | undefined {
  return PLANET_CARDS.find(card => card.handType === handType);
}

/**
 * 获取所有星球牌
 */
export function getAllPlanetCards(): PlanetData[] {
  return [...PLANET_CARDS];
}

// ==================== Consumable 实例 ====================

/**
 * 星球牌消耗品实例（12张）
 * 使用 PlanetData.createUseFunction() 生成效果逻辑
 */
export const PLANET_CONSUMABLES: Consumable[] = PLANET_CARDS.map(card => new Consumable({
  id: card.id,
  name: card.name,
  description: card.description,
  type: card.type,
  cost: card.cost,
  useCondition: '无特殊条件',
  use: card.createUseFunction()
}));

/**
 * 根据ID获取星球牌
 */
export function getPlanetById(id: string): Consumable | undefined {
  return getConsumableById(PLANET_CONSUMABLES, id);
}

/**
 * 获取随机星球牌
 */
export function getRandomPlanets(count: number): Consumable[] {
  return getRandomConsumables(PLANET_CONSUMABLES, count);
}

/**
 * 获取单张随机星球牌
 */
export function getRandomPlanet(): Consumable {
  return getRandomConsumable(PLANET_CONSUMABLES);
}
