import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { PokerHandType } from '../types/pokerHands';
import { getPlanetConsumableByHandType } from '../data/consumables/planets';
import { Shop } from '../models/Shop';

describe('望远镜全局计数器测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  it('getMostPlayedHandGlobal应该使用全局牌型统计', () => {
    // 模拟打出对子牌型3次
    gameState['handTypeHistory'].set(PokerHandType.OnePair, 3);
    
    // 验证全局最常打出牌型是对子
    const mostPlayedHand = gameState.getMostPlayedHandGlobal();
    expect(mostPlayedHand).toBe(PokerHandType.OnePair);
  });

  it('新底注不应该重置全局牌型统计', () => {
    // 模拟打出对子牌型3次
    gameState['handTypeHistory'].set(PokerHandType.OnePair, 3);
    
    // 验证全局统计
    expect(gameState.getMostPlayedHandGlobal()).toBe(PokerHandType.OnePair);
    
    // 模拟新底注开始（调用BossState的onNewAnte）
    gameState.bossState.onNewAnte();
    
    // 验证全局统计仍然存在
    expect(gameState.getMostPlayedHandGlobal()).toBe(PokerHandType.OnePair);
    
    // 验证BossState的统计已被重置
    expect(gameState.bossState.getMostPlayedHand()).toBeNull();
  });

  it('望远镜应该使用全局统计而不是BossState统计', () => {
    // 创建商店并应用望远镜优惠券
    const shop = new Shop();
    shop.applyVoucher('voucher_telescope');
    (gameState as any).shop = shop;
    
    // 设置全局牌型统计（对子3次）
    gameState['handTypeHistory'].set(PokerHandType.OnePair, 3);
    
    // 不设置BossState统计（模拟新底注后的状态）
    gameState.bossState.onNewAnte();
    
    // 验证全局统计有数据
    expect(gameState.getMostPlayedHandGlobal()).toBe(PokerHandType.OnePair);
    
    // 验证BossState统计为空
    expect(gameState.bossState.getMostPlayedHand()).toBeNull();
    
    // 模拟OpenPackComponent的逻辑（使用新方法）
    const vouchersUsed = gameState.getVouchersUsed();
    const hasTelescope = vouchersUsed.includes('voucher_telescope');
    const mostPlayedHand = hasTelescope ? gameState.getMostPlayedHandGlobal() : null;
    
    // 验证使用全局统计能正确获取牌型
    expect(hasTelescope).toBe(true);
    expect(mostPlayedHand).toBe(PokerHandType.OnePair);
    
    // 获取对应的星球牌
    if (hasTelescope && mostPlayedHand) {
      const targetPlanet = getPlanetConsumableByHandType(mostPlayedHand);
      expect(targetPlanet).toBeDefined();
      expect(targetPlanet?.id).toBe('planet_mercury');
    }
  });

  it('多个牌型时应该返回次数最多的', () => {
    // 设置全局统计
    gameState['handTypeHistory'].set(PokerHandType.OnePair, 3);
    gameState['handTypeHistory'].set(PokerHandType.TwoPair, 5);
    gameState['handTypeHistory'].set(PokerHandType.HighCard, 2);
    
    // 验证返回次数最多的（两对）
    const mostPlayedHand = gameState.getMostPlayedHandGlobal();
    expect(mostPlayedHand).toBe(PokerHandType.TwoPair);
    
    // 获取对应的星球牌
    const planet = getPlanetConsumableByHandType(mostPlayedHand!);
    expect(planet?.id).toBe('planet_uranus');
  });

  it('没有打出任何牌型时应该返回null', () => {
    const mostPlayedHand = gameState.getMostPlayedHandGlobal();
    expect(mostPlayedHand).toBeNull();
  });

  it('新游戏应该清空全局统计', () => {
    // 设置全局统计
    gameState['handTypeHistory'].set(PokerHandType.OnePair, 3);
    expect(gameState.getMostPlayedHandGlobal()).toBe(PokerHandType.OnePair);
    
    // 重新开始新游戏
    gameState.startNewGame();
    
    // 验证全局统计被清空
    expect(gameState.getMostPlayedHandGlobal()).toBeNull();
  });
});
