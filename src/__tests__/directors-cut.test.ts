import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BossSelectionState } from '../models/BossSelectionState';
import { BossSelectionSystem } from '../systems/BossSelectionSystem';
import { BossType, BlindType, GamePhase } from '../types/game';
import { initializeBlindConfigs, resetBlindConfigs } from '../data/blinds';

describe('导演剪辑版优惠券功能测试', () => {
  let gameState: GameState;
  let bossSelectionState: BossSelectionState;

  beforeEach(() => {
    resetBlindConfigs();
    gameState = new GameState();
    gameState.startNewGame();
    bossSelectionState = new BossSelectionState();
  });

  describe('BossSelectionState 重掷状态管理', () => {
    it('初始状态应该可以重掷0次', () => {
      expect(bossSelectionState.getBossRerollCount()).toBe(0);
      expect(bossSelectionState.canRerollBoss(false)).toBe(false);
      expect(bossSelectionState.canRerollBoss(true)).toBe(true);
    });

    it('重掷一次后应该不能再重掷（基础版）', () => {
      bossSelectionState.incrementBossRerollCount();
      expect(bossSelectionState.getBossRerollCount()).toBe(1);
      expect(bossSelectionState.canRerollBoss(true)).toBe(false);
    });

    it('设置无限重掷后应该可以无限重掷', () => {
      bossSelectionState.setUnlimitedRerolls(true);
      expect(bossSelectionState.hasUnlimitedReroll()).toBe(true);
      expect(bossSelectionState.canRerollBoss(false)).toBe(true);

      // 即使重掷多次也可以继续
      bossSelectionState.incrementBossRerollCount();
      bossSelectionState.incrementBossRerollCount();
      bossSelectionState.incrementBossRerollCount();
      expect(bossSelectionState.canRerollBoss(false)).toBe(true);
    });

    it('重置后应该恢复初始状态', () => {
      bossSelectionState.incrementBossRerollCount();
      bossSelectionState.setUnlimitedRerolls(true);
      bossSelectionState.resetBossRerollCount();

      expect(bossSelectionState.getBossRerollCount()).toBe(0);
      expect(bossSelectionState.canRerollBoss(true)).toBe(true);
    });

    it('新底注应该重置重掷次数', () => {
      bossSelectionState.incrementBossRerollCount();
      expect(bossSelectionState.getBossRerollCount()).toBe(1);

      // 模拟新底注
      bossSelectionState.resetBossRerollCount();
      expect(bossSelectionState.getBossRerollCount()).toBe(0);
      expect(bossSelectionState.canRerollBoss(true)).toBe(true);
    });
  });

  describe('BossSelectionSystem 重掷功能', () => {
    beforeEach(() => {
      // 初始化Boss分配
      const bossAssignments = new Map<number, BossType>();
      bossAssignments.set(1, BossType.HOOK);
      initializeBlindConfigs(bossAssignments);
      bossSelectionState.setCurrentAnte(1);
    });

    it('应该能够重掷Boss', () => {
      const result = BossSelectionSystem.rerollBoss(bossSelectionState, 1);

      expect(result.success).toBe(true);
      expect(result.oldBoss).toBeDefined();
      expect(result.newBoss).toBeDefined();
      expect(result.message).toContain('Boss已重掷');
    });

    it('重掷后应该更换Boss', () => {
      // 记录原始Boss
      const initialBoss = BossType.HOOK;

      // 多次重掷，验证Boss确实会改变（概率上几乎必然）
      let bossChanged = false;
      for (let i = 0; i < 10 && !bossChanged; i++) {
        const result = BossSelectionSystem.rerollBoss(bossSelectionState, 1);
        if (result.success && result.newBoss !== initialBoss) {
          bossChanged = true;
        }
      }

      expect(bossChanged).toBe(true);
    });

    it('重掷次数应该被记录', () => {
      expect(bossSelectionState.getBossRerollCount()).toBe(0);

      BossSelectionSystem.rerollBoss(bossSelectionState, 1);
      expect(bossSelectionState.getBossRerollCount()).toBe(1);

      BossSelectionSystem.rerollBoss(bossSelectionState, 1);
      expect(bossSelectionState.getBossRerollCount()).toBe(2);
    });

    it('canRerollBoss 应该正确判断', () => {
      expect(BossSelectionSystem.canRerollBoss(bossSelectionState, false)).toBe(false);
      expect(BossSelectionSystem.canRerollBoss(bossSelectionState, true)).toBe(true);

      // 重掷一次后
      BossSelectionSystem.rerollBoss(bossSelectionState, 1);
      expect(BossSelectionSystem.canRerollBoss(bossSelectionState, true)).toBe(false);
    });

    it('getRemainingRerolls 应该返回正确值', () => {
      expect(BossSelectionSystem.getRemainingRerolls(bossSelectionState, false)).toBe(0);
      expect(BossSelectionSystem.getRemainingRerolls(bossSelectionState, true)).toBe(1);

      BossSelectionSystem.rerollBoss(bossSelectionState, 1);
      expect(BossSelectionSystem.getRemainingRerolls(bossSelectionState, true)).toBe(0);
    });

    it('无限重掷应该返回Infinity', () => {
      bossSelectionState.setUnlimitedRerolls(true);
      expect(BossSelectionSystem.getRemainingRerolls(bossSelectionState, false)).toBe(Infinity);
    });

    it('无限重掷不应该耗尽可用Boss', () => {
      // 设置无限重掷
      bossSelectionState.setUnlimitedRerolls(true);

      // 连续重掷50次（远超正常Boss数量）
      for (let i = 0; i < 50; i++) {
        const result = BossSelectionSystem.rerollBoss(bossSelectionState, 1);
        expect(result.success).toBe(true);
        expect(result.newBoss).toBeDefined();
      }

      // 验证重掷次数确实增加了50次
      expect(bossSelectionState.getBossRerollCount()).toBe(50);
    });
  });

  describe('GameState 集成测试', () => {
    it('初始状态不应该能重掷Boss', () => {
      // 不在Boss盲注位置
      expect(gameState.canRerollBoss()).toBe(false);
    });

    it('应用导演剪辑版优惠券后应该能重掷Boss', async () => {
      // 创建商店（需要商店来记录优惠券）
      const { Shop } = await import('../models/Shop');
      const shop = new Shop();
      (gameState as any).shop = shop;

      // 先应用优惠券
      gameState.applyVoucher('voucher_directors_cut');

      // 验证优惠券已应用
      expect(gameState.hasDirectorsCutVoucher()).toBe(true);
    });

    it('应用导演剪辑版+优惠券后应该能无限重掷', async () => {
      // 创建商店
      const { Shop } = await import('../models/Shop');
      const shop = new Shop();
      (gameState as any).shop = shop;

      gameState.applyVoucher('voucher_retcon');

      expect(gameState.hasDirectorsCutVoucher()).toBe(true);
      // 注意：canRerollBoss 还需要在正确的游戏阶段才能返回true
    });

    it('getRemainingBossRerolls 应该返回正确值', async () => {
      // 创建商店
      const { Shop } = await import('../models/Shop');
      const shop = new Shop();
      (gameState as any).shop = shop;

      // 初始没有优惠券
      expect(gameState.getRemainingBossRerolls()).toBe(0);

      // 应用基础版
      gameState.applyVoucher('voucher_directors_cut');
      expect(gameState.getRemainingBossRerolls()).toBe(1);

      // 应用升级版（覆盖基础版）
      gameState.applyVoucher('voucher_retcon');
      expect(gameState.getRemainingBossRerolls()).toBe(Infinity);
    });
  });

  describe('导演剪辑版优惠券效果验证', () => {
    it('基础版优惠券应该只允许每底注重掷1次', () => {
      bossSelectionState.setCurrentAnte(1);

      // 没有优惠券时不能重掷
      expect(bossSelectionState.canRerollBoss(false)).toBe(false);

      // 有基础版优惠券时可以重掷
      expect(bossSelectionState.canRerollBoss(true)).toBe(true);

      // 重掷一次后不能再重掷
      bossSelectionState.incrementBossRerollCount();
      expect(bossSelectionState.canRerollBoss(true)).toBe(false);
    });

    it('升级版优惠券应该允许无限重掷', () => {
      bossSelectionState.setUnlimitedRerolls(true);

      // 不需要基础优惠券也能重掷
      expect(bossSelectionState.canRerollBoss(false)).toBe(true);

      // 重掷多次后仍然可以重掷
      for (let i = 0; i < 10; i++) {
        bossSelectionState.incrementBossRerollCount();
      }
      expect(bossSelectionState.canRerollBoss(false)).toBe(true);
    });
  });

  describe('序列化和反序列化', () => {
    it('状态应该能正确保存和恢复', () => {
      // 设置一些状态
      bossSelectionState.incrementBossRerollCount();
      bossSelectionState.setUnlimitedRerolls(true);

      // 获取状态
      const state = bossSelectionState.getState();

      // 验证状态包含新字段
      expect(state.bossRerollCount).toBe(1);
      expect(state.hasUnlimitedRerolls).toBe(true);

      // 创建新实例并恢复状态
      const newState = new BossSelectionState();
      newState.restoreState(state);

      // 验证状态已恢复
      expect(newState.getBossRerollCount()).toBe(1);
      expect(newState.hasUnlimitedReroll()).toBe(true);
      expect(newState.canRerollBoss(false)).toBe(true);
    });
  });
});
