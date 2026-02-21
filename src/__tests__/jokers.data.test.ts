import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { JOKERS, getJokerById } from '../data/jokers';

describe('小丑牌数据文件测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
      });

  describe('ON_SCORED触发器类小丑牌', () => {
    it('暴怒小丑: 每张黑桃+3倍率', () => {
      const joker = getJokerById('wrathful_joker')!;
      jokerSlots.addJoker(joker);

      // 使用三条，这样三张牌都会计分
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 暴怒小丑结果:', {
        jokerEffects: result.jokerEffects,
        totalMult: result.totalMultiplier,
        baseMult: result.baseMultiplier
      });

      // 验证小丑牌效果被触发
      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      // 验证倍率加成正确 (3张黑桃 * 3 = 9)
      const wrathfulEffect = result.jokerEffects!.find(e => e.jokerName === '暴怒小丑');
      expect(wrathfulEffect).toBeDefined();
      expect(wrathfulEffect!.multBonus).toBe(9);
    });

    it('色欲小丑: 每张红桃+3倍率', () => {
      const joker = getJokerById('lusty_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 色欲小丑结果:', {
        jokerEffects: result.jokerEffects,
        totalMult: result.totalMultiplier
      });

      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const lustyEffect = result.jokerEffects!.find(e => e.jokerName === '色欲小丑');
      expect(lustyEffect).toBeDefined();
      expect(lustyEffect!.multBonus).toBe(9);
    });

    it('贪婪小丑: 每张方片+3倍率', () => {
      const joker = getJokerById('greedy_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 贪婪小丑结果:', {
        jokerEffects: result.jokerEffects,
        totalMult: result.totalMultiplier
      });

      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const greedyEffect = result.jokerEffects!.find(e => e.jokerName === '贪婪小丑');
      expect(greedyEffect).toBeDefined();
      expect(greedyEffect!.multBonus).toBe(9);
    });

    it('暴食小丑: 每张梅花+3倍率', () => {
      const joker = getJokerById('gluttonous_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 暴食小丑结果:', {
        jokerEffects: result.jokerEffects,
        totalMult: result.totalMultiplier
      });

      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const gluttonousEffect = result.jokerEffects!.find(e => e.jokerName === '暴食小丑');
      expect(gluttonousEffect).toBeDefined();
      expect(gluttonousEffect!.multBonus).toBe(9);
    });

    it('恐怖面容: 每张人头牌+30筹码', () => {
      const joker = getJokerById('scary_face')!;
      jokerSlots.addJoker(joker);

      // 使用葫芦，这样五张牌都会计分（3张K + 2张Q）
      const cards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 恐怖面容结果:', {
        jokerEffects: result.jokerEffects,
        totalChips: result.totalChips,
        baseChips: result.baseChips
      });

      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const scaryEffect = result.jokerEffects!.find(e => e.jokerName === '恐怖面孔');
      expect(scaryEffect).toBeDefined();
      expect(scaryEffect!.chipBonus).toBe(150); // 5张人头牌 * 30
    });

    it('学者: 每个A+4倍率和+20筹码', () => {
      const joker = getJokerById('scholar')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 学者结果:', {
        jokerEffects: result.jokerEffects,
        totalMult: result.totalMultiplier,
        totalChips: result.totalChips
      });

      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const scholarEffect = result.jokerEffects!.find(e => e.jokerName === '学者');
      expect(scholarEffect).toBeDefined();
      expect(scholarEffect!.multBonus).toBe(12); // 3张A * 4
      expect(scholarEffect!.chipBonus).toBe(60); // 3张A * 20
    });
  });

  describe('ON_HAND_PLAYED触发器类小丑牌', () => {
    it('开心小丑: 对子时+8倍率', () => {
      const joker = getJokerById('jolly_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 开心小丑结果:', {
        jokerEffects: result.jokerEffects,
        handType: result.handType,
        totalMult: result.totalMultiplier
      });

      expect(result.handType).toBe(PokerHandType.OnePair);
      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const jollyEffect = result.jokerEffects!.find(e => e.jokerName === '开心小丑');
      expect(jollyEffect).toBeDefined();
      expect(jollyEffect!.multBonus).toBe(8);
    });

    it('同花小丑: 同花时+10倍率', () => {
      const joker = getJokerById('droll_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Ace)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 同花小丑结果:', {
        jokerEffects: result.jokerEffects,
        handType: result.handType,
        totalMult: result.totalMultiplier
      });

      expect(result.handType).toBe(PokerHandType.Flush);
      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const drollEffect = result.jokerEffects!.find(e => e.jokerName === '同花小丑');
      expect(drollEffect).toBeDefined();
      expect(drollEffect!.multBonus).toBe(10);
    });
  });

  describe('倍率乘数类小丑牌', () => {
    it('双人组: 对子时x2倍率', () => {
      const joker = getJokerById('the_duo')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      console.log('[测试] 双人组结果:', {
        jokerEffects: result.jokerEffects,
        handType: result.handType,
        totalMult: result.totalMultiplier,
        baseMult: result.baseMultiplier
      });

      expect(result.handType).toBe(PokerHandType.OnePair);
      expect(result.jokerEffects).toBeDefined();
      expect(result.jokerEffects!.length).toBeGreaterThan(0);

      const duoEffect = result.jokerEffects!.find(e => e.jokerName === '二人组');
      expect(duoEffect).toBeDefined();
      expect(duoEffect!.multMultiplier).toBe(2);
    });
  });

  describe('所有小丑牌ID检查', () => {
    it('所有小丑牌都应该能通过getJokerById获取', () => {
      for (const joker of JOKERS) {
        const found = getJokerById(joker.id);
        expect(found).toBeDefined();
        expect(found!.id).toBe(joker.id);
        expect(found!.name).toBe(joker.name);
      }
    });

    it('所有小丑牌都应该有正确的trigger', () => {
      const validTriggers = [
        'on_play',
        'on_scored',
        'on_hand_played',
        'end_of_round',
        'on_independent',
        'on_held',
        'on_discard',
        'on_reroll',
        'on_blind_select',
        'on_card_added'
      ];

      for (const joker of JOKERS) {
        expect(validTriggers).toContain(joker.trigger);
      }
    });
  });
});
