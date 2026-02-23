import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { cardMatchesSuit, isRedCard, isBlackCard } from '../utils/suitUtils';

describe('Smeared_Joker 污损小丑集成测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
    PokerHandDetector.clearConfig();
  });

  describe('花色工具函数测试', () => {
    it('cardMatchesSuit - 无Smeared_Joker时应精确匹配花色', () => {
      const heartCard = new Card(Suit.Hearts, Rank.Ace);
      const diamondCard = new Card(Suit.Diamonds, Rank.Ace);

      expect(cardMatchesSuit(heartCard, Suit.Hearts, false)).toBe(true);
      expect(cardMatchesSuit(heartCard, Suit.Diamonds, false)).toBe(false);
      expect(cardMatchesSuit(diamondCard, Suit.Diamonds, false)).toBe(true);
      expect(cardMatchesSuit(diamondCard, Suit.Hearts, false)).toBe(false);
    });

    it('cardMatchesSuit - Smeared_Joker激活时红桃应匹配方片', () => {
      const heartCard = new Card(Suit.Hearts, Rank.Ace);
      const diamondCard = new Card(Suit.Diamonds, Rank.Ace);

      // 红桃和方片都是红色，应该互相匹配
      expect(cardMatchesSuit(heartCard, Suit.Hearts, true)).toBe(true);
      expect(cardMatchesSuit(heartCard, Suit.Diamonds, true)).toBe(true);
      expect(cardMatchesSuit(diamondCard, Suit.Diamonds, true)).toBe(true);
      expect(cardMatchesSuit(diamondCard, Suit.Hearts, true)).toBe(true);
    });

    it('cardMatchesSuit - Smeared_Joker激活时黑桃应匹配梅花', () => {
      const spadeCard = new Card(Suit.Spades, Rank.Ace);
      const clubCard = new Card(Suit.Clubs, Rank.Ace);

      // 黑桃和梅花都是黑色，应该互相匹配
      expect(cardMatchesSuit(spadeCard, Suit.Spades, true)).toBe(true);
      expect(cardMatchesSuit(spadeCard, Suit.Clubs, true)).toBe(true);
      expect(cardMatchesSuit(clubCard, Suit.Clubs, true)).toBe(true);
      expect(cardMatchesSuit(clubCard, Suit.Spades, true)).toBe(true);
    });

    it('isRedCard - 应正确识别红色牌', () => {
      const heartCard = new Card(Suit.Hearts, Rank.Ace);
      const diamondCard = new Card(Suit.Diamonds, Rank.Ace);
      const spadeCard = new Card(Suit.Spades, Rank.Ace);

      expect(isRedCard(heartCard)).toBe(true);
      expect(isRedCard(diamondCard)).toBe(true);
      expect(isRedCard(spadeCard)).toBe(false);
    });

    it('isBlackCard - 应正确识别黑色牌', () => {
      const spadeCard = new Card(Suit.Spades, Rank.Ace);
      const clubCard = new Card(Suit.Clubs, Rank.Ace);
      const heartCard = new Card(Suit.Hearts, Rank.Ace);

      expect(isBlackCard(spadeCard)).toBe(true);
      expect(isBlackCard(clubCard)).toBe(true);
      expect(isBlackCard(heartCard)).toBe(false);
    });
  });

  describe('PokerHandDetector 同花检测', () => {
    it('无Smeared_Joker时3红桃+2方片不应识别为同花', () => {
      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Three),
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Diamonds, Rank.Five),
        new Card(Suit.Diamonds, Rank.Six),
      ];

      PokerHandDetector.setConfig({ smearedJoker: false });
      const result = PokerHandDetector.detect(cards);

      expect(result.handType).not.toBe(PokerHandType.Flush);
    });

    it('Smeared_Joker激活时3红桃+2方片应识别为同花（都是红色）', () => {
      // 使用不连续的牌避免形成顺子
      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Eight),
        new Card(Suit.Diamonds, Rank.Ten),
      ];

      PokerHandDetector.setConfig({ smearedJoker: true });
      const result = PokerHandDetector.detect(cards);

      expect(result.handType).toBe(PokerHandType.Flush);
      expect(result.description).toContain('污损');
    });

    it('Smeared_Joker激活时3黑桃+2梅花应识别为同花（都是黑色）', () => {
      // 使用不连续的牌避免形成顺子
      const cards = [
        new Card(Suit.Spades, Rank.Two),
        new Card(Suit.Spades, Rank.Five),
        new Card(Suit.Spades, Rank.Seven),
        new Card(Suit.Clubs, Rank.Nine),
        new Card(Suit.Clubs, Rank.Jack),
      ];

      PokerHandDetector.setConfig({ smearedJoker: true });
      const result = PokerHandDetector.detect(cards);

      expect(result.handType).toBe(PokerHandType.Flush);
    });

    it('Smeared_Joker + Four Fingers组合应正确工作', () => {
      // 使用不连续的牌避免形成顺子
      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Diamonds, Rank.Ten),
      ];

      PokerHandDetector.setConfig({ smearedJoker: true, fourFingers: true });
      const result = PokerHandDetector.detect(cards);

      expect(result.handType).toBe(PokerHandType.Flush);
      expect(result.description).toContain('污损');
    });
  });

  describe('花色相关小丑牌效果', () => {
    it('lusty_joker (色欲小丑) - Smeared_Joker下红桃和方片都应触发', () => {
      const smearedJoker = getJokerById('smeared_joker')!;
      const lustyJoker = getJokerById('lusty_joker')!;

      jokerSlots.addJoker(smearedJoker);
      jokerSlots.addJoker(lustyJoker);

      // 设置PokerHandDetector配置
      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      const scoredCards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Spades, Rank.Four),
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        0,
        0
      );

      // 红桃和方片都是红色，应该都触发色欲小丑（2张 * 3 = 6倍率）
      expect(result.multBonus).toBe(6);
      expect(result.effects.some(e => e.effect.includes('红色牌'))).toBe(true);
    });

    it('wrathful_joker (暴怒小丑) - Smeared_Joker下黑桃和梅花都应触发', () => {
      const smearedJoker = getJokerById('smeared_joker')!;
      const wrathfulJoker = getJokerById('wrathful_joker')!;

      jokerSlots.addJoker(smearedJoker);
      jokerSlots.addJoker(wrathfulJoker);

      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      const scoredCards = [
        new Card(Suit.Spades, Rank.Two),
        new Card(Suit.Clubs, Rank.Three),
        new Card(Suit.Hearts, Rank.Four),
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        0,
        0
      );

      // 黑桃和梅花都是黑色，应该都触发暴怒小丑（2张 * 3 = 6倍率）
      expect(result.multBonus).toBe(6);
      expect(result.effects.some(e => e.effect.includes('黑色牌'))).toBe(true);
    });

    it('bloodstone (血石) - Smeared_Joker下对方片也应生效', () => {
      const smearedJoker = getJokerById('smeared_joker')!;
      const bloodstone = getJokerById('bloodstone')!;

      jokerSlots.addJoker(smearedJoker);
      jokerSlots.addJoker(bloodstone);

      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      // 使用多张方片牌增加触发概率
      const scoredCards = [
        new Card(Suit.Diamonds, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Diamonds, Rank.Four),
        new Card(Suit.Diamonds, Rank.Five),
        new Card(Suit.Diamonds, Rank.Six),
        new Card(Suit.Diamonds, Rank.Seven),
        new Card(Suit.Diamonds, Rank.Eight),
        new Card(Suit.Diamonds, Rank.Nine),
        new Card(Suit.Diamonds, Rank.Ten),
        new Card(Suit.Diamonds, Rank.Jack),
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        0,
        0
      );

      // 方片在Smeared_Joker下被视为红色，应该触发血石效果
      // 血石是概率触发，使用多张牌增加触发概率
      // 验证至少处理了血石效果（即使概率未触发也会记录效果）
      const bloodstoneEffect = result.effects.find(e => e.jokerName === '血石');
      expect(bloodstoneEffect).toBeDefined();
      // 血石效果消息应该包含"红色牌"（Smeared_Joker下）
      expect(bloodstoneEffect?.effect.includes('红色牌') || bloodstoneEffect?.effect.includes('红桃')).toBe(true);
    });

    it('arrowhead (箭头) - Smeared_Joker下对梅花也应生效', () => {
      const smearedJoker = getJokerById('smeared_joker')!;
      const arrowhead = getJokerById('arrowhead')!;

      jokerSlots.addJoker(smearedJoker);
      jokerSlots.addJoker(arrowhead);

      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      // 使用梅花牌测试
      const scoredCards = [
        new Card(Suit.Clubs, Rank.Two),
        new Card(Suit.Clubs, Rank.Three),
      ];

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        0,
        0
      );

      // 梅花在Smeared_Joker下被视为黑色，应该触发箭头效果（2张 * 50 = 100筹码）
      expect(result.chipBonus).toBe(100);
      expect(result.effects.some(e => e.effect.includes('黑色牌'))).toBe(true);
    });

    it('flower_pot (花盆) - Smeared_Joker下只需两种颜色', () => {
      const smearedJoker = getJokerById('smeared_joker')!;
      const flowerPot = getJokerById('flower_pot')!;

      jokerSlots.addJoker(smearedJoker);
      jokerSlots.addJoker(flowerPot);

      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      // 2张红色 + 2张黑色
      const scoredCards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Spades, Rank.Four),
        new Card(Suit.Clubs, Rank.Five),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        0,
        0
      );

      // 有红黑两种颜色，应该触发花盆效果
      expect(result.multMultiplier).toBe(3);
      expect(result.effects.some(e => e.effect.includes('两种颜色'))).toBe(true);
    });
  });

  describe('JokerSystem配置管理', () => {
    it('setPokerHandDetectorConfig应正确检测Smeared_Joker', () => {
      const smearedJoker = getJokerById('smeared_joker')!;
      jokerSlots.addJoker(smearedJoker);

      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      // 验证配置已设置（使用不连续的牌避免形成顺子）
      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Four),
        new Card(Suit.Hearts, Rank.Six),
        new Card(Suit.Diamonds, Rank.Eight),
        new Card(Suit.Hearts, Rank.Ten),
      ];

      const result = PokerHandDetector.detect(cards);
      expect(result.handType).toBe(PokerHandType.Flush);
    });

    it('出售Smeared_Joker后配置应更新', () => {
      const smearedJoker = getJokerById('smeared_joker')!;
      jokerSlots.addJoker(smearedJoker);

      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      // 出售Smeared_Joker
      JokerSystem.sellJoker(jokerSlots, 0);

      // 重新配置
      JokerSystem.setPokerHandDetectorConfig(jokerSlots);

      const cards = [
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Diamonds, Rank.Five),
        new Card(Suit.Hearts, Rank.Six),
      ];

      const result = PokerHandDetector.detect(cards);
      // 没有Smeared_Joker，红桃和方片不算同花
      expect(result.handType).not.toBe(PokerHandType.Flush);
    });
  });
});
