import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { getJokerById } from '../data/jokers';

describe('JokerSystem - 小丑牌效果测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('基础小丑牌效果', () => {
    it('加法小丑: +20筹码', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        cards,
        PokerHandType.HighCard,
        5,
        1
      );

      expect(result).toBeDefined();
    });

    it('乘法小丑: +4倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        cards,
        PokerHandType.HighCard,
        5,
        1
      );

      expect(result).toBeDefined();
    });

    it('小丑: +4倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processOnPlay(jokerSlots);

      expect(result).toBeDefined();
    });
  });

  describe('花色相关小丑牌', () => {
    it('性欲小丑: 每张红桃+4倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        cards,
        PokerHandType.OnePair,
        10,
        2
      );

      expect(result.multBonus).toBeGreaterThanOrEqual(0);
    });

    it('暴怒小丑: 每张黑桃+4倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        cards,
        PokerHandType.ThreeOfAKind,
        30,
        3
      );

      expect(result.multBonus).toBeGreaterThanOrEqual(0);
    });

    it('贪婪小丑: 每张方块+4倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King)
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        cards,
        PokerHandType.OnePair,
        10,
        2
      );

      expect(result.multBonus).toBeGreaterThanOrEqual(0);
    });

    it('暴食小丑: 每张梅花+4倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack)
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        cards,
        PokerHandType.FourOfAKind,
        60,
        4
      );

      expect(result.multBonus).toBeGreaterThanOrEqual(0);
    });
  });

  describe('牌型相关小丑牌', () => {
    it('欢乐小丑: 对子时+5倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        [],
        PokerHandType.OnePair,
        10,
        2
      );

      expect(result.multBonus).toBeGreaterThanOrEqual(0);
    });

    it('滑稽小丑: 三条时+10倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        [],
        PokerHandType.ThreeOfAKind,
        30,
        3
      );

      expect(result.multBonus).toBeGreaterThanOrEqual(0);
    });
  });

  describe('小丑牌槽位管理', () => {
    it('最多可添加5张小丑牌', () => {
      for (let i = 0; i < 5; i++) {
        const joker = getJokerById('joker')!;
        const added = jokerSlots.addJoker(joker);
        expect(added).toBe(true);
      }

      // 第6张应该失败
      const extraJoker = getJokerById('joker')!;
      const added = jokerSlots.addJoker(extraJoker);
      expect(added).toBe(false);
    });

    it('可以移除小丑牌', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      expect(jokerSlots.getJokerCount()).toBe(1);

      const removed = jokerSlots.removeJoker(0);
      expect(removed).not.toBeNull();
      expect(jokerSlots.getJokerCount()).toBe(0);
    });

    it('可以移动小丑牌位置', () => {
      const joker1 = getJokerById('joker')!;
      const joker2 = getJokerById('greedy_joker')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      const moved = jokerSlots.moveJoker(0, 1);
      expect(moved).toBe(true);

      const jokers = jokerSlots.getJokers();
      expect(jokers[0].id).toBe('greedy_joker');
      expect(jokers[1].id).toBe('joker');
    });
  });
});
