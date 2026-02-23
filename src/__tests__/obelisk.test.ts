import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { BossState } from '../models/BossState';

describe('Obelisk 方尖碑测试', () => {
  it('不出最常出牌型时应该增加连击数', () => {
    const jokerSlots = new JokerSlots(5);
    const bossState = new BossState();

    // 添加Obelisk
    const obelisk = getJokerById('obelisk')!;
    jokerSlots.addJoker(obelisk);

    // 模拟出牌历史：对子是最常出的牌型
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.HighCard);

    // 当前最常出牌型是对子
    expect(bossState.getMostPlayedHand()).toBe(PokerHandType.OnePair);

    // 出三条（不是最常出的）
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.ThreeOfAKind,
      0,
      0,
      undefined, // gameState
      undefined, // handsPlayed
      undefined, // discardsUsed
      undefined, // deckSize
      undefined, // initialDeckSize
      undefined, // handsRemaining
      bossState.getMostPlayedHand() // mostPlayedHand
    );

    // 应该增加连击数，倍率应该是 1 + 1*0.2 = 1.2
    expect(result.multMultiplier).toBe(1.2);
    expect(result.effects.some(e => e.effect.includes('连续1手') && e.effect.includes('x1.2'))).toBe(true);

    // 验证状态已更新
    expect(obelisk.state.streak).toBe(1);
  });

  it('连续不出最常出牌型应该累积连击数', () => {
    const jokerSlots = new JokerSlots(5);
    const bossState = new BossState();

    // 添加Obelisk并设置初始连击数
    const obelisk = getJokerById('obelisk')!;
    jokerSlots.addJoker(obelisk);
    obelisk.updateState({ streak: 2 });

    // 模拟出牌历史：对子是最常出的牌型
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.OnePair);

    // 出三条（不是最常出的）
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.ThreeOfAKind,
      0,
      0,
      undefined, // gameState
      undefined, // handsPlayed
      undefined, // discardsUsed
      undefined, // deckSize
      undefined, // initialDeckSize
      undefined, // handsRemaining
      bossState.getMostPlayedHand() // mostPlayedHand
    );

    // 连击数增加到3，倍率应该是 1 + 3*0.2 = 1.6
    expect(result.multMultiplier).toBe(1.6);
    expect(result.effects.some(e => e.effect.includes('连续3手') && e.effect.includes('x1.6'))).toBe(true);

    // 验证状态已更新
    expect(obelisk.state.streak).toBe(3);
  });

  it('出最常出牌型时应该重置连击数', () => {
    const jokerSlots = new JokerSlots(5);
    const bossState = new BossState();

    // 添加Obelisk并设置初始连击数
    const obelisk = getJokerById('obelisk')!;
    jokerSlots.addJoker(obelisk);
    obelisk.updateState({ streak: 3 });

    // 模拟出牌历史：对子是最常出的牌型
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.OnePair);

    // 出对子（是最常出的）
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
      undefined, // handsPlayed
      undefined, // discardsUsed
      undefined, // deckSize
      undefined, // initialDeckSize
      undefined, // handsRemaining
      bossState.getMostPlayedHand() // mostPlayedHand
    );

    // 应该重置连击数
    expect(obelisk.state.streak).toBe(0);
  });

  it('没有最常出牌型时不应触发效果', () => {
    const jokerSlots = new JokerSlots(5);
    const bossState = new BossState();

    // 添加Obelisk
    const obelisk = getJokerById('obelisk')!;
    jokerSlots.addJoker(obelisk);

    // 没有出牌历史，所以最常出牌型为null
    expect(bossState.getMostPlayedHand()).toBeNull();

    // 出对子
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
      undefined, // handsPlayed
      undefined, // discardsUsed
      undefined, // deckSize
      undefined, // initialDeckSize
      undefined, // handsRemaining
      bossState.getMostPlayedHand() // mostPlayedHand
    );

    // 没有最常出牌型，不应触发效果
    expect(result.multMultiplier).toBe(1);
    expect(result.effects.some(e => e.effect.includes('方尖碑'))).toBe(false);
  });

  it('多张Obelisk应该分别累积连击数', () => {
    const jokerSlots = new JokerSlots(5);
    const bossState = new BossState();

    // 添加两张Obelisk
    const obelisk1 = getJokerById('obelisk')!;
    const obelisk2 = getJokerById('obelisk')!;
    jokerSlots.addJoker(obelisk1);
    jokerSlots.addJoker(obelisk2);

    // 模拟出牌历史：对子是最常出的牌型
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.OnePair);

    // 出三条（不是最常出的）
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.ThreeOfAKind,
      0,
      0,
      undefined, // gameState
      undefined, // handsPlayed
      undefined, // discardsUsed
      undefined, // deckSize
      undefined, // initialDeckSize
      undefined, // handsRemaining
      bossState.getMostPlayedHand() // mostPlayedHand
    );

    // 两张Obelisk各提供 1.2 倍率，总共 1.2 * 1.2 = 1.44
    expect(result.multMultiplier).toBeCloseTo(1.44, 2);

    // 验证两张Obelisk的状态都更新了
    expect(obelisk1.state.streak).toBe(1);
    expect(obelisk2.state.streak).toBe(1);
  });
});
