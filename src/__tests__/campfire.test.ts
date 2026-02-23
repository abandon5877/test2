import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('Campfire 篝火测试', () => {
  it('出售小丑牌时应该增加Campfire的cardsSold计数', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Campfire
    const campfire = getJokerById('campfire')!;
    jokerSlots.addJoker(campfire);
    
    // 添加另一个小丑牌用于出售
    const otherJoker = getJokerById('lusty_joker')!;
    jokerSlots.addJoker(otherJoker);
    
    // 验证初始状态
    expect(campfire.state.cardsSold).toBeUndefined();
    
    // 出售小丑牌
    const sellResult = JokerSystem.sellJoker(jokerSlots, 1);
    expect(sellResult.success).toBe(true);
    
    // 验证Campfire状态已更新
    expect(campfire.state.cardsSold).toBe(1);
  });

  it('出售多张牌时Campfire应该累积计数', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Campfire
    const campfire = getJokerById('campfire')!;
    jokerSlots.addJoker(campfire);
    
    // 添加多个小丑牌用于出售
    const joker1 = getJokerById('lusty_joker')!;
    const joker2 = getJokerById('wrathful_joker')!;
    const joker3 = getJokerById('greedy_joker')!;
    jokerSlots.addJoker(joker1);
    jokerSlots.addJoker(joker2);
    jokerSlots.addJoker(joker3);
    
    // 出售3张小丑牌（注意：每次出售后索引会变化）
    JokerSystem.sellJoker(jokerSlots, 1);
    expect(campfire.state.cardsSold).toBe(1);
    
    JokerSystem.sellJoker(jokerSlots, 1);
    expect(campfire.state.cardsSold).toBe(2);
    
    JokerSystem.sellJoker(jokerSlots, 1);
    expect(campfire.state.cardsSold).toBe(3);
  });

  it('Campfire应该根据cardsSold提供正确的倍率加成', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Campfire并设置状态
    const campfire = getJokerById('campfire')!;
    jokerSlots.addJoker(campfire);
    campfire.updateState({ cardsSold: 4 });
    
    // 使用processOnPlay测试（Campfire的触发器是ON_PLAY）
    const result = JokerSystem.processOnPlay(jokerSlots);
    
    // 4张牌 * 0.25 = 1.0，所以倍率应该是 1 + 1.0 = 2.0
    expect(result.multMultiplier).toBe(2.0);
    expect(result.effects.some(e => e.effect.includes('卖出4张牌') && e.effect.includes('x2.00'))).toBe(true);
  });

  it('击败Boss后应该重置Campfire状态', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Campfire并设置状态
    const campfire = getJokerById('campfire')!;
    jokerSlots.addJoker(campfire);
    campfire.updateState({ cardsSold: 5 });
    
    // 验证初始状态
    expect(campfire.state.cardsSold).toBe(5);
    
    // 处理回合结束（击败Boss）
    JokerSystem.processEndRound(
      jokerSlots,
      { money: 10, interestCap: 20, hands: 4, discards: 3 },
      true // defeatedBoss = true
    );
    
    // 验证Campfire状态已重置
    expect(campfire.state.cardsSold).toBe(0);
  });

  it('未击败Boss时不应重置Campfire状态', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加Campfire并设置状态
    const campfire = getJokerById('campfire')!;
    jokerSlots.addJoker(campfire);
    campfire.updateState({ cardsSold: 5 });
    
    // 验证初始状态
    expect(campfire.state.cardsSold).toBe(5);
    
    // 处理回合结束（未击败Boss）
    JokerSystem.processEndRound(
      jokerSlots,
      { money: 10, interestCap: 20, hands: 4, discards: 3 },
      false // defeatedBoss = false
    );
    
    // 验证Campfire状态未重置
    expect(campfire.state.cardsSold).toBe(5);
  });

  it('多张Campfire应该分别累积和重置', () => {
    const jokerSlots = new JokerSlots(5);
    
    // 添加两张Campfire
    const campfire1 = getJokerById('campfire')!;
    const campfire2 = getJokerById('campfire')!;
    jokerSlots.addJoker(campfire1);
    jokerSlots.addJoker(campfire2);
    
    // 添加一个小丑牌用于出售
    const otherJoker = getJokerById('lusty_joker')!;
    jokerSlots.addJoker(otherJoker);
    
    // 出售小丑牌
    JokerSystem.sellJoker(jokerSlots, 2);
    
    // 验证两张Campfire都更新了
    expect(campfire1.state.cardsSold).toBe(1);
    expect(campfire2.state.cardsSold).toBe(1);
    
    // 击败Boss
    JokerSystem.processEndRound(
      jokerSlots,
      { money: 10, interestCap: 20, hands: 4, discards: 3 },
      true
    );
    
    // 验证两张Campfire都重置了
    expect(campfire1.state.cardsSold).toBe(0);
    expect(campfire2.state.cardsSold).toBe(0);
  });
});
