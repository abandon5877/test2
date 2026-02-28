import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BossSelectionState } from '../models/BossSelectionState';
import { BossState } from '../models/BossState';
import { BossType, GamePhase, BlindType } from '../types/game';

describe('无尽模式Boss盲注重置测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('跳过Boss盲注后重置测试', () => {
    it('完成Boss盲注后进入新底注应重置Boss重掷次数', () => {
      // 设置游戏状态为无尽模式
      (gameState as any).isEndlessMode = true;

      // 模拟完成底注8的Boss盲注
      gameState.ante = 8;
      (gameState as any).currentBlindPosition = BlindType.BOSS_BLIND;

      // 使用掉所有Boss重掷次数
      const bossSelectionState = (gameState as any).bossSelectionState as BossSelectionState;
      bossSelectionState.incrementBossRerollCount();
      bossSelectionState.incrementBossRerollCount();
      bossSelectionState.incrementBossRerollCount();
      expect(bossSelectionState.getBossRerollCount()).toBe(3);

      // 模拟完成Boss盲注（调用advanceBlindPositionAfterComplete）
      (gameState as any).advanceBlindPositionAfterComplete();

      // 验证已进入底注9
      expect(gameState.ante).toBe(9);
      expect((gameState as any).currentBlindPosition).toBe(BlindType.SMALL_BLIND);

      // 验证Boss重掷次数已重置
      expect(bossSelectionState.getBossRerollCount()).toBe(0);
    });

    it('跳过Boss盲注后进入新底注应重置Boss重掷次数', () => {
      // 设置游戏状态为无尽模式
      (gameState as any).isEndlessMode = true;

      // 模拟在底注8的Boss盲注阶段
      gameState.ante = 8;
      (gameState as any).currentBlindPosition = BlindType.BOSS_BLIND;
      (gameState as any).phase = GamePhase.PLAYING;

      // 使用掉所有Boss重掷次数
      const bossSelectionState = (gameState as any).bossSelectionState as BossSelectionState;
      bossSelectionState.incrementBossRerollCount();
      bossSelectionState.incrementBossRerollCount();
      expect(bossSelectionState.getBossRerollCount()).toBe(2);

      // 模拟跳过Boss盲注（调用advanceBlindPosition）
      (gameState as any).advanceBlindPosition();

      // 验证已进入底注9
      expect(gameState.ante).toBe(9);
      expect((gameState as any).currentBlindPosition).toBe(BlindType.SMALL_BLIND);

      // 验证Boss重掷次数已重置（这是修复的关键）
      expect(bossSelectionState.getBossRerollCount()).toBe(0);
    });

    it('跳过Boss盲注后应清除Boss状态', () => {
      // 设置游戏状态为无尽模式
      (gameState as any).isEndlessMode = true;

      // 模拟在底注8的Boss盲注阶段，且有活跃的Boss效果
      gameState.ante = 8;
      (gameState as any).currentBlindPosition = BlindType.BOSS_BLIND;
      (gameState as any).phase = GamePhase.PLAYING;

      // 设置一个活跃的Boss状态
      const bossState = (gameState as any).bossState as BossState;
      bossState.setBoss(BossType.PSYCHIC);
      expect(bossState.getCurrentBoss()).toBe(BossType.PSYCHIC);

      // 模拟跳过Boss盲注
      (gameState as any).advanceBlindPosition();

      // 验证已进入底注9
      expect(gameState.ante).toBe(9);

      // 验证Boss状态已清除（返回null表示没有Boss）
      expect(bossState.getCurrentBoss()).toBeNull();
    });

    it('完成Boss盲注后应清除Boss状态', () => {
      // 设置游戏状态为无尽模式
      (gameState as any).isEndlessMode = true;

      // 模拟完成底注8的Boss盲注
      gameState.ante = 8;
      (gameState as any).currentBlindPosition = BlindType.BOSS_BLIND;

      // 设置一个活跃的Boss状态
      const bossState = (gameState as any).bossState as BossState;
      bossState.setBoss(BossType.PSYCHIC);
      expect(bossState.getCurrentBoss()).toBe(BossType.PSYCHIC);

      // 模拟完成Boss盲注
      (gameState as any).advanceBlindPositionAfterComplete();

      // 验证已进入底注9
      expect(gameState.ante).toBe(9);

      // 验证Boss状态已清除（返回null表示没有Boss）
      expect(bossState.getCurrentBoss()).toBeNull();
    });
  });

  describe('无尽模式下多次底注切换测试', () => {
    it('多次跳过Boss盲注应每次都重置重掷次数', () => {
      (gameState as any).isEndlessMode = true;

      // 模拟多次底注切换
      for (let ante = 8; ante <= 12; ante++) {
        gameState.ante = ante;
        (gameState as any).currentBlindPosition = BlindType.BOSS_BLIND;
        (gameState as any).phase = GamePhase.PLAYING;

        const bossSelectionState = (gameState as any).bossSelectionState as BossSelectionState;

        // 使用掉重掷次数
        bossSelectionState.incrementBossRerollCount();
        bossSelectionState.incrementBossRerollCount();
        expect(bossSelectionState.getBossRerollCount()).toBe(2);

        // 跳过Boss盲注
        (gameState as any).advanceBlindPosition();

        // 验证重掷次数已重置
        expect(bossSelectionState.getBossRerollCount()).toBe(0);
        expect(gameState.ante).toBe(ante + 1);
      }
    });

    it('多次完成Boss盲注应每次都重置重掷次数', () => {
      (gameState as any).isEndlessMode = true;

      // 模拟多次底注切换
      for (let ante = 8; ante <= 12; ante++) {
        gameState.ante = ante;
        (gameState as any).currentBlindPosition = BlindType.BOSS_BLIND;

        const bossSelectionState = (gameState as any).bossSelectionState as BossSelectionState;

        // 使用掉重掷次数
        bossSelectionState.incrementBossRerollCount();
        bossSelectionState.incrementBossRerollCount();
        bossSelectionState.incrementBossRerollCount();
        expect(bossSelectionState.getBossRerollCount()).toBe(3);

        // 完成Boss盲注
        (gameState as any).advanceBlindPositionAfterComplete();

        // 验证重掷次数已重置
        expect(bossSelectionState.getBossRerollCount()).toBe(0);
        expect(gameState.ante).toBe(ante + 1);
      }
    });
  });

  describe('非无尽模式测试', () => {
    it('非无尽模式底注9后应结束游戏', () => {
      (gameState as any).isEndlessMode = false;

      // 模拟在底注8的Boss盲注阶段
      gameState.ante = 8;
      (gameState as any).currentBlindPosition = BlindType.BOSS_BLIND;

      // 跳过Boss盲注
      (gameState as any).advanceBlindPosition();

      // 验证游戏已结束（非无尽模式底注>8）
      expect(gameState.ante).toBe(9);
      expect((gameState as any).phase).toBe(GamePhase.GAME_OVER);
    });
  });
});
