import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';

describe('ON_PLAY 触发器类小丑牌测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
    
  });

  describe('基础小丑牌', () => {
    it('小丑: +4倍率', () => {
      const joker = getJokerById('joker')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '小丑');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(4);
    });
  });

  describe('香蕉类小丑牌', () => {
    it('大麦克: +15倍率', () => {
      const joker = getJokerById('gros_michel')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '大麦克');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(15);
    });

    it('卡文迪什: x3倍率', () => {
      const joker = getJokerById('cavendish')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '卡文迪什');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(3);
    });
  });

  describe('状态类小丑牌', () => {
    it('爆米花: +20倍率', () => {
      const joker = getJokerById('popcorn')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '爆米花');
      expect(effect).toBeDefined();
      expect(effect!.multBonus).toBe(20);
    });

    it('拉面: x2倍率', () => {
      const joker = getJokerById('ramen')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '拉面');
      expect(effect).toBeDefined();
      expect(effect!.multMultiplier).toBe(2);
    });
  });

  describe('状态追踪类小丑牌', () => {
    it('全息影像: 初始状态0倍率', () => {
      const joker = getJokerById('hologram')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '全息影像');
      // 修复后：初始状态返回 x1 倍率 (符合Wiki)
      expect(effect).toBeDefined();
      expect(effect?.multMultiplier).toBe(1);
    });

    it('篝火: 初始状态0倍率', () => {
      const joker = getJokerById('campfire')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '篝火');
      // åå§ç¶ææ²¡æåè¿çï¼åºè¯¥ä¸è§¦åæè¿å?
      expect(effect).toBeUndefined();
    });

    it('卡尼奥: 初始状态0倍率', () => {
      const joker = getJokerById('canio')!;
      jokerSlots.addJoker(joker);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effect = result.jokerEffects!.find(e => e.jokerName === '卡尼奥');
      // 初始状态没有摧毁过脸牌，应该不触发
      expect(effect).toBeUndefined();
    });
  });

  describe('多张ON_PLAY小丑牌组合', () => {
    it('大麦克香蕉 + 卡文迪什', () => {
      const joker1 = getJokerById('gros_michel')!;
      const joker2 = getJokerById('cavendish')!;
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
      const effects = result.jokerEffects!;
      
      const grosEffect = effects.find(e => e.jokerName === '大麦克');
      const cavenEffect = effects.find(e => e.jokerName === '卡文迪什');
      
      expect(grosEffect).toBeDefined();
      expect(grosEffect!.multBonus).toBe(15);
      expect(cavenEffect).toBeDefined();
      expect(cavenEffect!.multMultiplier).toBe(3);
    });
  });
});
