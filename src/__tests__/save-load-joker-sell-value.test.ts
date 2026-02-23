import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Storage } from '../utils/storage';
import { getJokerById } from '../data/jokers';

describe('存档读档 - 小丑牌售价加成测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('小丑牌售价加成保存', () => {
    it('小丑牌的 sellValueBonus 应该正确保存和恢复', () => {
      const joker = getJokerById('joker');
      expect(joker).not.toBeUndefined();

      // 增加售价（模拟礼品卡效果）
      joker!.increaseSellValue(5);
      const originalSellPrice = joker!.getSellPrice();
      expect(originalSellPrice).toBeGreaterThan(joker!.cost / 2);

      gameState.addJoker(joker!);

      // 存档
      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.jokers[0].sellValueBonus).toBe(5);

      // 读档
      const restoredState = Storage.restoreGameState(saveData);

      // 验证售价加成已恢复
      const restoredJoker = restoredState.getJokerSlots().getJokers()[0];
      expect(restoredJoker.getSellPrice()).toBe(originalSellPrice);
    });

    it('多张小丑牌的售价加成应该分别保存和恢复', () => {
      const joker1 = getJokerById('joker');
      const joker2 = getJokerById('greedy_joker');

      expect(joker1).not.toBeUndefined();
      expect(joker2).not.toBeUndefined();

      // 给第一张增加$3售价
      joker1!.increaseSellValue(3);
      // 给第二张增加$7售价
      joker2!.increaseSellValue(7);

      const originalSellPrice1 = joker1!.getSellPrice();
      const originalSellPrice2 = joker2!.getSellPrice();

      gameState.addJoker(joker1!);
      gameState.addJoker(joker2!);

      // 存档
      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.jokers[0].sellValueBonus).toBe(3);
      expect(saveData.gameState.jokers[1].sellValueBonus).toBe(7);

      // 读档
      const restoredState = Storage.restoreGameState(saveData);

      // 验证售价加成分别恢复
      const restoredJokers = restoredState.getJokerSlots().getJokers();
      expect(restoredJokers[0].getSellPrice()).toBe(originalSellPrice1);
      expect(restoredJokers[1].getSellPrice()).toBe(originalSellPrice2);
    });

    it('没有售价加成的小丑牌应该保持基础售价', () => {
      const joker = getJokerById('joker');
      expect(joker).not.toBeUndefined();

      const baseSellPrice = joker!.getSellPrice();
      expect(baseSellPrice).toBe(Math.max(1, Math.floor(joker!.cost / 2)));

      gameState.addJoker(joker!);

      // 存档
      const saveData = Storage.serialize(gameState);
      // sellValueBonus 初始值为 0，当为 0 时可能不保存或为 0
      expect(saveData.gameState.jokers[0].sellValueBonus ?? 0).toBe(0);

      // 读档
      const restoredState = Storage.restoreGameState(saveData);

      // 验证售价仍然是基础值
      const restoredJoker = restoredState.getJokerSlots().getJokers()[0];
      expect(restoredJoker.getSellPrice()).toBe(baseSellPrice);
    });
  });
});
