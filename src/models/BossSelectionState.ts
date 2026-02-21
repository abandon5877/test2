import { BossType } from '../types/game';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('BossSelectionState');

/**
 * Boss选择状态接口
 */
export interface BossSelectionStateInterface {
  appearedBosses: BossType[];
  currentAnte: number;
}

/**
 * Boss选择状态类
 * 负责管理Boss选择的状态（已出现Boss、当前底注等）
 */
export class BossSelectionState {
  private appearedBosses: Set<BossType> = new Set();
  private currentAnte: number = 1;

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
    logger.info('Boss selection state reset');
  }

  /**
   * 获取状态（用于存档）
   */
  getState(): BossSelectionStateInterface {
    return {
      appearedBosses: Array.from(this.appearedBosses),
      currentAnte: this.currentAnte
    };
  }

  /**
   * 恢复状态（用于读档）
   */
  restoreState(state: BossSelectionStateInterface): void {
    this.appearedBosses = new Set(state.appearedBosses);
    this.currentAnte = state.currentAnte;
    logger.info('Boss selection state restored', {
      appearedCount: this.appearedBosses.size,
      currentAnte: this.currentAnte
    });
  }
}
