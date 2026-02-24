import { describe, it, expect } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { getJokerById } from '../data/jokers';

describe('蓝图+头脑风暴复制链测试', () => {
  it('蓝图+大麦克+头脑风暴应该产生45倍率', () => {
    const jokerSlots = new JokerSlots();
    
    // 添加小丑牌：蓝图、大麦克、头脑风暴
    const blueprint = getJokerById('blueprint')!;
    const grosMichel = getJokerById('gros_michel')!;
    const brainstorm = getJokerById('brainstorm')!;
    
    jokerSlots.addJoker(blueprint);
    jokerSlots.addJoker(grosMichel);
    jokerSlots.addJoker(brainstorm);
    
    // 调用 processOnPlay
    const result = JokerSystem.processOnPlay(jokerSlots);
    
    console.log('processOnPlay结果:', result);
    console.log('倍率加成:', result.multBonus);
    console.log('效果列表:', result.effects);
    
    // 期望：大麦克(15) + 蓝图复制大麦克(15) + 头脑风暴复制蓝图复制大麦克(15) = 45
    expect(result.multBonus).toBe(45);
  });
  
  it('蓝图+大麦克+头脑风暴+DNA+旗帜应该产生45倍率', () => {
    const jokerSlots = new JokerSlots();
    
    // 添加小丑牌：蓝图、大麦克、头脑风暴、DNA、旗帜
    const blueprint = getJokerById('blueprint')!;
    const grosMichel = getJokerById('gros_michel')!;
    const brainstorm = getJokerById('brainstorm')!;
    const dna = getJokerById('dna')!;
    const banner = getJokerById('banner')!;
    
    jokerSlots.addJoker(blueprint);
    jokerSlots.addJoker(grosMichel);
    jokerSlots.addJoker(brainstorm);
    jokerSlots.addJoker(dna);
    jokerSlots.addJoker(banner);
    
    // 调用 processOnPlay
    const result = JokerSystem.processOnPlay(jokerSlots);
    
    console.log('5张小丑牌processOnPlay结果:', result);
    console.log('倍率加成:', result.multBonus);
    console.log('效果列表:', result.effects);
    
    // 期望：大麦克(15) + 蓝图复制大麦克(15) + 头脑风暴复制蓝图复制大麦克(15) = 45
    // DNA和旗帜是on_hand_played触发，不影响on_play
    expect(result.multBonus).toBe(45);
  });
});
