import { describe, it, expect } from 'vitest';
import { JOKERS, getJokerById } from '../data/jokers';
import { JokerTrigger } from '../types/joker';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

/**
 * 小丑牌回调一致性测试
 * 确保所有小丑牌的 trigger 与回调函数正确匹配
 * 防止出现 effect 与 trigger 不匹配导致效果不生效的问题
 */
describe('小丑牌回调一致性检查', () => {
  it('所有小丑牌都应该有有效的 trigger', () => {
    for (const joker of JOKERS) {
      expect(joker.trigger).toBeDefined();
      expect(Object.values(JokerTrigger)).toContain(joker.trigger);
    }
  });

  it('所有小丑牌都应该有 effect 函数', () => {
    const jokersWithoutEffect = JOKERS.filter(j => typeof j.effect !== 'function');
    if (jokersWithoutEffect.length > 0) {
      console.log('Jokers without effect:', jokersWithoutEffect.map(j => ({ id: j.id, name: j.name, trigger: j.trigger })));
    }
    expect(jokersWithoutEffect).toHaveLength(0);
  });

  it('ON_SCORED 触发器的小丑牌应该可以通过 onScored 调用', () => {
    const jokers = JOKERS.filter(j => j.trigger === JokerTrigger.ON_SCORED);
    expect(jokers.length).toBeGreaterThan(0);

    for (const joker of jokers) {
      const result = joker.onScored({
        scoredCards: [new Card(Suit.Spades, Rank.Ace)],
        handType: PokerHandType.HighCard
      });
      // 应该返回对象，不抛出错误
      expect(typeof result).toBe('object');
    }
  });

  it('ON_HAND_PLAYED 触发器的小丑牌应该可以通过 onHandPlayed 调用', () => {
    const jokers = JOKERS.filter(j => j.trigger === JokerTrigger.ON_HAND_PLAYED);
    expect(jokers.length).toBeGreaterThan(0);

    for (const joker of jokers) {
      const result = joker.onHandPlayed({
        scoredCards: [new Card(Suit.Spades, Rank.Ace)],
        handType: PokerHandType.HighCard
      });
      // 应该返回对象，不抛出错误
      expect(typeof result).toBe('object');
    }
  });

  it('ON_PLAY 触发器的小丑牌应该可以通过 onPlay 调用', () => {
    const jokers = JOKERS.filter(j => j.trigger === JokerTrigger.ON_PLAY);
    expect(jokers.length).toBeGreaterThan(0);

    for (const joker of jokers) {
      const result = joker.onPlay({});
      // 应该返回对象，不抛出错误
      expect(typeof result).toBe('object');
    }
  });

  it('ON_HELD 触发器的小丑牌应该可以通过 onHeld 调用', () => {
    const jokers = JOKERS.filter(j => j.trigger === JokerTrigger.ON_HELD);
    expect(jokers.length).toBeGreaterThan(0);

    for (const joker of jokers) {
      const result = joker.onHeld({
        heldCards: [new Card(Suit.Hearts, Rank.King)]
      });
      // 应该返回对象，不抛出错误
      expect(typeof result).toBe('object');
    }
  });

  it('END_OF_ROUND 触发器的小丑牌应该可以通过 onEndRound 调用', () => {
    const jokers = JOKERS.filter(j => j.trigger === JokerTrigger.END_OF_ROUND);
    expect(jokers.length).toBeGreaterThan(0);

    for (const joker of jokers) {
      const result = joker.onEndRound({});
      // 应该返回对象，不抛出错误
      expect(typeof result).toBe('object');
    }
  });

  it('ON_REROLL 触发器的小丑牌应该可以通过 onReroll 调用', () => {
    const jokers = JOKERS.filter(j => j.trigger === JokerTrigger.ON_REROLL);

    for (const joker of jokers) {
      const result = joker.onReroll({});
      // 应该返回对象，不抛出错误
      expect(typeof result).toBe('object');
    }
  });

  it('ON_BLIND_SELECT 触发器的小丑牌应该可以通过 onBlindSelect 调用', () => {
    const jokers = JOKERS.filter(j => j.trigger === JokerTrigger.ON_BLIND_SELECT);

    for (const joker of jokers) {
      const result = joker.onBlindSelect({});
      // 应该返回对象，不抛出错误
      expect(typeof result).toBe('object');
    }
  });
});

describe('小丑牌效果在计分系统中正确触发', () => {
  it('ON_PLAY 触发器的小丑牌效果应该在计分时生效', () => {
    const jokerSlots = new JokerSlots();
    const joker = getJokerById('gros_michel')!; // 大麦克
    jokerSlots.addJoker(joker);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.King)
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    // 应该有大麦克的效果
    const grosMichelEffect = result.jokerEffects?.find(e => e.jokerName === '大麦克');
    expect(grosMichelEffect).toBeDefined();
    expect(grosMichelEffect?.multBonus).toBe(15);
  });

  it('ON_HAND_PLAYED 触发器的小丑牌效果应该在计分时生效', () => {
    const jokerSlots = new JokerSlots();
    const joker = getJokerById('jolly_joker')!; // 开心小丑
    jokerSlots.addJoker(joker);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.Ace)
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    // 应该有开心小丑的效果
    const jollyEffect = result.jokerEffects?.find(e => e.jokerName === '开心小丑');
    expect(jollyEffect).toBeDefined();
    expect(jollyEffect?.multBonus).toBe(8);
  });

  it('ON_SCORED 触发器的小丑牌效果应该在计分时生效', () => {
    const jokerSlots = new JokerSlots();
    const joker = getJokerById('lusty_joker')!; // 色欲小丑
    jokerSlots.addJoker(joker);

    // 使用5张红桃形成同花，确保所有卡牌都被计分
    const cards = [
      new Card(Suit.Hearts, Rank.Two),
      new Card(Suit.Hearts, Rank.Three),
      new Card(Suit.Hearts, Rank.Four),
      new Card(Suit.Hearts, Rank.Five),
      new Card(Suit.Hearts, Rank.Six)
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    // 应该有色欲小丑的效果（5张红桃）
    const lustyEffect = result.jokerEffects?.find(e => e.jokerName === '色欲小丑');
    expect(lustyEffect).toBeDefined();
    expect(lustyEffect?.multBonus).toBe(15); // 5张红桃 * 3
  });

  it('ON_HELD 触发器的小丑牌效果应该在计分时生效', () => {
    const jokerSlots = new JokerSlots();
    const joker = getJokerById('baron')!; // 男爵
    jokerSlots.addJoker(joker);

    const scoredCards = [
      new Card(Suit.Spades, Rank.Ten),
      new Card(Suit.Hearts, Rank.Nine)
    ];

    const heldCards = [
      new Card(Suit.Hearts, Rank.King), // 人头牌
      new Card(Suit.Clubs, Rank.Queen)  // 人头牌
    ];

    const result = ScoringSystem.calculate(scoredCards, undefined, undefined, heldCards, jokerSlots);

    // 应该有男爵的效果
    const baronEffect = result.jokerEffects?.find(e => e.jokerName === '男爵');
    expect(baronEffect).toBeDefined();
  });
});
