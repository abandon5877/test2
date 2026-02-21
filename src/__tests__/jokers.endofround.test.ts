import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';

describe('阶段7: END_OF_ROUND效果补全测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('economy_joker (经济小丑)', () => {
    it('应该每回合结束获得$4', () => {
      const economyJoker = new Joker({
        id: 'economy_joker',
        name: '经济小丑',
        description: '每回合结束获得$4',
        rarity: JokerRarity.COMMON,
        cost: 5,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (): { moneyBonus?: number; message?: string } => {
          return {
            moneyBonus: 4,
            message: '经济小丑: +$4'
          };
        }
      });

      jokerSlots.addJoker(economyJoker);

      const result = JokerSystem.processEndRound(jokerSlots,);

      expect(result.moneyBonus).toBe(4);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('经济小丑');
      expect(result.effects[0].moneyBonus).toBe(4);
    });
  });

  describe('delayed_gratification (延迟收获)', () => {
    it('应该根据未用弃牌数量提供金钱', () => {
      const delayedGratification = new Joker({
        id: 'delayed_gratification',
        name: '延迟收获',
        description: '未用弃牌每机会+$2',
        rarity: JokerRarity.COMMON,
        cost: 3,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (context): { moneyBonus?: number; message?: string } => {
          const remainingDiscards = (context as unknown as { gameState?: { discards?: number } }).gameState?.discards || 0;
          if (remainingDiscards > 0) {
            const money = remainingDiscards * 2;
            return {
              moneyBonus: money,
              message: `延迟收获: ${remainingDiscards}未用弃牌 +$${money}`
            };
          }
          return {
            message: '延迟收获: 无未用弃牌'
          };
        }
      });

      jokerSlots.addJoker(delayedGratification);

      // 模拟还有3次弃牌机会未使用
      const result = JokerSystem.processEndRound(jokerSlots, { discards: 3, hands: 0, money: 0, interestCap: 0 });

      expect(result.moneyBonus).toBe(6); // 3 * 2 = 6
      expect(result.effects[0].effect).toContain('3未用弃牌');
    });

    it('没有未用弃牌时不应提供金钱', () => {
      const delayedGratification = new Joker({
        id: 'delayed_gratification',
        name: '延迟收获',
        description: '未用弃牌每机会+$2',
        rarity: JokerRarity.COMMON,
        cost: 3,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (context): { moneyBonus?: number; message?: string } => {
          const remainingDiscards = (context as unknown as { gameState?: { discards?: number } }).gameState?.discards || 0;
          if (remainingDiscards > 0) {
            const money = remainingDiscards * 2;
            return {
              moneyBonus: money,
              message: `延迟收获: ${remainingDiscards}未用弃牌 +$${money}`
            };
          }
          return {
            message: '延迟收获: 无未用弃牌'
          };
        }
      });

      jokerSlots.addJoker(delayedGratification);

      // 没有未用弃牌
      const result = JokerSystem.processEndRound(jokerSlots, { discards: 0, hands: 0, money: 0, interestCap: 0 });

      expect(result.moneyBonus).toBe(0);
    });
  });

  describe('satellite (人造卫星)', () => {
    it('应该根据独特行星牌数量提供金钱', () => {
      // 使用固定值测试人造卫星效果
      const satellite = new Joker({
        id: 'satellite',
        name: '人造卫星',
        description: '每张独特行星牌每轮+$3',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (): { moneyBonus?: number; message?: string } => {
          // 测试时固定返回5张行星牌的效果
          const uniquePlanets = 5;
          const moneyBonus = uniquePlanets * 3;
          return {
            moneyBonus: moneyBonus,
            message: `人造卫星: ${uniquePlanets}张独特行星牌 +$${moneyBonus}`
          };
        }
      });

      jokerSlots.addJoker(satellite);

      const result = JokerSystem.processEndRound(jokerSlots);

      expect(result.moneyBonus).toBe(15); // 5 * 3 = 15
      expect(result.effects[0].effect).toContain('5张独特行星牌');
    });
  });

  describe('gift_card (礼物卡)', () => {
    it('应该存在并正确触发', () => {
      const giftCard = new Joker({
        id: 'gift_card',
        name: '礼物卡',
        description: '每轮小丑/消耗牌售价+$1',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (): { message?: string } => {
          return {
            message: '礼物卡: 售价增加'
          };
        }
      });

      jokerSlots.addJoker(giftCard);

      const result = JokerSystem.processEndRound(jokerSlots,);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('礼物卡');
      expect(result.effects[0].effect).toContain('售价增加');
    });
  });

  describe('perkeo (佩克欧)', () => {
    it('应该存在并正确触发', () => {
      const perkeo = new Joker({
        id: 'perkeo',
        name: '佩克欧',
        description: '离开商店时复制随机塔罗/行星牌',
        rarity: JokerRarity.LEGENDARY,
        cost: 20,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (): { message?: string } => {
          return {
            message: '佩克欧: 复制随机塔罗/行星牌'
          };
        }
      });

      jokerSlots.addJoker(perkeo);

      const result = JokerSystem.processEndRound(jokerSlots,);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('佩克欧');
      expect(result.effects[0].effect).toContain('复制');
    });
  });

  describe('多个END_OF_ROUND小丑牌组合', () => {
    it('应该同时触发多个效果', () => {
      const economyJoker = new Joker({
        id: 'economy_joker',
        name: '经济小丑',
        description: '每回合结束获得$4',
        rarity: JokerRarity.COMMON,
        cost: 5,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (): { moneyBonus?: number; message?: string } => {
          return {
            moneyBonus: 4,
            message: '经济小丑: +$4'
          };
        }
      });

      const satellite = new Joker({
        id: 'satellite',
        name: '人造卫星',
        description: '每张独特行星牌每轮+$3',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.END_OF_ROUND,
        effect: (): { moneyBonus?: number; message?: string } => {
          // 测试时固定返回2张行星牌的效果
          const uniquePlanets = 2;
          const moneyBonus = uniquePlanets * 3;
          return {
            moneyBonus: moneyBonus,
            message: `人造卫星: ${uniquePlanets}张独特行星牌 +$${moneyBonus}`
          };
        }
      });

      jokerSlots.addJoker(economyJoker);
      jokerSlots.addJoker(satellite);

      const result = JokerSystem.processEndRound(jokerSlots);

      // 经济小丑: $4 + 人造卫星: 2 * $3 = $6，总计 $10
      expect(result.moneyBonus).toBe(10);
      expect(result.effects).toHaveLength(2);
    });
  });
});
