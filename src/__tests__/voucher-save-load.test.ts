import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Storage } from '../utils/storage';
import { GamePhase, BlindType } from '../types/game';

describe('优惠券存档读档测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('抓取者优惠券存档读档', () => {
    it('存档和读档后应该保留抓取者的出牌次数加成', () => {
      // 进入商店阶段并购买抓取者
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_grabber');

      // 验证购买后效果
      expect(gameState.getMaxHandsPerRound()).toBe(5);
      expect(gameState.handsRemaining).toBe(5);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 验证存档中包含优惠券效果
      expect(saveData.gameState.voucherEffects).toBeDefined();
      expect(saveData.gameState.voucherEffects.extraHandsFromVouchers).toBe(1);
      expect(saveData.gameState.voucherEffects.extraHandSizeFromVouchers).toBe(0);
      expect(saveData.gameState.voucherEffects.extraDiscardsFromVouchers).toBe(0);

      // 读档
      const loadedGameState = Storage.restore(saveData);

      // 验证读档后效果仍然保留
      expect(loadedGameState.getMaxHandsPerRound()).toBe(5);
      expect(loadedGameState.handsRemaining).toBe(5);
    });

    it('存档和读档后应该保留抓取者+的出牌次数加成', () => {
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_nacho_tong');

      expect(gameState.getMaxHandsPerRound()).toBe(6);

      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.voucherEffects.extraHandsFromVouchers).toBe(2);

      const loadedGameState = Storage.restore(saveData);
      expect(loadedGameState.getMaxHandsPerRound()).toBe(6);
    });

    it('存档和读档后应该保留基础和升级版的组合效果', () => {
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_grabber');
      gameState.applyVoucher('voucher_nacho_tong');

      expect(gameState.getMaxHandsPerRound()).toBe(7); // 4 + 1 + 2

      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.voucherEffects.extraHandsFromVouchers).toBe(3);

      const loadedGameState = Storage.restore(saveData);
      expect(loadedGameState.getMaxHandsPerRound()).toBe(7);
    });
  });

  describe('浪费优惠券存档读档', () => {
    it('存档和读档后应该保留浪费的弃牌次数加成', () => {
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_wasteful');

      expect(gameState.getMaxDiscardsPerRound()).toBe(4);

      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.voucherEffects.extraDiscardsFromVouchers).toBe(1);

      const loadedGameState = Storage.restore(saveData);
      expect(loadedGameState.getMaxDiscardsPerRound()).toBe(4);
    });

    it('存档和读档后应该保留浪费+的弃牌次数加成', () => {
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_recyclomancy');

      expect(gameState.getMaxDiscardsPerRound()).toBe(5);

      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.voucherEffects.extraDiscardsFromVouchers).toBe(2);

      const loadedGameState = Storage.restore(saveData);
      expect(loadedGameState.getMaxDiscardsPerRound()).toBe(5);
    });
  });

  describe('画笔优惠券存档读档', () => {
    it('存档和读档后应该保留画笔的手牌上限加成', () => {
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_paint_brush');

      expect(gameState.getMaxHandSize()).toBe(9);

      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.voucherEffects.extraHandSizeFromVouchers).toBe(1);

      const loadedGameState = Storage.restore(saveData);
      expect(loadedGameState.getMaxHandSize()).toBe(9);
    });

    it('存档和读档后应该保留画笔+的手牌上限加成', () => {
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_palette');

      expect(gameState.getMaxHandSize()).toBe(10);

      const saveData = Storage.serialize(gameState);
      expect(saveData.gameState.voucherEffects.extraHandSizeFromVouchers).toBe(2);

      const loadedGameState = Storage.restore(saveData);
      expect(loadedGameState.getMaxHandSize()).toBe(10);
    });
  });

  describe('多种优惠券组合存档读档', () => {
    it('存档和读档后应该保留所有优惠券效果', () => {
      gameState.phase = GamePhase.SHOP;

      // 购买多种优惠券
      gameState.applyVoucher('voucher_grabber'); // +1 出牌
      gameState.applyVoucher('voucher_nacho_tong'); // +2 出牌
      gameState.applyVoucher('voucher_wasteful'); // +1 弃牌
      gameState.applyVoucher('voucher_recyclomancy'); // +2 弃牌
      gameState.applyVoucher('voucher_paint_brush'); // +1 手牌
      gameState.applyVoucher('voucher_palette'); // +2 手牌

      // 验证所有效果
      expect(gameState.getMaxHandsPerRound()).toBe(7); // 4 + 1 + 2
      expect(gameState.getMaxDiscardsPerRound()).toBe(6); // 3 + 1 + 2
      expect(gameState.getMaxHandSize()).toBe(11); // 8 + 1 + 2

      // 存档
      const saveData = Storage.serialize(gameState);

      // 验证存档
      expect(saveData.gameState.voucherEffects.extraHandsFromVouchers).toBe(3);
      expect(saveData.gameState.voucherEffects.extraDiscardsFromVouchers).toBe(3);
      expect(saveData.gameState.voucherEffects.extraHandSizeFromVouchers).toBe(3);

      // 读档
      const loadedGameState = Storage.restore(saveData);

      // 验证所有效果仍然保留
      expect(loadedGameState.getMaxHandsPerRound()).toBe(7);
      expect(loadedGameState.getMaxDiscardsPerRound()).toBe(6);
      expect(loadedGameState.getMaxHandSize()).toBe(11);
    });
  });

  describe('读档后进入下一轮盲注', () => {
    it('读档后进入下一轮应该保留优惠券效果', () => {
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_grabber');

      // 存档
      const saveData = Storage.serialize(gameState);

      // 读档
      const loadedGameState = Storage.restore(saveData);

      // 退出商店，选择盲注
      loadedGameState.exitShop();
      loadedGameState.selectBlind(BlindType.SMALL_BLIND);

      // 验证新一轮有正确的出牌次数
      expect(loadedGameState.handsRemaining).toBe(5);
      expect(loadedGameState.getMaxHandsPerRound()).toBe(5);
    });
  });
});
