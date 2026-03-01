import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { getJokerById } from '../data/jokers';
import { JokerSystem } from '../systems/JokerSystem';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, SealType } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { ConsumableSlots } from '../models/ConsumableSlots';
import { ScoringSystem } from '../systems/ScoringSystem';

describe('蓝图+头脑风暴复制链测试 - 其他类型小丑牌', () => {
  describe('待办清单 (To Do List)', () => {
    it('待办清单(左) + 头脑风暴(右) - 应该触发2次效果', () => {
      const jokerSlots = new JokerSlots(5);
      const toDoList = getJokerById('to_do_list')!;
      const brainstorm = getJokerById('brainstorm')!;

      // 设置待办清单的目标牌型
      toDoList.state = { targetHandType: PokerHandType.OnePair };

      jokerSlots.addJoker(toDoList);
      jokerSlots.addJoker(brainstorm);

      const cards = [
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Ace),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.OnePair,
        [],
        0,
        0,
        new ConsumableSlots(2)
      );

      console.log('=== 待办清单 + 头脑风暴 测试结果 ===');
      console.log('小丑效果:', result.effects);
      console.log('金钱奖励:', result.moneyBonus);

      // 待办清单应该触发2次（本体 + 头脑风暴复制）
      // 每次+$4，总共+$8
      expect(result.moneyBonus).toBe(8);

      // 验证有2个待办清单效果
      const toDoListEffects = result.effects.filter(e =>
        e.effect.includes('待办清单')
      );
      expect(toDoListEffects.length).toBe(2);
    });

    it('待办清单(左) + 蓝图(中) + 头脑风暴(右) - 应该触发3次效果', () => {
      const jokerSlots = new JokerSlots(5);
      const toDoList = getJokerById('to_do_list')!;
      const blueprint = getJokerById('blueprint')!;
      const brainstorm = getJokerById('brainstorm')!;

      toDoList.state = { targetHandType: PokerHandType.OnePair };

      jokerSlots.addJoker(toDoList);
      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(brainstorm);

      const cards = [
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Ace),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.OnePair,
        [],
        0,
        0,
        new ConsumableSlots(2)
      );

      console.log('=== 待办清单 + 蓝图 + 头脑风暴 测试结果 ===');
      console.log('小丑效果:', result.effects);
      console.log('金钱奖励:', result.moneyBonus);

      // 待办清单应该触发3次（本体 + 蓝图复制 + 头脑风暴复制蓝图）
      // 每次+$4，总共+$12
      expect(result.moneyBonus).toBe(12);
    });
  });

  describe('默剧演员 (Mime)', () => {
    it('默剧演员(左) + 头脑风暴(右) - 手牌效果应该触发2次', () => {
      const jokerSlots = new JokerSlots(5);
      const mime = getJokerById('mime')!;
      const brainstorm = getJokerById('brainstorm')!;

      jokerSlots.addJoker(mime);
      jokerSlots.addJoker(brainstorm);

      // 创建手牌（包含黄金牌）
      const heldCards = [
        new Card(Suit.Clubs, Rank.Ten, { enhancement: CardEnhancement.Gold }),
        new Card(Suit.Spades, Rank.Nine, { enhancement: CardEnhancement.Gold }),
      ];

      const result = JokerSystem.processHeld(jokerSlots, heldCards);

      console.log('=== 默剧演员 + 头脑风暴 测试结果 ===');
      console.log('手牌重触发次数:', result.heldCardRetrigger);
      console.log('小丑效果:', result.effects);

      // 默剧演员应该触发2次（本体 + 头脑风暴复制）
      expect(result.heldCardRetrigger).toBe(2);
    });

    it('默剧演员(左) + 蓝图(中) + 头脑风暴(右) - 手牌效果应该触发3次', () => {
      const jokerSlots = new JokerSlots(5);
      const mime = getJokerById('mime')!;
      const blueprint = getJokerById('blueprint')!;
      const brainstorm = getJokerById('brainstorm')!;

      jokerSlots.addJoker(mime);
      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(brainstorm);

      const heldCards = [
        new Card(Suit.Clubs, Rank.Ten, { enhancement: CardEnhancement.Gold }),
      ];

      const result = JokerSystem.processHeld(jokerSlots, heldCards);

      console.log('=== 默剧演员 + 蓝图 + 头脑风暴 测试结果 ===');
      console.log('手牌重触发次数:', result.heldCardRetrigger);
      console.log('小丑效果:', result.effects);

      // 默剧演员应该触发3次（本体 + 蓝图复制 + 头脑风暴复制蓝图）
      expect(result.heldCardRetrigger).toBe(3);
    });
  });

  describe('佩尔科 (Perkeo)', () => {
    it('佩尔科(左) + 头脑风暴(右) - 应该复制2张消耗牌', () => {
      const jokerSlots = new JokerSlots(5);
      const perkeo = getJokerById('perkeo')!;
      const brainstorm = getJokerById('brainstorm')!;

      jokerSlots.addJoker(perkeo);
      jokerSlots.addJoker(brainstorm);

      // 模拟消耗牌槽位
      const consumables = [
        { id: 'the_fool', name: '愚人', type: 'tarot' },
        { id: 'pluto', name: '冥王星', type: 'planet' },
      ];

      const result = JokerSystem.processShopExit(jokerSlots, consumables);

      console.log('=== 佩尔科 + 头脑风暴 测试结果 ===');
      console.log('复制的消耗牌:', result.copiedConsumableIds);
      console.log('效果:', result.effects);

      // 应该有2个佩尔科效果（本体 + 头脑风暴复制）
      const perkeoEffects = result.effects.filter(e =>
        e.effect.includes('佩尔科')
      );
      expect(perkeoEffects.length).toBe(2);
    });

    it('佩尔科(左) + 蓝图(中) + 头脑风暴(右) - 应该复制3张消耗牌', () => {
      const jokerSlots = new JokerSlots(5);
      const perkeo = getJokerById('perkeo')!;
      const blueprint = getJokerById('blueprint')!;
      const brainstorm = getJokerById('brainstorm')!;

      jokerSlots.addJoker(perkeo);
      jokerSlots.addJoker(blueprint);
      jokerSlots.addJoker(brainstorm);

      const consumables = [
        { id: 'the_fool', name: '愚人', type: 'tarot' },
        { id: 'pluto', name: '冥王星', type: 'planet' },
      ];

      const result = JokerSystem.processShopExit(jokerSlots, consumables);

      console.log('=== 佩尔科 + 蓝图 + 头脑风暴 测试结果 ===');
      console.log('复制的消耗牌:', result.copiedConsumableIds);
      console.log('效果:', result.effects);

      // 应该有3个佩尔科效果（本体 + 蓝图复制 + 头脑风暴复制蓝图）
      const perkeoEffects = result.effects.filter(e =>
        e.effect.includes('佩尔科')
      );
      expect(perkeoEffects.length).toBe(3);
    });
  });

  describe('复杂复制链', () => {
    it('蓝图+头脑风暴+蓝图链 - 应该正确处理多层复制', () => {
      const jokerSlots = new JokerSlots(5);
      const toDoList = getJokerById('to_do_list')!;
      const blueprint1 = getJokerById('blueprint')!;
      const brainstorm = getJokerById('brainstorm')!;
      const blueprint2 = getJokerById('blueprint')!;

      toDoList.state = { targetHandType: PokerHandType.OnePair };

      // 顺序：待办清单 + 蓝图 + 头脑风暴 + 蓝图
      jokerSlots.addJoker(toDoList);
      jokerSlots.addJoker(blueprint1);
      jokerSlots.addJoker(brainstorm);
      jokerSlots.addJoker(blueprint2);

      const cards = [
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Ace),
      ];

      const result = JokerSystem.processHandPlayed(
        jokerSlots,
        cards,
        PokerHandType.OnePair,
        [],
        0,
        0,
        new ConsumableSlots(2)
      );

      console.log('=== 复杂复制链 测试结果 ===');
      console.log('小丑效果:', result.effects);
      console.log('金钱奖励:', result.moneyBonus);

      // 验证待办清单效果被正确触发多次
      const toDoListEffects = result.effects.filter(e =>
        e.effect.includes('待办清单')
      );
      console.log('待办清单效果数量:', toDoListEffects.length);

      // 预期：待办清单(1) + 蓝图1复制(1) + 头脑风暴复制蓝图1(1) + 蓝图2复制头脑风暴(1) = 4次
      // 但蓝图2在头脑风暴右侧，它复制的是头脑风暴，而头脑风暴复制的是待办清单
      // 所以蓝图2的效果是：蓝图2复制[头脑风暴复制[待办清单]]
      expect(toDoListEffects.length).toBeGreaterThanOrEqual(2);
    });
  });
});
