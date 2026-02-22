import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank, CardEnhancement, SealType } from '../types/card';
import { getJokerById } from '../data/jokers';
import { JokerSystem } from '../systems/JokerSystem';

describe('手牌操作型小丑牌功能检查', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('1. 手牌操作型小丑牌', () => {
    describe('男爵 (Baron)', () => {
      it('手牌中有K时应正确计算倍率', () => {
        const baron = getJokerById('baron')!;
        jokerSlots.addJoker(baron);

        // 打出对子
        const playedCards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.Ace),
        ];

        // 手牌中有两张K
        const heldCards = [
          new Card(Suit.Diamonds, Rank.King),
          new Card(Suit.Clubs, Rank.King),
        ];

        const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

        const baronEffect = result.jokerEffects!.find(e => e.jokerName === '男爵');
        expect(baronEffect).toBeDefined();
        // 2张K，每张x1.5，总共x2.25
        expect(baronEffect!.multMultiplier).toBeCloseTo(2.25, 1);
      });

      it('手牌中无K时不应触发', () => {
        const baron = getJokerById('baron')!;
        jokerSlots.addJoker(baron);

        const playedCards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.Ace),
        ];

        const heldCards = [
          new Card(Suit.Diamonds, Rank.Queen),
          new Card(Suit.Clubs, Rank.Jack),
        ];

        const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

        const baronEffect = result.jokerEffects!.find(e => e.jokerName === '男爵');
        expect(baronEffect).toBeUndefined();
      });
    });

    describe('DNA', () => {
      it('第一手出1张牌时应触发', () => {
        const dna = getJokerById('dna')!;
        jokerSlots.addJoker(dna);

        // 第一手出1张牌
        const cards = [
          new Card(Suit.Spades, Rank.Ace),
        ];

        const result = ScoringSystem.calculate(cards, undefined, { money: 10, interestCap: 20, hands: 4, discards: 3 }, undefined, jokerSlots, undefined, undefined, 0);

        const dnaEffect = result.jokerEffects!.find(e => e.jokerName === 'DNA');
        expect(dnaEffect).toBeDefined();
      });

      it('第一手出多张牌时不应触发', () => {
        const dna = getJokerById('dna')!;
        jokerSlots.addJoker(dna);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.Ace),
        ];

        const result = ScoringSystem.calculate(cards, undefined, { money: 10, interestCap: 20, hands: 4, discards: 3 }, undefined, jokerSlots, undefined, undefined, 0);

        const dnaEffect = result.jokerEffects!.find(e => e.jokerName === 'DNA');
        expect(dnaEffect).toBeUndefined();
      });

      it('非第一手不应触发', () => {
        const dna = getJokerById('dna')!;
        jokerSlots.addJoker(dna);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
        ];

        // handsPlayed = 1，不是第一手
        const result = ScoringSystem.calculate(cards, undefined, { money: 10, interestCap: 20, hands: 4, discards: 3 }, undefined, jokerSlots, undefined, undefined, 1);

        const dnaEffect = result.jokerEffects!.find(e => e.jokerName === 'DNA');
        expect(dnaEffect).toBeUndefined();
      });
    });
  });

  describe('2. 蜡封效果检查', () => {
    describe('红蜡封 (Red Seal)', () => {
      it('应触发两次效果', () => {
        const card = new Card(Suit.Spades, Rank.Ace);
        card.seal = SealType.Red;

        const result = ScoringSystem.calculate([card]);

        // 基础分: 5 (高牌) + 11 (A) = 16
        // 红蜡封触发两次: 5 + 11*2 = 27
        expect(result.totalChips).toBe(27);

        const cardDetail = result.cardDetails.find(d => d.card.includes('A'));
        expect(cardDetail?.enhancements.some(e => e.includes('红色蜡封') || e.includes('触发两次'))).toBe(true);
      });

      it('与增强效果组合应正确触发两次', () => {
        const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
        card.seal = SealType.Red;

        const result = ScoringSystem.calculate([card]);

        // 基础: 5 + 11 + 30 = 46
        // 红蜡封: 5 + (11+30)*2 = 87
        expect(result.totalChips).toBe(87);
      });
    });

    describe('金蜡封 (Gold Seal)', () => {
      it('打出时应+$3', () => {
        const card = new Card(Suit.Spades, Rank.Ace);
        card.seal = SealType.Gold;

        const result = ScoringSystem.calculate([card]);

        expect(result.moneyBonus).toBe(3);
      });
    });

    describe('蓝蜡封 (Blue Seal)', () => {
      it('留在手牌中应生成星球牌', () => {
        const card = new Card(Suit.Spades, Rank.Ace);
        card.seal = SealType.Blue;

        // 模拟回合结束，牌留在手牌中
        const playedCards: Card[] = [];
        const heldCards = [card];

        // 使用processHeld检查效果
        // 蓝蜡封效果在回合结束时触发
      });
    });

    describe('紫蜡封 (Purple Seal)', () => {
      it('弃牌时应生成塔罗牌', () => {
        // 紫蜡封效果在弃牌时触发
        // 需要通过弃牌系统测试
      });
    });
  });

  describe('3. 哑剧演员与红蜡封组合', () => {
    it('哑剧演员应让手牌能力触发两次', () => {
      // 哑剧演员效果: heldCardRetrigger: true
      // 需要检查是否正确传递给手牌
    });
  });
});
