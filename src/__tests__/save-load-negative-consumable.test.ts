import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Storage } from '../utils/storage';
import { getConsumableById } from '../data/consumables';

describe('存档读档 - 负片消耗牌测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('负片消耗牌保存', () => {
    it('负片消耗牌的 isNegative 状态应该正确保存和恢复', () => {
      // 添加普通消耗牌
      const normalConsumable = getConsumableById('tarot_fool');
      expect(normalConsumable).not.toBeNull();
      expect(normalConsumable).not.toBeUndefined();
      gameState.addConsumable(normalConsumable!);

      // 添加负片消耗牌（模拟佩尔科复制的效果）
      const negativeConsumable = getConsumableById('tarot_magician');
      expect(negativeConsumable).not.toBeNull();
      expect(negativeConsumable).not.toBeUndefined();
      (negativeConsumable as any).isNegative = true;
      gameState.addConsumable(negativeConsumable!);

      // 验证添加成功
      expect(gameState.getConsumableCount()).toBe(2);

      // 存档
      const saveData = Storage.serialize(gameState);
      expect(saveData).toBeDefined();
      expect(saveData.gameState.consumables).toHaveLength(2);

      // 验证存档中包含负片状态
      expect(saveData.gameState.consumables[0].isNegative).toBeUndefined();
      expect(saveData.gameState.consumables[1].isNegative).toBe(true);

      // 读档
      const restoredState = Storage.restoreGameState(saveData);

      // 验证消耗牌数量
      expect(restoredState.getConsumableCount()).toBe(2);

      // 验证负片状态已恢复
      const restoredConsumables = restoredState.getConsumableSlots().getConsumables();
      expect((restoredConsumables[0] as any).isNegative).toBeUndefined();
      expect((restoredConsumables[1] as any).isNegative).toBe(true);
    });

    it('负片消耗牌应该提供额外的槽位', () => {
      // 填满普通槽位（默认2个）
      const consumable1 = getConsumableById('tarot_fool');
      const consumable2 = getConsumableById('tarot_magician');
      expect(consumable1).not.toBeUndefined();
      expect(consumable2).not.toBeUndefined();
      gameState.addConsumable(consumable1!);
      gameState.addConsumable(consumable2!);

      // 验证槽位已满
      expect(gameState.getConsumableSlots().hasAvailableSlot()).toBe(false);

      // 添加负片消耗牌（应该能添加，因为提供额外槽位）
      const negativeConsumable = getConsumableById('tarot_high_priestess');
      expect(negativeConsumable).not.toBeUndefined();
      (negativeConsumable as any).isNegative = true;
      const added = gameState.addConsumable(negativeConsumable!);
      expect(added).toBe(true);

      // 验证现在有3张消耗牌
      expect(gameState.getConsumableCount()).toBe(3);

      // 存档并读档
      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);

      // 验证读档后消耗牌数量正确
      expect(restoredState.getConsumableCount()).toBe(3);

      // 验证负片状态保留
      const restoredConsumables = restoredState.getConsumableSlots().getConsumables();
      const negativeOnes = restoredConsumables.filter(c => (c as any).isNegative === true);
      expect(negativeOnes).toHaveLength(1);
    });
  });

  describe('消耗牌售价加成保存', () => {
    it('消耗牌的 sellValueBonus 应该正确保存和恢复', () => {
      const consumable = getConsumableById('tarot_fool');
      expect(consumable).not.toBeNull();
      expect(consumable).not.toBeUndefined();

      // 增加售价（模拟礼品卡效果）
      consumable!.increaseSellValue(5);
      expect(consumable!.getSellPrice()).toBeGreaterThan(consumable!.cost / 2);

      const originalSellPrice = consumable!.getSellPrice();
      gameState.addConsumable(consumable!);

      // 存档
      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.consumables[0].sellValueBonus).toBe(5);

      // 读档
      const restoredState = Storage.restoreGameState(saveData);

      // 验证售价加成已恢复
      const restoredConsumable = restoredState.getConsumableSlots().getConsumables()[0];
      expect(restoredConsumable.getSellPrice()).toBe(originalSellPrice);
    });
  });
});
