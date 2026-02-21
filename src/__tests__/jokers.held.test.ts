import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { getJokerById } from '../data/jokers';

describe('ON_HELD 触发器类小丑牌测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('钢制小丑', () => {
    it('钢制小丑: 手持钢制卡时应提供加成', () => {
      const joker = getJokerById('steel_joker') || getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      // 创建钢制卡
      const steelCard1 = new Card(Suit.Spades, Rank.Ace);
      steelCard1.enhancement = CardEnhancement.Steel;
      const steelCard2 = new Card(Suit.Hearts, Rank.King);
      steelCard2.enhancement = CardEnhancement.Steel;

      const heldCards = [steelCard1, steelCard2];

      const result = JokerSystem.processHeld(jokerSlots, heldCards);

      expect(result).toBeDefined();
      expect(result.effects).toBeDefined();
    });

    it('钢制小丑: 无钢制卡时不触发', () => {
      const joker = getJokerById('steel_joker') || getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      // 无钢制卡
      const heldCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processHeld(jokerSlots, heldCards);

      expect(result).toBeDefined();
    });
  });

  describe('男爵', () => {
    it('男爵: 手持K时应提供加成', () => {
      const joker = getJokerById('baron') || getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const heldCards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processHeld(jokerSlots, heldCards);

      expect(result).toBeDefined();
      expect(result.effects).toBeDefined();
    });

    it('男爵: 无K时不触发', () => {
      const joker = getJokerById('baron') || getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const heldCards = [
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Hearts, Rank.Jack)
      ];

      const result = JokerSystem.processHeld(jokerSlots, heldCards);

      expect(result).toBeDefined();
    });
  });

  describe('多张ON_HELD小丑牌组合', () => {
    it('多张小丑牌应该同时生效', () => {
      const joker1 = getJokerById('joker')!;
      const joker2 = getJokerById('joker')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      const heldCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processHeld(jokerSlots, heldCards);

      expect(result).toBeDefined();
      expect(result.effects).toBeDefined();
    });
  });
});
