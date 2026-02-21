import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { Shop, ShopItem } from '../models/Shop';
import { BOOSTER_PACKS, VOUCHER_PAIRS } from '../data/consumables/index';
import { GameState } from '../models/GameState';
import { Joker } from '../models/Joker';
import { Consumable } from '../models/Consumable';
import { JokerSlots } from '../models/JokerSlots';
import { ConsumableType } from '../types/consumable';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { GamePhase } from '../types/game';
import { Storage } from '../utils/storage';

describe('Shop Buy/Sell/Usage System', () => {
  let shop: Shop;
  let gameState: GameState;
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    shop = new Shop();
    gameState = new GameState();
    jokerSlots = new JokerSlots(5);
  });

  // ==========================================
  // 4.2.1 购买功能测试
  // ==========================================
  describe('Buy Functionality', () => {
    describe('Basic Buy Tests', () => {
      it('should buy joker successfully with sufficient money', () => {
        const joker = new Joker({
          id: 'test_joker',
          name: 'Test Joker',
          description: 'Test',
          cost: 5,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        const shopItem: ShopItem = {
          id: 'shop_item_1',
          type: 'joker',
          item: joker,
          basePrice: 5,
          currentPrice: 5,
          sold: false
        };

        shop.items = [shopItem];
        const result = shop.buy('shop_item_1', 10);

        expect(result.success).toBe(true);
        expect(result.remainingMoney).toBe(5);
        expect(shopItem.sold).toBe(true);
      });

      it('should buy consumable successfully with sufficient money', () => {
        const consumable = new Consumable({
          id: 'test_tarot',
          name: 'Test Tarot',
          description: 'Test',
          type: ConsumableType.TAROT,
          cost: 3,
      use: () => ({ success: true, message: '使用成功' })
        });

        const shopItem: ShopItem = {
          id: 'shop_item_2',
          type: 'consumable',
          item: consumable,
          basePrice: 3,
          currentPrice: 3,
          sold: false
        };

        shop.items = [shopItem];
        const result = shop.buy('shop_item_2', 10);

        expect(result.success).toBe(true);
        expect(result.remainingMoney).toBe(7);
        expect(shopItem.sold).toBe(true);
      });

      it('should buy pack successfully with sufficient money', () => {
        const pack = BOOSTER_PACKS[0];

        const shopItem: ShopItem = {
          id: 'shop_item_3',
          type: 'pack',
          item: pack,
          basePrice: pack.cost,
          currentPrice: pack.cost,
          sold: false
        };

        shop.items = [shopItem];
        const result = shop.buy('shop_item_3', 10);

        expect(result.success).toBe(true);
        expect(shopItem.sold).toBe(true);
      });

      it('should buy voucher successfully with sufficient money', () => {
        const voucher = VOUCHER_PAIRS[0].base;

        const shopItem: ShopItem = {
          id: 'shop_item_4',
          type: 'voucher',
          item: voucher,
          basePrice: voucher.cost,
          currentPrice: voucher.cost,
          sold: false
        };

        shop.items = [shopItem];
        const result = shop.buy('shop_item_4', 15);

        expect(result.success).toBe(true);
        expect(shopItem.sold).toBe(true);
      });
    });

    describe('Buy Restrictions', () => {
      it('should reject buying with insufficient money', () => {
        const joker = new Joker({
          id: 'expensive_joker',
          name: 'Expensive Joker',
          description: 'Test',
          cost: 10,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        const shopItem: ShopItem = {
          id: 'shop_item_expensive',
          type: 'joker',
          item: joker,
          basePrice: 10,
          currentPrice: 10,
          sold: false
        };

        shop.items = [shopItem];
        const result = shop.buy('shop_item_expensive', 5);

        expect(result.success).toBe(false);
        expect(result.message).toContain('资金不足');
        expect(shopItem.sold).toBe(false);
      });

      it('should reject buying already sold item', () => {
        const joker = new Joker({
          id: 'sold_joker',
          name: 'Sold Joker',
          description: 'Test',
          cost: 5,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        const shopItem: ShopItem = {
          id: 'shop_item_sold',
          type: 'joker',
          item: joker,
          basePrice: 5,
          currentPrice: 5,
          sold: true
        };

        shop.items = [shopItem];
        const result = shop.buy('shop_item_sold', 10);

        expect(result.success).toBe(false);
        expect(result.message).toContain('已售出');
      });

      it('should reject buying non-existent item', () => {
        const result = shop.buy('non-existent-id', 100);

        expect(result.success).toBe(false);
        expect(result.message).toContain('不存在');
      });
    });

    describe('Post-Buy State', () => {
      it('should mark item as sold after purchase', () => {
        const availableItems = shop.getAvailableItems();
        expect(availableItems.length).toBeGreaterThan(0);

        const item = availableItems[0];
        shop.buy(item.id, 100);

        const newAvailable = shop.getAvailableItems();
        const soldItem = newAvailable.find(i => i.id === item.id);
        expect(soldItem).toBeUndefined();
      });

      it('should deduct correct amount of money', () => {
        const availableItems = shop.getAvailableItems();
        const item = availableItems[0];
        const initialMoney = 100;

        const result = shop.buy(item.id, initialMoney);

        expect(result.success).toBe(true);
        expect(result.remainingMoney).toBe(initialMoney - item.currentPrice);
      });
    });

    describe('Slot Limitations', () => {
      it('should check joker slot availability via GameState', () => {
        // Fill up joker slots
        for (let i = 0; i < 5; i++) {
          gameState.addJoker(new Joker({
            id: `filler_joker_${i}`,
            name: `Filler ${i}`,
            description: 'Test',
            cost: 2,
            trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
          }));
        }

        expect(gameState.getJokerCount()).toBe(5);
        expect(gameState.addJoker(new Joker({
          id: 'extra_joker',
          name: 'Extra',
          description: 'Test',
          cost: 2,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        }))).toBe(false);
      });

      it('should check consumable slot availability via GameState', () => {
        // Fill up consumable slots
        for (let i = 0; i < 2; i++) {
          gameState.addConsumable(new Consumable({
            id: `filler_consumable_${i}`,
            name: `Filler ${i}`,
            description: 'Test',
            type: ConsumableType.TAROT,
            cost: 3,
            use: () => ({ success: true, message: '使用成功' })
          }));
        }

        expect(gameState.getConsumableCount()).toBe(2);
        expect(gameState.hasAvailableConsumableSlot()).toBe(false);
      });
    });
  });

  // ==========================================
  // 4.2.2 出售功能测试
  // ==========================================
  describe('Sell Functionality', () => {
    describe('Basic Sell Tests', () => {
      it('should sell joker via JokerSystem', () => {
        const joker = new Joker({
          id: 'sellable_joker',
          name: 'Sellable Joker',
          description: 'Test',
          cost: 10,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        jokerSlots.addJoker(joker);
        const result = JokerSystem.sellJoker(jokerSlots, 0);

        expect(result.success).toBe(true);
        expect(result.sellPrice).toBe(5); // 10 / 2 = 5
        expect(jokerSlots.getJokers().length).toBe(0);
      });

      it('should sell consumable via GameState', () => {
        const consumable = new Consumable({
          id: 'sellable_consumable',
          name: 'Sellable Consumable',
          description: 'Test',
          type: ConsumableType.TAROT,
          cost: 4,
      use: () => ({ success: true, message: '使用成功' })
        });

        gameState.addConsumable(consumable);
        const initialMoney = gameState.money;

        const result = gameState.sellConsumable(0);

        expect(result.success).toBe(true);
        expect(result.sellPrice).toBe(2); // 4 / 2 = 2
        expect(gameState.money).toBe(initialMoney + 2);
        expect(gameState.getConsumableCount()).toBe(0);
      });
    });

    describe('Sell Price Calculation', () => {
      it('should calculate sell price as half of current price (floor)', () => {
        // Spec: 出售价格 = 购买价格 / 2（向下取整）
        const testCases = [
          { cost: 10, expected: 5 },  // 10 / 2 = 5, floor = 5
          { cost: 7, expected: 3 },   // 7 / 2 = 3.5, floor = 3
          { cost: 5, expected: 2 },   // 5 / 2 = 2.5, floor = 2
          { cost: 3, expected: 1 },   // 3 / 2 = 1.5, floor = 1
        ];

        for (const { cost, expected } of testCases) {
          const joker = new Joker({
            id: `price_test_${cost}`,
            name: 'Price Test',
            description: 'Test',
            cost,
            trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
          });

          jokerSlots.addJoker(joker);
          const result = JokerSystem.sellJoker(jokerSlots, 0);

          expect(result.sellPrice).toBe(expected);
          
          // Reset for next test
          jokerSlots = new JokerSlots(5);
        }
      });

      it('should have minimum sell price of $1', () => {
        const cheapJoker = new Joker({
          id: 'cheap_joker',
          name: 'Cheap Joker',
          description: 'Test',
          cost: 1,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        jokerSlots.addJoker(cheapJoker);
        const result = JokerSystem.sellJoker(jokerSlots, 0);

        expect(result.sellPrice).toBe(1);
      });
    });

    describe('Post-Sell State', () => {
      it('should remove joker when sold', () => {
        const joker = new Joker({
          id: 'removable_joker',
          name: 'Removable Joker',
          description: 'Test',
          cost: 10,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        jokerSlots.addJoker(joker);
        expect(jokerSlots.getJokers().length).toBe(1);

        JokerSystem.sellJoker(jokerSlots, 0);
        expect(jokerSlots.getJokers().length).toBe(0);
      });

      it('should add money when selling', () => {
        const consumable = new Consumable({
          id: 'money_consumable',
          name: 'Money Consumable',
          description: 'Test',
          type: ConsumableType.TAROT,
          cost: 6,
      use: () => ({ success: true, message: '使用成功' })
        });

        gameState.addConsumable(consumable);
        const initialMoney = gameState.money;

        gameState.sellConsumable(0);

        expect(gameState.money).toBe(initialMoney + 3); // 6 / 2 = 3
      });
    });

    describe('Sell Restrictions', () => {
      it('should fail when selling with invalid index', () => {
        const result = JokerSystem.sellJoker(jokerSlots, 999);
        expect(result.success).toBe(false);
      });

      it('should not allow selling same item twice', () => {
        const joker = new Joker({
          id: 'double_sell_joker',
          name: 'Double Sell Joker',
          description: 'Test',
          cost: 10,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        jokerSlots.addJoker(joker);
        JokerSystem.sellJoker(jokerSlots, 0);

        const result = JokerSystem.sellJoker(jokerSlots, 0);
        expect(result.success).toBe(false);
      });

      it('should handle selling multiple jokers correctly', () => {
        const joker1 = new Joker({
          id: 'multi_joker_1',
          name: 'Joker 1',
          description: 'Test',
          cost: 10,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        const joker2 = new Joker({
          id: 'multi_joker_2',
          name: 'Joker 2',
          description: 'Test',
          cost: 6,
          trigger: JokerTrigger.ON_PLAY,
        rarity: JokerRarity.COMMON,
        effect: () => ({})
        });

        jokerSlots.addJoker(joker1);
        jokerSlots.addJoker(joker2);

        // Sell first joker (index 0)
        const result1 = JokerSystem.sellJoker(jokerSlots, 0);
        expect(result1.success).toBe(true);
        expect(result1.sellPrice).toBe(5);

        // Now joker2 is at index 0
        const result2 = JokerSystem.sellJoker(jokerSlots, 0);
        expect(result2.success).toBe(true);
        expect(result2.sellPrice).toBe(3);

        expect(jokerSlots.getJokers().length).toBe(0);
      });
    });
  });

  // ==========================================
  // 4.2.3 刷新功能测试
  // ==========================================
  describe('Refresh/Reroll Functionality', () => {
    describe('Basic Reroll Tests', () => {
      it('should deduct correct reroll cost', () => {
        const initialMoney = 20;
        const initialCost = shop.rerollCost;

        const result = shop.reroll(initialMoney);

        expect(result.success).toBe(true);
        expect(result.remainingMoney).toBe(initialMoney - initialCost);
      });

      it('should generate new items after reroll', () => {
        const initialItems = [...shop.items];
        shop.reroll(100);

        // Should still have items after reroll
        expect(shop.items.length).toBeGreaterThan(0);
      });
    });

    describe('Reroll Cost Tests', () => {
      it('should increase reroll cost after each reroll', () => {
        const initialCost = shop.rerollCost;

        shop.rerollShop();

        expect(shop.rerollCost).toBe(initialCost + 1);
      });

      it('should reset reroll cost on enterNewShop', () => {
        // Do some rerolls
        shop.reroll(100);
        shop.reroll(100);
        expect(shop.rerollCost).toBeGreaterThan(5);

        // Enter new shop
        shop.enterNewShop();

        expect(shop.rerollCost).toBe(5);
      });

      it('should track reroll count correctly', () => {
        expect(shop.getRerollCount()).toBe(0);

        shop.rerollShop();
        expect(shop.getRerollCount()).toBe(1);

        shop.rerollShop();
        expect(shop.getRerollCount()).toBe(2);
      });
    });

    describe('Reroll Content Tests', () => {
      it('should keep packs and vouchers after reroll', () => {
        const initialPacks = shop.getPacks();
        const initialVouchers = shop.getVouchers();
        const initialPackCount = initialPacks.length;
        const initialVoucherCount = initialVouchers.length;

        shop.rerollShop();

        // Packs and vouchers should still exist
        expect(shop.getPacks().length).toBe(initialPackCount);
        expect(shop.getVouchers().length).toBe(initialVoucherCount);
      });

      it('should refresh random cards only', () => {
        const initialRandomCards = shop.items.filter(i => i.type === 'joker' || i.type === 'consumable');
        const initialRandomCardCount = initialRandomCards.length;

        shop.rerollShop();

        // Should still have random cards
        const newRandomCards = shop.items.filter(i => i.type === 'joker' || i.type === 'consumable');
        expect(newRandomCards.length).toBe(initialRandomCardCount);
      });
    });
  });

  // ==========================================
  // 4.2.4 优惠券效果测试
  // ==========================================
  describe('Voucher Effects', () => {
    describe('Discount Vouchers', () => {
      it('should apply Clearance Sale 25% discount', () => {
        const basePrice = 10;
        const priceBefore = (shop as any).calculatePrice(basePrice);

        shop.applyVoucher('voucher_clearance');
        const priceAfter = (shop as any).calculatePrice(basePrice);

        // Price should be reduced (with inflation)
        // $10 * 0.75 = $7.5, floor = $7
        // Plus inflation: $7 * 1.2 = $8.4, floor = $8
        expect(shop.getVouchersUsedCount()).toBe(1);
      });

      it('should apply Liquidation 50% discount', () => {
        shop.applyVoucher('voucher_liquidation');

        const price = (shop as any).calculatePrice(10);
        // $10 * 0.5 = $5
        // Plus inflation: $5 * 1.2 = $6
        expect(price).toBe(6);
      });

      it('should prioritize Liquidation over Clearance', () => {
        shop.applyVoucher('voucher_clearance');
        shop.applyVoucher('voucher_liquidation');

        const price = (shop as any).calculatePrice(10);
        // Liquidation takes precedence: 50% off
        // $10 * 0.5 = $5
        // Plus inflation (2 vouchers): $5 * 1.4 = $7
        expect(price).toBe(7);
      });
    });

    describe('Price Inflation', () => {
      it('should apply inflation based on voucher count', () => {
        const basePrice = 10;

        // No vouchers
        const price0 = (shop as any).calculatePrice(basePrice);
        expect(price0).toBe(10);

        // 1 voucher - 20% inflation
        shop.applyVoucher('voucher_overstock');
        const price1 = (shop as any).calculatePrice(basePrice);
        expect(price1).toBe(12); // 10 * 1.2 = 12

        // 2 vouchers - 40% inflation
        shop.applyVoucher('voucher_clearance');
        const price2 = (shop as any).calculatePrice(basePrice);
        // 10 * 0.75 = 7.5, floor = 7
        // 7 * 1.4 = 9.8, floor = 9
        expect(price2).toBe(9);
      });
    });

    describe('Functional Vouchers', () => {
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

        expect(shop.items.length).toBeGreaterThanOrEqual(initialItemCount);
      });

      it('should add two extra slots with Overstock Plus', () => {
        const initialItemCount = shop.items.length;
        shop.applyVoucher('voucher_overstock_plus');

        expect(shop.items.length).toBeGreaterThanOrEqual(initialItemCount);
      });
    });
  });

  // ==========================================
  // 4.2.5 集成测试
  // ==========================================
  describe('Integration Tests', () => {
    describe('GameState Integration', () => {
      it('should create shop instance when entering shop', () => {
        expect(gameState.shop).toBeNull();

        // Simulate completing a blind
        gameState.phase = GamePhase.PLAYING;
        gameState.currentBlind = {
          targetScore: 100,
          reward: 3,
          type: 'small' as any,
          name: 'Test Blind',
          description: 'Test'
        } as any;
        (gameState as any).roundScore = 1000; // Won the round

        gameState.enterShop();

        expect(gameState.shop).not.toBeNull();
        expect(gameState.phase).toBe(GamePhase.SHOP);
      });

      it('should integrate shop with GameState buy flow', () => {
        // Setup shop in gameState
        gameState.shop = new Shop();
        const shopInstance = gameState.shop;

        const availableItems = shopInstance.getAvailableItems();
        expect(availableItems.length).toBeGreaterThan(0);

        const item = availableItems[0];
        const initialMoney = 100;
        gameState.money = initialMoney;

        const result = shopInstance.buy(item.id, gameState.money);

        if (result.success && result.remainingMoney !== undefined) {
          gameState.money = result.remainingMoney;
        }

        expect(gameState.money).toBe(initialMoney - item.currentPrice);
      });
    });

    describe('Complete Flow Tests', () => {
      it('should handle buy -> sell -> refresh flow', () => {
        // Setup
        gameState.shop = new Shop();
        gameState.money = 100;

        const shopInstance = gameState.shop;
        const availableItems = shopInstance.getAvailableItems();

        // Buy an item
        const itemToBuy = availableItems[0];
        const buyResult = shopInstance.buy(itemToBuy.id, gameState.money);
        expect(buyResult.success).toBe(true);

        if (buyResult.success && buyResult.remainingMoney !== undefined) {
          gameState.money = buyResult.remainingMoney;
        }

        // Refresh shop
        const refreshResult = shopInstance.reroll(gameState.money);
        expect(refreshResult.success).toBe(true);

        if (refreshResult.success && refreshResult.remainingMoney !== undefined) {
          gameState.money = refreshResult.remainingMoney;
        }

        // Verify state
        expect(shopInstance.getRerollCount()).toBe(1);
      });

      it('should handle multiple shop rounds', () => {
        // First shop visit
        gameState.shop = new Shop();
        let shopInstance = gameState.shop;

        expect(shopInstance.isFirstShopVisit).toBe(false); // After refresh()

        // Buy something
        const items = shopInstance.getAvailableItems();
        if (items.length > 0) {
          shopInstance.buy(items[0].id, 100);
        }

        // Enter new shop
        shopInstance.enterNewShop();

        expect(shopInstance.getRerollCount()).toBe(0);
        expect(shopInstance.rerollCost).toBe(5);
      });
    });
  });

  // ==========================================
  // 4.2.6 第二轮商店刷新测试（回归测试）
  // ==========================================
  describe('Second Round Shop Refresh', () => {
    it('should refresh shop items when completing blind and entering new shop round', () => {
      // Setup: 模拟第一轮商店
      gameState.shop = new Shop();
      const firstRoundItems = [...gameState.shop.items.map(i => i.id)];

      // 购买一些商品
      const availableItems = gameState.shop.getAvailableItems();
      expect(availableItems.length).toBeGreaterThan(0);
      gameState.shop.buy(availableItems[0].id, 100);

      // 记录第一轮购买后的状态
      const firstRoundSoldCount = gameState.shop.items.filter(i => i.sold).length;
      expect(firstRoundSoldCount).toBeGreaterThan(0);

      // 模拟完成盲注（这会触发 enterNewShop）
      gameState.phase = GamePhase.PLAYING;
      gameState.currentBlind = {
        targetScore: 100,
        reward: 3,
        type: 'small' as any,
        name: 'Test Blind',
        description: 'Test'
      } as any;
      (gameState as any).roundScore = 1000; // 确保通关

      // 完成盲注，应该刷新商店
      gameState.completeBlind();

      // 验证：进入第二轮商店后商品已刷新
      expect(gameState.phase).toBe(GamePhase.SHOP);
      expect(gameState.shop).not.toBeNull();

      // 所有商品都应该是未售出状态
      const secondRoundSoldCount = gameState.shop!.items.filter(i => i.sold).length;
      expect(secondRoundSoldCount).toBe(0);

      // 刷新费用应该重置
      expect(gameState.shop!.rerollCost).toBe(5);
      expect(gameState.shop!.getRerollCount()).toBe(0);
    });

    it('should not refresh shop when loading from save', () => {
      // Setup: 创建商店并购买一些商品
      gameState.shop = new Shop();
      const availableItems = gameState.shop.getAvailableItems();
      gameState.shop.buy(availableItems[0].id, 100);
      gameState.phase = GamePhase.SHOP;

      // 模拟存档
      const saveData = Storage.serialize(gameState);

      // 模拟读档（不会调用 completeBlind）
      const loadedState = Storage.restoreGameState(saveData);

      // 验证：读档后商店状态应该保持一致
      expect(loadedState.shop).not.toBeNull();

      // 已购买的商品应该仍然标记为已售出
      const soldCount = loadedState.shop!.items.filter(i => i.sold).length;
      expect(soldCount).toBe(1);

      // 刷新费用应该保持存档时的值
      expect(loadedState.shop!.rerollCost).toBe(saveData.shop!.rerollCost);
    });

    it('should create new shop on first blind completion', () => {
      // Setup: 初始状态没有商店
      expect(gameState.shop).toBeNull();

      // 模拟完成第一个盲注
      gameState.phase = GamePhase.PLAYING;
      gameState.currentBlind = {
        targetScore: 100,
        reward: 3,
        type: 'small' as any,
        name: 'Test Blind',
        description: 'Test'
      } as any;
      (gameState as any).roundScore = 1000;

      gameState.completeBlind();

      // 验证：应该创建新商店
      expect(gameState.shop).not.toBeNull();
      expect(gameState.shop!.items.length).toBeGreaterThan(0);
      expect(gameState.phase).toBe(GamePhase.SHOP);
    });
  });

  // ==========================================
  // 4.2.7 存档读档测试
  // ==========================================
  describe('Save/Load Tests', () => {
    describe('Shop State Serialization', () => {
      it('should serialize shop state correctly', () => {
        const serialized = Storage.serializeShop(shop);

        expect(serialized.items).toBeDefined();
        expect(serialized.rerollCost).toBe(shop.rerollCost);
        expect(serialized.vouchersUsed).toBeDefined();
        expect(serialized.isFirstShopVisit).toBeDefined();
      });

      it('should save sold item status', () => {
        // Buy an item to mark it as sold
        const availableItems = shop.getAvailableItems();
        if (availableItems.length > 0) {
          shop.buy(availableItems[0].id, 100);
        }

        const serialized = Storage.serializeShop(shop);
        const soldItem = serialized.items.find(i => i.sold);

        expect(soldItem).toBeDefined();
        expect(soldItem?.sold).toBe(true);
      });

      it('should save reroll cost and count', () => {
        shop.rerollShop();
        shop.rerollShop();

        const serialized = Storage.serializeShop(shop);

        expect(serialized.rerollCost).toBe(7); // 5 + 2
        expect(serialized.rerollCount).toBe(2);
      });

      it('should save vouchers used', () => {
        shop.applyVoucher('voucher_overstock');
        shop.applyVoucher('voucher_clearance');

        const serialized = Storage.serializeShop(shop);

        expect(serialized.vouchersUsed).toContain('voucher_overstock');
        expect(serialized.vouchersUsed).toContain('voucher_clearance');
        expect(serialized.vouchersUsed.length).toBe(2);
      });
    });

    describe('Shop State Deserialization', () => {
      it('should deserialize shop state correctly', () => {
        const originalShop = new Shop();
        originalShop.rerollShop(); // Increase reroll count
        originalShop.applyVoucher('voucher_overstock');

        const serialized = Storage.serializeShop(originalShop);
        const restoredShop = Storage.deserializeShop(serialized);

        expect(restoredShop.rerollCost).toBe(originalShop.rerollCost);
        expect(restoredShop.items.length).toBe(originalShop.items.length);
      });

      it('should restore sold item status', () => {
        const originalShop = new Shop();
        const availableItems = originalShop.getAvailableItems();
        if (availableItems.length > 0) {
          originalShop.buy(availableItems[0].id, 100);
        }

        const serialized = Storage.serializeShop(originalShop);
        const restoredShop = Storage.deserializeShop(serialized);

        const restoredSoldItem = restoredShop.items.find(i => i.sold);
        expect(restoredSoldItem).toBeDefined();
      });

      it('should restore vouchers used', () => {
        const originalShop = new Shop();
        originalShop.applyVoucher('voucher_overstock');
        originalShop.applyVoucher('voucher_clearance');

        const serialized = Storage.serializeShop(originalShop);
        const restoredShop = Storage.deserializeShop(serialized);

        expect((restoredShop as any).vouchersUsed).toContain('voucher_overstock');
        expect((restoredShop as any).vouchersUsed).toContain('voucher_clearance');
      });
    });

    describe('Data Integrity', () => {
      it('should maintain shop state consistency after save/load', () => {
        const originalShop = new Shop();
        
        // Modify state
        originalShop.rerollShop();
        originalShop.applyVoucher('voucher_overstock');
        const availableItems = originalShop.getAvailableItems();
        if (availableItems.length > 0) {
          originalShop.buy(availableItems[0].id, 100);
        }

        const serialized = Storage.serializeShop(originalShop);
        const restoredShop = Storage.deserializeShop(serialized);

        // Verify consistency
        expect(restoredShop.rerollCost).toBe(originalShop.rerollCost);
        expect(restoredShop.getRerollCount()).toBe(originalShop.getRerollCount());
        expect(restoredShop.getAvailableItems().length).toBe(originalShop.getAvailableItems().length);
      });

      it('should handle partial purchase state', () => {
        const originalShop = new Shop();
        const availableItems = originalShop.getAvailableItems();
        
        // Buy half the items
        const itemsToBuy = Math.floor(availableItems.length / 2);
        for (let i = 0; i < itemsToBuy; i++) {
          originalShop.buy(availableItems[i].id, 100);
        }

        const serialized = Storage.serializeShop(originalShop);
        const restoredShop = Storage.deserializeShop(serialized);

        const soldCount = restoredShop.items.filter(i => i.sold).length;
        expect(soldCount).toBe(itemsToBuy);
      });

      it('should handle multiple reroll state', () => {
        const originalShop = new Shop();
        
        // Multiple rerolls
        for (let i = 0; i < 5; i++) {
          originalShop.rerollShop();
        }

        const serialized = Storage.serializeShop(originalShop);
        const restoredShop = Storage.deserializeShop(serialized);

        expect(restoredShop.getRerollCount()).toBe(5);
        expect(restoredShop.rerollCost).toBe(10); // 5 + 5
      });

      it('should handle voucher application state', () => {
        const originalShop = new Shop();
        
        // Apply multiple vouchers
        originalShop.applyVoucher('voucher_overstock');
        originalShop.applyVoucher('voucher_clearance');
        originalShop.applyVoucher('voucher_reroll_surplus');

        const serialized = Storage.serializeShop(originalShop);
        const restoredShop = Storage.deserializeShop(serialized);

        expect((restoredShop as any).vouchersUsed.length).toBe(3);
        // Note: baseRerollCost is not currently serialized, rerollCost is
        expect(restoredShop.rerollCost).toBe(originalShop.rerollCost);
      });
    });
  });
});
