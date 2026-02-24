import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { Suit, Rank, SealType, CardEnhancement } from '../types/card';
import { SealSystem, SealEffectResult } from '../systems/SealSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { PokerHandType } from '../types/pokerHands';

// Note: PokerHandType uses 'OnePair' not 'Pair'
const PAIR_HAND_TYPE = PokerHandType.OnePair;

describe('Seal System', () => {
  describe('Gold Seal', () => {
    it('should give $3 when card is played and scored', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Gold;

      const result = SealSystem.calculateSealEffects(card, true, false);

      expect(result.moneyBonus).toBe(3);
    });

    it('should not give money when card is not played', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Gold;

      const result = SealSystem.calculateSealEffects(card, false, false);

      expect(result.moneyBonus).toBe(0);
    });

    it('should not give money when card is discarded', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Gold;

      const result = SealSystem.calculateSealEffects(card, false, true);

      expect(result.moneyBonus).toBe(0);
    });

    it('should accumulate money bonus for multiple Gold Seal cards', () => {
      const cards = [
        Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Gold }),
        Object.assign(new Card(Suit.Hearts, Rank.King), { seal: SealType.Gold }),
        Object.assign(new Card(Suit.Diamonds, Rank.Queen), { seal: SealType.Gold })
      ];

      const result = SealSystem.calculateSealsForCards(cards, true, false);

      expect(result.totalMoneyBonus).toBe(9); // 3 cards × $3
    });

    it('should include Gold Seal money in score result', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Gold;

      const scoreResult = ScoringSystem.calculate([card]);

      expect(scoreResult.moneyBonus).toBe(3);
    });

    it('should have correct description', () => {
      const description = SealSystem.getSealDescription(SealType.Gold);
      expect(description).toContain('黄金蜡封');
      expect(description).toContain('获得$3');
    });
  });

  describe('Red Seal', () => {
    it('should set retrigger count to 2', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Red;

      const result = SealSystem.calculateSealEffects(card, true, false);

      expect(result.retriggerCount).toBe(2);
    });

    it('should retrigger regardless of play status', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Red;

      const resultPlayed = SealSystem.calculateSealEffects(card, true, false);
      const resultNotPlayed = SealSystem.calculateSealEffects(card, false, false);
      const resultDiscarded = SealSystem.calculateSealEffects(card, false, true);

      expect(resultPlayed.retriggerCount).toBe(2);
      expect(resultNotPlayed.retriggerCount).toBe(2);
      expect(resultDiscarded.retriggerCount).toBe(2);
    });

    it('should double card chip contribution in scoring', () => {
      const card = new Card(Suit.Spades, Rank.Ace); // 11 chips
      card.seal = SealType.Red;

      const scoreResult = ScoringSystem.calculate([card]);

      // Base: 5 (high card) + 11 (card) = 16
      // With Red Seal: 5 + 11*2 = 27 chips
      expect(scoreResult.totalChips).toBe(27);
    });

    it('should double enhancement effects with Red Seal', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus); // +30 chips
      card.seal = SealType.Red;

      const scoreResult = ScoringSystem.calculate([card]);

      // Base: 5 (high card) + 11 (card) + 30 (bonus) = 46
      // With Red Seal: 5 + (11+30)*2 = 5 + 82 = 87 chips
      expect(scoreResult.totalChips).toBe(87);
    });

    it('should track retrigger cards correctly', () => {
      const cards = [
        Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Red }),
        new Card(Suit.Hearts, Rank.King),
        Object.assign(new Card(Suit.Diamonds, Rank.Queen), { seal: SealType.Red })
      ];

      const result = SealSystem.calculateSealsForCards(cards, true, false);

      expect(result.retriggerCards.size).toBe(2);
      expect(result.retriggerCards.get(cards[0])).toBe(2);
      expect(result.retriggerCards.get(cards[2])).toBe(2);
    });

    it('should have correct description', () => {
      const description = SealSystem.getSealDescription(SealType.Red);
      expect(description).toContain('红色蜡封');
      expect(description).toContain('触发两次');
    });
  });

  describe('Blue Seal', () => {
    it('should generate planet when card is held (not played or discarded)', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Blue;

      const result = SealSystem.calculateSealEffects(card, false, false, PAIR_HAND_TYPE);

      expect(result.generatePlanet).toBe(true);
      expect(result.planetHandType).toBe(PAIR_HAND_TYPE);
    });

    it('should not generate planet when card is played', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Blue;

      const result = SealSystem.calculateSealEffects(card, true, false, PAIR_HAND_TYPE);

      expect(result.generatePlanet).toBe(false);
    });

    it('should not generate planet when card is discarded', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Blue;

      const result = SealSystem.calculateSealEffects(card, false, true, PAIR_HAND_TYPE);

      expect(result.generatePlanet).toBe(false);
    });

    it('should not generate planet when no hand type is provided', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Blue;

      const result = SealSystem.calculateSealEffects(card, false, false);

      expect(result.generatePlanet).toBe(false);
    });

    it('should track correct hand type for planet generation', () => {
      const handTypes = [
        PokerHandType.HighCard,
        PokerHandType.OnePair,
        PokerHandType.TwoPair,
        PokerHandType.ThreeOfAKind,
        PokerHandType.Straight,
        PokerHandType.Flush,
        PokerHandType.FullHouse,
        PokerHandType.FourOfAKind,
        PokerHandType.StraightFlush
      ];

      for (const handType of handTypes) {
        // Create a new card for each iteration to avoid any state issues
        const card = new Card(Suit.Spades, Rank.Ace);
        card.seal = SealType.Blue;
        const result = SealSystem.calculateSealEffects(card, false, false, handType);
        expect(result.generatePlanet).toBe(true);
        expect(result.planetHandType).toBe(handType);
      }
    });

    it('should have correct description', () => {
      const description = SealSystem.getSealDescription(SealType.Blue);
      expect(description).toContain('蓝色蜡封');
      expect(description).toContain('星球牌');
    });
  });

  describe('Purple Seal', () => {
    it('should generate tarot when card is discarded', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Purple;

      const result = SealSystem.calculateSealEffects(card, false, true);

      expect(result.generateTarot).toBe(true);
    });

    it('should not generate tarot when card is played', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Purple;

      const result = SealSystem.calculateSealEffects(card, true, false);

      expect(result.generateTarot).toBe(false);
    });

    it('should not generate tarot when card is held', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Purple;

      const result = SealSystem.calculateSealEffects(card, false, false);

      expect(result.generateTarot).toBe(false);
    });

    it('should track tarot generation for multiple discarded cards', () => {
      const cards = [
        Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Purple }),
        new Card(Suit.Hearts, Rank.King),
        Object.assign(new Card(Suit.Diamonds, Rank.Queen), { seal: SealType.Purple })
      ];

      const result = SealSystem.calculateSealsForCards(cards, false, true);

      expect(result.tarotCount).toBe(2); // 两张紫色蜡封应该生成2张塔罗牌
    });

    it('should have correct description', () => {
      const description = SealSystem.getSealDescription(SealType.Purple);
      expect(description).toContain('紫色蜡封');
      expect(description).toContain('塔罗牌');
    });
  });

  describe('No Seal', () => {
    it('should have no effects when card has no seal', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      // seal defaults to SealType.None

      const result = SealSystem.calculateSealEffects(card, true, false);

      expect(result.moneyBonus).toBe(0);
      expect(result.retriggerCount).toBe(1);
      expect(result.generatePlanet).toBe(false);
      expect(result.generateTarot).toBe(false);
    });

    it('should return empty description for None seal', () => {
      const description = SealSystem.getSealDescription(SealType.None);
      expect(description).toBe('');
    });
  });

  describe('Seal Combinations', () => {
    it('should handle Gold + Red Seal combination on different cards', () => {
      const goldCard = Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Gold });
      const redCard = Object.assign(new Card(Suit.Hearts, Rank.King), { seal: SealType.Red });

      const result = SealSystem.calculateSealsForCards([goldCard, redCard], true, false);

      expect(result.totalMoneyBonus).toBe(3);
      expect(result.retriggerCards.size).toBe(1);
      expect(result.retriggerCards.get(redCard)).toBe(2);
    });

    it('should handle multiple seals in same calculation', () => {
      const cards = [
        Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Gold }),
        Object.assign(new Card(Suit.Hearts, Rank.King), { seal: SealType.Red }),
        Object.assign(new Card(Suit.Diamonds, Rank.Queen), { seal: SealType.Gold }),
        Object.assign(new Card(Suit.Clubs, Rank.Jack), { seal: SealType.Red })
      ];

      const result = SealSystem.calculateSealsForCards(cards, true, false);

      expect(result.totalMoneyBonus).toBe(6); // 2 Gold seals × $3
      expect(result.retriggerCards.size).toBe(2); // 2 Red seals
    });

    it('should handle Blue and Purple seals on held vs discarded cards', () => {
      const blueCard = Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Blue });
      const purpleCard = Object.assign(new Card(Suit.Hearts, Rank.King), { seal: SealType.Purple });

      // Blue card held, Purple card discarded
      const heldResult = SealSystem.calculateSealsForCards(
        [blueCard, purpleCard],
        false,
        false,
        PAIR_HAND_TYPE
      );
      expect(heldResult.planetCount).toBe(1);
      expect(heldResult.tarotCount).toBe(0);

      // Purple card discarded
      const discardResult = SealSystem.calculateSealsForCards(
        [blueCard, purpleCard],
        false,
        true,
        PAIR_HAND_TYPE
      );
      expect(discardResult.planetCount).toBe(0); // Blue not triggered when discarded
      expect(discardResult.tarotCount).toBe(1);
    });
  });

  describe('Seal with Card Enhancements', () => {
    it('Gold Seal with Bonus enhancement should give both money and chips', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      card.seal = SealType.Gold;

      const sealResult = SealSystem.calculateSealEffects(card, true, false);
      const scoreResult = ScoringSystem.calculate([card]);

      expect(sealResult.moneyBonus).toBe(3);
      expect(scoreResult.moneyBonus).toBe(3);
      // Bonus adds +30 chips
      expect(scoreResult.totalChips).toBeGreaterThan(16); // Base 5 + 11 + 30 = 46
    });

    it('Red Seal with Mult enhancement should double the mult bonus', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult);
      card.seal = SealType.Red;

      const scoreResult = ScoringSystem.calculate([card]);

      // Mult adds +4 mult, doubled by Red Seal = +8
      // Base mult 1 + 8 = 9
      expect(scoreResult.totalMultiplier).toBe(9);
    });

    it('Red Seal with Lucky enhancement should trigger twice', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Lucky);
      card.seal = SealType.Red;

      const scoreResult = ScoringSystem.calculate([card]);

      // Card should be in card details with retrigger
      const cardDetail = scoreResult.cardDetails.find(d => d.card.includes('A'));
      expect(cardDetail).toBeDefined();
      expect(cardDetail?.enhancements.some(e => e.includes('红色蜡封') || e.includes('触发两次'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty card array', () => {
      const result = SealSystem.calculateSealsForCards([], true, false);

      expect(result.totalMoneyBonus).toBe(0);
      expect(result.retriggerCards.size).toBe(0);
      expect(result.planetCount).toBe(0);
      expect(result.tarotCount).toBe(0);
    });

    it('should handle all seal types on different cards simultaneously', () => {
      const cards = [
        Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Gold }),
        Object.assign(new Card(Suit.Hearts, Rank.King), { seal: SealType.Red }),
        Object.assign(new Card(Suit.Diamonds, Rank.Queen), { seal: SealType.Blue }),
        Object.assign(new Card(Suit.Clubs, Rank.Jack), { seal: SealType.Purple })
      ];

      // All played
      const playedResult = SealSystem.calculateSealsForCards(cards, true, false, PAIR_HAND_TYPE);
      expect(playedResult.totalMoneyBonus).toBe(3);
      expect(playedResult.retriggerCards.size).toBe(1);
      expect(playedResult.planetCount).toBe(0);
      expect(playedResult.tarotCount).toBe(0);

      // All discarded
      const discardedResult = SealSystem.calculateSealsForCards(cards, false, true, PAIR_HAND_TYPE);
      expect(discardedResult.totalMoneyBonus).toBe(0);
      expect(discardedResult.retriggerCards.size).toBe(1);
      expect(discardedResult.planetCount).toBe(0);
      expect(discardedResult.tarotCount).toBe(1);

      // All held
      const heldResult = SealSystem.calculateSealsForCards(cards, false, false, PAIR_HAND_TYPE);
      expect(heldResult.totalMoneyBonus).toBe(0);
      expect(heldResult.retriggerCards.size).toBe(1);
      expect(heldResult.planetCount).toBe(1);
      expect(heldResult.tarotCount).toBe(0);
    });

    it('should not double count seal effects', () => {
      const card = Object.assign(new Card(Suit.Spades, Rank.Ace), { seal: SealType.Gold });

      // Calculate twice to ensure no state mutation
      const result1 = SealSystem.calculateSealEffects(card, true, false);
      const result2 = SealSystem.calculateSealEffects(card, true, false);

      expect(result1.moneyBonus).toBe(3);
      expect(result2.moneyBonus).toBe(3);
    });

    it('should handle card with all possible attributes', () => {
      const card = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      card.seal = SealType.Red;
      // Note: edition is readonly, so we can't set it directly in test
      // But we can verify the seal works with enhancement

      const sealResult = SealSystem.calculateSealEffects(card, true, false);

      expect(sealResult.retriggerCount).toBe(2);
      expect(sealResult.moneyBonus).toBe(0); // Red seal doesn't give money
    });
  });

  describe('Integration with ScoringSystem', () => {
    it('should correctly integrate Gold Seal in full scoring', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
        new Card(Suit.Spades, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      cards[0].seal = SealType.Gold; // Ace has Gold Seal

      const result = ScoringSystem.calculate(cards);

      expect(result.moneyBonus).toBe(3);
      expect(result.handType).toBe(PokerHandType.RoyalFlush);
    });

    it('should correctly integrate Red Seal in full scoring', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace),
        new Card(Suit.Clubs, Rank.Ace),
        new Card(Suit.Spades, Rank.Two)
      ];
      cards[0].seal = SealType.Red; // First Ace has Red Seal

      const result = ScoringSystem.calculate(cards);

      // Four of a Kind with one Red Seal card
      // The Red Seal card should contribute double
      const cardDetail = result.cardDetails.find(d => d.card.includes('♠A'));
      expect(cardDetail?.enhancements.some(e => e.includes('红色蜡封'))).toBe(true);
    });

    it('should show seal effects in card details', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      card.seal = SealType.Gold;

      const result = ScoringSystem.calculate([card]);

      const cardDetail = result.cardDetails[0];
      expect(cardDetail.enhancements.some(e => e.includes('Gold Seal'))).toBe(true);
    });
  });
});
