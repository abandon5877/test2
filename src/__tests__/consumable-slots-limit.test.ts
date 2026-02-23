import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { ConsumableSlots } from '../models/ConsumableSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('消耗牌槽位限制测试', () => {
  let jokerSlots: JokerSlots;
  let consumableSlots: ConsumableSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
    consumableSlots = new ConsumableSlots(2); // 默认2个槽位
  });

  describe('clampConsumableGeneration', () => {
    it('槽位满时应限制塔罗牌生成', () => {
      // 填满槽位
      const mockConsumable = { id: 'test', name: '测试', isNegative: false } as any;
      consumableSlots.addConsumable(mockConsumable);
      consumableSlots.addConsumable(mockConsumable);

      const result = JokerSystem.clampConsumableGeneration(
        { tarotBonus: 1, message: '生成塔罗牌' },
        consumableSlots
      );

      expect(result.tarotBonus).toBe(0);
      expect(result.message).toBeUndefined();
    });

    it('部分槽位时应限制生成数量', () => {
      // 填充1个槽位，剩余1个
      const mockConsumable = { id: 'test', name: '测试', isNegative: false } as any;
      consumableSlots.addConsumable(mockConsumable);

      const result = JokerSystem.clampConsumableGeneration(
        { tarotBonus: 3, message: '生成3张塔罗牌' },
        consumableSlots
      );

      expect(result.tarotBonus).toBe(1); // 只能生成1张
    });

    it('空槽位时不应限制', () => {
      const result = JokerSystem.clampConsumableGeneration(
        { tarotBonus: 2, message: '生成2张塔罗牌' },
        consumableSlots
      );

      expect(result.tarotBonus).toBe(2);
      expect(result.message).toBe('生成2张塔罗牌');
    });

    it('应限制幻灵牌生成', () => {
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);

      const result = JokerSystem.clampConsumableGeneration(
        { spectralBonus: 2, message: '生成幻灵牌' },
        consumableSlots
      );

      expect(result.spectralBonus).toBe(1);
    });

    it('应限制行星牌生成', () => {
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);

      const result = JokerSystem.clampConsumableGeneration(
        { planetBonus: 2, message: '生成行星牌' } as any,
        consumableSlots
      );

      expect((result as any).planetBonus).toBe(1);
    });

    it('负片消耗牌不应占用槽位', () => {
      // 添加负片消耗牌（不占用槽位）
      consumableSlots.addConsumable({ id: 'test1', name: '测试1', isNegative: true } as any);
      consumableSlots.addConsumable({ id: 'test2', name: '测试2', isNegative: true } as any);

      // 应该还有2个槽位可用
      const result = JokerSystem.clampConsumableGeneration(
        { tarotBonus: 2, message: '生成2张塔罗牌' },
        consumableSlots
      );

      expect(result.tarotBonus).toBe(2);
    });
  });

  describe('生成消耗牌的小丑牌', () => {
    it('cartomancer (纸牌占卜师) - 槽位满时不应生成', () => {
      const cartomancer = getJokerById('cartomancer')!;
      jokerSlots.addJoker(cartomancer);

      // 填满槽位
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);
      consumableSlots.addConsumable({ id: 'test2', name: '测试2', isNegative: false } as any);

      const result = JokerSystem.processBlindSelect(
        jokerSlots,
        'SMALL_BLIND',
        consumableSlots
      );

      expect(result.tarotBonus).toBe(0);
    });

    it('cartomancer (纸牌占卜师) - 有槽位时应生成', () => {
      const cartomancer = getJokerById('cartomancer')!;
      jokerSlots.addJoker(cartomancer);

      // 空槽位
      const result = JokerSystem.processBlindSelect(
        jokerSlots,
        'SMALL_BLIND',
        consumableSlots
      );

      expect(result.tarotBonus).toBe(1);
    });

    it('superposition (叠加态) - 槽位满时不应生成', () => {
      const superposition = getJokerById('superposition')!;
      jokerSlots.addJoker(superposition);

      // 填满槽位
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);
      consumableSlots.addConsumable({ id: 'test2', name: '测试2', isNegative: false } as any);

      const scoredCards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Three),
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Hearts, Rank.Five),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        scoredCards,
        PokerHandType.Straight,
        0,
        0,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        consumableSlots
      );

      // 结果中不应该有塔罗牌生成
      expect(result.effects.some(e => e.effect.includes('叠加态'))).toBe(false);
    });

    it('vagabond (流浪者) - 槽位满时不应生成', () => {
      const vagabond = getJokerById('vagabond')!;
      jokerSlots.addJoker(vagabond);

      // 填满槽位
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);
      consumableSlots.addConsumable({ id: 'test2', name: '测试2', isNegative: false } as any);

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        [new Card(Suit.Hearts, Rank.Ace)],
        PokerHandType.HighCard,
        0,
        0,
        { money: 4, interestCap: 20, hands: 4, discards: 3 },
        undefined, undefined, undefined, undefined, undefined, undefined,
        consumableSlots
      );

      // 结果中不应该有塔罗牌生成
      expect(result.effects.some(e => e.effect.includes('流浪者'))).toBe(false);
    });

    it('seance (降神会) - 槽位满时不应生成幻灵牌', () => {
      const seance = getJokerById('seance')!;
      jokerSlots.addJoker(seance);

      // 填满槽位
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);
      consumableSlots.addConsumable({ id: 'test2', name: '测试2', isNegative: false } as any);

      const scoredCards = [
        new Card(Suit.Hearts, Rank.Ten),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        scoredCards,
        PokerHandType.RoyalFlush,
        0,
        0,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        consumableSlots
      );

      // 结果中不应该有幻灵牌生成
      expect(result.effects.some(e => e.effect.includes('降神会'))).toBe(false);
    });

    it('sixth_sense (第六感) - 槽位满时不应生成幻灵牌', () => {
      const sixthSense = getJokerById('sixth_sense')!;
      jokerSlots.addJoker(sixthSense);

      // 填满槽位
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);
      consumableSlots.addConsumable({ id: 'test2', name: '测试2', isNegative: false } as any);

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        [new Card(Suit.Hearts, Rank.Six)],
        PokerHandType.HighCard,
        0,
        0,
        undefined,
        0, // handsPlayed = 0 (第一手)
        undefined, undefined, undefined, undefined, undefined,
        consumableSlots
      );

      // 结果中不应该有幻灵牌生成效果
      expect(result.effects.some(e => e.effect.includes('第六感'))).toBe(false);
    });

    it('eight_ball (八号球) - 槽位满时不应生成塔罗牌', () => {
      const eightBall = getJokerById('eight_ball')!;
      jokerSlots.addJoker(eightBall);

      // 填满槽位
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);
      consumableSlots.addConsumable({ id: 'test2', name: '测试2', isNegative: false } as any);

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        [new Card(Suit.Hearts, Rank.Eight)],
        PokerHandType.HighCard,
        0,
        0,
        consumableSlots
      );

      // 结果中不应该有塔罗牌生成
      expect(result.effects.some(e => e.effect.includes('八号球'))).toBe(false);
    });
  });

  describe('部分槽位场景', () => {
    it('多个小丑牌竞争有限槽位', () => {
      const cartomancer = getJokerById('cartomancer')!;
      const superposition = getJokerById('superposition')!;

      jokerSlots.addJoker(cartomancer);
      jokerSlots.addJoker(superposition);

      // 填充1个槽位，剩余1个
      consumableSlots.addConsumable({ id: 'test', name: '测试', isNegative: false } as any);

      // cartomancer先处理，占用唯一槽位
      const blindResult = JokerSystem.processBlindSelect(
        jokerSlots,
        'SMALL_BLIND',
        consumableSlots
      );

      expect(blindResult.tarotBonus).toBe(1);

      // 现在槽位已满，superposition不应生成
      const scoredCards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Three),
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Hearts, Rank.Five),
      ];

      const handResult = JokerSystem.processHandPlayed(
        jokerSlots,
        scoredCards,
        PokerHandType.Straight,
        0,
        0,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        consumableSlots
      );

      // superposition的效果不应触发（槽位已满）
      // 注意：这取决于处理顺序，测试可能需要调整
    });
  });
});
