import { PokerHandType, HAND_BASE_VALUES } from '../types/pokerHands';
import { PLANET_CARDS } from '../data/planetCards';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('HandLevelState');

export interface HandLevel {
  level: number;
  totalChipBonus: number;
  totalMultBonus: number;
}

export interface HandLevelStateInterface {
  handLevels: Record<PokerHandType, HandLevel>;
}

/**
 * 牌型等级状态类
 * 负责管理牌型等级的状态
 */
export class HandLevelState {
  private handLevels: Map<PokerHandType, HandLevel> = new Map();

  constructor() {
    // 初始化所有牌型等级为1级
    Object.values(PokerHandType).forEach(handType => {
      this.handLevels.set(handType, {
        level: 1,
        totalChipBonus: 0,
        totalMultBonus: 0
      });
    });
    logger.info('HandLevelState initialized');
  }

  /**
   * 升级指定牌型
   */
  upgradeHand(handType: PokerHandType): HandLevel {
    const currentLevel = this.handLevels.get(handType);
    if (!currentLevel) {
      throw new Error(`Unknown hand type: ${handType}`);
    }

    const planetCard = PLANET_CARDS[handType];
    if (!planetCard) {
      throw new Error(`No planet card for hand type: ${handType}`);
    }

    const newLevel: HandLevel = {
      level: currentLevel.level + 1,
      totalChipBonus: currentLevel.totalChipBonus + planetCard.chipBonus,
      totalMultBonus: currentLevel.totalMultBonus + planetCard.multBonus
    };

    this.handLevels.set(handType, newLevel);
    logger.info('Hand upgraded', { handType, newLevel });
    return newLevel;
  }

  /**
   * 获取牌型等级信息
   */
  getHandLevel(handType: PokerHandType): HandLevel {
    const level = this.handLevels.get(handType);
    if (!level) {
      return { level: 1, totalChipBonus: 0, totalMultBonus: 0 };
    }
    return level;
  }

  /**
   * 获取升级后的牌型数值
   */
  getUpgradedHandValue(handType: PokerHandType): { chips: number; multiplier: number } {
    const baseValue = HAND_BASE_VALUES[handType];
    const level = this.getHandLevel(handType);

    return {
      chips: baseValue.chips + level.totalChipBonus,
      multiplier: baseValue.multiplier + level.totalMultBonus
    };
  }

  /**
   * 获取所有牌型等级
   */
  getAllHandLevels(): Map<PokerHandType, HandLevel> {
    return new Map(this.handLevels);
  }

  /**
   * 升级所有牌型1级（黑洞牌效果）
   */
  upgradeAll(): void {
    Object.values(PokerHandType).forEach(handType => {
      this.upgradeHand(handType);
    });
    logger.info('All hand levels upgraded');
  }

  /**
   * 重置所有等级
   */
  reset(): void {
    Object.values(PokerHandType).forEach(handType => {
      this.handLevels.set(handType, {
        level: 1,
        totalChipBonus: 0,
        totalMultBonus: 0
      });
    });
    logger.info('Hand levels reset');
  }

  /**
   * 获取状态（用于存档）
   */
  getState(): HandLevelStateInterface {
    const result: Partial<Record<PokerHandType, HandLevel>> = {};
    this.handLevels.forEach((level, handType) => {
      result[handType] = level;
    });
    return { handLevels: result as Record<PokerHandType, HandLevel> };
  }

  /**
   * 恢复状态（用于读档）
   */
  restoreState(state: HandLevelStateInterface): void {
    Object.entries(state.handLevels).forEach(([handType, level]) => {
      this.handLevels.set(handType as PokerHandType, level);
    });
    logger.info('Hand levels restored');
  }
}
