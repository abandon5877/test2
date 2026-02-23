import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('Supernova 超新星测试', () => {
  it('应该使用牌型历史次数，不是本回合出牌次数', () => {
    const jokerSlots = new JokerSlots(5);
    const supernova = getJokerById('supernova')!;
    jokerSlots.addJoker(supernova);

    // 模拟出牌：对子，历史次数为3（之前出过3次对子）
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.OnePair,
      0,
      0,
      undefined, // gameState
      5, // handsPlayed（本回合出牌5次）
      undefined, // discardsUsed
      undefined, // deckSize
      undefined, // initialDeckSize
      undefined, // handsRemaining
      undefined, // mostPlayedHand
      undefined, // consumableSlots
      3 // handTypeHistoryCount（历史次数为3）
    );

    // 应该使用历史次数3，不是本回合出牌次数5
    expect(result.multBonus).toBe(3);
    expect(result.effects.some(e => e.effect.includes('该牌型出过3次'))).toBe(true);
  });

  it('历史次数为0时不应触发效果', () => {
    const jokerSlots = new JokerSlots(5);
    const supernova = getJokerById('supernova')!;
    jokerSlots.addJoker(supernova);

    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.OnePair,
      0,
      0,
      undefined,
      5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      0 // 历史次数为0
    );

    // 历史次数为0，不应触发效果
    expect(result.multBonus).toBe(0);
    expect(result.effects.some(e => e.effect.includes('超新星'))).toBe(false);
  });

  it('历史次数为1时应该+1倍率', () => {
    const jokerSlots = new JokerSlots(5);
    const supernova = getJokerById('supernova')!;
    jokerSlots.addJoker(supernova);

    const scoredCards = [
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Diamonds, Rank.King),
      new Card(Suit.Clubs, Rank.King),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.ThreeOfAKind,
      0,
      0,
      undefined,
      2, // 本回合出牌2次
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1 // 历史次数为1
    );

    // 应该使用历史次数1
    expect(result.multBonus).toBe(1);
    expect(result.effects.some(e => e.effect.includes('该牌型出过1次'))).toBe(true);
  });

  it('不同牌型应该分别统计（通过不同历史次数验证）', () => {
    const jokerSlots = new JokerSlots(5);
    const supernova = getJokerById('supernova')!;
    jokerSlots.addJoker(supernova);

    // 第一次出对子，历史次数为5
    const pairCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result1 = JokerSystem.processHandPlayed(
      jokerSlots,
      pairCards,
      PokerHandType.OnePair,
      0,
      0,
      undefined,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      5 // 对子历史次数为5
    );

    expect(result1.multBonus).toBe(5);

    // 第二次出三条，历史次数为2
    const threeOfAKindCards = [
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Diamonds, Rank.King),
      new Card(Suit.Clubs, Rank.King),
    ];

    const result2 = JokerSystem.processHandPlayed(
      jokerSlots,
      threeOfAKindCards,
      PokerHandType.ThreeOfAKind,
      0,
      0,
      undefined,
      2,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      2 // 三条历史次数为2
    );

    // 应该使用各自的历史次数
    expect(result2.multBonus).toBe(2);
  });
});
