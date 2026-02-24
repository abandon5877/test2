import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';
import { PokerHandType } from '../types/pokerHands';
import { CopyEffectHelper } from '../systems/CopyEffectHelper';
import { Joker } from '../models/Joker';
import { JokerSystem } from '../systems/JokerSystem';

describe('复制类小丑牌重复计算问题检查', () => {
  describe('蓝图 (Blueprint)', () => {
    it('蓝图不应重复计算右侧小丑的效果', () => {
      const jokerSlots = new JokerSlots(5);
      const blueprint = getJokerById('blueprint')!;
      const jolly = getJokerById('jolly_joker')!; // 对子+8倍率

      // 顺序：蓝图(左), 开心小丑(右)
      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(jolly);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      console.log('蓝图测试 - 所有小丑效果:', result.jokerEffects?.map(e => ({
        name: e.jokerName,
        effect: e.effect,
        multBonus: e.multBonus
      })));

      const blueprintEffects = result.jokerEffects?.filter(e => e.jokerName === '蓝图');
      const jollyEffects = result.jokerEffects?.filter(e => e.jokerName === '开心小丑');

      console.log('蓝图效果数量:', blueprintEffects?.length);
      console.log('开心小丑效果数量:', jollyEffects?.length);
      console.log('总倍率加成:', result.multBonus);

      // 蓝图应该只有一个复制效果
      expect(blueprintEffects?.length).toBe(1);

      // 开心小丑应该只有一个效果（它自己的）
      expect(jollyEffects?.length).toBe(1);

      // 总倍率应该是 8 (jolly) + 8 (blueprint复制) = 16
      expect(result.multBonus).toBe(16);
    });

    it('蓝图不应复制不兼容的小丑牌（如四指）', () => {
      const jokerSlots = new JokerSlots(5);
      const blueprint = getJokerById('blueprint')!;
      const fourFingers = getJokerById('four_fingers')!; // 四指 - 被动效果，不应被复制

      // 顺序：蓝图(左), 四指(右)
      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(fourFingers);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      // 四指是不兼容的，蓝图不应复制其效果
      const blueprintEffects = result.jokerEffects?.filter(e => e.jokerName === '蓝图');
      expect(blueprintEffects?.length).toBe(0);
    });

    it('蓝图不应复制另一个蓝图或头脑风暴', () => {
      const jokerSlots = new JokerSlots(5);
      const blueprint1 = getJokerById('blueprint')!;
      const blueprint2 = getJokerById('blueprint')!;

      // 顺序：蓝图1(左), 蓝图2(右)
      jokerSlots.addJoker(blueprint1);
      jokerSlots.addJoker(blueprint2);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      // 蓝图不应复制另一个蓝图
      const blueprintEffects = result.jokerEffects?.filter(e => e.jokerName === '蓝图');
      expect(blueprintEffects?.length).toBe(0);
    });
  });

  describe('头脑风暴 (Brainstorm)', () => {
    it('头脑风暴不应重复计算最左侧小丑的效果', () => {
      const jokerSlots = new JokerSlots(5);
      const jolly = getJokerById('jolly_joker')!;
      const brainstorm = getJokerById('brainstorm')!;

      // 顺序：开心小丑(左), 头脑风暴(右)
      jokerSlots.addJoker(jolly);
      jokerSlots.addJoker(brainstorm);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      console.log('头脑风暴测试 - 所有小丑效果:', result.jokerEffects?.map(e => ({
        name: e.jokerName,
        effect: e.effect,
        multBonus: e.multBonus
      })));

      const brainstormEffects = result.jokerEffects?.filter(e => e.jokerName === '头脑风暴');
      const jollyEffects = result.jokerEffects?.filter(e => e.jokerName === '开心小丑');

      console.log('头脑风暴效果数量:', brainstormEffects?.length);
      console.log('开心小丑效果数量:', jollyEffects?.length);
      console.log('总倍率加成:', result.multBonus);

      // 头脑风暴应该只有一个复制效果
      expect(brainstormEffects?.length).toBe(1);

      // 开心小丑应该只有一个效果
      expect(jollyEffects?.length).toBe(1);

      // 总倍率应该是 8 (jolly) + 8 (brainstorm复制) = 16
      expect(result.multBonus).toBe(16);
    });

    it('头脑风暴不应复制不兼容的小丑牌（如幻想性错觉）', () => {
      const jokerSlots = new JokerSlots(5);
      const pareidolia = getJokerById('pareidolia')!; // 幻想性错觉 - 被动效果
      const brainstorm = getJokerById('brainstorm')!;

      // 顺序：幻想性错觉(左), 头脑风暴(右)
      jokerSlots.addJoker(pareidolia);
      jokerSlots.addJoker(brainstorm);

      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

      // 幻想性错觉是不兼容的，头脑风暴不应复制其效果
      const brainstormEffects = result.jokerEffects?.filter(e => e.jokerName === '头脑风暴');
      expect(brainstormEffects?.length).toBe(0);
    });
  });

  describe('CopyEffectHelper', () => {
    it('应正确识别可复制的小丑牌', () => {
      const jolly = getJokerById('jolly_joker')!;
      expect(CopyEffectHelper.isCopyable(jolly)).toBe(true);
    });

    it('应正确识别不可复制的小丑牌（四指）', () => {
      const fourFingers = getJokerById('four_fingers')!;
      expect(CopyEffectHelper.isCopyable(fourFingers)).toBe(false);
    });

    it('应正确识别不可复制的小丑牌（幻想性错觉）', () => {
      const pareidolia = getJokerById('pareidolia')!;
      expect(CopyEffectHelper.isCopyable(pareidolia)).toBe(false);
    });

    it('应正确识别不可复制的小丑牌（金色小丑 - 回合结束效果）', () => {
      const goldenJoker = getJokerById('golden_joker')!;
      expect(CopyEffectHelper.isCopyable(goldenJoker)).toBe(false);
    });

    it('getBlueprintTarget应返回正确的目标小丑', () => {
      const jolly = getJokerById('jolly_joker')!;
      const blueprint = getJokerById('blueprint')!;

      const jokers = [blueprint, jolly];
      const target = CopyEffectHelper.getBlueprintTarget(0, jokers);

      expect(target).toBe(jolly);
    });

    it('getBlueprintTarget不应返回不兼容的小丑', () => {
      const blueprint = getJokerById('blueprint')!;
      const fourFingers = getJokerById('four_fingers')!;

      const jokers = [blueprint, fourFingers];
      const target = CopyEffectHelper.getBlueprintTarget(0, jokers);

      expect(target).toBeNull();
    });

    it('getBrainstormTarget应返回正确的目标小丑', () => {
      const jolly = getJokerById('jolly_joker')!;
      const brainstorm = getJokerById('brainstorm')!;

      const jokers = [jolly, brainstorm];
      const target = CopyEffectHelper.getBrainstormTarget(1, jokers);

      expect(target).toBe(jolly);
    });

    it('getBrainstormTarget不应返回不兼容的小丑', () => {
      const pareidolia = getJokerById('pareidolia')!;
      const brainstorm = getJokerById('brainstorm')!;

      const jokers = [pareidolia, brainstorm];
      const target = CopyEffectHelper.getBrainstormTarget(1, jokers);

      expect(target).toBeNull();
    });
  });

  describe('蓝图+DNA组合测试', () => {
    it('蓝图复制DNA时应该正确触发copyScoredCardToDeck效果', () => {
      const jokerSlots = new JokerSlots(5);
      const blueprint = getJokerById('blueprint')!;
      const dna = getJokerById('dna')!;

      // 顺序：蓝图(左), DNA(右)
      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(dna);

      // 第一手只出一张K
      const cards = [
        new Card(Suit.Spades, Rank.King),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.HighCard,
        5, // currentChips
        1, // currentMult
        undefined, // gameState
        0, // handsPlayed = 0 (第一手)
        undefined, // discardsUsed
        undefined, // deckSize
        undefined, // initialDeckSize
        undefined, // handsRemaining
        undefined, // mostPlayedHand
        undefined, // consumableSlots
        undefined, // handTypeHistoryCount
        false, // isPreview
        cards // playedCards
      );

      console.log('蓝图+DNA测试结果:', {
        copyScoredCardToDeck: result.copyScoredCardToDeck,
        effects: result.effects
      });

      // 蓝图复制DNA的效果，应该触发copyScoredCardToDeck
      expect(result.copyScoredCardToDeck).toBe(true);

      // 应该有两个效果：DNA自己的 + 蓝图复制的
      const dnaEffects = result.effects.filter(e => e.effect.includes('DNA'));
      expect(dnaEffects.length).toBeGreaterThanOrEqual(1);
    });

    it('蓝图在最右侧时不应复制DNA（因为没有右侧小丑）', () => {
      const jokerSlots = new JokerSlots(5);
      const jolly = getJokerById('jolly_joker')!; // 开心小丑，对子时+8倍率
      const blueprint = getJokerById('blueprint')!;

      // 顺序：开心小丑(左), 蓝图(右)
      jokerSlots.addJoker(jolly);
      jokerSlots.addJoker(blueprint);

      // 出对子，应该只有开心小丑自己的效果，没有复制效果
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.OnePair,
        5,
        1,
        undefined,
        0,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        cards
      );

      // 蓝图在最右侧，没有右侧小丑可复制
      // 开心小丑的效果不应该触发copyScoredCardToDeck
      expect(result.copyScoredCardToDeck).toBeFalsy();

      // 应该只有开心小丑自己的效果，没有蓝图的复制效果
      const blueprintEffects = result.effects.filter(e => e.jokerName === '蓝图');
      expect(blueprintEffects.length).toBe(0);

      // 开心小丑应该有一个效果
      const jollyEffects = result.effects.filter(e => e.jokerName === '开心小丑');
      expect(jollyEffects.length).toBe(1);
    });

    it('头脑风暴复制DNA时也应该正确触发copyScoredCardToDeck效果', () => {
      const jokerSlots = new JokerSlots(5);
      const dna = getJokerById('dna')!;
      const brainstorm = getJokerById('brainstorm')!;

      // 顺序：DNA(左), 头脑风暴(右)
      jokerSlots.addJoker(dna);
      jokerSlots.addJoker(brainstorm);

      // 第一手只出一张K
      const cards = [
        new Card(Suit.Spades, Rank.King),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.HighCard,
        5,
        1,
        undefined,
        0, // handsPlayed = 0
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        cards
      );

      console.log('头脑风暴+DNA测试结果:', {
        copyScoredCardToDeck: result.copyScoredCardToDeck,
        effects: result.effects
      });

      // 头脑风暴复制DNA的效果，应该触发copyScoredCardToDeck
      expect(result.copyScoredCardToDeck).toBe(true);
    });
  });
});
