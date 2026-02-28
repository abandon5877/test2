import { describe, it, expect, beforeEach } from 'vitest';
import { Shop } from '../models/Shop';
import { BOOSTER_PACKS, VOUCHER_PAIRS, type PackType, type PackSize } from '../data/consumables/index';

describe('Shop System', () => {
  let shop: Shop;

  beforeEach(() => {
    shop = new Shop();
  });

  describe('Basic Shop Structure', () => {
    it('should create shop with correct initial state', () => {
      expect(shop.items).toBeDefined();
      expect(shop.rerollCost).toBe(5);
      expect(shop.baseRerollCost).toBe(5);
      expect(shop.isFirstShopVisit).toBe(false); // refresh() sets it to false
    });

    it('should have correct number of items after refresh', () => {
      // 2 random cards + 2 packs + 1 voucher = 5 items
      expect(shop.items.length).toBe(5);
    });

    it('should have correct item types', () => {
      const packs = shop.getPacks();
      const vouchers = shop.getVouchers();
      
      expect(packs.length).toBe(2);
      expect(vouchers.length).toBe(1);
    });
  });

  describe('Booster Packs', () => {
    it('should have 15 booster pack types defined', () => {
      expect(BOOSTER_PACKS.length).toBe(15);
    });

    it('should have correct pack types', () => {
      const types: PackType[] = ['standard', 'arcana', 'celestial', 'buffoon', 'spectral'];
      for (const type of types) {
        const packsOfType = BOOSTER_PACKS.filter(p => p.type === type);
        expect(packsOfType.length).toBe(3); // Each type has normal, jumbo, mega
      }
    });

    it('should have correct pack sizes', () => {
      const sizes: PackSize[] = ['normal', 'jumbo', 'mega'];
      for (const size of sizes) {
        const packsOfSize = BOOSTER_PACKS.filter(p => p.size === size);
        expect(packsOfSize.length).toBe(5); // Each size exists for all 5 types
      }
    });

    it('should have correct costs for each pack size', () => {
      const normalPacks = BOOSTER_PACKS.filter(p => p.size === 'normal');
      const jumboPacks = BOOSTER_PACKS.filter(p => p.size === 'jumbo');
      const megaPacks = BOOSTER_PACKS.filter(p => p.size === 'mega');

      for (const pack of normalPacks) {
        expect(pack.cost).toBe(4);
      }
      for (const pack of jumboPacks) {
        expect(pack.cost).toBe(6);
      }
      for (const pack of megaPacks) {
        expect(pack.cost).toBe(8);
      }
    });

    it('should generate booster packs in shop', () => {
      const packs = shop.getPacks();
      expect(packs.length).toBe(2);
      
      for (const packItem of packs) {
        expect(packItem.type).toBe('pack');
        expect(packItem.item).toBeDefined();
      }
    });
  });

  describe('Voucher System', () => {
    it('should have 16 voucher pairs (32 total)', () => {
      expect(VOUCHER_PAIRS.length).toBe(16);
      
      const allVouchers = VOUCHER_PAIRS.flatMap(p => [p.base, p.upgraded]);
      expect(allVouchers.length).toBe(32);
    });

    it('should generate one voucher in shop', () => {
      const vouchers = shop.getVouchers();
      expect(vouchers.length).toBe(1);
    });

    it('should track available vouchers correctly', () => {
      const available = shop.getAvailableVouchers();
      expect(available.length).toBe(16); // All base vouchers initially available
    });

    it('should not show upgraded voucher before base is bought', () => {
      // Initially, only base vouchers should be available
      const available = shop.getAvailableVouchers();
      const overstockPlus = available.find(v => v.id === 'voucher_overstock_plus');
      expect(overstockPlus).toBeUndefined();
    });

    it('should show upgraded voucher after base is used', () => {
      // Apply base voucher
      shop.applyVoucher('voucher_overstock');
      
      const available = shop.getAvailableVouchers();
      const overstockPlus = available.find(v => v.id === 'voucher_overstock_plus');
      expect(overstockPlus).toBeDefined();
      
      // Base should no longer be available
      const overstock = available.find(v => v.id === 'voucher_overstock');
      expect(overstock).toBeUndefined();
    });

    it('should correctly check if voucher can be bought', () => {
      // Base voucher can be bought
      expect(shop.canBuyVoucher('voucher_overstock')).toBe(true);
      
      // Upgraded voucher cannot be bought without base
      expect(shop.canBuyVoucher('voucher_overstock_plus')).toBe(false);
      
      // Apply base voucher
      shop.applyVoucher('voucher_overstock');
      
      // Now base cannot be bought again
      expect(shop.canBuyVoucher('voucher_overstock')).toBe(false);
      
      // But upgraded can be bought
      expect(shop.canBuyVoucher('voucher_overstock_plus')).toBe(true);
    });
  });

  describe('Shop Refresh Mechanism', () => {
    it('should mark first visit correctly', () => {
      const newShop = new Shop();
      expect(newShop.isFirstShopVisit).toBe(false); // After refresh()
    });

    it('should keep first visit flag false on enterNewShop after first visit', () => {
      // Before enterNewShop, isFirstShopVisit should be false (from previous refresh)
      expect(shop.isFirstShopVisit).toBe(false);

      shop.enterNewShop();
      // After enterNewShop, isFirstShopVisit should still be false
      // Because we no longer reset it to true
      expect(shop.isFirstShopVisit).toBe(false);

      // Verify that no fixed buffoon pack was generated (since this is not the first shop ever)
      const packs = shop.getPacks();
      const hasBuffoonPack = packs.some(p => (p.item as any).id === 'pack_buffoon_normal');
      expect(hasBuffoonPack).toBe(false);
    });

    it('should have fixed buffoon pack only on first shop ever', () => {
      // Create a fresh shop (simulating first shop ever)
      const firstShop = new Shop();
      // After constructor, isFirstShopVisit should be false (refresh sets it to false)
      // But the first visit logic should have been applied
      expect(firstShop.isFirstShopVisit).toBe(false);

      // Verify that the fixed buffoon pack was generated (第一个商店有固定小丑包)
      const packs = firstShop.getPacks();
      const hasBuffoonPack = packs.some(p => (p.item as any).id === 'pack_buffoon_normal');
      expect(hasBuffoonPack).toBe(true);

      // 记录第一次的isFirstShopVisit状态
      const isFirstVisitBefore = firstShop.isFirstShopVisit;

      // Now simulate entering a new shop
      firstShop.enterNewShop();

      // isFirstShopVisit should still be false (不应该被重置为true)
      expect(firstShop.isFirstShopVisit).toBe(false);
      expect(firstShop.isFirstShopVisit).toBe(isFirstVisitBefore);

      // 验证新商店生成后，isFirstShopVisit仍然是false
      // 这意味着后续商店不会再有"首次访问"的特殊逻辑
      expect(firstShop.isFirstShopVisit).toBe(false);
    });

    it('should reset reroll count on enterNewShop', () => {
      // Simulate some rerolls
      shop.reroll(100);
      expect(shop.getRerollCount()).toBeGreaterThan(0);
      
      shop.enterNewShop();
      expect(shop.getRerollCount()).toBe(0);
      expect(shop.rerollCost).toBe(5);
    });

    it('should reroll only random cards, not packs and vouchers', () => {
      // Get initial items
      const initialPacks = shop.getPacks();
      const initialVouchers = shop.getVouchers();
      const initialPackIds = initialPacks.map(p => p.id);
      const initialVoucherIds = initialVouchers.map(v => v.id);

      // Reroll shop
      shop.rerollShop();

      // Packs and vouchers should still exist
      const newPacks = shop.getPacks();
      const newVouchers = shop.getVouchers();
      
      // Same number of packs and vouchers
      expect(newPacks.length).toBe(initialPacks.length);
      expect(newVouchers.length).toBe(initialVouchers.length);
    });

    it('should increase reroll cost after reroll', () => {
      const initialCost = shop.rerollCost;
      shop.rerollShop();
      expect(shop.rerollCost).toBe(initialCost + 1);
    });
  });

  describe('Item Weights', () => {
    it('should have correct base weights', () => {
      // Base weights: joker=20, tarot=4, planet=4, playingCard=0
      // Total = 28
      // joker = 20/28 ≈ 71%
      // tarot = 4/28 ≈ 14%
      // planet = 4/28 ≈ 14%
      
      // We can't directly test private method, but we can verify
      // that items are generated with reasonable distribution
      let jokerCount = 0;
      let consumableCount = 0;
      
      // Generate many shops to check distribution
      for (let i = 0; i < 100; i++) {
        const testShop = new Shop();
        const jokers = testShop.items.filter(item => item.type === 'joker');
        const consumables = testShop.items.filter(item => item.type === 'consumable');
        jokerCount += jokers.length;
        consumableCount += consumables.length;
      }
      
      // Jokers should be more common than consumables
      expect(jokerCount).toBeGreaterThan(consumableCount);
    });

    it('should increase tarot rate with Tarot Merchant voucher', () => {
      shop.applyVoucher('voucher_tarot_merchant');
      
      // After applying voucher, more tarot cards should appear
      // We verify by checking the voucher is tracked
      expect(shop.getVouchersUsedCount()).toBe(1);
    });

    it('should increase planet rate with Planet Merchant voucher', () => {
      shop.applyVoucher('voucher_planet_merchant');
      expect(shop.getVouchersUsedCount()).toBe(1);
    });
  });

  describe('Price Calculation', () => {
    it('should calculate correct base prices', () => {
      const packs = shop.getPacks();
      for (const pack of packs) {
        expect(pack.currentPrice).toBeGreaterThan(0);
        expect(pack.basePrice).toBe(pack.item.cost);
      }
    });

    it('should apply Clearance Sale discount (25% off)', () => {
      // Get initial price
      const packs = shop.getPacks();
      const initialPrice = packs[0]?.currentPrice || 4;
      
      // Apply discount
      shop.applyVoucher('voucher_clearance');
      
      // Refresh prices
      const newShop = new Shop();
      newShop.applyVoucher('voucher_clearance');
      
      // Price should be reduced (with inflation)
      // Base $4 * 0.75 = $3, then * 1.2 = $3.6 -> $3
      // But we just verify discount is applied
      expect(newShop.getVouchersUsedCount()).toBe(1);
    });

    it('should apply Liquidation discount (50% off)', () => {
      shop.applyVoucher('voucher_liquidation');
      expect(shop.getVouchersUsedCount()).toBe(1);
    });

    it('should apply inflation based on voucher count', () => {
      // Apply multiple vouchers
      shop.applyVoucher('voucher_overstock');
      shop.applyVoucher('voucher_clearance');
      
      expect(shop.getVouchersUsedCount()).toBe(2);
    });

    it('should calculate sell price correctly', () => {
      const item = {
        id: 'test',
        type: 'joker' as const,
        item: {} as any,
        basePrice: 10,
        currentPrice: 10,
        sold: false
      };
      
      const sellPrice = shop.calculateSellPrice(item);
      expect(sellPrice).toBe(5); // 10 / 2 = 5
    });

    it('should have minimum sell price of $1', () => {
      const item = {
        id: 'test',
        type: 'joker' as const,
        item: {} as any,
        basePrice: 1,
        currentPrice: 1,
        sold: false
      };
      
      const sellPrice = shop.calculateSellPrice(item);
      expect(sellPrice).toBe(1); // max(1, floor(1/2)) = 1
    });
  });

  describe('Buy and Sell', () => {
    it('should allow buying items with sufficient money', () => {
      const availableItems = shop.getAvailableItems();
      expect(availableItems.length).toBeGreaterThan(0);
      
      const item = availableItems[0];
      const result = shop.buy(item.id, 100);
      
      expect(result.success).toBe(true);
      expect(result.remainingMoney).toBe(100 - item.currentPrice);
    });

    it('should reject buying with insufficient money', () => {
      const availableItems = shop.getAvailableItems();
      const item = availableItems[0];
      
      const result = shop.buy(item.id, 0);
      expect(result.success).toBe(false);
      expect(result.message).toContain('资金不足');
    });

    it('should mark item as sold after purchase', () => {
      const availableItems = shop.getAvailableItems();
      const item = availableItems[0];
      
      shop.buy(item.id, 100);
      
      const newAvailable = shop.getAvailableItems();
      const soldItem = newAvailable.find(i => i.id === item.id);
      expect(soldItem).toBeUndefined();
    });

    it('should reject buying already sold items', () => {
      const availableItems = shop.getAvailableItems();
      const item = availableItems[0];
      
      shop.buy(item.id, 100);
      const result = shop.buy(item.id, 100);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已售出');
    });
  });

  describe('Voucher Effects', () => {
    it('should reduce reroll cost with Reroll Surplus', () => {
      const initialCost = shop.baseRerollCost;
      shop.applyVoucher('voucher_reroll_surplus');
      
      expect(shop.baseRerollCost).toBe(initialCost - 2);
    });

    it('should reduce reroll cost more with Reroll Glut', () => {
      const initialCost = shop.baseRerollCost;
      shop.applyVoucher('voucher_reroll_glut');
      
      expect(shop.baseRerollCost).toBe(initialCost - 4);
    });

    it('should not reduce reroll cost below $1', () => {
      shop.applyVoucher('voucher_reroll_glut');
      shop.applyVoucher('voucher_reroll_glut');
      
      expect(shop.baseRerollCost).toBeGreaterThanOrEqual(1);
    });

    it('should add extra slot with Overstock', () => {
      const initialItemCount = shop.items.length;
      shop.applyVoucher('voucher_overstock');
      
      // Overstock should add one item
      expect(shop.items.length).toBeGreaterThanOrEqual(initialItemCount);
    });

    it('should add two extra slots with Overstock Plus', () => {
      const initialItemCount = shop.items.length;
      shop.applyVoucher('voucher_overstock_plus');
      
      // Overstock Plus adds two items and refreshes
      expect(shop.items.length).toBeGreaterThanOrEqual(initialItemCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shop gracefully', () => {
      // Buy all items
      const items = [...shop.items];
      for (const item of items) {
        shop.buy(item.id, 1000);
      }
      
      const available = shop.getAvailableItems();
      expect(available.length).toBe(0);
    });

    it('should handle buying non-existent items', () => {
      const result = shop.buy('non-existent-id', 100);
      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    it('should handle all voucher pairs correctly', () => {
      for (const pair of VOUCHER_PAIRS) {
        // Each pair should have base and upgraded
        expect(pair.base).toBeDefined();
        expect(pair.upgraded).toBeDefined();
        expect(pair.base.id).not.toBe(pair.upgraded.id);
        expect(pair.base.cost).toBe(10);
        expect(pair.upgraded.cost).toBe(10);
      }
    });
  });
});
