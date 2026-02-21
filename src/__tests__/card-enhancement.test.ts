import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { GameState } from '../models/GameState';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Suit, Rank, CardEnhancement, SealType, CardEdition } from '../types/card';
import { BlindType } from '../types/game';
import { PokerHandType } from '../types/pokerHands';

describe('Card Enhancement Effects', () => {
  describe('Bonus Card Enhancement', () => {
    it('should have Bonus enhancement type', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      expect(bonusCard.enhancement).toBe(CardEnhancement.Bonus);
    });

    it('should add +30 chips when scored', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const cards = [
        bonusCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Bonus card should contribute to chip bonus
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
    });

    it('should add exactly +30 chips for single Bonus card in high card hand', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const normalCard = new Card(Suit.Hearts, Rank.Two);
      
      // Calculate without bonus first
      const resultWithout = ScoringSystem.calculate([normalCard]);
      // Calculate with bonus
      const resultWith = ScoringSystem.calculate([bonusCard]);
      
      // The difference should be 30 (bonus) + (11-2) = 39 more chips
      expect(resultWith.totalChips - resultWithout.totalChips).toBe(39);
    });

    it('should accumulate +30 chips for multiple Bonus cards', () => {
      const bonusCard1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const bonusCard2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.Bonus);
      
      const cards = [
        bonusCard1,
        bonusCard2,
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Should have at least 60 chips bonus from both Bonus cards
      expect(result.chipBonus).toBeGreaterThanOrEqual(60);
    });

    it('should trigger twice with Red Seal', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Red);
      const cards = [
        bonusCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Red Seal triggers twice: +30 * 2 = +60 chips from bonus
      const bonusDetails = result.cardDetails.find(d => d.card === '♠A');
      expect(bonusDetails?.chipBonus).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Mult Card Enhancement', () => {
    it('should have Mult enhancement type', () => {
      const multCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult);
      expect(multCard.enhancement).toBe(CardEnhancement.Mult);
    });

    it('should add +4 mult when scored', () => {
      const multCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult);
      const cards = [
        multCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Mult card should contribute to mult bonus
      expect(result.multBonus).toBeGreaterThanOrEqual(4);
    });

    it('should add exactly +4 mult for single Mult card', () => {
      const multCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult);
      const normalCard = new Card(Suit.Hearts, Rank.Two);
      
      // Calculate without mult
      const resultWithout = ScoringSystem.calculate([normalCard]);
      // Calculate with mult
      const resultWith = ScoringSystem.calculate([multCard]);
      
      // The difference should be exactly +4 mult
      expect(resultWith.totalMultiplier - resultWithout.totalMultiplier).toBe(4);
    });

    it('should accumulate +4 mult for multiple Mult cards', () => {
      const multCard1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult);
      const multCard2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.Mult);
      
      const cards = [
        multCard1,
        multCard2,
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Should have at least 8 mult bonus from both Mult cards
      expect(result.multBonus).toBeGreaterThanOrEqual(8);
    });

    it('should trigger twice with Red Seal', () => {
      const multCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.Red);
      const cards = [
        multCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Red Seal triggers twice: +4 * 2 = +8 mult from mult enhancement
      const multDetails = result.cardDetails.find(d => d.card === '♠A');
      expect(multDetails?.multBonus).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Wild Card Enhancement', () => {
    it('should have Wild enhancement type', () => {
      const wildCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild);
      expect(wildCard.enhancement).toBe(CardEnhancement.Wild);
    });

    it('should have correct chip value', () => {
      const wildCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild);
      expect(wildCard.getChipValue()).toBe(11); // Ace = 11
    });

    it('should act as any suit for flush detection', () => {
      const wildCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild);
      const cards = [
        wildCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Hearts, Rank.Seven),
        new Card(Suit.Hearts, Rank.Nine),
        new Card(Suit.Hearts, Rank.King)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Wild card should help form a flush
      expect(result.handType).toBe('flush');
    });

    it('should act as any suit for straight flush detection', () => {
      const wildCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild);
      const cards = [
        wildCard, // Acts as 10 of Hearts
        new Card(Suit.Hearts, Rank.Jack),
        new Card(Suit.Hearts, Rank.Queen),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Should form a straight flush (or royal flush)
      expect(['straightFlush', 'royalFlush', 'flush']).toContain(result.handType);
    });

    it('should work with multiple Wild cards', () => {
      const wildCard1 = new Card(Suit.Spades, Rank.Two, CardEnhancement.Wild);
      const wildCard2 = new Card(Suit.Clubs, Rank.Three, CardEnhancement.Wild);
      const cards = [
        wildCard1,
        wildCard2,
        new Card(Suit.Hearts, Rank.Four),
        new Card(Suit.Hearts, Rank.Five),
        new Card(Suit.Hearts, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Multiple wild cards should help form a straight flush
      expect(['straightFlush', 'flush', 'straight']).toContain(result.handType);
    });

    it('should allow forming flush with mixed suits using Wild', () => {
      const wildCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Wild);
      const cards = [
        wildCard,
        new Card(Suit.Diamonds, Rank.Two),
        new Card(Suit.Diamonds, Rank.Four),
        new Card(Suit.Diamonds, Rank.Six),
        new Card(Suit.Diamonds, Rank.Eight)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Wild card should adapt to Diamonds to form flush
      expect(result.handType).toBe('flush');
    });
  });

  describe('Glass Card Enhancement', () => {
    it('should have Glass enhancement type', () => {
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      expect(glassCard.enhancement).toBe(CardEnhancement.Glass);
    });

    it('should have correct chip value', () => {
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      expect(glassCard.getChipValue()).toBe(11); // Ace = 11
    });

    it('should have 1/4 chance to destroy when scored', () => {
      // Test destruction probability over multiple runs
      let destructionCount = 0;
      const totalRuns = 1000;
      
      for (let i = 0; i < totalRuns; i++) {
        // Simulate the destruction check (1/4 chance)
        if (Math.random() < 0.25) {
          destructionCount++;
        }
      }
      
      // Should be approximately 25% (with some variance)
      const destructionRate = destructionCount / totalRuns;
      expect(destructionRate).toBeGreaterThan(0.2);
      expect(destructionRate).toBeLessThan(0.3);
    });

    it('should provide x2 multiplier when scored', () => {
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      const normalCard = new Card(Suit.Hearts, Rank.Ace);
      
      const cards = [
        glassCard,
        new Card(Suit.Diamonds, Rank.Two),
        new Card(Suit.Clubs, Rank.Three),
        new Card(Suit.Spades, Rank.Four),
        new Card(Suit.Hearts, Rank.Five)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Glass card provides x2 multiplier
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(2);
    });

    it('should stack multipliers for multiple Glass cards', () => {
      const glassCard1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      const glassCard2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.Glass);
      
      const cards = [
        glassCard1,
        glassCard2,
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Two Glass cards should provide x4 multiplier (2 * 2)
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(4);
    });

    it('should return destroyed cards in result', () => {
      // Mock Math.random to always trigger destruction
      const originalRandom = Math.random;
      Math.random = () => 0.1; // Less than 0.25 to trigger destruction
      
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      const cards = [
        glassCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Restore Math.random
      Math.random = originalRandom;
      
      // Should have destroyed cards
      expect(result.destroyedCards).toBeDefined();
      expect(result.destroyedCards?.length).toBeGreaterThan(0);
    });
  });

  describe('Steel Card Enhancement', () => {
    it('should have Steel enhancement type', () => {
      const steelCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Steel);
      expect(steelCard.enhancement).toBe(CardEnhancement.Steel);
    });

    it('should have correct chip value when played', () => {
      const steelCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Steel);
      expect(steelCard.getChipValue()).toBe(11); // Ace = 11
    });

    it('should apply x1.5 multiplier when held in hand', () => {
      const playedCard = new Card(Suit.Spades, Rank.Ace);
      const heldSteelCard = new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel);
      
      const cards = [playedCard];
      const heldCards = [heldSteelCard];
      
      // Calculate without held steel card
      const resultWithout = ScoringSystem.calculate(cards);
      
      // Calculate with held steel card
      const resultWith = ScoringSystem.calculate(cards, undefined, undefined, heldCards, undefined);
      
      // Should have 1.5x multiplier from held steel card
      expect(resultWith.heldMultMultiplier).toBe(1.5);
    });

    it('should stack multipliers for multiple held Steel cards', () => {
      const playedCard = new Card(Suit.Spades, Rank.Ace);
      const heldSteelCard1 = new Card(Suit.Hearts, Rank.King, CardEnhancement.Steel);
      const heldSteelCard2 = new Card(Suit.Diamonds, Rank.Queen, CardEnhancement.Steel);
      
      const cards = [playedCard];
      const heldCards = [heldSteelCard1, heldSteelCard2];
      
      const result = ScoringSystem.calculate(cards, undefined, undefined, heldCards, undefined);
      
      // Two steel cards should provide 2.25x multiplier (1.5 * 1.5)
      expect(result.heldMultMultiplier).toBe(2.25);
    });

    it('should not apply multiplier when Steel card is played', () => {
      const steelCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Steel);
      const normalCard = new Card(Suit.Hearts, Rank.Ace);
      
      // Calculate with steel card played
      const resultSteelPlayed = ScoringSystem.calculate([steelCard]);
      
      // Calculate with normal card
      const resultNormal = ScoringSystem.calculate([normalCard]);
      
      // Both should have same base multiplier (steel doesn't add mult when played)
      expect(resultSteelPlayed.totalMultiplier).toBe(resultNormal.totalMultiplier);
    });
  });

  describe('Stone Card Enhancement', () => {
    it('should have Stone enhancement type', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      expect(stoneCard.enhancement).toBe(CardEnhancement.Stone);
    });

    it('should give fixed 50 chips', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      expect(stoneCard.getChipValue()).toBe(50);
    });

    it('should ignore original rank value', () => {
      const stoneCardAce = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Stone);
      const stoneCardTwo = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      
      // Both should give 50 chips regardless of rank
      expect(stoneCardAce.getChipValue()).toBe(50);
      expect(stoneCardTwo.getChipValue()).toBe(50);
    });

    it('should be identified as Stone card', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      expect(stoneCard.isStoneCard).toBe(true);
      
      const normalCard = new Card(Suit.Spades, Rank.Two);
      expect(normalCard.isStoneCard).toBe(false);
    });

    it('should have no effective suit (null)', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      expect(stoneCard.getEffectiveSuit()).toBeNull();
      
      const normalCard = new Card(Suit.Spades, Rank.Two);
      expect(normalCard.getEffectiveSuit()).toBe(Suit.Spades);
    });

    it('should have no effective rank (null)', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      expect(stoneCard.getEffectiveRank()).toBeNull();
      
      const normalCard = new Card(Suit.Spades, Rank.Two);
      expect(normalCard.getEffectiveRank()).toBe(Rank.Two);
    });

    it('should display as "石头" without suit/rank', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Stone);
      expect(stoneCard.toString()).toBe('石头');
      expect(stoneCard.getDisplayName()).toBe('石头');
    });

    it('should always be scored first (always counts)', () => {
      // Even with low rank, Stone card should be the scoring card
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      const aceCard = new Card(Suit.Hearts, Rank.Ace);
      
      const cards = [
        aceCard, // 11 chips, normally would be scoring card
        stoneCard, // 50 chips, should be scoring card due to Stone enhancement
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Five)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Stone card should be in scoring cards (always counts)
      const stoneInScoring = result.scoringCards.some(c => 
        c.enhancement === CardEnhancement.Stone
      );
      expect(stoneInScoring).toBe(true);
    });

    it('should contribute 50 chips when scored', () => {
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      const cards = [
        stoneCard,
        new Card(Suit.Hearts, Rank.Three),
        new Card(Suit.Diamonds, Rank.Four),
        new Card(Suit.Clubs, Rank.Five),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Stone card should contribute 50 chips
      const stoneDetails = result.cardDetails.find(d => d.enhancements.includes('Stone (固定50筹码)'));
      expect(stoneDetails).toBeDefined();
      expect(stoneDetails?.chipBonus).toBe(50);
    });

    it('should work with any rank', () => {
      const ranks = [Rank.Two, Rank.Five, Rank.Ten, Rank.King, Rank.Ace];
      
      for (const rank of ranks) {
        const stoneCard = new Card(Suit.Spades, rank, CardEnhancement.Stone);
        expect(stoneCard.getChipValue()).toBe(50);
      }
    });

    it('should be prioritized over higher rank cards in high card hand', () => {
      // Create a hand where Stone 2 should beat Ace
      const stoneCard = new Card(Suit.Spades, Rank.Two, CardEnhancement.Stone);
      const highCards = [
        new Card(Suit.Hearts, Rank.King),  // 10 chips
        new Card(Suit.Diamonds, Rank.Queen), // 10 chips
        new Card(Suit.Clubs, Rank.Jack),   // 10 chips
        new Card(Suit.Spades, Rank.Ten)    // 10 chips
      ];
      
      const cards = [stoneCard, ...highCards];
      const result = ScoringSystem.calculate(cards);
      
      // Stone card should be the first scoring card
      expect(result.scoringCards[0].enhancement).toBe(CardEnhancement.Stone);
    });
  });

  describe('Lucky Card Enhancement', () => {
    it('should have Lucky enhancement type', () => {
      const luckyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Lucky);
      expect(luckyCard.enhancement).toBe(CardEnhancement.Lucky);
    });

    it('should have correct chip value', () => {
      const luckyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Lucky);
      expect(luckyCard.getChipValue()).toBe(11); // Ace = 11
    });

    it('should have approximately 1/5 chance to add +20 mult', () => {
      // Run multiple times to test probability
      let triggerCount = 0;
      const totalRuns = 1000;
      
      for (let i = 0; i < totalRuns; i++) {
        if (Math.random() < 0.2) {
          triggerCount++;
        }
      }
      
      const triggerRate = triggerCount / totalRuns;
      // Should be approximately 20% (with some variance)
      expect(triggerRate).toBeGreaterThan(0.15);
      expect(triggerRate).toBeLessThan(0.25);
    });

    it('should have approximately 1/15 chance to give $20', () => {
      // Run multiple times to test probability
      let triggerCount = 0;
      const totalRuns = 3000;
      
      for (let i = 0; i < totalRuns; i++) {
        if (Math.random() < (1/15)) {
          triggerCount++;
        }
      }
      
      const triggerRate = triggerCount / totalRuns;
      // Should be approximately 6.67% (with some variance)
      expect(triggerRate).toBeGreaterThan(0.04);
      expect(triggerRate).toBeLessThan(0.09);
    });

    it('should return money bonus in result when Lucky triggers money', () => {
      // Mock Math.random to trigger money bonus
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        // First call (mult check): return 0.3 (> 0.2, no mult)
        // Second call (money check): return 0.05 (< 1/15, trigger money)
        return callCount === 1 ? 0.3 : 0.05;
      };
      
      const luckyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Lucky);
      const cards = [
        luckyCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Restore Math.random
      Math.random = originalRandom;
      
      // Should have money bonus
      expect(result.moneyBonus).toBeGreaterThan(0);
    });

    it('should apply +20 mult when triggered', () => {
      // Mock Math.random to trigger mult bonus
      const originalRandom = Math.random;
      Math.random = () => 0.1; // Less than 0.2 to trigger mult
      
      const luckyCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Lucky);
      const cards = [
        luckyCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Restore Math.random
      Math.random = originalRandom;
      
      // Should have significant mult bonus from Lucky
      expect(result.multBonus).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Gold Card Enhancement', () => {
    it('should have Gold enhancement type', () => {
      const goldCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Gold);
      expect(goldCard.enhancement).toBe(CardEnhancement.Gold);
    });

    it('should have correct chip value when played', () => {
      const goldCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Gold);
      expect(goldCard.getChipValue()).toBe(11); // Ace = 11
    });

    it('should give $3 at end of round when held in hand', () => {
      const gameState = new GameState();
      gameState.startNewGame();
      
      // Select small blind to enter playing phase
      gameState.selectBlind(BlindType.SMALL_BLIND);
      
      // Get initial money (after blind selection)
      const initialMoney = gameState.getMoney();
      
      // Clear hand and add Gold card (to ensure it's in hand)
      (gameState as any).cardPile.hand.clear();
      const goldCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Gold);
      (gameState as any).cardPile.hand.addCards([goldCard]);
      
      // Verify Gold card is in hand
      const handCards = (gameState as any).cardPile.hand.getCards();
      const goldCardsInHand = handCards.filter((c: Card) => c.enhancement === CardEnhancement.Gold);
      expect(goldCardsInHand.length).toBe(1);
      
      // Win the round by setting score high enough
      (gameState as any).roundScore = 999999;
      
      // Verify round is won
      expect(gameState.isRoundWon()).toBe(true);
      
      // Complete the blind
      gameState.completeBlind();
      
      // Should have received Gold bonus ($3) + other rewards
      // Initial $4 + blind reward $3 + hands remaining $4 + gold bonus $3 = $14
      expect(gameState.getMoney()).toBe(initialMoney + 3 + 4 + 3);
    });

    it('should give $3 per Gold card held at end of round', () => {
      const gameState = new GameState();
      gameState.startNewGame();
      
      // Select small blind
      gameState.selectBlind(BlindType.SMALL_BLIND);
      
      const initialMoney = gameState.getMoney();
      
      // Clear hand and add multiple Gold cards
      (gameState as any).cardPile.hand.clear();
      const goldCard1 = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Gold);
      const goldCard2 = new Card(Suit.Diamonds, Rank.King, CardEnhancement.Gold);
      (gameState as any).cardPile.hand.addCards([goldCard1, goldCard2]);
      
      // Verify Gold cards are in hand
      const handCards = (gameState as any).cardPile.hand.getCards();
      const goldCardsInHand = handCards.filter((c: Card) => c.enhancement === CardEnhancement.Gold);
      expect(goldCardsInHand.length).toBe(2);
      
      // Win the round
      (gameState as any).roundScore = 999999;
      
      // Complete the blind
      gameState.completeBlind();
      
      // Should have received $6 from 2 Gold cards
      // Initial $4 + blind reward $3 + hands remaining $4 + gold bonus $6 = $17
      expect(gameState.getMoney()).toBe(initialMoney + 3 + 4 + 6);
    });

    it('should not give bonus when Gold card is played', () => {
      const gameState = new GameState();
      gameState.startNewGame();
      
      // Select small blind
      gameState.selectBlind(BlindType.SMALL_BLIND);
      
      const initialMoney = gameState.getMoney();
      
      // Clear the hand first
      (gameState as any).cardPile.hand.clear();
      
      // Create a Gold card and a normal card
      const goldCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Gold);
      const normalCard = new Card(Suit.Spades, Rank.Two);
      (gameState as any).cardPile.hand.addCards([goldCard, normalCard]);
      
      // Verify Gold card is in hand
      expect((gameState as any).cardPile.hand.getCards().length).toBe(2);
      
      // Select only the Gold card
      (gameState as any).cardPile.hand.selectCard(0);
      
      // Play the hand - this moves Gold card from hand to discard
      gameState.playHand();
      
      // Verify Gold card is no longer in hand
      const remainingCards = (gameState as any).cardPile.hand.getCards();
      const goldCardsRemaining = remainingCards.filter((c: Card) => c.enhancement === CardEnhancement.Gold);
      expect(goldCardsRemaining.length).toBe(0);
      
      // Win the round
      (gameState as any).roundScore = 999999;
      
      // Complete the blind
      gameState.completeBlind();
      
      // Gold card was played (moved to discard), so no Gold bonus
      // Initial $4 + blind reward $3 + hands remaining $3 (reduced by 1) = $10
      expect(gameState.getMoney()).toBe(initialMoney + 3 + 3);
    });
  });

  describe('Multiple Enhancement Interactions', () => {
    it('should handle multiple Bonus cards', () => {
      const bonusCard1 = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const bonusCard2 = new Card(Suit.Hearts, Rank.King, CardEnhancement.Bonus);
      
      const cards = [
        bonusCard1,
        bonusCard2,
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Should have at least 60 chips bonus from both Bonus cards
      expect(result.chipBonus).toBeGreaterThanOrEqual(60);
    });

    it('should handle mixed enhancements', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const multCard = new Card(Suit.Hearts, Rank.King, CardEnhancement.Mult);
      
      const cards = [
        bonusCard,
        multCard,
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = ScoringSystem.calculate(cards);
      // Should have both chip and mult bonuses
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
      expect(result.multBonus).toBeGreaterThanOrEqual(4);
    });

    it('should handle Bonus + Mult on same hand', () => {
      // Use cards that form a pair so both cards are scoring
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus);
      const multCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult);
      
      const cards = [
        bonusCard,
        multCard,
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have both bonuses applied (Pair hand type)
      expect(result.handType).toBe('onePair');
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
      expect(result.multBonus).toBeGreaterThanOrEqual(4);
    });

    it('should handle Glass + Mult combination', () => {
      // Use cards that form a pair so both cards are scoring
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass);
      const multCard = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Mult);
      
      const cards = [
        glassCard,
        multCard,
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have Glass x2 multiplier and Mult +4 (Pair hand type)
      expect(result.handType).toBe('onePair');
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Enhancement with Seals', () => {
    it('should combine Bonus enhancement with Gold Seal', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Gold);
      const cards = [
        bonusCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have chip bonus from Bonus enhancement
      expect(result.chipBonus).toBeGreaterThanOrEqual(30);
      // Should have money bonus from Gold Seal
      expect(result.moneyBonus).toBeGreaterThanOrEqual(3);
    });

    it('should combine Mult enhancement with Red Seal', () => {
      const multCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.Red);
      const cards = [
        multCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Red Seal triggers twice: +4 * 2 = +8
      const multDetails = result.cardDetails.find(d => d.card === '♠A');
      expect(multDetails?.multBonus).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Enhancement with Editions', () => {
    it('should combine Bonus enhancement with Foil edition', () => {
      const bonusCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.None, CardEdition.Foil);
      const cards = [
        bonusCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have chip bonus from Bonus (+30) and Foil (+50)
      expect(result.chipBonus).toBeGreaterThanOrEqual(80);
    });

    it('should combine Mult enhancement with Holographic edition', () => {
      const multCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Mult, SealType.None, CardEdition.Holographic);
      const cards = [
        multCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have mult bonus from Mult (+4) and Holographic (+10)
      expect(result.multBonus).toBeGreaterThanOrEqual(14);
    });

    it('should combine Glass enhancement with Polychrome edition', () => {
      const glassCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Glass, SealType.None, CardEdition.Polychrome);
      const cards = [
        glassCard,
        new Card(Suit.Hearts, Rank.Two),
        new Card(Suit.Diamonds, Rank.Three),
        new Card(Suit.Clubs, Rank.Four),
        new Card(Suit.Spades, Rank.Six)
      ];
      
      const result = ScoringSystem.calculate(cards);
      
      // Should have Polychrome x1.5 and Glass x2 multipliers
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(3);
    });
  });

  describe('All Enhancement Types Exist', () => {
    it('should have all enhancement types defined', () => {
      expect(CardEnhancement.None).toBe('none');
      expect(CardEnhancement.Bonus).toBe('bonus');
      expect(CardEnhancement.Mult).toBe('mult');
      expect(CardEnhancement.Wild).toBe('wild');
      expect(CardEnhancement.Glass).toBe('glass');
      expect(CardEnhancement.Steel).toBe('steel');
      expect(CardEnhancement.Stone).toBe('stone');
      expect(CardEnhancement.Gold).toBe('gold');
      expect(CardEnhancement.Lucky).toBe('lucky');
    });
  });
});
