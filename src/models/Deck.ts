import { Card } from './Card';
import { Suit, Rank } from '../types/card';
import { DeckError } from '../utils/errors';

export class Deck {
  private _cards: Card[] = [];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    this._cards = [];
    const suits = Object.values(Suit);
    const ranks = Object.values(Rank);

    for (const suit of suits) {
      for (const rank of ranks) {
        this._cards.push(new Card(suit, rank));
      }
    }
  }

  shuffle(): void {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
    }
  }

  deal(count: number): Card[] {
    if (count > this._cards.length) {
      throw DeckError.insufficientCards(this._cards.length, count);
    }

    const dealtCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this._cards.pop();
      if (card) {
        dealtCards.push(card);
      }
    }

    return dealtCards;
  }

  dealOne(): Card | null {
    if (this.isEmpty()) {
      return null;
    }
    return this._cards.pop() ?? null;
  }

  isEmpty(): boolean {
    return this._cards.length === 0;
  }

  remaining(): number {
    return this._cards.length;
  }

  get size(): number {
    return this._cards.length;
  }

  /**
   * 统一接口：获取卡牌数量
   */
  get count(): number {
    return this._cards.length;
  }

  reset(): void {
    this.initializeDeck();
  }

  peek(count: number = 1): readonly Card[] {
    const startIndex = Math.max(0, this._cards.length - count);
    return this._cards.slice(startIndex).reverse();
  }

  addToBottom(card: Card): void {
    this._cards.unshift(card);
  }

  addToTop(card: Card): void {
    this._cards.push(card);
  }

  getCards(): readonly Card[] {
    return [...this._cards];
  }
}
