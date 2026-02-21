import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { Suit, Rank, CardEnhancement, CardEdition, SealType } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

/**
 * 分数计算边界情况测试
 * 测试各种边界情况和异常场景
 */
describe('ScoringSystem Edge Cases', () => {
  
  describe('空牌组和单张牌', () => {
    it('空牌组应返回0分', () => {
      const result = ScoringSystem.calculate([]);
      expect(result.totalScore).toBe(0);
      expect(result.totalChips).toBe(0);
      expect(result.totalMultiplier).toBe(0);
    });

    it('单张最低牌(2)的分数计算', () => {
      const card = new Card(Suit.Spades, Rank.Two);
      const result = ScoringSystem.calculate([card]);
      
      // 基础筹码5 + 牌面2 = 7
      expect(result.totalChips).toBe(7);
      expect(result.totalScore).toBe(7);
    });

    it('单张最高牌(A)的分数计算', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      const result = ScoringSystem.calculate([card]);
      
      // 基础筹码5 + 牌面11 = 16
      expect(result.totalChips).toBe(16);
      expect(result.totalScore).toBe(16);
    });
  });

  describe('多张相同牌', () => {
    it('两张相同牌应检测为对子', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.OnePair);
    });

    it('三张相同牌应检测为三条', () => {
      const cards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.ThreeOfAKind);
    });

    it('四张相同牌应检测为四条', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Queen)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
    });
  });

  describe('超过5张牌的情况', () => {
    it('6张牌应选择最佳牌型', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.King),
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Hearts, Rank.Queen)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 应该检测到两对（AA + KK + QQ）
      expect(result.handType).toBe(PokerHandType.TwoPair);
    });

    it('7张牌包含同花顺时应检测为同花顺', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Nine),
        new Card(Suit.Spades, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.StraightFlush);
    });
  });

  describe('A作为低牌的情况', () => {
    it('A-2-3-4-5应检测为顺子(小顺)', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Five)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.Straight);
    });

    it('A-2-3-4-5同花应检测为同花顺(小同花顺)', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Three),
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Hearts, Rank.Five)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.StraightFlush);
    });
  });

  describe('石头牌(Stone)特殊处理', () => {
    it('石头牌应总是计分', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      const highCard = new Card(Suit.Hearts, Rank.Ace);
      
      const cards = [highCard, stoneCard];
      const result = ScoringSystem.calculate(cards);
      
      // Stone牌应该被包含在计分牌中
      const stoneInScoring = result.scoringCards.some(c => 
        c.enhancement === CardEnhancement.Stone
      );
      expect(stoneInScoring).toBe(true);
    });

    it('石头牌应提供50筹码', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      const result = ScoringSystem.calculate([stoneCard]);
      
      // 基础筹码5 + Stone 50 = 55
      expect(result.totalChips).toBe(55);
    });

    it('石头牌不应有有效花色', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Stone);
      expect(stoneCard.getEffectiveSuit()).toBeNull();
    });

    it('石头牌不应有有效点数', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Stone);
      expect(stoneCard.getEffectiveRank()).toBeNull();
    });
  });

  describe('万能牌(Wild)特殊处理', () => {
    it('万能牌应帮助形成同花', () => {
      const wildCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild);
      const cards = [
        wildCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.Flush);
    });

    it('万能牌应帮助形成顺子', () => {
      const wildCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild);
      const cards = [
        wildCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Five)
      ];
      const result = ScoringSystem.calculate(cards);
      
      expect(result.handType).toBe(PokerHandType.Straight);
    });
  });

  describe('Glass牌摧毁机制', () => {
    it('Glass牌有1/4概率被摧毁', () => {
      // Mock Math.random来模拟摧毁
      const originalRandom = Math.random;
      Math.random = () => 0.1; // < 0.25, 触发摧毁
      
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      const result = ScoringSystem.calculate([glassCard]);
      
      Math.random = originalRandom;
      
      expect(result.destroyedCards).toBeDefined();
      expect(result.destroyedCards!.length).toBeGreaterThan(0);
    });

    it('Glass牌有3/4概率不被摧毁', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // > 0.25, 不摧毁
      
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      const result = ScoringSystem.calculate([glassCard]);
      
      Math.random = originalRandom;
      
      // destroyedCards可能是undefined或空数组
      const hasDestroyedCards = result.destroyedCards && result.destroyedCards.length > 0;
      expect(hasDestroyedCards).toBeFalsy();
    });
  });

  describe('Lucky牌概率触发', () => {
    it('Lucky牌1/5概率触发+20倍率', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.1; // < 0.2, 触发倍率
      
      const luckyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Lucky);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultLucky = ScoringSystem.calculate([luckyCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      Math.random = originalRandom;
      
      // 应增加20倍率
      expect(resultLucky.totalMultiplier - resultNormal.totalMultiplier).toBeGreaterThanOrEqual(20);
    });

    it('Lucky牌1/15概率触发+$20', () => {
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        // 第一次调用（倍率检查）> 0.2
        // 第二次调用（金币检查）< 1/15
        return callCount === 1 ? 0.3 : 0.05;
      };
      
      const luckyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Lucky);
      const result = ScoringSystem.calculate([luckyCard]);
      
      Math.random = originalRandom;
      
      expect(result.moneyBonus).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Red Seal触发两次', () => {
    it('Red Seal应使卡牌效果触发两次', () => {
      const redCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Red);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRed = ScoringSystem.calculate([redCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal应使筹码贡献翻倍
      const chipContributionRed = resultRed.totalChips - resultRed.baseChips;
      const chipContributionNormal = resultNormal.totalChips - resultNormal.baseChips;
      
      expect(chipContributionRed).toBe(chipContributionNormal * 2);
    });

    it('Red Seal + Bonus应触发两次Bonus效果', () => {
      const redBonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Red);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRedBonus = ScoringSystem.calculate([redBonusCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal触发两次: (牌面11 + Bonus +30) * 2 = 82
      // 相比普通牌(牌面11): 82 - 11 = 71
      const chipDiff = resultRedBonus.totalChips - resultNormal.totalChips;
      expect(chipDiff).toBe(71); // (11 + 30) * 2 - 11 = 71
    });

    it('Red Seal + Mult应触发两次Mult效果', () => {
      const redMultCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.Red);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      const resultRedMult = ScoringSystem.calculate([redMultCard]);
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Red Seal触发两次: Mult +4 * 2 = +8
      const multDiff = resultRedMult.totalMultiplier - resultNormal.totalMultiplier;
      expect(multDiff).toBe(8);
    });
  });

  describe('手持卡牌效果', () => {
    it('手持Steel牌不应影响打出牌的筹码', () => {
      const playedCard = new Card(Suit.Spades, Rank.Ace);
      const heldSteelCard = new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel);
      
      const resultWithoutHeld = ScoringSystem.calculate([playedCard]);
      const resultWithHeld = ScoringSystem.calculate([playedCard], undefined, undefined, [heldSteelCard], undefined);
      
      // 筹码应相同（Steel只影响倍率）
      expect(resultWithHeld.totalChips).toBe(resultWithoutHeld.totalChips);
    });

    it('手持Steel牌应提供倍率乘数', () => {
      const playedCard = new Card(Suit.Spades, Rank.Ace);
      const heldSteelCard = new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel);
      
      const result = ScoringSystem.calculate([playedCard], undefined, undefined, [heldSteelCard], undefined);
      
      expect(result.heldMultMultiplier).toBe(1.5);
    });
  });

  describe('踢牌(Kickers)处理', () => {
    it('对子的踢牌不应计分', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 踢牌不应在计分牌中
      expect(result.kickers.length).toBeGreaterThan(0);
      
      // 踢牌的chipBonus应为0
      for (const kicker of result.kickers) {
        const kickerDetail = result.cardDetails.find(d => d.card === kicker.toString());
        if (kickerDetail) {
          expect(kickerDetail.chipBonus).toBe(0);
        }
      }
    });

    it('四条的踢牌不应计分', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.King)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // King应该是踢牌
      const kingKicker = result.kickers.find(c => c.rank === Rank.King);
      expect(kingKicker).toBeDefined();
    });
  });

  describe('指定牌型计算', () => {
    it('应能强制使用指定牌型计算', () => {
      // 实际是同花顺的牌
      const cards = [
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Nine)
      ];
      
      // 强制按对子计算
      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair);
      
      expect(result.handType).toBe(PokerHandType.OnePair);
    });
  });

  describe('牌型检测优先级', () => {
    it('同花顺应优先于同花', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Hearts, Rank.Eight),
        new Card(Suit.Hearts, Rank.Nine)
      ];
      const result = PokerHandDetector.detect(cards);
      
      expect(result.handType).toBe(PokerHandType.StraightFlush);
    });

    it('葫芦应优先于同花', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.King)
      ];
      const result = PokerHandDetector.detect(cards);
      
      expect(result.handType).toBe(PokerHandType.FullHouse);
    });

    it('四条应优先于葫芦', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];
      const result = PokerHandDetector.detect(cards);
      
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
    });
  });

  describe('结果格式化', () => {
    it('formatScoreResult应返回有效字符串', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      const formatted = ScoringSystem.formatScoreResult(result);
      
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('formatScoreResult应包含关键信息', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      const result = ScoringSystem.calculate(cards);
      const formatted = ScoringSystem.formatScoreResult(result);
      
      expect(formatted).toContain('得分详情');
      expect(formatted).toContain('牌型');
      expect(formatted).toContain('最终得分');
    });
  });

  describe('极端数值', () => {
    it('应能处理大量增强效果', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Clubs, Rank.Ace, CardEnhancement.Bonus),
        new Card(Suit.Spades, Rank.Two, CardEnhancement.Bonus)
      ];
      const result = ScoringSystem.calculate(cards);
      
      // 四条 + 5张Bonus牌
      expect(result.handType).toBe(PokerHandType.FourOfAKind);
      expect(result.chipBonus).toBeGreaterThanOrEqual(150); // 至少5个Bonus
    });

    it('应能处理多种倍率乘数', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 不摧毁Glass牌
      
      const cards = [
        new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome)
      ];
      const heldCards = [
        new Card(Suit.Diamonds, Rank.King, CardEnhancement.Steel),
        new Card(Suit.Clubs, Rank.Queen, CardEnhancement.Steel)
      ];
      
      const result = ScoringSystem.calculate(cards, undefined, undefined, heldCards, undefined);
      
      Math.random = originalRandom;
      
      // 验证有倍率乘数
      expect(result.heldMultMultiplier).toBe(2.25); // 1.5 * 1.5
    });
  });
});
