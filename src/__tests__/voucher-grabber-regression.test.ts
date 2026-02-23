import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { GamePhase, BlindType } from '../types/game';

describe('抓取者优惠券回归测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('场景1: 在商店购买抓取者后进入下一轮', () => {
    it('购买抓取者后，当前回合应立即获得+1出牌次数', () => {
      const initialHands = gameState.handsRemaining;

      // 模拟在商店购买抓取者优惠券
      gameState.applyVoucher('voucher_grabber');

      // 当前回合应立即获得+1出牌次数
      expect(gameState.handsRemaining).toBe(initialHands + 1);
      expect(gameState.getMaxHandsPerRound()).toBe(5); // 默认4 + 1
    });

    it('购买抓取者后，进入下一轮盲注应该保留+1出牌次数', () => {
      // 先完成当前盲注，进入商店阶段
      gameState.phase = GamePhase.SHOP;

      // 在商店购买抓取者
      gameState.applyVoucher('voucher_grabber');

      // 验证已应用
      expect(gameState.getMaxHandsPerRound()).toBe(5);

      // 退出商店，进入盲注选择
      gameState.exitShop();

      // 选择小盲注
      gameState.selectBlind(BlindType.SMALL_BLIND);

      // 验证新一轮有5次出牌机会
      expect(gameState.handsRemaining).toBe(5);
      expect(gameState.getMaxHandsPerRound()).toBe(5);
    });

    it('购买抓取者+后，进入下一轮盲注应该保留+2出牌次数', () => {
      // 先完成当前盲注，进入商店阶段
      gameState.phase = GamePhase.SHOP;

      // 在商店购买抓取者+
      gameState.applyVoucher('voucher_nacho_tong');

      // 验证已应用
      expect(gameState.getMaxHandsPerRound()).toBe(6);

      // 退出商店，进入盲注选择
      gameState.exitShop();

      // 选择小盲注
      gameState.selectBlind(BlindType.SMALL_BLIND);

      // 验证新一轮有6次出牌机会
      expect(gameState.handsRemaining).toBe(6);
      expect(gameState.getMaxHandsPerRound()).toBe(6);
    });

    it('购买两个抓取者（基础和升级版）后应该有+3出牌次数', () => {
      // 先完成当前盲注，进入商店阶段
      gameState.phase = GamePhase.SHOP;

      // 先购买基础版 (+1)
      gameState.applyVoucher('voucher_grabber');
      expect(gameState.getMaxHandsPerRound()).toBe(5);

      // 再购买升级版 (+2)
      gameState.applyVoucher('voucher_nacho_tong');
      expect(gameState.getMaxHandsPerRound()).toBe(7); // 4 + 1 + 2 = 7

      // 退出商店，进入盲注选择
      gameState.exitShop();

      // 选择小盲注
      gameState.selectBlind(BlindType.SMALL_BLIND);

      // 验证新一轮有7次出牌机会
      expect(gameState.handsRemaining).toBe(7);
    });
  });

  describe('场景2: 多轮游戏后抓取者效果仍然有效', () => {
    it('购买抓取者后经过多轮，效果应该持续', () => {
      // 第一轮：购买抓取者
      gameState.phase = GamePhase.SHOP;
      gameState.applyVoucher('voucher_grabber');
      gameState.exitShop();

      // 第一轮盲注
      gameState.selectBlind(BlindType.SMALL_BLIND);
      expect(gameState.handsRemaining).toBe(5);
      expect(gameState.getMaxHandsPerRound()).toBe(5);

      // 模拟完成盲注，进入下一轮商店
      gameState.phase = GamePhase.SHOP;
      gameState.exitShop();

      // 第二轮盲注
      gameState.selectBlind(BlindType.BIG_BLIND);
      expect(gameState.handsRemaining).toBe(5);
      expect(gameState.getMaxHandsPerRound()).toBe(5);
    });
  });

  describe('场景3: 新游戏后抓取者效果应该被重置', () => {
    it('新游戏后应该重置出牌次数', () => {
      // 购买抓取者
      gameState.applyVoucher('voucher_grabber');
      expect(gameState.getMaxHandsPerRound()).toBe(5);

      // 开始新游戏
      gameState.startNewGame();

      // 验证重置为默认值
      expect(gameState.getMaxHandsPerRound()).toBe(4);
      expect(gameState.handsRemaining).toBe(4);
    });
  });
});
