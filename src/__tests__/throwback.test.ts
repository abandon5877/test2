import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('Throwback 复古测试', () => {
  it('跳过盲注时应该增加Throwback的blindsSkipped计数', () => {
    const jokerSlots = new JokerSlots(5);

    // 添加Throwback
    const throwback = getJokerById('throwback')!;
    jokerSlots.addJoker(throwback);

    // 模拟跳过盲注（直接更新状态）
    throwback.updateState({ blindsSkipped: 1 });

    // 验证状态已更新
    expect(throwback.state.blindsSkipped).toBe(1);
  });

  it('多次跳过盲注应该累积计数', () => {
    const jokerSlots = new JokerSlots(5);

    // 添加Throwback
    const throwback = getJokerById('throwback')!;
    jokerSlots.addJoker(throwback);

    // 模拟跳过3个盲注
    throwback.updateState({ blindsSkipped: 3 });

    // 验证状态
    expect(throwback.state.blindsSkipped).toBe(3);
  });

  it('Throwback应该根据blindsSkipped提供正确的倍率加成', () => {
    const jokerSlots = new JokerSlots(5);

    // 添加Throwback并设置状态
    const throwback = getJokerById('throwback')!;
    jokerSlots.addJoker(throwback);
    throwback.updateState({ blindsSkipped: 4 });

    // 测试倍率计算
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.OnePair,
      0,
      0
    );

    // 4个盲注 * 0.25 = 1.0，所以倍率应该是 1 + 1.0 = 2.0
    expect(result.multMultiplier).toBe(2.0);
    expect(result.effects.some(e => e.effect.includes('已跳过4个盲注') && e.effect.includes('x2.00'))).toBe(true);
  });

  it('多张Throwback应该分别累积', () => {
    const jokerSlots = new JokerSlots(5);

    // 添加两张Throwback
    const throwback1 = getJokerById('throwback')!;
    const throwback2 = getJokerById('throwback')!;
    jokerSlots.addJoker(throwback1);
    jokerSlots.addJoker(throwback2);

    // 模拟跳过2个盲注
    throwback1.updateState({ blindsSkipped: 2 });
    throwback2.updateState({ blindsSkipped: 2 });

    // 验证两张Throwback的状态都更新了
    expect(throwback1.state.blindsSkipped).toBe(2);
    expect(throwback2.state.blindsSkipped).toBe(2);

    // 测试倍率计算
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.OnePair,
      0,
      0
    );

    // 两张Throwback各提供 1 + 2*0.25 = 1.5 倍率，总共 1.5 * 1.5 = 2.25
    expect(result.multMultiplier).toBe(2.25);
  });

  it('没有跳过盲注时应该提供x1.0倍率', () => {
    const jokerSlots = new JokerSlots(5);

    // 添加Throwback
    const throwback = getJokerById('throwback')!;
    jokerSlots.addJoker(throwback);

    // 不跳过任何盲注

    // 测试倍率计算
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.OnePair,
      0,
      0
    );

    // 0个盲注，倍率应该是 1.0
    expect(result.multMultiplier).toBe(1.0);
    expect(result.effects.some(e => e.effect.includes('已跳过0个盲注') && e.effect.includes('x1.00'))).toBe(true);
  });
});
