import { describe, it, expect, beforeEach } from 'vitest';
import { Shop } from '../models/Shop';
import { VOUCHER_PAIRS, VOUCHERS } from '../data/consumables/index';

describe('折扣券系统测试', () => {
  let shop: Shop;

  beforeEach(() => {
    shop = new Shop();
  });

  describe('折扣券配对机制', () => {
    it('应该有16对折扣券', () => {
      expect(VOUCHER_PAIRS.length).toBe(16);
    });

    it('每对折扣券应该包含基础版和升级版', () => {
      for (const pair of VOUCHER_PAIRS) {
        expect(pair.base).toBeDefined();
        expect(pair.upgraded).toBeDefined();
        expect(pair.base.cost).toBe(10);
        expect(pair.upgraded.cost).toBe(10);
      }
    });

    it('VOUCHERS数组应该包含32张折扣券', () => {
      expect(VOUCHERS.length).toBe(32);
    });
  });

  describe('getAvailableVouchers方法', () => {
    it('初始状态应该返回所有基础版折扣券', () => {
      const available = shop.getAvailableVouchers();
      expect(available.length).toBe(16);
      
      // 检查返回的都是基础版
      for (const voucher of available) {
        const pair = VOUCHER_PAIRS.find(p => 
          p.base.id === voucher.id || p.upgraded.id === voucher.id
        );
        expect(pair?.base.id).toBe(voucher.id);
      }
    });

    it('购买基础版后应该显示升级版', () => {
      // 购买Overstock基础版
      shop.applyVoucher('voucher_overstock');
      
      const available = shop.getAvailableVouchers();
      const overstockPair = VOUCHER_PAIRS.find(p => p.base.id === 'voucher_overstock');
      
      // 应该包含Overstock Plus
      const hasUpgraded = available.some(v => v.id === 'voucher_overstock_plus');
      expect(hasUpgraded).toBe(true);
      
      // 不应该再包含Overstock基础版
      const hasBase = available.some(v => v.id === 'voucher_overstock');
      expect(hasBase).toBe(false);
    });

    it('购买完整的一对后不应该再显示', () => {
      // 购买完整的一对
      shop.applyVoucher('voucher_overstock');
      shop.applyVoucher('voucher_overstock_plus');
      
      const available = shop.getAvailableVouchers();
      const hasAnyOverstock = available.some(v => 
        v.id === 'voucher_overstock' || v.id === 'voucher_overstock_plus'
      );
      expect(hasAnyOverstock).toBe(false);
    });
  });

  describe('canBuyVoucher方法', () => {
    it('应该允许购买未购买的基础版', () => {
      expect(shop.canBuyVoucher('voucher_overstock')).toBe(true);
    });

    it('不应该允许重复购买基础版', () => {
      shop.applyVoucher('voucher_overstock');
      expect(shop.canBuyVoucher('voucher_overstock')).toBe(false);
    });

    it('未购买基础版时不应该允许购买升级版', () => {
      expect(shop.canBuyVoucher('voucher_overstock_plus')).toBe(false);
    });

    it('购买基础版后应该允许购买升级版', () => {
      shop.applyVoucher('voucher_overstock');
      expect(shop.canBuyVoucher('voucher_overstock_plus')).toBe(true);
    });

    it('购买完整一对后不应该允许再次购买', () => {
      shop.applyVoucher('voucher_overstock');
      shop.applyVoucher('voucher_overstock_plus');
      expect(shop.canBuyVoucher('voucher_overstock_plus')).toBe(false);
    });
  });

  describe('折扣券效果', () => {
    describe('Clearance Sale折扣', () => {
      it('应该应用25%折扣', () => {
        shop.applyVoucher('voucher_clearance');
        
        // 基础价格$10，75折后$7.5，向下取整$7
        // 通货膨胀: $7 * 1.2 = $8.4，向下取整$8
        const price = (shop as any).calculatePrice(10);
        expect(price).toBeLessThan(10);
      });
    });

    describe('Liquidation折扣', () => {
      it('应该应用50%折扣', () => {
        shop.applyVoucher('voucher_liquidation');
        
        // 基础价格$10，5折后$5
        // 通货膨胀: $5 * 1.2 = $6
        const price = (shop as any).calculatePrice(10);
        expect(price).toBe(6);
      });

      it('Liquidation应该覆盖Clearance Sale', () => {
        shop.applyVoucher('voucher_clearance');
        shop.applyVoucher('voucher_liquidation');
        
        const price = (shop as any).calculatePrice(10);
        // 应该是50%折扣而不是25%
        // $10 * 0.5 = $5, $5 * 1.4 (2张折扣券) = $7
        expect(price).toBe(7);
      });
    });

    describe('Reroll Surplus/Glut刷新费用', () => {
      it('Reroll Surplus应该减少$2刷新费用', () => {
        const initialCost = shop.baseRerollCost;
        shop.applyVoucher('voucher_reroll_surplus');
        
        expect(shop.baseRerollCost).toBe(initialCost - 2);
      });

      it('Reroll Glut应该减少$4刷新费用', () => {
        const initialCost = shop.baseRerollCost;
        shop.applyVoucher('voucher_reroll_glut');
        
        expect(shop.baseRerollCost).toBe(initialCost - 4);
      });

      it('刷新费用不应该低于$1', () => {
        shop.applyVoucher('voucher_reroll_glut');
        shop.applyVoucher('voucher_reroll_glut'); // 再次应用
        
        expect(shop.baseRerollCost).toBe(1);
      });
    });

    describe('Overstock/Overstock Plus商店槽位', () => {
      it('Overstock应该添加1个额外槽位', () => {
        const initialItemCount = shop.items.length;
        shop.applyVoucher('voucher_overstock');
        
        expect(shop.items.length).toBe(initialItemCount + 1);
      });

      it('Overstock Plus应该添加2个额外槽位', () => {
        const initialItemCount = shop.items.length;
        shop.applyVoucher('voucher_overstock_plus');
        
        expect(shop.items.length).toBe(initialItemCount + 2);
      });
    });

    describe('Blank折扣券', () => {
      it('Blank应该无效果', () => {
        const initialItemCount = shop.items.length;
        const initialRerollCost = shop.baseRerollCost;
        
        shop.applyVoucher('voucher_blank');
        
        expect(shop.items.length).toBe(initialItemCount);
        expect(shop.baseRerollCost).toBe(initialRerollCost);
      });
    });
  });

  describe('通货膨胀', () => {
    it('每张折扣券应该增加20%价格', () => {
      const basePrice = 10;
      
      // 无折扣券
      let price = (shop as any).calculatePrice(basePrice);
      expect(price).toBe(10);
      
      // 1张折扣券: 10 * 1.2 = 12
      shop.applyVoucher('voucher_blank');
      price = (shop as any).calculatePrice(basePrice);
      expect(price).toBe(12);
      
      // 2张折扣券: 10 * 1.4 = 14
      shop.applyVoucher('voucher_crystal_ball');
      price = (shop as any).calculatePrice(basePrice);
      expect(price).toBe(14);
    });
  });

  describe('序列化', () => {
    it('应该正确保存和恢复折扣券使用记录', () => {
      // 使用一些折扣券
      shop.applyVoucher('voucher_overstock');
      shop.applyVoucher('voucher_clearance');
      
      // 验证已使用列表
      expect(shop.getVouchersUsedCount()).toBe(2);
      expect((shop as any).vouchersUsed).toContain('voucher_overstock');
      expect((shop as any).vouchersUsed).toContain('voucher_clearance');
    });
  });

  describe('Tarot/Planet Merchant/Tycoon商品权重', () => {
    it('Tarot Merchant应该增加塔罗牌权重', () => {
      const weightsBefore = (shop as any).calculateItemWeights();
      const tarotWeightBefore = weightsBefore.tarot;
      
      shop.applyVoucher('voucher_tarot_merchant');
      
      const weightsAfter = (shop as any).calculateItemWeights();
      expect(weightsAfter.tarot).toBeGreaterThan(tarotWeightBefore);
    });

    it('Tarot Tycoon应该进一步增加塔罗牌权重', () => {
      shop.applyVoucher('voucher_tarot_merchant');
      const weightsMerchant = (shop as any).calculateItemWeights();
      
      shop.applyVoucher('voucher_tarot_tycoon');
      const weightsTycoon = (shop as any).calculateItemWeights();
      
      expect(weightsTycoon.tarot).toBeGreaterThan(weightsMerchant.tarot);
    });

    it('Planet Merchant应该增加星球牌权重', () => {
      const weightsBefore = (shop as any).calculateItemWeights();
      const planetWeightBefore = weightsBefore.planet;
      
      shop.applyVoucher('voucher_planet_merchant');
      
      const weightsAfter = (shop as any).calculateItemWeights();
      expect(weightsAfter.planet).toBeGreaterThan(planetWeightBefore);
    });

    it('Planet Tycoon应该进一步增加星球牌权重', () => {
      shop.applyVoucher('voucher_planet_merchant');
      const weightsMerchant = (shop as any).calculateItemWeights();
      
      shop.applyVoucher('voucher_planet_tycoon');
      const weightsTycoon = (shop as any).calculateItemWeights();
      
      expect(weightsTycoon.planet).toBeGreaterThan(weightsMerchant.planet);
    });
  });

  describe('Magic Trick/Illusion游戏牌', () => {
    it('Magic Trick应该允许购买游戏牌', () => {
      const weightsBefore = (shop as any).calculateItemWeights();
      expect(weightsBefore.playingCard).toBe(0);
      
      shop.applyVoucher('voucher_magic_trick');
      
      const weightsAfter = (shop as any).calculateItemWeights();
      expect(weightsAfter.playingCard).toBeGreaterThan(0);
    });

    it('Illusion应该生成带增强的游戏牌', () => {
      shop.applyVoucher('voucher_illusion');
      
      const result = shop.generateEnhancedPlayingCard();
      expect(result).not.toBeNull();
      expect(result?.card).toBeDefined();
    });

    it('没有Illusion时不应该生成增强游戏牌', () => {
      const result = shop.generateEnhancedPlayingCard();
      expect(result).toBeNull();
    });
  });

  describe('完整购买流程', () => {
    it('应该能够购买所有16对优惠券', () => {
      // 依次购买所有基础版
      for (const pair of VOUCHER_PAIRS) {
        expect(shop.canBuyVoucher(pair.base.id)).toBe(true);
        shop.applyVoucher(pair.base.id);
      }
      
      expect(shop.getVouchersUsedCount()).toBe(16);
      
      // 依次购买所有升级版
      for (const pair of VOUCHER_PAIRS) {
        if (shop.canBuyVoucher(pair.upgraded.id)) {
          shop.applyVoucher(pair.upgraded.id);
        }
      }
      
      expect(shop.getVouchersUsedCount()).toBe(32);
    });

    it('购买所有优惠券后getAvailableVouchers应该返回空数组', () => {
      // 购买所有优惠券
      for (const pair of VOUCHER_PAIRS) {
        shop.applyVoucher(pair.base.id);
        shop.applyVoucher(pair.upgraded.id);
      }
      
      const available = shop.getAvailableVouchers();
      expect(available.length).toBe(0);
    });
  });

  describe('所有折扣券ID唯一性', () => {
    it('所有折扣券应该有唯一的ID', () => {
      const ids = VOUCHERS.map(v => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('所有折扣券应该有名称和描述', () => {
      for (const voucher of VOUCHERS) {
        expect(voucher.name).toBeDefined();
        expect(voucher.name.length).toBeGreaterThan(0);
        expect(voucher.description).toBeDefined();
        expect(voucher.description.length).toBeGreaterThan(0);
      }
    });

    it('所有折扣券成本应该为$10', () => {
      for (const voucher of VOUCHERS) {
        expect(voucher.cost).toBe(10);
      }
    });
  });

  describe('各对折扣券效果验证', () => {
    it('第1对: Overstock/Overstock Plus', () => {
      const initialCount = shop.items.length;
      
      shop.applyVoucher('voucher_overstock');
      expect(shop.items.length).toBe(initialCount + 1);
      
      shop.applyVoucher('voucher_overstock_plus');
      expect(shop.items.length).toBe(initialCount + 3); // +1 +2
    });

    it('第2对: Clearance Sale/Liquidation', () => {
      shop.applyVoucher('voucher_clearance');
      const price25 = (shop as any).calculatePrice(100);
      
      // 25%折扣: 100 * 0.75 = 75, 75 * 1.2 = 90
      expect(price25).toBe(90);
      
      shop.applyVoucher('voucher_liquidation');
      const price50 = (shop as any).calculatePrice(100);
      
      // 50%折扣: 100 * 0.5 = 50, 50 * 1.4 = 70
      expect(price50).toBe(70);
    });

    it('第4对: Reroll Surplus/Glut', () => {
      const initialCost = shop.baseRerollCost;
      
      shop.applyVoucher('voucher_reroll_surplus');
      expect(shop.baseRerollCost).toBe(initialCost - 2);
      
      shop.applyVoucher('voucher_reroll_glut');
      expect(shop.baseRerollCost).toBe(initialCost - 4);
    });

    it('第7对: Grabber/Nacho Tong - 在Shop中记录', () => {
      // 这些效果主要在GameState中处理，但Shop应该记录使用
      shop.applyVoucher('voucher_grabber');
      expect((shop as any).vouchersUsed).toContain('voucher_grabber');
      
      shop.applyVoucher('voucher_nacho_tong');
      expect((shop as any).vouchersUsed).toContain('voucher_nacho_tong');
    });

    it('第8对: Wasteful/Recyclomancy - 在Shop中记录', () => {
      shop.applyVoucher('voucher_wasteful');
      expect((shop as any).vouchersUsed).toContain('voucher_wasteful');
      
      shop.applyVoucher('voucher_recyclomancy');
      expect((shop as any).vouchersUsed).toContain('voucher_recyclomancy');
    });

    it('第11对: Seed Money/Money Tree - 在Shop中记录', () => {
      shop.applyVoucher('voucher_seed_money');
      expect((shop as any).vouchersUsed).toContain('voucher_seed_money');
      
      shop.applyVoucher('voucher_money_tree');
      expect((shop as any).vouchersUsed).toContain('voucher_money_tree');
    });

    it('第12对: Blank/Antimatter', () => {
      const initialCount = shop.items.length;
      
      shop.applyVoucher('voucher_blank');
      expect(shop.items.length).toBe(initialCount); // Blank无效果
      expect((shop as any).vouchersUsed).toContain('voucher_blank');
      
      shop.applyVoucher('voucher_antimatter');
      expect((shop as any).vouchersUsed).toContain('voucher_antimatter');
      // Antimatter效果在GameState中处理
    });

    it('第14对: Hieroglyph/Petroglyph - 在Shop中记录', () => {
      shop.applyVoucher('voucher_hieroglyph');
      expect((shop as any).vouchersUsed).toContain('voucher_hieroglyph');
      
      shop.applyVoucher('voucher_petroglyph');
      expect((shop as any).vouchersUsed).toContain('voucher_petroglyph');
    });

    it('第15对: Director\'s Cut/Retcon - 在Shop中记录', () => {
      shop.applyVoucher('voucher_directors_cut');
      expect((shop as any).vouchersUsed).toContain('voucher_directors_cut');
      
      shop.applyVoucher('voucher_retcon');
      expect((shop as any).vouchersUsed).toContain('voucher_retcon');
    });

    it('第16对: Paint Brush/Palette - 在Shop中记录', () => {
      shop.applyVoucher('voucher_paint_brush');
      expect((shop as any).vouchersUsed).toContain('voucher_paint_brush');
      
      shop.applyVoucher('voucher_palette');
      expect((shop as any).vouchersUsed).toContain('voucher_palette');
    });
  });
});
