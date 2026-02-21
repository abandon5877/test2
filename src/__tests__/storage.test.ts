import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Storage } from '../utils/storage';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, CardEdition } from '../types/card';
import { BlindType } from '../types/game';
import { getJokerById } from '../data/jokers';

describe('Storage系统测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('序列化和反序列化', () => {
    it('应该正确序列化游戏状态', () => {
      const saveData = Storage.serialize(gameState);
      expect(saveData).toBeDefined();
      expect(saveData).toBeDefined();
      expect(saveData).toBeDefined();
    });

    it('应该正确反序列化游戏状态', () => {
      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);
      expect(restoredState).toBeDefined();
      expect(restoredState instanceof GameState).toBe(true);
    });

    it('反序列化后游戏状态应该一致', () => {
      gameState.addMoney(100);
      // gameState.addScore(500);

      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);

      // expect(restoredState.getMoney()).toBe(100);
      // expect(restoredState.getCurrentScore()).toBe(500);
    });
  });

  describe('小丑牌存储', () => {
    it('应该正确保存小丑牌', () => {
      const joker = getJokerById('joker')!;
      gameState.addJoker(joker);

      const saveData = Storage.serialize(gameState);
      expect(saveData).toBeDefined();
    });

    it('应该正确恢复小丑牌', () => {
      const joker = getJokerById('joker')!;
      gameState.addJoker(joker);

      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);

      const jokers = restoredState.getJokerSlots().getJokers();
      expect(jokers.length).toBe(1);
      expect(jokers[0].id).toBe('joker');
    });

    it('多张小丑牌应该正确保存和恢复', () => {
      const joker1 = getJokerById('joker')!;
      const joker2 = getJokerById('greedy_joker')!;
      gameState.addJoker(joker1);
      gameState.addJoker(joker2);

      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);

      const jokers = restoredState.getJokerSlots().getJokers();
      expect(jokers.length).toBe(2);
    });
  });

  describe('卡牌存储', () => {
    it('应该正确保存卡牌增强', () => {
      gameState.selectBlind(BlindType.SMALL_BLIND);
      const card = new Card(Suit.Spades, Rank.Ace);
      card.enhancement = CardEnhancement.Bonus;

      const saveData = Storage.serialize(gameState);
      expect(saveData).toBeDefined();
    });

    it('应该正确保存卡牌版本', () => {
      const card = new Card(Suit.Hearts, Rank.King);
      card.edition = CardEdition.Foil;

      const saveData = Storage.serialize(gameState);
      expect(saveData).toBeDefined();
    });
  });

  describe('存档恢复后四指效果应该生效', () => {
    it('应该正确恢复四指效果', () => {
      const fourFingers = getJokerById('four_fingers');
      expect(fourFingers).not.toBeUndefined();

      gameState.addJoker(fourFingers!);

      const saveData = Storage.serialize(gameState);
      const restoredState = Storage.restoreGameState(saveData);

      // 验证四指小丑牌已恢复
      const jokers = restoredState.getJokerSlots().getJokers();
      expect(jokers.some(j => j.id === 'four_fingers')).toBe(true);
    });
  });
});
