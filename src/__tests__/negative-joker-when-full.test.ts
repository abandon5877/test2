import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { Joker } from '../models/Joker';
import { JokerEdition, JokerRarity, JokerTrigger } from '../types/joker';

describe('卡槽满时获得负片小丑牌测试', () => {
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

  it('卡槽满时应该可以添加负片小丑牌', () => {
    const slots = new JokerSlots(2);
    
    // 填满2个基础槽位
    expect(slots.addJoker(createJoker(JokerEdition.None))).toBe(true);
    expect(slots.addJoker(createJoker(JokerEdition.None))).toBe(true);
    
    // 基础槽位已满
    expect(slots.getJokerCount()).toBe(2);
    expect(slots.getAvailableSlots()).toBe(0);
    
    // 但添加负片小丑牌应该成功（因为它提供额外槽位）
    expect(slots.addJoker(createJoker(JokerEdition.Negative))).toBe(true);
    
    // 现在有3张小丑牌
    expect(slots.getJokerCount()).toBe(3);
    expect(slots.getEffectiveMaxSlots()).toBe(3);
  });

  it('满槽时addJoker内部逻辑允许添加负片小丑牌', () => {
    const slots = new JokerSlots(2);
    
    // 填满基础槽位
    slots.addJoker(createJoker(JokerEdition.None));
    slots.addJoker(createJoker(JokerEdition.None));
    
    // 验证槽位已满
    expect(slots.getAvailableSlots()).toBe(0);
    
    // 但添加负片小丑牌应该成功（addJoker内部会处理负片逻辑）
    expect(slots.addJoker(createJoker(JokerEdition.Negative))).toBe(true);
    expect(slots.getJokerCount()).toBe(3);
  });

  it('负片小丑牌可以连续添加超出基础限制', () => {
    const slots = new JokerSlots(2);
    
    // 填满基础槽位
    slots.addJoker(createJoker(JokerEdition.None));
    slots.addJoker(createJoker(JokerEdition.None));
    
    // 添加3张负片小丑牌
    expect(slots.addJoker(createJoker(JokerEdition.Negative))).toBe(true);
    expect(slots.addJoker(createJoker(JokerEdition.Negative))).toBe(true);
    expect(slots.addJoker(createJoker(JokerEdition.Negative))).toBe(true);
    
    expect(slots.getJokerCount()).toBe(5);
    expect(slots.getEffectiveMaxSlots()).toBe(5); // 2基础 + 3负片
  });
});
