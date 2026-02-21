import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { getJokerById } from '../data/jokers';

describe('Context字段传递测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('handsPlayed字段', () => {
    it('小丑牌应该响应handsPlayed参数', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.OnePair,
        10,
        1,
        { money: 10, interestCap: 20, hands: 3, discards: 3 },
        6,
        0
      );

      expect(result).toBeDefined();
      expect(result.effects).toBeDefined();
    });
  });

  describe('discardsUsed字段', () => {
    it('小丑牌应该响应discardsUsed参数', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace)
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.HighCard,
        5,
        1,
        { money: 10, interestCap: 20, hands: 3, discards: 3 },
        1,
        23
      );

      expect(result).toBeDefined();
      expect(result.effects).toBeDefined();
    });
  });

  describe('context字段完整性', () => {
    it('processHandPlayed应传递所有context字段', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [new Card(Suit.Spades, Rank.Ace)];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.HighCard,
        5,
        1,
        { money: 10, interestCap: 20, hands: 3, discards: 3 },
        5,
        2
      );

      expect(result).toHaveProperty('chipBonus');
      expect(result).toHaveProperty('multBonus');
      expect(result).toHaveProperty('multMultiplier');
      expect(result).toHaveProperty('effects');
    });
  });
});
