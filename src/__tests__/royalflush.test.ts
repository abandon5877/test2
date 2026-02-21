import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { Joker } from '../models/Joker';
import { JokerSlots } from '../models/JokerSlots';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

// 辅助函数：创建测试用的卡牌
function createTestCard(suit: Suit, rank: Rank): Card {
  return new Card(suit, rank);
}

describe('皇家同花顺测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
    PokerHandDetector.clearConfig();
  });

  describe('没有四指效果', () => {
    it('10,J,Q,K,A同花色应该是皇家同花顺', () => {
      const cards = [
        createTestCard(Suit.Hearts, Rank.Ten),
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Queen),
        createTestCard(Suit.Hearts, Rank.King),
        createTestCard(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      expect(result.handType).toBe('royalFlush');
      expect(result.handDescription).toContain('皇家同花顺');
    });

    it('9,10,J,Q,K同花色不是皇家同花顺（9<10）', () => {
      const cards = [
        createTestCard(Suit.Hearts, Rank.Nine),
        createTestCard(Suit.Hearts, Rank.Ten),
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Queen),
        createTestCard(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 应该是普通同花顺，不是皇家同花顺
      expect(result.handType).toBe('straightFlush');
      expect(result.handDescription).not.toContain('皇家');
    });
  });

  describe('有四指效果', () => {
    it('四指+10,J,Q,K同花色应该是皇家同花顺', () => {
      const fourFingers = new Joker({
        id: 'four_fingers',
        name: '四指',
        description: '同花/顺子只需4张',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          fourFingers: true,
          message: '四指: 同花/顺子只需4张'
        })
      });

      jokerSlots.addJoker(fourFingers);

      const cards = [
        createTestCard(Suit.Hearts, Rank.Ten),
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Queen),
        createTestCard(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      expect(result.handType).toBe('royalFlush');
      expect(result.handDescription).toContain('皇家同花顺');
    });

    it('四指+J,Q,K,A同花色应该是皇家同花顺', () => {
      const fourFingers = new Joker({
        id: 'four_fingers',
        name: '四指',
        description: '同花/顺子只需4张',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          fourFingers: true,
          message: '四指: 同花/顺子只需4张'
        })
      });

      jokerSlots.addJoker(fourFingers);

      const cards = [
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Queen),
        createTestCard(Suit.Hearts, Rank.King),
        createTestCard(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      expect(result.handType).toBe('royalFlush');
      expect(result.handDescription).toContain('皇家同花顺');
    });

    it('四指+9,10,J,Q同花色不是皇家同花顺（9<10）', () => {
      const fourFingers = new Joker({
        id: 'four_fingers',
        name: '四指',
        description: '同花/顺子只需4张',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          fourFingers: true,
          message: '四指: 同花/顺子只需4张'
        })
      });

      jokerSlots.addJoker(fourFingers);

      const cards = [
        createTestCard(Suit.Hearts, Rank.Nine),
        createTestCard(Suit.Hearts, Rank.Ten),
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Queen),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 应该是普通同花顺，不是皇家同花顺
      expect(result.handType).toBe('straightFlush');
      expect(result.handDescription).not.toContain('皇家');
    });
  });
});
