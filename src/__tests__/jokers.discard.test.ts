import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';

describe('ON_DISCARD 触发器类小丑牌测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('Faceless Joker (无面小丑)', () => {
    it('弃3张以上人头牌时应获得$5', () => {
      const joker = getJokerById('faceless_joker')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.moneyBonus).toBe(5);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('无面小丑');
    });

    it('弃2张人头牌时不应触发', () => {
      const joker = getJokerById('faceless_joker')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.moneyBonus).toBe(0);
    });

    it('弃非人头牌时不应触发', () => {
      const joker = getJokerById('faceless_joker')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Hearts, Rank.Nine),
        new Card(Suit.Diamonds, Rank.Eight)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.moneyBonus).toBe(0);
    });
  });

  describe('Mail-In Rebate (邮寄返利)', () => {
    it('弃特定点数牌时应获得$5', () => {
      const joker = getJokerById('mail_in_rebate')!;
      jokerSlots.addJoker(joker);

      // 设置当前目标点数为A (使用 targetRank 字段，值为 'A')
      (joker as any).state = { targetRank: 'A' };

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.moneyBonus).toBe(10); // 2张A * $5
      expect(result.effects).toHaveLength(1);
    });

    it('弃非目标点数牌时不应触发', () => {
      const joker = getJokerById('mail_in_rebate')!;
      jokerSlots.addJoker(joker);

      // 设置当前目标点数为A (使用 targetRank 字段，值为 'A')
      (joker as any).state = { targetRank: 'A' };

      const discardedCards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.moneyBonus).toBe(0);
    });
  });

  describe('Castle (城堡)', () => {
    it('弃特定花色牌时应增加筹码', () => {
      const joker = getJokerById('castle')!;
      jokerSlots.addJoker(joker);

      // 设置当前目标花色为红桃
      (joker as any).state = { currentSuit: Suit.Hearts, chipBonus: 0 };

      const discardedCards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.chipBonus).toBe(6); // 2张红桃 * 3筹码
      expect(result.effects).toHaveLength(1);
    });

    it('弃非目标花色牌时不应增加筹码', () => {
      const joker = getJokerById('castle')!;
      jokerSlots.addJoker(joker);

      // 设置当前目标花色为红桃
      (joker as any).state = { currentSuit: Suit.Hearts, chipBonus: 0 };

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Clubs, Rank.King)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.chipBonus).toBe(0);
    });
  });

  describe('Burnt Joker (烧焦的小丑)', () => {
    it('第一手弃牌时应升级牌型', () => {
      const joker = getJokerById('burnt_joker')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      // 第一手弃牌 (handsPlayed = 0)
      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 0);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('烧焦的小丑');
    });

    it('非第一手弃牌时不应触发', () => {
      const joker = getJokerById('burnt_joker')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      // 非第一手弃牌 (handsPlayed = 1)
      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.effects).toHaveLength(0);
    });
  });

  describe('Trading Card (交易卡)', () => {
    it('第一手弃1张牌时应摧毁并获得$3', () => {
      const joker = getJokerById('trading_card')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ace)
      ];

      // 第一手弃牌 (handsPlayed = 0)
      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 0);

      expect(result.moneyBonus).toBe(3);
      expect(result.effects).toHaveLength(1);
    });

    it('弃多张牌时不应触发', () => {
      const joker = getJokerById('trading_card')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      // 第一手弃牌 (handsPlayed = 0)
      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 0);

      expect(result.moneyBonus).toBe(0);
    });

    it('非第一手弃牌时不应触发', () => {
      const joker = getJokerById('trading_card')!;
      jokerSlots.addJoker(joker);

      const discardedCards = [
        new Card(Suit.Spades, Rank.Ace)
      ];

      // 非第一手弃牌 (handsPlayed = 1)
      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.moneyBonus).toBe(0);
    });
  });

  describe('多张ON_DISCARD小丑牌组合', () => {
    it('多张小丑牌应同时生效', () => {
      const joker1 = getJokerById('faceless_joker')!;
      const joker2 = getJokerById('castle')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      // 设置城堡的目标花色
      (joker2 as any).state = { currentSuit: Suit.Hearts, chipBonus: 0 };

      const discardedCards = [
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Hearts, Rank.Jack)
      ];

      const result = JokerSystem.processDiscard(jokerSlots, discardedCards, 1);

      expect(result.moneyBonus).toBe(5); // 无面小丑
      expect(result.chipBonus).toBe(9); // 城堡: 3张红桃 * 3
      expect(result.effects).toHaveLength(2);
    });
  });
});
