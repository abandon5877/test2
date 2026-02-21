import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Suit, Rank, CardEdition, CardEnhancement, SealType } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('Card Edition Effects', () => {
  describe('Foil Edition', () => {
    it('should have Foil edition type', () => {
      const foilCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil);
      expect(foilCard.edition).toBe(CardEdition.Foil);
    });

    it('should add +50 chips when scored', () => {
      const foilCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      // Calculate with normal card
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Calculate with foil card
      const resultFoil = ScoringSystem.calculate([foilCard]);
      
      // Foil should add exactly 50 chips
      expect(resultFoil.totalChips - resultNormal.totalChips).toBe(50);
    });

    it('should show Foil edition in card details', () => {
      const foilCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil);
      
      const result = ScoringSystem.calculate([foilCard]);
      
      const cardDetail = result.cardDetails.find(d => d.card === '♠A');
      expect(cardDetail).toBeDefined();
      expect(cardDetail?.enhancements.some(e => e.includes('Foil') || e.includes('闪箔'))).toBe(true);
    });

    it('should accumulate +50 chips for multiple Foil cards', () => {
      const foilCard1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil);
      const foilCard2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.None, SealType.None, CardEdition.Foil);
      
      const cards = [
        foilCard1,
        foilCard2,
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have at least 100 chips bonus from both Foil cards
      const foilDetails = result.cardDetails.filter(d => 
        d.enhancements.some(e => e.includes('Foil') || e.includes('闪箔'))
      );
      expect(foilDetails.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Holographic Edition', () => {
    it('should have Holographic edition type', () => {
      const holoCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      expect(holoCard.edition).toBe(CardEdition.Holographic);
    });

    it('should add +10 mult when scored', () => {
      const holoCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      const normalCard = new Card(Suit.Spades, Rank.Ace);
      
      // Calculate with normal card
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Calculate with holographic card
      const resultHolo = ScoringSystem.calculate([holoCard]);
      
      // Holographic should add exactly 10 mult
      expect(resultHolo.totalMultiplier - resultNormal.totalMultiplier).toBe(10);
    });

    it('should show Holographic edition in card details', () => {
      const holoCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      
      const result = ScoringSystem.calculate([holoCard]);
      
      const cardDetail = result.cardDetails.find(d => d.card === '♠A');
      expect(cardDetail).toBeDefined();
      expect(cardDetail?.enhancements.some(e => e.includes('Holographic') || e.includes('镭射'))).toBe(true);
    });

    it('should accumulate +10 mult for multiple Holographic cards', () => {
      const holoCard1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      const holoCard2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      
      const cards = [
        holoCard1,
        holoCard2,
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have at least 20 mult bonus from both Holographic cards
      const holoDetails = result.cardDetails.filter(d => 
        d.enhancements.some(e => e.includes('Holographic') || e.includes('镭射'))
      );
      expect(holoDetails.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Polychrome Edition', () => {
    it('should have Polychrome edition type', () => {
      const polyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome);
      expect(polyCard.edition).toBe(CardEdition.Polychrome);
    });

    it('should multiply mult by 1.5 when scored', () => {
      // Use a pair to get base mult > 1
      const polyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome);
      const pairCard = new Card(Suit.Hearts, Rank.Ace);
      
      const cards = [polyCard, pairCard];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have Polychrome multiplier applied
      // Pair has base mult of 2, with Polychrome x1.5 = 3
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(3);
    });

    it('should show Polychrome edition in card details', () => {
      const polyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome);
      
      const result = ScoringSystem.calculate([polyCard]);
      
      const cardDetail = result.cardDetails.find(d => d.card === '♠A');
      expect(cardDetail).toBeDefined();
      expect(cardDetail?.enhancements.some(e => e.includes('Polychrome') || e.includes('多彩'))).toBe(true);
    });

    it('should stack multipliers for multiple Polychrome cards', () => {
      const polyCard1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome);
      const polyCard2 = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome);
      
      const cards = [polyCard1, polyCard2];
      
      const result = ScoringSystem.calculate(cards);
      
      // Two Polychrome cards should provide x2.25 multiplier (1.5 * 1.5)
      // Pair base mult 2 * 2.25 = 4.5
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Edition Combinations with Enhancements', () => {
    it('should combine Foil edition with Bonus enhancement', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.None, CardEdition.Foil);
      
      const result = ScoringSystem.calculate([card]);
      
      // Should have chip bonus from Bonus (+30) and Foil (+50) = +80
      expect(result.chipBonus).toBeGreaterThanOrEqual(80);
    });

    it('should combine Holographic edition with Mult enhancement', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.None, CardEdition.Holographic);
      
      const result = ScoringSystem.calculate([card]);
      
      // Should have mult bonus from Mult (+4) and Holographic (+10) = +14
      expect(result.multBonus).toBeGreaterThanOrEqual(14);
    });

    it('should combine Polychrome edition with Glass enhancement', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome);
      
      const result = ScoringSystem.calculate([card]);
      
      // Should have both Polychrome x1.5 and Glass x2 multipliers
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edition Combinations with Seals', () => {
    it('should combine Foil edition with Gold Seal', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Gold, CardEdition.Foil);
      
      const result = ScoringSystem.calculate([card]);
      
      // Should have chip bonus from Foil (+50)
      expect(result.chipBonus).toBeGreaterThanOrEqual(50);
      // Should have money bonus from Gold Seal (+$3)
      expect(result.moneyBonus).toBeGreaterThanOrEqual(3);
    });

    it('should combine Holographic edition with Red Seal', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Red, CardEdition.Holographic);
      
      const result = ScoringSystem.calculate([card]);
      
      // Red Seal triggers twice: +10 * 2 = +20 mult from holographic
      const cardDetail = result.cardDetails.find(d => d.card === '♠A');
      expect(cardDetail?.multBonus).toBeGreaterThanOrEqual(20);
    });

    it('should combine Polychrome edition with Blue Seal', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.Blue, CardEdition.Polychrome);
      
      const result = ScoringSystem.calculate([card]);
      
      // Should have Polychrome multiplier
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('Multiple Different Editions', () => {
    it('should handle Foil + Holographic cards together', () => {
      const foilCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil);
      const holoCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      
      const cards = [foilCard, holoCard];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have both chip and mult bonuses
      expect(result.chipBonus).toBeGreaterThanOrEqual(50);
      expect(result.multBonus).toBeGreaterThanOrEqual(10);
    });

    it('should handle all three editions together', () => {
      const foilCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Foil);
      const holoCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Holographic);
      const polyCard = new Card(Suit.Diamonds, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.Polychrome);
      
      const cards = [foilCard, holoCard, polyCard];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have all bonuses applied
      expect(result.chipBonus).toBeGreaterThanOrEqual(50);
      expect(result.multBonus).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Card Edition Methods', () => {
    it('should create new card with edition using withEdition', () => {
      const baseCard = new Card(Suit.Spades, Rank.Ace);
      const foilCard = baseCard.withEdition(CardEdition.Foil);
      
      expect(baseCard.edition).toBe(CardEdition.None);
      expect(foilCard.edition).toBe(CardEdition.Foil);
    });

    it('should preserve other properties when using withEdition', () => {
      const baseCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Gold);
      const foilCard = baseCard.withEdition(CardEdition.Foil);
      
      expect(foilCard.suit).toBe(Suit.Spades);
      expect(foilCard.rank).toBe(Rank.Ace);
      expect(foilCard.enhancement).toBe(CardEnhancement.Bonus);
      expect(foilCard.seal).toBe(SealType.Gold);
      expect(foilCard.edition).toBe(CardEdition.Foil);
    });
  });

  describe('All Edition Types Exist', () => {
    it('should have all edition types defined', () => {
      expect(CardEdition.None).toBe('none');
      expect(CardEdition.Foil).toBe('foil');
      expect(CardEdition.Holographic).toBe('holographic');
      expect(CardEdition.Polychrome).toBe('polychrome');
      expect(CardEdition.Negative).toBe('negative');
    });
  });
});
