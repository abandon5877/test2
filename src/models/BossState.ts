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
  // 翠绿叶子Boss: 是否已卖出小丑牌
  jokerSold: boolean;
  // 深红之心Boss: 当前禁用的小丑位置
  disabledJokerIndex: number | null;
  // 天青铃铛Boss: 必须选择的卡牌ID
  requiredCardId: string | null;
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
  private jokerSold: boolean = false;
  private disabledJokerIndex: number | null = null;
  private requiredCardId: string | null = null;

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
   * @param handType 牌型
   * @param currentHandLevel 当前牌型等级（用于检查是否已降到1级）
   * @returns 是否成功增加了降低值
   */
  increaseHandLevelReduction(handType: PokerHandType, currentHandLevel?: number): boolean {
    const currentReduction = this.handLevelsReduced.get(handType) || 0;
    
    // 如果提供了当前等级，检查降低后是否会低于1级
    if (currentHandLevel !== undefined) {
      const effectiveLevel = Math.max(1, currentHandLevel - currentReduction);
      if (effectiveLevel <= 1) {
        // 已经降到1级，不再继续降低
        return false;
      }
    }
    
    this.handLevelsReduced.set(handType, currentReduction + 1);
    return true;
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
    this.jokerSold = false;
    this.disabledJokerIndex = null;
    this.requiredCardId = null;
  }

  /**
   * 设置禁用的小丑位置（深红之心Boss）
   */
  setDisabledJokerIndex(index: number): void {
    this.disabledJokerIndex = index;
    logger.info('Crimson Heart disabled joker', { index });
  }

  /**
   * 获取禁用的小丑位置（深红之心Boss）
   */
  getDisabledJokerIndex(): number | null {
    return this.disabledJokerIndex;
  }

  /**
   * 设置必须选择的卡牌ID（天青铃铛Boss）
   */
  setRequiredCardId(cardId: string): void {
    this.requiredCardId = cardId;
    logger.info('Cerulean Bell required card', { cardId });
  }

  /**
   * 获取必须选择的卡牌ID（天青铃铛Boss）
   */
  getRequiredCardId(): string | null {
    return this.requiredCardId;
  }

  /**
   * 标记已卖出小丑牌（翠绿叶子Boss）
   */
  markJokerSold(): void {
    this.jokerSold = true;
    logger.info('Joker sold for Verdant Leaf boss');
  }

  /**
   * 检查是否已卖出小丑牌（翠绿叶子Boss）
   */
  hasJokerSold(): boolean {
    return this.jokerSold;
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
      handPlayCounts: Object.fromEntries(this.handPlayCounts),
      jokerSold: this.jokerSold,
      disabledJokerIndex: this.disabledJokerIndex,
      requiredCardId: this.requiredCardId
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
    this.jokerSold = state.jokerSold ?? false;
    this.disabledJokerIndex = state.disabledJokerIndex ?? null;
    this.requiredCardId = state.requiredCardId ?? null;
    logger.info('Boss state restored', { bossType: this.currentBoss });
  }
}
