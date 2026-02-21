import { describe, it, expect } from 'vitest';
import { Shop } from '../models/Shop';
import { Storage } from '../utils/storage';

describe('Shop Save/Load 回归测试', () => {
  it('读档后商品应该与存档时完全一致', () => {
    // 创建原始商店
    const originalShop = new Shop();

    // 记录存档前的商品信息
    const originalItems = originalShop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id,
      sold: item.sold,
      basePrice: item.basePrice,
      currentPrice: item.currentPrice
    }));

    console.log('原始商店商品:', originalItems.map(i => `${i.type}:${i.itemId}`).join(', '));

    // 存档
    const serialized = Storage.serializeShop(originalShop);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 记录读档后的商品信息
    const restoredItems = restoredShop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id,
      sold: item.sold,
      basePrice: item.basePrice,
      currentPrice: item.currentPrice
    }));

    console.log('读档后商店商品:', restoredItems.map(i => `${i.type}:${i.itemId}`).join(', '));

    // 验证商品数量一致
    expect(restoredItems.length).toBe(originalItems.length);

    // 验证每个商品都一致
    for (let i = 0; i < originalItems.length; i++) {
      const original = originalItems[i];
      const restored = restoredItems.find(r => r.id === original.id);

      expect(restored).toBeDefined();
      expect(restored!.type).toBe(original.type);
      expect(restored!.itemId).toBe(original.itemId);
      expect(restored!.sold).toBe(original.sold);
      expect(restored!.basePrice).toBe(original.basePrice);
      expect(restored!.currentPrice).toBe(original.currentPrice);
    }
  });

  it('购买部分商品后存档读档应该保持剩余商品不变', () => {
    const shop = new Shop();
    const availableItems = shop.getAvailableItems();

    // 购买第一个商品
    if (availableItems.length > 0) {
      const buyResult = shop.buy(availableItems[0].id, 100);
      expect(buyResult.success).toBe(true);
    }

    // 记录购买后的商品状态
    const itemsAfterBuy = shop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id,
      sold: item.sold
    }));

    console.log('购买后商品:', itemsAfterBuy.map(i => `${i.type}:${i.itemId}(sold:${i.sold})`).join(', '));

    // 存档
    const serialized = Storage.serializeShop(shop);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 记录读档后的商品状态
    const itemsAfterLoad = restoredShop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id,
      sold: item.sold
    }));

    console.log('读档后商品:', itemsAfterLoad.map(i => `${i.type}:${i.itemId}(sold:${i.sold})`).join(', '));

    // 验证商品状态一致
    expect(itemsAfterLoad.length).toBe(itemsAfterBuy.length);

    for (const original of itemsAfterBuy) {
      const restored = itemsAfterLoad.find(r => r.id === original.id);
      expect(restored).toBeDefined();
      expect(restored!.type).toBe(original.type);
      expect(restored!.itemId).toBe(original.itemId);
      expect(restored!.sold).toBe(original.sold);
    }
  });

  it('刷新商店后存档读档应该保持刷新后的商品', () => {
    const shop = new Shop();

    // 记录刷新前的商品
    const itemsBeforeReroll = shop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id
    }));

    console.log('刷新前商品:', itemsBeforeReroll.map(i => `${i.type}:${i.itemId}`).join(', '));

    // 刷新商店
    shop.rerollShop();

    // 记录刷新后的商品
    const itemsAfterReroll = shop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id
    }));

    console.log('刷新后商品:', itemsAfterReroll.map(i => `${i.type}:${i.itemId}`).join(', '));

    // 存档
    const serialized = Storage.serializeShop(shop);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 记录读档后的商品
    const itemsAfterLoad = restoredShop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id
    }));

    console.log('读档后商品:', itemsAfterLoad.map(i => `${i.type}:${i.itemId}`).join(', '));

    // 验证刷新后的商品保持一致（不是刷新前的）
    expect(itemsAfterLoad.length).toBe(itemsAfterReroll.length);

    for (const original of itemsAfterReroll) {
      const restored = itemsAfterLoad.find(r => r.id === original.id);
      expect(restored).toBeDefined();
      expect(restored!.type).toBe(original.type);
      expect(restored!.itemId).toBe(original.itemId);
    }
  });

  it('isFirstShopVisit 状态应该在读档后保持一致', () => {
    // 创建新商店（首次访问）
    const newShop = new Shop();
    const originalIsFirstVisit = (newShop as any).isFirstShopVisit;

    // 存档
    const serialized = Storage.serializeShop(newShop);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 验证状态一致
    expect((restoredShop as any).isFirstShopVisit).toBe(originalIsFirstVisit);
  });

  it('多次存档读档后商品应该保持一致', () => {
    let shop = new Shop();

    // 记录初始商品
    const initialItems = shop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id
    }));

    console.log('初始商品:', initialItems.map(i => `${i.type}:${i.itemId}`).join(', '));

    // 多次存档读档
    for (let i = 0; i < 3; i++) {
      const serialized = Storage.serializeShop(shop);
      shop = Storage.deserializeShop(serialized);
    }

    // 记录最终商品
    const finalItems = shop.items.map(item => ({
      id: item.id,
      type: item.type,
      itemId: (item.item as any).id
    }));

    console.log('最终商品:', finalItems.map(i => `${i.type}:${i.itemId}`).join(', '));

    // 验证商品一致
    expect(finalItems.length).toBe(initialItems.length);

    for (let i = 0; i < initialItems.length; i++) {
      const initial = initialItems[i];
      const final = finalItems.find(f => f.id === initial.id);
      expect(final).toBeDefined();
      expect(final!.type).toBe(initial.type);
      expect(final!.itemId).toBe(initial.itemId);
    }
  });

  it('baseRerollCost 应该被正确保存和恢复', () => {
    const shop = new Shop();

    // 修改 baseRerollCost（模拟使用优惠券后的效果）
    (shop as any).baseRerollCost = 3;

    // 存档
    const serialized = Storage.serializeShop(shop);

    // 验证序列化数据中包含 baseRerollCost
    expect(serialized.baseRerollCost).toBe(3);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 验证 baseRerollCost 被正确恢复
    expect((restoredShop as any).baseRerollCost).toBe(3);
  });

  it('使用优惠券降低刷新费用后存档读档应该保持费用', () => {
    const shop = new Shop();

    // 初始费用
    const initialBaseCost = shop.baseRerollCost;
    expect(initialBaseCost).toBe(5);

    // 使用 Reroll Surplus 优惠券（降低 2）
    shop.applyVoucher('voucher_reroll_surplus');

    // 验证 base 费用已降低
    expect(shop.baseRerollCost).toBe(3);

    // 存档
    const serialized = Storage.serializeShop(shop);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 验证 base 费用保持一致
    expect(restoredShop.baseRerollCost).toBe(3);
  });

  it('使用 Reroll Glut 优惠券后存档读档应该保持费用', () => {
    const shop = new Shop();

    // 使用 Reroll Glut 优惠券（降低 4）
    shop.applyVoucher('voucher_reroll_glut');

    // 验证 base 费用已降低（最低为 1）
    expect(shop.baseRerollCost).toBe(1);

    // 存档
    const serialized = Storage.serializeShop(shop);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 验证 base 费用保持一致
    expect(restoredShop.baseRerollCost).toBe(1);
  });

  it('itemIdCounter 应该被正确保存和恢复', () => {
    const shop = new Shop();

    // 获取初始计数器值
    const initialCounter = (shop as any).itemIdCounter;

    // 手动增加计数器（模拟添加商品）
    (shop as any).itemIdCounter = initialCounter + 10;

    // 获取增加后的计数器值
    const counterAfterAdd = (shop as any).itemIdCounter;
    expect(counterAfterAdd).toBe(initialCounter + 10);

    // 存档
    const serialized = Storage.serializeShop(shop);

    // 验证序列化数据中包含 itemIdCounter
    expect(serialized.itemIdCounter).toBe(counterAfterAdd);

    // 读档
    const restoredShop = Storage.deserializeShop(serialized);

    // 验证计数器被正确恢复
    expect((restoredShop as any).itemIdCounter).toBe(counterAfterAdd);
  });
});
