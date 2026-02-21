import { Card } from '../models/Card';
import { Hand } from '../models/Hand';
import { Deck } from '../models/Deck';
import { DiscardPile } from '../models/DiscardPile';
import { CardPile } from '../models/CardPile';
import { Suit, Rank, CardEnhancement, SealType } from '../types/card';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('CardManager');

export type CardLocation = 'deck' | 'hand' | 'discard';

export interface LocatedCard {
  card: Card;
  location: CardLocation;
  handIndex?: number;
}

/**
 * CardManager - 无状态卡牌管理工具类
 * 
 * 所有方法都是静态方法，接收 Deck, Hand, DiscardPile 实例作为参数。
 * 遵循 Systems 层无状态化原则。
 */
export class CardManager {

  // ========== 发牌堆操作 ==========

  static getDeckCards(deck: Deck): readonly Card[] {
    return deck.getCards();
  }

  static addToDeck(deck: Deck, card: Card): void {
    deck.addToTop(card);
    logger.debug('Card added to deck', { card: card.toString(), deckCount: deck.remaining() });
  }

  static drawFromDeck(deck: Deck, count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count && !deck.isEmpty(); i++) {
      const card = deck.dealOne();
      if (card) {
        drawn.push(card);
      }
    }
    logger.debug('Drew cards from deck', { count: drawn.length, remaining: deck.remaining() });
    return drawn;
  }

  static drawOneFromDeck(deck: Deck): Card | null {
    const card = deck.dealOne();
    if (card) {
      logger.debug('Drew one card from deck', { card: card.toString(), remaining: deck.remaining() });
    }
    return card;
  }

  static shuffleDeck(deck: Deck): void {
    deck.shuffle();
    logger.debug('Deck shuffled', { count: deck.remaining() });
  }

  static getDeckCount(deck: Deck): number {
    return deck.remaining();
  }

  // ========== 手牌操作 ==========

  static getHandCards(hand: Hand): readonly Card[] {
    return hand.getCards();
  }

  static addToHand(hand: Hand, cards: Card[]): void {
    hand.addCards(cards);
    logger.debug('Cards added to hand', { count: cards.length, handCount: hand.size });
  }

  static removeFromHand(hand: Hand, indices: number[]): Card[] {
    const removed = hand.removeCards(indices);
    logger.debug('Cards removed from hand', { count: removed.length, handCount: hand.size });
    return removed;
  }

  static getHandCount(hand: Hand): number {
    return hand.size;
  }

  // ========== 手牌选择 ==========

  static selectHandCard(hand: Hand, index: number): boolean {
    return hand.selectCard(index);
  }

  static deselectHandCard(hand: Hand, index: number): boolean {
    return hand.deselectCard(index);
  }

  static toggleHandCardSelection(hand: Hand, index: number): boolean {
    return hand.toggleCard(index);
  }

  static clearHandSelection(hand: Hand): void {
    hand.clearSelection();
  }

  static getSelectedHandIndices(hand: Hand): readonly number[] {
    return Array.from(hand.getSelectedIndices()).sort((a, b) => a - b);
  }

  static getSelectedHandCards(hand: Hand): Card[] {
    return hand.getSelectedCards();
  }

  // ========== 弃牌堆操作 ==========

  static getDiscardCards(discardPile: DiscardPile): readonly Card[] {
    return discardPile.getCards();
  }

  static addToDiscard(discardPile: DiscardPile, cards: Card[]): void {
    discardPile.addCards(cards);
    logger.debug('Cards added to discard', { count: cards.length, discardCount: discardPile.getCount() });
  }

  static getDiscardCount(discardPile: DiscardPile): number {
    return discardPile.getCount();
  }

  // ========== 盲注结束操作 ==========

  /**
   * 盲注结束后，将手牌和弃牌堆洗回发牌堆
   */
  static endBlind(deck: Deck, hand: Hand, discardPile: DiscardPile): void {
    const handCount = hand.size;
    const discardCount = discardPile.getCount();
    
    // 将手牌和弃牌堆的卡牌放回发牌堆
    const handCards = hand.clear();
    const discardCards = discardPile.clear();
    
    for (const card of handCards) {
      deck.addToBottom(card);
    }
    for (const card of discardCards) {
      deck.addToBottom(card);
    }
    
    // 洗牌
    deck.shuffle();
    
    logger.info('Blind ended, cards returned to deck', {
      handCount,
      discardCount,
      deckCount: deck.remaining()
    });
  }

  // ========== 卡牌修改（消耗牌效果）==========

  /**
   * 从任意位置移除卡牌
   */
  static removeCard(deck: Deck, hand: Hand, discardPile: DiscardPile, location: CardLocation, index: number): Card | null {
    let card: Card | null = null;

    switch (location) {
      case 'deck':
        // 从牌堆移除需要特殊处理，因为 Deck 没有直接移除方法
        const deckCards = deck.getCards();
        if (index >= 0 && index < deckCards.length) {
          // 重新构建牌堆，跳过指定索引
          const newCards: Card[] = [];
          const allCards = [...deckCards];
          for (let i = 0; i < allCards.length; i++) {
            if (i === index) {
              card = allCards[i];
            } else {
              newCards.push(allCards[i]);
            }
          }
          // 重置牌堆
          (deck as any)._cards = newCards;
        }
        break;
      case 'hand':
        card = hand.removeCard(index);
        break;
      case 'discard':
        card = discardPile.removeCard(index);
        break;
    }

    return card;
  }

  /**
   * 复制卡牌到指定位置（完整版本）
   */
  static copyCardToLocation(deck: Deck, hand: Hand, discardPile: DiscardPile, card: Card, location: CardLocation): void {
    const newCard = new Card(card.suit, card.rank, card.enhancement, card.seal);

    switch (location) {
      case 'deck':
        deck.addToTop(newCard);
        break;
      case 'hand':
        hand.addCard(newCard);
        break;
      case 'discard':
        discardPile.addCards([newCard]);
        break;
    }
  }

  /**
   * 复制卡牌到指定牌堆（简化版本）
   */
  static copyCard(container: Deck | Hand | DiscardPile, card: Card): void {
    const newCard = new Card(card.suit, card.rank, card.enhancement, card.seal);

    if (container instanceof Deck) {
      container.addToTop(newCard);
    } else if (container instanceof Hand) {
      container.addCard(newCard);
    } else if (container instanceof DiscardPile) {
      container.addCards([newCard]);
    }
  }

  /**
   * 修改卡牌增强
   */
  static enhanceCard(deck: Deck, hand: Hand, discardPile: DiscardPile, location: CardLocation, index: number, enhancement: CardEnhancement): boolean {
    let card: Card | undefined;
    
    switch (location) {
      case 'deck':
        const deckCards = deck.getCards();
        card = deckCards[index];
        break;
      case 'hand':
        const handCards = hand.getCards();
        card = handCards[index];
        break;
      case 'discard':
        const discardCards = discardPile.getCards();
        card = discardCards[index];
        break;
    }
    
    if (card) {
      (card as any).enhancement = enhancement;
      return true;
    }
    return false;
  }

  // ========== 序列化 ==========

  static serialize(deck: Deck, hand: Hand, discardPile: DiscardPile): {
    deck: Array<{ suit: Suit; rank: Rank; enhancement: CardEnhancement; seal: SealType }>;
    hand: Array<{ suit: Suit; rank: Rank; enhancement: CardEnhancement; seal: SealType }>;
    discard: Array<{ suit: Suit; rank: Rank; enhancement: CardEnhancement; seal: SealType }>;
    handSelectedIndices: number[];
  } {
    const serializeCard = (card: Card) => ({
      suit: card.suit,
      rank: card.rank,
      enhancement: card.enhancement,
      seal: card.seal
    });

    return {
      deck: deck.getCards().map(serializeCard),
      hand: hand.getCards().map(serializeCard),
      discard: discardPile.getCards().map(serializeCard),
      handSelectedIndices: [...CardManager.getSelectedHandIndices(hand)]
    };
  }

  static deserialize(deck: Deck, hand: Hand, discardPile: DiscardPile, data: {
    deck: Array<{ suit: Suit; rank: Rank; enhancement: CardEnhancement; seal: SealType }>;
    hand: Array<{ suit: Suit; rank: Rank; enhancement: CardEnhancement; seal: SealType }>;
    discard: Array<{ suit: Suit; rank: Rank; enhancement: CardEnhancement; seal: SealType }>;
    handSelectedIndices: number[];
  }): void {
    // 恢复牌堆
    (deck as any)._cards = data.deck.map(c => new Card(c.suit, c.rank, c.enhancement, c.seal));
    
    // 恢复手牌
    const handCards = data.hand.map(c => new Card(c.suit, c.rank, c.enhancement, c.seal));
    (hand as any).cards = handCards;
    
    // 恢复弃牌堆
    const discardCards = data.discard.map(c => new Card(c.suit, c.rank, c.enhancement, c.seal));
    (discardPile as any).cards = discardCards;

    // 恢复选牌状态
    hand.clearSelection();
    data.handSelectedIndices.forEach(index => {
      hand.selectCard(index);
    });
  }

  // ========== 统计 ==========

  static getTotalCount(deck: Deck, hand: Hand, discardPile: DiscardPile): number {
    return deck.remaining() + hand.size + discardPile.getCount();
  }

  static getAllCards(deck: Deck, hand: Hand, discardPile: DiscardPile): LocatedCard[] {
    const result: LocatedCard[] = [];

    deck.getCards().forEach(card => {
      result.push({ card, location: 'deck' });
    });

    hand.getCards().forEach((card, index) => {
      result.push({ card, location: 'hand', handIndex: index });
    });

    discardPile.getCards().forEach(card => {
      result.push({ card, location: 'discard' });
    });

    return result;
  }

  // ========== CardPile 便捷方法 ==========

  /**
   * 从 CardPile 获取总卡牌数
   */
  static getTotalCountFromPile(cardPile: CardPile): number {
    return cardPile.totalCount;
  }

  /**
   * 从 CardPile 获取所有卡牌
   */
  static getAllCardsFromPile(cardPile: CardPile): LocatedCard[] {
    return cardPile.getAllCards();
  }

  /**
   * 从 CardPile 获取指定位置的卡牌
   */
  static getCardsByLocation(cardPile: CardPile, location: CardLocation): readonly Card[] {
    return cardPile.getCardsByLocation(location);
  }

  /**
   * 从 CardPile 获取指定位置的数量
   */
  static getCountByLocation(cardPile: CardPile, location: CardLocation): number {
    return cardPile.getCountByLocation(location);
  }
}

// 为了保持向后兼容，保留全局实例管理（已废弃，将在后续版本中移除）
let globalCardManager: CardManager | null = null;

/**
 * @deprecated 使用新的静态方法 CardManager.xxx(deck, hand, discardPile, ...)
 */
export function getCardManager(): CardManager {
  if (!globalCardManager) {
    globalCardManager = new CardManager();
  }
  return globalCardManager;
}

/**
 * @deprecated 使用新的静态方法 CardManager.xxx(deck, hand, discardPile, ...)
 */
export function setCardManager(manager: CardManager): void {
  globalCardManager = manager;
}
