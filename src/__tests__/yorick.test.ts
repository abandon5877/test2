import { describe, it, expect } from 'vitest';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('约里克 (Yorick) 测试', () => {
  it('预览模式不应更新约里克的状态', () => {
    const jokerSlots = new JokerSlots(5);

    // 创建约里克并设置初始状态（已弃掉23张牌）
    const yorick = new Joker({
      id: 'yorick',
      name: '约里克',
      description: '每弃掉23张牌，获得x1倍率',
      rarity: JokerRarity.LEGENDARY,
      cost: 20,
      trigger: JokerTrigger.ON_HAND_PLAYED,
      effect: (context) => {
        const jokerState = (context as unknown as { jokerState?: { totalDiscarded?: number } }).jokerState || {};
        const cardsDiscardedThisRound = context.cardsDiscarded || 0;
        const totalDiscarded = (jokerState.totalDiscarded || 0) + cardsDiscardedThisRound;
        const multiplier = 1 + Math.floor(totalDiscarded / 23);

        return {
          multMultiplier: multiplier,
          message: `约里克: 已弃${totalDiscarded}张牌 x${multiplier}倍率`,
          stateUpdate: { totalDiscarded }
        };
      }
    });

    // 设置初始状态：已经弃掉23张牌
    yorick.updateState({ totalDiscarded: 23 });
    jokerSlots.addJoker(yorick);

    // 创建测试用的牌
    const cards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.King)
    ];

    // 第一次预览（本回合弃了5张牌）
    const previewResult1 = JokerSystem.processHandPlayed(
      jokerSlots,
      cards,
      PokerHandType.HighCard,
      100,
      10,
      undefined,
      1,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true, // 预览模式
      cards,
      5 // 本回合弃了5张牌
    );

    // 预览时应显示正确的倍率：已弃23 + 本回合5 = 28张，28/23 = 1，倍率 = 1 + 1 = 2
    expect(previewResult1.multMultiplier).toBe(2);

    // 验证状态没有被更新（仍然是23）
    expect(yorick.getState().totalDiscarded).toBe(23);

    // 第二次预览（再次预览，本回合弃了5张牌）
    const previewResult2 = JokerSystem.processHandPlayed(
      jokerSlots,
      cards,
      PokerHandType.HighCard,
      100,
      10,
      undefined,
      1,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true, // 预览模式
      cards,
      5 // 本回合弃了5张牌
    );

    // 预览结果应该相同
    expect(previewResult2.multMultiplier).toBe(2);

    // 状态仍然没有被更新
    expect(yorick.getState().totalDiscarded).toBe(23);
  });

  it('非预览模式应更新约里克的状态', () => {
    const jokerSlots = new JokerSlots(5);

    // 创建约里克
    const yorick = new Joker({
      id: 'yorick',
      name: '约里克',
      description: '每弃掉23张牌，获得x1倍率',
      rarity: JokerRarity.LEGENDARY,
      cost: 20,
      trigger: JokerTrigger.ON_HAND_PLAYED,
      effect: (context) => {
        const jokerState = (context as unknown as { jokerState?: { totalDiscarded?: number } }).jokerState || {};
        const cardsDiscardedThisRound = context.cardsDiscarded || 0;
        const totalDiscarded = (jokerState.totalDiscarded || 0) + cardsDiscardedThisRound;
        const multiplier = 1 + Math.floor(totalDiscarded / 23);

        return {
          multMultiplier: multiplier,
          message: `约里克: 已弃${totalDiscarded}张牌 x${multiplier}倍率`,
          stateUpdate: { totalDiscarded }
        };
      }
    });

    // 设置初始状态：已经弃掉23张牌
    yorick.updateState({ totalDiscarded: 23 });
    jokerSlots.addJoker(yorick);

    // 创建测试用的牌
    const cards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.King)
    ];

    // 非预览模式（本回合弃了5张牌）
    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      cards,
      PokerHandType.HighCard,
      100,
      10,
      undefined,
      1,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false, // 非预览模式
      cards,
      5 // 本回合弃了5张牌
    );

    // 应显示正确的倍率：已弃23 + 本回合5 = 28张，28/23 = 1，倍率 = 1 + 1 = 2
    expect(result.multMultiplier).toBe(2);

    // 验证状态已被更新（23 + 5 = 28）
    expect(yorick.getState().totalDiscarded).toBe(28);
  });

  it('约里克应正确计算倍率：每23张牌+1倍率', () => {
    const jokerSlots = new JokerSlots(5);

    // 创建约里克
    const yorick = new Joker({
      id: 'yorick',
      name: '约里克',
      description: '每弃掉23张牌，获得x1倍率',
      rarity: JokerRarity.LEGENDARY,
      cost: 20,
      trigger: JokerTrigger.ON_HAND_PLAYED,
      effect: (context) => {
        const jokerState = (context as unknown as { jokerState?: { totalDiscarded?: number } }).jokerState || {};
        const cardsDiscardedThisRound = context.cardsDiscarded || 0;
        const totalDiscarded = (jokerState.totalDiscarded || 0) + cardsDiscardedThisRound;
        const multiplier = 1 + Math.floor(totalDiscarded / 23);

        return {
          multMultiplier: multiplier,
          message: `约里克: 已弃${totalDiscarded}张牌 x${multiplier}倍率`,
          stateUpdate: { totalDiscarded }
        };
      }
    });

    jokerSlots.addJoker(yorick);

    const cards = [new Card(Suit.Hearts, Rank.Ace)];

    // 测试不同弃牌数量的倍率计算
    const testCases = [
      { discarded: 0, expectedMultiplier: 1 },    // 0张: 1 + 0 = 1
      { discarded: 22, expectedMultiplier: 1 },   // 22张: 1 + 0 = 1
      { discarded: 23, expectedMultiplier: 2 },   // 23张: 1 + 1 = 2
      { discarded: 45, expectedMultiplier: 2 },   // 45张: 1 + 1 = 2
      { discarded: 46, expectedMultiplier: 3 },   // 46张: 1 + 2 = 3
      { discarded: 69, expectedMultiplier: 4 },   // 69张: 1 + 3 = 4
    ];

    for (const testCase of testCases) {
      // 设置已弃牌数
      yorick.updateState({ totalDiscarded: testCase.discarded });

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.HighCard,
        100,
        10,
        undefined,
        1,
        1,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true, // 预览模式
        cards,
        0 // 本回合弃0张
      );

      expect(result.multMultiplier).toBe(testCase.expectedMultiplier);
    }
  });
});
