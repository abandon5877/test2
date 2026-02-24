import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, SealType, CardEdition } from '../types/card';
import { BlindType, GamePhase } from '../types/game';
import { getJokerById } from '../data/jokers';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';

describe('回归测试: 卡组持久化和全息影像倍率', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('Bug 1: 卡组里的扑克牌状态没有持久化', () => {
    it('选择盲注时不应重置牌库到初始52张', () => {
      // 选择第一个盲注
      gameState.selectBlind(BlindType.SMALL_BLIND);

      // 记录初始牌库大小（应该包含手牌）
      const initialDeckSize = gameState.cardPile.deck.size;
      const initialHandSize = gameState.cardPile.hand.count;
      const initialTotalCards = gameState.cardPile.totalCount;

      // 模拟DNA效果：添加几张卡牌到牌库
      const card1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Gold, SealType.Gold);
      const card2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.Lucky, SealType.Red);
      gameState.addCardToDeck(card1, 'bottom');
      gameState.addCardToDeck(card2, 'bottom');

      // 验证卡牌已添加到牌库
      expect(gameState.cardPile.totalCount).toBe(initialTotalCards + 2);

      // 完成当前盲注
      gameState.cardPile.returnToDeckAndShuffle();

      // 模拟进入商店阶段
      gameState.phase = GamePhase.SHOP;

      // 模拟选择下一个盲注（BIG_BLIND）
      gameState.selectBlind(BlindType.BIG_BLIND);

      // 关键验证：牌库应该仍然包含添加的卡牌，不应该重置回52张
      expect(gameState.cardPile.totalCount).toBe(initialTotalCards + 2);

      // 验证添加的卡牌仍然存在
      const deckCards = gameState.cardPile.deck.getCards();
      const foundCard1 = deckCards.find(c =>
        c.suit === Suit.Spades &&
        c.rank === Rank.Ace &&
        c.enhancement === CardEnhancement.Gold
      );
      const foundCard2 = deckCards.find(c =>
        c.suit === Suit.Hearts &&
        c.rank === Rank.King &&
        c.enhancement === CardEnhancement.Lucky
      );

      expect(foundCard1).toBeDefined();
      expect(foundCard2).toBeDefined();
    });

    it('多次选择盲注后，添加的卡牌应该仍然保留', () => {
      // 选择第一个盲注
      gameState.selectBlind(BlindType.SMALL_BLIND);

      // 添加卡牌到牌库
      const card = new Card(Suit.Diamonds, Rank.Queen, CardEnhancement.Bonus);
      gameState.addCardToDeck(card, 'bottom');

      const totalAfterFirstAdd = gameState.cardPile.totalCount;

      // 完成并选择第二个盲注
      gameState.cardPile.returnToDeckAndShuffle();
      gameState.phase = GamePhase.SHOP;
      gameState.selectBlind(BlindType.BIG_BLIND);

      // 再次添加卡牌
      const card2 = new Card(Suit.Clubs, Rank.Jack, CardEnhancement.Glass);
      gameState.addCardToDeck(card2, 'bottom');

      const totalAfterSecondAdd = gameState.cardPile.totalCount;

      // 完成并选择第三个盲注
      gameState.cardPile.returnToDeckAndShuffle();
      gameState.phase = GamePhase.SHOP;
      gameState.selectBlind(BlindType.BOSS_BLIND);

      // 验证所有添加的卡牌都还存在
      expect(gameState.cardPile.totalCount).toBe(totalAfterSecondAdd);
    });
  });

  describe('Bug 2: 全息影像在DNA复制卡牌放入牌库时没有正确获得倍率', () => {
    it('全息影像应该在卡牌添加到牌库时增加cardsAdded计数', () => {
      const jokerSlots = new JokerSlots(5);
      const hologram = getJokerById('hologram');
      expect(hologram).toBeDefined();

      jokerSlots.addJoker(hologram!);

      // 初始状态
      expect(hologram!.state.cardsAdded).toBeUndefined();

      // 添加一张卡牌到牌库
      const card1 = new Card(Suit.Spades, Rank.Ace);
      JokerSystem.processCardAdded(jokerSlots, card1);

      // 验证cardsAdded计数增加
      expect(hologram!.state.cardsAdded).toBe(1);

      // 再添加一张卡牌
      const card2 = new Card(Suit.Hearts, Rank.King);
      JokerSystem.processCardAdded(jokerSlots, card2);

      // 验证cardsAdded计数再次增加
      expect(hologram!.state.cardsAdded).toBe(2);
    });

    it('全息影像的倍率应该随着添加卡牌数量增加', () => {
      const jokerSlots = new JokerSlots(5);
      const hologram = getJokerById('hologram');
      expect(hologram).toBeDefined();

      jokerSlots.addJoker(hologram!);

      // 添加3张卡牌
      const ranks = [Rank.Two, Rank.Three, Rank.Four];
      for (let i = 0; i < 3; i++) {
        const card = new Card(Suit.Spades, ranks[i]);
        JokerSystem.processCardAdded(jokerSlots, card);
      }

      // 验证cardsAdded计数为3
      expect(hologram!.state.cardsAdded).toBe(3);

      // 验证倍率计算正确: 1 + (3 * 0.25) = 1.75
      const result = JokerSystem.processOnPlay(jokerSlots);
      expect(result.multMultiplier).toBe(1.75);
    });

    it('GameState.addCardToDeck应该触发全息影像效果', () => {
      gameState.selectBlind(BlindType.SMALL_BLIND);

      const hologram = getJokerById('hologram');
      expect(hologram).toBeDefined();

      gameState.jokerSlots.addJoker(hologram!);

      // 初始状态
      expect(hologram!.state.cardsAdded).toBeUndefined();

      // 通过GameState添加卡牌
      const card = new Card(Suit.Diamonds, Rank.Queen);
      gameState.addCardToDeck(card, 'bottom');

      // 验证全息影像的cardsAdded计数增加
      expect(hologram!.state.cardsAdded).toBe(1);
    });

    it('多张全息影像应该分别计数', () => {
      const jokerSlots = new JokerSlots(5);
      const hologram1 = getJokerById('hologram');
      const hologram2 = getJokerById('hologram');
      expect(hologram1).toBeDefined();
      expect(hologram2).toBeDefined();

      jokerSlots.addJoker(hologram1!);
      jokerSlots.addJoker(hologram2!);

      // 添加卡牌
      const card = new Card(Suit.Clubs, Rank.Jack);
      JokerSystem.processCardAdded(jokerSlots, card);

      // 两张全息影像都应该增加计数
      expect(hologram1!.state.cardsAdded).toBe(1);
      expect(hologram2!.state.cardsAdded).toBe(1);
    });

    it('全息影像的动态描述应该反映当前倍率', () => {
      const hologram = getJokerById('hologram');
      expect(hologram).toBeDefined();

      // 初始描述
      const initialDesc = hologram!.getDynamicDescription();
      expect(initialDesc).toContain('已添加0张牌');
      expect(initialDesc).toContain('x1.00倍率');

      // 模拟添加卡牌后的状态
      hologram!.updateState({ cardsAdded: 5 });

      const updatedDesc = hologram!.getDynamicDescription();
      expect(updatedDesc).toContain('已添加5张牌');
      expect(updatedDesc).toContain('x2.25倍率'); // 1 + (5 * 0.25) = 2.25
    });
  });

  describe('集成测试: DNA复制 + 全息影像', () => {
    it('DNA复制卡牌后，全息影像应该获得倍率', () => {
      gameState.selectBlind(BlindType.SMALL_BLIND);

      // 添加全息影像
      const hologram = getJokerById('hologram');
      expect(hologram).toBeDefined();
      gameState.jokerSlots.addJoker(hologram!);

      // 初始状态
      expect(hologram!.state.cardsAdded).toBeUndefined();

      // 模拟DNA效果：复制一张卡牌到牌库
      const cardToCopy = new Card(
        Suit.Spades,
        Rank.Ace,
        CardEnhancement.Gold,
        SealType.Gold,
        CardEdition.Foil
      );
      gameState.addCardToDeck(cardToCopy.clone(), 'bottom');

      // 验证全息影像获得了倍率
      expect(hologram!.state.cardsAdded).toBe(1);

      // 验证倍率正确
      const result = JokerSystem.processOnPlay(gameState.jokerSlots);
      expect(result.multMultiplier).toBe(1.25); // 1 + (1 * 0.25)
    });

    it('多次DNA复制后，全息影像倍率应该正确累积', () => {
      gameState.selectBlind(BlindType.SMALL_BLIND);

      const hologram = getJokerById('hologram');
      expect(hologram).toBeDefined();
      gameState.jokerSlots.addJoker(hologram!);

      // 模拟多次DNA复制
      const heartRanks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six];
      for (let i = 0; i < 5; i++) {
        const card = new Card(Suit.Hearts, heartRanks[i]);
        gameState.addCardToDeck(card.clone(), 'bottom');
      }

      // 验证计数
      expect(hologram!.state.cardsAdded).toBe(5);

      // 验证倍率: 1 + (5 * 0.25) = 2.25
      const result = JokerSystem.processOnPlay(gameState.jokerSlots);
      expect(result.multMultiplier).toBe(2.25);
    });
  });
});
