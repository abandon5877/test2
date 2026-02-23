import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Card } from '../models/Card';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { getJokerById } from '../data/jokers';

describe('触发器系统测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('ON_REROLL触发器', () => {
    it('chaos_the_clown (混沌小丑): 应返回免费刷新', () => {
      const joker = getJokerById('chaos_the_clown')!;
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processReroll(jokerSlots);

      console.log('[测试] 混沌小丑结果:', result);
      expect(result.freeReroll).toBe(true);
      expect(result.effects.length).toBeGreaterThan(0);
      expect(result.effects[0].jokerName).toBe('混沌小丑');
    });

    it('processReroll: 没有混沌小丑时不应返回免费刷新', () => {
      const result = JokerSystem.processReroll(jokerSlots);

      expect(result.freeReroll).toBe(false);
      expect(result.effects.length).toBe(0);
    });
  });

  describe('ON_BLIND_SELECT触发器', () => {
    it('cartomancer (纸牌占卜师): 应触发效果', () => {
      const joker = getJokerById('cartomancer')!;
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processBlindSelect(jokerSlots);

      console.log('[测试] 纸牌占卜师结果:', result);
      expect(result.effects.length).toBeGreaterThan(0);
      expect(result.effects[0].jokerName).toBe('纸牌占卜师');
    });

    it('processBlindSelect: 没有纸牌占卜师时不应返回效果', () => {
      const result = JokerSystem.processBlindSelect(jokerSlots);

      expect(result.effects.length).toBe(0);
    });
  });

  describe('ON_HAND_PLAYED触发器 (修复后)', () => {
    it('steel_joker (钢铁小丑): 牌库有钢铁牌时应提供倍率加成', () => {
      const joker = getJokerById('steel_joker')!;

      // 修复后：钢铁小丑基于牌库中钢铁牌数量提供倍率
      // 直接测试效果函数，传入 steelCardsInDeck
      const context = {
        steelCardsInDeck: 2,
        scoredCards: [new Card(Suit.Hearts, Rank.Ace)],
        handType: PokerHandType.HighCard,
        gameState: { money: 10, interestCap: 20, hands: 3, discards: 2 }
      };

      const result = joker.effect!(context);
      console.log('[测试] 钢铁小丑结果:', result);

      expect(result.multMultiplier).toBeDefined();
      // 2张钢铁牌 * 0.2 = 0.4, 1 + 0.4 = 1.4
      expect(result.multMultiplier).toBeCloseTo(1.4, 1);
    });

    it('processHeld: 没有钢制小丑时不应返回效果', () => {
      const steelCard = new Card(Suit.Spades, Rank.Ace);
      steelCard.enhancement = CardEnhancement.Steel;

      const result = JokerSystem.processHeld(jokerSlots, [steelCard]);

      expect(result.effects.length).toBe(0);
      expect(result.multBonus).toBe(0);
    });

    it('processHeld: 没有钢铁牌时不应触发效果', () => {
      const joker = getJokerById('steel_joker')!;
      jokerSlots.addJoker(joker);

      const normalCard = new Card(Suit.Spades, Rank.Ace);
      const result = JokerSystem.processHeld(jokerSlots, [normalCard]);

      expect(result.effects.length).toBe(0);
      expect(result.multBonus).toBe(0);
    });
  });

  describe('触发器方法存在性检查', () => {
    it('所有ON_REROLL小丑牌都应有onReroll方法', () => {
      const joker = getJokerById('chaos_the_clown')!;
      expect(typeof joker.onReroll).toBe('function');
    });

    it('所有ON_BLIND_SELECT小丑牌都应有onBlindSelect方法', () => {
      const joker = getJokerById('cartomancer')!;
      expect(typeof joker.onBlindSelect).toBe('function');
    });

    it('所有ON_HELD小丑牌都应有onHeld方法', () => {
      const joker = getJokerById('steel_joker')!;
      expect(typeof joker.onHeld).toBe('function');
    });
  });
});
