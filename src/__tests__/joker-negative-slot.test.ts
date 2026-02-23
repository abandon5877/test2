import { describe, it, expect } from 'vitest';
import { Joker } from '../models/Joker';
import { JokerSlots } from '../models/JokerSlots';
import { JokerEdition, JokerRarity, JokerTrigger } from '../types/joker';

describe('负片小丑牌卡槽测试', () => {
  const createJoker = (edition: JokerEdition = JokerEdition.None): Joker => {
    return new Joker({
      id: 'test_joker',
      name: 'Test Joker',
      description: 'A test joker',
      rarity: JokerRarity.COMMON,
      cost: 2,
      trigger: JokerTrigger.ON_PLAY,
      effect: () => ({}),
      edition
    });
  };

  describe('负片版本效果', () => {
    it('负片小丑牌应该返回 extraSlot: true', () => {
      const negJoker = createJoker(JokerEdition.Negative);
      const effects = negJoker.getEditionEffects();
      
      expect(effects.extraSlot).toBe(true);
    });

    it('普通版本不应该提供额外槽位', () => {
      const normalJoker = createJoker(JokerEdition.None);
      const effects = normalJoker.getEditionEffects();
      
      expect(effects.extraSlot).toBe(false);
    });
  });

  describe('JokerSlots 负片槽位计算', () => {
    it('没有负片小丑牌时，有效槽位应该等于基础槽位', () => {
      const slots = new JokerSlots(5);
      
      expect(slots.getEffectiveMaxSlots()).toBe(5);
      expect(slots.getAvailableSlots()).toBe(5);
    });

    it('添加1张负片小丑牌后，有效槽位应该+1', () => {
      const slots = new JokerSlots(5);
      const negJoker = createJoker(JokerEdition.Negative);
      
      slots.addJoker(negJoker);
      
      expect(slots.getEffectiveMaxSlots()).toBe(6);
      expect(slots.getAvailableSlots()).toBe(5); // 已占用1个，剩余5个
    });

    it('添加2张负片小丑牌后，有效槽位应该+2', () => {
      const slots = new JokerSlots(5);
      const negJoker1 = createJoker(JokerEdition.Negative);
      const negJoker2 = createJoker(JokerEdition.Negative);
      
      slots.addJoker(negJoker1);
      slots.addJoker(negJoker2);
      
      expect(slots.getEffectiveMaxSlots()).toBe(7);
      expect(slots.getAvailableSlots()).toBe(5); // 已占用2个，剩余5个
    });

    it('混合普通和负片小丑牌时，只有负片提供额外槽位', () => {
      const slots = new JokerSlots(5);
      const normalJoker = createJoker(JokerEdition.None);
      const negJoker = createJoker(JokerEdition.Negative);
      
      slots.addJoker(normalJoker);
      slots.addJoker(negJoker);
      
      expect(slots.getEffectiveMaxSlots()).toBe(6);
      expect(slots.getAvailableSlots()).toBe(4); // 已占用2个，剩余4个
    });

    it('填满基础槽位后，负片小丑牌仍可以添加', () => {
      const slots = new JokerSlots(2);
      const joker1 = createJoker(JokerEdition.None);
      const joker2 = createJoker(JokerEdition.None);
      const negJoker = createJoker(JokerEdition.Negative);
      
      // 先填满2个基础槽位
      expect(slots.addJoker(joker1)).toBe(true);
      expect(slots.addJoker(joker2)).toBe(true);
      
      // 基础槽位已满，但负片小丑牌可以提供额外槽位
      expect(slots.getJokerCount()).toBe(2);
      expect(slots.getEffectiveMaxSlots()).toBe(2);
      
      // 添加负片小丑牌
      expect(slots.addJoker(negJoker)).toBe(true);
      expect(slots.getJokerCount()).toBe(3);
      expect(slots.getEffectiveMaxSlots()).toBe(3);
    });

    it('多张负片小丑牌可以超出基础槽位限制', () => {
      const slots = new JokerSlots(2);
      const negJoker1 = createJoker(JokerEdition.Negative);
      const negJoker2 = createJoker(JokerEdition.Negative);
      const negJoker3 = createJoker(JokerEdition.Negative);
      
      // 添加3张负片小丑牌
      expect(slots.addJoker(negJoker1)).toBe(true);
      expect(slots.addJoker(negJoker2)).toBe(true);
      expect(slots.addJoker(negJoker3)).toBe(true);
      
      expect(slots.getJokerCount()).toBe(3);
      expect(slots.getEffectiveMaxSlots()).toBe(5); // 2基础 + 3负片 = 5
    });

    it('移除负片小丑牌后，有效槽位应该减少', () => {
      const slots = new JokerSlots(5);
      const negJoker = createJoker(JokerEdition.Negative);
      
      slots.addJoker(negJoker);
      expect(slots.getEffectiveMaxSlots()).toBe(6);
      
      slots.removeJoker(0);
      expect(slots.getEffectiveMaxSlots()).toBe(5);
    });
  });

  describe('getMaxSlots 与 getEffectiveMaxSlots 的区别', () => {
    it('getMaxSlots 应该返回基础槽位数（不包含负片加成）', () => {
      const slots = new JokerSlots(5);
      const negJoker = createJoker(JokerEdition.Negative);
      
      slots.addJoker(negJoker);
      
      // getMaxSlots 应该仍然返回基础值5
      expect(slots.getMaxSlots()).toBe(5);
      // getEffectiveMaxSlots 应该返回有效值6
      expect(slots.getEffectiveMaxSlots()).toBe(6);
    });
  });
});
