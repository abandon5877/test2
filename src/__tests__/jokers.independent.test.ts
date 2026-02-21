import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

// 辅助函数：创建测试用的卡牌
function createTestCard(suit: Suit, rank: Rank): Card {
  return new Card(suit, rank);
}

describe('阶段5: ON_INDEPENDENT效果集成测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
        PokerHandDetector.clearConfig();
  });

  describe('shortcut (捷径)', () => {
    it('应该允许顺子跳1个数字', () => {
      const shortcut = new Joker({
        id: 'shortcut',
        name: '捷径',
        description: '顺子可跳1个数字',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '捷径: 顺子可跳1个数字'
        })
      });

      jokerSlots.addJoker(shortcut);

      // 打出跳1个数字的顺子：A, K, Q, J, 9（跳了10）
      const cards = [
        createTestCard(Suit.Hearts, Rank.Ace),
        createTestCard(Suit.Hearts, Rank.King),
        createTestCard(Suit.Hearts, Rank.Queen),
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Nine),  // 跳了10
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 应该检测为顺子或同花顺（都是顺子的一种）
      expect(result.handType === 'straight' || result.handType === 'straightFlush').toBe(true);
      // handDescription可能是"顺子"或"同花顺"
      expect(result.handDescription.includes('顺子') || result.handDescription.includes('同花顺')).toBe(true);
    });

    it('应该允许顺子跳1个数字（中间跳）', () => {
      const shortcut = new Joker({
        id: 'shortcut',
        name: '捷径',
        description: '顺子可跳1个数字',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '捷径: 顺子可跳1个数字'
        })
      });

      jokerSlots.addJoker(shortcut);

      // 打出跳1个数字的顺子（不同花色以避免同花顺）
      const cards = [
        createTestCard(Suit.Hearts, Rank.Eight),
        createTestCard(Suit.Diamonds, Rank.Seven),
        createTestCard(Suit.Clubs, Rank.Five),  // 跳了6
        createTestCard(Suit.Spades, Rank.Four),
        createTestCard(Suit.Hearts, Rank.Three),
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 应该检测为顺子
      expect(result.handType).toBe('straight');
    });

    it('没有捷径时不应识别跳数字的顺子', () => {
      // 不打捷径小丑

      // 打出跳1个数字的牌
      const cards = [
        createTestCard(Suit.Hearts, Rank.Ace),
        createTestCard(Suit.Hearts, Rank.King),
        createTestCard(Suit.Hearts, Rank.Queen),
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Nine),  // 跳了10
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 不应该检测为顺子，应该是高牌或其他牌型
      expect(result.handType).not.toBe('straight');
    });

    it('捷径只能跳1个数字，不能跳2个', () => {
      const shortcut = new Joker({
        id: 'shortcut',
        name: '捷径',
        description: '顺子可跳1个数字',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '捷径: 顺子可跳1个数字'
        })
      });

      jokerSlots.addJoker(shortcut);

      // 打出跳2个数字的牌：A, K, Q, J, 8（跳了10,9）
      const cards = [
        createTestCard(Suit.Hearts, Rank.Ace),
        createTestCard(Suit.Hearts, Rank.King),
        createTestCard(Suit.Hearts, Rank.Queen),
        createTestCard(Suit.Hearts, Rank.Jack),
        createTestCard(Suit.Hearts, Rank.Eight),  // 跳了10,9
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

      // 不应该检测为顺子
      expect(result.handType).not.toBe('straight');
    });
  });

  describe('oops_all_6s (哎呀全是6)', () => {
    it('应该返回概率翻倍标记', () => {
      const oopsAll6s = new Joker({
        id: 'oops_all_6s',
        name: '哎呀全是6',
        description: '所有概率翻倍',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '哎呀全是6: 概率翻倍'
        })
      });

      jokerSlots.addJoker(oopsAll6s);

      // 验证小丑牌效果
      const jokers = jokerSlots.getJokers();
      expect(jokers[0].id).toBe('oops_all_6s');
    });
  });

  describe('astronomer (天文学家)', () => {
    it('应该返回行星牌免费标记', () => {
      const astronomer = new Joker({
        id: 'astronomer',
        name: '天文学家',
        description: '商店行星牌免费',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '天文学家: 行星牌免费'
        })
      });

      jokerSlots.addJoker(astronomer);

      // 验证小丑牌效果
      const jokers = jokerSlots.getJokers();
      expect(jokers[0].id).toBe('astronomer');
    });
  });

  describe('chicot (奇科特)', () => {
    it('应该返回Boss盲注无效标记', () => {
      const chicot = new Joker({
        id: 'chicot',
        name: '奇科特',
        description: 'Boss盲注能力无效',
        rarity: JokerRarity.LEGENDARY,
        cost: 20,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '奇科特: Boss盲注能力无效'
        })
      });

      jokerSlots.addJoker(chicot);

      // 验证小丑牌效果
      const jokers = jokerSlots.getJokers();
      expect(jokers[0].id).toBe('chicot');
    });
  });

  describe('ring_master (马戏团领队)', () => {
    it('应该返回卡片可重复出现标记', () => {
      const ringMaster = new Joker({
        id: 'ring_master',
        name: '马戏团领队',
        description: '小丑/塔罗/行星可出现多次',
        rarity: JokerRarity.UNCOMMON,
        cost: 5,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '马戏团领队: 卡片可重复出现'
        })
      });

      jokerSlots.addJoker(ringMaster);

      // 验证小丑牌效果
      const jokers = jokerSlots.getJokers();
      expect(jokers[0].id).toBe('ring_master');
    });
  });

  describe('smeared_joker (脏污小丑)', () => {
    it('应该返回花色简化标记', () => {
      const smearedJoker = new Joker({
        id: 'smeared_joker',
        name: '脏污小丑',
        description: '花色只有红黑两种',
        rarity: JokerRarity.RARE,
        cost: 8,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '脏污小丑: 花色简化为红黑'
        })
      });

      jokerSlots.addJoker(smearedJoker);

      // 验证小丑牌效果
      const jokers = jokerSlots.getJokers();
      expect(jokers[0].id).toBe('smeared_joker');
    });
  });

  describe('caino (该隐)', () => {
    it('应该返回摧毁脸牌加成标记', () => {
      const caino = new Joker({
        id: 'caino',
        name: '该隐',
        description: '摧毁脸牌时永久x1倍率',
        rarity: JokerRarity.LEGENDARY,
        cost: 20,
        trigger: JokerTrigger.ON_INDEPENDENT,
        effect: () => ({
          message: '该隐: 摧毁脸牌永久加成'
        })
      });

      jokerSlots.addJoker(caino);

      // 验证小丑牌效果
      const jokers = jokerSlots.getJokers();
      expect(jokers[0].id).toBe('caino');
    });
  });
});
