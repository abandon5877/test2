import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BlindType, BossType, GamePhase } from '../types/game';
import { BossSystem } from '../systems/BossSystem';

describe('Boss盲注消失问题修复测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  // 辅助函数：完成当前盲注并退出商店
  function completeBlindAndExitShop(gs: GameState): void {
    gs.roundScore = gs.currentBlind!.targetScore;
    gs.completeBlind();
    // 退出商店进入盲注选择
    gs.exitShop();
  }

  it('完成Boss盲注后应该清除Boss状态', () => {
    // 1. 选择小盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 2. 完成小盲注
    completeBlindAndExitShop(gameState);
    expect(gameState.getCurrentBlindPosition()).toBe(BlindType.BIG_BLIND);
    
    // 3. 选择大盲注
    gameState.selectBlind(BlindType.BIG_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 4. 完成大盲注
    completeBlindAndExitShop(gameState);
    expect(gameState.getCurrentBlindPosition()).toBe(BlindType.BOSS_BLIND);
    
    // 5. 选择Boss盲注 - 此时应该设置Boss
    gameState.selectBlind(BlindType.BOSS_BLIND);
    const bossBeforeComplete = BossSystem.getCurrentBoss(gameState.bossState);
    expect(bossBeforeComplete).not.toBeNull(); // 验证Boss被设置
    
    // 6. 完成Boss盲注
    completeBlindAndExitShop(gameState);
    
    // 7. 验证Boss状态已被清除
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    expect(gameState.getCurrentBlindPosition()).toBe(BlindType.SMALL_BLIND);
    expect(gameState.ante).toBe(2);
  });

  it('进入新底注后Boss效果不应该影响小盲注', () => {
    // 快速完成底注1的所有盲注
    for (let i = 0; i < 3; i++) {
      const currentPosition = gameState.getCurrentBlindPosition();
      gameState.selectBlind(currentPosition);
      completeBlindAndExitShop(gameState);
    }
    
    // 验证进入底注2
    expect(gameState.ante).toBe(2);
    expect(gameState.getCurrentBlindPosition()).toBe(BlindType.SMALL_BLIND);
    
    // 验证Boss状态已被清除
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 选择小盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    
    // 验证小盲注不受之前的Boss效果影响
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 验证手牌上限没有被之前的Boss（如手铐）影响
    const handSize = gameState.getMaxHandSize();
    expect(handSize).toBe(8); // 默认手牌上限
  });

  it('跳过盲注不应该影响Boss状态', () => {
    // 跳过小盲注
    gameState.skipBlind();
    expect(gameState.getCurrentBlindPosition()).toBe(BlindType.BIG_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 跳过大盲注
    gameState.skipBlind();
    expect(gameState.getCurrentBlindPosition()).toBe(BlindType.BOSS_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 选择Boss盲注
    gameState.selectBlind(BlindType.BOSS_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).not.toBeNull();
  });

  it('Boss效果只应该在当前盲注生效', () => {
    // 1. 选择小盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 2. 完成小盲注
    completeBlindAndExitShop(gameState);
    
    // 3. 选择大盲注
    gameState.selectBlind(BlindType.BIG_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 4. 完成大盲注
    completeBlindAndExitShop(gameState);
    
    // 5. 选择Boss盲注
    gameState.selectBlind(BlindType.BOSS_BLIND);
    expect(BossSystem.getCurrentBoss(gameState.bossState)).not.toBeNull();
    
    // 验证Boss效果生效
    const canPlayResult = BossSystem.canPlayHand(gameState.bossState, 'onePair' as any);
    expect(canPlayResult.canPlay).toBe(true);
    
    // 6. 完成Boss盲注
    completeBlindAndExitShop(gameState);
    
    // 验证进入新底注后Boss效果不再生效
    expect(BossSystem.getCurrentBoss(gameState.bossState)).toBeNull();
    
    // 7. 选择新底注的小盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    
    // 验证没有Boss限制
    const newCanPlayResult = BossSystem.canPlayHand(gameState.bossState, 'onePair' as any);
    expect(newCanPlayResult.canPlay).toBe(true);
    expect(newCanPlayResult.message).toBeUndefined();
  });
});
