import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BlindType } from '../types/game';
import { Storage } from '../utils/storage';
import { BossSystem } from '../systems/BossSystem';
import { PokerHandType } from '../types/pokerHands';

describe('Boss状态存档读档测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    // 使用默认的盲注配置（由GameState初始化时设置）
    gameState = new GameState();
    gameState.startNewGame();
  });

  it('存档时应该保存Boss状态', () => {
    // 按顺序选择盲注：小盲注 -> 大盲注 -> Boss盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    gameState.selectBlind(BlindType.BIG_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    // 现在选择Boss盲注
    gameState.selectBlind(BlindType.BOSS_BLIND);
    
    // 获取当前Boss（随机分配的）
    const currentBoss = gameState.bossState.getCurrentBoss();
    expect(currentBoss).not.toBeNull(); // 验证Boss已设置
    
    // 模拟一些Boss状态
    gameState.bossState.recordPlayedHandType(PokerHandType.OnePair);
    gameState.bossState.recordPlayedHandType(PokerHandType.ThreeOfAKind);
    gameState.bossState.setFirstHandPlayed();
    
    // 存档
    const saveData = Storage.serialize(gameState);
    
    // 验证Boss状态已保存
    expect(saveData.gameState.bossState).toBeDefined();
    expect(saveData.gameState.bossState?.currentBoss).toBe(currentBoss);
    expect(saveData.gameState.bossState?.playedHandTypes).toContain(PokerHandType.OnePair);
    expect(saveData.gameState.bossState?.playedHandTypes).toContain(PokerHandType.ThreeOfAKind);
    expect(saveData.gameState.bossState?.firstHandPlayed).toBe(true);
  });

  it('读档时应该恢复Boss状态', () => {
    // 按顺序选择盲注到Boss盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    gameState.selectBlind(BlindType.BIG_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    gameState.selectBlind(BlindType.BOSS_BLIND);
    
    // 获取当前Boss
    const currentBoss = gameState.bossState.getCurrentBoss();
    expect(currentBoss).not.toBeNull();
    
    gameState.bossState.recordPlayedHandType(PokerHandType.OnePair);
    gameState.bossState.setFirstHandPlayed();
    
    // 存档
    const saveData = Storage.serialize(gameState);
    
    // 读档
    const restoredGameState = Storage.restoreGameState(saveData);
    
    // 验证Boss状态已恢复
    expect(restoredGameState.bossState.getCurrentBoss()).toBe(currentBoss);
    expect(restoredGameState.bossState.hasPlayedHandType(PokerHandType.OnePair)).toBe(true);
    expect(restoredGameState.bossState.isFirstHandPlayed()).toBe(true);
  });

  it('读档后Boss效果应该仍然生效', () => {
    // 按顺序选择盲注到Boss盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    gameState.selectBlind(BlindType.BIG_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    gameState.selectBlind(BlindType.BOSS_BLIND);
    
    // 获取当前Boss
    const currentBoss = gameState.bossState.getCurrentBoss();
    expect(currentBoss).not.toBeNull();
    
    // 存档
    const saveData = Storage.serialize(gameState);
    
    // 读档
    const restoredGameState = Storage.restoreGameState(saveData);
    
    // 验证Boss效果仍然生效
    const canPlayResult = BossSystem.canPlayHand(restoredGameState.bossState, PokerHandType.OnePair);
    expect(canPlayResult.canPlay).toBe(true);
    
    // 验证是当前Boss
    expect(BossSystem.getCurrentBoss(restoredGameState.bossState)).toBe(currentBoss);
  });

  it('没有Boss时不应该保存Boss状态', () => {
    // 选择小盲注（没有Boss）
    gameState.selectBlind(BlindType.SMALL_BLIND);
    
    // 验证没有Boss
    expect(gameState.bossState.getCurrentBoss()).toBeNull();
    
    // 存档
    const saveData = Storage.serialize(gameState);
    
    // 验证Boss状态为undefined或currentBoss为null
    expect(saveData.gameState.bossState?.currentBoss).toBeNull();
  });

  it('读档后柱子Boss效果应该正确恢复', () => {
    // 按顺序选择盲注到Boss盲注
    gameState.selectBlind(BlindType.SMALL_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    gameState.selectBlind(BlindType.BIG_BLIND);
    gameState.roundScore = gameState.currentBlind!.targetScore;
    gameState.completeBlind();
    gameState.exitShop();
    
    gameState.selectBlind(BlindType.BOSS_BLIND);
    
    // 模拟出牌记录
    gameState.bossState.recordCardPlayed({ toString: () => 'Hearts-A' } as any);
    gameState.bossState.recordCardPlayed({ toString: () => 'Spades-K' } as any);
    
    // 存档
    const saveData = Storage.serialize(gameState);
    
    // 读档
    const restoredGameState = Storage.restoreGameState(saveData);
    
    // 验证柱子Boss效果正确恢复（如果当前Boss是柱子）
    expect(restoredGameState.bossState.hasCardBeenPlayed({ toString: () => 'Hearts-A' } as any)).toBe(true);
    expect(restoredGameState.bossState.hasCardBeenPlayed({ toString: () => 'Spades-K' } as any)).toBe(true);
    expect(restoredGameState.bossState.hasCardBeenPlayed({ toString: () => 'Diamonds-Q' } as any)).toBe(false);
  });
});
