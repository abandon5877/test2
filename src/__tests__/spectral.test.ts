import { describe, it, expect } from 'vitest';
import { ALL_CONSUMABLE_INSTANCES as CONSUMABLES, getConsumablesByType } from '../data/consumables/index';
import { ConsumableType } from '../types/consumable';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, CardEdition, SealType } from '../types/card';

describe('Spectral Cards', () => {
  describe('Spectral Card Count', () => {
    it('should have 19 spectral cards', () => {
      const spectralCards = getConsumablesByType(ConsumableType.SPECTRAL);
      expect(spectralCards.length).toBe(19);
    });

    it('should have all spectral card IDs', () => {
      const expectedIds = [
        'spectral_immolate', 'spectral_ghost', 'spectral_cryptid',
        'spectral_familiar', 'spectral_grim', 'spectral_incantation',
        'spectral_talisman', 'spectral_aura', 'spectral_wraith',
        'spectral_sigil', 'spectral_ouija', 'spectral_ectoplasm',
        'spectral_ankh', 'spectral_deja_vu', 'spectral_hex',
        'spectral_trance', 'spectral_medium', 'spectral_soul',
        'spectral_black_hole'
      ];
      
      for (const id of expectedIds) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card).toBeDefined();
        expect(card?.type).toBe(ConsumableType.SPECTRAL);
      }
    });
  });

  describe('Spectral Card Effects - Seal Addition', () => {
    it('Talisman should add Gold Seal', () => {
      const talisman = CONSUMABLES.find(c => c.id === 'spectral_talisman');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      talisman!.use({ selectedCards: [card] });
      expect(card.seal).toBe(SealType.Gold);
    });

    it('Deja Vu should add Red Seal', () => {
      const dejaVu = CONSUMABLES.find(c => c.id === 'spectral_deja_vu');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      dejaVu!.use({ selectedCards: [card] });
      expect(card.seal).toBe(SealType.Red);
    });

    it('Trance should add Blue Seal', () => {
      const trance = CONSUMABLES.find(c => c.id === 'spectral_trance');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      trance!.use({ selectedCards: [card] });
      expect(card.seal).toBe(SealType.Blue);
    });

    it('Medium should add Purple Seal', () => {
      const medium = CONSUMABLES.find(c => c.id === 'spectral_medium');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      medium!.use({ selectedCards: [card] });
      expect(card.seal).toBe(SealType.Purple);
    });
  });

  describe('Spectral Card Effects - Edition Addition', () => {
    it('Aura should add random edition', () => {
      const aura = CONSUMABLES.find(c => c.id === 'spectral_aura');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      aura!.use({ selectedCards: [card] });
      expect([CardEdition.Foil, CardEdition.Holographic, CardEdition.Polychrome]).toContain(card.edition);
    });
  });

  describe('Spectral Card Effects - Card Transformation', () => {
    it('Ghost should add Glass enhancement', () => {
      const ghost = CONSUMABLES.find(c => c.id === 'spectral_ghost');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      ghost!.use({ selectedCards: [card] });
      expect(card.enhancement).toBe(CardEnhancement.Glass);
    });

    it('Cryptid should clone 1-2 selected cards with all properties', () => {
      const cryptid = CONSUMABLES.find(c => c.id === 'spectral_cryptid');

      // 测试没有选中牌时失败
      const resultNoCards = cryptid!.use({ selectedCards: [] });
      expect(resultNoCards.success).toBe(false);
      expect(resultNoCards.message).toContain('至少');

      // 测试选中超过2张牌时失败
      const resultTooMany = cryptid!.use({
        selectedCards: [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen)
        ]
      });
      expect(resultTooMany.success).toBe(false);
      expect(resultTooMany.message).toContain('最多');

      // 测试复制1张牌
      const card1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      card1.edition = CardEdition.Foil;
      card1.seal = SealType.Gold;

      const result1 = cryptid!.use({ selectedCards: [card1] });
      expect(result1.success).toBe(true);
      expect(result1.newCards).toBeDefined();
      expect(result1.newCards!.length).toBe(1);

      // 验证复制的牌保留了所有属性
      const cloned1 = result1.newCards![0];
      expect(cloned1.suit).toBe(card1.suit);
      expect(cloned1.rank).toBe(card1.rank);
      expect(cloned1.enhancement).toBe(card1.enhancement);
      expect(cloned1.edition).toBe(card1.edition);
      expect(cloned1.seal).toBe(card1.seal);

      // 测试复制2张牌
      const card2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.Glass);
      card2.edition = CardEdition.Holographic;

      const result2 = cryptid!.use({ selectedCards: [card1, card2] });
      expect(result2.success).toBe(true);
      expect(result2.newCards).toBeDefined();
      expect(result2.newCards!.length).toBe(2);
    });

    it('Cryptid canUse should allow 1-2 selected cards', () => {
      const cryptid = CONSUMABLES.find(c => c.id === 'spectral_cryptid');

      expect(cryptid!.canUse!({ selectedCards: [] })).toBe(false);
      expect(cryptid!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
      expect(cryptid!.canUse!({
        selectedCards: [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.King)]
      })).toBe(true);
      expect(cryptid!.canUse!({
        selectedCards: [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen)
        ]
      })).toBe(false);
    });

    it('Sigil should convert all hand cards to same suit', () => {
      const sigil = CONSUMABLES.find(c => c.id === 'spectral_sigil');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];
      
      sigil!.use({ handCards });
      
      // All cards should have the same suit now
      const firstSuit = handCards[0].suit;
      for (const card of handCards) {
        expect(card.suit).toBe(firstSuit);
      }
    });

    it('Ouija should convert all hand cards to same rank', () => {
      const ouija = CONSUMABLES.find(c => c.id === 'spectral_ouija');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];
      
      ouija!.use({ handCards });
      
      // All cards should have the same rank now
      const firstRank = handCards[0].rank;
      for (const card of handCards) {
        expect(card.rank).toBe(firstRank);
      }
    });
  });

  describe('Spectral Card Effects - Destruction and Creation', () => {
    it('Immolate should destroy 5 random hand cards and give $20', () => {
      const immolate = CONSUMABLES.find(c => c.id === 'spectral_immolate');

      // 测试少于5张手牌时失败
      const resultFail = immolate!.use({
        handCards: [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen),
          new Card(Suit.Clubs, Rank.Jack)
        ]
      });
      expect(resultFail.success).toBe(false);
      expect(resultFail.message).toContain('至少5张手牌');

      // 测试5张手牌时成功
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      const result = immolate!.use({ handCards });
      expect(result.success).toBe(true);
      expect(result.moneyChange).toBe(20);
      expect(result.destroyedCards).toBeDefined();
      expect(result.destroyedCards!.length).toBe(5);
    });

    it('Immolate canUse should require at least 5 hand cards', () => {
      const immolate = CONSUMABLES.find(c => c.id === 'spectral_immolate');

      expect(immolate!.canUse!({ handCards: [] })).toBe(false);
      expect(immolate!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(false);
      expect(immolate!.canUse!({
        handCards: [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen),
          new Card(Suit.Clubs, Rank.Jack)
        ]
      })).toBe(false);
      expect(immolate!.canUse!({
        handCards: [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen),
          new Card(Suit.Clubs, Rank.Jack),
          new Card(Suit.Spades, Rank.Ten)
        ]
      })).toBe(true);
      expect(immolate!.canUse!({
        handCards: [
          new Card(Suit.Spades, Rank.Ace),
          new Card(Suit.Hearts, Rank.King),
          new Card(Suit.Diamonds, Rank.Queen),
          new Card(Suit.Clubs, Rank.Jack),
          new Card(Suit.Spades, Rank.Ten),
          new Card(Suit.Hearts, Rank.Nine),
          new Card(Suit.Diamonds, Rank.Eight)
        ]
      })).toBe(true);
    });

    it('Familiar should destroy random hand card and create face cards', () => {
      const familiar = CONSUMABLES.find(c => c.id === 'spectral_familiar');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Two)
      ];
      
      const result = familiar!.use({ handCards });
      expect(result.success).toBe(true);
      expect(result.newCards).toBeDefined();
      expect(result.newCards!.length).toBe(3);
    });

    it('Grim should destroy random hand card and create Aces', () => {
      const grim = CONSUMABLES.find(c => c.id === 'spectral_grim');
      const handCards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen)
      ];
      
      const result = grim!.use({ handCards });
      expect(result.success).toBe(true);
      expect(result.newCards).toBeDefined();
      expect(result.newCards!.length).toBe(2);
    });

    it('Incantation should destroy random hand card and create number cards', () => {
      const incantation = CONSUMABLES.find(c => c.id === 'spectral_incantation');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];
      
      const result = incantation!.use({ handCards });
      expect(result.success).toBe(true);
      expect(result.newCards).toBeDefined();
      expect(result.newCards!.length).toBe(4);
    });
  });

  describe('Spectral Card Effects - Special Effects', () => {
    it('Wraith should return setMoney to 0', () => {
      const wraith = CONSUMABLES.find(c => c.id === 'spectral_wraith');

      const result = wraith!.use({ money: 100 });
      expect(result.success).toBe(true);
      expect(result.setMoney).toBe(0);
    });

    it('Ouija should decrease hand size', () => {
      const ouija = CONSUMABLES.find(c => c.id === 'spectral_ouija');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];
      let handSizeDecreased = false;
      const decreaseHandSize = () => { handSizeDecreased = true; };
      
      ouija!.use({ handCards, decreaseHandSize });
      expect(handSizeDecreased).toBe(true);
    });

    it('Ectoplasm should decrease hand size', () => {
      const ectoplasm = CONSUMABLES.find(c => c.id === 'spectral_ectoplasm');
      let handSizeDecreased = false;
      const decreaseHandSize = () => { handSizeDecreased = true; };
      
      ectoplasm!.use({ decreaseHandSize });
      expect(handSizeDecreased).toBe(true);
    });

    it('Ankh should have correct description', () => {
      const ankh = CONSUMABLES.find(c => c.id === 'spectral_ankh');
      expect(ankh!.description).toContain('复制');
      expect(ankh!.description).toContain('摧毁');
    });

    it('Hex should have correct description', () => {
      const hex = CONSUMABLES.find(c => c.id === 'spectral_hex');
      expect(hex!.description).toContain('多色');
      expect(hex!.description).toContain('摧毁');
    });

    it('Soul should have correct description', () => {
      const soul = CONSUMABLES.find(c => c.id === 'spectral_soul');
      expect(soul!.description).toContain('传奇');
    });

    it('Black Hole should have correct description', () => {
      const blackHole = CONSUMABLES.find(c => c.id === 'spectral_black_hole');
      expect(blackHole!.description).toContain('升级');
      expect(blackHole!.description).toContain('牌型');
    });
  });

  describe('Spectral Card Costs', () => {
    it('should have correct costs for spectral cards', () => {
      const zeroCostCards = ['spectral_soul', 'spectral_black_hole']; // Special cards with 0 cost
      const fourCostCards = ['spectral_familiar', 'spectral_grim', 'spectral_incantation', 'spectral_sigil', 'spectral_ghost'];
      const fiveCostCards = ['spectral_immolate', 'spectral_talisman', 'spectral_aura', 'spectral_ouija', 'spectral_ectoplasm', 'spectral_deja_vu', 'spectral_trance', 'spectral_medium'];
      const sixCostCards = ['spectral_cryptid', 'spectral_wraith'];
      const eightCostCards = ['spectral_ankh', 'spectral_hex'];
      
      for (const id of zeroCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(0);
      }
      
      for (const id of fourCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(4);
      }
      
      for (const id of fiveCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(5);
      }

      for (const id of sixCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(6);
      }
      
      for (const id of eightCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(8);
      }
    });
  });

  describe('Spectral Card Validation', () => {
    it('should require selected card for Talisman', () => {
      const talisman = CONSUMABLES.find(c => c.id === 'spectral_talisman');
      
      const result1 = talisman!.canUse!({ selectedCards: [] });
      expect(result1).toBe(false);
      
      const result2 = talisman!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result2).toBe(true);
    });

    it('should require hand cards for Familiar', () => {
      const familiar = CONSUMABLES.find(c => c.id === 'spectral_familiar');
      
      const result1 = familiar!.canUse!({ handCards: [] });
      expect(result1).toBe(false);
      
      const result2 = familiar!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result2).toBe(true);
    });

    it('should require hand cards for Sigil', () => {
      const sigil = CONSUMABLES.find(c => c.id === 'spectral_sigil');
      
      const result1 = sigil!.canUse!({ handCards: [] });
      expect(result1).toBe(false);
      
      const result2 = sigil!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] });
      expect(result2).toBe(true);
    });
  });
});
