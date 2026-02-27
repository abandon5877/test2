import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../models/GameState';
import { PokerHandType } from '../types/pokerHands';
import { getPlanetConsumableByHandType } from '../data/consumables/planets';
import { getPackById } from '../data/consumables/packs';
import { Shop } from '../models/Shop';

describe('OpenPackComponent 望远镜集成测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  it('有望远镜优惠券时，getVouchersUsed应该包含voucher_telescope', () => {
    // 创建商店并应用望远镜优惠券
    const shop = new Shop();
    shop.applyVoucher('voucher_telescope');
    
    // 将商店设置到 gameState
    (gameState as any).shop = shop;
    
    // 验证 getVouchersUsed 返回正确的优惠券列表
    const vouchersUsed = gameState.getVouchersUsed();
    expect(vouchersUsed).toContain('voucher_telescope');
  });

  it('没有望远镜优惠券时，getVouchersUsed不应该包含voucher_telescope', () => {
    // 没有商店或没有应用优惠券
    const vouchersUsed = gameState.getVouchersUsed();
    expect(vouchersUsed).not.toContain('voucher_telescope');
  });

  it('有望远镜且有最常打出牌型时，应该返回对应的星球牌', () => {
    // 模拟打出对子牌型
    gameState.bossState.recordHandPlayCount(PokerHandType.OnePair);
    gameState.bossState.recordHandPlayCount(PokerHandType.OnePair);
    
    // 验证最常打出的牌型是对子
    const mostPlayedHand = gameState.bossState.getMostPlayedHand();
    expect(mostPlayedHand).toBe(PokerHandType.OnePair);
    
    // 获取对应的星球牌
    const planet = getPlanetConsumableByHandType(mostPlayedHand!);
    expect(planet).toBeDefined();
    expect(planet?.id).toBe('planet_mercury');
  });

  it('天体卡包配置应该正确', () => {
    const celestialPack = getPackById('pack_celestial_normal');
    expect(celestialPack).toBeDefined();
    expect(celestialPack?.type).toBe('celestial');
    expect(celestialPack?.choices).toBe(3);
    expect(celestialPack?.selectCount).toBe(1);
  });

  it('模拟OpenPackComponent的望远镜逻辑', () => {
    // 创建商店并应用望远镜优惠券
    const shop = new Shop();
    shop.applyVoucher('voucher_telescope');
    (gameState as any).shop = shop;
    
    // 模拟打出对子牌型
    gameState.bossState.recordHandPlayCount(PokerHandType.OnePair);
    gameState.bossState.recordHandPlayCount(PokerHandType.OnePair);
    
    // 模拟 OpenPackComponent.generatePackContents 中的逻辑
    const vouchersUsed = gameState.getVouchersUsed();
    const hasTelescope = vouchersUsed.includes('voucher_telescope');
    const mostPlayedHand = hasTelescope ? gameState.bossState.getMostPlayedHand() : null;
    
    expect(hasTelescope).toBe(true);
    expect(mostPlayedHand).toBe(PokerHandType.OnePair);
    
    // 获取对应的星球牌
    if (hasTelescope && mostPlayedHand) {
      const targetPlanet = getPlanetConsumableByHandType(mostPlayedHand);
      expect(targetPlanet).toBeDefined();
      expect(targetPlanet?.id).toBe('planet_mercury');
      expect(targetPlanet?.name).toBe('水星');
    }
  });

  it('没有望远镜时，不应该返回特定星球牌', () => {
    // 不应用望远镜优惠券
    const shop = new Shop();
    (gameState as any).shop = shop;
    
    // 模拟打出对子牌型
    gameState.bossState.recordHandPlayCount(PokerHandType.OnePair);
    
    // 模拟 OpenPackComponent.generatePackContents 中的逻辑
    const vouchersUsed = gameState.getVouchersUsed();
    const hasTelescope = vouchersUsed.includes('voucher_telescope');
    const mostPlayedHand = hasTelescope ? gameState.bossState.getMostPlayedHand() : null;
    
    expect(hasTelescope).toBe(false);
    expect(mostPlayedHand).toBeNull();
  });

  it('有望远镜但没有打出任何牌型时，不应该返回特定星球牌', () => {
    // 创建商店并应用望远镜优惠券
    const shop = new Shop();
    shop.applyVoucher('voucher_telescope');
    (gameState as any).shop = shop;
    
    // 不记录任何牌型
    
    // 模拟 OpenPackComponent.generatePackContents 中的逻辑
    const vouchersUsed = gameState.getVouchersUsed();
    const hasTelescope = vouchersUsed.includes('voucher_telescope');
    const mostPlayedHand = hasTelescope ? gameState.bossState.getMostPlayedHand() : null;
    
    expect(hasTelescope).toBe(true);
    expect(mostPlayedHand).toBeNull();
  });
});
