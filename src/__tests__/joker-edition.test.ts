import { describe, it, expect } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { Joker } from '../models/Joker';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Card } from '../models/Card';
import { JokerEdition, JokerRarity, JokerTrigger } from '../types/joker';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('Joker Edition Effects', () => {
  // Helper function to create a basic joker
  const createBasicJoker = (edition: JokerEdition = JokerEdition.None): Joker => {
    return new Joker({
      id: 'test_joker',
      name: 'Test Joker',
      description: 'A test joker',
      rarity: JokerRarity.COMMON,
      cost: 2,
      trigger: JokerTrigger.ON_PLAY,
      effect: () => ({}),
      edition
    });
  };

  describe('Foil Edition', () => {
    it('should have Foil edition type', () => {
      const foilJoker = createBasicJoker(JokerEdition.Foil);
      expect(foilJoker.edition).toBe(JokerEdition.Foil);
    });

    it('should return correct edition effects for Foil', () => {
      const foilJoker = createBasicJoker(JokerEdition.Foil);
      const effects = foilJoker.getEditionEffects();
      
      expect(effects.chipBonus).toBe(50);
      expect(effects.multBonus).toBe(0);
      expect(effects.multMultiplier).toBe(1);
      expect(effects.extraSlot).toBe(false);
    });

    it('should add +50 chips to score calculation', () => {
      const jokerSlots = new JokerSlots(5);
      const foilJoker = createBasicJoker(JokerEdition.Foil);
      jokerSlots.addJoker(foilJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Should have +50 chips from Foil edition
      expect(finalResult.totalChips).toBe(baseResult.totalChips + 50);
      
      // Should have joker effect recorded
      const foilEffect = finalResult.jokerEffects.find(e => e.effect.includes('闪箔') || e.effect.includes('Foil'));
      expect(foilEffect).toBeDefined();
      expect(foilEffect?.chipBonus).toBe(50);
    });
  });

  describe('Holographic Edition', () => {
    it('should have Holographic edition type', () => {
      const holoJoker = createBasicJoker(JokerEdition.Holographic);
      expect(holoJoker.edition).toBe(JokerEdition.Holographic);
    });

    it('should return correct edition effects for Holographic', () => {
      const holoJoker = createBasicJoker(JokerEdition.Holographic);
      const effects = holoJoker.getEditionEffects();
      
      expect(effects.chipBonus).toBe(0);
      expect(effects.multBonus).toBe(10);
      expect(effects.multMultiplier).toBe(1);
      expect(effects.extraSlot).toBe(false);
    });

    it('should add +10 mult to score calculation', () => {
      const jokerSlots = new JokerSlots(5);
      const holoJoker = createBasicJoker(JokerEdition.Holographic);
      jokerSlots.addJoker(holoJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Should have +10 mult from Holographic edition
      expect(finalResult.totalMultiplier).toBe(baseResult.totalMultiplier + 10);
      
      // Should have joker effect recorded
      const holoEffect = finalResult.jokerEffects.find(e => e.effect.includes('全息') || e.effect.includes('Holographic'));
      expect(holoEffect).toBeDefined();
      expect(holoEffect?.multBonus).toBe(10);
    });
  });

  describe('Polychrome Edition', () => {
    it('should have Polychrome edition type', () => {
      const polyJoker = createBasicJoker(JokerEdition.Polychrome);
      expect(polyJoker.edition).toBe(JokerEdition.Polychrome);
    });

    it('should return correct edition effects for Polychrome', () => {
      const polyJoker = createBasicJoker(JokerEdition.Polychrome);
      const effects = polyJoker.getEditionEffects();
      
      expect(effects.chipBonus).toBe(0);
      expect(effects.multBonus).toBe(0);
      expect(effects.multMultiplier).toBe(1.5);
      expect(effects.extraSlot).toBe(false);
    });

    it('should multiply mult by 1.5 in score calculation', () => {
      const jokerSlots = new JokerSlots(5);
      const polyJoker = createBasicJoker(JokerEdition.Polychrome);
      jokerSlots.addJoker(polyJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Should have x1.5 mult multiplier from Polychrome edition
      // Base mult is 1, so final should be 1 * 1.5 = 1.5
      expect(finalResult.totalMultiplier).toBe(1.5);
      
      // Should have joker effect recorded
      const polyEffect = finalResult.jokerEffects.find(e => e.effect.includes('多彩') || e.effect.includes('Polychrome'));
      expect(polyEffect).toBeDefined();
      expect(polyEffect?.multMultiplier).toBe(1.5);
    });

    it('should stack multipliers for multiple Polychrome jokers', () => {
      const jokerSlots = new JokerSlots(5);
      const polyJoker1 = createBasicJoker(JokerEdition.Polychrome);
      const polyJoker2 = createBasicJoker(JokerEdition.Polychrome);
      jokerSlots.addJoker(polyJoker1);
      jokerSlots.addJoker(polyJoker2);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Two Polychrome jokers should provide x2.25 multiplier (1.5 * 1.5)
      expect(finalResult.totalMultiplier).toBe(2.25);
    });
  });

  describe('Negative Edition', () => {
    it('should have Negative edition type', () => {
      const negJoker = createBasicJoker(JokerEdition.Negative);
      expect(negJoker.edition).toBe(JokerEdition.Negative);
    });

    it('should return correct edition effects for Negative', () => {
      const negJoker = createBasicJoker(JokerEdition.Negative);
      const effects = negJoker.getEditionEffects();
      
      expect(effects.chipBonus).toBe(0);
      expect(effects.multBonus).toBe(0);
      expect(effects.multMultiplier).toBe(1);
      expect(effects.extraSlot).toBe(true);
    });

    it('should not add chips or mult to score calculation', () => {
      const jokerSlots = new JokerSlots(5);
      const negJoker = createBasicJoker(JokerEdition.Negative);
      jokerSlots.addJoker(negJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Negative edition should not affect score
      expect(finalResult.totalChips).toBe(baseResult.totalChips);
      expect(finalResult.totalMultiplier).toBe(baseResult.totalMultiplier);
    });

    it('should provide extra slot capability', () => {
      const negJoker = createBasicJoker(JokerEdition.Negative);
      const effects = negJoker.getEditionEffects();
      
      // Negative edition provides extra slot capability
      expect(effects.extraSlot).toBe(true);
    });
  });

  describe('Multiple Edition Jokers', () => {
    it('should combine Foil and Holographic jokers', () => {
      const jokerSlots = new JokerSlots(5);
      const foilJoker = createBasicJoker(JokerEdition.Foil);
      const holoJoker = createBasicJoker(JokerEdition.Holographic);
      jokerSlots.addJoker(foilJoker);
      jokerSlots.addJoker(holoJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Should have +50 chips and +10 mult
      expect(finalResult.totalChips).toBe(baseResult.totalChips + 50);
      expect(finalResult.totalMultiplier).toBe(baseResult.totalMultiplier + 10);
    });

    it('should combine all three score-affecting editions', () => {
      const jokerSlots = new JokerSlots(5);
      const foilJoker = createBasicJoker(JokerEdition.Foil);
      const holoJoker = createBasicJoker(JokerEdition.Holographic);
      const polyJoker = createBasicJoker(JokerEdition.Polychrome);
      jokerSlots.addJoker(foilJoker);
      jokerSlots.addJoker(holoJoker);
      jokerSlots.addJoker(polyJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Should have +50 chips
      expect(finalResult.totalChips).toBe(baseResult.totalChips + 50);
      // Should have +10 mult multiplied by 1.5 = (1 + 10) * 1.5 = 16.5
      expect(finalResult.totalMultiplier).toBe((baseResult.totalMultiplier + 10) * 1.5);
    });
  });

  describe('Joker Edition Methods', () => {
    it('should set edition using setEdition', () => {
      const joker = createBasicJoker(JokerEdition.None);
      expect(joker.edition).toBe(JokerEdition.None);
      
      joker.setEdition(JokerEdition.Foil);
      expect(joker.edition).toBe(JokerEdition.Foil);
    });

    it('should preserve other properties when changing edition', () => {
      const joker = createBasicJoker(JokerEdition.None);
      const originalId = joker.id;
      const originalName = joker.name;
      
      joker.setEdition(JokerEdition.Holographic);
      
      expect(joker.id).toBe(originalId);
      expect(joker.name).toBe(originalName);
      expect(joker.edition).toBe(JokerEdition.Holographic);
    });

    it('should clone joker with edition', () => {
      const original = createBasicJoker(JokerEdition.Foil);
      const cloned = original.clone();
      
      expect(cloned.edition).toBe(JokerEdition.Foil);
      expect(cloned).not.toBe(original);
    });
  });

  describe('Joker Edition with Joker Effects', () => {
    it('should combine Foil edition with joker chip bonus', () => {
      const jokerSlots = new JokerSlots(5);
      
      // Create a joker that gives +100 chips
      const chipJoker = new Joker({
        id: 'chip_joker',
        name: 'Chip Joker',
        description: 'Gives +100 chips',
        rarity: JokerRarity.COMMON,
        cost: 2,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({ chipBonus: 100 }),
        edition: JokerEdition.Foil
      });
      
      jokerSlots.addJoker(chipJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Should have +100 from joker effect +50 from Foil edition
      expect(finalResult.totalChips).toBe(baseResult.totalChips + 150);
    });

    it('should combine Polychrome edition with joker mult bonus', () => {
      const jokerSlots = new JokerSlots(5);
      
      // Create a joker that gives +20 mult
      const multJoker = new Joker({
        id: 'mult_joker',
        name: 'Mult Joker',
        description: 'Gives +20 mult',
        rarity: JokerRarity.COMMON,
        cost: 2,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({ multBonus: 20 }),
        edition: JokerEdition.Polychrome
      });
      
      jokerSlots.addJoker(multJoker);
      
      const card = new Card(Suit.Spades, Rank.Ace);
      const baseResult = ScoringSystem.calculate([card], undefined, undefined, []);
      
      const finalResult = JokerSystem.calculateFinalScore(jokerSlots, baseResult,
        [card],
        PokerHandType.HighCard);
      
      // Should have (base + 20) * 1.5 from Polychrome
      // base mult is 1, so (1 + 20) * 1.5 = 31.5
      const expectedMult = (baseResult.totalMultiplier + 20) * 1.5;
      expect(finalResult.totalMultiplier).toBeCloseTo(expectedMult, 1);
    });
  });

  describe('All Joker Edition Types Exist', () => {
    it('should have all joker edition types defined', () => {
      expect(JokerEdition.None).toBe('none');
      expect(JokerEdition.Foil).toBe('foil');
      expect(JokerEdition.Holographic).toBe('holographic');
      expect(JokerEdition.Polychrome).toBe('polychrome');
      expect(JokerEdition.Negative).toBe('negative');
    });
  });

  describe('Joker Edition Config', () => {
    it('should accept edition in joker config', () => {
      const joker = new Joker({
        id: 'edition_test',
        name: 'Edition Test',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 2,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        edition: JokerEdition.Foil
      });
      
      expect(joker.edition).toBe(JokerEdition.Foil);
    });

    it('should default to None edition when not specified', () => {
      const joker = new Joker({
        id: 'no_edition',
        name: 'No Edition',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 2,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({})
      });
      
      expect(joker.edition).toBe(JokerEdition.None);
    });
  });
});
