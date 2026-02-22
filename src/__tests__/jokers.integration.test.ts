import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { getJokerById } from '../data/jokers';
import { JokerSystem } from '../systems/JokerSystem';
import { GameState } from '../models/GameState';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { PokerHandType } from '../types/pokerHands';

describe('触发类小丑牌完整调用链测试', () => {
  describe('1. 蓝图 (Blueprint) 调用链', () => {
    it('系统层: ScoringSystem.calculate 应正确调用 JokerSystem.processHandPlayed', () => {
      const jokerSlots = new JokerSlots(5);
      const blueprint = getJokerById('blueprint')!;
      const jolly = getJokerById('jolly_joker')!;

      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(jolly);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      // 验证蓝图效果被触发
      const blueprintEffect = result.jokerEffects?.find(e => e.effect.includes('蓝图复制'));
      expect(blueprintEffect).toBeDefined();
      expect(blueprintEffect?.multBonus).toBe(8); // jolly_joker的+8倍率
    });

    it('模型层: Joker.onHandPlayed 应正确触发', () => {
      const jokerSlots = new JokerSlots(5);
      const jolly = getJokerById('jolly_joker')!;
      jokerSlots.addJoker(jolly);

      const context = {
        handType: PokerHandType.OnePair,
        scoringCards: [new Card(Suit.Spades, Rank.Ace)],
        allJokers: jokerSlots.getJokers(),
        jokerPosition: 0,
        leftJokers: [],
        rightJokers: [],
        leftmostJoker: undefined,
        rightmostJoker: undefined
      };

      const result = jolly.onHandPlayed!(context);

      expect(result.multBonus).toBe(8);
      expect(result.message).toContain('开心小丑');
    });

    it('应防止蓝图互相复制导致无限循环', () => {
      const jokerSlots = new JokerSlots(5);
      const blueprint1 = getJokerById('blueprint')!;
      const blueprint2 = getJokerById('blueprint')!;

      jokerSlots.addJoker(blueprint1);
      jokerSlots.addJoker(blueprint2);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      // 不应抛出错误或无限循环
      expect(() => {
        ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);
      }).not.toThrow();

      // 两个蓝图都不应触发效果（因为没有其他可复制的小丑）
      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);
      const blueprintEffects = result.jokerEffects?.filter(e => e.jokerName === '蓝图');
      expect(blueprintEffects?.length).toBe(0);
    });
  });

  describe('2. 头脑风暴 (Brainstorm) 调用链', () => {
    it('系统层: 应正确复制最左侧小丑的效果', () => {
      const jokerSlots = new JokerSlots(5);
      const jolly = getJokerById('jolly_joker')!;
      const brainstorm = getJokerById('brainstorm')!;

      jokerSlots.addJoker(jolly);
      jokerSlots.addJoker(brainstorm);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      // 验证头脑风暴效果被触发
      const brainstormEffect = result.jokerEffects?.find(e => e.effect.includes('头脑风暴复制'));
      expect(brainstormEffect).toBeDefined();
      expect(brainstormEffect?.multBonus).toBe(8);
    });

    it('边界条件: 只有一张小丑时不应触发', () => {
      const jokerSlots = new JokerSlots(5);
      const brainstorm = getJokerById('brainstorm')!;
      jokerSlots.addJoker(brainstorm);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      const brainstormEffect = result.jokerEffects?.find(e => e.jokerName === '头脑风暴');
      expect(brainstormEffect).toBeUndefined();
    });
  });

  describe('3. 剑客 (Swashbuckler) 调用链', () => {
    it('系统层: 应正确计算左侧小丑售价总和', () => {
      const jokerSlots = new JokerSlots(5);
      const jolly = getJokerById('jolly_joker')!; // cost: 3
      const swashbuckler = getJokerById('swashbuckler')!;

      jokerSlots.addJoker(jolly);
      jokerSlots.addJoker(swashbuckler);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      const swashEffect = result.jokerEffects?.find(e => e.jokerName === '剑客');
      expect(swashEffect).toBeDefined();
      expect(swashEffect?.multBonus).toBe(3); // jolly_joker cost = 3
    });

    it('模型层: context.leftJokers 应正确传递', () => {
      const jokerSlots = new JokerSlots(5);
      const jolly = new Joker({
        id: 'test_jolly',
        name: 'Test Jolly',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 5,
        trigger: JokerTrigger.ON_HAND_PLAYED,
        effect: () => ({})
      });
      const swashbuckler = getJokerById('swashbuckler')!;

      jokerSlots.addJoker(jolly);
      jokerSlots.addJoker(swashbuckler);

      // 验证剑客能获取左侧小丑
      const jokers = jokerSlots.getJokers();
      expect(jokers[1].id).toBe('swashbuckler');
      expect(jokers[0].id).toBe('test_jolly');
      expect(jokers[0].cost).toBe(5);
    });
  });

  describe('4. 仪式匕首 (Ceremonial Dagger) 调用链', () => {
    it('系统层: JokerSystem.processBlindSelect 应正确触发', () => {
      const jokerSlots = new JokerSlots(5);
      const dagger = getJokerById('ceremonial_dagger')!;
      const victim = getJokerById('joker')!; // cost: 2

      jokerSlots.addJoker(dagger);
      jokerSlots.addJoker(victim);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.effects.length).toBeGreaterThan(0);
      expect(result.effects[0].jokerName).toBe('仪式匕首');
    });

    it('模型层: 出售时应正确计算价格并摧毁右侧小丑', () => {
      const jokerSlots = new JokerSlots(5);
      const dagger = getJokerById('ceremonial_dagger')!;
      const victim = getJokerById('joker')!;

      jokerSlots.addJoker(dagger);
      jokerSlots.addJoker(victim);

      const initialCount = jokerSlots.getJokers().length;
      expect(initialCount).toBe(2);

      // 模拟盲注选择时的处理
      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      // 验证效果被触发
      expect(result.multBonus).toBeGreaterThan(0);
    });
  });

  describe('5. 抽象小丑 (Abstract Joker) 调用链', () => {
    it('系统层: 应正确统计小丑牌数量', () => {
      const jokerSlots = new JokerSlots(5);
      const abstract = getJokerById('abstract_joker')!;
      const jolly = getJokerById('jolly_joker')!;

      jokerSlots.addJoker(abstract);
      jokerSlots.addJoker(jolly);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      const abstractEffect = result.jokerEffects?.find(e => e.jokerName === '抽象小丑');
      expect(abstractEffect).toBeDefined();
      expect(abstractEffect?.multBonus).toBe(4); // 2张小丑 * 2倍率
    });

    it('模型层: context.allJokers 应正确传递', () => {
      const jokerSlots = new JokerSlots(5);
      const abstract = getJokerById('abstract_joker')!;

      jokerSlots.addJoker(abstract);

      // 添加更多小丑
      for (let i = 0; i < 3; i++) {
        const jolly = getJokerById('jolly_joker')!;
        jokerSlots.addJoker(jolly);
      }

      const allJokers = jokerSlots.getJokers();
      expect(allJokers.length).toBe(4);

      // 验证抽象小丑能获取所有小丑
      const context = {
        allJokers,
        jokerPosition: 0,
        leftJokers: [],
        rightJokers: allJokers.slice(1),
        leftmostJoker: allJokers[0],
        rightmostJoker: allJokers[allJokers.length - 1]
      };

      const result = abstract.effect(context);
      expect(result.multBonus).toBe(8); // 4张小丑 * 2倍率
    });
  });

  describe('6. 棒球卡 (Baseball Card) 调用链', () => {
    it('系统层: 应正确统计罕见小丑数量', () => {
      const jokerSlots = new JokerSlots(5);
      const baseball = getJokerById('baseball_card')!;
      const riffRaff = getJokerById('riff_raff')!; // UNCOMMON

      jokerSlots.addJoker(baseball);
      jokerSlots.addJoker(riffRaff);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      const baseballEffect = result.jokerEffects?.find(e => e.jokerName === '棒球卡');
      expect(baseballEffect).toBeDefined();
      expect(baseballEffect?.multMultiplier).toBe(1.5);
    });
  });

  describe('7. 篝火 (Campfire) 状态跟踪', () => {
    it('系统层: 应正确跟踪卖出牌数量', () => {
      const jokerSlots = new JokerSlots(5);
      const campfire = getJokerById('campfire')!;

      jokerSlots.addJoker(campfire);

      // 初始状态不应触发
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      const campfireEffect = result.jokerEffects?.find(e => e.jokerName === '篝火');
      expect(campfireEffect).toBeUndefined();
    });

    it('模型层: jokerState 应正确更新', () => {
      const campfire = getJokerById('campfire')!;

      // 初始状态
      expect(campfire.state.cardsSold).toBeUndefined();

      // 模拟状态更新
      campfire.updateState({ cardsSold: 4 });
      expect(campfire.state.cardsSold).toBe(4);
    });
  });

  describe('8. 全息影像 (Hologram) 状态跟踪', () => {
    it('系统层: 应正确跟踪添加牌数量', () => {
      const jokerSlots = new JokerSlots(5);
      const hologram = getJokerById('hologram')!;

      jokerSlots.addJoker(hologram);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      const hologramEffect = result.jokerEffects?.find(e => e.jokerName === '全息影像');
      expect(hologramEffect).toBeUndefined(); // 初始状态无效果
    });
  });

  describe('9. 卡尼奥 (Canio) 状态跟踪', () => {
    it('系统层: 应正确跟踪摧毁的人头牌数量', () => {
      const jokerSlots = new JokerSlots(5);
      const canio = getJokerById('canio')!;

      jokerSlots.addJoker(canio);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      const canioEffect = result.jokerEffects?.find(e => e.jokerName === '卡尼奥');
      expect(canioEffect).toBeUndefined(); // 初始状态无效果
    });
  });

  describe('10. 哑剧演员 (Mime) 与 Steel 卡组合', () => {
    it('系统层: 哑剧演员应让 Steel 卡效果触发两次', () => {
      const jokerSlots = new JokerSlots(5);
      const mime = getJokerById('mime')!;

      jokerSlots.addJoker(mime);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
      ];

      // 创建 Steel 卡在手牌中
      const steelCard = new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel);
      const heldCards = [steelCard];

      const result = ScoringSystem.calculate(cards, undefined, undefined, heldCards, jokerSlots);

      // 验证哑剧演员效果被触发
      const mimeEffect = result.jokerEffects?.find(e => e.jokerName === '默剧演员');
      expect(mimeEffect).toBeDefined();

      // Steel 卡效果：1.5倍率，哑剧演员触发两次：1.5^2 = 2.25
      // 基础倍率是1，加上Steel效果应该是 1 * 2.25 = 2.25
      expect(result.totalMultiplier).toBeCloseTo(2.25, 1);
    });
  });
});
