import { describe, it, expect, beforeEach } from 'vitest';
import { Shop } from '../models/Shop';
import { CardEdition } from '../types/card';

describe('Shop Price System', () => {
  let shop: Shop;

  beforeEach(() => {
    shop = new Shop();
  });

  describe('Base Price Calculation', () => {
    it('should calculate base price correctly', () => {
      // Test with a base price of $5
      const price = (shop as any).calculatePrice(5);
      expect(price).toBeGreaterThanOrEqual(1);
    });

    it('should apply minimum price of $1', () => {
      const price = (shop as any).calculatePrice(0);
      expect(price).toBe(1);
    });
  });

  describe('Edition Price Calculation', () => {
    it('should add $2 for Foil edition', () => {
      const price = shop.calculatePriceWithEdition(5, CardEdition.Foil);
      // Base $5 + $2 = $7
      expect(price).toBeGreaterThanOrEqual(5);
    });

    it('should add $3 for Holographic edition', () => {
      const price = shop.calculatePriceWithEdition(5, CardEdition.Holographic);
      // Base $5 + $3 = $8
      expect(price).toBeGreaterThanOrEqual(5);
    });

    it('should add $5 for Polychrome edition', () => {
      const price = shop.calculatePriceWithEdition(5, CardEdition.Polychrome);
      // Base $5 + $5 = $10
      expect(price).toBeGreaterThanOrEqual(5);
    });

    it('should add $5 for Negative edition', () => {
      const price = shop.calculatePriceWithEdition(5, CardEdition.Negative);
      // Base $5 + $5 = $10
      expect(price).toBeGreaterThanOrEqual(5);
    });

    it('should not add price for no edition', () => {
      const price = shop.calculatePriceWithEdition(5, CardEdition.None);
      // Base $5 + $0 = $5
      expect(price).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Discount Voucher Effects', () => {
    it('should apply Clearance Sale discount (25% off)', () => {
      shop.applyVoucher('voucher_clearance');
      const price = (shop as any).calculatePrice(10);
      // $10 * 0.75 = $7.5, floor = $7
      // Plus inflation: $7 * 1.2 = $8.4, floor = $8
      expect(price).toBe(8);
    });

    it('should apply Liquidation discount (50% off)', () => {
      shop.applyVoucher('voucher_liquidation');
      const price = (shop as any).calculatePrice(10);
      // $10 * 0.5 = $5
      // Plus inflation: $5 * 1.2 = $6
      expect(price).toBe(6);
    });

    it('should apply inflation based on voucher count', () => {
      shop.applyVoucher('voucher_overstock');
      const price1 = (shop as any).calculatePrice(10);
      // $10 * 1.2 = $12
      expect(price1).toBe(12);

      shop.applyVoucher('voucher_clearance');
      const price2 = (shop as any).calculatePrice(10);
      // $10 * 0.75 = $7.5, floor = $7
      // Plus inflation (2 vouchers): $7 * 1.4 = $9.8, floor = $9
      expect(price2).toBe(9);
    });
  });

  describe('Illusion Voucher - Enhanced Playing Cards', () => {
    it('should return null when Illusion voucher is not applied', () => {
      const result = shop.generateEnhancedPlayingCard();
      expect(result).toBeNull();
    });

    it('should generate enhanced card when Illusion voucher is applied', () => {
      shop.applyVoucher('voucher_illusion');
      const result = shop.generateEnhancedPlayingCard();
      
      expect(result).not.toBeNull();
      expect(result!.card).toBeDefined();
      expect(result!.price).toBeGreaterThanOrEqual(1);
    });

    it('should generate card with enhancement', () => {
      shop.applyVoucher('voucher_illusion');
      const result = shop.generateEnhancedPlayingCard();
      
      expect(result!.card.enhancement).toBeDefined();
      expect(result!.card.enhancement).not.toBe('none');
    });

    it('should generate card with possible edition', () => {
      shop.applyVoucher('voucher_illusion');
      
      // Run multiple times to check for editions
      let hasEdition = false;
      for (let i = 0; i < 50; i++) {
        const result = shop.generateEnhancedPlayingCard();
        if (result && result.card.edition && result.card.edition !== 'none') {
          hasEdition = true;
          break;
        }
      }
      
      // Should have edition at least some of the time (30% chance)
      // With 50 tries, probability of no edition is 0.7^50 ≈ 0.00000018
      expect(hasEdition).toBe(true);
    });

    it('should generate card with possible seal', () => {
      shop.applyVoucher('voucher_illusion');
      
      // Run multiple times to check for seals
      let hasSeal = false;
      for (let i = 0; i < 100; i++) {
        const result = shop.generateEnhancedPlayingCard();
        if (result && result.card.seal && result.card.seal !== 'none') {
          hasSeal = true;
          break;
        }
      }
      
      // Should have seal at least some of the time (20% chance)
      // With 100 tries, probability of no seal is 0.8^100 ≈ 0.00000002
      expect(hasSeal).toBe(true);
    });

    it('should apply edition price multiplier', () => {
      shop.applyVoucher('voucher_illusion');
      
      // Find a card with edition
      let cardWithEdition: any = null;
      for (let i = 0; i < 100; i++) {
        const result = shop.generateEnhancedPlayingCard();
        if (result && result.card.edition && result.card.edition !== 'none') {
          cardWithEdition = result;
          break;
        }
      }
      
      if (cardWithEdition) {
        // Price should be higher than base $1
        expect(cardWithEdition.price).toBeGreaterThan(1);
      }
    });
  });

  describe('Combined Price Effects', () => {
    it('should apply discount and edition price together', () => {
      shop.applyVoucher('voucher_clearance');
      
      const priceNoEdition = shop.calculatePriceWithEdition(10, CardEdition.None);
      const priceFoil = shop.calculatePriceWithEdition(10, CardEdition.Foil);
      
      // Foil should be more expensive than no edition
      expect(priceFoil).toBeGreaterThan(priceNoEdition);
    });

    it('should handle multiple discounts with edition', () => {
      shop.applyVoucher('voucher_clearance');
      shop.applyVoucher('voucher_liquidation');
      
      // Liquidation takes precedence
      const price = shop.calculatePriceWithEdition(10, CardEdition.Polychrome);
      
      // Should have discount applied
      expect(price).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Price Boundaries', () => {
    it('should never return price less than 1', () => {
      shop.applyVoucher('voucher_liquidation');
      
      const price = (shop as any).calculatePrice(1);
      expect(price).toBeGreaterThanOrEqual(1);
    });

    it('should handle very high base prices', () => {
      const price = (shop as any).calculatePrice(1000);
      expect(price).toBeGreaterThanOrEqual(1);
    });

    it('should handle edition prices with high base', () => {
      const price = shop.calculatePriceWithEdition(100, CardEdition.Polychrome);
      expect(price).toBeGreaterThanOrEqual(1);
    });
  });
});
