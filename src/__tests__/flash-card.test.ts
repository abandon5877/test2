import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';

describe('Flash Card 闪卡测试', () => {
  it('每次刷新商店应该+2倍率', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Flash Card
    const flashCard = getJokerById('flash_card')!;
    jokerSlots.addJoker(flashCard);
    
    // 第一次刷新
    const result1 = JokerSystem.processOnReroll(jokerSlots);
    expect(result1.multBonus).toBe(2);
    expect(result1.effects.some(e => e.effect.includes('闪卡') && e.effect.includes('共+2'))).toBe(true);
    
    // 验证状态已更新
    expect(flashCard.state.multBonus).toBe(2);
  });

  it('多次刷新应该累积倍率', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Flash Card
    const flashCard = getJokerById('flash_card')!;
    jokerSlots.addJoker(flashCard);
    
    // 第一次刷新
    JokerSystem.processOnReroll(jokerSlots);
    expect(flashCard.state.multBonus).toBe(2);
    
    // 第二次刷新
    const result2 = JokerSystem.processOnReroll(jokerSlots);
    expect(result2.multBonus).toBe(4);
    expect(result2.effects.some(e => e.effect.includes('闪卡') && e.effect.includes('共+4'))).toBe(true);
    
    // 验证状态已更新
    expect(flashCard.state.multBonus).toBe(4);
    
    // 第三次刷新
    const result3 = JokerSystem.processOnReroll(jokerSlots);
    expect(result3.multBonus).toBe(6);
    expect(result3.effects.some(e => e.effect.includes('闪卡') && e.effect.includes('共+6'))).toBe(true);
    
    // 验证状态已更新
    expect(flashCard.state.multBonus).toBe(6);
  });

  it('多张Flash Card应该分别累积', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加两张Flash Card
    const flashCard1 = getJokerById('flash_card')!;
    const flashCard2 = getJokerById('flash_card')!;
    jokerSlots.addJoker(flashCard1);
    jokerSlots.addJoker(flashCard2);
    
    // 刷新商店
    const result = JokerSystem.processOnReroll(jokerSlots);
    
    // 两张Flash Card各+2倍率，总共+4
    expect(result.multBonus).toBe(4);
    
    // 验证两张Flash Card的状态都更新了
    expect(flashCard1.state.multBonus).toBe(2);
    expect(flashCard2.state.multBonus).toBe(2);
  });

  it('倍率应该持久化（多次调用processOnReroll）', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Flash Card
    const flashCard = getJokerById('flash_card')!;
    jokerSlots.addJoker(flashCard);
    
    // 刷新5次
    for (let i = 0; i < 5; i++) {
      JokerSystem.processOnReroll(jokerSlots);
    }
    
    // 验证倍率累积到10
    expect(flashCard.state.multBonus).toBe(10);
    
    // 再次调用应该继续累积
    const result = JokerSystem.processOnReroll(jokerSlots);
    expect(result.multBonus).toBe(12);
    expect(flashCard.state.multBonus).toBe(12);
  });
});
