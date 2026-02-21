import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { PokerHandType } from '../types/pokerHands';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

// 辅助函数：创建测试用的卡牌
function createTestCard(suit: Suit, rank: Rank): Card {
  return new Card(suit, rank);
}

describe('阶段3: 状态存储机制测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('constellation (星座)', () => {
    it('应该正确跟踪行星牌使用次数并计算倍率', () => {
      const constellation = new Joker({
        id: 'constellation',
        name: '星座',
        description: '每使用一张行星牌x0.1倍率',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: (context): { multMultiplier?: number; message?: string } => {
          const planetCardsUsed = (context as unknown as { jokerState?: { planetCardsUsed?: number } }).jokerState?.planetCardsUsed || 0;
          const multiplier = 1 + planetCardsUsed * 0.1;
          return {
            multMultiplier: multiplier,
            message: `星座: 已使用${planetCardsUsed}张行星牌, x${multiplier.toFixed(1)}倍率`
          };
        }
      });

      jokerSlots.addJoker(constellation);

      // 初始状态：未使用行星牌，倍率应为1.0
      const card = createTestCard(Suit.Hearts, Rank.Ace);
      const result1 = JokerSystem.processHandPlayed(jokerSlots, [card],
        PokerHandType.HighCard,
        100,
        1);
      expect(result1.multMultiplier).toBe(1);

      // 使用3张行星牌
      jokerSlots.updatePlanetCardCount();
      jokerSlots.updatePlanetCardCount();
      jokerSlots.updatePlanetCardCount();

      // 使用后：倍率应为1.3 (1 + 3 * 0.1)
      const result2 = JokerSystem.processHandPlayed(jokerSlots, [card],
        PokerHandType.HighCard,
        100,
        1);
      expect(result2.multMultiplier).toBe(1.3);
    });

    it('应该通过getState()正确获取状态', () => {
      const constellation = new Joker({
        id: 'constellation',
        name: '星座',
        description: '每使用一张行星牌x0.1倍率',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: () => ({})
      });

      jokerSlots.addJoker(constellation);

      // 使用5张行星牌
      for (let i = 0; i < 5; i++) {
        jokerSlots.updatePlanetCardCount();
      }

      const jokers = jokerSlots.getJokers();
      expect(jokers[0].getState().planetCardsUsed).toBe(5);
    });
  });

  describe('fortune_teller (占卜师)', () => {
    it('应该正确跟踪塔罗牌使用次数并计算倍率', () => {
      const fortuneTeller = new Joker({
        id: 'fortune_teller',
        name: '占卜师',
        description: '每张使用过的塔罗牌+1倍率',
        rarity: JokerRarity.COMMON,
        cost: 4,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: (context): { multBonus?: number; message?: string } => {
          const tarotCardsUsed = (context as unknown as { jokerState?: { tarotCardsUsed?: number } }).jokerState?.tarotCardsUsed || 0;
          return {
            multBonus: tarotCardsUsed,
            message: `占卜师: 已使用${tarotCardsUsed}张塔罗牌, +${tarotCardsUsed}倍率`
          };
        }
      });

      jokerSlots.addJoker(fortuneTeller);

      // 初始状态：未使用塔罗牌，倍率加成应为0
      const card = createTestCard(Suit.Hearts, Rank.Ace);
      const result1 = JokerSystem.processHandPlayed(jokerSlots, [card],
        PokerHandType.HighCard,
        100,
        1);
      expect(result1.multBonus).toBe(0);

      // 使用4张塔罗牌
      jokerSlots.updateTarotCardCount();
      jokerSlots.updateTarotCardCount();
      jokerSlots.updateTarotCardCount();
      jokerSlots.updateTarotCardCount();

      // 使用后：倍率加成应为4
      const result2 = JokerSystem.processHandPlayed(jokerSlots, [card],
        PokerHandType.HighCard,
        100,
        1);
      expect(result2.multBonus).toBe(4);
    });
  });

  describe('throwback (复古)', () => {
    it('应该正确跟踪跳过盲注次数并计算倍率', () => {
      const throwback = new Joker({
        id: 'throwback',
        name: '复古',
        description: '每跳过盲注x0.25倍率',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: (context): { multMultiplier?: number; message?: string } => {
          const blindsSkipped = (context as unknown as { jokerState?: { blindsSkipped?: number } }).jokerState?.blindsSkipped || 0;
          const multiplier = 1 + blindsSkipped * 0.25;
          return {
            multMultiplier: multiplier,
            message: `复古: 已跳过${blindsSkipped}个盲注, x${multiplier.toFixed(2)}倍率`
          };
        }
      });

      jokerSlots.addJoker(throwback);

      // 初始状态：未跳过盲注，倍率应为1.0
      const card = createTestCard(Suit.Hearts, Rank.Ace);
      const result1 = JokerSystem.processHandPlayed(jokerSlots, [card],
        PokerHandType.HighCard,
        100,
        1);
      expect(result1.multMultiplier).toBe(1);

      // 跳过2个盲注
      jokerSlots.updateBlindsSkipped();
      jokerSlots.updateBlindsSkipped();

      // 跳过后：倍率应为1.5 (1 + 2 * 0.25)
      const result2 = JokerSystem.processHandPlayed(jokerSlots, [card],
        PokerHandType.HighCard,
        100,
        1);
      expect(result2.multMultiplier).toBe(1.5);
    });
  });

  describe('runner (跑者)', () => {
    it('应该正确跟踪顺子出牌次数并提供永久加成', () => {
      const runner = new Joker({
        id: 'runner',
        name: '跑者',
        description: '+20筹码，顺子永久+10筹码',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: (context): { chipBonus?: number; stateUpdate?: { straightCount?: number }; message?: string } => {
          const straightTypes = [
            PokerHandType.Straight,
            PokerHandType.StraightFlush,
            PokerHandType.RoyalFlush
          ];
          const straightCount = (context as unknown as { jokerState?: { straightCount?: number } }).jokerState?.straightCount || 0;
          const permanentBonus = straightCount * 10;
          if (context.handType && straightTypes.includes(context.handType)) {
            return {
              chipBonus: 20 + permanentBonus,
              stateUpdate: { straightCount: straightCount + 1 },
              message: `跑者: +${20 + permanentBonus}筹码 (已打出${straightCount + 1}次顺子)`
            };
          }
          return {
            chipBonus: 20 + permanentBonus,
            message: `跑者: +${20 + permanentBonus}筹码 (已打出${straightCount}次顺子)`
          };
        }
      });

      jokerSlots.addJoker(runner);

      const cards = [
        createTestCard(Suit.Hearts, Rank.Five),
        createTestCard(Suit.Diamonds, Rank.Six),
        createTestCard(Suit.Clubs, Rank.Seven),
        createTestCard(Suit.Spades, Rank.Eight),
        createTestCard(Suit.Hearts, Rank.Nine)
      ];

      // 初始状态：未打出顺子，筹码应为20
      const result1 = JokerSystem.processHandPlayed(jokerSlots, cards,
        PokerHandType.Straight,
        100,
        1);
      expect(result1.chipBonus).toBe(20);

      // 检查状态已更新
      let jokers = jokerSlots.getJokers();
      expect(jokers[0].getState().straightCount).toBe(1);

      // 第二次打出顺子：筹码应为30 (20 + 1*10)
      const result2 = JokerSystem.processHandPlayed(jokerSlots, cards,
        PokerHandType.Straight,
        100,
        1);
      expect(result2.chipBonus).toBe(30);

      // 检查状态再次更新
      jokers = jokerSlots.getJokers();
      expect(jokers[0].getState().straightCount).toBe(2);

      // 第三次打出顺子：筹码应为40 (20 + 2*10)
      const result3 = JokerSystem.processHandPlayed(jokerSlots, cards,
        PokerHandType.Straight,
        100,
        1);
      expect(result3.chipBonus).toBe(40);
    });

    it('非顺子牌型也应该获得永久加成', () => {
      const runner = new Joker({
        id: 'runner',
        name: '跑者',
        description: '+20筹码，顺子永久+10筹码',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: (context): { chipBonus?: number; stateUpdate?: { straightCount?: number }; message?: string } => {
          const straightTypes = [
            PokerHandType.Straight,
            PokerHandType.StraightFlush,
            PokerHandType.RoyalFlush
          ];
          const straightCount = (context as unknown as { jokerState?: { straightCount?: number } }).jokerState?.straightCount || 0;
          const permanentBonus = straightCount * 10;
          if (context.handType && straightTypes.includes(context.handType)) {
            return {
              chipBonus: 20 + permanentBonus,
              stateUpdate: { straightCount: straightCount + 1 },
              message: `跑者: +${20 + permanentBonus}筹码 (已打出${straightCount + 1}次顺子)`
            };
          }
          return {
            chipBonus: 20 + permanentBonus,
            message: `跑者: +${20 + permanentBonus}筹码 (已打出${straightCount}次顺子)`
          };
        }
      });

      // 设置初始状态：已打出3次顺子
      runner.updateState({ straightCount: 3 });
      jokerSlots.addJoker(runner);

      // 打出高牌：应该获得50筹码 (20 + 3*10)
      const card = createTestCard(Suit.Hearts, Rank.Ace);
      const result = JokerSystem.processHandPlayed(jokerSlots, [card],
        PokerHandType.HighCard,
        100,
        1);
      expect(result.chipBonus).toBe(50);
    });
  });

  describe('状态持久化', () => {
    it('clone()应该正确复制状态', () => {
      const constellation = new Joker({
        id: 'constellation',
        name: '星座',
        description: '每使用一张行星牌x0.1倍率',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: () => ({})
      });

      // 设置状态
      constellation.updateState({ planetCardsUsed: 5 });

      // 克隆
      const cloned = constellation.clone();

      // 验证状态被复制
      expect(cloned.getState().planetCardsUsed).toBe(5);

      // 修改原对象状态不应影响克隆
      constellation.updateState({ planetCardsUsed: 10 });
      expect(cloned.getState().planetCardsUsed).toBe(5);
    });

    it('JokerSystem.getState()应该保存小丑牌状态', () => {
      const constellation = new Joker({
        id: 'constellation',
        name: '星座',
        description: '每使用一张行星牌x0.1倍率',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: () => ({})
      });

      jokerSlots.addJoker(constellation);
      jokerSlots.updatePlanetCardCount();
      jokerSlots.updatePlanetCardCount();

      const state = jokerSlots.getState();
      expect(state.jokers[0].getState().planetCardsUsed).toBe(2);
    });

    it('JokerSystem.restoreState()应该恢复小丑牌状态', () => {
      const constellation = new Joker({
        id: 'constellation',
        name: '星座',
        description: '每使用一张行星牌x0.1倍率',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: () => ({})
      });

      jokerSlots.addJoker(constellation);
      jokerSlots.updatePlanetCardCount();
      jokerSlots.updatePlanetCardCount();

      // 保存状态
      const savedState = jokerSlots.getState();

      // 创建新系统并恢复状态
      const newSystem = new JokerSlots(5);
      newSystem.restoreState(savedState);

      // 验证状态被恢复
      const jokers = newSystem.getJokers();
      expect(jokers[0].getState().planetCardsUsed).toBe(2);
    });
  });
});
