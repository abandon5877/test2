import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { JokerEdition } from '../types/joker';
import { getJokerById } from '../data/jokers';

describe('小丑牌边界条件测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('空手牌测试', () => {
    it('空手牌时应返回0分', () => {
      const cards: Card[] = [];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.totalScore).toBe(0);
    });
  });

  describe('单张牌测试', () => {
    it('单张高牌应正确计分', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe('highCard');
      expect(result.totalScore).toBeGreaterThan(0);
    });
  });

  describe('最大手牌测试', () => {
    it('5张牌时应正常计分', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      expect(result.totalScore).toBeGreaterThan(0);
    });
  });

  describe('无小丑牌测试', () => {
    it('无小丑牌时应正常计分', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace)
      ];
      
      const result = ScoringSystem.calculate(cards);
      expect(result.totalScore).toBeGreaterThan(0);
    });
  });

  describe('版本效果边界测试', () => {
    it('Foil 版本小丑牌应正确创建', () => {
      const joker = getJokerById('joker')!;
      joker.edition = JokerEdition.Foil;

      expect(joker.edition).toBe(JokerEdition.Foil);
    });

    it('Holographic 版本小丑牌应正确创建', () => {
      const joker = getJokerById('joker')!;
      joker.edition = JokerEdition.Holographic;

      expect(joker.edition).toBe(JokerEdition.Holographic);
    });

    it('Polychrome 版本小丑牌应正确创建', () => {
      const joker = getJokerById('joker')!;
      joker.edition = JokerEdition.Polychrome;

      expect(joker.edition).toBe(JokerEdition.Polychrome);
    });
  });
});
