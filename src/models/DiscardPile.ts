import { Card } from './Card';

/**
 * 弃牌堆类
 * 管理弃牌堆中的卡牌
 */
export class DiscardPile {
  private cards: Card[] = [];

  /**
   * 添加卡牌到弃牌堆
   */
  addCards(cards: Card[]): void {
    this.cards.push(...cards);
  }

  /**
   * 获取所有卡牌（只读）
   */
  getCards(): readonly Card[] {
    return [...this.cards];
  }

  /**
   * 获取卡牌数量
   */
  getCount(): number {
    return this.cards.length;
  }

  /**
   * 统一接口：获取卡牌数量
   */
  get count(): number {
    return this.cards.length;
  }

  /**
   * 统一接口：检查是否为空
   */
  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  /**
   * 移除指定索引的卡牌
   */
  removeCard(index: number): Card | null {
    if (index < 0 || index >= this.cards.length) {
      return null;
    }
    return this.cards.splice(index, 1)[0];
  }

  /**
   * 清空弃牌堆
   */
  clear(): Card[] {
    const allCards = [...this.cards];
    this.cards = [];
    return allCards;
  }

  /**
   * 洗牌（将卡牌随机排序）
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
}
