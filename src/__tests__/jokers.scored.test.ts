import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { getJokerById } from '../data/jokers';

describe('ON_SCORED 触发器类小丑牌测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
      });

  describe('花色类小丑牌', () => {
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
      const effect = result.jokerEffects!.find(e => e.jokerName === '色欲小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(9); // 3张红桃 * 3
    });

    it('暴怒小丑: 每张黑桃+3倍率', () => {
      const joker = getJokerById('wrathful_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '暴怒小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(9); // 3张黑桃 * 3
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
      const effect = result.jokerEffects!.find(e => e.jokerName === '贪婪小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(9); // 3张方片 * 3
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
      const effect = result.jokerEffects!.find(e => e.jokerName === '暴食小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(9); // 3张梅花 * 3
    });
  });

  describe('人头牌类小丑牌', () => {
    it('恐怖面容: 每张人头牌+30筹码', () => {
      const joker = getJokerById('scary_face')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '恐怖面孔');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(150); // 5张人头牌 * 30
    });

    it('笑脸: 每张人头牌+5倍率', () => {
      const joker = getJokerById('smiley_face')!;
      jokerSlots.addJoker(joker);

      // 使用葫芦，这样5张牌都会计分
      const cards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '笑脸');
      expect(effect).toBeDefined();
      // 葫芦中5张都是人头牌
      expect(effect!.multBonus).toBe(25); // 5张人头牌 * 5
    });
  });

  describe('数字牌类小丑牌', () => {
    it('偶数史蒂文: 每张偶数牌+4倍率', () => {
      const joker = getJokerById('even_steven')!;
      jokerSlots.addJoker(joker);

      // 使用三条，这样3张牌都会计分
      const cards = [
        new Card(Suit.Spades, Rank.Two),
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Two),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Ace)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '偶数史蒂文');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(12); // 3张偶数牌 * 4
    });

    it('奇数托德: 每张奇数牌+31筹码', () => {
      const joker = getJokerById('odd_todd')!;
      jokerSlots.addJoker(joker);

      // 使用三条，这样3张牌都会计分
      const cards = [
        new Card(Suit.Spades, Rank.Three),
        new Card(Suit.Hearts, Rank.Three),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '奇数托德');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(93); // 3张奇数牌 * 31
    });
  });

  describe('特定牌类小丑牌', () => {
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
      const effect = result.jokerEffects!.find(e => e.jokerName === '学者');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(12); // 3张A * 4
      expect(effect!.chipBonus).toBe(60); // 3张A * 20
    });

    it('斐波那契: A,2,3,5,8各+8倍率', () => {
      const joker = getJokerById('fibonacci')!;
      jokerSlots.addJoker(joker);

      // 使用顺子 5-6-7-8-9，只有5和8匹配
      const cards = [
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Eight),
        new Card(Suit.Spades, Rank.Nine)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '斐波那契');
      expect(effect).toBeDefined();
      // 顺子中5和8匹配斐波那契数列
      expect(effect!.multBonus).toBe(16); // 2张牌 * 8
    });

    it('对讲机: 每张10或4+10筹码+4倍率', () => {
      const joker = getJokerById('walkie_talkie')!;
      jokerSlots.addJoker(joker);

      // 使用三条4，这样3张牌都会计分
      const cards = [
        new Card(Suit.Spades, Rank.Four),
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Diamonds, Rank.Four),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '对讲机');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(30); // 3张牌 * 10
      expect(effect!.multBonus).toBe(12); // 3张牌 * 4
    });
  });

  describe('强化牌类小丑牌', () => {
    it('金票券: 每张金牌+$4', () => {
      const joker = getJokerById('golden_ticket')!;
      jokerSlots.addJoker(joker);

      const card1 = new Card(Suit.Spades, Rank.Ace);
      card1.enhancement = CardEnhancement.Gold;
      const card2 = new Card(Suit.Hearts, Rank.Ace);
      card2.enhancement = CardEnhancement.Gold;
      const card3 = new Card(Suit.Diamonds, Rank.Ace);
      card3.enhancement = CardEnhancement.Gold;
      const card4 = new Card(Suit.Clubs, Rank.King);
      const card5 = new Card(Suit.Spades, Rank.King);

      const cards = [card1, card2, card3, card4, card5];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '金票');
      expect(effect).toBeDefined();
      // 葫芦中3张A是金牌
      expect(effect!.moneyBonus).toBe(12); // 3张金牌 * 4
    });

    it('照片: 第一张脸牌x2倍率', () => {
      const joker = getJokerById('photograph')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack),
        new Card(Suit.Clubs, Rank.Ten),
        new Card(Suit.Spades, Rank.Nine)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '照片');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(2);
    });
  });

  describe('稀有花色类小丑牌', () => {
    it('粗糙宝石: 每张方片+$1', () => {
      const joker = getJokerById('rough_gem')!;
      jokerSlots.addJoker(joker);

      // 使用葫芦，这样5张牌都会计分
      const cards = [
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '粗糙宝石');
      expect(effect).toBeDefined();
      // 葫芦中3张A是方片
      expect(effect!.moneyBonus).toBe(3); // 3张方片 * 1
    });

    it('箭头: 每张黑桃+50筹码', () => {
      const joker = getJokerById('arrowhead')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack),
        new Card(Suit.Clubs, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '箭头');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(100); // 2张黑桃 * 50
    });

    it('黑玛瑙: 每张梅花+7倍率', () => {
      const joker = getJokerById('onyx_agate')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '黑玛瑙');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(14); // 2张梅花 * 7
    });
  });

  describe('传说级小丑牌', () => {
    it('特里布莱: K和Q各x2倍率', () => {
      const joker = getJokerById('triboulet')!;
      jokerSlots.addJoker(joker);

      // 使用葫芦，这样5张牌都会计分
      const cards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '特里布莱');
      expect(effect).toBeDefined();
      // 葫芦中有3张K和2张Q匹配，共5张
      // 实现是 Math.pow(2, count)，所以 2^5 = 32
      expect(effect!.multMultiplier).toBe(32);
    });
  });

  describe('边界条件测试', () => {
    it('色欲小丑: 无红桃时不触发', () => {
      const joker = getJokerById('lusty_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '色欲小丑');
      expect(effect).toBeUndefined();
    });

    it('恐怖面容: 无人头牌时不触发', () => {
      const joker = getJokerById('scary_face')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Hearts, Rank.Nine),
        new Card(Suit.Diamonds, Rank.Eight),
        new Card(Suit.Clubs, Rank.Seven),
        new Card(Suit.Spades, Rank.Six)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '恐怖面容');
      expect(effect).toBeUndefined();
    });

    it('学者: 无A时不触发', () => {
      const joker = getJokerById('scholar')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '学者');
      expect(effect).toBeUndefined();
    });
  });
});
