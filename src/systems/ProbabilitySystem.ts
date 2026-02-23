/**
 * 概率系统 - 管理所有概率计算，支持Oops!_All_6s效果
 *
 * Oops!_All_6s效果：每张使所有概率翻倍
 * 例如：1张使50%概率变为100%，2张使50%概率变为200%（上限100%）
 */

import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('ProbabilitySystem');

export interface ProbabilityConfig {
  baseProbability: number;
  oopsAll6sCount?: number;
}

export class ProbabilitySystem {
  private static oopsAll6sCount = 0;
  private static eventLog: Array<{
    baseProbability: number;
    modifiedProbability: number;
    result: boolean;
    timestamp: number;
  }> = [];

  /**
   * 设置Oops!_All_6s的数量
   * @param count Oops!_All_6s小丑牌的数量
   */
  static setOopsAll6sCount(count: number): void {
    this.oopsAll6sCount = Math.max(0, count);
    logger.debug('Oops!_All_6s数量已更新', { count: this.oopsAll6sCount });
  }

  /**
   * 获取当前Oops!_All_6s数量
   */
  static getOopsAll6sCount(): number {
    return this.oopsAll6sCount;
  }

  /**
   * 应用概率修饰器
   * @param baseProbability 基础概率 (0-1)
   * @returns 修饰后的概率 (0-1)
   */
  static apply(baseProbability: number): number {
    if (this.oopsAll6sCount === 0) {
      return Math.min(Math.max(baseProbability, 0), 1);
    }

    // Oops!_All_6s效果：概率翻倍
    const modifiedProbability = baseProbability * Math.pow(2, this.oopsAll6sCount);
    return Math.min(modifiedProbability, 1);
  }

  /**
   * 检查概率是否触发
   * @param baseProbability 基础概率 (0-1)
   * @returns 是否触发
   */
  static check(baseProbability: number): boolean {
    const modifiedProbability = this.apply(baseProbability);
    const result = Math.random() < modifiedProbability;

    // 记录事件
    this.eventLog.push({
      baseProbability,
      modifiedProbability,
      result,
      timestamp: Date.now()
    });

    // 限制日志大小
    if (this.eventLog.length > 1000) {
      this.eventLog.shift();
    }

    logger.debug('概率检查', {
      baseProbability,
      oopsAll6sCount: this.oopsAll6sCount,
      modifiedProbability,
      result
    });

    return result;
  }

  /**
   * 获取修饰后的概率值（不执行检查）
   * @param baseProbability 基础概率
   * @returns 修饰后的概率
   */
  static getModifiedProbability(baseProbability: number): number {
    return this.apply(baseProbability);
  }

  /**
   * 获取事件日志
   */
  static getEventLog(): Array<{
    baseProbability: number;
    modifiedProbability: number;
    result: boolean;
    timestamp: number;
  }> {
    return [...this.eventLog];
  }

  /**
   * 清空事件日志
   */
  static clearEventLog(): void {
    this.eventLog = [];
  }

  /**
   * 重置系统状态
   */
  static reset(): void {
    this.oopsAll6sCount = 0;
    this.eventLog = [];
    logger.debug('概率系统已重置');
  }
}

/**
 * 预定义的概率常量
 */
export const PROBABILITIES = {
  // 小丑牌概率
  BLOODSTONE: 0.5,           // 血石触发概率
  STUNTMAN: 0.25,            // 特技演员触发概率
  SPACE_JOKER: 0.25,         // 太空小丑触发概率
  HALLUCINATION: 0.5,        // 幻觉触发概率
  BUSINESS_CARD: 0.25,       // 名片触发概率
  ROUGH_GEM: 0.25,           // 粗糙宝石触发概率
  VAGABOND: 1 / 6,           // 流浪者触发概率
  EIGHT_BALL: 0.25,          // 8号球触发概率
  RESERVED_PARKING: 0.25,    // 预留停车位触发概率
  CARTOMANCER: 1,            // 纸牌师触发概率（100%，受槽位限制）
  LUCKY_CASH: 0.2,           // 幸运牌获得$20概率
  LUCKY_MULT: 0.2,           // 幸运牌+20倍率概率
  GLASS_DESTROY: 1 / 15,     // 玻璃牌摧毁概率
  GOLD_SEAL: 0.25,           // 金封印触发概率
} as const;

/**
 * 便捷函数：检查血石概率
 */
export function checkBloodstone(oopsAll6sCount?: number): boolean {
  if (oopsAll6sCount !== undefined) {
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);
  }
  return ProbabilitySystem.check(PROBABILITIES.BLOODSTONE);
}

/**
 * 便捷函数：检查特技演员概率
 */
export function checkStuntman(oopsAll6sCount?: number): boolean {
  if (oopsAll6sCount !== undefined) {
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);
  }
  return ProbabilitySystem.check(PROBABILITIES.STUNTMAN);
}

/**
 * 便捷函数：检查太空小丑概率
 */
export function checkSpaceJoker(oopsAll6sCount?: number): boolean {
  if (oopsAll6sCount !== undefined) {
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);
  }
  return ProbabilitySystem.check(PROBABILITIES.SPACE_JOKER);
}

/**
 * 便捷函数：检查幻觉概率
 */
export function checkHallucination(oopsAll6sCount?: number): boolean {
  if (oopsAll6sCount !== undefined) {
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);
  }
  return ProbabilitySystem.check(PROBABILITIES.HALLUCINATION);
}

/**
 * 便捷函数：检查幸运牌获得金钱概率
 */
export function checkLuckyCash(oopsAll6sCount?: number): boolean {
  if (oopsAll6sCount !== undefined) {
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);
  }
  return ProbabilitySystem.check(PROBABILITIES.LUCKY_CASH);
}

/**
 * 便捷函数：检查幸运牌倍率概率
 */
export function checkLuckyMult(oopsAll6sCount?: number): boolean {
  if (oopsAll6sCount !== undefined) {
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);
  }
  return ProbabilitySystem.check(PROBABILITIES.LUCKY_MULT);
}

/**
 * 便捷函数：检查玻璃牌摧毁概率
 */
export function checkGlassDestroy(oopsAll6sCount?: number): boolean {
  if (oopsAll6sCount !== undefined) {
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);
  }
  return ProbabilitySystem.check(PROBABILITIES.GLASS_DESTROY);
}
