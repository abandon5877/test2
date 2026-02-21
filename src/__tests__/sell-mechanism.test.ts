import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { Shop, type ShopItem } from '../models/Shop';
import { Joker } from '../models/Joker';
import { Consumable } from '../models/Consumable';
import { ConsumableType } from '../types/consumable';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { GameState } from '../models/GameState';
import { JokerSlots } from '../models/JokerSlots';
import type { BoosterPack } from '../data/consumables/index';

describe('Sell Mechanism', () => {
  let gameState: GameState;
  let shop: Shop;
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    gameState = new GameState();
    shop = new Shop();
    jokerSlots = new JokerSlots(5);
  });

  describe('Shop Item Sell Price Calculation', () => {
    it('should calculate sell price for shop jokers', () => {
      const joker = new Joker({
        id: 'shop_joker',
        name: 'Shop Joker',
        description: 'Test',
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
      rarity: JokerRarity.COMMON,
      effect: () => ({})
      });

      const shopItem = {
        id: 'shop_item_1',
        type: 'joker' as const,
        item: joker,
        basePrice: 10,
        currentPrice: 10,
        sold: false
      };

      const sellPrice = shop.calculateSellPrice(shopItem);
      expect(sellPrice).toBe(5);
    });

    it('should calculate sell price for shop consumables', () => {
      const consumable = new Consumable({
        id: 'shop_tarot',
        name: 'Shop Tarot',
        description: 'Test',
        type: ConsumableType.TAROT,
        cost: 3,
      use: () => ({ success: true, message: '使用成功' })
      });

      const shopItem = {
        id: 'shop_item_2',
        type: 'consumable' as const,
        item: consumable,
        basePrice: 3,
        currentPrice: 3,
        sold: false
      };

      const sellPrice = shop.calculateSellPrice(shopItem);
      expect(sellPrice).toBe(1);
    });

    it('should calculate sell price for shop packs', () => {
      const pack: BoosterPack = {
        id: 'pack_standard',
        name: 'Standard Pack',
        description: 'Test pack',
        type: 'standard',
        size: 'normal',
        cost: 4,
        choices: 3,
        selectCount: 1
      };

      const shopItem: ShopItem = {
        id: 'shop_item_3',
        type: 'pack',
        item: pack,
        basePrice: 4,
        currentPrice: 4,
        sold: false
      };

      const sellPrice = shop.calculateSellPrice(shopItem);
      expect(sellPrice).toBe(2);
    });

    it('should apply minimum sell price of $1', () => {
      const cheapItem = {
        id: 'cheap_item',
        type: 'consumable' as const,
        item: new Consumable({
          id: 'cheap_tarot',
          name: 'Cheap Tarot',
          description: 'Test',
          type: ConsumableType.TAROT,
          cost: 1,
      use: () => ({ success: true, message: '使用成功' })
        }),
        basePrice: 1,
        currentPrice: 1,
        sold: false
      };

      const sellPrice = shop.calculateSellPrice(cheapItem);
      expect(sellPrice).toBe(1);
    });
  });

  describe('Sell Price Formula', () => {
    it('should use floor division for sell price', () => {
      const item1 = {
        id: 'item1',
        type: 'joker' as const,
        item: new Joker({
          id: 'test1',
          name: 'Test',
          description: 'Test',
          cost: 5,
          trigger: JokerTrigger.ON_PLAY,
      rarity: JokerRarity.COMMON,
      effect: () => ({})
        }),
        basePrice: 5,
        currentPrice: 5,
        sold: false
      };

      // 5 / 2 = 2.5, floor = 2
      expect(shop.calculateSellPrice(item1)).toBe(2);

      const item2 = {
        id: 'item2',
        type: 'joker' as const,
        item: new Joker({
          id: 'test2',
          name: 'Test',
          description: 'Test',
          cost: 7,
          trigger: JokerTrigger.ON_PLAY,
      rarity: JokerRarity.COMMON,
      effect: () => ({})
        }),
        basePrice: 7,
        currentPrice: 7,
        sold: false
      };

      // 7 / 2 = 3.5, floor = 3
      expect(shop.calculateSellPrice(item2)).toBe(3);
    });

    it('should use current price for calculation', () => {
      const item = {
        id: 'discounted_item',
        type: 'joker' as const,
        item: new Joker({
          id: 'test',
          name: 'Test',
          description: 'Test',
          cost: 10,
          trigger: JokerTrigger.ON_PLAY,
      rarity: JokerRarity.COMMON,
      effect: () => ({})
        }),
        basePrice: 10,
        currentPrice: 6, // Discounted price
        sold: false
      };

      // Sell price based on current price, not base price
      expect(shop.calculateSellPrice(item)).toBe(3);
    });
  });

  describe('Joker Sell via JokerSystem', () => {
    it('should sell joker by index and return correct price', () => {
      // Add a joker to joker system
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
        description: 'Test',
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
      rarity: JokerRarity.COMMON,
      effect: () => ({})
      });

      jokerSlots.addJoker(joker);

      const result = JokerSystem.sellJoker(jokerSlots, 0);
      
      expect(result.success).toBe(true);
      expect(result.sellPrice).toBe(5);
    });

    it('should remove joker when sold', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
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

    it('should fail when selling with invalid index', () => {
      const result = JokerSystem.sellJoker(jokerSlots, 999);
      expect(result.success).toBe(false);
    });
  });

  describe('Consumable Sell', () => {
    it('should sell consumable by index and return correct price', () => {
      const consumable = new Consumable({
        id: 'test_tarot',
        name: 'Test Tarot',
        description: 'Test',
        type: ConsumableType.TAROT,
        cost: 4,
      use: () => ({ success: true, message: '使用成功' })
      });

      gameState.addConsumable(consumable);
      const initialMoney = gameState.money;

      const result = gameState.sellConsumable(0);
      
      expect(result.success).toBe(true);
      expect(result.sellPrice).toBe(2);
      expect(gameState.money).toBe(initialMoney + 2);
    });

    it('should remove consumable when sold', () => {
      const consumable = new Consumable({
        id: 'test_tarot',
        name: 'Test Tarot',
        description: 'Test',
        type: ConsumableType.TAROT,
        cost: 4,
      use: () => ({ success: true, message: '使用成功' })
      });

      gameState.addConsumable(consumable);
      expect(gameState.getConsumableCount()).toBe(1);

      gameState.sellConsumable(0);
      expect(gameState.getConsumableCount()).toBe(0);
    });

    it('should fail when selling with invalid index', () => {
      const result = gameState.sellConsumable(999);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selling multiple jokers', () => {
      const joker1 = new Joker({
        id: 'joker1',
        name: 'Joker 1',
        description: 'Test',
        cost: 10,
        trigger: JokerTrigger.ON_PLAY,
      rarity: JokerRarity.COMMON,
      effect: () => ({})
      });

      const joker2 = new Joker({
        id: 'joker2',
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

    it('should not allow selling same item twice', () => {
      const joker = new Joker({
        id: 'test_joker',
        name: 'Test Joker',
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
      
      // Minimum sell price is $1 (ceil(1/2) = 1)
      expect(result.sellPrice).toBe(1);
    });
  });
});
