import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_CONSUMABLE_INSTANCES as CONSUMABLES, getConsumablesByType } from '../data/consumables/index';
import { ConsumableType } from '../types/consumable';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, CardEdition } from '../types/card';

describe('Tarot Cards', () => {
  describe('Tarot Card Count', () => {
    it('should have 22 tarot cards', () => {
      const tarotCards = getConsumablesByType(ConsumableType.TAROT);
      expect(tarotCards.length).toBe(22);
    });

    it('should have all 22 tarot card IDs', () => {
      const expectedIds = [
        'tarot_sun', 'tarot_moon', 'tarot_star', 'tarot_world', 'tarot_death',
        'tarot_fool', 'tarot_magician', 'tarot_high_priestess', 'tarot_empress',
        'tarot_emperor', 'tarot_hierophant', 'tarot_lovers', 'tarot_chariot',
        'tarot_justice', 'tarot_hermit', 'tarot_wheel_of_fortune', 'tarot_strength',
        'tarot_hanged_man', 'tarot_temperance', 'tarot_devil', 'tarot_tower', 'tarot_judgement'
      ];
      
      for (const id of expectedIds) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card).toBeDefined();
        expect(card?.type).toBe(ConsumableType.TAROT);
      }
    });
  });

  describe('Tarot Card Effects - Suit Changes', () => {
    it('Sun should change card to Diamonds', () => {
      const sun = CONSUMABLES.find(c => c.id === 'tarot_sun');
      expect(sun).toBeDefined();
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const result = sun!.use({ selectedCards: [card] });
      
      expect(result.success).toBe(true);
      expect(card.suit).toBe(Suit.Diamonds);
    });

    it('Moon should change card to Spades', () => {
      const moon = CONSUMABLES.find(c => c.id === 'tarot_moon');
      const card = new Card(Suit.Hearts, Rank.Ace);
      
      moon!.use({ selectedCards: [card] });
      expect(card.suit).toBe(Suit.Spades);
    });

    it('Star should change card to Hearts', () => {
      const star = CONSUMABLES.find(c => c.id === 'tarot_star');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      star!.use({ selectedCards: [card] });
      expect(card.suit).toBe(Suit.Hearts);
    });

    it('World should change card to Clubs', () => {
      const world = CONSUMABLES.find(c => c.id === 'tarot_world');
      const card = new Card(Suit.Hearts, Rank.Ace);
      
      world!.use({ selectedCards: [card] });
      expect(card.suit).toBe(Suit.Clubs);
    });

    it('Lovers should change card to Wild enhancement', () => {
      const lovers = CONSUMABLES.find(c => c.id === 'tarot_lovers');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      lovers!.use({ selectedCards: [card] });
      // 修复: 根据官方规则，The Lovers将选中牌变为Wild增强，而不是改变花色
      expect(card.enhancement).toBe(CardEnhancement.Wild);
    });
  });

  describe('Tarot Card Effects - Enhancement Changes', () => {
    it('Magician should change cards to Lucky', () => {
      const magician = CONSUMABLES.find(c => c.id === 'tarot_magician');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      
      magician!.use({ selectedCards: [card1, card2] });
      
      // 修复: 根据官方规则，The Magician将选中牌变为Lucky增强，而不是Wild
      expect(card1.enhancement).toBe(CardEnhancement.Lucky);
      expect(card2.enhancement).toBe(CardEnhancement.Lucky);
    });

    it('Hierophant should change cards to Bonus', () => {
      const hierophant = CONSUMABLES.find(c => c.id === 'tarot_hierophant');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      
      hierophant!.use({ selectedCards: [card1, card2] });
      
      expect(card1.enhancement).toBe(CardEnhancement.Bonus);
      expect(card2.enhancement).toBe(CardEnhancement.Bonus);
    });

    it('Chariot should change card to Steel', () => {
      const chariot = CONSUMABLES.find(c => c.id === 'tarot_chariot');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      chariot!.use({ selectedCards: [card] });
      expect(card.enhancement).toBe(CardEnhancement.Steel);
    });

    it('Justice should change card to Glass', () => {
      const justice = CONSUMABLES.find(c => c.id === 'tarot_justice');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      justice!.use({ selectedCards: [card] });
      expect(card.enhancement).toBe(CardEnhancement.Glass);
    });

    it('Devil should change card to Gold', () => {
      const devil = CONSUMABLES.find(c => c.id === 'tarot_devil');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      devil!.use({ selectedCards: [card] });
      expect(card.enhancement).toBe(CardEnhancement.Gold);
    });

    it('Tower should change card to Stone', () => {
      const tower = CONSUMABLES.find(c => c.id === 'tarot_tower');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      tower!.use({ selectedCards: [card] });
      expect(card.enhancement).toBe(CardEnhancement.Stone);
    });
  });

  describe('Tarot Card Effects - Edition Changes', () => {
    it('Empress should change cards to Mult enhancement', () => {
      const empress = CONSUMABLES.find(c => c.id === 'tarot_empress');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      
      empress!.use({ selectedCards: [card1, card2] });
      
      // 修复: 根据官方规则，The Empress将选中牌变为Mult增强，而不是Polychrome版本
      expect(card1.enhancement).toBe(CardEnhancement.Mult);
      expect(card2.enhancement).toBe(CardEnhancement.Mult);
    });

    it('Wheel of Fortune should apply edition to random joker', () => {
      const wheel = CONSUMABLES.find(c => c.id === 'tarot_wheel_of_fortune');

      // 测试需要小丑牌才能使用
      const resultNoJokers = wheel!.use({ jokers: [] });
      expect(resultNoJokers.success).toBe(false);
      expect(resultNoJokers.message).toContain('没有小丑牌');

      // 测试有小丑牌但没有可添加版本的情况
      const resultAllEditions = wheel!.use({
        jokers: [{ sellPrice: 5, hasEdition: true }]
      });
      expect(resultAllEditions.success).toBe(false);
      expect(resultAllEditions.message).toContain('已有版本');

      // 测试成功情况 - 统计概率
      let editionAddedCount = 0;
      let editionAddedToJoker = false;

      for (let i = 0; i < 100; i++) {
        let editionAdded = false;
        const addEditionToRandomJoker = (_edition: string) => { editionAdded = true; return true; };

        const result = wheel!.use({
          jokers: [{ sellPrice: 5, hasEdition: false }],
          addEditionToRandomJoker
        });

        if (result.success && editionAdded) {
          editionAddedCount++;
          editionAddedToJoker = true;
        }
      }

      // 根据官方规则，总成功率是25%
      // 100次测试的期望值: ~25次成功
      expect(editionAddedCount).toBeGreaterThan(10); // ~25次，允许一定偏差
      expect(editionAddedToJoker).toBe(true);
    });

    it('Wheel of Fortune canUse should require eligible jokers', () => {
      const wheel = CONSUMABLES.find(c => c.id === 'tarot_wheel_of_fortune');

      // 没有小丑牌时不能使用
      expect(wheel!.canUse!({ jokers: [] })).toBe(false);
      expect(wheel!.canUse!({})).toBe(false);

      // 有小丑牌但没有可添加版本的不能使用
      expect(wheel!.canUse!({
        jokers: [{ sellPrice: 5, hasEdition: true }]
      })).toBe(false);

      // 有至少一个没有版本的小丑牌时可以使用
      expect(wheel!.canUse!({
        jokers: [{ sellPrice: 5, hasEdition: false }]
      })).toBe(true);

      // 混合情况 - 部分有版本，部分没有
      expect(wheel!.canUse!({
        jokers: [
          { sellPrice: 5, hasEdition: true },
          { sellPrice: 3, hasEdition: false }
        ]
      })).toBe(true);
    });
  });

  describe('Tarot Card Effects - Special Effects', () => {
    it('Death should convert left card into right card', () => {
      const death = CONSUMABLES.find(c => c.id === 'tarot_death');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      
      death!.use({ selectedCards: [card1, card2] });
      
      // 左边牌应该变成右边牌的花色和点数
      expect(card1.suit).toBe(Suit.Hearts);
      expect(card1.rank).toBe(Rank.King);
      // 右边牌保持不变
      expect(card2.suit).toBe(Suit.Hearts);
      expect(card2.rank).toBe(Rank.King);
    });

    it('Fool should copy last consumable effect', () => {
      const fool = CONSUMABLES.find(c => c.id === 'tarot_fool');
      const result = fool!.use({
        lastUsedConsumable: { id: 'tarot_sun', type: ConsumableType.TAROT }
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('复制');
    });

    it('Fool canUse should check selectedCards when copying card that requires them', () => {
      const fool = CONSUMABLES.find(c => c.id === 'tarot_fool');
      
      // 复制需要选中牌的魔术师（需要2张）
      // 没有选中牌时应该返回false
      const canUseWithoutCards = fool!.canUse!({
        lastUsedConsumable: { id: 'tarot_magician', type: ConsumableType.TAROT }
      });
      expect(canUseWithoutCards).toBe(false);
      
      // 有2张选中牌时应该返回true
      const card1 = new Card(Suit.Hearts, Rank.Ace);
      const card2 = new Card(Suit.Spades, Rank.King);
      const canUseWithCards = fool!.canUse!({
        lastUsedConsumable: { id: 'tarot_magician', type: ConsumableType.TAROT },
        selectedCards: [card1, card2]
      });
      expect(canUseWithCards).toBe(true);
      
      // 复制不需要选中牌的女祭司
      // 没有选中牌时也应该返回true
      const canUsePriestess = fool!.canUse!({
        lastUsedConsumable: { id: 'tarot_high_priestess', type: ConsumableType.TAROT }
      });
      expect(canUsePriestess).toBe(true);
    });

    it('High Priestess should generate planet cards', () => {
      const priestess = CONSUMABLES.find(c => c.id === 'tarot_high_priestess');
      const result = priestess!.use({});
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('星球');
    });

    it('Emperor should generate tarot cards', () => {
      const emperor = CONSUMABLES.find(c => c.id === 'tarot_emperor');
      const result = emperor!.use({});
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('塔罗');
    });

    it('Hermit should double money', () => {
      const hermit = CONSUMABLES.find(c => c.id === 'tarot_hermit');
      const result = hermit!.use({});
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('资金翻倍');
    });

    it('Strength should increase card rank by 1', () => {
      const strength = CONSUMABLES.find(c => c.id === 'tarot_strength');
      const card = new Card(Suit.Spades, Rank.Ten);
      
      const result = strength!.use({ selectedCards: [card] });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('力量');
      // 点数应该从10变成J
      expect(card.rank).toBe(Rank.Jack);
    });

    it('Strength should work with up to 2 cards', () => {
      const strength = CONSUMABLES.find(c => c.id === 'tarot_strength');
      const card1 = new Card(Suit.Spades, Rank.Two);
      const card2 = new Card(Suit.Hearts, Rank.Three);
      
      const result = strength!.use({ selectedCards: [card1, card2] });
      
      expect(result.success).toBe(true);
      // 两张牌的点数都应该+1
      expect(card1.rank).toBe(Rank.Three);
      expect(card2.rank).toBe(Rank.Four);
    });

    it('Hanged Man should destroy cards', () => {
      const hanged = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');
      const card1 = new Card(Suit.Spades, Rank.Ace);

      const result = hanged!.use({ selectedCards: [card1] });

      expect(result.success).toBe(true);
      expect(result.message).toContain('摧毁');
      expect(result.destroyedCards).toContain(card1);
    });

    it('Temperance should give money based on jokers', () => {
      const temperance = CONSUMABLES.find(c => c.id === 'tarot_temperance');
      const result = temperance!.use({});
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('小丑牌');
    });

    it('Judgement should generate a joker', () => {
      const judgement = CONSUMABLES.find(c => c.id === 'tarot_judgement');
      const result = judgement!.use({
        addJoker: () => true // 模拟成功添加小丑牌
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('生成');
    });

    it('Judgement should call addJoker callback when provided', () => {
      const judgement = CONSUMABLES.find(c => c.id === 'tarot_judgement');
      let jokerAdded = false;

      const result = judgement!.use({
        addJoker: () => {
          jokerAdded = true;
          return true;
        }
      });

      expect(result.success).toBe(true);
      expect(jokerAdded).toBe(true);
      expect(result.message).toContain('生成');
    });

    it('Judgement should handle full joker slots gracefully', () => {
      const judgement = CONSUMABLES.find(c => c.id === 'tarot_judgement');

      const result = judgement!.use({
        addJoker: () => false // 模拟小丑槽位已满
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('槽位已满');
    });
  });

  describe('Tarot Card Validation', () => {
    it('should require correct number of cards for Death', () => {
      const death = CONSUMABLES.find(c => c.id === 'tarot_death');
      
      // Should fail with 1 card
      const result1 = death!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result1).toBe(false);
      
      // Should succeed with 2 cards
      const result2 = death!.canUse!({ 
        selectedCards: [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.King)] 
      });
      expect(result2).toBe(true);
    });

    it('should require correct number of cards for Magician', () => {
      const magician = CONSUMABLES.find(c => c.id === 'tarot_magician');
      
      // Should fail with 1 card
      const result1 = magician!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result1).toBe(false);
      
      // Should succeed with exactly 2 cards (修复: 官方规则是正好2张)
      const result2 = magician!.canUse!({ 
        selectedCards: [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.King)] 
      });
      expect(result2).toBe(true);
      
      // Should fail with 3 cards (修复: 官方规则是正好2张)
      const result3 = magician!.canUse!({ 
        selectedCards: [
          new Card(Suit.Spades, Rank.Ace), 
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen)
        ] 
      });
      expect(result3).toBe(false);
    });

    it('should require correct number of cards for Hierophant', () => {
      const hierophant = CONSUMABLES.find(c => c.id === 'tarot_hierophant');
      
      // Should fail with 1 card
      const result1 = hierophant!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result1).toBe(false);
      
      // Should succeed with exactly 2 cards
      const result2 = hierophant!.canUse!({ 
        selectedCards: [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.King)] 
      });
      expect(result2).toBe(true);
    });

    it('should require 1-2 cards for Strength', () => {
      const strength = CONSUMABLES.find(c => c.id === 'tarot_strength');
      
      // Should fail with no cards
      const result1 = strength!.canUse!({ selectedCards: [] });
      expect(result1).toBe(false);
      
      // Should succeed with 1 card
      const result2 = strength!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result2).toBe(true);
      
      // Should succeed with 2 cards
      const result3 = strength!.canUse!({ 
        selectedCards: [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.King)] 
      });
      expect(result3).toBe(true);
      
      // Should fail with 3 cards
      const result4 = strength!.canUse!({ 
        selectedCards: [
          new Card(Suit.Spades, Rank.Ace), 
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen)
        ] 
      });
      expect(result4).toBe(false);
    });

    it('should require 1-2 cards for Hanged Man', () => {
      const hanged = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');
      
      // Should fail with 0 cards
      const result1 = hanged!.canUse!({ selectedCards: [] });
      expect(result1).toBe(false);
      
      // Should succeed with 1 card
      const result2 = hanged!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result2).toBe(true);
      
      // Should succeed with 2 cards
      const result3 = hanged!.canUse!({ 
        selectedCards: [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.King)] 
      });
      expect(result3).toBe(true);
    });
  });

  describe('Tarot Card Costs', () => {
    it('should have correct costs for tarot cards', () => {
      const lowCostCards = ['tarot_sun', 'tarot_moon', 'tarot_star', 'tarot_world', 'tarot_lovers'];
      const mediumCostCards = [
        'tarot_death', 'tarot_magician', 'tarot_high_priestess', 'tarot_empress',
        'tarot_emperor', 'tarot_hierophant', 'tarot_chariot', 'tarot_justice',
        'tarot_hermit', 'tarot_wheel_of_fortune', 'tarot_strength', 'tarot_hanged_man',
        'tarot_temperance', 'tarot_devil', 'tarot_tower', 'tarot_judgement'
      ];
      
      for (const id of lowCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(3);
      }
      
      for (const id of mediumCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(4);
      }
    });
  });
});
