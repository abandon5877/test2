import { JokerInterface } from '../types/joker';
import { Joker } from './Joker';

export interface JokerSlotsState {
  jokers: JokerInterface[];
  maxSlots: number;
  interestCapBonus: number;
}

export class JokerSlots {
  private jokers: JokerInterface[];
  private maxSlots: number;
  private interestCapBonus: number;

  constructor(maxSlots: number = 5) {
    this.jokers = [];
    this.maxSlots = maxSlots;
    this.interestCapBonus = 0;
  }

  /**
   * 随机禁用一个小丑（深红之心Boss效果）
   * 禁用状态跟随小丑牌本身，不跟随位置
   */
  disableRandomJoker(): number | null {
    if (this.jokers.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.jokers.length);
    this.jokers[randomIndex].disabled = true;
    return randomIndex;
  }

  /**
   * 清除所有小丑的禁用状态（回合结束或新盲注）
   */
  clearAllDisabled(): void {
    for (const joker of this.jokers) {
      joker.disabled = false;
    }
  }

  /**
   * 获取被禁用的小丑索引（用于显示）
   */
  getDisabledJokerIndex(): number | null {
    const index = this.jokers.findIndex(j => j.disabled);
    return index >= 0 ? index : null;
  }

  /**
   * 翻面所有小丑牌（琥珀橡果Boss效果）
   */
  flipAllJokers(): void {
    for (const joker of this.jokers) {
      joker.faceDown = !joker.faceDown;
    }
  }

  /**
   * 设置所有小丑牌的翻面状态
   */
  setAllJokersFaceDown(faceDown: boolean): void {
    for (const joker of this.jokers) {
      joker.faceDown = faceDown;
    }
  }

  /**
   * 洗牌（琥珀橡果Boss效果）
   */
  shuffleJokers(): void {
    for (let i = this.jokers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.jokers[i], this.jokers[j]] = [this.jokers[j], this.jokers[i]];
    }
  }

  /**
   * 检查是否有翻面的小丑牌
   */
  hasFaceDownJokers(): boolean {
    return this.jokers.some(j => j.faceDown);
  }

  addJoker(joker: JokerInterface): boolean {
    if (this.jokers.length >= this.maxSlots) {
      return false;
    }
    this.jokers.push(joker);

    return true;
  }

  removeJoker(index: number): JokerInterface | null {
    if (index < 0 || index >= this.jokers.length) {
      return null;
    }
    const removed = this.jokers.splice(index, 1)[0];

    if (removed.id === 'interest_bonus') {
      this.interestCapBonus = Math.max(0, this.interestCapBonus - 1);
    }

    return removed;
  }

  moveJoker(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.jokers.length) {
      return false;
    }
    if (toIndex < 0 || toIndex >= this.jokers.length) {
      return false;
    }
    if (fromIndex === toIndex) {
      return true;
    }

    const [movedJoker] = this.jokers.splice(fromIndex, 1);
    this.jokers.splice(toIndex, 0, movedJoker);
    return true;
  }

  swapJokers(index1: number, index2: number): boolean {
    if (index1 < 0 || index1 >= this.jokers.length) {
      return false;
    }
    if (index2 < 0 || index2 >= this.jokers.length) {
      return false;
    }
    if (index1 === index2) {
      return true;
    }

    [this.jokers[index1], this.jokers[index2]] = [this.jokers[index2], this.jokers[index1]];
    return true;
  }

  /**
   * 获取所有小丑（包括被禁用的）
   * 深红之心Boss: 禁用的小丑仍然显示，但效果不生效
   */
  getJokers(): readonly JokerInterface[] {
    return [...this.jokers];
  }

  /**
   * 获取生效的小丑（排除被禁用的）
   * 用于JokerSystem计算效果
   */
  getActiveJokers(): readonly JokerInterface[] {
    return this.jokers.filter(j => !j.disabled);
  }

  getJokerCount(): number {
    return this.jokers.length;
  }

  getAvailableSlots(): number {
    return this.maxSlots - this.jokers.length;
  }

  getMaxSlots(): number {
    return this.maxSlots;
  }

  increaseMaxSlots(amount: number): void {
    this.maxSlots += amount;
  }

  getInterestCapBonus(): number {
    return this.interestCapBonus;
  }

  clear(): void {
    this.jokers = [];
    this.interestCapBonus = 0;
  }

  getState(): JokerSlotsState {
    return {
      jokers: this.jokers.map(j => j.clone()),
      maxSlots: this.maxSlots,
      interestCapBonus: this.interestCapBonus
    };
  }

  restoreState(state: JokerSlotsState): void {
    this.jokers = state.jokers.map(j => j.clone());
    this.maxSlots = state.maxSlots;
    this.interestCapBonus = state.interestCapBonus;
  }

  // 获取带贴纸的小丑
  getJokersWithStickers(): { joker: JokerInterface; index: number }[] {
    return this.jokers
      .map((joker, index) => ({ joker, index }))
      .filter(({ joker }) => joker.sticker !== 'none');
  }

  // 处理回合结束时的贴纸效果
  processEndOfRoundStickers(): { destroyedJokers: number[]; rentalCost: number } {
    const destroyedJokers: number[] = [];
    let rentalCost = 0;

    for (let i = this.jokers.length - 1; i >= 0; i--) {
      const joker = this.jokers[i];

      if (joker.sticker === 'perishable') {
        const shouldDestroy = joker.decrementPerishable();
        if (shouldDestroy) {
          destroyedJokers.push(i);
          this.removeJoker(i);
        }
      }

      if (joker.sticker === 'rental') {
        rentalCost += joker.getRentalCost();
      }
    }

    return { destroyedJokers, rentalCost };
  }

  // 更新行星牌使用计数
  updatePlanetCardCount(): void {
    for (const joker of this.jokers) {
      if (joker.id === 'constellation') {
        const currentCount = joker.state.planetCardsUsed || 0;
        joker.updateState({ planetCardsUsed: currentCount + 1 });
      }
    }
  }

  // 更新塔罗牌使用计数
  updateTarotCardCount(): void {
    for (const joker of this.jokers) {
      if (joker.id === 'fortune_teller') {
        const currentCount = joker.state.tarotCardsUsed || 0;
        joker.updateState({ tarotCardsUsed: currentCount + 1 });
      }
    }
  }

  // 更新跳过盲注计数
  updateBlindsSkipped(): void {
    for (const joker of this.jokers) {
      if (joker.id === 'throwback') {
        const currentCount = joker.state.blindsSkipped || 0;
        joker.updateState({ blindsSkipped: currentCount + 1 });
      }
    }
  }
}
