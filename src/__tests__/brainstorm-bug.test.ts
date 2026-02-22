import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';
import { PokerHandType } from '../types/pokerHands';

describe('头脑风暴重复计算问题', () => {
  it('头脑风暴不应重复计算最左侧小丑的效果', () => {
    const jokerSlots = new JokerSlots(5);
    const jolly = getJokerById('jolly_joker')!; // 对子+8倍率
    const brainstorm = getJokerById('brainstorm')!;

    // 顺序：开心小丑(左), 头脑风暴(右)
    jokerSlots.addJoker(jolly);
    jokerSlots.addJoker(brainstorm);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.Ace),
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    console.log('所有小丑效果:', result.jokerEffects?.map(e => ({
      name: e.jokerName,
      effect: e.effect,
      multBonus: e.multBonus
    })));

    // 开心小丑应该只触发一次（+8）
    // 头脑风暴复制开心小丑的效果（+8）
    // 总共应该是 +16，不是 +24

    const jollyEffects = result.jokerEffects?.filter(e => e.jokerName === '开心小丑');
    const brainstormEffects = result.jokerEffects?.filter(e => e.jokerName === '头脑风暴');

    console.log('开心小丑效果数量:', jollyEffects?.length);
    console.log('头脑风暴效果数量:', brainstormEffects?.length);
    console.log('总倍率加成:', result.multBonus);

    // 开心小丑应该只有一个效果（它自己的）
    expect(jollyEffects?.length).toBe(1);

    // 头脑风暴应该只有一个复制效果
    expect(brainstormEffects?.length).toBe(1);

    // 总倍率应该是 8 (jolly) + 8 (brainstorm复制) = 16
    // 基础倍率是2，所以总倍率应该是 2 + 16 = 18
    expect(result.multBonus).toBe(16);
  });

  it('只有头脑风暴和开心小丑时的总倍率', () => {
    const jokerSlots = new JokerSlots(5);
    const jolly = getJokerById('jolly_joker')!;
    const brainstorm = getJokerById('brainstorm')!;

    jokerSlots.addJoker(jolly);
    jokerSlots.addJoker(brainstorm);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.Ace),
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    console.log('总倍率:', result.totalMultiplier);
    console.log('倍率加成:', result.multBonus);

    // 基础倍率 2 + 开心小丑 8 + 头脑风暴复制 8 = 18
    expect(result.totalMultiplier).toBe(18);
  });
});
