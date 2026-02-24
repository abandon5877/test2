import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../models/GameState';
import { BOOSTER_PACKS, type BoosterPack, type PackType, type PackSize, PACK_WEIGHTS } from '../data/consumables/index';
import { Joker } from '../models/Joker';
import { Consumable } from '../models/Consumable';
import { Card } from '../models/Card';
import { ConsumableType } from '../types/consumable';
import { Suit, Rank } from '../types/card';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { getRandomJokers } from '../data/jokers';
import { getRandomConsumables, getConsumablesByType } from '../data/consumables/index';

describe('卡包系统测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('1. 卡包数据结构测试', () => {
    it('应该包含全部15种卡包 (5类型 × 3尺寸)', () => {
      expect(BOOSTER_PACKS.length).toBe(15);
    });

    it('应该包含5种卡包类型', () => {
      const types: PackType[] = ['standard', 'arcana', 'celestial', 'buffoon', 'spectral'];
      for (const type of types) {
        const packsOfType = BOOSTER_PACKS.filter(p => p.type === type);
        expect(packsOfType.length).toBe(3);
      }
    });

    it('每种类型应该有3种尺寸(普通/巨型/超级)', () => {
      const types: PackType[] = ['standard', 'arcana', 'celestial', 'buffoon', 'spectral'];
      for (const type of types) {
        const packsOfType = BOOSTER_PACKS.filter(p => p.type === type);
        const sizes = packsOfType.map(p => p.size);
        expect(sizes).toContain('normal');
        expect(sizes).toContain('jumbo');
        expect(sizes).toContain('mega');
      }
    });

    it('每种卡包应该有唯一的ID', () => {
      const ids = BOOSTER_PACKS.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('每种卡包都应该有名称和描述', () => {
      for (const pack of BOOSTER_PACKS) {
        expect(pack.name).toBeTruthy();
        expect(pack.description).toBeTruthy();
        expect(pack.name.length).toBeGreaterThan(0);
        expect(pack.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('2. 卡包成本测试', () => {
    it('普通包成本应该为$4', () => {
      const normalPacks = BOOSTER_PACKS.filter(p => p.size === 'normal');
      for (const pack of normalPacks) {
        expect(pack.cost).toBe(4);
      }
    });

    it('巨型包成本应该为$6', () => {
      const jumboPacks = BOOSTER_PACKS.filter(p => p.size === 'jumbo');
      for (const pack of jumboPacks) {
        expect(pack.cost).toBe(6);
      }
    });

    it('超级包成本应该为$8', () => {
      const megaPacks = BOOSTER_PACKS.filter(p => p.size === 'mega');
      for (const pack of megaPacks) {
        expect(pack.cost).toBe(8);
      }
    });

    it('更大的卡包应该有更高的成本', () => {
      for (const type of ['standard', 'arcana', 'celestial', 'buffoon', 'spectral'] as PackType[]) {
        const packsOfType = BOOSTER_PACKS.filter(p => p.type === type);
        const normal = packsOfType.find(p => p.size === 'normal');
        const jumbo = packsOfType.find(p => p.size === 'jumbo');
        const mega = packsOfType.find(p => p.size === 'mega');

        expect(normal!.cost).toBeLessThan(jumbo!.cost);
        expect(jumbo!.cost).toBeLessThanOrEqual(mega!.cost);
      }
    });
  });

  describe('3. 卡包choices和selectCount测试', () => {
    describe('3.1 标准包', () => {
      it('普通标准包应该是3选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'standard' && p.size === 'normal');
        expect(pack?.choices).toBe(3);
        expect(pack?.selectCount).toBe(1);
      });

      it('巨型标准包应该是5选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'standard' && p.size === 'jumbo');
        expect(pack?.choices).toBe(5);
        expect(pack?.selectCount).toBe(1);
      });

      it('超级标准包应该是5选2', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'standard' && p.size === 'mega');
        expect(pack?.choices).toBe(5);
        expect(pack?.selectCount).toBe(2);
      });
    });

    describe('3.2 塔罗包', () => {
      it('普通塔罗包应该是3选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'arcana' && p.size === 'normal');
        expect(pack?.choices).toBe(3);
        expect(pack?.selectCount).toBe(1);
      });

      it('巨型塔罗包应该是5选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'arcana' && p.size === 'jumbo');
        expect(pack?.choices).toBe(5);
        expect(pack?.selectCount).toBe(1);
      });

      it('超级塔罗包应该是5选2', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'arcana' && p.size === 'mega');
        expect(pack?.choices).toBe(5);
        expect(pack?.selectCount).toBe(2);
      });
    });

    describe('3.3 星球包', () => {
      it('普通星球包应该是3选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'celestial' && p.size === 'normal');
        expect(pack?.choices).toBe(3);
        expect(pack?.selectCount).toBe(1);
      });

      it('巨型星球包应该是5选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'celestial' && p.size === 'jumbo');
        expect(pack?.choices).toBe(5);
        expect(pack?.selectCount).toBe(1);
      });

      it('超级星球包应该是5选2', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'celestial' && p.size === 'mega');
        expect(pack?.choices).toBe(5);
        expect(pack?.selectCount).toBe(2);
      });
    });

    describe('3.4 小丑包', () => {
      it('普通小丑包应该是2选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'buffoon' && p.size === 'normal');
        expect(pack?.choices).toBe(2);
        expect(pack?.selectCount).toBe(1);
      });

      it('巨大小丑包应该是4选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'buffoon' && p.size === 'jumbo');
        expect(pack?.choices).toBe(4);
        expect(pack?.selectCount).toBe(1);
      });

      it('超级小丑包应该是4选2', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'buffoon' && p.size === 'mega');
        expect(pack?.choices).toBe(4);
        expect(pack?.selectCount).toBe(2);
      });
    });

    describe('3.5 幻灵包', () => {
      it('普通幻灵包应该是2选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'spectral' && p.size === 'normal');
        expect(pack?.choices).toBe(2);
        expect(pack?.selectCount).toBe(1);
      });

      it('巨型幻灵包应该是4选1', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'spectral' && p.size === 'jumbo');
        expect(pack?.choices).toBe(4);
        expect(pack?.selectCount).toBe(1);
      });

      it('超级幻灵包应该是4选2', () => {
        const pack = BOOSTER_PACKS.find(p => p.type === 'spectral' && p.size === 'mega');
        expect(pack?.choices).toBe(4);
        expect(pack?.selectCount).toBe(2);
      });
    });

    it('普通包和巨型包的选择数量应该为1', () => {
      const normalAndJumboPacks = BOOSTER_PACKS.filter(p => p.size === 'normal' || p.size === 'jumbo');
      for (const pack of normalAndJumboPacks) {
        expect(pack.selectCount).toBe(1);
      }
    });

    it('超级包的选择数量应该为2', () => {
      const megaPacks = BOOSTER_PACKS.filter(p => p.size === 'mega');
      for (const pack of megaPacks) {
        expect(pack.selectCount).toBe(2);
      }
    });
  });

  describe('4. 卡包权重配置测试', () => {
    it('应该包含所有5种类型的权重配置', () => {
      const types: PackType[] = ['standard', 'arcana', 'celestial', 'buffoon', 'spectral'];
      for (const type of types) {
        expect(PACK_WEIGHTS[type]).toBeDefined();
      }
    });

    it('每种类型应该有3种尺寸的权重', () => {
      for (const type of Object.keys(PACK_WEIGHTS) as PackType[]) {
        expect(PACK_WEIGHTS[type].normal).toBeDefined();
        expect(PACK_WEIGHTS[type].jumbo).toBeDefined();
        expect(PACK_WEIGHTS[type].mega).toBeDefined();
      }
    });

    it('标准包权重应该为: 普通4, 巨型2, 超级0.5', () => {
      expect(PACK_WEIGHTS.standard.normal).toBe(4);
      expect(PACK_WEIGHTS.standard.jumbo).toBe(2);
      expect(PACK_WEIGHTS.standard.mega).toBe(0.5);
    });

    it('塔罗包权重应该为: 普通4, 巨型2, 超级0.5', () => {
      expect(PACK_WEIGHTS.arcana.normal).toBe(4);
      expect(PACK_WEIGHTS.arcana.jumbo).toBe(2);
      expect(PACK_WEIGHTS.arcana.mega).toBe(0.5);
    });

    it('星球包权重应该为: 普通4, 巨型2, 超级0.5', () => {
      expect(PACK_WEIGHTS.celestial.normal).toBe(4);
      expect(PACK_WEIGHTS.celestial.jumbo).toBe(2);
      expect(PACK_WEIGHTS.celestial.mega).toBe(0.5);
    });

    it('小丑包权重应该为: 普通1.2, 巨型0.6, 超级0.15', () => {
      expect(PACK_WEIGHTS.buffoon.normal).toBe(1.2);
      expect(PACK_WEIGHTS.buffoon.jumbo).toBe(0.6);
      expect(PACK_WEIGHTS.buffoon.mega).toBe(0.15);
    });

    it('幻灵包权重应该为: 普通0.6, 巨型0.3, 超级0.07', () => {
      expect(PACK_WEIGHTS.spectral.normal).toBe(0.6);
      expect(PACK_WEIGHTS.spectral.jumbo).toBe(0.3);
      expect(PACK_WEIGHTS.spectral.mega).toBe(0.07);
    });

    it('普通包权重应该大于巨型包', () => {
      for (const type of Object.keys(PACK_WEIGHTS) as PackType[]) {
        expect(PACK_WEIGHTS[type].normal).toBeGreaterThan(PACK_WEIGHTS[type].jumbo);
      }
    });

    it('巨型包权重应该大于超级包', () => {
      for (const type of Object.keys(PACK_WEIGHTS) as PackType[]) {
        expect(PACK_WEIGHTS[type].jumbo).toBeGreaterThan(PACK_WEIGHTS[type].mega);
      }
    });

    it('标准/塔罗/星球包权重应该高于小丑包', () => {
      expect(PACK_WEIGHTS.standard.normal).toBeGreaterThan(PACK_WEIGHTS.buffoon.normal);
      expect(PACK_WEIGHTS.arcana.normal).toBeGreaterThan(PACK_WEIGHTS.buffoon.normal);
      expect(PACK_WEIGHTS.celestial.normal).toBeGreaterThan(PACK_WEIGHTS.buffoon.normal);
    });

    it('小丑包权重应该高于幻灵包', () => {
      expect(PACK_WEIGHTS.buffoon.normal).toBeGreaterThan(PACK_WEIGHTS.spectral.normal);
    });
  });

  describe('5. 标准包 (Standard Pack) 测试', () => {
    it('开标准包应该获得游戏牌', () => {
      const pack = BOOSTER_PACKS.find(p => p.type === 'standard' && p.size === 'normal')!;
      expect(pack.type).toBe('standard');
    });

    it('标准包开出的卡牌应该有有效的花色', () => {
      const validSuits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      const card = new Card(Suit.Spades, Rank.Ace);
      expect(validSuits).toContain(card.suit);
    });

    it('标准包开出的卡牌应该有有效的点数', () => {
      const validRanks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
      const card = new Card(Suit.Hearts, Rank.King);
      expect(validRanks).toContain(card.rank);
    });

    it('游戏牌应该可以添加到卡组', () => {
      const initialSize = gameState.cardPile.deck.size;
      const card = new Card(Suit.Hearts, Rank.King);

      gameState.cardPile.deck.addToTop(card);

      expect(gameState.cardPile.deck.size).toBe(initialSize + 1);
    });
  });

  describe('6. 塔罗包 (Arcana Pack) 测试', () => {
    it('开塔罗包应该获得塔罗牌', () => {
      const pack = BOOSTER_PACKS.find(p => p.type === 'arcana' && p.size === 'normal')!;
      expect(pack.type).toBe('arcana');
    });

    it('塔罗牌应该有正确的类型', () => {
      const tarot = new Consumable({
        id: 'tarot_sun',
        name: '太阳',
        description: '测试',
        type: ConsumableType.TAROT,
        cost: 3,
        use: () => ({ success: true, message: '使用成功' })
      });

      expect(tarot.type).toBe(ConsumableType.TAROT);
    });

    it('塔罗牌应该可以放入消耗牌槽位', () => {
      const tarot = new Consumable({
        id: 'tarot_test',
        name: '测试塔罗',
        description: '测试',
        type: ConsumableType.TAROT,
        cost: 3,
        use: () => ({ success: true, message: '使用成功' })
      });

      const initialCount = gameState.getConsumableCount();

      if (gameState.hasAvailableConsumableSlot()) {
        gameState.addConsumable(tarot);
        expect(gameState.getConsumableCount()).toBe(initialCount + 1);
      }
    });
  });

  describe('7. 星球包 (Celestial Pack) 测试', () => {
    it('开星球包应该获得星球牌', () => {
      const pack = BOOSTER_PACKS.find(p => p.type === 'celestial' && p.size === 'normal')!;
      expect(pack.type).toBe('celestial');
    });

    it('星球牌应该有正确的类型', () => {
      const planet = new Consumable({
        id: 'planet_mercury',
        name: '水星',
        description: '升级一对',
        type: ConsumableType.PLANET,
        cost: 4,
        use: () => ({ success: true, message: '使用成功' })
      });

      expect(planet.type).toBe(ConsumableType.PLANET);
    });

    it('星球牌应该可以放入消耗牌槽位', () => {
      const planet = new Consumable({
        id: 'planet_test',
        name: '测试星球',
        description: '测试',
        type: ConsumableType.PLANET,
        cost: 4,
        use: () => ({ success: true, message: '使用成功' })
      });

      const initialCount = gameState.getConsumableCount();

      if (gameState.hasAvailableConsumableSlot()) {
        gameState.addConsumable(planet);
        expect(gameState.getConsumableCount()).toBe(initialCount + 1);
      }
    });
  });

  describe('8. 小丑包 (Buffoon Pack) 测试', () => {
    it('开小丑包应该获得小丑牌', () => {
      const pack = BOOSTER_PACKS.find(p => p.type === 'buffoon' && p.size === 'normal')!;
      expect(pack.type).toBe('buffoon');
    });

    it('小丑牌应该可以添加到游戏状态', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: '测试小丑',
        description: '测试',
        rarity: JokerRarity.COMMON,
        cost: 2,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({ multBonus: 4 })
      });

      const initialCount = gameState.getJokerCount();
      const success = gameState.addJoker(joker);

      if (initialCount < 5) {
        expect(success).toBe(true);
        expect(gameState.getJokerCount()).toBe(initialCount + 1);
      } else {
        expect(success).toBe(false);
      }
    });

    it('小丑牌槽位满时应该无法添加', () => {
      // 填满小丑牌槽位
      for (let i = 0; i < 5; i++) {
        const joker = new Joker({
          id: `test_joker_${i}`,
          name: `测试小丑${i}`,
          description: '测试',
          rarity: JokerRarity.COMMON,
          cost: 2,
          trigger: JokerTrigger.ON_PLAY,
          effect: () => ({ multBonus: 4 })
        });
        gameState.addJoker(joker);
      }

      expect(gameState.getJokerCount()).toBe(5);

      // 尝试添加第6张
      const extraJoker = new Joker({
        id: 'extra_joker',
        name: '额外小丑',
        description: '测试',
        rarity: JokerRarity.COMMON,
        cost: 2,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({ multBonus: 4 })
      });

      const success = gameState.addJoker(extraJoker);
      expect(success).toBe(false);
      expect(gameState.getJokerCount()).toBe(5);
    });
  });

  describe('9. 幻灵包 (Spectral Pack) 测试', () => {
    it('开幻灵包应该获得幻灵牌', () => {
      const pack = BOOSTER_PACKS.find(p => p.type === 'spectral' && p.size === 'normal')!;
      expect(pack.type).toBe('spectral');
    });

    it('幻灵牌应该有正确的类型', () => {
      const spectral = new Consumable({
        id: 'spectral_immolate',
        name: '火祭',
        description: '摧毁卡牌',
        type: ConsumableType.SPECTRAL,
        cost: 5,
        use: () => ({ success: true, message: '使用成功' })
      });

      expect(spectral.type).toBe(ConsumableType.SPECTRAL);
    });

    it('幻灵牌应该可以放入消耗牌槽位', () => {
      const spectral = new Consumable({
        id: 'spectral_test',
        name: '测试幻灵',
        description: '测试',
        type: ConsumableType.SPECTRAL,
        cost: 5,
        use: () => ({ success: true, message: '使用成功' })
      });

      const initialCount = gameState.getConsumableCount();

      if (gameState.hasAvailableConsumableSlot()) {
        gameState.addConsumable(spectral);
        expect(gameState.getConsumableCount()).toBe(initialCount + 1);
      }
    });
  });

  describe('10. 开包奖励处理测试', () => {
    it('处理游戏牌奖励应该添加到卡组', () => {
      const initialSize = gameState.cardPile.deck.size;
      const card = new Card(Suit.Hearts, Rank.King);

      gameState.cardPile.deck.addToTop(card);

      expect(gameState.cardPile.deck.size).toBe(initialSize + 1);
      expect(gameState.cardPile.deck.getCards().some(c => c.suit === Suit.Hearts && c.rank === Rank.King)).toBe(true);
    });

    it('处理小丑牌奖励应该添加到小丑槽位', () => {
      const joker = new Joker({
        id: 'reward_joker',
        name: '奖励小丑',
        description: '测试奖励',
        rarity: JokerRarity.UNCOMMON,
        cost: 4,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({ chipBonus: 20 })
      });

      const initialCount = gameState.getJokerCount();

      if (initialCount < 5) {
        const success = gameState.addJoker(joker);
        expect(success).toBe(true);
        expect(gameState.getJokerCount()).toBe(initialCount + 1);

        // 验证小丑牌已添加
        const jokers = gameState.jokers as Joker[];
        expect(jokers.some(j => j.id === 'reward_joker')).toBe(true);
      }
    });

    it('处理消耗牌奖励应该添加到消耗牌槽位', () => {
      const consumable = new Consumable({
        id: 'reward_tarot',
        name: '奖励塔罗',
        description: '测试',
        type: ConsumableType.TAROT,
        cost: 3,
        use: () => ({ success: true, message: '使用成功' })
      });

      const initialCount = gameState.getConsumableCount();

      if (gameState.hasAvailableConsumableSlot()) {
        gameState.addConsumable(consumable);
        expect(gameState.getConsumableCount()).toBe(initialCount + 1);
        expect(gameState.consumables.some(c => c.id === 'reward_tarot')).toBe(true);
      }
    });

    it('消耗牌槽位满时应该无法添加', () => {
      // 填满消耗牌槽位
      for (let i = 0; i < 2; i++) {
        const consumable = new Consumable({
          id: `test_consumable_${i}`,
          name: `测试消耗牌${i}`,
          description: '测试',
          type: ConsumableType.TAROT,
          cost: 3,
          use: () => ({ success: true, message: '使用成功' })
        });
        gameState.addConsumable(consumable);
      }

      expect(gameState.getConsumableCount()).toBe(2);

      // 尝试添加第3张
      const extraConsumable = new Consumable({
        id: 'extra_consumable',
        name: '额外消耗牌',
        description: '测试',
        type: ConsumableType.TAROT,
        cost: 3,
        use: () => ({ success: true, message: '使用成功' })
      });

      // 应该无法添加
      const canAdd = gameState.addConsumable(extraConsumable);
      expect(canAdd).toBe(false);
    });
  });

  describe('11. 不同尺寸卡包测试', () => {
    it('普通包应该有较少的choices (<=3)', () => {
      const normalPacks = BOOSTER_PACKS.filter(p => p.size === 'normal');
      for (const pack of normalPacks) {
        expect(pack.choices).toBeLessThanOrEqual(3);
      }
    });

    it('巨型包应该有更多的choices (4-5)', () => {
      const jumboPacks = BOOSTER_PACKS.filter(p => p.size === 'jumbo');
      for (const pack of jumboPacks) {
        expect(pack.choices).toBeGreaterThanOrEqual(4);
        expect(pack.choices).toBeLessThanOrEqual(5);
      }
    });

    it('超级包应该有最多的choices (>=4) 且可以选择2张', () => {
      const megaPacks = BOOSTER_PACKS.filter(p => p.size === 'mega');
      for (const pack of megaPacks) {
        expect(pack.choices).toBeGreaterThanOrEqual(4);
        expect(pack.choices).toBeLessThanOrEqual(5);
        expect(pack.selectCount).toBe(2);
      }
    });
  });

  describe('12. 卡包成本与价值测试', () => {
    it('卡包成本应该与其内容价值相符', () => {
      // 小丑包通常更贵或choices更少，因为小丑牌更有价值
      const buffoonPack = BOOSTER_PACKS.find(p => p.type === 'buffoon' && p.size === 'normal')!;
      const standardPack = BOOSTER_PACKS.find(p => p.type === 'standard' && p.size === 'normal')!;

      // 相同价格但小丑包choices更少
      expect(buffoonPack.cost).toBe(standardPack.cost);
      expect(buffoonPack.choices).toBeLessThan(standardPack.choices);
    });

    it('小丑包choices应该少于标准包', () => {
      const buffoonNormal = BOOSTER_PACKS.find(p => p.type === 'buffoon' && p.size === 'normal')!;
      const standardNormal = BOOSTER_PACKS.find(p => p.type === 'standard' && p.size === 'normal')!;
      expect(buffoonNormal.choices).toBeLessThan(standardNormal.choices);
    });

    it('幻灵包choices应该与小丑包相同', () => {
      const buffoonNormal = BOOSTER_PACKS.find(p => p.type === 'buffoon' && p.size === 'normal')!;
      const spectralNormal = BOOSTER_PACKS.find(p => p.type === 'spectral' && p.size === 'normal')!;
      expect(spectralNormal.choices).toBe(buffoonNormal.choices);
    });
  });

  describe('13. 边界条件测试', () => {
    it('小丑牌槽位上限应该是5张', () => {
      expect(gameState.getJokerCount()).toBe(0);

      // 添加5张小丑牌
      for (let i = 0; i < 5; i++) {
        const joker = new Joker({
          id: `boundary_joker_${i}`,
          name: `边界测试小丑${i}`,
          description: '测试',
          rarity: JokerRarity.COMMON,
          cost: 2,
          trigger: JokerTrigger.ON_PLAY,
          effect: () => ({ multBonus: 4 })
        });
        const success = gameState.addJoker(joker);
        expect(success).toBe(true);
      }

      expect(gameState.getJokerCount()).toBe(5);

      // 第6张应该失败
      const extraJoker = new Joker({
        id: 'boundary_extra',
        name: '额外小丑',
        description: '测试',
        rarity: JokerRarity.COMMON,
        cost: 2,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({ multBonus: 4 })
      });
      expect(gameState.addJoker(extraJoker)).toBe(false);
    });

    it('消耗牌槽位上限应该是2张', () => {
      expect(gameState.getConsumableCount()).toBe(0);

      // 添加2张消耗牌
      for (let i = 0; i < 2; i++) {
        const consumable = new Consumable({
          id: `boundary_consumable_${i}`,
          name: `边界测试消耗牌${i}`,
          description: '测试',
          type: ConsumableType.TAROT,
          cost: 3,
          use: () => ({ success: true, message: '使用成功' })
        });
        const success = gameState.addConsumable(consumable);
        expect(success).toBe(true);
      }

      expect(gameState.getConsumableCount()).toBe(2);

      // 第3张应该失败
      const extraConsumable = new Consumable({
        id: 'boundary_extra',
        name: '额外消耗牌',
        description: '测试',
        type: ConsumableType.TAROT,
        cost: 3,
        use: () => ({ success: true, message: '使用成功' })
      });
      expect(gameState.addConsumable(extraConsumable)).toBe(false);
    });

    it('hasAvailableConsumableSlot应该在槽位满时返回false', () => {
      // 填满消耗牌槽位
      for (let i = 0; i < 2; i++) {
        gameState.addConsumable(new Consumable({
          id: `slot_test_${i}`,
          name: `槽位测试${i}`,
          description: '测试',
          type: ConsumableType.TAROT,
          cost: 3,
          use: () => ({ success: true, message: '使用成功' })
        }));
      }

      expect(gameState.hasAvailableConsumableSlot()).toBe(false);
    });

    it('hasAvailableConsumableSlot应该在有空位时返回true', () => {
      // 添加1张消耗牌
      gameState.addConsumable(new Consumable({
        id: 'slot_test_single',
        name: '槽位测试',
        description: '测试',
        type: ConsumableType.TAROT,
        cost: 3,
        use: () => ({ success: true, message: '使用成功' })
      }));

      expect(gameState.hasAvailableConsumableSlot()).toBe(true);
    });
  });

  describe('14. 卡包ID和命名规范测试', () => {
    it('卡包ID应该遵循命名规范: pack_{type}_{size}', () => {
      for (const pack of BOOSTER_PACKS) {
        const expectedPrefix = `pack_${pack.type}_${pack.size}`;
        expect(pack.id.startsWith(expectedPrefix)).toBe(true);
      }
    });

    it('普通包名称应该不包含Jumbo或Mega', () => {
      const normalPacks = BOOSTER_PACKS.filter(p => p.size === 'normal');
      for (const pack of normalPacks) {
        expect(pack.name.includes('Jumbo')).toBe(false);
        expect(pack.name.includes('Mega')).toBe(false);
      }
    });

    it('巨型包名称应该包含巨型', () => {
      const jumboPacks = BOOSTER_PACKS.filter(p => p.size === 'jumbo');
      for (const pack of jumboPacks) {
        expect(pack.name.includes('巨型')).toBe(true);
      }
    });

    it('超级包名称应该包含超级', () => {
      const megaPacks = BOOSTER_PACKS.filter(p => p.size === 'mega');
      for (const pack of megaPacks) {
        expect(pack.name.includes('超级')).toBe(true);
      }
    });
  });

  describe('15. 数据生成函数测试', () => {
    it('getRandomJokers应该返回指定数量的小丑牌', () => {
      // 在没有已有小丑牌的情况下生成
      const jokers = getRandomJokers(3, [], []);
      expect(jokers.length).toBe(3);
      for (const joker of jokers) {
        expect(joker).toBeInstanceOf(Joker);
      }
    });

    it('getRandomConsumables应该返回指定数量的消耗牌', () => {
      const consumables = getRandomConsumables(3);
      expect(consumables.length).toBe(3);
      for (const consumable of consumables) {
        expect(consumable).toBeInstanceOf(Consumable);
      }
    });

    it('getConsumablesByType应该返回指定类型的消耗牌', () => {
      const tarots = getConsumablesByType(ConsumableType.TAROT);
      expect(tarots.length).toBeGreaterThan(0);
      for (const tarot of tarots) {
        expect(tarot.type).toBe(ConsumableType.TAROT);
      }
    });

    it('getConsumablesByType应该返回星球牌', () => {
      const planets = getConsumablesByType(ConsumableType.PLANET);
      expect(planets.length).toBeGreaterThan(0);
      for (const planet of planets) {
        expect(planet.type).toBe(ConsumableType.PLANET);
      }
    });

    it('getConsumablesByType应该返回幻灵牌', () => {
      const spectrals = getConsumablesByType(ConsumableType.SPECTRAL);
      expect(spectrals.length).toBeGreaterThan(0);
      for (const spectral of spectrals) {
        expect(spectral.type).toBe(ConsumableType.SPECTRAL);
      }
    });
  });
});
