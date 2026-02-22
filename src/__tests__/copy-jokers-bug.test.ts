import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';
import { PokerHandType } from '../types/pokerHands';

describe('复制类小丑牌重复计算问题检查', () => {
  describe('蓝图 (Blueprint)', () => {
    it('蓝图不应重复计算右侧小丑的效果', () => {
      const jokerSlots = new JokerSlots(5);
      const blueprint = getJokerById('blueprint')!;
      const jolly = getJokerById('jolly_joker')!; // 对子+8倍率

      // 顺序：蓝图(左), 开心小丑(右)
      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(jolly);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      console.log('蓝图测试 - 所有小丑效果:', result.jokerEffects?.map(e => ({
        name: e.jokerName,
        effect: e.effect,
        multBonus: e.multBonus
      })));

      const blueprintEffects = result.jokerEffects?.filter(e => e.jokerName === '蓝图');
      const jollyEffects = result.jokerEffects?.filter(e => e.jokerName === '开心小丑');

      console.log('蓝图效果数量:', blueprintEffects?.length);
      console.log('开心小丑效果数量:', jollyEffects?.length);
      console.log('总倍率加成:', result.multBonus);

      // 蓝图应该只有一个复制效果
      expect(blueprintEffects?.length).toBe(1);

      // 开心小丑应该只有一个效果（它自己的）
      expect(jollyEffects?.length).toBe(1);

      // 总倍率应该是 8 (jolly) + 8 (blueprint复制) = 16
      expect(result.multBonus).toBe(16);
    });
  });

  describe('头脑风暴 (Brainstorm)', () => {
    it('头脑风暴不应重复计算最左侧小丑的效果', () => {
      const jokerSlots = new JokerSlots(5);
      const jolly = getJokerById('jolly_joker')!;
      const brainstorm = getJokerById('brainstorm')!;

      // 顺序：开心小丑(左), 头脑风暴(右)
      jokerSlots.addJoker(jolly);
      jokerSlots.addJoker(brainstorm);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      console.log('头脑风暴测试 - 所有小丑效果:', result.jokerEffects?.map(e => ({
        name: e.jokerName,
        effect: e.effect,
        multBonus: e.multBonus
      })));

      const brainstormEffects = result.jokerEffects?.filter(e => e.jokerName === '头脑风暴');
      const jollyEffects = result.jokerEffects?.filter(e => e.jokerName === '开心小丑');

      console.log('头脑风暴效果数量:', brainstormEffects?.length);
      console.log('开心小丑效果数量:', jollyEffects?.length);
      console.log('总倍率加成:', result.multBonus);

      // 头脑风暴应该只有一个复制效果
      expect(brainstormEffects?.length).toBe(1);

      // 开心小丑应该只有一个效果
      expect(jollyEffects?.length).toBe(1);

      // 总倍率应该是 8 (jolly) + 8 (brainstorm复制) = 16
      expect(result.multBonus).toBe(16);
    });
  });
});
