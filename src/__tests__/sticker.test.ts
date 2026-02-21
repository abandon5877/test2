import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { Joker } from '../models/Joker';
import { JokerSlots } from '../models/JokerSlots';
import { JokerRarity, JokerTrigger, StickerType } from '../types/joker';

describe('Sticker System', () => {
  describe('Sticker Types', () => {
    it('should have all sticker types defined', () => {
      expect(StickerType.None).toBe('none');
      expect(StickerType.Eternal).toBe('eternal');
      expect(StickerType.Perishable).toBe('perishable');
      expect(StickerType.Rental).toBe('rental');
    });
  });

  describe('Eternal Sticker', () => {
    it('should prevent joker from being sold', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Eternal
      });

      expect(joker.canBeSold()).toBe(false);
    });

    it('should allow selling joker without sticker', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({})
      });

      expect(joker.canBeSold()).toBe(true);
    });

    it('should fail to sell eternal joker via JokerSystem', () => {
      const jokerSlots = new JokerSlots(5);
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Eternal
      });

      jokerSlots.addJoker(joker);
      const result = JokerSystem.sellJoker(jokerSlots, 0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Eternal');
    });
  });

  describe('Perishable Sticker', () => {
    it('should initialize with 5 rounds', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Perishable
      });

      expect(joker.perishableRounds).toBe(5);
    });

    it('should decrement rounds when processed', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Perishable
      });

      const shouldDestroy = joker.decrementPerishable();
      expect(shouldDestroy).toBe(false);
      expect(joker.perishableRounds).toBe(4);
    });

    it('should return true when rounds reach 0', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Perishable
      });

      // Decrement 5 times
      for (let i = 0; i < 4; i++) {
        joker.decrementPerishable();
      }

      const shouldDestroy = joker.decrementPerishable();
      expect(shouldDestroy).toBe(true);
      expect(joker.perishableRounds).toBe(0);
    });

    it('should destroy perishable joker after 5 rounds via JokerSystem', () => {
      const jokerSlots = new JokerSlots(5);
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Perishable
      });

      jokerSlots.addJoker(joker);
      expect(jokerSlots.getJokerCount()).toBe(1);

      // Simulate 5 rounds
      for (let i = 0; i < 5; i++) {
        const result = jokerSlots.processEndOfRoundStickers();
        if (i < 4) {
          expect(result.destroyedJokers.length).toBe(0);
          expect(jokerSlots.getJokerCount()).toBe(1);
        } else {
          expect(result.destroyedJokers.length).toBe(1);
          expect(jokerSlots.getJokerCount()).toBe(0);
        }
      }
    });

    it('should allow setting perishable sticker after creation', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({})
      });

      expect(joker.sticker).toBe(StickerType.None);
      expect(joker.perishableRounds).toBe(0);

      joker.setSticker(StickerType.Perishable);

      expect(joker.sticker).toBe(StickerType.Perishable);
      expect(joker.perishableRounds).toBe(5);
    });
  });

  describe('Rental Sticker', () => {
    it('should have rental cost of $3', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Rental
      });

      expect(joker.getRentalCost()).toBe(3);
    });

    it('should have no rental cost without sticker', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({})
      });

      expect(joker.getRentalCost()).toBe(0);
    });

    it('should calculate rental cost via JokerSystem', () => {
      const jokerSlots = new JokerSlots(5);
      
      // Add 2 rental jokers
      jokerSlots.addJoker(new Joker({
        id: 'rental_1',
        name: 'Rental 1',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Rental
      }));

      jokerSlots.addJoker(new Joker({
        id: 'rental_2',
        name: 'Rental 2',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Rental
      }));

      const result = jokerSlots.processEndOfRoundStickers();
      expect(result.rentalCost).toBe(6); // 2 * $3
    });

    it('should have reduced sell price for rental jokers', () => {
      const jokerSlots = new JokerSlots(5);
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Rental
      });

      jokerSlots.addJoker(joker);
      const result = JokerSystem.sellJoker(jokerSlots, 0);

      expect(result.success).toBe(true);
      expect(result.sellPrice).toBe(1); // Rental jokers sell for $1
    });
  });

  describe('Joker Clone with Stickers', () => {
    it('should preserve sticker when cloning', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Eternal
      });

      const cloned = joker.clone() as Joker;
      expect(cloned.sticker).toBe(StickerType.Eternal);
    });

    it('should preserve perishable rounds when cloning', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Perishable
      });

      // Decrement once
      joker.decrementPerishable();
      expect(joker.perishableRounds).toBe(4);

      const cloned = joker.clone() as Joker;
      expect(cloned.perishableRounds).toBe(4);
    });
  });

  describe('Get Jokers with Stickers', () => {
    it('should return only jokers with stickers', () => {
      const jokerSlots = new JokerSlots(5);

      jokerSlots.addJoker(new Joker({
        id: 'normal',
        name: 'Normal',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({})
      }));

      jokerSlots.addJoker(new Joker({
        id: 'eternal',
        name: 'Eternal',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Eternal
      }));

      jokerSlots.addJoker(new Joker({
        id: 'rental',
        name: 'Rental',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Rental
      }));

      const withStickers = jokerSlots.getJokersWithStickers();
      expect(withStickers.length).toBe(2);
      expect(withStickers[0].joker.id).toBe('eternal');
      expect(withStickers[1].joker.id).toBe('rental');
    });
  });

  describe('Mixed Stickers in JokerSystem', () => {
    it('should handle all sticker types together', () => {
      const jokerSlots = new JokerSlots(5);

      // Add jokers with different stickers
      jokerSlots.addJoker(new Joker({
        id: 'eternal',
        name: 'Eternal Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Eternal
      }));

      jokerSlots.addJoker(new Joker({
        id: 'perishable',
        name: 'Perishable Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Perishable
      }));

      jokerSlots.addJoker(new Joker({
        id: 'rental',
        name: 'Rental Joker',
        description: 'Test',
        rarity: JokerRarity.COMMON,
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
        effect: () => ({}),
        sticker: StickerType.Rental
      }));

      expect(jokerSlots.getJokerCount()).toBe(3);

      // Process end of round multiple times
      for (let i = 0; i < 5; i++) {
        const result = jokerSlots.processEndOfRoundStickers();
        
        if (i < 4) {
          // Perishable still alive, rental costs money
          expect(result.destroyedJokers.length).toBe(0);
          expect(result.rentalCost).toBe(3);
          expect(jokerSlots.getJokerCount()).toBe(3);
        } else {
          // Perishable destroyed after 5 rounds
          expect(result.destroyedJokers.length).toBe(1);
          expect(result.rentalCost).toBe(3);
          expect(jokerSlots.getJokerCount()).toBe(2);
        }
      }

      // Verify eternal and rental are still there
      const remaining = jokerSlots.getJokers();
      expect(remaining[0].id).toBe('eternal');
      expect(remaining[1].id).toBe('rental');
    });
  });
});
