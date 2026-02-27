import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BlindType } from '../types/game';
import { getJokerById } from '../data/jokers';
import { JokerSystem } from '../systems/JokerSystem';

/**
 * 混沌小丑免费刷新按钮回归测试
 * Bug: 商店里买了免费刷新的小丑，但是刷新按钮不让按
 * 原因: ShopComponent 在渲染刷新按钮时，只检查了金钱是否足够，没有考虑免费刷新
 */
describe('混沌小丑免费刷新按钮测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  // 辅助函数：设置游戏到商店阶段
  const setupToShop = (includeChaosClown: boolean = false) => {
    if (includeChaosClown) {
      const chaosClown = getJokerById('chaos_the_clown');
      expect(chaosClown).toBeDefined();
      gameState.jokerSlots.addJoker(chaosClown!);
    }
    // 完成一个盲注以进入商店
    gameState.selectBlind(BlindType.SMALL_BLIND);
    // 模拟完成盲注
    (gameState as any).roundScore = 1000;
    gameState.completeBlind();
  };

  it('有混沌小丑时应该允许免费刷新', () => {
    setupToShop(true);

    // 检查是否有免费刷新
    const rerollResult = JokerSystem.processReroll(gameState.jokerSlots);
    expect(rerollResult.freeReroll).toBe(true);
  });

  it('有混沌小丑且金钱为0时也应该允许刷新', () => {
    setupToShop(true);

    // 设置金钱为0
    (gameState as any).money = 0;

    // 验证刷新应该成功（不扣钱）
    const result = gameState.rerollShop();
    expect(result.success).toBe(true);
    expect(result.freeReroll).toBe(true);
    expect(gameState.money).toBe(0); // 金钱不变
  });

  it('没有混沌小丑且金钱为0时不应该允许刷新', () => {
    setupToShop(false);

    // 设置金钱为0
    (gameState as any).money = 0;

    // 检查是否有免费刷新
    const rerollResult = JokerSystem.processReroll(gameState.jokerSlots);
    expect(rerollResult.freeReroll).toBeFalsy();

    // 验证刷新应该失败
    const result = gameState.rerollShop();
    expect(result.success).toBe(false);
  });

  it('混沌小丑的免费刷新每回合只能使用一次', () => {
    setupToShop(true);

    // 第一次刷新 - 应该免费
    const result1 = gameState.rerollShop();
    expect(result1.success).toBe(true);
    expect(result1.freeReroll).toBe(true);

    // 第二次刷新 - 不应该免费（如果没有足够的钱）
    (gameState as any).money = 0;
    const result2 = gameState.rerollShop();
    expect(result2.success).toBe(false); // 因为没有钱且免费刷新已使用
  });

  it('UI层按钮禁用逻辑应该考虑免费刷新', () => {
    setupToShop(true);

    // 设置金钱为0
    (gameState as any).money = 0;
    const refreshCost = gameState.shop?.rerollCost ?? 5;

    // 检查是否有免费刷新（模拟 ShopComponent.checkFreeReroll）
    const hasFreeReroll = JokerSystem.processReroll(gameState.jokerSlots).freeReroll;

    // 模拟修复后的按钮禁用逻辑
    const isButtonDisabled = !hasFreeReroll && gameState.money < refreshCost;

    // 验证按钮应该启用（因为有免费刷新）
    expect(hasFreeReroll).toBe(true);
    expect(isButtonDisabled).toBe(false);
  });

  it('没有免费刷新且金钱不足时按钮应该禁用', () => {
    setupToShop(false);

    // 设置金钱为0
    (gameState as any).money = 0;
    const refreshCost = gameState.shop?.rerollCost ?? 5;

    // 检查是否有免费刷新
    const hasFreeReroll = JokerSystem.processReroll(gameState.jokerSlots).freeReroll;

    // 模拟按钮禁用逻辑
    const isButtonDisabled = !hasFreeReroll && gameState.money < refreshCost;

    // 验证按钮应该禁用
    expect(hasFreeReroll).toBeFalsy();
    expect(isButtonDisabled).toBe(true);
  });

  it('金钱充足时按钮应该启用（无论是否有免费刷新）', () => {
    setupToShop(false);

    // 设置充足的金钱
    (gameState as any).money = 100;
    const refreshCost = gameState.shop?.rerollCost ?? 5;

    // 检查是否有免费刷新
    const hasFreeReroll = JokerSystem.processReroll(gameState.jokerSlots).freeReroll;

    // 模拟按钮禁用逻辑
    const isButtonDisabled = !hasFreeReroll && gameState.money < refreshCost;

    // 验证按钮应该启用
    expect(gameState.money).toBeGreaterThanOrEqual(refreshCost);
    expect(isButtonDisabled).toBe(false);
  });
});
