/**
 * 优惠券数据（32张，16对）
 * 每对包含基础版和升级版
 */

export interface Voucher {
  id: string;
  name: string;
  description: string;
  effect: string;
  cost: number;
}

export interface VoucherPair {
  base: Voucher;
  upgraded: Voucher;
}

/**
 * 32张优惠券定义（16对）
 */
export const VOUCHER_PAIRS: VoucherPair[] = [
  // 第1对：商店槽位
  {
    base: { id: 'voucher_overstock', name: '库存过剩', description: '商店卡牌槽位+1', effect: 'extra_slot', cost: 10 },
    upgraded: { id: 'voucher_overstock_plus', name: '库存过剩+', description: '商店卡牌槽位+1并立即补货', effect: 'extra_slot_plus', cost: 10 }
  },
  // 第2对：折扣
  {
    base: { id: 'voucher_clearance', name: '清仓大甩卖', description: '所有卡牌和卡包75折', effect: 'discount_25', cost: 10 },
    upgraded: { id: 'voucher_liquidation', name: '清仓大甩卖+', description: '所有卡牌和卡包5折', effect: 'discount_50', cost: 10 }
  },
  // 第3对：版本出现率
  {
    base: { id: 'voucher_hone', name: '打磨', description: '箔片、全息、多色版本出现率翻倍', effect: 'edition_rate_2x', cost: 10 },
    upgraded: { id: 'voucher_glow_up', name: '蜕变', description: '箔片、全息、多色版本出现率翻4倍', effect: 'edition_rate_4x', cost: 10 }
  },
  // 第4对：刷新费用
  {
    base: { id: 'voucher_reroll_surplus', name: '刷新盈余', description: '刷新费用减少$2', effect: 'reroll_discount_2', cost: 10 },
    upgraded: { id: 'voucher_reroll_glut', name: '刷新盈余+', description: '刷新费用减少$4', effect: 'reroll_discount_4', cost: 10 }
  },
  // 第5对：消耗牌槽位
  {
    base: { id: 'voucher_crystal_ball', name: '水晶球', description: '消耗牌槽位+1', effect: 'consumable_slot', cost: 10 },
    upgraded: { id: 'voucher_omen_globe', name: '预兆球', description: '幻灵牌可能出现在秘术卡包中', effect: 'spectral_in_arcana', cost: 10 }
  },
  // 第6对：星球牌
  {
    base: { id: 'voucher_telescope', name: '望远镜', description: '天体卡包包含你最常打出的牌型', effect: 'telescope', cost: 10 },
    upgraded: { id: 'voucher_observatory', name: '天文台', description: '星球牌对其牌型给予x1.5倍率', effect: 'observatory', cost: 10 }
  },
  // 第7对：出牌次数
  {
    base: { id: 'voucher_grabber', name: '抓取者', description: '每回合永久+1出牌次数', effect: 'extra_hand', cost: 10 },
    upgraded: { id: 'voucher_nacho_tong', name: '抓取者+', description: '每回合永久+2出牌次数', effect: 'extra_hand_2', cost: 10 }
  },
  // 第8对：弃牌次数
  {
    base: { id: 'voucher_wasteful', name: '浪费', description: '每回合永久+1弃牌次数', effect: 'extra_discard', cost: 10 },
    upgraded: { id: 'voucher_recyclomancy', name: '浪费+', description: '每回合永久+2弃牌次数', effect: 'extra_discard_2', cost: 10 }
  },
  // 第9对：塔罗牌商店
  {
    base: { id: 'voucher_tarot_merchant', name: '塔罗商人', description: '塔罗牌出现频率翻倍', effect: 'tarot_rate_2x', cost: 10 },
    upgraded: { id: 'voucher_tarot_tycoon', name: '塔罗商人+', description: '塔罗牌出现频率翻4倍', effect: 'tarot_rate_4x', cost: 10 }
  },
  // 第10对：星球牌商店
  {
    base: { id: 'voucher_planet_merchant', name: '星球商人', description: '星球牌出现频率翻倍', effect: 'planet_rate_2x', cost: 10 },
    upgraded: { id: 'voucher_planet_tycoon', name: '星球商人+', description: '星球牌出现频率翻4倍', effect: 'planet_rate_4x', cost: 10 }
  },
  // 第11对：利息
  {
    base: { id: 'voucher_seed_money', name: '种子资金', description: '利息上限提升至$10', effect: 'interest_cap_10', cost: 10 },
    upgraded: { id: 'voucher_money_tree', name: '种子资金+', description: '利息上限提升至$20', effect: 'interest_cap_20', cost: 10 }
  },
  // 第12对：空折扣券
  {
    base: { id: 'voucher_blank', name: '空白', description: '什么都不做？', effect: 'blank', cost: 10 },
    upgraded: { id: 'voucher_antimatter', name: '空白+', description: '小丑牌槽位+1', effect: 'extra_joker_slot', cost: 10 }
  },
  // 第13对：购买游戏牌
  {
    base: { id: 'voucher_magic_trick', name: '魔术技巧', description: '商店会出售扑克牌', effect: 'buy_playing_cards', cost: 10 },
    upgraded: { id: 'voucher_illusion', name: '魔术技巧+', description: '商店的扑克牌带有特殊效果（增强/版本/蜡封）', effect: 'illusion', cost: 10 }
  },
  // 第14对：底注调整
  {
    base: { id: 'voucher_hieroglyph', name: '象形文字', description: '底注-1，每回合出牌次数-1', effect: 'ante_down_hand_down', cost: 10 },
    upgraded: { id: 'voucher_petroglyph', name: '象形文字+', description: '底注-1，每回合弃牌次数-1', effect: 'ante_down_discard_down', cost: 10 }
  },
  // 第15对：Boss盲注重掷
  {
    base: { id: 'voucher_directors_cut', name: '导演剪辑版', description: '每个底注可重掷Boss盲注1次', effect: 'boss_reroll_1', cost: 10 },
    upgraded: { id: 'voucher_retcon', name: '导演剪辑版+', description: '可无限次重掷Boss盲注', effect: 'boss_reroll_unlimited', cost: 10 }
  },
  // 第16对：手牌上限
  {
    base: { id: 'voucher_paint_brush', name: '画笔', description: '手牌上限+1', effect: 'hand_size_1', cost: 10 },
    upgraded: { id: 'voucher_palette', name: '画笔+', description: '手牌上限+2', effect: 'hand_size_2', cost: 10 }
  }
];

/**
 * 兼容旧的优惠券数组（用于查找）
 */
export const VOUCHERS: Voucher[] = VOUCHER_PAIRS.flatMap(pair => [pair.base, pair.upgraded]);

/**
 * 根据ID获取优惠券
 */
export function getVoucherById(id: string): Voucher | undefined {
  return VOUCHERS.find(v => v.id === id);
}

/**
 * 获取优惠券对
 */
export function getVoucherPair(voucherId: string): VoucherPair | undefined {
  return VOUCHER_PAIRS.find(pair => 
    pair.base.id === voucherId || pair.upgraded.id === voucherId
  );
}

/**
 * 获取所有基础版优惠券
 */
export function getBaseVouchers(): Voucher[] {
  return VOUCHER_PAIRS.map(pair => pair.base);
}

/**
 * 获取所有升级版优惠券
 */
export function getUpgradedVouchers(): Voucher[] {
  return VOUCHER_PAIRS.map(pair => pair.upgraded);
}

/**
 * 获取所有优惠券
 */
export function getAllVouchers(): Voucher[] {
  return [...VOUCHERS];
}

/**
 * 获取随机优惠券对
 */
export function getRandomVoucherPair(): VoucherPair {
  return VOUCHER_PAIRS[Math.floor(Math.random() * VOUCHER_PAIRS.length)];
}

/**
 * 获取随机基础版优惠券
 */
export function getRandomBaseVoucher(): Voucher {
  const pair = getRandomVoucherPair();
  return pair.base;
}

/**
 * 检查是否是基础版优惠券
 */
export function isBaseVoucher(voucherId: string): boolean {
  return VOUCHER_PAIRS.some(pair => pair.base.id === voucherId);
}

/**
 * 检查是否是升级版优惠券
 */
export function isUpgradedVoucher(voucherId: string): boolean {
  return VOUCHER_PAIRS.some(pair => pair.upgraded.id === voucherId);
}

/**
 * 获取升级版优惠券（如果存在）
 */
export function getUpgradedVersion(voucherId: string): Voucher | undefined {
  const pair = getVoucherPair(voucherId);
  if (!pair) return undefined;
  if (pair.base.id === voucherId) return pair.upgraded;
  return undefined;
}

/**
 * 获取基础版优惠券（如果存在）
 */
export function getBaseVersion(voucherId: string): Voucher | undefined {
  const pair = getVoucherPair(voucherId);
  if (!pair) return undefined;
  if (pair.upgraded.id === voucherId) return pair.base;
  return undefined;
}

/**
 * 优惠券统计信息
 */
export const VOUCHER_STATS = {
  total: VOUCHERS.length,
  pairs: VOUCHER_PAIRS.length,
  base: VOUCHER_PAIRS.length,
  upgraded: VOUCHER_PAIRS.length
};
