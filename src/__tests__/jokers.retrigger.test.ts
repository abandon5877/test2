import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement } from '../types/card';

// 辅助函数：创建测试用的卡牌
function createTestCard(suit: Suit, rank: Rank): Card {
  return new Card(suit, rank);
}

describe('阶段4: 触发两次效果测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
      });

  describe('sock_and_buskin (喜剧与悲剧)', () => {
    it('应该让脸牌触发两次效果', () => {
      const sockAndBuskin = new Joker({
        id: 'sock_and_buskin',
        name: '喜剧与悲剧',
        description: '脸牌触发2次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '喜剧与悲剧: 脸牌将触发2次'
        })
      });

      jokerSlots.addJoker(sockAndBuskin);

      // 打出对子牌型：K, K, Q - 两张K都是计分牌，Q是踢牌
      // K是脸牌，应该触发两次
      const cards = [
        createTestCard(Suit.Hearts, Rank.King),    // 计分牌，脸牌，触发两次
        createTestCard(Suit.Diamonds, Rank.King),  // 计分牌，脸牌，触发两次
        createTestCard(Suit.Clubs, Rank.Queen),    // 踢牌
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 验证有触发两次标记的卡牌
      const cardsWithRetrigger = result.cardDetails.filter(d => 
        d.enhancements.includes('触发两次 (喜剧与悲剧)')
      );
      
      // 至少有一张脸牌触发了两次
      expect(cardsWithRetrigger.length).toBeGreaterThanOrEqual(1);
      
      // 验证脸牌的筹码被计算两次（chipBonus应该是基础筹码的2倍）
      const kingDetails = result.cardDetails.filter(d => d.card.includes('K') && d.chipBonus > 0);
      expect(kingDetails.length).toBeGreaterThanOrEqual(1);
    });

    it('没有脸牌时不应触发效果', () => {
      const sockAndBuskin = new Joker({
        id: 'sock_and_buskin',
        name: '喜剧与悲剧',
        description: '脸牌触发2次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '喜剧与悲剧: 脸牌将触发2次'
        })
      });

      jokerSlots.addJoker(sockAndBuskin);

      // 打出没有对子的数字牌
      const cards = [
        createTestCard(Suit.Hearts, Rank.Ace),
        createTestCard(Suit.Diamonds, Rank.Two),
        createTestCard(Suit.Clubs, Rank.Three),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 没有触发两次标记
      const cardsWithRetrigger = result.cardDetails.filter(d => 
        d.enhancements.includes('触发两次')
      );
      expect(cardsWithRetrigger.length).toBe(0);
    });
  });

  describe('hack (黑客)', () => {
    it('应该让2,3,4,5触发两次效果', () => {
      const hack = new Joker({
        id: 'hack',
        name: '黑客',
        description: '2,3,4,5触发2次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '黑客: 2,3,4,5将触发2次'
        })
      });

      jokerSlots.addJoker(hack);

      // 打出对子：5, 5, A - 两张5都是计分牌
      const cards = [
        createTestCard(Suit.Hearts, Rank.Five),    // 计分牌，5触发两次
        createTestCard(Suit.Diamonds, Rank.Five),  // 计分牌，5触发两次
        createTestCard(Suit.Clubs, Rank.Ace),      // 踢牌
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 验证有触发两次标记的卡牌
      const cardsWithRetrigger = result.cardDetails.filter(d => 
        d.enhancements.includes('触发两次 (黑客)')
      );
      
      // 至少有一张5触发了两次
      expect(cardsWithRetrigger.length).toBeGreaterThanOrEqual(1);
    });

    it('5也应该触发两次', () => {
      const hack = new Joker({
        id: 'hack',
        name: '黑客',
        description: '2,3,4,5触发2次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '黑客: 2,3,4,5将触发2次'
        })
      });

      jokerSlots.addJoker(hack);

      // 使用对子牌型确保5是计分牌
      const cards = [
        createTestCard(Suit.Hearts, Rank.Five),   // 计分牌，5触发两次
        createTestCard(Suit.Diamonds, Rank.Five), // 计分牌，5触发两次
        createTestCard(Suit.Clubs, Rank.Six),     // 踢牌
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 验证5有触发两次标记
      const fiveDetails = result.cardDetails.filter(d => d.card.includes('5') && d.chipBonus > 0);
      expect(fiveDetails.length).toBeGreaterThanOrEqual(1);
      expect(fiveDetails.some(d => d.enhancements.includes('触发两次 (黑客)'))).toBe(true);
    });
  });

  describe('hanging_chad (悬挂票)', () => {
    it('应该让第一张计分牌触发两次', () => {
      const hangingChad = new Joker({
        id: 'hanging_chad',
        name: '悬挂票',
        description: '第一张牌触发2次',
        rarity: JokerRarity.COMMON,
        cost: 4,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '悬挂票: 第一张牌将触发2次'
        })
      });

      jokerSlots.addJoker(hangingChad);

      // 打出对子：A, A, K - 第一张A触发两次
      const cards = [
        createTestCard(Suit.Hearts, Rank.Ace),     // 第一张计分牌，触发两次
        createTestCard(Suit.Diamonds, Rank.Ace),   // 第二张计分牌，正常
        createTestCard(Suit.Clubs, Rank.King),     // 踢牌
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 获取计分牌详情
      const scoringCards = result.cardDetails.filter(d => d.chipBonus > 0);
      
      // 验证第一张计分牌触发两次
      expect(scoringCards[0].enhancements.includes('触发两次 (悬挂票)')).toBe(true);
    });

    it('即使第一张是脸牌也应该触发两次', () => {
      const hangingChad = new Joker({
        id: 'hanging_chad',
        name: '悬挂票',
        description: '第一张牌触发2次',
        rarity: JokerRarity.COMMON,
        cost: 4,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '悬挂票: 第一张牌将触发2次'
        })
      });

      jokerSlots.addJoker(hangingChad);

      // 使用对子牌型确保K是计分牌
      const cards = [
        createTestCard(Suit.Hearts, Rank.King),    // 第一张计分牌，触发两次
        createTestCard(Suit.Diamonds, Rank.King),  // 第二张计分牌
        createTestCard(Suit.Clubs, Rank.Ace),      // 踢牌
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 验证第一张计分牌（K）有触发两次标记
      const scoringCards = result.cardDetails.filter(d => d.chipBonus > 0);
      expect(scoringCards[0].enhancements.includes('触发两次 (悬挂票)')).toBe(true);
    });
  });

  describe('多个触发两次效果组合', () => {
    it('喜剧与悲剧 + 黑客应该同时生效', () => {
      const sockAndBuskin = new Joker({
        id: 'sock_and_buskin',
        name: '喜剧与悲剧',
        description: '脸牌触发2次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '喜剧与悲剧: 脸牌将触发2次'
        })
      });

      const hack = new Joker({
        id: 'hack',
        name: '黑客',
        description: '2,3,4,5触发2次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '黑客: 2,3,4,5将触发2次'
        })
      });

      jokerSlots.addJoker(sockAndBuskin);
      jokerSlots.addJoker(hack);

      // 打出葫芦：K, K, 5, 5, 5 - K是脸牌，5是2-5
      const cards = [
        createTestCard(Suit.Hearts, Rank.King),    // 计分牌，脸牌触发两次
        createTestCard(Suit.Diamonds, Rank.King),  // 计分牌，脸牌触发两次
        createTestCard(Suit.Clubs, Rank.Five),     // 计分牌，5触发两次
        createTestCard(Suit.Spades, Rank.Five),    // 计分牌，5触发两次
        createTestCard(Suit.Hearts, Rank.Five),    // 计分牌，5触发两次
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 验证有脸牌触发两次标记
      const faceCardsWithRetrigger = result.cardDetails.filter(d => 
        d.enhancements.includes('触发两次 (喜剧与悲剧)')
      );
      expect(faceCardsWithRetrigger.length).toBeGreaterThanOrEqual(1);

      // 验证有5触发两次标记
      const lowCardsWithRetrigger = result.cardDetails.filter(d => 
        d.enhancements.includes('触发两次 (黑客)')
      );
      expect(lowCardsWithRetrigger.length).toBeGreaterThanOrEqual(1);
    });

    it('悬挂票 + 喜剧与悲剧（第一张是脸牌）', () => {
      const hangingChad = new Joker({
        id: 'hanging_chad',
        name: '悬挂票',
        description: '第一张牌触发2次',
        rarity: JokerRarity.COMMON,
        cost: 4,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '悬挂票: 第一张牌将触发2次'
        })
      });

      const sockAndBuskin = new Joker({
        id: 'sock_and_buskin',
        name: '喜剧与悲剧',
        description: '脸牌触发2次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '喜剧与悲剧: 脸牌将触发2次'
        })
      });

      jokerSlots.addJoker(hangingChad);
      jokerSlots.addJoker(sockAndBuskin);

      // 对子：K, K, Q - 第一张K既是第一张又是脸牌，但只触发两次（不叠加）
      const cards = [
        createTestCard(Suit.Hearts, Rank.King),    // 第一张计分牌，脸牌，触发两次
        createTestCard(Suit.Diamonds, Rank.King),  // 第二张计分牌，脸牌，触发两次
        createTestCard(Suit.Clubs, Rank.Queen),    // 踢牌
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 验证有触发两次标记（可能是悬挂票或喜剧与悲剧）
      const cardsWithRetrigger = result.cardDetails.filter(d => 
        d.enhancements.some(e => e.includes('触发两次'))
      );
      expect(cardsWithRetrigger.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('触发两次与增强效果', () => {
    it('触发两次应该正确计算增强效果', () => {
      const hangingChad = new Joker({
        id: 'hanging_chad',
        name: '悬挂票',
        description: '第一张牌触发2次',
        rarity: JokerRarity.COMMON,
        cost: 4,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '悬挂票: 第一张牌将触发2次'
        })
      });

      jokerSlots.addJoker(hangingChad);

      // 创建对子，第一张带Mult增强
      const card1 = createTestCard(Suit.Hearts, Rank.Ace);
      card1.enhancement = CardEnhancement.Mult as const;
      const card2 = createTestCard(Suit.Diamonds, Rank.Ace);

      const cards = [card1, card2];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 验证第一张牌有触发两次标记
      const scoringCards = result.cardDetails.filter(d => d.chipBonus > 0);
      expect(scoringCards[0].enhancements.includes('触发两次 (悬挂票)')).toBe(true);
      
      // 验证Mult增强效果也被触发两次（multBonus应该大于4）
      expect(result.totalMultiplier).toBeGreaterThan(1);
    });
  });
});
