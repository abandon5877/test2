import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Storage } from '../utils/storage';
import { BossType } from '../types/game';
import { initializeBlindConfigs, resetBlindConfigs } from '../data/blinds';
import { Shop } from '../models/Shop';

describe('导演剪辑版优惠券存档测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    resetBlindConfigs();
    gameState = new GameState();
    gameState.startNewGame();

    // 初始化Boss分配
    const bossAssignments = new Map<number, BossType>();
    bossAssignments.set(1, BossType.HOOK);
    initializeBlindConfigs(bossAssignments);
  });

  it('应该能保存和恢复Boss重掷状态', () => {
    // 创建商店并应用导演剪辑版优惠券
    const shop = new Shop();
    (gameState as any).shop = shop;
    gameState.applyVoucher('voucher_directors_cut');

    // 模拟重掷一次
    gameState.bossSelectionState.incrementBossRerollCount();

    // 验证状态
    expect(gameState.bossSelectionState.getBossRerollCount()).toBe(1);
    expect(gameState.bossSelectionState.hasUnlimitedReroll()).toBe(false);

    // 保存游戏
    const saveData = Storage.serialize(gameState);

    // 验证存档中包含Boss选择状态
    expect(saveData.bossSelectionState).toBeDefined();
    expect(saveData.bossSelectionState!.bossRerollCount).toBe(1);
    expect(saveData.bossSelectionState!.hasUnlimitedRerolls).toBe(false);
    expect(saveData.bossSelectionState!.appearedBosses).toEqual(gameState.bossSelectionState.getAppearedBosses());
    expect(saveData.bossSelectionState!.currentAnte).toBe(gameState.bossSelectionState.getCurrentAnte());

    // 创建新游戏状态并恢复
    const newGameState = new GameState();
    newGameState.startNewGame();

    // 恢复Boss选择状态
    if (saveData.bossSelectionState) {
      newGameState.bossSelectionState.restoreState({
        appearedBosses: saveData.bossSelectionState.appearedBosses as BossType[],
        currentAnte: saveData.bossSelectionState.currentAnte,
        bossRerollCount: saveData.bossSelectionState.bossRerollCount,
        hasUnlimitedRerolls: saveData.bossSelectionState.hasUnlimitedRerolls
      });
    }

    // 验证状态已恢复
    expect(newGameState.bossSelectionState.getBossRerollCount()).toBe(1);
    expect(newGameState.bossSelectionState.hasUnlimitedReroll()).toBe(false);
    expect(newGameState.bossSelectionState.getAppearedBosses()).toEqual(gameState.bossSelectionState.getAppearedBosses());
  });

  it('应该能保存和恢复无限重掷状态（升级版优惠券）', () => {
    // 创建商店并应用导演剪辑版+优惠券
    const shop = new Shop();
    (gameState as any).shop = shop;
    gameState.applyVoucher('voucher_retcon');

    // 模拟多次重掷
    gameState.bossSelectionState.incrementBossRerollCount();
    gameState.bossSelectionState.incrementBossRerollCount();
    gameState.bossSelectionState.incrementBossRerollCount();

    // 验证状态
    expect(gameState.bossSelectionState.getBossRerollCount()).toBe(3);
    expect(gameState.bossSelectionState.hasUnlimitedReroll()).toBe(true);

    // 保存游戏
    const saveData = Storage.serialize(gameState);

    // 验证存档
    expect(saveData.bossSelectionState).toBeDefined();
    expect(saveData.bossSelectionState!.bossRerollCount).toBe(3);
    expect(saveData.bossSelectionState!.hasUnlimitedRerolls).toBe(true);

    // 创建新游戏状态并恢复
    const newGameState = new GameState();
    newGameState.startNewGame();

    // 恢复Boss选择状态
    if (saveData.bossSelectionState) {
      newGameState.bossSelectionState.restoreState({
        appearedBosses: saveData.bossSelectionState.appearedBosses as BossType[],
        currentAnte: saveData.bossSelectionState.currentAnte,
        bossRerollCount: saveData.bossSelectionState.bossRerollCount,
        hasUnlimitedRerolls: saveData.bossSelectionState.hasUnlimitedRerolls
      });
    }

    // 验证状态已恢复
    expect(newGameState.bossSelectionState.getBossRerollCount()).toBe(3);
    expect(newGameState.bossSelectionState.hasUnlimitedReroll()).toBe(true);

    // 验证仍然可以重掷（无限重掷）
    expect(newGameState.bossSelectionState.canRerollBoss(false)).toBe(true);
  });

  it('使用Storage.restore应该能完整恢复Boss选择状态', () => {
    // 创建商店并应用优惠券
    const shop = new Shop();
    (gameState as any).shop = shop;
    gameState.applyVoucher('voucher_directors_cut');

    // 设置一些状态
    gameState.bossSelectionState.incrementBossRerollCount();
    gameState.bossSelectionState.setCurrentAnte(3);

    // 保存
    const saveData = Storage.serialize(gameState);

    // 使用Storage.restore恢复
    const restoredGameState = Storage.restore(saveData);

    // 验证状态
    expect(restoredGameState.bossSelectionState.getBossRerollCount()).toBe(1);
    expect(restoredGameState.bossSelectionState.getCurrentAnte()).toBe(3);
    expect(restoredGameState.bossSelectionState.hasUnlimitedReroll()).toBe(false);
  });

  it('存档兼容性：没有bossSelectionState的存档应该能正常加载', () => {
    // 创建旧版本存档（没有bossSelectionState）
    const oldSaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      gameState: Storage.serialize(gameState).gameState,
      shop: undefined,
      bossAssignments: []
      // 注意：没有bossSelectionState字段
    };

    // 应该能正常恢复
    const restoredGameState = Storage.restore(oldSaveData as any);

    // 验证游戏状态正常
    expect(restoredGameState).toBeDefined();
    expect(restoredGameState.ante).toBe(gameState.ante);
  });
});
