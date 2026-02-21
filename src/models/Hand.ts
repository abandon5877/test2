import { Card } from './Card';
import { Suit, Rank } from '../types/card';

export class Hand {
  private cards: Card[] = [];
  private selectedIndices: Set<number> = new Set();
  private maxSize: number;

  constructor(maxSize: number = 8) {
    this.maxSize = maxSize;
  }

  getCards(): Card[] {
    return [...this.cards];
  }

  getSelectedIndices(): Set<number> {
    return new Set(this.selectedIndices);
  }

  getSelectedCards(): Card[] {
    return Array.from(this.selectedIndices)
      .sort((a, b) => a - b)
      .map(index => this.cards[index])
      .filter((card): card is Card => card !== undefined);
  }

  selectCard(index: number): boolean {
    if (index < 0 || index >= this.cards.length) {
      return false;
    }
    // 限制最多只能选择5张牌
    if (this.selectedIndices.size >= 5 && !this.selectedIndices.has(index)) {
      return false;
    }
    this.selectedIndices.add(index);
    return true;
  }

  deselectCard(index: number): boolean {
    if (index < 0 || index >= this.cards.length) {
      return false;
    }
    return this.selectedIndices.delete(index);
  }

  toggleCard(index: number): boolean {
    if (this.selectedIndices.has(index)) {
      this.deselectCard(index);
      return false;
    } else {
      // 如果selectCard返回false（超过5张限制），则返回false
      return this.selectCard(index);
    }
  }

  clearSelection(): void {
    this.selectedIndices.clear();
  }

  isSelected(index: number): boolean {
    return this.selectedIndices.has(index);
  }

  getSelectionCount(): number {
    return this.selectedIndices.size;
  }

  addCards(cards: Card[]): void {
    const availableSpace = this.maxSize - this.cards.length;
    const cardsToAdd = cards.slice(0, availableSpace);
    this.cards.push(...cardsToAdd);
  }

  addCard(card: Card): boolean {
    if (this.cards.length >= this.maxSize) {
      return false;
    }
    this.cards.push(card);
    return true;
  }

  playSelected(): Card[] {
    const selectedCards = this.getSelectedCards();
    if (selectedCards.length === 0) {
      return [];
    }

    const indicesToRemove = Array.from(this.selectedIndices).sort((a, b) => b - a);
    for (const index of indicesToRemove) {
      this.cards.splice(index, 1);
    }

    this.clearSelection();
    return selectedCards;
  }

  discardSelected(): Card[] {
    return this.playSelected();
  }

  removeCard(index: number): Card | null {
    if (index < 0 || index >= this.cards.length) {
      return null;
    }
    const [removedCard] = this.cards.splice(index, 1);
    
    const newSelection = new Set<number>();
    for (const selectedIndex of this.selectedIndices) {
      if (selectedIndex < index) {
        newSelection.add(selectedIndex);
      } else if (selectedIndex > index) {
        newSelection.add(selectedIndex - 1);
      }
    }
    this.selectedIndices = newSelection;
    
    return removedCard;
  }

  /**
   * 移除多个指定索引的卡牌
   * @param indices 要移除的卡牌索引数组
   * @returns 被移除的卡牌数组
   */
  removeCards(indices: number[]): Card[] {
    // 按索引从大到小排序，避免删除时索引变化
    const sortedIndices = [...indices].sort((a, b) => b - a);
    const removed: Card[] = [];

    for (const index of sortedIndices) {
      const card = this.removeCard(index);
      if (card) {
        removed.push(card);
      }
    }

    return removed;
  }

  sortBySuit(): void {
    const suitOrder: Record<Suit, number> = {
      [Suit.Spades]: 0,
      [Suit.Hearts]: 1,
      [Suit.Diamonds]: 2,
      [Suit.Clubs]: 3
    };

    this.cards.sort((a, b) => {
      const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
      if (suitDiff !== 0) {
        return suitDiff;
      }
      return this.getRankValue(a.rank) - this.getRankValue(b.rank);
    });

    this.clearSelection();
  }

  sortByRank(): void {
    this.cards.sort((a, b) => {
      const rankDiff = this.getRankValue(a.rank) - this.getRankValue(b.rank);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      const suitOrder: Record<Suit, number> = {
        [Suit.Spades]: 0,
        [Suit.Hearts]: 1,
        [Suit.Diamonds]: 2,
        [Suit.Clubs]: 3
      };
      return suitOrder[a.suit] - suitOrder[b.suit];
    });

    this.clearSelection();
  }

  private getRankValue(rank: Rank): number {
    const rankValues: Record<Rank, number> = {
      [Rank.Two]: 2,
      [Rank.Three]: 3,
      [Rank.Four]: 4,
      [Rank.Five]: 5,
      [Rank.Six]: 6,
      [Rank.Seven]: 7,
      [Rank.Eight]: 8,
      [Rank.Nine]: 9,
      [Rank.Ten]: 10,
      [Rank.Jack]: 11,
      [Rank.Queen]: 12,
      [Rank.King]: 13,
      [Rank.Ace]: 14
    };
    return rankValues[rank];
  }

  get size(): number {
    return this.cards.length;
  }

  /**
   * 统一接口：获取卡牌数量
   */
  get count(): number {
    return this.cards.length;
  }

  get maxHandSize(): number {
    return this.maxSize;
  }

  isFull(): boolean {
    return this.cards.length >= this.maxSize;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  clear(): Card[] {
    const cards = [...this.cards];
    this.cards = [];
    this.selectedIndices.clear();
    return cards;
  }

  toString(): string {
    return this.cards.map((card, index) => {
      const selected = this.selectedIndices.has(index) ? '[*]' : '';
      return `${index}:${card.toString()}${selected}`;
    }).join(', ');
  }
}
