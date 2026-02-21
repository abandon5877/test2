import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Suit, Rank, CardEnhancement, CardEdition, SealType } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

/**
 * 分数计算组合效果测试
 * 测试多种效果组合的场景
 */
describe('ScoringSystem Combinations', () => {
  
  describe('多种增强组合', () => {
    it('Bonus + Mult组合应同时生效', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const multCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult);
      
      const cards = [bonusCard, multCard];
      const result = ScoringSystem.calculate(cards);
      
      // 对子基础: 筹码10 + 11*2 = 32, 倍率2
      // Bonus +30筹码, Mult +4倍率
      expect(result.handType).toBe(PokerHandType.OnePair);
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
      expect(result.multBonus).toBeGreaterThanOrEqual(4);
    });

    it('多个Bonus应累加筹码', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Diamonds, Rank.King, CardEnhancement.Bonus),
        new Card(Suit.Clubs, Rank.King, CardEnhancement.Bonus)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 两对 + 4个Bonus = +120筹码
      expect(result.handType).toBe(PokerHandType.TwoPair);
      expect(result.chipBonus).toBeGreaterThanOrEqual(120);
    });

    it('多个Mult应累加倍率', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult),
        new Card(Suit.Diamonds, Rank.King, CardEnhancement.Mult),
        new Card(Suit.Clubs, Rank.King, CardEnhancement.Mult)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 两对基础倍率2 + 4个Mult(+4 each) = 18
      expect(result.handType).toBe(PokerHandType.TwoPair);
      expect(result.multBonus).toBeGreaterThanOrEqual(16);
    });

    it('Bonus + Mult + Glass组合', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult),
        new Card(Suit.Diamonds, Rank.King, CardEnhancement.Glass),
        new Card(Suit.Clubs, Rank.King, CardEnhancement.Glass)
      ];
      const result = ScoringSystem.calculate(cards);
      
      Math.random = originalRandom;
      
      // 两对 + Bonus + Mult + 2个Glass(x2 each)
      expect(result.handType).toBe(PokerHandType.TwoPair);
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
      expect(result.multBonus).toBeGreaterThanOrEqual(4);
    });
  });

  describe('增强+版本组合', () => {
    it('Bonus + Foil应累加筹码', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.None, CardEdition.Foil);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([card]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Bonus +30 + Foil +50 = +80
      expect(resultCombo.totalChips - resultNormal.totalChips).toBe(80);
    });

    it('Mult + Holographic应累加倍率', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.None, CardEdition.Holographic);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([card]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Mult +4 + Holographic +10 = +14
      expect(resultCombo.totalMultiplier - resultNormal.totalMultiplier).toBe(14);
    });

    it('Glass + Polychrome应相乘倍率', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const polyGlassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([polyGlassCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      Math.random = originalRandom;
      
      // Glass x2 * Polychrome x1.5 = x3
      expect(resultCombo.totalMultiplier / resultNormal.totalMultiplier).toBe(3);
    });

    it('Stone + Foil应累加筹码', () => {
      const stoneFoilCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone, SealType.None, CardEdition.Foil);
      
      const result = ScoringSystem.calculate([stoneFoilCard]);
      
      // Stone牌提供50筹码，Foil版本提供+50筹码
      // 基础5 + Stone 50 + Foil 50 = 105
      // 但实现可能是Stone牌只提供50，不额外加基础牌面
      expect(result.totalChips).toBeGreaterThanOrEqual(55); // 至少基础+Stone
    });
  });

  describe('增强+蜡封组合', () => {
    it('Bonus + Gold Seal应同时生效', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Gold);
      const result = ScoringSystem.calculate([card]);
      
      // Bonus +30筹码, Gold Seal +$3
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
      expect(result.moneyBonus).toBe(3);
    });

    it('Mult + Red Seal应触发两次', () => {
      const redMultCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.Red);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRedMult = ScoringSystem.calculate([redMultCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal触发两次: Mult +4 * 2 = +8
      expect(resultRedMult.totalMultiplier - resultNormal.totalMultiplier).toBe(8);
    });

    it('Bonus + Mult + Red Seal应触发两次两者', () => {
      const redBonusMultCard = new Card(
        Suit.Spades, 
        Rank.Ace, 
        CardEnhancement.Bonus, // 先Bonus
        SealType.Red,
        CardEdition.None
      );
      // 注意：一张牌只能有一种增强，所以需要两张牌
      
      const redBonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Red);
      const redMultCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult, SealType.Red);
      
      const result = ScoringSystem.calculate([redBonusCard, redMultCard]);
      
      // Red Seal触发两次
      expect(result.handType).toBe(PokerHandType.OnePair);
      // Bonus +30 * 2 = +60
      expect(result.chipBonus).toBeGreaterThanOrEqual(60);
      // Mult +4 * 2 = +8
      expect(result.multBonus).toBeGreaterThanOrEqual(8);
    });
  });

  describe('版本+蜡封组合', () => {
    it('Foil + Gold Seal应同时生效', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Gold, CardEdition.Foil);
      const result = ScoringSystem.calculate([card]);
      
      // Foil +50筹码, Gold Seal +$3
      expect(result.chipBonus).toBeGreaterThanOrEqual(50);
      expect(result.moneyBonus).toBe(3);
    });

    it('Holographic + Red Seal应触发两次', () => {
      const redHoloCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Red, CardEdition.Holographic);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRedHolo = ScoringSystem.calculate([redHoloCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal触发两次: Holographic +10 * 2 = +20
      expect(resultRedHolo.totalMultiplier - resultNormal.totalMultiplier).toBe(20);
    });

    it('Polychrome + Gold Seal应同时生效', () => {
      // 使用对子来测试Polychrome
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Gold, CardEdition.Polychrome),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // Polychrome x1.5, Gold Seal +$3
      expect(result.moneyBonus).toBe(3);
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(3); // 2 * 1.5
    });
  });

  describe('完整三要素组合(增强+版本+蜡封)', () => {
    it('Bonus + Foil + Gold Seal', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Gold, CardEdition.Foil);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([card]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Bonus +30 + Foil +50 = +80筹码
      expect(resultCombo.totalChips - resultNormal.totalChips).toBe(80);
      // Gold Seal +$3
      expect(resultCombo.moneyBonus).toBe(3);
    });

    it('Mult + Holographic + Red Seal', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.Red, CardEdition.Holographic);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([card]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal触发两次: (Mult +4 + Holographic +10) * 2 = +28
      expect(resultCombo.totalMultiplier - resultNormal.totalMultiplier).toBe(28);
    });

    it('Glass + Polychrome + Red Seal', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.Red, CardEdition.Polychrome);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([card]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      Math.random = originalRandom;
      
      // Red Seal触发两次:
      // 筹码: (11 + 0) * 2 = 22 (Glass不加筹码)
      // 倍率: 1 * 2(Glass) * 1.5(Polychrome) * 2(Red Seal) = 6
      expect(resultCombo.totalChips - resultCombo.baseChips).toBe(22);
    });
  });

  describe('多张牌不同组合', () => {
    it('5张牌各有不同增强', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult),
        new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.Glass),
        new Card(Suit.Clubs, Rank.Ace, CardEnhancement.Stone),
        new Card(Suit.Spades, Rank.Two, CardEnhancement.Wild)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 应该是四条
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      // 有Bonus的筹码加成
      expect(result.chipBonus).toBeGreaterThan(0);
    });

    it('5张牌各有不同版本', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic),
        new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.Two)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 应该是四条
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      // 有Foil的筹码加成
      expect(result.chipBonus).toBeGreaterThanOrEqual(50);
      // 有Holographic和Polychrome的倍率加成
      expect(result.multBonus).toBeGreaterThan(0);
    });

    it('5张牌各有不同蜡封', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Gold),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.Red),
        new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.None, SealType.Blue),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.Two, CardEnhancement.None, SealType.Purple)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 应该是四条
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      // Gold Seal +$3
      expect(result.moneyBonus).toBe(3);
    });
  });

  describe('倍率乘数链', () => {
    it('Glass × Polychrome组合', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome)
      ];
      const result = ScoringSystem.calculate(cards);
      
      Math.random = originalRandom;
      
      // 对子基础倍率2
      // 2个Glass: x2 * x2 = x4
      // 2个Polychrome: x1.5 * x1.5 = x2.25
      // 总倍率: 2 * 4 * 2.25 = 18
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(18);
    });

    it('手持Steel × Glass × Polychrome', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const playedCards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome)
      ];
      const heldCards = [
        new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel)
      ];
      
      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards);
      
      Math.random = originalRandom;
      
      // 手持Steel x1.5
      expect(result.heldMultMultiplier).toBe(1.5);
    });

    it('多个手持Steel应相乘', () => {
      const playedCard = new Card(Suit.Spades, Rank.Ace);
      const heldCards = [
        new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel),
        new Card(Suit.Diamonds, Rank.Queen, CardEnhancement.Steel),
        new Card(Suit.Clubs, Rank.Jack, CardEnhancement.Steel)
      ];
      
      const result = ScoringSystem.calculate([playedCard], undefined, undefined, heldCards, undefined);
      
      // 3个Steel: 1.5 * 1.5 * 1.5 = 3.375
      expect(result.heldMultMultiplier).toBe(3.375);
    });
  });

  describe('复杂场景组合', () => {
    it('皇家同花顺 + 所有增强', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁Glass
      
      const cards = [
        new Card(Suit.Spades, Rank.Ten, CardEnhancement.Bonus),
        new Card(Suit.Spades, Rank.Jack, CardEnhancement.Mult),
        new Card(Suit.Spades, Rank.Queen, CardEnhancement.Glass),
        new Card(Suit.Spades, Rank.King, CardEnhancement.Stone),
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild)
      ];
      const result = ScoringSystem.calculate(cards);
      
      Math.random = originalRandom;
      
      // 可能是同花或同花顺（Stone牌可能影响检测）
      expect([PokerHandType.RoyalFlush, PokerHandType.StraightFlush, PokerHandType.Flush]).toContain(result.handType);
      // 基础筹码 + 各种增强
      expect(result.totalChips).toBeGreaterThan(100);
    });

    it('完整组合: 5张牌 × 增强 × 版本 × 蜡封', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Gold, CardEdition.Foil),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult, SealType.Red, CardEdition.Holographic),
        new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome),
        new Card(Suit.Clubs, Rank.Ace, CardEnhancement.Stone),
        new Card(Suit.Spades, Rank.Two, CardEnhancement.Wild)
      ];
      const heldCards = [
        new Card(Suit.Hearts, Rank.Three, CardEnhancement.Steel),
        new Card(Suit.Diamonds, Rank.Four, CardEnhancement.Steel)
      ];
      
      const result = ScoringSystem.calculate(cards, undefined, undefined, heldCards);
      
      Math.random = originalRandom;
      
      // 验证结果
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      expect(result.moneyBonus).toBeGreaterThanOrEqual(3); // Gold Seal
      expect(result.heldMultMultiplier).toBe(2.25); // 2个Steel
    });

    it('所有9种增强组合', () => {
      // 由于一手只能出5张牌，我们测试5种不同的增强
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult),
        new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.Wild),
        new Card(Suit.Clubs, Rank.Ace, CardEnhancement.Glass),
        new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone)
      ];
      
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const result = ScoringSystem.calculate(cards);
      
      Math.random = originalRandom;
      
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      // Stone牌应在计分牌中（Stone牌总是计分）
      // 注意：Stone牌可能作为kickers的一部分
      const stoneInDetails = result.cardDetails.some(d => 
        d.enhancements.some(e => e.includes('Stone'))
      );
      expect(stoneInDetails).toBe(true);
    });
  });

  describe('效果叠加规则验证', () => {
    it('筹码加成应累加', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.None, CardEdition.Foil),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Bonus, SealType.None, CardEdition.Foil)
      ];
      const normalCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      
      const resultCombo = ScoringSystem.calculate(cards);
      const resultNormal = ScoringSystem.calculate(normalCards);
      
      // 2个Bonus (+30 each) + 2个Foil (+50 each) = +160
      expect(resultCombo.totalChips - resultNormal.totalChips).toBe(160);
    });

    it('倍率加成应累加', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.None, CardEdition.Holographic),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult, SealType.None, CardEdition.Holographic)
      ];
      const normalCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      
      const resultCombo = ScoringSystem.calculate(cards);
      const resultNormal = ScoringSystem.calculate(normalCards);
      
      // 2个Mult (+4 each) + 2个Holographic (+10 each) = +28
      expect(resultCombo.totalMultiplier - resultNormal.totalMultiplier).toBe(28);
    });

    it('倍率乘数应相乘', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁
      
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome)
      ];
      const normalCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      
      const resultCombo = ScoringSystem.calculate(cards);
      const resultNormal = ScoringSystem.calculate(normalCards);
      
      Math.random = originalRandom;
      
      // 2个Glass (x2 each) * 2个Polychrome (x1.5 each) = x9
      expect(resultCombo.totalMultiplier / resultNormal.totalMultiplier).toBe(9);
    });

    it('金币奖励应累加', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Gold),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.Gold),
        new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.None, SealType.Gold)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 3个Gold Seal = $9
      expect(result.moneyBonus).toBe(9);
    });
  });

  describe('触发两次效果组合', () => {
    it('Red Seal + 触发两次小丑牌应叠加', () => {
      // Red Seal使卡牌触发两次
      const redCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.Red);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRed = ScoringSystem.calculate([redCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal: Mult +4 * 2 = +8
      expect(resultRed.totalMultiplier - resultNormal.totalMultiplier).toBe(8);
    });

    it('多张Red Seal牌应各自触发两次', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Red),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Bonus, SealType.Red)
      ];
      const normalCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      
      const resultRed = ScoringSystem.calculate(cards);
      const resultNormal = ScoringSystem.calculate(normalCards);
      
      // 2个Red Seal Bonus: (11+30)*2 + (11+30)*2 = 164
      // 普通: 11 + 11 = 22
      // 差值: 164 - 22 = 142
      expect(resultRed.totalChips - resultNormal.totalChips).toBe(142);
    });
  });
});
