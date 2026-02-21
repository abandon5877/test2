import { describe, it, expect, beforeEach } from 'vitest';
import { BossSelectionSystem } from '../systems/BossSelectionSystem';
import { BossSelectionState } from '../models/BossSelectionState';
import { BossSystem } from '../systems/BossSystem';
import { BossType } from '../types/game';
import { initializeBlindConfigs, getBlindConfigs, resetBlindConfigs, getBossBlindConfig } from '../data/blinds';

describe('Boss随机抽选系统', () => {
  let selectionState: BossSelectionState;

  beforeEach(() => {
    selectionState = new BossSelectionState();
    resetBlindConfigs();
  });

  describe('Boss选择基础功能', () => {
    it('应该能选择Ante 1的Boss', () => {
      const result = BossSelectionSystem.selectBoss(selectionState, 1);
      
      expect(result.bossType).toBeDefined();
      expect(result.isFinisher).toBe(false);
      
      const config = BossSystem.getBossConfig(result.bossType);
      expect(config.minAnte).toBeLessThanOrEqual(1);
    });

    it('Ante 8应该选择终结者Boss', () => {
      const result = BossSelectionSystem.selectBoss(selectionState, 8);
      
      expect(result.isFinisher).toBe(true);
      expect([
        BossType.AMBER_ACORN,
        BossType.VERDANT_LEAF,
        BossType.VIOLET_VESSEL,
        BossType.CRIMSON_HEART,
        BossType.CERULEAN_BELL
      ]).toContain(result.bossType);
    });

    it('Ante 16也应该选择终结者Boss', () => {
      const result = BossSelectionSystem.selectBoss(selectionState, 16);
      
      expect(result.isFinisher).toBe(true);
    });

    it('非8的倍数底注不应该选择终结者Boss', () => {
      for (let ante = 1; ante <= 7; ante++) {
        BossSelectionSystem.reset(selectionState);
        const result = BossSelectionSystem.selectBoss(selectionState, ante);
        expect(result.isFinisher).toBe(false);
      }
    });
  });

  describe('Boss不重复机制', () => {
    it('同一Boss不应该重复出现', () => {
      const appearedBosses = new Set<BossType>();
      
      // 选择8个底注的Boss
      for (let ante = 1; ante <= 8; ante++) {
        const result = BossSelectionSystem.selectBoss(selectionState, ante);
        
        // 非终结者Boss不应该重复
        if (!result.isFinisher) {
          expect(appearedBosses.has(result.bossType)).toBe(false);
          appearedBosses.add(result.bossType);
        }
      }
    });

    it('所有Boss出现后应该重置', () => {
      // 先选择大量Boss
      for (let ante = 1; ante <= 20; ante++) {
        BossSelectionSystem.selectBoss(selectionState, ante);
      }
      
      const stats = BossSelectionSystem.getStats(selectionState);
      
      // 应该已经重置过（因为所有符合条件的Boss都出现过了）
      expect(stats.appearedCount).toBeGreaterThan(0);
    });

    it('重置后应该能再次选择相同的Boss', () => {
      const firstResult = BossSelectionSystem.selectBoss(selectionState, 1);
      
      // 重置系统
      BossSelectionSystem.reset(selectionState);
      
      // 多次选择，确保能选到相同的Boss
      let foundSameBoss = false;
      for (let i = 0; i < 50; i++) {
        BossSelectionSystem.reset(selectionState);
        const result = BossSelectionSystem.selectBoss(selectionState, 1);
        if (result.bossType === firstResult.bossType) {
          foundSameBoss = true;
          break;
        }
      }
      
      expect(foundSameBoss).toBe(true);
    });
  });

  describe('最低底注限制', () => {
    it('Ante 1只能选择minAnte <= 1的Boss', () => {
      for (let i = 0; i < 20; i++) {
        BossSelectionSystem.reset(selectionState);
        const result = BossSelectionSystem.selectBoss(selectionState, 1);
        const config = BossSystem.getBossConfig(result.bossType);
        expect(config.minAnte).toBeLessThanOrEqual(1);
      }
    });

    it('Ante 2可以选择minAnte <= 2的Boss', () => {
      const validBosses = new Set<BossType>();
      
      // 多次选择收集所有可能的Boss
      for (let i = 0; i < 100; i++) {
        BossSelectionSystem.reset(selectionState);
        const result = BossSelectionSystem.selectBoss(selectionState, 2);
        validBosses.add(result.bossType);
      }
      
      // 所有选到的Boss都应该满足minAnte <= 2
      for (const bossType of validBosses) {
        const config = BossSystem.getBossConfig(bossType);
        expect(config.minAnte).toBeLessThanOrEqual(2);
      }
    });

    it('高底注Boss不应该在低底注出现', () => {
      // Ante 1不应该出现minAnte > 1的Boss
      for (let i = 0; i < 50; i++) {
        BossSelectionSystem.reset(selectionState);
        const result = BossSelectionSystem.selectBoss(selectionState, 1);
        
        // 不应该出现这些高底注Boss
        expect(result.bossType).not.toBe(BossType.OX); // minAnte 6
        expect(result.bossType).not.toBe(BossType.PLANT); // minAnte 4
        expect(result.bossType).not.toBe(BossType.SERPENT); // minAnte 5
      }
    });
  });

  describe('盲注配置生成', () => {
    it('应该能生成完整的盲注配置', () => {
      const bossAssignments = new Map<number, BossType>();
      
      // 为每个底注选择Boss
      for (let ante = 1; ante <= 8; ante++) {
        const result = BossSelectionSystem.selectBoss(selectionState, ante);
        bossAssignments.set(ante, result.bossType);
      }
      
      // 初始化盲注配置
      initializeBlindConfigs(bossAssignments);
      
      const configs = getBlindConfigs();
      
      // 验证配置
      expect(configs.length).toBe(24); // 8个底注 × 3个盲注
      
      // 验证每个底注都有Boss盲注配置
      for (let ante = 1; ante <= 8; ante++) {
        const bossConfig = getBossBlindConfig(ante);
        expect(bossConfig).toBeDefined();
        expect(bossConfig?.bossType).toBe(bossAssignments.get(ante));
        expect(bossConfig?.type).toBe('BOSS_BLIND');
      }
    });

    it('Boss盲注应该有正确的分数倍数', () => {
      const bossAssignments = new Map<number, BossType>([
        [1, BossType.HOOK],
        [4, BossType.WALL],
        [8, BossType.VIOLET_VESSEL]
      ]);
      
      initializeBlindConfigs(bossAssignments);
      
      // 钩子: 2倍
      const hookConfig = getBossBlindConfig(1);
      expect(hookConfig?.scoreMultiplier).toBe(2);
      expect(hookConfig?.targetScore).toBe(600 * 2);
      
      // 墙壁: 4倍
      const wallConfig = getBossBlindConfig(4);
      expect(wallConfig?.scoreMultiplier).toBe(4);
      expect(wallConfig?.targetScore).toBe(10000 * 4);
      
      // 紫色容器: 6倍
      const violetConfig = getBossBlindConfig(8);
      expect(violetConfig?.scoreMultiplier).toBe(6);
      expect(violetConfig?.targetScore).toBe(100000 * 6);
    });

    it('Boss盲注应该有正确的奖励', () => {
      const bossAssignments = new Map<number, BossType>([
        [1, BossType.HOOK],
        [8, BossType.AMBER_ACORN]
      ]);
      
      initializeBlindConfigs(bossAssignments);
      
      const normalBoss = getBossBlindConfig(1);
      expect(normalBoss?.reward).toBe(5);
      
      const finisherBoss = getBossBlindConfig(8);
      expect(finisherBoss?.reward).toBe(8);
    });
  });

  describe('统计信息', () => {
    it('应该返回正确的统计信息', () => {
      const stats = BossSelectionSystem.getStats(selectionState);
      
      expect(stats.appearedCount).toBe(0);
      expect(stats.totalBosses).toBe(Object.values(BossType).length);
      expect(stats.remainingForCurrentAnte).toBeGreaterThan(0);
    });

    it('选择Boss后统计应该更新', () => {
      BossSelectionSystem.selectBoss(selectionState, 1);
      
      const stats = BossSelectionSystem.getStats(selectionState);
      expect(stats.appearedCount).toBe(1);
    });
  });

  describe('存档/读档支持', () => {
    it('应该能设置已出现的Boss列表', () => {
      const appearedBosses = [BossType.HOOK, BossType.WALL, BossType.EYE];
      
      BossSelectionSystem.setAppearedBosses(selectionState, appearedBosses);
      
      for (const boss of appearedBosses) {
        expect(BossSelectionSystem.hasBossAppeared(selectionState, boss)).toBe(true);
      }
    });

    it('应该能获取已出现的Boss列表', () => {
      BossSelectionSystem.selectBoss(selectionState, 1);
      BossSelectionSystem.selectBoss(selectionState, 2);
      
      const appeared = BossSelectionSystem.getAppearedBosses(selectionState);
      expect(appeared.length).toBe(2);
    });
  });

  describe('边界情况', () => {
    it('应该能处理非常高的底注', () => {
      const result = BossSelectionSystem.selectBoss(selectionState, 100);
      
      expect(result.bossType).toBeDefined();
      // 100不是8的倍数，所以不是终结者
      expect(result.isFinisher).toBe(false);
    });

    it('底注8的倍数应该是终结者', () => {
      const finisherAntes = [8, 16, 24, 32, 40];
      
      for (const ante of finisherAntes) {
        BossSelectionSystem.reset(selectionState);
        const result = BossSelectionSystem.selectBoss(selectionState, ante);
        expect(result.isFinisher).toBe(true);
      }
    });

    it('所有Boss配置都应该完整', () => {
      const allBossTypes = Object.values(BossType);
      
      for (const bossType of allBossTypes) {
        const config = BossSystem.getBossConfig(bossType);
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.minAnte).toBeGreaterThanOrEqual(1);
        expect(config.scoreMultiplier).toBeGreaterThan(0);
        expect(config.reward).toBeGreaterThan(0);
      }
    });
  });

  describe('随机性', () => {
    it('多次选择应该产生不同的结果', () => {
      const results = new Set<BossType>();
      
      // Ante 2有多个可选Boss，多次选择应该能选到不同的
      for (let i = 0; i < 30; i++) {
        BossSelectionSystem.reset(selectionState);
        const result = BossSelectionSystem.selectBoss(selectionState, 2);
        results.add(result.bossType);
      }
      
      // 应该能选到多个不同的Boss
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
