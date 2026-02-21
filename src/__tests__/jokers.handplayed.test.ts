import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { getJokerById } from '../data/jokers';

describe('ON_HAND_PLAYED 触发器类小丑牌测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
      });

  describe('牌型类小丑牌', () => {
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
      expect(result.handType).toBe(PokerHandType.OnePair);
      const effect = result.jokerEffects!.find(e => e.jokerName === '开心小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(8);
    });

    it('滑稽小丑: 三条时+12倍率', () => {
      const joker = getJokerById('zany_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      expect(result.handType).toBe(PokerHandType.ThreeOfAKind);
      const effect = result.jokerEffects!.find(e => e.jokerName === '滑稽小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(12);
    });

    it('疯狂小丑: 两对时+10倍率', () => {
      const joker = getJokerById('mad_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      expect(result.handType).toBe(PokerHandType.TwoPair);
      const effect = result.jokerEffects!.find(e => e.jokerName === '疯狂小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(10);
    });

    it('狂热小丑: 顺子时+12倍率', () => {
      const joker = getJokerById('crazy_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Eight),
        new Card(Suit.Spades, Rank.Nine)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      expect(result.handType).toBe(PokerHandType.Straight);
      const effect = result.jokerEffects!.find(e => e.jokerName === '狂热小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(12);
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
      expect(result.handType).toBe(PokerHandType.Flush);
      const effect = result.jokerEffects!.find(e => e.jokerName === '同花小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(10);
    });

    it('狡猾小丑: 对子时+50筹码', () => {
      const joker = getJokerById('sly_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '狡猾小丑');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(50);
    });

    it('诡计小丑: 三条时+100筹码', () => {
      const joker = getJokerById('wily_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '诡计小丑');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(100);
    });

    it('聪明小丑: 两对时+80筹码', () => {
      const joker = getJokerById('clever_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '聪明小丑');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(80);
    });

    it('阴险小丑: 顺子时+100筹码', () => {
      const joker = getJokerById('devious_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Eight),
        new Card(Suit.Spades, Rank.Nine)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '阴险小丑');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(100);
    });

    it('灵巧小丑: 同花时+80筹码', () => {
      const joker = getJokerById('crafty_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Ace)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '灵巧小丑');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(80);
    });
  });

  describe('倍率乘数类小丑牌', () => {
    it('二人组: 对子时x2倍率', () => {
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
      const effect = result.jokerEffects!.find(e => e.jokerName === '二人组');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(2);
    });

    it('三人组: 三条时x3倍率', () => {
      const joker = getJokerById('the_trio')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '三人组');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(3);
    });

    it('家庭: 四条时x4倍率', () => {
      const joker = getJokerById('the_family')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '家庭');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(4);
    });

    it('秩序: 顺子时x3倍率', () => {
      const joker = getJokerById('the_order')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Eight),
        new Card(Suit.Spades, Rank.Nine)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '秩序');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(3);
    });

    it('部落: 同花时x2倍率', () => {
      const joker = getJokerById('the_tribe')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Ace)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '部落');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(2);
    });

    it('花盆: 四种花色时x3倍率', () => {
      const joker = getJokerById('flower_pot')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '花盆');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(3);
    });

    it('重影: 含梅花和其他花色时x2倍率', () => {
      const joker = getJokerById('seeing_double')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '重影');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(2);
    });
  });

  describe('游戏状态类小丑牌', () => {
    it('旗帜: 每剩余弃牌+40筹码', () => {
      const joker = getJokerById('banner')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const gameState = { money: 10, interestCap: 20, hands: 3, discards: 2 };
      const result = ScoringSystem.calculate(cards, undefined, gameState, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '旗帜');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(80); // 2剩余弃牌 * 40
    });

    it('神秘峰顶: 0弃牌时+15倍率', () => {
      const joker = getJokerById('mystic_summit')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const gameState = { money: 10, interestCap: 20, hands: 3, discards: 0 };
      const result = ScoringSystem.calculate(cards, undefined, gameState, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '神秘峰顶');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(15);
    });

    it('公牛: 每美元+2筹码', () => {
      const joker = getJokerById('bull')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const gameState = { money: 25, interestCap: 20, hands: 3, discards: 3 };
      const result = ScoringSystem.calculate(cards, undefined, gameState, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '公牛');
      expect(effect).toBeDefined();
      expect(effect!.chipBonus).toBe(50); // $25 * 2
    });

    it('半张小丑: ≤3张牌时+20倍率', () => {
      const joker = getJokerById('half_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '半张小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(20);
    });

    it('抽象小丑: 每小丑+2倍率', () => {
      const joker = getJokerById('abstract_joker')!;
      jokerSlots.addJoker(joker);

      // 添加第二张抽象小丑来测试效果
      const joker2 = getJokerById('abstract_joker')!;
      jokerSlots.addJoker(joker2);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effects = result.jokerEffects!.filter(e => e.jokerName === '抽象小丑');
      expect(effects.length).toBe(2);
      // 2张小丑 * 2倍率 = 4
      expect(effects[0]!.multBonus).toBe(4);
    });
  });

  describe('边界条件测试', () => {
    it('欢乐小丑: 非对子时不触发', () => {
      const joker = getJokerById('jolly_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '欢乐小丑');
      expect(effect).toBeUndefined();
    });

    it('半张小丑: >3张牌时不触发', () => {
      const joker = getJokerById('half_joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '半张小丑');
      expect(effect).toBeUndefined();
    });

    it('神秘峰顶: 有弃牌时不触发', () => {
      const joker = getJokerById('mystic_summit')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const gameState = { money: 10, interestCap: 20, hands: 3, discards: 1 };
      const result = ScoringSystem.calculate(cards, undefined, gameState, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '神秘峰顶');
      expect(effect).toBeUndefined();
    });
  });

  describe('侵蚀: 牌库数量相关', () => {
    it('侵蚀: 牌库完整时不触发', () => {
      const joker = getJokerById('erosion')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      // 牌库完整: 52张牌
      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, 52, 52);
      const effect = result.jokerEffects!.find(e => e.jokerName === '侵蚀');
      expect(effect).toBeUndefined();
    });

    it('侵蚀: 牌库缺少10张牌时+40倍率', () => {
      const joker = getJokerById('erosion')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      // 牌库缺少10张: 42/52
      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, 42, 52);
      const effect = result.jokerEffects!.find(e => e.jokerName === '侵蚀');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(40); // 10 * 4
    });

    it('侵蚀: 牌库缺少1张牌时+4倍率', () => {
      const joker = getJokerById('erosion')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      // 牌库缺少1张: 51/52
      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, 51, 52);
      const effect = result.jokerEffects!.find(e => e.jokerName === '侵蚀');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(4); // 1 * 4
    });

    it('侵蚀: 牌库缺少25张牌时+100倍率', () => {
      const joker = getJokerById('erosion')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      // 牌库缺少25张: 27/52
      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots, 27, 52);
      const effect = result.jokerEffects!.find(e => e.jokerName === '侵蚀');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(100); // 25 * 4
    });
  });
});
