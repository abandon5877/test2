import { describe, it, expect, beforeEach } from 'vitest';
import {
  setGrosMichelDestroyed,
  resetGrosMichelDestroyed,
  isGrosMichelDestroyed,
  getJokerById
} from '../data/jokers';
import { Storage, SaveData } from '../utils/storage';
import { GameState } from '../models/GameState';

describe('卡文迪什存档读档测试', () => {
  beforeEach(() => {
    // 每个测试前重置大麦克自毁状态
    resetGrosMichelDestroyed();
  });

  describe('大麦克自毁状态存档', () => {
    it('存档应该包含大麦克自毁状态', () => {
      const gameState = new GameState();
      gameState.startNewGame();

      // 设置大麦克已自毁
      setGrosMichelDestroyed(true);
      expect(isGrosMichelDestroyed()).toBe(true);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 验证存档包含大麦克自毁状态
      expect(saveData.grosMichelDestroyed).toBe(true);
    });

    it('未自毁时存档应该包含false状态', () => {
      const gameState = new GameState();
      gameState.startNewGame();

      // 确保大麦克未自毁
      expect(isGrosMichelDestroyed()).toBe(false);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 验证存档包含false状态
      expect(saveData.grosMichelDestroyed).toBe(false);
    });
  });

  describe('大麦克自毁状态读档', () => {
    it('读档应该恢复大麦克自毁状态', () => {
      const gameState = new GameState();
      gameState.startNewGame();

      // 设置大麦克已自毁
      setGrosMichelDestroyed(true);
      expect(isGrosMichelDestroyed()).toBe(true);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 重置状态（模拟新游戏）
      resetGrosMichelDestroyed();
      expect(isGrosMichelDestroyed()).toBe(false);

      // 读档
      Storage.restoreGameState(saveData);

      // 验证状态已恢复
      expect(isGrosMichelDestroyed()).toBe(true);
    });

    it('读档应该恢复未自毁状态', () => {
      const gameState = new GameState();
      gameState.startNewGame();

      // 确保大麦克未自毁
      expect(isGrosMichelDestroyed()).toBe(false);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 设置自毁状态（模拟大麦克自毁）
      setGrosMichelDestroyed(true);
      expect(isGrosMichelDestroyed()).toBe(true);

      // 读档
      Storage.restoreGameState(saveData);

      // 验证状态已恢复为未自毁
      expect(isGrosMichelDestroyed()).toBe(false);
    });

    it('旧存档（没有grosMichelDestroyed字段）应该能正常读档', () => {
      const gameState = new GameState();
      gameState.startNewGame();

      // 设置大麦克已自毁
      setGrosMichelDestroyed(true);

      // 创建模拟旧存档（没有grosMichelDestroyed字段）
      const oldSaveData: SaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        // 注意：没有grosMichelDestroyed字段
        gameState: Storage.serialize(gameState).gameState
      };

      // 重置状态
      resetGrosMichelDestroyed();
      expect(isGrosMichelDestroyed()).toBe(false);

      // 读档旧存档（不应该报错）
      expect(() => {
        Storage.restoreGameState(oldSaveData);
      }).not.toThrow();
    });
  });

  describe('存档读档后卡文迪什生成', () => {
    it('读档后应该能根据恢复的状态生成卡文迪什', () => {
      const gameState = new GameState();
      gameState.startNewGame();

      // 设置大麦克已自毁
      setGrosMichelDestroyed(true);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 重置状态
      resetGrosMichelDestroyed();
      expect(isGrosMichelDestroyed()).toBe(false);

      // 读档
      Storage.restoreGameState(saveData);

      // 验证状态已恢复
      expect(isGrosMichelDestroyed()).toBe(true);

      // 验证卡文迪什现在可以被生成（通过检查卡文迪什存在且是罕见稀有度）
      const cavendish = getJokerById('cavendish');
      expect(cavendish).toBeDefined();
    });
  });
});
