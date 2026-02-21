import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('ScoringSystem', () => {
  describe('基础分数计算', () => {
    it('空牌组应该返回0分', () => {
      const result = ScoringSystem.calculate([]);
      expect(result.totalScore).toBe(0);
      expect(result.totalChips).toBe(0);
      expect(result.totalMultiplier).toBe(0);
    });

    it('高牌的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Nine)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.HighCard);
      expect(result.baseChips).toBe(5);
      expect(result.baseMultiplier).toBe(1);
      // 修复: 高牌计分只计算计分牌(Ace=11)，踢牌不计算筹码
      expect(result.totalChips).toBe(5 + 11);
      expect(result.totalMultiplier).toBe(1);
      expect(result.totalScore).toBe((5 + 11) * 1);
    });

    it('一对的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.OnePair);
      expect(result.baseChips).toBe(10);
      expect(result.baseMultiplier).toBe(2);
      // 修复: 一对计分只计算对子(Ace*2=22)，踢牌不计算筹码
      expect(result.totalChips).toBe(10 + 11 + 11);
      expect(result.totalMultiplier).toBe(2);
      expect(result.totalScore).toBe((10 + 11 + 11) * 2);
    });

    it('两对的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.TwoPair);
      expect(result.baseChips).toBe(20);
      expect(result.baseMultiplier).toBe(2);
      // 修复: 两对计分只计算两对(Ace*2 + K*2 = 42)，踢牌不计算筹码
      expect(result.totalChips).toBe(20 + 11 + 11 + 10 + 10);
      expect(result.totalMultiplier).toBe(2);
    });

    it('三条的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.ThreeOfAKind);
      expect(result.baseChips).toBe(30);
      expect(result.baseMultiplier).toBe(3);
      // 修复: 三条计分只计算三条(Ace*3=33)，踢牌不计算筹码
      expect(result.totalChips).toBe(30 + 11 + 11 + 11);
      expect(result.totalMultiplier).toBe(3);
    });

    it('顺子的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Eight),
        new Card(Suit.Spades, Rank.Nine)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.Straight);
      expect(result.baseChips).toBe(30);
      expect(result.baseMultiplier).toBe(4);
      expect(result.totalChips).toBe(30 + 5 + 6 + 7 + 8 + 9);
      expect(result.totalMultiplier).toBe(4);
    });

    it('同花的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.Flush);
      expect(result.baseChips).toBe(35);
      expect(result.baseMultiplier).toBe(4);
      expect(result.totalChips).toBe(35 + 2 + 5 + 8 + 10 + 11);
      expect(result.totalMultiplier).toBe(4);
    });

    it('葫芦的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.King)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.FullHouse);
      expect(result.baseChips).toBe(40);
      expect(result.baseMultiplier).toBe(4);
      expect(result.totalChips).toBe(40 + 11 + 11 + 11 + 10 + 10);
      expect(result.totalMultiplier).toBe(4);
    });

    it('四条的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.King)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      expect(result.baseChips).toBe(60);
      expect(result.baseMultiplier).toBe(7);
      // 修复: 四条计分只计算四条(Ace*4=44)，踢牌不计算筹码
      expect(result.totalChips).toBe(60 + 11 + 11 + 11 + 11);
      expect(result.totalMultiplier).toBe(7);
    });

    it('同花顺的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Nine)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.StraightFlush);
      expect(result.baseChips).toBe(100);
      expect(result.baseMultiplier).toBe(8);
      expect(result.totalChips).toBe(100 + 5 + 6 + 7 + 8 + 9);
      expect(result.totalMultiplier).toBe(8);
    });

    it('皇家同花顺的基础分数计算正确', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Spades, Rank.Jack),
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Spades, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.handType).toBe(PokerHandType.RoyalFlush);
      expect(result.baseChips).toBe(100);
      expect(result.baseMultiplier).toBe(8);
      expect(result.totalChips).toBe(100 + 10 + 10 + 10 + 10 + 11);
      expect(result.totalMultiplier).toBe(8);
    });
  });

  describe('牌面筹码累加', () => {
    it('A的筹码值应该是11', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      expect(card.getChipValue()).toBe(11);
    });

    it('K、Q、J的筹码值应该是10', () => {
      expect(new Card(Suit.Spades, Rank.King).getChipValue()).toBe(10);
      expect(new Card(Suit.Spades, Rank.Queen).getChipValue()).toBe(10);
      expect(new Card(Suit.Spades, Rank.Jack).getChipValue()).toBe(10);
    });

    it('数字牌的筹码值应该等于其数字', () => {
      expect(new Card(Suit.Spades, Rank.Two).getChipValue()).toBe(2);
      expect(new Card(Suit.Spades, Rank.Five).getChipValue()).toBe(5);
      expect(new Card(Suit.Spades, Rank.Ten).getChipValue()).toBe(10);
    });

    it('计分卡牌应该累加筹码值', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.scoringCards.length).toBeGreaterThan(0);
    });

    it('踢牌不应该累加筹码值', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.kickers.length).toBeGreaterThan(0);
      expect(result.cardDetails.length).toBeGreaterThan(result.scoringCards.length);
      // 修复: 验证踢牌的chipBonus为0（不计分）
      for (const kicker of result.kickers) {
        const kickerDetail = result.cardDetails.find(d => d.card === kicker.toString());
        if (kickerDetail) {
          expect(kickerDetail.chipBonus).toBe(0);
        }
      }
    });
  });

  describe('卡牌增强效果', () => {
    it('Bonus增强应该增加30筹码', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const cards = [
        card,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
    });

    it('Mult增强应该增加4倍率', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult);
      const cards = [
        card,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.multBonus).toBeGreaterThanOrEqual(4);
    });

    it('Stone增强应该固定50筹码', () => {
      const card = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      expect(card.getChipValue()).toBe(50);
    });

    it('Bonus增强的踢牌也不应该增加筹码', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King, CardEnhancement.Bonus),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      const kingDetail = result.cardDetails.find(d => d.card.includes('K'));
      // 修复: 踢牌即使有Bonus增强也不应该增加筹码
      expect(kingDetail?.chipBonus).toBe(0);
      expect(kingDetail?.enhancements).toContain('Bonus (+30筹码)');
    });
  });

  describe('分数计算详情', () => {
    it('应该返回正确的分数详情结构', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('baseChips');
      expect(result).toHaveProperty('chipBonus');
      expect(result).toHaveProperty('totalChips');
      expect(result).toHaveProperty('baseMultiplier');
      expect(result).toHaveProperty('multBonus');
      expect(result).toHaveProperty('totalMultiplier');
      expect(result).toHaveProperty('handType');
      expect(result).toHaveProperty('handDescription');
      expect(result).toHaveProperty('scoringCards');
      expect(result).toHaveProperty('kickers');
      expect(result).toHaveProperty('cardDetails');
    });

    it('totalScore应该等于totalChips乘以totalMultiplier', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      expect(result.totalScore).toBe(result.totalChips * result.totalMultiplier);
    });

    it('cardDetails应该包含每张计分牌的信息', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      for (const detail of result.cardDetails) {
        expect(detail).toHaveProperty('card');
        expect(detail).toHaveProperty('baseChips');
        expect(detail).toHaveProperty('chipBonus');
        expect(detail).toHaveProperty('multBonus');
        expect(detail).toHaveProperty('enhancements');
      }
    });
  });

  describe('formatScoreResult', () => {
    it('应该返回格式化的字符串', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      const formatted = ScoringSystem.formatScoreResult(result);
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('得分详情');
      expect(formatted).toContain('牌型');
      expect(formatted).toContain('最终得分');
    });
  });

  describe('指定牌型计算', () => {
    it('应该能强制使用指定牌型计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards, PokerHandType.TwoPair);
      expect(result.handType).toBe(PokerHandType.TwoPair);
    });
  });
});
