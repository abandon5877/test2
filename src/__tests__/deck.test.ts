import { describe, it, expect, beforeEach } from 'vitest';
import { Deck } from '../models/Deck';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

describe('Deck', () => {
  let deck: Deck;

  beforeEach(() => {
    deck = new Deck();
  });

  describe('创建牌组', () => {
    it('应该创建包含52张牌的牌组', () => {
      expect(deck.remaining()).toBe(52);
      expect(deck.getCards().length).toBe(52);
    });

    it('应该包含4种花色的牌', () => {
      const suits = new Set(deck.getCards().map(card => card.suit));
      expect(suits.size).toBe(4);
      expect(suits.has(Suit.Spades)).toBe(true);
      expect(suits.has(Suit.Hearts)).toBe(true);
      expect(suits.has(Suit.Diamonds)).toBe(true);
      expect(suits.has(Suit.Clubs)).toBe(true);
    });

    it('每种花色应该包含13张牌', () => {
      const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      for (const suit of suits) {
        const cardsOfSuit = deck.getCards().filter(card => card.suit === suit);
        expect(cardsOfSuit.length).toBe(13);
      }
    });

    it('应该包含所有13种点数', () => {
      const ranks = new Set(deck.getCards().map(card => card.rank));
      expect(ranks.size).toBe(13);
      const allRanks = Object.values(Rank);
      for (const rank of allRanks) {
        expect(ranks.has(rank)).toBe(true);
      }
    });

    it('每种点数应该有4张牌', () => {
      const allRanks = Object.values(Rank);
      for (const rank of allRanks) {
        const cardsOfRank = deck.getCards().filter(card => card.rank === rank);
        expect(cardsOfRank.length).toBe(4);
      }
    });
  });

  describe('洗牌', () => {
    it('洗牌后牌组应该仍然包含52张牌', () => {
      deck.shuffle();
      expect(deck.remaining()).toBe(52);
    });

    it('洗牌应该改变牌的顺序', () => {
      const originalOrder = deck.getCards().map(c => c.toString()).join(',');
      deck.shuffle();
      const shuffledOrder = deck.getCards().map(c => c.toString()).join(',');
      expect(shuffledOrder).not.toBe(originalOrder);
    });

    it('多次洗牌应该产生不同的顺序', () => {
      const results = new Set<string>();
      for (let i = 0; i < 5; i++) {
        deck.shuffle();
        results.add(deck.getCards().map(c => c.toString()).join(','));
      }
      expect(results.size).toBeGreaterThan(1);
    });

    it('洗牌后牌组仍然包含所有牌', () => {
      const originalCards = new Set(deck.getCards().map(c => c.toString()));
      deck.shuffle();
      const shuffledCards = new Set(deck.getCards().map(c => c.toString()));
      expect(shuffledCards).toEqual(originalCards);
    });
  });

  describe('发牌', () => {
    it('发1张牌应该返回1张牌', () => {
      const card = deck.dealOne();
      expect(card).not.toBeNull();
      expect(card).toBeInstanceOf(Card);
      expect(deck.remaining()).toBe(51);
    });

    it('发5张牌应该返回5张牌', () => {
      const cards = deck.deal(5);
      expect(cards.length).toBe(5);
      expect(deck.remaining()).toBe(47);
    });

    it('发的牌应该是唯一的', () => {
      const cards = deck.deal(10);
      const uniqueCards = new Set(cards.map(c => c.toString()));
      expect(uniqueCards.size).toBe(10);
    });

    it('发牌顺序应该是从牌堆顶部', () => {
      const topCard = deck.peek(1)[0];
      const dealtCard = deck.dealOne();
      expect(dealtCard?.toString()).toBe(topCard.toString());
    });

    it('当牌组为空时发牌应该抛出错误', () => {
      deck.deal(52);
      expect(() => deck.deal(1)).toThrow('牌组中牌数量不足');
    });

    it('发牌数量超过剩余牌数应该抛出错误', () => {
      expect(() => deck.deal(53)).toThrow('牌组中牌数量不足');
    });

    it('连续发牌应该减少剩余牌数', () => {
      deck.deal(5);
      expect(deck.remaining()).toBe(47);
      deck.deal(10);
      expect(deck.remaining()).toBe(37);
      deck.dealOne();
      expect(deck.remaining()).toBe(36);
    });
  });

  describe('重置牌组', () => {
    it('重置后应该恢复52张牌', () => {
      deck.deal(10);
      expect(deck.remaining()).toBe(42);
      deck.reset();
      expect(deck.remaining()).toBe(52);
    });

    it('重置后应该包含所有原始牌', () => {
      const originalCards = new Set(deck.getCards().map(c => c.toString()));
      deck.deal(20);
      deck.reset();
      const resetCards = new Set(deck.getCards().map(c => c.toString()));
      expect(resetCards).toEqual(originalCards);
    });
  });

  describe('查看牌堆', () => {
    it('查看顶部1张牌', () => {
      const topCard = deck.peek(1)[0];
      const peeked = deck.peek(1);
      expect(peeked.length).toBe(1);
      expect(peeked[0].toString()).toBe(topCard.toString());
    });

    it('查看顶部多张牌', () => {
      const peeked = deck.peek(5);
      expect(peeked.length).toBe(5);
    });

    it('查看牌堆不应该改变剩余牌数', () => {
      const beforeCount = deck.remaining();
      deck.peek(10);
      expect(deck.remaining()).toBe(beforeCount);
    });
  });

  describe('添加牌到牌堆', () => {
    it('添加牌到底部', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      deck.addToBottom(card);
      expect(deck.remaining()).toBe(53);
      expect(deck.getCards()[0].toString()).toBe(card.toString());
    });

    it('添加牌到顶部', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      deck.addToTop(card);
      expect(deck.remaining()).toBe(53);
      expect(deck.peek(1)[0].toString()).toBe(card.toString());
    });
  });

  describe('isEmpty', () => {
    it('新牌组不应该为空', () => {
      expect(deck.isEmpty()).toBe(false);
    });

    it('发完所有牌后应该为空', () => {
      deck.deal(52);
      expect(deck.isEmpty()).toBe(true);
    });
  });

  describe('getCards', () => {
    it('应该返回牌的副本', () => {
      const cards = [...deck.getCards()];
      expect(cards.length).toBe(52);
      cards.pop();
      expect(deck.remaining()).toBe(52);
    });
  });
});
