import { describe, it, expect } from 'vitest';
import { ALL_CONSUMABLE_INSTANCES as CONSUMABLES, getConsumablesByType } from '../data/consumables/index';
import { ConsumableType } from '../types/consumable';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, CardEdition, SealType } from '../types/card';

describe('Spectral Cards Check and Test', () => {
  // ============================================================================
  // 3.2.1 基础结构测试
  // ============================================================================
  describe('Basic Structure Tests', () => {
    it('should have all 19 spectral cards', () => {
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

    it('should have correct fields for all spectral cards', () => {
      const spectralCards = getConsumablesByType(ConsumableType.SPECTRAL);
      
      for (const card of spectralCards) {
        expect(card.id).toBeDefined();
        expect(card.id).not.toBe('');
        expect(card.name).toBeDefined();
        expect(card.name).not.toBe('');
        expect(card.description).toBeDefined();
        expect(card.description).not.toBe('');
        expect(card.type).toBe(ConsumableType.SPECTRAL);
        expect(card.cost).toBeDefined();
        expect(typeof card.cost).toBe('number');
        expect(card.cost).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================================================
  // 3.2.2 数值正确性测试
  // ============================================================================
  describe('Cost Correctness Tests', () => {
    it('Immolate should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_immolate');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('火祭');
      expect(card?.description).toContain('摧毁');
      expect(card?.description).toContain('$20');
    });

    it('Ghost should have cost 4', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_ghost');
      expect(card?.cost).toBe(4);
      expect(card?.name).toBe('幽灵');
      expect(card?.description).toContain('玻璃');
    });

    it('Cryptid should have cost 6', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_cryptid');
      expect(card?.cost).toBe(6);
      expect(card?.name).toBe('神秘生物');
      expect(card?.description).toContain('复制');
    });

    it('Familiar should have cost 4', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_familiar');
      expect(card?.cost).toBe(4);
      expect(card?.name).toBe('使魔');
      expect(card?.description).toContain('摧毁');
      expect(card?.description).toContain('人头牌');
    });

    it('Grim should have cost 4', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_grim');
      expect(card?.cost).toBe(4);
      expect(card?.name).toBe('冷酷');
      expect(card?.description).toContain('摧毁');
      expect(card?.description).toContain('A');
    });

    it('Incantation should have cost 4', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_incantation');
      expect(card?.cost).toBe(4);
      expect(card?.name).toBe('咒语');
      expect(card?.description).toContain('摧毁');
      expect(card?.description).toContain('数字牌');
    });

    it('Talisman should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_talisman');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('护身符');
      expect(card?.description).toContain('黄金蜡封');
    });

    it('Aura should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_aura');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('光环');
      expect(card?.description).toContain('箔片');
      expect(card?.description).toContain('全息');
      expect(card?.description).toContain('多色');
    });

    it('Wraith should have cost 6', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_wraith');
      expect(card?.cost).toBe(6);
      expect(card?.name).toBe('怨灵');
      expect(card?.description).toContain('稀有小丑');
      expect(card?.description).toContain('$0');
    });

    it('Sigil should have cost 4', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_sigil');
      expect(card?.cost).toBe(4);
      expect(card?.name).toBe('印记');
      expect(card?.description).toContain('手牌');
      expect(card?.description).toContain('花色');
    });

    it('Ouija should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_ouija');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('通灵板');
      expect(card?.description).toContain('手牌');
      expect(card?.description).toContain('点数');
      expect(card?.description).toContain('手牌上限');
    });

    it('Ectoplasm should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_ectoplasm');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('外质');
      expect(card?.description).toContain('负片');
      expect(card?.description).toContain('手牌上限');
    });

    it('Ankh should have cost 8', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_ankh');
      expect(card?.cost).toBe(8);
      expect(card?.name).toBe('生命之符');
      expect(card?.description).toContain('复制');
      expect(card?.description).toContain('摧毁');
    });

    it('Deja Vu should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_deja_vu');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('既视感');
      expect(card?.description).toContain('红色蜡封');
    });

    it('Hex should have cost 8', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_hex');
      expect(card?.cost).toBe(8);
      expect(card?.name).toBe('诅咒');
      expect(card?.description).toContain('多色');
      expect(card?.description).toContain('摧毁');
    });

    it('Trance should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_trance');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('恍惚');
      expect(card?.description).toContain('蓝色蜡封');
    });

    it('Medium should have cost 5', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_medium');
      expect(card?.cost).toBe(5);
      expect(card?.name).toBe('灵媒');
      expect(card?.description).toContain('紫色蜡封');
    });

    it('Soul should have cost 0', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_soul');
      expect(card?.cost).toBe(0);
      expect(card?.name).toBe('灵魂');
      expect(card?.description).toContain('传奇');
    });

    it('Black Hole should have cost 0', () => {
      const card = CONSUMABLES.find(c => c.id === 'spectral_black_hole');
      expect(card?.cost).toBe(0);
      expect(card?.name).toBe('黑洞');
      expect(card?.description).toContain('升级');
      expect(card?.description).toContain('牌型');
    });
  });

  // ============================================================================
  // 3.2.3 效果测试
  // ============================================================================
  describe('Effect Tests', () => {
    it('Immolate should destroy 5 random hand cards and give $20', () => {
      const immolate = CONSUMABLES.find(c => c.id === 'spectral_immolate');
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
      expect(result.affectedCards).toBeDefined();
      expect(result.affectedCards!.length).toBe(5);
    });

    it('Ghost should add Glass enhancement', () => {
      const ghost = CONSUMABLES.find(c => c.id === 'spectral_ghost');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      ghost!.use({ selectedCards: [card] });
      expect(card.enhancement).toBe(CardEnhancement.Glass);
    });

    it('Cryptid should clone a card with enhancement', () => {
      const cryptid = CONSUMABLES.find(c => c.id === 'spectral_cryptid');
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      
      const result = cryptid!.use({ selectedCards: [card] });
      expect(result.success).toBe(true);
      expect(result.newCards).toBeDefined();
      expect(result.newCards!.length).toBe(1);
      expect(result.newCards![0].suit).toBe(card.suit);
      expect(result.newCards![0].rank).toBe(card.rank);
      expect(result.newCards![0].enhancement).toBe(card.enhancement);
    });

    it('Familiar should destroy random hand card and create 3 face cards', () => {
      const familiar = CONSUMABLES.find(c => c.id === 'spectral_familiar');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Two)
      ];
      
      const result = familiar!.use({ handCards });
      expect(result.success).toBe(true);
      expect(result.newCards).toBeDefined();
      expect(result.newCards!.length).toBe(3);
      
      // Check all new cards are face cards (J, Q, K)
      const faceRanks = [Rank.Jack, Rank.Queen, Rank.King];
      for (const card of result.newCards!) {
        expect(faceRanks).toContain(card.rank);
      }
    });

    it('Grim should destroy random hand card and create 2 Aces', () => {
      const grim = CONSUMABLES.find(c => c.id === 'spectral_grim');
      const handCards = [
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Hearts, Rank.Queen)
      ];
      
      const result = grim!.use({ handCards });
      expect(result.success).toBe(true);
      expect(result.newCards).toBeDefined();
      expect(result.newCards!.length).toBe(2);
      
      // Check all new cards are Aces
      for (const card of result.newCards!) {
        expect(card.rank).toBe(Rank.Ace);
      }
    });

    it('Incantation should destroy random hand card and create 4 number cards', () => {
      const incantation = CONSUMABLES.find(c => c.id === 'spectral_incantation');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];
      
      const result = incantation!.use({ handCards });
      expect(result.success).toBe(true);
      expect(result.newCards).toBeDefined();
      expect(result.newCards!.length).toBe(4);
      
      // Check all new cards are number cards (2-10)
      const numberRanks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten];
      for (const card of result.newCards!) {
        expect(numberRanks).toContain(card.rank);
      }
    });

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

    it('Aura should add random edition', () => {
      const aura = CONSUMABLES.find(c => c.id === 'spectral_aura');
      const card = new Card(Suit.Spades, Rank.Ace);
      
      aura!.use({ selectedCards: [card] });
      expect([CardEdition.Foil, CardEdition.Holographic, CardEdition.Polychrome]).toContain(card.edition);
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

    it('Ouija should convert all hand cards to same rank and decrease hand size', () => {
      const ouija = CONSUMABLES.find(c => c.id === 'spectral_ouija');
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];
      let handSizeDecreased = false;
      const decreaseHandSize = () => { handSizeDecreased = true; };
      
      ouija!.use({ handCards, decreaseHandSize });
      
      // All cards should have the same rank now
      const firstRank = handCards[0].rank;
      for (const card of handCards) {
        expect(card.rank).toBe(firstRank);
      }
      expect(handSizeDecreased).toBe(true);
    });

    it('Wraith should return setMoney to 0', () => {
      const wraith = CONSUMABLES.find(c => c.id === 'spectral_wraith');

      const result = wraith!.use({ money: 100 });
      expect(result.success).toBe(true);
      expect(result.setMoney).toBe(0);
    });

    it('Ectoplasm should add negative edition to random joker and decrease hand size', () => {
      const ectoplasm = CONSUMABLES.find(c => c.id === 'spectral_ectoplasm');
      let handSizeDecreased = false;
      let editionAdded = false;
      const decreaseHandSize = () => { handSizeDecreased = true; };
      const addEditionToRandomJoker = () => { editionAdded = true; return true; };
      
      ectoplasm!.use({ decreaseHandSize, addEditionToRandomJoker });
      expect(handSizeDecreased).toBe(true);
      expect(editionAdded).toBe(true);
    });

    it('Ankh should copy one joker and destroy others', () => {
      const ankh = CONSUMABLES.find(c => c.id === 'spectral_ankh');
      let destroyedCount = 0;
      const destroyOtherJokers = () => { destroyedCount = 2; return 2; };
      
      const result = ankh!.use({ destroyOtherJokers });
      expect(result.success).toBe(true);
      expect(destroyedCount).toBe(2);
    });

    it('Hex should add polychrome edition and destroy other jokers', () => {
      const hex = CONSUMABLES.find(c => c.id === 'spectral_hex');
      let editionAdded = false;
      let destroyedCount = 0;
      const addEditionToRandomJoker = () => { editionAdded = true; return true; };
      const destroyOtherJokers = () => { destroyedCount = 2; return 2; };
      
      const result = hex!.use({ addEditionToRandomJoker, destroyOtherJokers });
      expect(result.success).toBe(true);
      expect(editionAdded).toBe(true);
      expect(destroyedCount).toBe(2);
    });
  });

  // ============================================================================
  // 3.2.4 使用条件测试
  // ============================================================================
  describe('Use Condition Tests', () => {
    it('Immolate should require at least 5 hand cards', () => {
      const immolate = CONSUMABLES.find(c => c.id === 'spectral_immolate');

      expect(immolate!.canUse!({ handCards: [] })).toBe(false);
      expect(immolate!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(false);
      expect(immolate!.canUse!({ handCards: [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack)
      ] })).toBe(false);
      expect(immolate!.canUse!({ handCards: [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ] })).toBe(true);
    });

    it('Ghost should require 1 selected card', () => {
      const ghost = CONSUMABLES.find(c => c.id === 'spectral_ghost');
      
      expect(ghost!.canUse!({ selectedCards: [] })).toBe(false);
      expect(ghost!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Cryptid should require 1 selected card', () => {
      const cryptid = CONSUMABLES.find(c => c.id === 'spectral_cryptid');
      
      expect(cryptid!.canUse!({ selectedCards: [] })).toBe(false);
      expect(cryptid!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Talisman should require 1 selected card', () => {
      const talisman = CONSUMABLES.find(c => c.id === 'spectral_talisman');
      
      expect(talisman!.canUse!({ selectedCards: [] })).toBe(false);
      expect(talisman!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Aura should require 1 selected card', () => {
      const aura = CONSUMABLES.find(c => c.id === 'spectral_aura');
      
      expect(aura!.canUse!({ selectedCards: [] })).toBe(false);
      expect(aura!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Deja Vu should require 1 selected card', () => {
      const dejaVu = CONSUMABLES.find(c => c.id === 'spectral_deja_vu');
      
      expect(dejaVu!.canUse!({ selectedCards: [] })).toBe(false);
      expect(dejaVu!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Trance should require 1 selected card', () => {
      const trance = CONSUMABLES.find(c => c.id === 'spectral_trance');
      
      expect(trance!.canUse!({ selectedCards: [] })).toBe(false);
      expect(trance!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Medium should require 1 selected card', () => {
      const medium = CONSUMABLES.find(c => c.id === 'spectral_medium');
      
      expect(medium!.canUse!({ selectedCards: [] })).toBe(false);
      expect(medium!.canUse!({ selectedCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Familiar should require at least 1 hand card', () => {
      const familiar = CONSUMABLES.find(c => c.id === 'spectral_familiar');
      
      expect(familiar!.canUse!({ handCards: [] })).toBe(false);
      expect(familiar!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Grim should require at least 1 hand card', () => {
      const grim = CONSUMABLES.find(c => c.id === 'spectral_grim');
      
      expect(grim!.canUse!({ handCards: [] })).toBe(false);
      expect(grim!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Incantation should require at least 1 hand card', () => {
      const incantation = CONSUMABLES.find(c => c.id === 'spectral_incantation');
      
      expect(incantation!.canUse!({ handCards: [] })).toBe(false);
      expect(incantation!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Sigil should require at least 1 hand card', () => {
      const sigil = CONSUMABLES.find(c => c.id === 'spectral_sigil');
      
      expect(sigil!.canUse!({ handCards: [] })).toBe(false);
      expect(sigil!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });

    it('Ouija should require at least 1 hand card', () => {
      const ouija = CONSUMABLES.find(c => c.id === 'spectral_ouija');
      
      expect(ouija!.canUse!({ handCards: [] })).toBe(false);
      expect(ouija!.canUse!({ handCards: [new Card(Suit.Spades, Rank.Ace)] })).toBe(true);
    });
  });

  // ============================================================================
  // 3.2.5 边界条件测试
  // ============================================================================
  describe('Edge Case Tests', () => {
    it('Cryptid should preserve enhancement when cloning', () => {
      const cryptid = CONSUMABLES.find(c => c.id === 'spectral_cryptid');
      const enhancements = [
        CardEnhancement.Bonus,
        CardEnhancement.Mult,
        CardEnhancement.Wild,
        CardEnhancement.Glass,
        CardEnhancement.Steel,
        CardEnhancement.Gold,
        CardEnhancement.Lucky,
        CardEnhancement.Stone
      ];
      
      for (const enhancement of enhancements) {
        const card = new Card(Suit.Spades, Rank.Ace, enhancement);
        const result = cryptid!.use({ selectedCards: [card] });
        expect(result.newCards![0].enhancement).toBe(enhancement);
      }
    });

    it('Familiar should create face cards with random enhancements', () => {
      const familiar = CONSUMABLES.find(c => c.id === 'spectral_familiar');
      const handCards = [new Card(Suit.Spades, Rank.Ace)];
      
      const result = familiar!.use({ handCards });
      const validEnhancements = [
        CardEnhancement.Bonus,
        CardEnhancement.Mult,
        CardEnhancement.Wild
      ];
      
      for (const card of result.newCards!) {
        expect(validEnhancements).toContain(card.enhancement);
      }
    });

    it('Grim should create Aces with random enhancements', () => {
      const grim = CONSUMABLES.find(c => c.id === 'spectral_grim');
      const handCards = [new Card(Suit.Spades, Rank.King)];
      
      const result = grim!.use({ handCards });
      const validEnhancements = [
        CardEnhancement.Bonus,
        CardEnhancement.Mult,
        CardEnhancement.Glass
      ];
      
      for (const card of result.newCards!) {
        expect(validEnhancements).toContain(card.enhancement);
      }
    });

    it('Incantation should create number cards with random enhancements', () => {
      const incantation = CONSUMABLES.find(c => c.id === 'spectral_incantation');
      const handCards = [new Card(Suit.Spades, Rank.Ace)];
      
      const result = incantation!.use({ handCards });
      const validEnhancements = [
        CardEnhancement.Bonus,
        CardEnhancement.Mult,
        CardEnhancement.Lucky
      ];
      
      for (const card of result.newCards!) {
        expect(validEnhancements).toContain(card.enhancement);
      }
    });

    it('Ouija should decrease hand size multiple times', () => {
      const ouija = CONSUMABLES.find(c => c.id === 'spectral_ouija');
      const handCards = [new Card(Suit.Spades, Rank.Ace)];
      let decreaseCount = 0;
      const decreaseHandSize = () => { decreaseCount++; };
      
      ouija!.use({ handCards, decreaseHandSize });
      ouija!.use({ handCards, decreaseHandSize });
      ouija!.use({ handCards, decreaseHandSize });
      
      expect(decreaseCount).toBe(3);
    });

    it('Ectoplasm should decrease hand size multiple times', () => {
      const ectoplasm = CONSUMABLES.find(c => c.id === 'spectral_ectoplasm');
      let decreaseCount = 0;
      const decreaseHandSize = () => { decreaseCount++; };
      const addEditionToRandomJoker = () => true;
      
      ectoplasm!.use({ decreaseHandSize, addEditionToRandomJoker });
      ectoplasm!.use({ decreaseHandSize, addEditionToRandomJoker });
      
      expect(decreaseCount).toBe(2);
    });
  });
});
