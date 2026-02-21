import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Storage } from '../utils/storage';
import { getJokerById } from '../data/jokers';

describe('游戏状态存档读档测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('基础存档读档', () => {
    it('游戏状态应该正确保存和恢复', () => {
      // 进行一些游戏操作
      gameState.addMoney(10);

      // 存档
      const saveData = Storage.serialize(gameState);
      expect(saveData).toBeDefined();

      // 恢复
      const restoredState = Storage.restoreGameState(saveData);
      expect(restoredState).toBeDefined();
    });
  });

  describe('小丑牌存档读档', () => {
    it('小丑牌应该正确保存和恢复', () => {
      const joker = getJokerById('joker')!;
      gameState.addJoker(joker);

      expect(gameState.getJokerSlots().getJokerCount()).toBe(1);

      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);

      expect(restoredState.getJokerSlots().getJokerCount()).toBe(1);
    });
  });

  describe('游戏进度存档读档', () => {
    it('金钱应该正确保存和恢复', () => {
      gameState.addMoney(50);
      expect(gameState.getMoney()).toBeGreaterThanOrEqual(50);

      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);

      expect(restoredState.getMoney()).toBeGreaterThanOrEqual(50);
    });
  });
});
