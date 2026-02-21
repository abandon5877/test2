import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { JokerEdition } from '../types/joker';
import { getJokerById } from '../data/jokers';

describe('小丑牌组合效果测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('同类型小丑牌组合', () => {
    it('两张 Joker 应同时生效', () => {
      const joker1 = getJokerById('joker')!;
      const joker2 = getJokerById('joker')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effects = result.jokerEffects!.filter(e => e.jokerName === '小丑');
      
      expect(effects).toHaveLength(2);
      expect(effects[0]!.multBonus).toBe(4);
      expect(effects[1]!.multBonus).toBe(4);
    });

    it('两张 Greedy Joker 应同时生效', () => {
      const joker1 = getJokerById('greedy_joker')!;
      const joker2 = getJokerById('greedy_joker')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      // 使用5张方片组成同花，这样所有牌都是计分牌
      const cards = [
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack),
        new Card(Suit.Diamonds, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effects = result.jokerEffects!.filter(e => e.jokerName === '贪婪小丑');
      
      expect(effects).toHaveLength(2);
      // 5张方片 * 3倍率 = 15，每张Greedy Joker
      expect(effects[0]!.multBonus).toBe(15);
      expect(effects[1]!.multBonus).toBe(15);
    });
  });

  describe('不同类型小丑牌组合', () => {
    it('Joker + Greedy Joker', () => {
      const joker1 = getJokerById('joker')!;
      const joker2 = getJokerById('greedy_joker')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      // 使用5张方片组成同花，这样所有牌都是计分牌
      const cards = [
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack),
        new Card(Suit.Diamonds, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      
      const baseJokerEffect = result.jokerEffects!.find(e => e.jokerName === '小丑');
      const greedyEffect = result.jokerEffects!.find(e => e.jokerName === '贪婪小丑');
      
      expect(baseJokerEffect).toBeDefined();
      expect(baseJokerEffect!.multBonus).toBe(4);
      expect(greedyEffect).toBeDefined();
      expect(greedyEffect!.multBonus).toBe(15); // 5张方片 * 3
    });

    it('Lusty Joker + Wrathful Joker', () => {
      const joker1 = getJokerById('lusty_joker')!;
      const joker2 = getJokerById('wrathful_joker')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      // 使用同花顺包含红桃和黑桃，这样所有牌都是计分牌
      const cards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      
      const lustyEffect = result.jokerEffects!.find(e => e.jokerName === '色欲小丑');
      const wrathfulEffect = result.jokerEffects!.find(e => e.jokerName === '暴怒小丑');
      
      expect(lustyEffect).toBeDefined();
      expect(lustyEffect!.multBonus).toBe(6); // 2张红桃 * 3
      expect(wrathfulEffect).toBeDefined();
      expect(wrathfulEffect!.multBonus).toBe(9); // 3张黑桃 * 3
    });

    it('Jolly Joker + Sly Joker (对子组合)', () => {
      const joker1 = getJokerById('jolly_joker')!;
      const joker2 = getJokerById('sly_joker')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      
      const jollyEffect = result.jokerEffects!.find(e => e.jokerName === '开心小丑');
      const slyEffect = result.jokerEffects!.find(e => e.jokerName === '狡猾小丑');
      
      expect(jollyEffect).toBeDefined();
      expect(jollyEffect!.multBonus).toBe(8);
      expect(slyEffect).toBeDefined();
      expect(slyEffect!.chipBonus).toBe(50);
    });
  });

  describe('版本效果组合', () => {
    it('Foil 版本应额外+50筹码', () => {
      const joker = getJokerById('joker')!;
      joker.edition = JokerEdition.Foil;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // Foil版本应该额外+50筹码 (基础16 + 50 = 66)
      expect(result.totalChips).toBe(66);
    });

    it('Holographic 版本应额外+10倍率', () => {
      const joker = getJokerById('joker')!;
      joker.edition = JokerEdition.Holographic;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      const effect = result.jokerEffects!.find(e => e.jokerName === '小丑');
      expect(effect).toBeDefined();
      // Holographic +10倍率 (不包含在multBonus中，而是单独计算)
      expect(effect!.multBonus).toBe(10);
    });

    it('Polychrome 版本应x1.5倍率', () => {
      const joker = getJokerById('joker')!;
      joker.edition = JokerEdition.Polychrome;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      
      const effect = result.jokerEffects!.find(e => e.jokerName === '小丑');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(1.5);
    });
  });

  describe('复杂场景 - 5张小丑牌同时生效', () => {
    it('5张不同小丑牌组合', () => {
      // 添加5张不同的小丑牌
      jokerSlots.addJoker(getJokerById('joker')!); // +4 Mult
      jokerSlots.addJoker(getJokerById('greedy_joker')!); // 方片+3 Mult
      jokerSlots.addJoker(getJokerById('lusty_joker')!); // 红桃+3 Mult
      jokerSlots.addJoker(getJokerById('jolly_joker')!); // 对子+8 Mult
      jokerSlots.addJoker(getJokerById('sly_joker')!); // 对子+50 Chips

      // 使用对子，包含方片和红桃
      const cards = [
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      
      // 验证所有小丑牌都生效
      expect(result.jokerEffects).toHaveLength(5);
      
      const baseJoker = result.jokerEffects!.find(e => e.jokerName === '小丑');
      const greedy = result.jokerEffects!.find(e => e.jokerName === '贪婪小丑');
      const lusty = result.jokerEffects!.find(e => e.jokerName === '色欲小丑');
      const jolly = result.jokerEffects!.find(e => e.jokerName === '开心小丑');
      const sly = result.jokerEffects!.find(e => e.jokerName === '狡猾小丑');
      
      expect(baseJoker).toBeDefined();
      expect(greedy).toBeDefined(); // 1张方片
      expect(lusty).toBeDefined(); // 1张红桃
      expect(jolly).toBeDefined(); // 对子
      expect(sly).toBeDefined(); // 对子
    });
  });

  describe('倍率乘数组合', () => {
    it('多张小丑牌倍率乘数应相乘', () => {
      // Cavendish x3 Mult
      const cavendish = getJokerById('cavendish')!;
      jokerSlots.addJoker(cavendish);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      
      const effect = result.jokerEffects!.find(e => e.jokerName === '卡文迪什');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(3);
    });
  });

  describe('边界条件 - 无小丑牌', () => {
    it('无小丑牌时应正常计分', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards);
      
      expect(result.jokerEffects).toHaveLength(0);
      expect(result.totalScore).toBeGreaterThan(0);
    });
  });
});
