import { Deck } from './Deck';
import { Hand } from './Hand';
import { DiscardPile } from './DiscardPile';
import { Card } from './Card';
import type { CardLocation } from '../systems/CardManager';

export interface LocatedCard {
  card: Card;
  location: CardLocation;
  handIndex?: number;
}

/**
 * CardPile - 统一的卡牌容器
 * 
 * 管理游戏中所有卡牌位置：牌堆、手牌、弃牌堆
 * 提供统一的访问和操作方法
 */
export class CardPile {
  deck: Deck;
  hand: Hand;
  discard: DiscardPile;

  constructor(maxHandSize: number = 8) {
    this.deck = new Deck();
    this.hand = new Hand(maxHandSize);
    this.discard = new DiscardPile();
  }

  /**
   * 获取牌堆剩余卡牌数
   */
  get deckCount(): number {
    return this.deck.count;
  }

  /**
   * 获取手牌数量
   */
  get handCount(): number {
    return this.hand.count;
  }

  /**
   * 获取弃牌堆数量
   */
  get discardCount(): number {
    return this.discard.count;
  }

  /**
   * 获取总卡牌数
   */
  get totalCount(): number {
    return this.deck.count + this.hand.count + this.discard.count;
  }

  /**
   * 获取所有卡牌（按位置分类）
   */
  getAllCards(): LocatedCard[] {
    const result: LocatedCard[] = [];

    // 牌堆中的卡牌
    this.deck.getCards().forEach(card => {
      result.push({ card, location: 'deck' });
    });

    // 手牌中的卡牌
    this.hand.getCards().forEach((card, index) => {
      result.push({ card, location: 'hand', handIndex: index });
    });

    // 弃牌堆中的卡牌
    this.discard.getCards().forEach(card => {
      result.push({ card, location: 'discard' });
    });

    return result;
  }

  /**
   * 根据位置获取卡牌数组
   */
  getCardsByLocation(location: CardLocation): readonly Card[] {
    switch (location) {
      case 'deck':
        return this.deck.getCards();
      case 'hand':
        return this.hand.getCards();
      case 'discard':
        return this.discard.getCards();
      default:
        return [];
    }
  }

  /**
   * 根据位置获取数量
   */
  getCountByLocation(location: CardLocation): number {
    switch (location) {
      case 'deck':
        return this.deckCount;
      case 'hand':
        return this.handCount;
      case 'discard':
        return this.discardCount;
      default:
        return 0;
    }
  }

  /**
   * 重置所有卡牌（新游戏/新盲注）
   */
  reset(maxHandSize: number): void {
    this.deck = new Deck();
    this.deck.shuffle();
    this.hand = new Hand(maxHandSize);
    this.discard = new DiscardPile();
  }

  /**
   * 清空手牌和弃牌堆，将卡牌返回牌堆并洗牌
   */
  returnToDeckAndShuffle(): void {
    // 将手牌返回牌堆
    const handCards = this.hand.clear();
    for (const card of handCards) {
      this.deck.addToBottom(card);
    }

    // 将弃牌堆返回牌堆
    const discardCards = this.discard.clear();
    for (const card of discardCards) {
      this.deck.addToBottom(card);
    }

    // 洗牌
    this.deck.shuffle();
  }

  /**
   * 从牌堆抽牌到手牌
   */
  drawFromDeck(count: number): void {
    const cardsNeeded = Math.min(count, this.hand.maxHandSize - this.hand.count);
    if (cardsNeeded <= 0) return;

    const drawn: Card[] = [];
    for (let i = 0; i < cardsNeeded && !this.deck.isEmpty(); i++) {
      const card = this.deck.dealOne();
      if (card) {
        drawn.push(card);
      }
    }

    if (drawn.length > 0) {
      this.hand.addCards(drawn);
    }
  }

  /**
   * 抽牌直到手牌满（用于出牌/弃牌后的补充）
   * 修复Bug: 使用塔罗牌摧毁手牌后，下次抽牌应该补满手牌
   */
  drawToMaxHandSize(): void {
    const cardsNeeded = this.hand.maxHandSize - this.hand.count;
    if (cardsNeeded <= 0) return;
    this.drawFromDeck(cardsNeeded);
  }

  /**
   * 将选中的手牌移到弃牌堆
   */
  discardSelected(): Card[] {
    const discarded = this.hand.discardSelected();
    if (discarded.length > 0) {
      this.discard.addCards(discarded);
    }
    return discarded;
  }

  /**
   * 将打出的手牌移到弃牌堆（可指定销毁的卡牌）
   */
  playSelected(destroyedCards?: readonly Card[]): Card[] {
    const played = this.hand.playSelected();

    if (destroyedCards && destroyedCards.length > 0) {
      // 有卡牌被销毁（如玻璃牌），只将 surviving 卡牌移到弃牌堆
      const destroyedSet = new Set(destroyedCards.map(c => c.toString()));
      const survivingCards = played.filter(card => !destroyedSet.has(card.toString()));
      if (survivingCards.length > 0) {
        this.discard.addCards(survivingCards);
      }
    } else {
      // 所有卡牌移到弃牌堆
      if (played.length > 0) {
        this.discard.addCards(played);
      }
    }

    return played;
  }

  /**
   * 发初始手牌
   */
  dealInitialHand(handSize: number): void {
    this.hand.clear();
    this.drawFromDeck(handSize);
  }

  /**
   * 序列化卡牌堆状态
   */
  serialize(): {
    deck: Array<{ suit: string; rank: string; enhancement: string; seal: string }>;
    hand: Array<{ suit: string; rank: string; enhancement: string; seal: string }>;
    discard: Array<{ suit: string; rank: string; enhancement: string; seal: string }>;
    handSelectedIndices: number[];
  } {
    const serializeCard = (card: Card) => ({
      suit: card.suit,
      rank: card.rank,
      enhancement: card.enhancement,
      seal: card.seal
    });

    return {
      deck: this.deck.getCards().map(serializeCard),
      hand: this.hand.getCards().map(serializeCard),
      discard: this.discard.getCards().map(serializeCard),
      handSelectedIndices: Array.from(this.hand.getSelectedIndices())
    };
  }

  /**
   * 反序列化恢复卡牌堆状态
   */
  deserialize(data: {
    deck: Array<{ suit: string; rank: string; enhancement: string; seal: string }>;
    hand: Array<{ suit: string; rank: string; enhancement: string; seal: string }>;
    discard: Array<{ suit: string; rank: string; enhancement: string; seal: string }>;
    handSelectedIndices: number[];
  }, maxHandSize: number): void {
    // 恢复牌堆
    (this.deck as any)._cards = data.deck.map(
      (c: any) => new Card(c.suit as any, c.rank as any, c.enhancement as any, c.seal as any)
    );

    // 恢复手牌
    this.hand = new Hand(maxHandSize);
    const handCards = data.hand.map(
      (c: any) => new Card(c.suit as any, c.rank as any, c.enhancement as any, c.seal as any)
    );
    this.hand.addCards(handCards);

    // 恢复选牌状态
    data.handSelectedIndices.forEach(index => {
      this.hand.selectCard(index);
    });

    // 恢复弃牌堆
    (this.discard as any).cards = data.discard.map(
      (c: any) => new Card(c.suit as any, c.rank as any, c.enhancement as any, c.seal as any)
    );
  }
}
