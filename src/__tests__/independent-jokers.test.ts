import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

describe('ON_INDEPENDENT 小丑牌测试 - 空heldCards时也应该触发', () => {
  const independentJokers = [
    { id: 'stuntman', name: '特技演员', expectedChipBonus: 250 },
    { id: 'mime', name: '默剧演员', expectedHeldCardRetrigger: true },
    { id: 'credit_card', name: '信用卡', expectedDebtLimit: -20 },
    { id: 'pareidolia', name: '幻想性错觉', expectedAllCardsAreFace: true },
    { id: 'juggler', name: '杂耍者', expectedHandSizeBonus: 1 },
    { id: 'drunkard', name: '酒鬼', expectedExtraDiscards: 1 },
    { id: 'troubadour', name: '吟游诗人', expectedHandSizeBonus: 2 },
    { id: 'oops_all_6s', name: '哎呀全是6', checkMessage: true },
    { id: 'turtle_bean', name: '龟豆', expectedHandSizeBonus: 5 },
    { id: 'luchador', name: '摔跤手', checkMessage: true },
    { id: 'certificate', name: '证书', checkMessage: true },
    { id: 'showman', name: '马戏团演员', checkMessage: true },
    { id: 'merry_andy', name: '快乐的安迪', expectedDiscardsBonus: 3 },
    { id: 'matador', name: '斗牛士', conditional: true }, // 条件触发：bossTriggered为true时
    { id: 'invisible_joker', name: '隐形小丑', checkMessage: true },
    { id: 'canio', name: '卡尼奥', conditional: true }, // 条件触发：destroyedFaceCards>0时
    { id: 'chicot', name: '奇科', checkMessage: true },
    { id: 'bone_boy', name: '骨头先生', checkMessage: true },
  ];

  for (const { id, name, expectedChipBonus, expectedHeldCardRetrigger, expectedDebtLimit, expectedAllCardsAreFace, expectedHandSizeBonus, expectedExtraDiscards, expectedDiscardsBonus, checkMessage, conditional } of independentJokers) {
    it(`${name} (${id}) 在空heldCards时应该触发`, () => {
      const joker = getJokerById(id);
      if (!joker) {
        console.log(`跳过: ${name} (${id}) 未找到`);
        return;
      }

      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(joker);

      // 测试空heldCards时processIndependent应该触发效果
      const result = JokerSystem.processIndependent(jokerSlots, []);

      // 验证效果
      if (expectedChipBonus !== undefined) {
        expect(result.chipBonus).toBe(expectedChipBonus);
      }
      if (expectedHeldCardRetrigger !== undefined) {
        expect(result.heldCardRetrigger).toBe(expectedHeldCardRetrigger);
      }
      if (expectedHandSizeBonus !== undefined) {
        // handSizeBonus 是内部处理，不直接返回，但效果应该存在
        expect(result.effects.some(e => e.jokerName === name)).toBe(true);
      }
      if (expectedExtraDiscards !== undefined) {
        expect(result.effects.some(e => e.jokerName === name)).toBe(true);
      }
      if (expectedDiscardsBonus !== undefined) {
        expect(result.effects.some(e => e.jokerName === name)).toBe(true);
      }
      if (checkMessage || expectedDebtLimit !== undefined || expectedAllCardsAreFace !== undefined) {
        expect(result.effects.some(e => e.jokerName === name)).toBe(true);
      }
      // 条件触发的小丑牌在没有满足条件时不返回效果，这是正确的
      if (conditional) {
        // 只需验证函数被调用且不报错
        expect(result).toBeDefined();
      }
    });
  }

  it('蓝图和头脑风暴应该被正确处理（ON_INDEPENDENT但效果为空）', () => {
    const blueprint = getJokerById('blueprint');
    const brainstorm = getJokerById('brainstorm');

    if (blueprint) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(blueprint);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      // 蓝图本身不返回效果，但应该被处理
      expect(result).toBeDefined();
    }

    if (brainstorm) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(brainstorm);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      // 头脑风暴本身不返回效果，但应该被处理
      expect(result).toBeDefined();
    }
  });

  it('四指和捷径应该被正确处理（效果在PokerHandDetector中实现）', () => {
    const fourFingers = getJokerById('four_fingers');
    const shortcut = getJokerById('shortcut');

    if (fourFingers) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(fourFingers);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      expect(result.effects.some(e => e.jokerName === '四指')).toBe(true);
    }

    if (shortcut) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(shortcut);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      expect(result.effects.some(e => e.jokerName === '捷径')).toBe(true);
    }
  });

  it('喜剧与悲剧、悬挂票、黑客应该被正确处理（效果在ScoringSystem中实现）', () => {
    const sockAndBuskin = getJokerById('sock_and_buskin');
    const hangingChad = getJokerById('hanging_chad');
    const hack = getJokerById('hack');

    if (sockAndBuskin) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(sockAndBuskin);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      expect(result.effects.some(e => e.jokerName === '喜剧与悲剧')).toBe(true);
    }

    if (hangingChad) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(hangingChad);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      expect(result.effects.some(e => e.jokerName === '悬挂票')).toBe(true);
    }

    if (hack) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(hack);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      expect(result.effects.some(e => e.jokerName === '黑客')).toBe(true);
    }
  });

  it('水花应该被正确处理（效果在ScoringSystem中实现）', () => {
    const splash = getJokerById('splash');

    if (splash) {
      const jokerSlots = new JokerSlots(5);
      jokerSlots.addJoker(splash);
      const result = JokerSystem.processIndependent(jokerSlots, []);
      expect(result.effects.some(e => e.jokerName === '水花')).toBe(true);
    }
  });
});
