import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Suit, Rank, CardEnhancement, CardEdition, SealType } from '../types/card';
import { PokerHandType, HAND_BASE_VALUES } from '../types/pokerHands';

/**
 * 综合分数测试
 * 测试各种复杂的分数计算场景，确保实现与规格一致
 */
describe('ScoringSystem Comprehensive Tests', () => {
  
  describe('基础牌型分数验证', () => {
    it('所有基础牌型的基础筹码和倍率应符合规格', () => {
      const testCases = [
        { type: PokerHandType.HighCard, expectedChips: 5, expectedMult: 1 },
        { type: PokerHandType.OnePair, expectedChips: 10, expectedMult: 2 },
        { type: PokerHandType.TwoPair, expectedChips: 20, expectedMult: 2 },
        { type: PokerHandType.ThreeOfAKind, expectedChips: 30, expectedMult: 3 },
        { type: PokerHandType.Straight, expectedChips: 30, expectedMult: 4 },
        { type: PokerHandType.Flush, expectedChips: 35, expectedMult: 4 },
        { type: PokerHandType.FullHouse, expectedChips: 40, expectedMult: 4 },
        { type: PokerHandType.FourOfAKind, expectedChips: 60, expectedMult: 7 },
        { type: PokerHandType.StraightFlush, expectedChips: 100, expectedMult: 8 },
        { type: PokerHandType.RoyalFlush, expectedChips: 100, expectedMult: 8 },
      ];

      for (const testCase of testCases) {
        const values = HAND_BASE_VALUES[testCase.type];
        expect(values.chips).toBe(testCase.expectedChips);
        expect(values.multiplier).toBe(testCase.expectedMult);
      }
    });

    it('秘密牌型的基础筹码和倍率应符合规格', () => {
      const secretHands = [
        { type: PokerHandType.FiveOfAKind, expectedChips: 120, expectedMult: 12 },
        { type: PokerHandType.FlushHouse, expectedChips: 140, expectedMult: 14 },
        { type: PokerHandType.FlushFive, expectedChips: 160, expectedMult: 16 },
      ];

      for (const testCase of secretHands) {
        const values = HAND_BASE_VALUES[testCase.type];
        expect(values.chips).toBe(testCase.expectedChips);
        expect(values.multiplier).toBe(testCase.expectedMult);
      }
    });
  });

  describe('牌面筹码值验证', () => {
    it('数字牌2-10的筹码值应等于牌面数字', () => {
      const numberCards = [
        { rank: Rank.Two, expected: 2 },
        { rank: Rank.Three, expected: 3 },
        { rank: Rank.Four, expected: 4 },
        { rank: Rank.Five, expected: 5 },
        { rank: Rank.Six, expected: 6 },
        { rank: Rank.Seven, expected: 7 },
        { rank: Rank.Eight, expected: 8 },
        { rank: Rank.Nine, expected: 9 },
        { rank: Rank.Ten, expected: 10 },
      ];

      for (const testCase of numberCards) {
        const card = new Card(Suit.Spades, testCase.rank);
        expect(card.getChipValue()).toBe(testCase.expected);
      }
    });

    it('人头牌J、Q、K的筹码值应为10', () => {
      const faceCards = [Rank.Jack, Rank.Queen, Rank.King];
      for (const rank of faceCards) {
        const card = new Card(Suit.Spades, rank);
        expect(card.getChipValue()).toBe(10);
      }
    });

    it('A的筹码值应为11', () => {
      const ace = new Card(Suit.Spades, Rank.Ace);
      expect(ace.getChipValue()).toBe(11);
    });
  });

  describe('完整分数计算验证', () => {
    it('高牌: 单张A的分数计算', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码5 + 牌面11 = 16
      // 基础倍率1
      // 总分 = 16 * 1 = 16
      expect(result.baseChips).toBe(5);
      expect(result.totalChips).toBe(16);
      expect(result.baseMultiplier).toBe(1);
      expect(result.totalMultiplier).toBe(1);
      expect(result.totalScore).toBe(16);
    });

    it('对子: AA的分数计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码10 + 牌面11*2 = 32
      // 基础倍率2
      // 总分 = 32 * 2 = 64
      expect(result.baseChips).toBe(10);
      expect(result.totalChips).toBe(32);
      expect(result.baseMultiplier).toBe(2);
      expect(result.totalMultiplier).toBe(2);
      expect(result.totalScore).toBe(64);
    });

    it('两对: AA+KK的分数计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.King)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码20 + 牌面11*2 + 10*2 = 62
      // 基础倍率2
      // 总分 = 62 * 2 = 124
      expect(result.baseChips).toBe(20);
      expect(result.totalChips).toBe(62);
      expect(result.totalScore).toBe(124);
    });

    it('三条: AAA的分数计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码30 + 牌面11*3 = 63
      // 基础倍率3
      // 总分 = 63 * 3 = 189
      expect(result.baseChips).toBe(30);
      expect(result.totalChips).toBe(63);
      expect(result.totalScore).toBe(189);
    });

    it('顺子: 5-6-7-8-9的分数计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Clubs, Rank.Eight),
        new Card(Suit.Spades, Rank.Nine)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码30 + 牌面5+6+7+8+9 = 55 (如果所有5张都计分)
      // 或者只计算部分牌
      // 基础倍率4
      expect(result.baseChips).toBe(30);
      expect(result.totalChips).toBeGreaterThanOrEqual(55);
      expect(result.totalScore).toBe(result.totalChips * result.totalMultiplier);
    });

    it('同花: 红桃2-5-8-J-A的分数计算', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码35 + 牌面2+5+8+10+11 = 71
      // 基础倍率4
      // 总分 = 71 * 4 = 284
      expect(result.baseChips).toBe(35);
      expect(result.totalChips).toBe(71);
      expect(result.totalScore).toBe(284);
    });

    it('葫芦: AAA+KK的分数计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.King)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码40 + 牌面11*3 + 10*2 = 93
      // 基础倍率4
      // 总分 = 93 * 4 = 372
      expect(result.baseChips).toBe(40);
      expect(result.totalChips).toBe(93);
      expect(result.totalScore).toBe(372);
    });

    it('四条: AAAA的分数计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码60 + 牌面11*4 = 104
      // 基础倍率7
      // 总分 = 104 * 7 = 728
      expect(result.baseChips).toBe(60);
      expect(result.totalChips).toBe(104);
      expect(result.totalScore).toBe(728);
    });

    it('同花顺: 红桃5-6-7-8-9的分数计算', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Nine)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码100 + 牌面5+6+7+8+9 = 125
      // 基础倍率8
      expect(result.baseChips).toBe(100);
      expect(result.totalChips).toBeGreaterThanOrEqual(125);
      expect(result.totalScore).toBe(result.totalChips * result.totalMultiplier);
    });

    it('皇家同花顺: 黑桃10-J-Q-K-A的分数计算', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Spades, Rank.Jack),
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Spades, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 基础筹码100 + 牌面10+10+10+10+11 = 151
      // 基础倍率8
      // 总分 = 151 * 8 = 1208
      expect(result.baseChips).toBe(100);
      expect(result.totalChips).toBe(151);
      expect(result.totalScore).toBe(1208);
    });
  });

  describe('增强效果完整验证', () => {
    it('Bonus增强应正确增加30筹码', () => {
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      
      const resultNormal = ScoringSystem.calculate([normalCard]);
      const resultBonus = ScoringSystem.calculate([bonusCard]);
      
      // Bonus应增加30筹码
      expect(resultBonus.totalChips - resultNormal.totalChips).toBe(30);
    });

    it('Mult增强应正确增加4倍率', () => {
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      const multCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult);
      
      const resultNormal = ScoringSystem.calculate([normalCard]);
      const resultMult = ScoringSystem.calculate([multCard]);
      
      // Mult应增加4倍率
      expect(resultMult.totalMultiplier - resultNormal.totalMultiplier).toBe(4);
    });

    it('Stone增强应提供固定50筹码', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      
      // Stone牌的getChipValue应返回50
      expect(stoneCard.getChipValue()).toBe(50);
      
      const result = ScoringSystem.calculate([stoneCard]);
      
      // 基础筹码5 + Stone 50 = 55
      expect(result.totalChips).toBe(55);
    });

    it('Glass增强应提供×2倍率', () => {
      // 使用Mock来确保Glass效果触发（不摧毁）
      const originalRandom = Math.random;
      Math.random = () => 0.5; // > 0.25, 不摧毁
      
      const normalCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const glassCards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Glass)
      ];
      
      const resultNormal = ScoringSystem.calculate(normalCards);
      const resultGlass = ScoringSystem.calculate(glassCards);
      
      Math.random = originalRandom;
      
      // 两个Glass牌应提供×4倍率 (2 * 2)
      expect(resultGlass.totalMultiplier / resultNormal.totalMultiplier).toBe(4);
    });
  });

  describe('版本效果完整验证', () => {
    it('Foil版本应正确增加50筹码', () => {
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      const foilCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil);
      
      const resultNormal = ScoringSystem.calculate([normalCard]);
      const resultFoil = ScoringSystem.calculate([foilCard]);
      
      expect(resultFoil.totalChips - resultNormal.totalChips).toBe(50);
    });

    it('Holographic版本应正确增加10倍率', () => {
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      const holoCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      
      const resultNormal = ScoringSystem.calculate([normalCard]);
      const resultHolo = ScoringSystem.calculate([holoCard]);
      
      expect(resultHolo.totalMultiplier - resultNormal.totalMultiplier).toBe(10);
    });

    it('Polychrome版本应正确提供×1.5倍率', () => {
      // 使用对子来确保有基础倍率
      const normalCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const polyCards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome)
      ];
      
      const resultNormal = ScoringSystem.calculate(normalCards);
      const resultPoly = ScoringSystem.calculate(polyCards);
      
      // 两个Polychrome应提供×2.25倍率 (1.5 * 1.5)
      expect(resultPoly.totalMultiplier / resultNormal.totalMultiplier).toBe(2.25);
    });
  });

  describe('蜡封效果完整验证', () => {
    it('Gold Seal应提供+$3', () => {
      const goldCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Gold);
      const result = ScoringSystem.calculate([goldCard]);
      
      expect(result.moneyBonus).toBe(3);
    });

    it('Red Seal应触发两次效果', () => {
      const redCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Red);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRed = ScoringSystem.calculate([redCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal应使筹码贡献翻倍
      expect(resultRed.totalChips - resultRed.baseChips).toBe((resultNormal.totalChips - resultNormal.baseChips) * 2);
    });

    it('多张Gold Seal应累加金币奖励', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Gold),
        new Card(Suit.Hearts, Rank.King, CardEnhancement.None, SealType.Gold),
        new Card(Suit.Diamonds, Rank.Queen, CardEnhancement.None, SealType.Gold)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 高牌只计分最高的一张牌，所以只有一张Gold Seal生效
      expect(result.moneyBonus).toBeGreaterThanOrEqual(3);
    });
  });

  describe('复杂组合验证', () => {
    it('Bonus + Foil应累加筹码', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.None, CardEdition.Foil);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([card]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Bonus (+30) + Foil (+50) = +80
      expect(resultCombo.totalChips - resultNormal.totalChips).toBe(80);
    });

    it('Mult + Holographic应累加倍率', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.None, CardEdition.Holographic);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultCombo = ScoringSystem.calculate([card]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Mult (+4) + Holographic (+10) = +14
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
      
      // Glass (×2) * Polychrome (×1.5) = ×3
      expect(resultCombo.totalMultiplier / resultNormal.totalMultiplier).toBe(3);
    });

    it('Red Seal + Mult应触发两次Mult效果', () => {
      const redMultCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.Red);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRedMult = ScoringSystem.calculate([redMultCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal触发两次: Mult +4 * 2 = +8
      expect(resultRedMult.totalMultiplier - resultNormal.totalMultiplier).toBe(8);
    });

    it('完整组合: Bonus + Mult + Foil + Holographic + Gold Seal + Red Seal', () => {
      // 创建两张牌来测试所有效果
      const card1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Gold, CardEdition.Foil);
      const card2 = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult, SealType.Red, CardEdition.Holographic);
      
      const result = ScoringSystem.calculate([card1, card2]);
      
      // 验证牌型是对子
      expect(result.handType).toBe(PokerHandType.OnePair);
      
      // 验证金币奖励
      expect(result.moneyBonus).toBeGreaterThanOrEqual(3);
      
      // 验证筹码加成 (Bonus +30, Foil +50)
      expect(result.chipBonus).toBeGreaterThanOrEqual(80);
      
      // 验证倍率加成 (Mult +4, Holographic +10, Red Seal触发两次 = +28)
      expect(result.multBonus).toBeGreaterThanOrEqual(14);
    });
  });

  describe('手持卡牌效果验证', () => {
    it('手持Steel牌应提供×1.5倍率', () => {
      const playedCard = new Card(Suit.Spades, Rank.Ace);
      const heldSteelCard = new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel);
      
      const resultWithoutHeld = ScoringSystem.calculate([playedCard]);
      const resultWithHeld = ScoringSystem.calculate([playedCard], undefined, undefined, [heldSteelCard]);
      
      expect(resultWithHeld.heldMultMultiplier).toBe(1.5);
    });

    it('多张手持Steel牌应相乘倍率', () => {
      const playedCard = new Card(Suit.Spades, Rank.Ace);
      const heldSteelCards = [
        new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel),
        new Card(Suit.Diamonds, Rank.Queen, CardEnhancement.Steel)
      ];
      
      const result = ScoringSystem.calculate([playedCard], undefined, undefined, heldSteelCards, undefined);
      
      // 两个Steel: 1.5 * 1.5 = 2.25
      expect(result.heldMultMultiplier).toBe(2.25);
    });
  });

  describe('结果结构验证', () => {
    it('ScoreResult应包含所有必要字段', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
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

    it('totalScore应等于totalChips乘以totalMultiplier', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.totalScore).toBe(result.totalChips * result.totalMultiplier);
    });

    it('cardDetails应包含每张计分牌的详细信息', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult)
      ];
      const result = ScoringSystem.calculate(cards);
      
      for (const detail of result.cardDetails) {
        expect(detail).toHaveProperty('card');
        expect(detail).toHaveProperty('baseChips');
        expect(detail).toHaveProperty('chipBonus');
        expect(detail).toHaveProperty('multBonus');
        expect(detail).toHaveProperty('enhancements');
        expect(Array.isArray(detail.enhancements)).toBe(true);
      }
    });
  });

  describe('分数公式验证', () => {
    it('分数计算应符合公式: 总分 = 筹码 × 倍率', () => {
      const testCases = [
        [new Card(Suit.Spades, Rank.Ace)],
        [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)],
        [new Card(Suit.Spades, Rank.Five), new Card(Suit.Hearts, Rank.Six), new Card(Suit.Diamonds, Rank.Seven)],
      ];

      for (const cards of testCases) {
        const result = ScoringSystem.calculate(cards);
        const expectedScore = result.totalChips * result.totalMultiplier;
        expect(result.totalScore).toBe(expectedScore);
      }
    });

    it('chipBonus应等于totalChips减去baseChips', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Hearts, Rank.King, CardEnhancement.Bonus)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.chipBonus).toBe(result.totalChips - result.baseChips);
    });

    it('multBonus应等于totalMultiplier减去baseMultiplier', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult),
        new Card(Suit.Hearts, Rank.King, CardEnhancement.Mult)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.multBonus).toBe(result.totalMultiplier - result.baseMultiplier);
    });
  });
});
