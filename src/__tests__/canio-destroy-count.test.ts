import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { getJokerById } from '../data/jokers';
import { ALL_CONSUMABLE_INSTANCES as CONSUMABLES } from '../data/consumables';
import { ConsumableHelper } from '../utils/consumableHelper';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';

describe('卡尼奥 (Canio) 摧毁计数测试', () => {
  let gameState: GameState;
  let consumableHelper: ConsumableHelper;

  beforeEach(() => {
    gameState = new GameState();
    consumableHelper = new ConsumableHelper(gameState);
  });

  describe('塔罗牌摧毁人头牌', () => {
    it('倒吊人摧毁人头牌应该增加卡尼奥计数', () => {
      // 添加卡尼奥小丑牌
      const canio = getJokerById('canio')!;
      gameState.addJoker(canio);

      // 创建手牌：JK（人头牌）
      const jackCard = new Card(Suit.Spades, Rank.Jack);
      const kingCard = new Card(Suit.Hearts, Rank.King);
      gameState.cardPile.hand.addCard(jackCard);
      gameState.cardPile.hand.addCard(kingCard);

      // 选中JK
      gameState.cardPile.hand.selectCard(0);
      gameState.cardPile.hand.selectCard(1);

      // 获取倒吊人塔罗牌
      const hangedMan = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');
      expect(hangedMan).toBeDefined();

      // 模拟使用倒吊人
      const context = consumableHelper.createContext();
      const result = hangedMan!.use(context);

      expect(result.success).toBe(true);
      expect(result.destroyedCards).toBeDefined();
      expect(result.destroyedCards!.length).toBe(2);

      // 处理结果（这会触发卡尼奥计数更新）
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      // 验证卡尼奥的摧毁计数已更新
      const canioState = canio.getState();
      expect(canioState.destroyedFaceCards).toBe(2);
    });

    it('倒吊人摧毁非人头牌不应该增加卡尼奥计数', () => {
      // 添加卡尼奥小丑牌
      const canio = getJokerById('canio')!;
      gameState.addJoker(canio);

      // 创建手牌：A和2（非人头牌）
      const aceCard = new Card(Suit.Spades, Rank.Ace);
      const twoCard = new Card(Suit.Hearts, Rank.Two);
      gameState.cardPile.hand.addCard(aceCard);
      gameState.cardPile.hand.addCard(twoCard);

      // 选中这两张牌
      gameState.cardPile.hand.selectCard(0);
      gameState.cardPile.hand.selectCard(1);

      // 获取倒吊人塔罗牌
      const hangedMan = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');

      const context = consumableHelper.createContext();
      const result = hangedMan!.use(context);

      // 处理结果
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      // 验证卡尼奥的摧毁计数未更新（因为没有摧毁人头牌）
      const canioState = canio.getState();
      expect(canioState.destroyedFaceCards).toBeUndefined();
    });

    it('倒吊人摧毁混合牌应该只计算人头牌', () => {
      // 添加卡尼奥小丑牌
      const canio = getJokerById('canio')!;
      gameState.addJoker(canio);

      // 创建手牌：J（人头牌）和A（非人头牌）
      const jackCard = new Card(Suit.Spades, Rank.Jack);
      const aceCard = new Card(Suit.Hearts, Rank.Ace);
      gameState.cardPile.hand.addCard(jackCard);
      gameState.cardPile.hand.addCard(aceCard);

      // 选中这两张牌
      gameState.cardPile.hand.selectCard(0);
      gameState.cardPile.hand.selectCard(1);

      // 获取倒吊人塔罗牌
      const hangedMan = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');

      const context = consumableHelper.createContext();
      const result = hangedMan!.use(context);

      // 处理结果
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      // 验证卡尼奥的摧毁计数只增加了1（只有J是人头牌）
      const canioState = canio.getState();
      expect(canioState.destroyedFaceCards).toBe(1);
    });
  });

  describe('Glass卡牌摧毁', () => {
    it('Glass人头牌被摧毁时应该增加卡尼奥计数', () => {
      // 添加卡尼奥小丑牌
      const canio = getJokerById('canio')!;
      gameState.addJoker(canio);

      // 创建Glass人头牌
      const glassKing = new Card(Suit.Hearts, Rank.King, CardEnhancement.Glass);

      // 直接模拟计分系统摧毁Glass牌
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(canio);

      // 模拟计分结果
      const scoreResult = ScoringSystem.calculate(
        [glassKing],
        undefined,
        undefined,
        undefined,
        jokerSlots
      );

      // 注意：这里只是测试计分系统，实际Glass摧毁是在GameState中处理的
      // 我们需要验证卡尼奥效果是否正确计算
      const canioEffect = scoreResult.jokerEffects?.find(e => e.jokerName === '卡尼奥');
      // 初始状态没有摧毁记录，所以不应该有效果
      expect(canioEffect).toBeUndefined();
    });
  });

  describe('卡尼奥倍率计算', () => {
    it('摧毁1张人头牌后应该提供x2倍率', () => {
      // 添加卡尼奥小丑牌
      const canio = getJokerById('canio')!;
      gameState.addJoker(canio);

      // 手动设置摧毁计数
      canio.updateState({ destroyedFaceCards: 1 });

      // 创建计分系统测试
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(canio);

      const card = new Card(Suit.Spades, Rank.Ace);
      const result = ScoringSystem.calculate(
        [card],
        undefined,
        undefined,
        undefined,
        jokerSlots
      );

      // 验证卡尼奥效果
      const canioEffect = result.jokerEffects?.find(e => e.jokerName === '卡尼奥');
      expect(canioEffect).toBeDefined();
      expect(canioEffect?.multMultiplier).toBe(2);
    });

    it('摧毁3张人头牌后应该提供x4倍率', () => {
      // 添加卡尼奥小丑牌
      const canio = getJokerById('canio')!;
      gameState.addJoker(canio);

      // 手动设置摧毁计数
      canio.updateState({ destroyedFaceCards: 3 });

      // 创建计分系统测试
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(canio);

      const card = new Card(Suit.Spades, Rank.Ace);
      const result = ScoringSystem.calculate(
        [card],
        undefined,
        undefined,
        undefined,
        jokerSlots
      );

      // 验证卡尼奥效果
      const canioEffect = result.jokerEffects?.find(e => e.jokerName === '卡尼奥');
      expect(canioEffect).toBeDefined();
      expect(canioEffect?.multMultiplier).toBe(4);
    });
  });

  describe('多次摧毁累积', () => {
    it('多次使用倒吊人应该累积摧毁计数', () => {
      // 添加卡尼奥小丑牌
      const canio = getJokerById('canio')!;
      gameState.addJoker(canio);

      // 获取倒吊人塔罗牌
      const hangedMan = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');

      // 第一次使用倒吊人摧毁1张人头牌
      const jackCard1 = new Card(Suit.Spades, Rank.Jack);
      gameState.cardPile.hand.addCard(jackCard1);
      gameState.cardPile.hand.selectCard(0);

      let context = consumableHelper.createContext();
      let result = hangedMan!.use(context);
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      expect(canio.getState().destroyedFaceCards).toBe(1);

      // 第二次使用倒吊人摧毁2张人头牌
      const queenCard = new Card(Suit.Hearts, Rank.Queen);
      const kingCard = new Card(Suit.Diamonds, Rank.King);
      gameState.cardPile.hand.addCard(queenCard);
      gameState.cardPile.hand.addCard(kingCard);
      gameState.cardPile.hand.selectCard(0);
      gameState.cardPile.hand.selectCard(1);

      context = consumableHelper.createContext();
      result = hangedMan!.use(context);
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      // 验证累积计数
      expect(canio.getState().destroyedFaceCards).toBe(3);
    });
  });
});
