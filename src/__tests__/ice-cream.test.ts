import { describe, it, expect, beforeEach } from 'vitest';
import { getJokerById } from '../data/jokers';
import { JokerSlots } from '../models/JokerSlots';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { ScoringSystem } from '../systems/ScoringSystem';

describe('冰淇淋(Ice Cream)测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  it('应该正确添加冰淇淋小丑牌', () => {
    const iceCream = getJokerById('ice_cream');
    expect(iceCream).toBeDefined();
    expect(iceCream?.name).toBe('冰淇淋');
    expect(iceCream?.description).toBe('+100筹码，每出牌一次-5筹码');
  });

  it('冰淇淋第一次出牌应该+100筹码', () => {
    const iceCream = getJokerById('ice_cream')!;
    jokerSlots.addJoker(iceCream);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.King)
    ];

    // 第一次出牌
    const result1 = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
    
    // 验证第一次有+100筹码效果
    const iceCreamEffect1 = result1.jokerEffects?.find(e => e.jokerName === '冰淇淋');
    expect(iceCreamEffect1).toBeDefined();
    expect(iceCreamEffect1?.chipBonus).toBe(100);
  });

  it('冰淇淋第二次出牌应该+95筹码', () => {
    const iceCream = getJokerById('ice_cream')!;
    jokerSlots.addJoker(iceCream);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.King)
    ];

    // 第一次出牌（实际出牌，更新状态）
    ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
    
    // 第二次出牌
    const result2 = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
    
    // 验证第二次有+95筹码效果
    const iceCreamEffect2 = result2.jokerEffects?.find(e => e.jokerName === '冰淇淋');
    expect(iceCreamEffect2).toBeDefined();
    expect(iceCreamEffect2?.chipBonus).toBe(95);
  });

  it('预览时不应该更新冰淇淋状态', () => {
    const iceCream = getJokerById('ice_cream')!;
    jokerSlots.addJoker(iceCream);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.King)
    ];

    // 第一次实际出牌
    ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
    
    // 预览多次（不应该更新状态）
    for (let i = 0; i < 5; i++) {
      ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
    }
    
    // 第二次实际出牌（应该还是+95，不是+70）
    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
    
    const iceCreamEffect = result.jokerEffects?.find(e => e.jokerName === '冰淇淋');
    expect(iceCreamEffect).toBeDefined();
    expect(iceCreamEffect?.chipBonus).toBe(95);
  });

  it('冰淇淋筹码不应该低于0', () => {
    const iceCream = getJokerById('ice_cream')!;
    jokerSlots.addJoker(iceCream);

    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.King)
    ];

    // 出25次牌（100/5=20次后应该降为0）
    for (let i = 0; i < 25; i++) {
      ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
    }
    
    // 验证筹码不低于0
    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
    
    const iceCreamEffect = result.jokerEffects?.find(e => e.jokerName === '冰淇淋');
    expect(iceCreamEffect).toBeDefined();
    expect(iceCreamEffect?.chipBonus).toBe(0);
  });
});
