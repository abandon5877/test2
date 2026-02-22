import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';
import { JokerSystem } from '../systems/JokerSystem';

describe('触发类小丑牌功能检查', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('1. 复制型小丑牌', () => {
    describe('蓝图 (Blueprint)', () => {
      it('应复制右侧小丑牌的 onHandPlayed 效果', () => {
        const blueprint = getJokerById('blueprint')!;
        const jolly = getJokerById('jolly_joker')!; // 对子+8倍率

        jokerSlots.addJoker(blueprint);
        jokerSlots.addJoker(jolly);

        // 打出对子
        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.Ace),
          new Card(Suit.Diamonds, Rank.King),
          new Card(Suit.Clubs, Rank.Queen),
          new Card(Suit.Spades, Rank.Jack)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        // 检查蓝图是否复制了开心小丑的效果
        const blueprintEffect = result.jokerEffects!.find(e => e.jokerName === '蓝图');
        expect(blueprintEffect).toBeDefined();
        expect(blueprintEffect!.effect).toContain('蓝图复制');
        expect(blueprintEffect!.multBonus).toBe(8);
      });

      it('右侧无小丑时不应触发', () => {
        const blueprint = getJokerById('blueprint')!;
        jokerSlots.addJoker(blueprint);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const blueprintEffect = result.jokerEffects!.find(e => e.jokerName === '蓝图');
        expect(blueprintEffect).toBeUndefined();
      });

      it('不应复制另一个蓝图（防止无限循环）', () => {
        const blueprint1 = getJokerById('blueprint')!;
        const blueprint2 = getJokerById('blueprint')!;

        jokerSlots.addJoker(blueprint1);
        jokerSlots.addJoker(blueprint2);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        // 不应抛出错误或无限循环
        expect(() => {
          ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);
        }).not.toThrow();
      });
    });

    describe('头脑风暴 (Brainstorm)', () => {
      it('应复制最左侧小丑牌的 onHandPlayed 效果', () => {
        const jolly = getJokerById('jolly_joker')!; // 对子+8倍率
        const brainstorm = getJokerById('brainstorm')!;

        jokerSlots.addJoker(jolly);
        jokerSlots.addJoker(brainstorm);

        // 打出对子
        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.Ace),
          new Card(Suit.Diamonds, Rank.King),
          new Card(Suit.Clubs, Rank.Queen),
          new Card(Suit.Spades, Rank.Jack)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        // 检查头脑风暴是否复制了开心小丑的效果
        const brainstormEffect = result.jokerEffects!.find(e => e.jokerName === '头脑风暴');
        expect(brainstormEffect).toBeDefined();
        expect(brainstormEffect!.effect).toContain('头脑风暴复制');
        expect(brainstormEffect!.multBonus).toBe(8);
      });

      it('只有一张小丑牌时不应触发', () => {
        const brainstorm = getJokerById('brainstorm')!;
        jokerSlots.addJoker(brainstorm);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const brainstormEffect = result.jokerEffects!.find(e => e.jokerName === '头脑风暴');
        expect(brainstormEffect).toBeUndefined();
      });
    });
  });

  describe('2. 位置依赖型小丑牌', () => {
    describe('剑客 (Swashbuckler)', () => {
      it('应将左侧小丑牌售价加到倍率', () => {
        const jolly = getJokerById('jolly_joker')!; // cost: 3
        const swashbuckler = getJokerById('swashbuckler')!;

        jokerSlots.addJoker(jolly);
        jokerSlots.addJoker(swashbuckler);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const swashEffect = result.jokerEffects!.find(e => e.jokerName === '剑客');
        expect(swashEffect).toBeDefined();
        expect(swashEffect!.multBonus).toBe(3); // jolly_joker cost = 3
      });

      it('左侧无小丑时不应触发', () => {
        const swashbuckler = getJokerById('swashbuckler')!;
        jokerSlots.addJoker(swashbuckler);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const swashEffect = result.jokerEffects!.find(e => e.jokerName === '剑客');
        expect(swashEffect).toBeUndefined();
      });
    });

    describe('仪式匕首 (Ceremonial Dagger)', () => {
      it('选盲注时应摧毁右侧小丑并加双倍售价到倍率', () => {
        const dagger = getJokerById('ceremonial_dagger')!;
        const victim = getJokerById('joker')!; // cost: 2

        jokerSlots.addJoker(dagger);
        jokerSlots.addJoker(victim);

        const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

        expect(result.multBonus).toBeGreaterThan(0);
        expect(result.effects).toHaveLength(1);
        expect(result.effects[0].jokerName).toBe('仪式匕首');
      });

      it('右侧无小丑时不应触发', () => {
        const dagger = getJokerById('ceremonial_dagger')!;
        jokerSlots.addJoker(dagger);

        const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

        expect(result.multBonus).toBe(0);
      });
    });
  });

  describe('3. 全局统计型小丑牌', () => {
    describe('抽象小丑 (Abstract Joker)', () => {
      it('应正确统计小丑牌数量并计算倍率', () => {
        const abstract = getJokerById('abstract_joker')!;
        const jolly = getJokerById('jolly_joker')!;

        jokerSlots.addJoker(abstract);
        jokerSlots.addJoker(jolly);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const abstractEffect = result.jokerEffects!.find(e => e.jokerName === '抽象小丑');
        expect(abstractEffect).toBeDefined();
        expect(abstractEffect!.multBonus).toBe(4); // 2张小丑 * 2倍率
      });
    });

    describe('棒球卡 (Baseball Card)', () => {
      it('应正确统计罕见小丑数量', () => {
        const baseball = getJokerById('baseball_card')!;
        // 添加一个罕见小丑
        const riffRaff = getJokerById('riff_raff')!; // UNCOMMON

        jokerSlots.addJoker(baseball);
        jokerSlots.addJoker(riffRaff);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const baseballEffect = result.jokerEffects!.find(e => e.jokerName === '棒球卡');
        expect(baseballEffect).toBeDefined();
        expect(baseballEffect!.multMultiplier).toBe(1.5);
      });
    });
  });

  describe('4. 状态跟踪型小丑牌', () => {
    describe('全息影像 (Hologram)', () => {
      it('初始状态不应触发', () => {
        const hologram = getJokerById('hologram')!;
        jokerSlots.addJoker(hologram);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const hologramEffect = result.jokerEffects!.find(e => e.jokerName === '全息影像');
        expect(hologramEffect).toBeUndefined();
      });
    });

    describe('篝火 (Campfire)', () => {
      it('初始状态不应触发', () => {
        const campfire = getJokerById('campfire')!;
        jokerSlots.addJoker(campfire);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const campfireEffect = result.jokerEffects!.find(e => e.jokerName === '篝火');
        expect(campfireEffect).toBeUndefined();
      });
    });

    describe('卡尼奥 (Canio)', () => {
      it('初始状态不应触发', () => {
        const canio = getJokerById('canio')!;
        jokerSlots.addJoker(canio);

        const cards = [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King)
        ];

        const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

        const canioEffect = result.jokerEffects!.find(e => e.jokerName === '卡尼奥');
        expect(canioEffect).toBeUndefined();
      });
    });
  });
});
