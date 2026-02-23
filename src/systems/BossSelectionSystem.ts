import { BossType } from '../types/game';
import { BossSystem } from './BossSystem';
import type { BossSelectionState } from '../models/BossSelectionState';
import { createModuleLogger } from '../utils/logger';
import { getBossAssignments, setBossAssignments, getBossBlindConfig } from '../data/blinds';

const logger = createModuleLogger('BossSelectionSystem');

export interface BossSelectionResult {
  bossType: BossType;
  isFinisher: boolean;
}

export interface BossRerollResult {
  success: boolean;
  oldBoss?: BossType;
  newBoss?: BossType;
  message: string;
}

/**
 * Boss选择系统
 * 负责处理Boss选择的逻辑
 * 所有方法为静态方法，BossSelectionState作为参数传入
 */
export class BossSelectionSystem {
  // ==================== 静态方法 ====================

  /**
   * Ante 1允许的Boss列表（官方规定只有8个）
   */
  private static readonly ANTE1_ALLOWED_BOSSES: BossType[] = [
    BossType.HOOK,      // 钩子
    BossType.MANACLE,   // 手铐
    BossType.CLUB,      // 梅花
    BossType.GOAD,      // 刺棒
    BossType.HEAD,      // 头
    BossType.WINDOW,    // 窗户
    BossType.PSYCHIC,   // 通灵
    BossType.PILLAR     // 柱子
  ];

  /**
   * 获取所有可用的Boss类型
   */
  private static getAvailableBosses(
    bossSelectionState: BossSelectionState,
    ante: number,
    isFinisher: boolean
  ): BossType[] {
    const allBosses = Object.values(BossType);

    return allBosses.filter(bossType => {
      const config = BossSystem.getBossConfig(bossType);

      // 检查是否已经出现过了
      if (bossSelectionState.hasBossAppeared(bossType)) {
        return false;
      }

      // 检查最低底注要求
      if (config.minAnte > ante) {
        return false;
      }

      // Ante 1的特殊限制：只有8个Boss可选
      if (ante === 1 && !this.ANTE1_ALLOWED_BOSSES.includes(bossType)) {
        return false;
      }

      // 终结者Boss只在底注8、16、24...出现
      const isBossFinisher = bossSelectionState.isFinisherBoss(bossType);
      if (isFinisher && !isBossFinisher) {
        return false;
      }
      if (!isFinisher && isBossFinisher) {
        return false;
      }

      return true;
    });
  }

  /**
   * 随机选择一个Boss
   */
  static selectBoss(
    bossSelectionState: BossSelectionState,
    ante: number
  ): BossSelectionResult {
    bossSelectionState.setCurrentAnte(ante);
    const isFinisher = bossSelectionState.isFinisherAnte();

    let availableBosses = BossSelectionSystem.getAvailableBosses(
      bossSelectionState,
      ante,
      isFinisher
    );

    // 如果没有可用的Boss，重置记录
    if (availableBosses.length === 0) {
      logger.info('所有符合条件的Boss都已出现，重置记录', { ante, isFinisher });
      // 构建minAnteMap
      const minAnteMap = new Map<BossType, number>();
      for (const bossType of Object.values(BossType)) {
        const config = BossSystem.getBossConfig(bossType);
        minAnteMap.set(bossType, config.minAnte);
      }
      bossSelectionState.resetAppearedBosses(minAnteMap);
      availableBosses = BossSelectionSystem.getAvailableBosses(
        bossSelectionState,
        ante,
        isFinisher
      );
    }

    // 如果还是没有可用的，说明有问题
    if (availableBosses.length === 0) {
      logger.error('没有可用的Boss', { ante, isFinisher });
      throw new Error(`没有可用的Boss for ante ${ante}`);
    }

    // 随机选择
    const randomIndex = Math.floor(Math.random() * availableBosses.length);
    const selectedBoss = availableBosses[randomIndex];

    // 记录已出现
    bossSelectionState.recordBossAppeared(selectedBoss);

    logger.info('Boss selected', {
      ante,
      bossType: selectedBoss,
      isFinisher,
      availableCount: availableBosses.length,
      appearedCount: bossSelectionState.getAppearedBosses().length
    });

    return {
      bossType: selectedBoss,
      isFinisher
    };
  }

  /**
   * 获取指定底注的所有可能Boss
   */
  static getPossibleBossesForAnte(
    bossSelectionState: BossSelectionState,
    ante: number
  ): BossType[] {
    const isFinisher = ante % 8 === 0;
    return BossSelectionSystem.getAvailableBosses(
      bossSelectionState,
      ante,
      isFinisher
    );
  }

  /**
   * 检查Boss是否已经出现过了
   */
  static hasBossAppeared(
    bossSelectionState: BossSelectionState,
    bossType: BossType
  ): boolean {
    return bossSelectionState.hasBossAppeared(bossType);
  }

  /**
   * 获取已出现的Boss列表
   */
  static getAppearedBosses(bossSelectionState: BossSelectionState): BossType[] {
    return bossSelectionState.getAppearedBosses();
  }

  /**
   * 手动设置已出现的Boss
   */
  static setAppearedBosses(
    bossSelectionState: BossSelectionState,
    bosses: BossType[]
  ): void {
    bossSelectionState.setAppearedBosses(bosses);
  }

  /**
   * 重置整个系统
   */
  static reset(bossSelectionState: BossSelectionState): void {
    bossSelectionState.reset();
  }

  /**
   * 获取当前底注
   */
  static getCurrentAnte(bossSelectionState: BossSelectionState): number {
    return bossSelectionState.getCurrentAnte();
  }

  /**
   * 获取Boss选择统计信息
   */
  static getStats(bossSelectionState: BossSelectionState): {
    appearedCount: number;
    totalBosses: number;
    remainingForCurrentAnte: number;
  } {
    const currentAnte = bossSelectionState.getCurrentAnte();
    const isFinisher = bossSelectionState.isFinisherAnte();
    const available = BossSelectionSystem.getAvailableBosses(
      bossSelectionState,
      currentAnte,
      isFinisher
    );

    return {
      appearedCount: bossSelectionState.getAppearedBosses().length,
      totalBosses: Object.values(BossType).length,
      remainingForCurrentAnte: available.length
    };
  }

  /**
   * 重掷当前底注的Boss盲注
   * @param bossSelectionState Boss选择状态
   * @param ante 当前底注
   * @returns 重掷结果
   */
  static rerollBoss(
    bossSelectionState: BossSelectionState,
    ante: number
  ): BossRerollResult {
    const currentConfig = getBossBlindConfig(ante);
    const oldBoss = currentConfig?.bossType;

    if (!oldBoss) {
      logger.warn('Cannot reroll: no boss blind for current ante', { ante });
      return {
        success: false,
        message: '当前底注没有Boss盲注'
      };
    }

    // 获取当前Boss分配
    const assignments = getBossAssignments();

    // 将当前Boss从已出现列表中移除（这样它可能被再次选中）
    // 但保留在appearedBosses中，因为我们只是重掷，不是重新开始

    // 获取可用的Boss列表（排除当前Boss）
    bossSelectionState.setCurrentAnte(ante);
    const isFinisher = bossSelectionState.isFinisherAnte();
    let availableBosses = BossSelectionSystem.getAvailableBosses(
      bossSelectionState,
      ante,
      isFinisher
    ).filter(boss => boss !== oldBoss);

    // 如果没有其他可用Boss，允许重新选择当前Boss
    if (availableBosses.length === 0) {
      availableBosses = BossSelectionSystem.getAvailableBosses(
        bossSelectionState,
        ante,
        isFinisher
      );
    }

    if (availableBosses.length === 0) {
      logger.error('No available bosses for reroll', { ante });
      return {
        success: false,
        message: '没有可用的Boss进行重掷'
      };
    }

    // 随机选择新Boss
    const randomIndex = Math.floor(Math.random() * availableBosses.length);
    const newBoss = availableBosses[randomIndex];

    // 更新Boss分配
    assignments.set(ante, newBoss);
    setBossAssignments(assignments);

    // 记录新Boss已出现
    bossSelectionState.recordBossAppeared(newBoss);

    // 增加重掷次数
    bossSelectionState.incrementBossRerollCount();

    logger.info('Boss rerolled', {
      ante,
      oldBoss,
      newBoss,
      rerollCount: bossSelectionState.getBossRerollCount()
    });

    return {
      success: true,
      oldBoss,
      newBoss,
      message: `Boss已重掷: ${BossSystem.getBossConfig(oldBoss).name} → ${BossSystem.getBossConfig(newBoss).name}`
    };
  }

  /**
   * 检查是否可以重掷Boss
   * @param bossSelectionState Boss选择状态
   * @param hasDirectorsCutVoucher 是否拥有导演剪辑版优惠券
   */
  static canRerollBoss(
    bossSelectionState: BossSelectionState,
    hasDirectorsCutVoucher: boolean
  ): boolean {
    return bossSelectionState.canRerollBoss(hasDirectorsCutVoucher);
  }

  /**
   * 获取剩余重掷次数
   * @param bossSelectionState Boss选择状态
   * @param hasDirectorsCutVoucher 是否拥有导演剪辑版优惠券
   */
  static getRemainingRerolls(
    bossSelectionState: BossSelectionState,
    hasDirectorsCutVoucher: boolean
  ): number {
    if (bossSelectionState.hasUnlimitedReroll()) {
      return Infinity;
    }
    if (!hasDirectorsCutVoucher) {
      return 0;
    }
    return Math.max(0, 1 - bossSelectionState.getBossRerollCount());
  }
}
