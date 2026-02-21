import { PokerHandType, HAND_BASE_VALUES } from '../types/pokerHands';
import { PLANET_CARDS } from '../data/planetCards';
import type { HandLevelState, HandLevel } from '../models/HandLevelState';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('HandLevelSystem');

/**
 * 牌型等级系统
 * 负责处理牌型等级的计算和升级
 * 所有方法为静态方法，HandLevelState作为参数传入
 */
export class HandLevelSystem {
  /**
   * 升级指定牌型
   */
  static upgradeHand(handLevelState: HandLevelState, handType: PokerHandType): HandLevel {
    return handLevelState.upgradeHand(handType);
  }

  /**
   * 获取牌型等级信息
   */
  static getHandLevel(handLevelState: HandLevelState, handType: PokerHandType): HandLevel {
    return handLevelState.getHandLevel(handType);
  }

  /**
   * 获取升级后的牌型数值
   */
  static getUpgradedHandValue(
    handLevelState: HandLevelState,
    handType: PokerHandType
  ): { chips: number; multiplier: number } {
    return handLevelState.getUpgradedHandValue(handType);
  }

  /**
   * 获取所有牌型等级
   */
  static getAllHandLevels(handLevelState: HandLevelState): Map<PokerHandType, HandLevel> {
    return handLevelState.getAllHandLevels();
  }

  /**
   * 重置所有等级
   */
  static reset(handLevelState: HandLevelState): void {
    handLevelState.reset();
  }

  /**
   * 获取升级所需的行星牌信息
   */
  static getPlanetCardInfo(handType: PokerHandType): {
    name: string;
    chipBonus: number;
    multBonus: number;
  } | null {
    const planetCard = PLANET_CARDS[handType];
    if (!planetCard) {
      return null;
    }
    return {
      name: planetCard.name,
      chipBonus: planetCard.chipBonus,
      multBonus: planetCard.multBonus
    };
  }

  /**
   * 获取牌型基础数值
   */
  static getBaseHandValue(handType: PokerHandType): { chips: number; multiplier: number } {
    return HAND_BASE_VALUES[handType];
  }

  /**
   * 计算升级后的总数值
   */
  static calculateHandValue(
    handLevelState: HandLevelState,
    handType: PokerHandType
  ): {
    baseChips: number;
    baseMultiplier: number;
    chipBonus: number;
    multBonus: number;
    totalChips: number;
    totalMultiplier: number;
  } {
    const baseValue = HAND_BASE_VALUES[handType];
    const level = handLevelState.getHandLevel(handType);

    return {
      baseChips: baseValue.chips,
      baseMultiplier: baseValue.multiplier,
      chipBonus: level.totalChipBonus,
      multBonus: level.totalMultBonus,
      totalChips: baseValue.chips + level.totalChipBonus,
      totalMultiplier: baseValue.multiplier + level.totalMultBonus
    };
  }
}
