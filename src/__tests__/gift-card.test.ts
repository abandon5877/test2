import { describe, it, expect } from 'vitest';
import { Shop } from '../models/Shop';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';

describe('Gift Card 礼品卡测试', () => {
  it('礼品卡效果应该返回increaseSellValue', () => {
    const jokerSlots = new JokerSlots(5);
    const giftCard = getJokerById('gift_card')!;
    jokerSlots.addJoker(giftCard);

    // 处理回合结束
    const result = JokerSystem.processEndRound(
      jokerSlots,
      { money: 10, interestCap: 20, hands: 4, discards: 3 },
      false
    );

    // 验证返回了increaseSellValue
    expect(result.increaseSellValue).toBe(1);
    expect(result.effects.some(e => e.effect.includes('礼品卡'))).toBe(true);
  });

  it('多张礼品卡应该叠加increaseSellValue', () => {
    const jokerSlots = new JokerSlots(5);
    const giftCard1 = getJokerById('gift_card')!;
    const giftCard2 = getJokerById('gift_card')!;
    jokerSlots.addJoker(giftCard1);
    jokerSlots.addJoker(giftCard2);

    // 处理回合结束
    const result = JokerSystem.processEndRound(
      jokerSlots,
      { money: 10, interestCap: 20, hands: 4, discards: 3 },
      false
    );

    // 验证increaseSellValue叠加
    expect(result.increaseSellValue).toBe(2);
  });

  it('Shop应该正确增加小丑和消耗牌售价', () => {
    const shop = new Shop();

    // 获取初始售价
    const initialJokerPrices = shop.getJokers().map(item => item.currentPrice);
    const initialConsumablePrices = shop.getConsumables().map(item => item.currentPrice);

    // 增加售价
    shop.increaseJokerAndConsumablePrices(1);

    // 获取新的售价
    const newJokerPrices = shop.getJokers().map(item => item.currentPrice);
    const newConsumablePrices = shop.getConsumables().map(item => item.currentPrice);

    // 验证售价增加了$1
    for (let i = 0; i < initialJokerPrices.length; i++) {
      expect(newJokerPrices[i]).toBe(initialJokerPrices[i] + 1);
    }
    for (let i = 0; i < initialConsumablePrices.length; i++) {
      expect(newConsumablePrices[i]).toBe(initialConsumablePrices[i] + 1);
    }
  });

  it('Shop不应增加卡包和优惠券售价', () => {
    const shop = new Shop();

    // 获取初始卡包和优惠券售价
    const initialPackPrices = shop.getPacks().map(item => item.currentPrice);
    const initialVoucherPrices = shop.getVouchers().map(item => item.currentPrice);

    // 增加售价
    shop.increaseJokerAndConsumablePrices(1);

    // 获取新的售价
    const newPackPrices = shop.getPacks().map(item => item.currentPrice);
    const newVoucherPrices = shop.getVouchers().map(item => item.currentPrice);

    // 验证卡包和优惠券售价没有变化
    for (let i = 0; i < initialPackPrices.length; i++) {
      expect(newPackPrices[i]).toBe(initialPackPrices[i]);
    }
    for (let i = 0; i < initialVoucherPrices.length; i++) {
      expect(newVoucherPrices[i]).toBe(initialVoucherPrices[i]);
    }
  });

  it('已售出的商品不应增加售价', () => {
    const shop = new Shop();

    // 获取一个小丑并购买
    const jokers = shop.getJokers();
    if (jokers.length > 0) {
      const jokerToBuy = jokers[0];
      const initialPrice = jokerToBuy.currentPrice;

      // 购买
      const buyResult = shop.buy(jokerToBuy.id, 100);
      expect(buyResult.success).toBe(true);

      // 增加售价
      shop.increaseJokerAndConsumablePrices(1);

      // 验证已售出的商品售价没有变化
      const boughtItem = shop.items.find(item => item.id === jokerToBuy.id);
      expect(boughtItem?.currentPrice).toBe(initialPrice);
    }
  });
});
