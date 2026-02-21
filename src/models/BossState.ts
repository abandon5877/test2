import { BossType } from '../types/game';
import { PokerHandType } from '../types/pokerHands';
import type { Card } from './Card';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('BossState');

/**
 * Boss状态接口
 */
export interface BossStateInterface {
  currentBoss: BossType | null;
  playedHandTypes: PokerHandType[];
  firstHandPlayed: boolean;
  handLevelsReduced: Record<string, number>;
  cardsPlayedThisAnte: string[];
  mostPlayedHand: PokerHandType | null;
  handPlayCounts: Record<string, number>;
}

/**
 * Boss状态类
 * 负责管理Boss的状态（当前Boss、已出牌型、等级降低等）
 */
export class BossState {
  private currentBoss: BossType | null = null;
  private playedHandTypes: Set<PokerHandType> = new Set();
  private firstHandPlayed: boolean = false;
  private handLevelsReduced: Map<PokerHandType, number> = new Map();
  private cardsPlayedThisAnte: Set<string> = new Set();
  private mostPlayedHand: PokerHandType | null = null;
  private handPlayCounts: Map<PokerHandType, number> = new Map();

  /**
   * 设置当前Boss
   */
  setBoss(bossType: BossType | undefined): void {
    this.currentBoss = bossType || null;
    this.playedHandTypes.clear();
    this.firstHandPlayed = false;
    this.cardsPlayedThisAnte.clear();
    logger.info('Boss set', { bossType });
  }

  /**
   * 清除当前Boss
   */
  clearBoss(): void {
    this.currentBoss = null;
    this.playedHandTypes.clear();
    this.firstHandPlayed = false;
    this.cardsPlayedThisAnte.clear();
    logger.info('Boss cleared');
  }

  /**
   * 获取当前Boss
   */
  getCurrentBoss(): BossType | null {
    return this.currentBoss;
  }

  /**
   * 记录已出牌型
   */
  recordPlayedHandType(handType: PokerHandType): void {
    this.playedHandTypes.add(handType);
  }

  /**
   * 检查是否已出牌型
   */
  hasPlayedHandType(handType: PokerHandType): boolean {
    return this.playedHandTypes.has(handType);
  }

  /**
   * 获取已出牌型数量
   */
  getPlayedHandTypesCount(): number {
    return this.playedHandTypes.size;
  }

  /**
   * 设置第一手牌已打出
   */
  setFirstHandPlayed(): void {
    this.firstHandPlayed = true;
  }

  /**
   * 检查第一手牌是否已打出
   */
  isFirstHandPlayed(): boolean {
    return this.firstHandPlayed;
  }

  /**
   * 增加牌型等级降低
   */
  increaseHandLevelReduction(handType: PokerHandType): void {
    const current = this.handLevelsReduced.get(handType) || 0;
    this.handLevelsReduced.set(handType, current + 1);
  }

  /**
   * 获取牌型等级降低
   */
  getHandLevelReduction(handType: PokerHandType): number {
    return this.handLevelsReduced.get(handType) || 0;
  }

  /**
   * 重置牌型等级降低
   */
  resetHandLevelReduction(): void {
    this.handLevelsReduced.clear();
  }

  /**
   * 记录本底注出过的牌
   */
  recordCardPlayed(card: Card): void {
    this.cardsPlayedThisAnte.add(card.toString());
  }

  /**
   * 检查牌是否在本底注出过
   */
  hasCardBeenPlayed(card: Card): boolean {
    return this.cardsPlayedThisAnte.has(card.toString());
  }

  /**
   * 记录牌型出牌次数
   */
  recordHandPlayCount(handType: PokerHandType): void {
    const current = this.handPlayCounts.get(handType) || 0;
    this.handPlayCounts.set(handType, current + 1);

    // 更新最常用牌型
    let maxCount = 0;
    for (const [type, count] of this.handPlayCounts) {
      if (count > maxCount) {
        maxCount = count;
        this.mostPlayedHand = type as PokerHandType;
      }
    }
  }

  /**
   * 获取最常用牌型
   */
  getMostPlayedHand(): PokerHandType | null {
    return this.mostPlayedHand;
  }

  /**
   * 检查是否是最常用牌型
   */
  isMostPlayedHand(handType: PokerHandType): boolean {
    return this.mostPlayedHand === handType;
  }

  /**
   * 回合结束重置
   */
  onRoundEnd(): void {
    // 重置眼睛Boss和嘴Boss的记录
    if (this.currentBoss === BossType.EYE || this.currentBoss === BossType.MOUTH) {
      this.playedHandTypes.clear();
    }
    this.firstHandPlayed = false;
  }

  /**
   * 新底注开始
   */
  onNewAnte(): void {
    this.cardsPlayedThisAnte.clear();
    this.handPlayCounts.clear();
    this.mostPlayedHand = null;
  }

  /**
   * 获取状态（用于存档）
   */
  getState(): BossStateInterface {
    return {
      currentBoss: this.currentBoss,
      playedHandTypes: Array.from(this.playedHandTypes),
      firstHandPlayed: this.firstHandPlayed,
      handLevelsReduced: Object.fromEntries(this.handLevelsReduced),
      cardsPlayedThisAnte: Array.from(this.cardsPlayedThisAnte),
      mostPlayedHand: this.mostPlayedHand,
      handPlayCounts: Object.fromEntries(this.handPlayCounts)
    };
  }

  /**
   * 恢复状态（用于读档）
   */
  restoreState(state: BossStateInterface): void {
    this.currentBoss = state.currentBoss;
    this.playedHandTypes = new Set(state.playedHandTypes);
    this.firstHandPlayed = state.firstHandPlayed;
    this.handLevelsReduced = new Map(Object.entries(state.handLevelsReduced).map(([k, v]) => [k as unknown as PokerHandType, v]));
    this.cardsPlayedThisAnte = new Set(state.cardsPlayedThisAnte);
    this.mostPlayedHand = state.mostPlayedHand;
    this.handPlayCounts = new Map(Object.entries(state.handPlayCounts).map(([k, v]) => [k as unknown as PokerHandType, v]));
    logger.info('Boss state restored', { bossType: this.currentBoss });
  }
}
