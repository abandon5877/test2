import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';

describe('预览功能测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('基础预览', () => {
    it('应该能计算基础分数', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      expect(result.totalScore).toBeGreaterThan(0);
    });

    it('应该能预览小丑牌效果', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      expect(result.jokerEffects).toHaveLength(1);
    });
  });
});
