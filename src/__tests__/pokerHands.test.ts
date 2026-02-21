import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { Suit, Rank } from '../types/card';
import { PokerHandType, getHandRank, compareHandTypes, POKER_HAND_HIERARCHY } from '../types/pokerHands';

describe('PokerHandDetector', () => {
  describe('高牌 (High Card)', () => {
    it('应该检测高牌', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Nine)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.HighCard);
      expect(result.description).toContain('高牌');
      expect(result.baseChips).toBe(5);
      expect(result.baseMultiplier).toBe(1);
    });

    it('高牌应该选择最大点数的牌', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Diamonds, Rank.Eight),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Ace)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.HighCard);
      expect(result.scoringCards[0].rank).toBe(Rank.Ace);
    });
  });

  describe('一对 (One Pair)', () => {
    it('应该检测一对', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.OnePair);
      expect(result.description).toContain('对子');
      expect(result.baseChips).toBe(10);
      expect(result.baseMultiplier).toBe(2);
    });

    it('一对应该选择最大点数的一对', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.OnePair);
      expect(result.scoringCards[0].rank).toBe(Rank.Ace);
    });
  });

  describe('两对 (Two Pair)', () => {
    it('应该检测两对', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.TwoPair);
      expect(result.description).toContain('两对');
      expect(result.baseChips).toBe(20);
      expect(result.baseMultiplier).toBe(2);
    });

    it('两对应该包含两个对子的牌', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Hearts, Rank.Ten),
        new Card(Suit.Diamonds, Rank.Five),
        new Card(Suit.Clubs, Rank.Five),
        new Card(Suit.Spades, Rank.Ace)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.TwoPair);
      expect(result.scoringCards.length).toBe(4);
    });
  });

  describe('三条 (Three of a Kind)', () => {
    it('应该检测三条', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.ThreeOfAKind);
      expect(result.description).toContain('三条');
      expect(result.baseChips).toBe(30);
      expect(result.baseMultiplier).toBe(3);
    });

    it('三条应该包含三张相同点数的牌', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Seven),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Two),
        new Card(Suit.Spades, Rank.Three)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.ThreeOfAKind);
      expect(result.scoringCards.length).toBe(3);
      expect(result.scoringCards.every(c => c.rank === Rank.Seven)).toBe(true);
    });
  });

  describe('顺子 (Straight)', () => {
    it('应该检测顺子', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Eight),
        new Card(Suit.Spades, Rank.Nine)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.Straight);
      expect(result.description).toContain('顺子');
      expect(result.baseChips).toBe(30);
      expect(result.baseMultiplier).toBe(4);
    });

    it('应该检测A-5的顺子(小顺)', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Five)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.Straight);
      expect(result.description).toContain('顺子');
    });

    it('应该检测10-A的顺子', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Ace)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.Straight);
      expect(result.description).toContain('顺子');
    });
  });

  describe('同花 (Flush)', () => {
    it('应该检测同花', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.Flush);
      expect(result.description).toContain('同花');
      expect(result.baseChips).toBe(35);
      expect(result.baseMultiplier).toBe(4);
    });

    it('同花应该选择最大的5张同花牌', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Two),
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Spades, Rank.Eight),
        new Card(Suit.Spades, Rank.Jack),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Three)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.Flush);
      expect(result.scoringCards.length).toBe(5);
      expect(result.scoringCards[0].rank).toBe(Rank.Ace);
    });
  });

  describe('葫芦 (Full House)', () => {
    it('应该检测葫芦', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.King)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.FullHouse);
      expect(result.description).toContain('葫芦');
      expect(result.baseChips).toBe(40);
      expect(result.baseMultiplier).toBe(4);
    });

    it('葫芦应该包含三条和一对', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Seven),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Three),
        new Card(Suit.Spades, Rank.Three)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.FullHouse);
      expect(result.scoringCards.length).toBe(5);
    });
  });

  describe('四条 (Four of a Kind)', () => {
    it('应该检测四条', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.King)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      expect(result.description).toContain('四条');
      expect(result.baseChips).toBe(60);
      expect(result.baseMultiplier).toBe(7);
    });

    it('四条应该包含四张相同点数的牌', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Nine),
        new Card(Suit.Hearts, Rank.Nine),
        new Card(Suit.Diamonds, Rank.Nine),
        new Card(Suit.Clubs, Rank.Nine),
        new Card(Suit.Spades, Rank.Two)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      expect(result.scoringCards.length).toBe(4);
      expect(result.scoringCards.every(c => c.rank === Rank.Nine)).toBe(true);
    });
  });

  describe('同花顺 (Straight Flush)', () => {
    it('应该检测同花顺', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Nine)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.StraightFlush);
      expect(result.description).toContain('同花顺');
      expect(result.baseChips).toBe(100);
      expect(result.baseMultiplier).toBe(8);
    });

    it('应该检测A-5的同花顺(小同花顺)', () => {
      const cards = [
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Clubs, Rank.Two),
        new Card(Suit.Clubs, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Clubs, Rank.Five)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.StraightFlush);
      expect(result.description).toContain('同花顺');
    });
  });

  describe('皇家同花顺 (Royal Flush)', () => {
    it('应该检测皇家同花顺', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Spades, Rank.Jack),
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Spades, Rank.Ace)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.RoyalFlush);
      expect(result.description).toContain('皇家同花顺');
      expect(result.baseChips).toBe(100);
      expect(result.baseMultiplier).toBe(8);
    });

    it('皇家同花顺必须是10-A的同花', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Ten),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.RoyalFlush);
      expect(result.scoringCards.length).toBe(5);
    });
  });

  describe('牌型优先级', () => {
    it('皇家同花顺应该是最高的牌型', () => {
      expect(getHandRank(PokerHandType.RoyalFlush)).toBe(9);
    });

    it('高牌应该是最低的牌型', () => {
      expect(getHandRank(PokerHandType.HighCard)).toBe(0);
    });

    it('牌型优先级应该正确排序', () => {
      expect(POKER_HAND_HIERARCHY).toEqual([
        PokerHandType.HighCard,
        PokerHandType.OnePair,
        PokerHandType.TwoPair,
        PokerHandType.ThreeOfAKind,
        PokerHandType.Straight,
        PokerHandType.Flush,
        PokerHandType.FullHouse,
        PokerHandType.FourOfAKind,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush,
        // 秘密牌型
        PokerHandType.FiveOfAKind,
        PokerHandType.FlushHouse,
        PokerHandType.FlushFive
      ]);
    });

    it('compareHandTypes应该正确比较牌型', () => {
      expect(compareHandTypes(PokerHandType.RoyalFlush, PokerHandType.HighCard)).toBeGreaterThan(0);
      expect(compareHandTypes(PokerHandType.HighCard, PokerHandType.RoyalFlush)).toBeLessThan(0);
      expect(compareHandTypes(PokerHandType.OnePair, PokerHandType.OnePair)).toBe(0);
    });

    it('葫芦应该比同花大', () => {
      const flushCards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const fullHouseCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.King)
      ];
      const flushResult = PokerHandDetector.detect(flushCards);
      const fullHouseResult = PokerHandDetector.detect(fullHouseCards);
      expect(getHandRank(fullHouseResult.handType)).toBeGreaterThan(getHandRank(flushResult.handType));
    });
  });

  describe('边界情况', () => {
    it('空牌组应该返回高牌', () => {
      const result = PokerHandDetector.detect([]);
      expect(result.handType).toBe(PokerHandType.HighCard);
      expect(result.description).toBe('无牌');
    });

    it('少于5张牌应该能检测牌型', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.OnePair);
    });

    it('多于5张牌应该选择最佳牌型', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack)
      ];
      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
    });
  });
});
