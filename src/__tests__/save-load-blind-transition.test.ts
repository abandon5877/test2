import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from '../utils/storage';
import { GameState } from '../models/GameState';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { BlindType } from '../types/game';

describe('盲注过渡存档读档测试', () => {
  beforeEach(() => {
    // 重置所有全局状态
    PokerHandDetector.clearConfig();
  });

  it('新盲注开始后出牌次数应该重置', () => {
    const gameState = new GameState();
    gameState.startNewGame();

    // 确保没有小丑牌影响出牌次数
    expect(gameState.getJokerCount()).toBe(0);
    expect(gameState.getMaxHandsPerRound()).toBe(4);

    gameState.selectBlind(BlindType.SMALL_BLIND);

    // 使用一些出牌次数
    gameState.cardPile.hand.selectCard(0);
    gameState.playHand();
    expect(gameState.handsRemaining).toBe(3);

    // 完成盲注
    (gameState as any).roundScore = 999999; // 确保通关
    gameState.completeBlind();

    // 完成盲注后进入商店阶段，需要手动进入盲注选择
    // 模拟从商店进入盲注选择
    (gameState as any).phase = 'BLIND_SELECT';

    // 进入下一个盲注
    gameState.selectBlind(BlindType.BIG_BLIND);
    // 新盲注应该重置出牌次数为4
    expect(gameState.handsRemaining).toBe(4);
    expect(gameState.getRemainingDiscards()).toBe(3);

    const saveData = Storage.serialize(gameState);
    PokerHandDetector.clearConfig();
    const restoredState = Storage.restoreGameState(saveData);

    // 验证读档后状态一致
    expect(restoredState.handsRemaining).toBe(4);
    expect(restoredState.getRemainingDiscards()).toBe(3);
  });
});
