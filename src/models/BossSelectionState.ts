import { BossType } from '../types/game';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('BossSelectionState');

/**
 * Boss选择状态接口
 */
export interface BossSelectionStateInterface {
  appearedBosses: BossType[];
  currentAnte: number;
  bossRerollCount: number; // 当前底注已重掷次数
  hasUnlimitedRerolls: boolean; // 是否有无限重掷（导演剪辑版+）
}

/**
 * Boss选择状态类
 * 负责管理Boss选择的状态（已出现Boss、当前底注等）
 */
export class BossSelectionState {
  private appearedBosses: Set<BossType> = new Set();
  private currentAnte: number = 1;
  private bossRerollCount: number = 0; // 当前底注已重掷次数
  private hasUnlimitedRerolls: boolean = false; // 是否有无限重掷（导演剪辑版+）

  /**
   * 记录Boss已出现
   */
  recordBossAppeared(bossType: BossType): void {
    this.appearedBosses.add(bossType);
    logger.info('Boss appeared recorded', { bossType });
  }

  /**
   * 检查Boss是否已出现
   */
  hasBossAppeared(bossType: BossType): boolean {
    return this.appearedBosses.has(bossType);
  }

  /**
   * 获取已出现Boss列表
   */
  getAppearedBosses(): BossType[] {
    return Array.from(this.appearedBosses);
  }

  /**
   * 设置已出现Boss列表（用于存档加载）
   */
  setAppearedBosses(bosses: BossType[]): void {
    this.appearedBosses = new Set(bosses);
    logger.info('Appeared bosses set', { count: bosses.length });
  }

  /**
   * 设置当前底注
   */
  setCurrentAnte(ante: number): void {
    this.currentAnte = ante;
  }

  /**
   * 获取当前底注
   */
  getCurrentAnte(): number {
    return this.currentAnte;
  }

  /**
   * 判断当前底注是否为终结者底注（8的倍数）
   */
  isFinisherAnte(): boolean {
    return this.currentAnte % 8 === 0;
  }

  /**
   * 判断是否为终结者Boss
   */
  isFinisherBoss(bossType: BossType): boolean {
    return [
      BossType.AMBER_ACORN,
      BossType.VERDANT_LEAF,
      BossType.VIOLET_VESSEL,
      BossType.CRIMSON_HEART,
      BossType.CERULEAN_BELL
    ].includes(bossType);
  }

  /**
   * 重置已出现Boss记录（保留当前底注不可用的Boss）
   */
  resetAppearedBosses(minAnteMap: Map<BossType, number>): void {
    const newAppearedSet = new Set<BossType>();

    // 保留那些最低底注要求高于当前底注的Boss
    for (const bossType of this.appearedBosses) {
      const minAnte = minAnteMap.get(bossType) || 1;
      if (minAnte > this.currentAnte) {
        newAppearedSet.add(bossType);
      }
    }

    this.appearedBosses = newAppearedSet;
    logger.info('Reset appeared bosses', { preservedCount: newAppearedSet.size });
  }

  /**
   * 重置整个状态（新游戏开始）
   */
  reset(): void {
    this.appearedBosses.clear();
    this.currentAnte = 1;
    this.bossRerollCount = 0;
    this.hasUnlimitedRerolls = false;
    logger.info('Boss selection state reset');
  }

  /**
   * 获取当前底注已重掷次数
   */
  getBossRerollCount(): number {
    return this.bossRerollCount;
  }

  /**
   * 增加重掷次数
   */
  incrementBossRerollCount(): void {
    this.bossRerollCount++;
    logger.info('Boss reroll count incremented', { count: this.bossRerollCount });
  }

  /**
   * 重置重掷次数（新底注开始时调用）
   */
  resetBossRerollCount(): void {
    this.bossRerollCount = 0;
    logger.info('Boss reroll count reset');
  }

  /**
   * 检查是否可以重掷Boss
   * @param hasDirectorsCutVoucher 是否拥有导演剪辑版优惠券
   */
  canRerollBoss(hasDirectorsCutVoucher: boolean): boolean {
    if (this.hasUnlimitedRerolls) {
      return true;
    }
    if (hasDirectorsCutVoucher) {
      return this.bossRerollCount < 1; // 基础版每底注1次
    }
    return false;
  }

  /**
   * 设置无限重掷（导演剪辑版+）
   */
  setUnlimitedRerolls(unlimited: boolean): void {
    this.hasUnlimitedRerolls = unlimited;
    logger.info('Unlimited rerolls set', { unlimited });
  }

  /**
   * 检查是否有无限重掷
   */
  hasUnlimitedReroll(): boolean {
    return this.hasUnlimitedRerolls;
  }

  /**
   * 获取状态（用于存档）
   */
  getState(): BossSelectionStateInterface {
    return {
      appearedBosses: Array.from(this.appearedBosses),
      currentAnte: this.currentAnte,
      bossRerollCount: this.bossRerollCount,
      hasUnlimitedRerolls: this.hasUnlimitedRerolls
    };
  }

  /**
   * 恢复状态（用于读档）
   */
  restoreState(state: BossSelectionStateInterface): void {
    this.appearedBosses = new Set(state.appearedBosses);
    this.currentAnte = state.currentAnte;
    this.bossRerollCount = state.bossRerollCount ?? 0;
    this.hasUnlimitedRerolls = state.hasUnlimitedRerolls ?? false;
    logger.info('Boss selection state restored', {
      appearedCount: this.appearedBosses.size,
      currentAnte: this.currentAnte,
      bossRerollCount: this.bossRerollCount,
      hasUnlimitedRerolls: this.hasUnlimitedRerolls
    });
  }
}
