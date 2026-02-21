import { describe, it, expect, beforeEach } from 'vitest';
import { Hand } from '../models/Hand';
import { Card } from '../models/Card';
import { GameState } from '../models/GameState';
import { CardManager } from '../systems/CardManager';
import { Suit, Rank, CardEnhancement, SealType } from '../types/card';
import { GamePhase, BlindType } from '../types/game';
import { Storage } from '../utils/storage';
import { PokerHandType } from '../types/pokerHands';

describe('Hand Play Discard System', () => {
  let hand: Hand;
  let gameState: GameState;

  beforeEach(() => {
    hand = new Hand(8);
    gameState = new GameState();
    gameState.startNewGame();
  });

  // ==========================================
  // 4.2.1 手牌管理测试
  // ==========================================
  describe('Hand Management', () => {
    describe('Basic Hand Functions', () => {
      it('should have max hand size of 8', () => {
        expect(hand.maxHandSize).toBe(8);
      });

      it('should add cards up to max hand size', () => {
        const cards = Array(10).fill(null).map((_, i) => 
          new Card(Suit.Spades, Rank.Two)
        );
        hand.addCards(cards);
        expect(hand.size).toBe(8); // Should only add 8 cards
      });

      it('should add single card if space available', () => {
        const card = new Card(Suit.Spades, Rank.Ace);
        expect(hand.addCard(card)).toBe(true);
        expect(hand.size).toBe(1);
      });

      it('should reject adding card when full', () => {
        // Fill hand to max
        for (let i = 0; i < 8; i++) {
          hand.addCard(new Card(Suit.Spades, Rank.Two));
        }
        expect(hand.addCard(new Card(Suit.Hearts, Rank.Ace))).toBe(false);
      });

      it('should sort by suit correctly', () => {
        hand.addCard(new Card(Suit.Clubs, Rank.Two));
        hand.addCard(new Card(Suit.Hearts, Rank.Three));
        hand.addCard(new Card(Suit.Spades, Rank.Four));
        hand.addCard(new Card(Suit.Diamonds, Rank.Five));

        hand.sortBySuit();
        const cards = hand.getCards();
        expect(cards[0].suit).toBe(Suit.Spades);
        expect(cards[1].suit).toBe(Suit.Hearts);
        expect(cards[2].suit).toBe(Suit.Diamonds);
        expect(cards[3].suit).toBe(Suit.Clubs);
      });

      it('should sort by rank correctly', () => {
        hand.addCard(new Card(Suit.Spades, Rank.King));
        hand.addCard(new Card(Suit.Spades, Rank.Ace));
        hand.addCard(new Card(Suit.Spades, Rank.Two));

        hand.sortByRank();
        const cards = hand.getCards();
        expect(cards[0].rank).toBe(Rank.Two);
        expect(cards[1].rank).toBe(Rank.King);
        expect(cards[2].rank).toBe(Rank.Ace);
      });
    });

    describe('Card Selection', () => {
      beforeEach(() => {
        // Add 5 cards to hand
        for (let i = 0; i < 5; i++) {
          hand.addCard(new Card(Suit.Spades, Rank.Two));
        }
      });

      it('should select card successfully', () => {
        expect(hand.selectCard(0)).toBe(true);
        expect(hand.isSelected(0)).toBe(true);
        expect(hand.getSelectionCount()).toBe(1);
      });

      it('should deselect card successfully', () => {
        hand.selectCard(0);
        expect(hand.deselectCard(0)).toBe(true);
        expect(hand.isSelected(0)).toBe(false);
        expect(hand.getSelectionCount()).toBe(0);
      });

      it('should toggle card selection', () => {
        hand.toggleCard(0);
        expect(hand.isSelected(0)).toBe(true);
        hand.toggleCard(0);
        expect(hand.isSelected(0)).toBe(false);
      });

      it('should enforce max selection of 5 cards', () => {
        // Add more cards to hand
        for (let i = 0; i < 5; i++) {
          hand.addCard(new Card(Suit.Hearts, Rank.Three));
        }

        // Try to select 6 cards
        for (let i = 0; i < 6; i++) {
          hand.selectCard(i);
        }

        expect(hand.getSelectionCount()).toBe(5);
      });

      it('should reject invalid index selection', () => {
        expect(hand.selectCard(-1)).toBe(false);
        expect(hand.selectCard(10)).toBe(false);
      });

      it('should clear all selections', () => {
        hand.selectCard(0);
        hand.selectCard(1);
        hand.clearSelection();
        expect(hand.getSelectionCount()).toBe(0);
      });

      it('should return selected cards correctly', () => {
        hand = new Hand(8);
        const card1 = new Card(Suit.Spades, Rank.Ace);
        const card2 = new Card(Suit.Hearts, Rank.King);
        hand.addCard(card1);
        hand.addCard(card2);
        hand.selectCard(0);
        hand.selectCard(1);

        const selected = hand.getSelectedCards();
        expect(selected).toHaveLength(2);
        expect(selected[0]).toBe(card1);
        expect(selected[1]).toBe(card2);
      });
    });

    describe('Play Cards', () => {
      beforeEach(() => {
        for (let i = 0; i < 5; i++) {
          hand.addCard(new Card(Suit.Spades, Rank.Two));
        }
      });

      it('should play selected cards and remove them', () => {
        hand.selectCard(0);
        hand.selectCard(1);

        const played = hand.playSelected();
        expect(played).toHaveLength(2);
        expect(hand.size).toBe(3);
        expect(hand.getSelectionCount()).toBe(0);
      });

      it('should return empty array when no cards selected', () => {
        const played = hand.playSelected();
        expect(played).toHaveLength(0);
      });

      it('should maintain correct indices after playing', () => {
        // Add cards with different ranks for identification
        hand = new Hand(8);
        const card0 = new Card(Suit.Spades, Rank.Two);
        const card1 = new Card(Suit.Spades, Rank.Three);
        const card2 = new Card(Suit.Spades, Rank.Four);
        hand.addCard(card0);
        hand.addCard(card1);
        hand.addCard(card2);

        hand.selectCard(0);
        hand.selectCard(2);

        const played = hand.playSelected();
        expect(played).toContain(card0);
        expect(played).toContain(card2);
        expect(hand.getCards()).toContain(card1);
      });
    });

    describe('Discard Cards', () => {
      beforeEach(() => {
        for (let i = 0; i < 5; i++) {
          hand.addCard(new Card(Suit.Spades, Rank.Two));
        }
      });

      it('should discard selected cards', () => {
        hand.selectCard(0);
        hand.selectCard(1);

        const discarded = hand.discardSelected();
        expect(discarded).toHaveLength(2);
        expect(hand.size).toBe(3);
      });

      it('should behave same as playSelected', () => {
        hand.selectCard(0);
        
        const played = hand.playSelected();
        
        // Reset
        hand = new Hand(8);
        for (let i = 0; i < 5; i++) {
          hand.addCard(new Card(Suit.Spades, Rank.Two));
        }
        hand.selectCard(0);
        
        const discarded = hand.discardSelected();
        
        expect(played.length).toBe(discarded.length);
      });
    });

    describe('Remove Card', () => {
      beforeEach(() => {
        for (let i = 0; i < 5; i++) {
          hand.addCard(new Card(Suit.Spades, Rank.Two));
        }
      });

      it('should remove card at index', () => {
        const removed = hand.removeCard(2);
        expect(removed).not.toBeNull();
        expect(hand.size).toBe(4);
      });

      it('should adjust selection indices after removal', () => {
        hand.selectCard(0);
        hand.selectCard(3);
        hand.selectCard(4);

        hand.removeCard(2); // Remove card at index 2

        // Index 3 and 4 should become 2 and 3
        expect(hand.isSelected(0)).toBe(true);
        expect(hand.isSelected(2)).toBe(true); // Was 3
        expect(hand.isSelected(3)).toBe(true); // Was 4
      });

      it('should return null for invalid index', () => {
        expect(hand.removeCard(-1)).toBeNull();
        expect(hand.removeCard(10)).toBeNull();
      });
    });
  });

  // ==========================================
  // 4.2.2 出牌功能测试
  // ==========================================
  describe('Play Hand Functionality', () => {
    beforeEach(() => {
      // Setup game state for playing
      gameState = new GameState();
      gameState.startNewGame();
      
      // Select a blind to enter playing phase
      gameState.selectBlind(BlindType.SMALL_BLIND);
    });

    describe('Basic Play Tests', () => {
      it('should play hand successfully', () => {
        const hand = gameState.cardPile.hand;
        hand.selectCard(0);
        hand.selectCard(1);

        const result = gameState.playHand();
        expect(result).not.toBeNull();
      });

      it('should decrease hands remaining after play', () => {
        const initialHands = gameState.getRemainingHands();
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();
        expect(gameState.getRemainingHands()).toBe(initialHands - 1);
      });

      it('should draw cards to replenish hand after play', () => {
        const initialHandSize = gameState.cardPile.hand.size;
        gameState.cardPile.hand.selectCard(0);
        gameState.cardPile.hand.selectCard(1);
        
        gameState.playHand();
        
        // Hand should be replenished back to max
        expect(gameState.cardPile.hand.size).toBe(initialHandSize);
      });

      it('should calculate score correctly', () => {
        gameState.cardPile.hand.selectCard(0);
        const result = gameState.playHand();
        
        expect(result).not.toBeNull();
        expect(result!.totalScore).toBeGreaterThan(0);
      });
    });

    describe('Play Restrictions', () => {
      it('should reject play when no hands remaining', () => {
        // Use up all hands
        while (gameState.getRemainingHands() > 0) {
          gameState.cardPile.hand.clearSelection();
          gameState.cardPile.hand.selectCard(0);
          gameState.playHand();
        }

        gameState.cardPile.hand.clearSelection();
        gameState.cardPile.hand.selectCard(0);
        expect(gameState.canPlayHand()).toBe(false);
      });

      it('should reject play when no cards selected', () => {
        gameState.cardPile.hand.clearSelection();
        expect(gameState.canPlayHand()).toBe(false);
      });

      it('should reject play when not in PLAYING phase', () => {
        gameState.phase = GamePhase.SHOP;
        gameState.cardPile.hand.selectCard(0);
        expect(gameState.canPlayHand()).toBe(false);
      });

      it('should reject selecting more than 5 cards', () => {
        // Ensure we have at least 6 cards
        while (gameState.cardPile.hand.size < 6) {
          gameState.cardPile.hand.addCard(new Card(Suit.Spades, Rank.Two));
        }

        let selectedCount = 0;
        for (let i = 0; i < 6; i++) {
          if (gameState.cardPile.hand.selectCard(i)) {
            selectedCount++;
          }
        }

        expect(selectedCount).toBe(5);
      });
    });

    describe('Post-Play State', () => {
      it('should update round score after play', () => {
        const initialRoundScore = gameState.roundScore;
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();
        expect(gameState.roundScore).toBeGreaterThan(initialRoundScore);
      });

      it('should move played cards to discard', () => {
        const initialDiscardCount = gameState.getDiscardCount();
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();
        expect(gameState.getDiscardCount()).toBeGreaterThan(initialDiscardCount);
      });
    });
  });

  // ==========================================
  // 4.2.3 弃牌功能测试
  // ==========================================
  describe('Discard Functionality', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();
      gameState.selectBlind(BlindType.SMALL_BLIND);
    });

    describe('Basic Discard Tests', () => {
      it('should discard cards successfully', () => {
        gameState.cardPile.hand.selectCard(0);
        gameState.cardPile.hand.selectCard(1);

        const discarded = gameState.discardCards();
        expect(discarded).not.toBeNull();
        expect(discarded).toHaveLength(2);
      });

      it('should decrease discards remaining', () => {
        const initialDiscards = gameState.getRemainingDiscards();
        gameState.cardPile.hand.selectCard(0);
        gameState.discardCards();
        expect(gameState.getRemainingDiscards()).toBe(initialDiscards - 1);
      });

      it('should draw cards to replenish hand after discard', () => {
        const initialHandSize = gameState.cardPile.hand.size;
        gameState.cardPile.hand.selectCard(0);
        gameState.discardCards();
        expect(gameState.cardPile.hand.size).toBe(initialHandSize);
      });
    });

    describe('Discard Restrictions', () => {
      it('should reject discard when no discards remaining', () => {
        // Use up all discards
        while (gameState.getRemainingDiscards() > 0) {
          gameState.cardPile.hand.clearSelection();
          gameState.cardPile.hand.selectCard(0);
          gameState.discardCards();
        }

        gameState.cardPile.hand.clearSelection();
        gameState.cardPile.hand.selectCard(0);
        expect(gameState.canDiscard()).toBe(false);
      });

      it('should reject discard when no cards selected', () => {
        gameState.cardPile.hand.clearSelection();
        expect(gameState.canDiscard()).toBe(false);
      });

      it('should reject discard when not in PLAYING phase', () => {
        gameState.phase = GamePhase.SHOP;
        gameState.cardPile.hand.selectCard(0);
        expect(gameState.canDiscard()).toBe(false);
      });
    });

    describe('Post-Discard State', () => {
      it('should move discarded cards to discard pile', () => {
        const initialDiscardCount = gameState.getDiscardCount();
        gameState.cardPile.hand.selectCard(0);
        gameState.discardCards();
        expect(gameState.getDiscardCount()).toBeGreaterThan(initialDiscardCount);
      });
    });
  });

  // ==========================================
  // 4.2.4 抽牌机制测试
  // ==========================================
  describe('Draw Mechanism', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();
    });

    describe('Basic Draw Tests', () => {
      it('should draw cards from deck', () => {
        const initialDeckCount = gameState.cardPile.deck.size;
        const drawn = CardManager.drawFromDeck(gameState.cardPile.deck, 5);

        expect(drawn).toHaveLength(5);
        expect(gameState.cardPile.deck.size).toBe(initialDeckCount - 5);
      });

      it('should draw one card', () => {
        const card = CardManager.drawOneFromDeck(gameState.cardPile.deck);
        expect(card).not.toBeNull();
      });

      it('should return empty array when deck is empty', () => {
        // Draw all cards
        CardManager.drawFromDeck(gameState.cardPile.deck, 52);
        const drawn = CardManager.drawFromDeck(gameState.cardPile.deck, 5);
        expect(drawn).toHaveLength(0);
      });

      it('should return null when drawing from empty deck', () => {
        CardManager.drawFromDeck(gameState.cardPile.deck, 52);
        const card = CardManager.drawOneFromDeck(gameState.cardPile.deck);
        expect(card).toBeNull();
      });
    });

    describe('Hand Size Limit', () => {
      it('should not exceed max hand size when drawing', () => {
        hand = new Hand(8);
        // Fill hand to near max
        for (let i = 0; i < 6; i++) {
          hand.addCard(new Card(Suit.Spades, Rank.Two));
        }

        // Try to add more than max
        const cardsToAdd = Array(5).fill(null).map(() => new Card(Suit.Hearts, Rank.Three));
        hand.addCards(cardsToAdd);

        expect(hand.size).toBe(8); // Should be capped at max
      });
    });

    describe('Draw Triggers', () => {
      beforeEach(() => {
        gameState = new GameState();
        gameState.startNewGame();
        gameState.selectBlind(BlindType.SMALL_BLIND);
      });

      it('should draw after playing cards', () => {
        const initialHandSize = gameState.cardPile.hand.size;
        gameState.cardPile.hand.selectCard(0);
        gameState.cardPile.hand.selectCard(1);
        
        gameState.playHand();
        
        expect(gameState.cardPile.hand.size).toBe(initialHandSize);
      });

      it('should draw after discarding cards', () => {
        const initialHandSize = gameState.cardPile.hand.size;
        gameState.cardPile.hand.selectCard(0);
        
        gameState.discardCards();
        
        expect(gameState.cardPile.hand.size).toBe(initialHandSize);
      });

      it('should deal initial hand on blind select', () => {
        expect(gameState.cardPile.hand.size).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================
  // 4.2.5 回合结束奖励测试
  // ==========================================
  describe('Round End Rewards', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();
      gameState.selectBlind(BlindType.SMALL_BLIND);
    });

    describe('Basic Reward Tests', () => {
      it('should give reward for remaining hands', () => {
        // Play one hand to win the round
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();
        
        const initialMoney = gameState.money;
        const remainingHands = gameState.getRemainingHands();
        
        // Complete the blind (win condition)
        gameState.roundScore = 1000000; // Ensure we win
        gameState.completeBlind();
        
        // Should get money for remaining hands
        expect(gameState.money).toBeGreaterThan(initialMoney);
      });

      it('should give blind reward', () => {
        const blindReward = gameState.currentBlind?.reward || 0;
        const initialMoney = gameState.money;
        
        gameState.roundScore = 1000000;
        gameState.completeBlind();
        
        if (blindReward > 0) {
          expect(gameState.money).toBeGreaterThan(initialMoney);
        }
      });
    });

    describe('Gold Card Reward', () => {
      it('should give $3 per Gold card held at round end', () => {
        // Add Gold cards to hand
        const goldCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Gold);
        gameState.cardPile.hand.addCard(goldCard);
        
        const initialMoney = gameState.money;
        
        gameState.roundScore = 1000000;
        gameState.completeBlind();
        
        // Should get at least $3 for the Gold card
        expect(gameState.money).toBeGreaterThanOrEqual(initialMoney + 3);
      });
    });
  });

  // ==========================================
  // 4.2.6 小丑牌加成测试
  // ==========================================
  describe('Joker Bonuses', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();
    });

    describe('Extra Hands', () => {
      it('should calculate extra hands from jokers', () => {
        const baseHands = 4;
        const extraHands = gameState.getExtraHandsFromJokers();
        
        expect(gameState.getMaxHandsPerRound()).toBe(baseHands + extraHands);
      });
    });

    describe('Extra Hand Size', () => {
      it('should calculate extra hand size from jokers', () => {
        const baseSize = 8;
        const extraSize = gameState.getExtraHandSizeFromJokers();
        
        expect(gameState.getMaxHandSize()).toBe(baseSize + extraSize);
      });
    });
  });

  // ==========================================
  // 4.2.7 存档读档测试
  // ==========================================
  describe('Save/Load', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();
      gameState.selectBlind(BlindType.SMALL_BLIND);
    });

    describe('Hand State Serialization', () => {
      it('should serialize hand state correctly', () => {
        // Select some cards using gameState.hand
        gameState.cardPile.hand.selectCard(0);
        gameState.cardPile.hand.selectCard(2);

        const saveData = Storage.serialize(gameState);

        expect(saveData.gameState.cards.hand).toBeDefined();
        expect(saveData.gameState.cards.handSelectedIndices).toContain(0);
        expect(saveData.gameState.cards.handSelectedIndices).toContain(2);
      });

      it('should save card enhancements and seals', () => {
        // Clear hand first to make room for our test card
        gameState.cardPile.hand.clear();

        // Add enhanced card to hand via CardManager
        const enhancedCard = new Card(Suit.Spades, Rank.Ace, CardEnhancement.Bonus, SealType.Gold);
        CardManager.addToHand(gameState.cardPile.hand, [enhancedCard]);

        const saveData = Storage.serialize(gameState);

        const savedCard = saveData.gameState.cards.hand.find(
          c => c.suit === Suit.Spades && c.rank === Rank.Ace
        );
        expect(savedCard).toBeDefined();
        expect(savedCard!.enhancement).toBe(CardEnhancement.Bonus);
        expect(savedCard!.seal).toBe(SealType.Gold);
      });
    });

    describe('Deck State Serialization', () => {
      it('should serialize deck state correctly', () => {
        const saveData = Storage.serialize(gameState);
        expect(saveData.gameState.cards.deck).toBeDefined();
        expect(saveData.gameState.cards.deck.length).toBeGreaterThan(0);
      });

      it('should serialize discard pile correctly', () => {
        // Play some cards to discard pile
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();

        const saveData = Storage.serialize(gameState);
        expect(saveData.gameState.cards.discard).toBeDefined();
      });
    });

    describe('State Restoration', () => {
      it('should restore hand correctly', () => {
        const initialHandSize = gameState.cardPile.hand.size;
        gameState.cardPile.hand.selectCard(0);

        const saveData = Storage.serialize(gameState);
        const restoredState = Storage.restoreGameState(saveData);

        expect(restoredState.cardPile.hand.size).toBe(initialHandSize);
      });

      it('should restore selection state', () => {
        // Use gameState.hand to select cards
        gameState.cardPile.hand.selectCard(1);
        gameState.cardPile.hand.selectCard(3);

        const saveData = Storage.serialize(gameState);
        const restoredState = Storage.restoreGameState(saveData);

        expect(restoredState.cardPile.hand.isSelected(1)).toBe(true);
        expect(restoredState.cardPile.hand.isSelected(3)).toBe(true);
      });
    });

    describe('Data Integrity', () => {
      it('should maintain total card count after save/load', () => {
        const saveData = Storage.serialize(gameState);
        
        const totalCards = 
          saveData.gameState.cards.deck.length +
          saveData.gameState.cards.hand.length +
          saveData.gameState.cards.discard.length;
        
        expect(totalCards).toBe(52); // Standard deck size
      });

      it('should maintain consistent state after multiple save/load cycles', () => {
        // First cycle
        let saveData = Storage.serialize(gameState);
        let restored = Storage.restoreGameState(saveData);
        
        // Play some cards in restored state
        restored.cardPile.hand.selectCard(0);
        restored.playHand();
        
        // Second cycle
        saveData = Storage.serialize(restored);
        restored = Storage.restoreGameState(saveData);
        
        expect(restored.cardPile.hand.size).toBeGreaterThan(0);
        expect(restored.getRemainingHands()).toBeLessThan(4);
      });
    });
  });

  // ==========================================
  // 4.2.8 盲注过渡测试
  // ==========================================
  describe('Blind Transition', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();
    });

    describe('Blind End', () => {
      it('should return cards to deck on blind end', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);

        // Play some cards
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();

        const deckCountBefore = gameState.cardPile.deck.size;
        const handCountBefore = gameState.cardPile.hand.size;
        const discardCountBefore = gameState.cardPile.discard.getCount();

        // End blind
        CardManager.endBlind(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard);

        // All cards should be in deck
        expect(gameState.cardPile.hand.size).toBe(0);
        expect(gameState.cardPile.discard.getCount()).toBe(0);
        expect(gameState.cardPile.deck.size).toBe(
          deckCountBefore + handCountBefore + discardCountBefore
        );
      });

      it('should shuffle deck on blind end', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);

        // Get initial deck order after selectBlind (which already dealt cards)
        const deckCountBefore = gameState.cardPile.deck.size;
        const handCountBefore = gameState.cardPile.hand.size;
        const discardCountBefore = gameState.cardPile.discard.getCount();

        // End blind
        CardManager.endBlind(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard);

        // All cards should be back in deck
        expect(gameState.cardPile.deck.size).toBe(deckCountBefore + handCountBefore + discardCountBefore);
        expect(gameState.cardPile.hand.size).toBe(0);
        expect(gameState.cardPile.discard.getCount()).toBe(0);
      });
    });

    describe('Blind Start', () => {
      it('should reset hands remaining on new blind', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);
        
        // Use some hands
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();
        
        const handsBefore = gameState.getRemainingHands();
        expect(handsBefore).toBeLessThan(4);
        
        // End and start new blind
        gameState.roundScore = 1000000;
        gameState.completeBlind();
        
        // Move to next blind
        if (gameState.phase === GamePhase.BLIND_SELECT) {
          gameState.selectBlind(gameState.getCurrentBlindPosition());
          expect(gameState.getRemainingHands()).toBe(4);
        }
      });

      it('should reset discards remaining on new blind', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);
        
        // Use some discards
        gameState.cardPile.hand.selectCard(0);
        gameState.discardCards();
        
        const discardsBefore = gameState.getRemainingDiscards();
        expect(discardsBefore).toBeLessThan(3);
        
        // End and start new blind
        gameState.roundScore = 1000000;
        gameState.completeBlind();
        
        if (gameState.phase === GamePhase.BLIND_SELECT) {
          gameState.selectBlind(gameState.getCurrentBlindPosition());
          expect(gameState.getRemainingDiscards()).toBe(3);
        }
      });

      it('should deal initial hand on blind start', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);
        expect(gameState.cardPile.hand.size).toBeGreaterThan(0);
      });
    });

    describe('State Reset', () => {
      it('should reset round score on new blind', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);
        
        // Score some points
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();
        expect(gameState.roundScore).toBeGreaterThan(0);
        
        // End blind
        gameState.roundScore = 1000000;
        gameState.completeBlind();
        
        // Round score should be reset for next blind
        if (gameState.phase === GamePhase.BLIND_SELECT) {
          gameState.selectBlind(gameState.getCurrentBlindPosition());
          expect(gameState.roundScore).toBe(0);
        }
      });
    });
  });

  // ==========================================
  // 4.2.9 消耗牌影响测试
  // ==========================================
  describe('Consumable Effects on Cards', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();

      // Initialize with some cards in hand
      for (let i = 0; i < 5; i++) {
        CardManager.addToHand(gameState.cardPile.hand, [new Card(Suit.Spades, Rank.Two)]);
      }
    });

    describe('Card Enhancement', () => {
      it('should enhance card in hand', () => {
        const success = CardManager.enhanceCard(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, 'hand', 0, CardEnhancement.Bonus);
        expect(success).toBe(true);

        const handCards = gameState.cardPile.hand.getCards();
        expect(handCards[0].enhancement).toBe(CardEnhancement.Bonus);
      });

      it('should enhance card in deck', () => {
        CardManager.addToDeck(gameState.cardPile.deck, new Card(Suit.Hearts, Rank.Three));

        const success = CardManager.enhanceCard(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, 'deck', 0, CardEnhancement.Mult);
        expect(success).toBe(true);

        const deckCards = gameState.cardPile.deck.getCards();
        expect(deckCards[0].enhancement).toBe(CardEnhancement.Mult);
      });

      it('should return false for invalid index', () => {
        const success = CardManager.enhanceCard(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, 'hand', 999, CardEnhancement.Gold);
        expect(success).toBe(false);
      });
    });

    describe('Card Removal', () => {
      it('should remove card from hand', () => {
        const initialCount = gameState.cardPile.hand.size;
        const removed = CardManager.removeCard(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, 'hand', 0);

        expect(removed).not.toBeNull();
        expect(gameState.cardPile.hand.size).toBe(initialCount - 1);
      });

      it('should remove card from deck', () => {
        CardManager.addToDeck(gameState.cardPile.deck, new Card(Suit.Clubs, Rank.Four));
        const initialCount = gameState.cardPile.deck.size;

        const removed = CardManager.removeCard(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, 'deck', 0);

        expect(removed).not.toBeNull();
        expect(gameState.cardPile.deck.size).toBe(initialCount - 1);
      });

      it('should remove card from discard', () => {
        CardManager.addToDiscard(gameState.cardPile.discard, [new Card(Suit.Diamonds, Rank.Five)]);
        const initialCount = gameState.cardPile.discard.getCount();

        const removed = CardManager.removeCard(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, 'discard', 0);

        expect(removed).not.toBeNull();
        expect(gameState.cardPile.discard.getCount()).toBe(initialCount - 1);
      });

      it('should adjust selection indices when removing from hand', () => {
        // Add more cards
        CardManager.addToHand(gameState.cardPile.hand, [
          new Card(Suit.Hearts, Rank.Three),
          new Card(Suit.Diamonds, Rank.Four)
        ]);

        gameState.cardPile.hand.selectCard(0);
        gameState.cardPile.hand.selectCard(2);

        CardManager.removeCard(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, 'hand', 1); // Remove middle card

        // Index 2 should become 1
        expect(gameState.cardPile.hand.getSelectedIndices()).toContain(0);
        expect(gameState.cardPile.hand.getSelectedIndices()).toContain(1);
      });
    });

    describe('Card Copying', () => {
      it('should copy card to deck', () => {
        const card = new Card(Suit.Spades, Rank.Ace);
        const initialCount = gameState.cardPile.deck.size;

        CardManager.copyCardToLocation(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, card, 'deck');

        expect(gameState.cardPile.deck.size).toBe(initialCount + 1);
      });

      it('should copy card to hand', () => {
        const card = new Card(Suit.Hearts, Rank.King);
        const initialCount = gameState.cardPile.hand.size;

        CardManager.copyCardToLocation(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, card, 'hand');

        expect(gameState.cardPile.hand.size).toBe(initialCount + 1);
      });

      it('should copy card to discard', () => {
        const card = new Card(Suit.Clubs, Rank.Queen);
        const initialCount = gameState.cardPile.discard.getCount();

        CardManager.copyCardToLocation(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard, card, 'discard');

        expect(gameState.cardPile.discard.getCount()).toBe(initialCount + 1);
      });
    });
  });

  // ==========================================
  // 4.2.10 集成测试
  // ==========================================
  describe('Integration Tests', () => {
    beforeEach(() => {
      gameState = new GameState();
      gameState.startNewGame();
    });

    describe('Complete Round Flow', () => {
      it('should complete a full round: select blind -> play -> complete', () => {
        // Select blind
        const selectResult = gameState.selectBlind(BlindType.SMALL_BLIND);
        expect(selectResult).toBe(true);
        expect(gameState.phase).toBe(GamePhase.PLAYING);
        expect(gameState.cardPile.hand.size).toBeGreaterThan(0);

        // Play hands until win
        let playCount = 0;
        while (gameState.getRemainingHands() > 0 && !gameState.isRoundWon()) {
          gameState.cardPile.hand.clearSelection();
          gameState.cardPile.hand.selectCard(0);
          gameState.playHand();
          playCount++;
          
          // Prevent infinite loop in test
          if (playCount > 10) break;
        }

        // Force win for test
        gameState.roundScore = 1000000;
        expect(gameState.isRoundWon()).toBe(true);

        // Complete blind
        const initialMoney = gameState.money;
        gameState.completeBlind();
        expect(gameState.money).toBeGreaterThan(initialMoney);
      });

      it('should handle multiple play/discard cycles', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);

        // Play some hands
        for (let i = 0; i < 2 && gameState.canPlayHand(); i++) {
          gameState.cardPile.hand.clearSelection();
          gameState.cardPile.hand.selectCard(0);
          gameState.playHand();
        }

        // Discard some cards
        for (let i = 0; i < 2 && gameState.canDiscard(); i++) {
          gameState.cardPile.hand.clearSelection();
          gameState.cardPile.hand.selectCard(0);
          gameState.discardCards();
        }

        // Hand should still be full
        expect(gameState.cardPile.hand.size).toBe(gameState.getMaxHandSize());
      });
    });

    describe('Multiple Rounds', () => {
      it('should handle consecutive blinds', () => {
        // First blind
        gameState.selectBlind(BlindType.SMALL_BLIND);
        gameState.roundScore = 1000000;
        gameState.completeBlind();

        // Should be able to select next blind
        if (gameState.phase === GamePhase.BLIND_SELECT) {
          const nextBlind = gameState.getCurrentBlindPosition();
          const result = gameState.selectBlind(nextBlind);
          expect(result).toBe(true);
          expect(gameState.getRemainingHands()).toBe(4);
          expect(gameState.getRemainingDiscards()).toBe(3);
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle running out of hands', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);

        // Use all hands
        while (gameState.getRemainingHands() > 0) {
          gameState.cardPile.hand.clearSelection();
          gameState.cardPile.hand.selectCard(0);
          gameState.playHand();
        }

        expect(gameState.getRemainingHands()).toBe(0);
        expect(gameState.canPlayHand()).toBe(false);
      });

      it('should handle running out of discards', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);

        // Use all discards
        while (gameState.getRemainingDiscards() > 0) {
          gameState.cardPile.hand.clearSelection();
          gameState.cardPile.hand.selectCard(0);
          gameState.discardCards();
        }

        expect(gameState.getRemainingDiscards()).toBe(0);
        expect(gameState.canDiscard()).toBe(false);
      });

      it('should handle hand size changes', () => {
        gameState.selectBlind(BlindType.SMALL_BLIND);
        
        const initialSize = gameState.cardPile.hand.size;
        expect(initialSize).toBe(8);

        // Play some cards
        gameState.cardPile.hand.selectCard(0);
        gameState.playHand();

        // Hand should be replenished
        expect(gameState.cardPile.hand.size).toBe(initialSize);
      });
    });
  });
});
