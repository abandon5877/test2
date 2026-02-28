import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';
import { ALL_CONSUMABLE_INSTANCES as CONSUMABLES } from '../data/consumables';
import { ConsumableHelper } from '../utils/consumableHelper';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSystem } from '../systems/JokerSystem';

describe('卡尼奥 (Canio) + 幻想性错觉 (Pareidolia) 组合测试', () => {
  let gameState: GameState;
  let consumableHelper: ConsumableHelper;

  beforeEach(() => {
    gameState = new GameState();
    consumableHelper = new ConsumableHelper(gameState);
  });

  describe('组合效果：摧毁任意牌都应该增加倍率', () => {
    it('倒吊人摧毁非人头牌时，有幻想性错觉应该增加卡尼奥计数', () => {
      // 添加卡尼奥和幻想性错觉小丑牌
      const canio = getJokerById('canio')!;
      const pareidolia = getJokerById('pareidolia')!;
      gameState.addJoker(canio);
      gameState.addJoker(pareidolia);

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
      expect(hangedMan).toBeDefined();

      const context = consumableHelper.createContext();
      const result = hangedMan!.use(context);

      expect(result.success).toBe(true);
      expect(result.destroyedCards).toBeDefined();
      expect(result.destroyedCards!.length).toBe(2);

      // 处理结果（这会触发卡尼奥计数更新）
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      // 从gameState中获取实际的卡尼奥状态
      const actualCanio = gameState.jokers.find(j => j.id === 'canio');
      expect(actualCanio).toBeDefined();
      // 验证卡尼奥的摧毁计数已更新（因为幻想性错觉，A和2都视为人头牌）
      expect(actualCanio!.getState().destroyedFaceCards).toBe(2);
    });

    it('倒吊人摧毁混合牌时，有幻想性错觉应该全部计入卡尼奥计数', () => {
      // 添加卡尼奥和幻想性错觉小丑牌
      const canio = getJokerById('canio')!;
      const pareidolia = getJokerById('pareidolia')!;
      gameState.addJoker(canio);
      gameState.addJoker(pareidolia);

      // 创建手牌：J（人头牌）和A（非人头牌）- 倒吊人最多摧毁2张牌
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

      expect(result.success).toBe(true);
      expect(result.destroyedCards).toBeDefined();
      expect(result.destroyedCards!.length).toBe(2);

      // 处理结果
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      // 从gameState中获取实际的卡尼奥状态
      const actualCanio = gameState.jokers.find(j => j.id === 'canio');
      expect(actualCanio).toBeDefined();
      // 验证卡尼奥的摧毁计数（2张都视为人头牌，因为有幻想性错觉）
      expect(actualCanio!.getState().destroyedFaceCards).toBe(2);
    });

    it('卡尼奥+幻想性错觉组合后，摧毁2张非人头牌应该提供x3倍率', () => {
      // 添加卡尼奥和幻想性错觉小丑牌
      const canio = getJokerById('canio')!;
      const pareidolia = getJokerById('pareidolia')!;
      gameState.addJoker(canio);
      gameState.addJoker(pareidolia);

      // 获取倒吊人塔罗牌
      const hangedMan = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');

      // 使用倒吊人摧毁2张非人头牌
      const aceCard = new Card(Suit.Spades, Rank.Ace);
      const twoCard = new Card(Suit.Hearts, Rank.Two);
      gameState.cardPile.hand.addCard(aceCard);
      gameState.cardPile.hand.addCard(twoCard);
      gameState.cardPile.hand.selectCard(0);
      gameState.cardPile.hand.selectCard(1);

      const context = consumableHelper.createContext();
      const result = hangedMan!.use(context);
      expect(result.success).toBe(true);
      consumableHelper.handleResult(result, hangedMan!.id, hangedMan!.type);

      // 从gameState中获取实际的卡尼奥状态
      const actualCanio = gameState.jokers.find(j => j.id === 'canio');
      expect(actualCanio).toBeDefined();
      // 验证卡尼奥计数
      expect(actualCanio!.getState().destroyedFaceCards).toBe(2);

      // 验证倍率计算: 1 + 2 = x3
      const jokerSlots = new JokerSlots(5);
      // 使用gameState中的实际小丑牌
      gameState.jokers.forEach(j => jokerSlots.addJoker(j));

      const card = new Card(Suit.Clubs, Rank.Four);
      const scoreResult = ScoringSystem.calculate(
        [card],
        undefined,
        undefined,
        undefined,
        jokerSlots
      );

      // 验证卡尼奥效果
      const canioEffect = scoreResult.jokerEffects?.find((e: any) => e.jokerName === '卡尼奥');
      expect(canioEffect).toBeDefined();
      expect(canioEffect?.multMultiplier).toBe(3); // 1 + 2 = 3
    });
  });
});
