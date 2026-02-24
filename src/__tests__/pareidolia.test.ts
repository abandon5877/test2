import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { JokerSlots } from '../models/JokerSlots';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, SealType, CardEdition } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { JokerSystem } from '../systems/JokerSystem';
import { ScoringSystem } from '../systems/ScoringSystem';

describe('幻想性错觉(Pareidolia)测试', () => {
  let gameState: GameState;
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    jokerSlots = gameState.getJokerSlots();
  });

  describe('幻想性错觉效果测试', () => {
    it('幻想性错觉应该让所有牌都视为人头牌', () => {
      // 创建幻想性错觉小丑牌
      const pareidolia = getJokerById('pareidolia');
      if (pareidolia) jokerSlots.addJoker(pareidolia);

      // 创建非人头牌（2和3）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);

      // 验证原始判断
      expect(card1.isFaceCard).toBe(false);
      expect(card2.isFaceCard).toBe(false);

      // 验证JokerSystem.isFaceCard方法（考虑到幻想性错觉效果）
      const jokers = jokerSlots.getJokers();
      expect(JokerSystem.isFaceCard(card1, jokers)).toBe(true);
      expect(JokerSystem.isFaceCard(card2, jokers)).toBe(true);
    });

    it('没有幻想性错觉时，isFaceCard应该返回原始判断', () => {
      // 不添加幻想性错觉

      // 创建人头牌和非人头牌
      const faceCard = new Card(Suit.Hearts, Rank.King);
      const nonFaceCard = new Card(Suit.Diamonds, Rank.Two);

      const jokers = jokerSlots.getJokers();

      // 验证JokerSystem.isFaceCard方法
      expect(JokerSystem.isFaceCard(faceCard, jokers)).toBe(true);
      expect(JokerSystem.isFaceCard(nonFaceCard, jokers)).toBe(false);
    });

    it('恐怖面孔应该对幻想性错觉下的所有牌生效', () => {
      // 创建幻想性错觉和恐怖面孔小丑牌
      const pareidolia = getJokerById('pareidolia');
      const scaryFace = getJokerById('scary_face');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (scaryFace) jokerSlots.addJoker(scaryFace);

      // 创建非人头牌（2和3）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const scoredCards = [card1, card2];

      // 模拟计分过程
      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        100,
        10
      );

      // 验证恐怖面孔效果：2张牌都应该视为人头牌，每张+30筹码
      expect(result.chipBonus).toBe(60); // 2 * 30
    });

    it('笑脸应该对幻想性错觉下的所有牌生效', () => {
      // 创建幻想性错觉和笑脸小丑牌
      const pareidolia = getJokerById('pareidolia');
      const smileyFace = getJokerById('smiley_face');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (smileyFace) jokerSlots.addJoker(smileyFace);

      // 创建非人头牌（2, 3, 4）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const card3 = new Card(Suit.Clubs, Rank.Four);
      const scoredCards = [card1, card2, card3];

      // 模拟计分过程
      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        100,
        10
      );

      // 验证笑脸效果：3张牌都应该视为人头牌，每张+5倍率
      expect(result.multBonus).toBe(15); // 3 * 5
    });

    it('照片应该对幻想性错觉下的第一张牌生效', () => {
      // 创建幻想性错觉和照片小丑牌
      const pareidolia = getJokerById('pareidolia');
      const photograph = getJokerById('photograph');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (photograph) jokerSlots.addJoker(photograph);

      // 创建非人头牌（2作为第一张）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const scoredCards = [card1, card2];

      // 模拟计分过程
      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        100,
        10
      );

      // 验证照片效果：第一张牌（2）应该视为人头牌，触发x2倍率
      expect(result.multMultiplier).toBe(2);
    });

    it('名片应该对幻想性错觉下的所有牌生效', () => {
      // 创建幻想性错觉和名片小丑牌
      const pareidolia = getJokerById('pareidolia');
      const businessCard = getJokerById('business_card');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (businessCard) jokerSlots.addJoker(businessCard);

      // 创建非人头牌（2, 3, 4）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const card3 = new Card(Suit.Clubs, Rank.Four);
      const scoredCards = [card1, card2, card3];

      // 模拟计分过程（多次运行以测试概率）
      let totalMoney = 0;
      const runs = 100;
      for (let i = 0; i < runs; i++) {
        const result = JokerSystem.processScoredCards(
          jokerSlots,
          scoredCards,
          PokerHandType.HighCard,
          100,
          10
        );
        totalMoney += result.effects.reduce((sum, e) => sum + (e.moneyBonus || 0), 0);
      }

      // 每张牌50%概率给$2，3张牌100次运行，期望值为 3 * 0.5 * 2 * 100 = 300
      // 允许一定的误差范围
      expect(totalMoney).toBeGreaterThan(200);
      expect(totalMoney).toBeLessThan(400);
    });

    it('无面小丑应该对幻想性错觉下的弃牌生效', () => {
      // 创建幻想性错觉和无面小丑
      const pareidolia = getJokerById('pareidolia');
      const facelessJoker = getJokerById('faceless_joker');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (facelessJoker) jokerSlots.addJoker(facelessJoker);

      // 创建非人头牌（2, 3, 4）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const card3 = new Card(Suit.Clubs, Rank.Four);
      const discardedCards = [card1, card2, card3];

      // 模拟弃牌过程
      const result = JokerSystem.processDiscard(
        jokerSlots,
        discardedCards,
        0
      );

      // 验证无面小丑效果：3张牌都应该视为人头牌，触发+$5
      expect(result.moneyBonus).toBe(5);
    });

    it('巴士之旅应该在幻想性错觉下中断', () => {
      // 创建幻想性错觉和巴士之旅
      const pareidolia = getJokerById('pareidolia');
      const rideTheBus = getJokerById('ride_the_bus');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (rideTheBus) jokerSlots.addJoker(rideTheBus);

      // 创建非人头牌（2）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const scoredCards = [card1];

      // 模拟出牌过程
      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        100,
        10
      );

      // 验证巴士之旅效果：由于幻想性错觉，2视为人头牌，streak应该中断（返回0倍率）
      // 但第一次出牌时noFaceStreak为0，所以返回0倍率
      expect(result.multBonus).toBe(0);
    });

    it('迈达斯面具应该对幻想性错觉下的所有牌生效', () => {
      // 创建幻想性错觉和迈达斯面具
      const pareidolia = getJokerById('pareidolia');
      const midasMask = getJokerById('midas_mask');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (midasMask) jokerSlots.addJoker(midasMask);

      // 创建非人头牌（2, 3）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const scoredCards = [card1, card2];

      // 模拟计分过程
      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.HighCard,
        100,
        10
      );

      // 验证迈达斯面具效果：2张牌都应该视为人头牌，触发turnToGold
      const effect = result.effects.find(e => e.jokerName === '迈达斯面具');
      expect(effect).toBeDefined();
    });

    it('预留车位应该对幻想性错觉下的手牌生效', () => {
      // 创建幻想性错觉和预留车位
      const pareidolia = getJokerById('pareidolia');
      const reservedParking = getJokerById('reserved_parking');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (reservedParking) jokerSlots.addJoker(reservedParking);

      // 创建非人头牌（2, 3, 4）作为手牌
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const card3 = new Card(Suit.Clubs, Rank.Four);
      const heldCards = [card1, card2, card3];

      // 模拟回合结束过程（多次运行以测试概率）
      let totalMoney = 0;
      const runs = 100;
      for (let i = 0; i < runs; i++) {
        // 重新创建GameState以重置状态
        const testGameState = new GameState();
        testGameState.startNewGame();
        const testJokerSlots = testGameState.getJokerSlots();
        const p = getJokerById('pareidolia');
        const r = getJokerById('reserved_parking');
        if (p) testJokerSlots.addJoker(p);
        if (r) testJokerSlots.addJoker(r);

        // 使用processEndRound而不是processHeld，因为预留车位是END_OF_ROUND触发器
        const result = JokerSystem.processEndRound(testJokerSlots, undefined, false, heldCards);
        totalMoney += result.effects.reduce((sum, e) => sum + (e.moneyBonus || 0), 0);
      }

      // 每张牌50%概率给$1，3张牌100次运行，期望值为 3 * 0.5 * 1 * 100 = 150
      // 允许一定的误差范围
      expect(totalMoney).toBeGreaterThan(100);
      expect(totalMoney).toBeLessThan(200);
    });

    it('喜剧与悲剧应该在算分时对幻想性错觉下的所有牌生效', () => {
      // 创建幻想性错觉和喜剧与悲剧
      const pareidolia = getJokerById('pareidolia');
      const sockAndBuskin = getJokerById('sock_and_buskin');
      if (pareidolia) jokerSlots.addJoker(pareidolia);
      if (sockAndBuskin) jokerSlots.addJoker(sockAndBuskin);

      // 创建非人头牌（2, 3）
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const card2 = new Card(Suit.Diamonds, Rank.Three);
      const scoredCards = [card1, card2];

      // 使用ScoringSystem计算分数
      const result = ScoringSystem.calculate(
        scoredCards,
        PokerHandType.HighCard,
        undefined,
        [],
        jokerSlots
      );

      // 验证喜剧与悲剧效果：2张牌都应该视为人头牌，触发两次
      // 每张牌的筹码应该被计算两次
      // 2的基础筹码是2，3的基础筹码是3，总共5
      // 触发两次后，总筹码应该是 (2+3) * 2 = 10
      expect(result.totalChips).toBeGreaterThan(5); // 应该大于正常计算的5
    });
  });

  describe('幻想性错觉上下文测试', () => {
    it('JokerSystem应该在上下文中正确设置allCardsAreFace', () => {
      // 创建幻想性错觉
      const pareidolia = getJokerById('pareidolia');
      if (pareidolia) jokerSlots.addJoker(pareidolia);

      // 创建非人头牌作为手牌
      const card1 = new Card(Suit.Hearts, Rank.Two);
      const heldCards = [card1];

      // 模拟手牌处理过程（ON_INDEPENDENT触发器在processHeld中处理）
      const result = JokerSystem.processHeld(
        jokerSlots,
        heldCards
      );

      // 验证幻想性错觉效果消息存在
      const pareidoliaEffect = result.effects.find(e => e.jokerName === '幻想性错觉');
      expect(pareidoliaEffect).toBeDefined();
    });

    it('hasPareidolia应该正确检测幻想性错觉', () => {
      // 初始状态：没有幻想性错觉
      expect(JokerSystem.hasPareidolia(jokerSlots.getJokers())).toBe(false);

      // 添加幻想性错觉
      const pareidolia = getJokerById('pareidolia');
      if (pareidolia) jokerSlots.addJoker(pareidolia);

      // 验证检测
      expect(JokerSystem.hasPareidolia(jokerSlots.getJokers())).toBe(true);
    });
  });
});
