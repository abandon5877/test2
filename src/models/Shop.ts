import { Joker } from './Joker';
import { Consumable } from './Consumable';
import { Card } from './Card';
import { JokerInterface } from '../types/joker';
import { ConsumableInterface } from '../types/consumable';
import { CardEdition, SealType, Suit, Rank } from '../types/card';
import { getRandomJokers } from '../data/jokers';
import {
  getRandomConsumables,
  BOOSTER_PACKS,
  PACK_WEIGHTS,
  VOUCHER_PAIRS,
  VOUCHERS,
  type PackType,
  type PackSize,
  type BoosterPack,
  type Voucher,
  type VoucherPair
} from '../data/consumables/index';
import { createModuleLogger } from '../utils/logger';
import {
  generateRandomEnhancement,
  generateRandomPlayingCardEdition,
  generateRandomSeal,
  PLAYING_CARD_PROBABILITIES
} from '../data/probabilities';

const logger = createModuleLogger('Shop');

export type ShopItemType = 'joker' | 'consumable' | 'pack' | 'voucher';

export interface ShopItem {
  id: string;
  type: ShopItemType;
  item: JokerInterface | ConsumableInterface | BoosterPack | Voucher;
  basePrice: number;
  currentPrice: number;
  sold: boolean;
}



// 从 data/consumables 重新导出类型和数据
export type { PackType, PackSize, BoosterPack, Voucher, VoucherPair };
export { BOOSTER_PACKS, PACK_WEIGHTS, VOUCHER_PAIRS, VOUCHERS };

export class Shop {
  items: ShopItem[];
  rerollCost: number;
  baseRerollCost: number;
  private itemIdCounter: number;
  private rerollCount: number;
  private vouchersUsed: string[];
  isFirstShopVisit: boolean;

  constructor() {
    logger.info('[Shop] 构造函数开始');
    this.items = [];
    this.rerollCost = 5;
    this.baseRerollCost = 5;
    this.itemIdCounter = 0;
    this.rerollCount = 0;
    this.vouchersUsed = [];
    this.isFirstShopVisit = true;
    logger.info('[Shop] 初始状态', {
      rerollCost: this.rerollCost,
      baseRerollCost: this.baseRerollCost,
      itemIdCounter: this.itemIdCounter,
      rerollCount: this.rerollCount,
      isFirstShopVisit: this.isFirstShopVisit
    });
    this.refresh();
    logger.info('[Shop] 构造函数完成，商品数量:', this.items.length);
  }

  refresh(playerJokerIds: string[] = [], allowDuplicates: boolean = false): void {
    logger.info('[Shop.refresh] 开始刷新商店', {
      isFirstShopVisit: this.isFirstShopVisit,
      baseRerollCost: this.baseRerollCost,
      rerollCount: this.rerollCount,
      playerJokerCount: playerJokerIds.length,
      allowDuplicates
    });

    this.items = [];
    this.itemIdCounter = 0;
    logger.info('[Shop.refresh] 清空商品，itemIdCounter重置为0');

    // 2张随机卡片
    logger.info('[Shop.refresh] 生成2张随机卡片');
    this.generateRandomCards(2, playerJokerIds, allowDuplicates);

    // 2个补充包
    if (this.isFirstShopVisit) {
      logger.info('[Shop.refresh] 首次访问，生成固定卡包');
      const buffoonPack = BOOSTER_PACKS.find(p => p.id === 'pack_buffoon_normal');
      if (buffoonPack) {
        const price = this.calculatePrice(buffoonPack.cost);
        this.addItem('pack', buffoonPack as BoosterPack, price);
        logger.info('[Shop.refresh] 添加固定小丑包:', buffoonPack.id, '价格:', price);
      }
      this.generateBoosterPacks(1);
    } else {
      logger.info('[Shop.refresh] 非首次访问，生成2个随机卡包');
      this.generateBoosterPacks(2);
    }

    // 1张优惠券
    logger.info('[Shop.refresh] 生成优惠券');
    this.generateVoucher();

    this.rerollCost = this.baseRerollCost + this.rerollCount;
    this.isFirstShopVisit = false;

    logger.info('[Shop.refresh] 刷新完成', {
      itemCount: this.items.length,
      rerollCost: this.rerollCost,
      items: this.items.map(i => ({ id: i.id, type: i.type, itemId: (i.item as any).id }))
    });
  }

  enterNewShop(playerJokerIds: string[] = [], allowDuplicates: boolean = false): void {
    logger.info('[Shop.enterNewShop] 进入新商店', { playerJokerCount: playerJokerIds.length, allowDuplicates, isFirstShopVisit: this.isFirstShopVisit });
    this.rerollCount = 0;
    this.rerollCost = this.baseRerollCost;
    // 注意：不再重置 isFirstShopVisit，确保只有第一个商店有固定小丑包
    this.refresh(playerJokerIds, allowDuplicates);
    logger.info('[Shop.enterNewShop] 完成');
  }

  rerollShop(playerJokerIds: string[] = [], allowDuplicates: boolean = false, isFreeReroll: boolean = false): void {
    logger.info('[Shop.rerollShop] 开始刷新商店', {
      currentRerollCount: this.rerollCount,
      baseRerollCost: this.baseRerollCost,
      playerJokerCount: playerJokerIds.length,
      allowDuplicates,
      isFreeReroll
    });

    this.items = [];
    this.itemIdCounter = 0;
    logger.info('[Shop.rerollShop] 清空商品，itemIdCounter重置为0');

    // 重新生成2张随机卡片
    this.generateRandomCards(2, playerJokerIds, allowDuplicates);

    // 重新生成2个补充包
    this.generateBoosterPacks(2);

    // 重新生成1张优惠券
    this.generateVoucher();

    // 只有非免费刷新时才增加刷新费用
    if (!isFreeReroll) {
      this.rerollCount++;
      this.rerollCost = this.baseRerollCost + this.rerollCount;
    }
    logger.info('[Shop.rerollShop] 刷新完成', {
      newRerollCount: this.rerollCount,
      newRerollCost: this.rerollCost,
      itemCount: this.items.length,
      isFreeReroll
    });
  }

  private generateRandomCards(count: number, playerJokerIds: string[] = [], allowDuplicates: boolean = false): void {
    const weights = this.calculateItemWeights();
    const totalWeight = weights.joker + weights.tarot + weights.planet + weights.playingCard;
    logger.info('[Shop.generateRandomCards] 生成随机卡片', { count, weights, totalWeight, playerJokerCount: playerJokerIds.length, allowDuplicates });

    // 获取当前商店中已有的小丑牌ID，并合并玩家已有的小丑牌ID
    // 如果有马戏团演员效果，则允许重复
    const shopJokerIds = this.getJokers().map(item => (item.item as Joker).id);
    const existingJokerIds = allowDuplicates ? [] : [...new Set([...shopJokerIds, ...playerJokerIds])];

    for (let i = 0; i < count; i++) {
      const rand = Math.random() * totalWeight;
      logger.info(`[Shop.generateRandomCards] 第${i + 1}张卡片，随机数:`, rand);

      if (rand < weights.joker) {
        const jokers = getRandomJokers(1, this.vouchersUsed, existingJokerIds);
        if (jokers.length > 0) {
          const price = this.calculatePrice(jokers[0].cost);
          this.addItem('joker', jokers[0], price);
          // 更新已有小丑牌ID列表（仅在不允许重复时）
          if (!allowDuplicates) {
            existingJokerIds.push(jokers[0].id);
          }
          logger.info('[Shop.generateRandomCards] 生成小丑牌:', jokers[0].id, '价格:', price);
        }
      } else if (rand < weights.joker + weights.tarot) {
        const tarots = getRandomConsumables(1, 'tarot');
        if (tarots.length > 0) {
          const price = this.calculatePrice(tarots[0].cost);
          this.addItem('consumable', tarots[0], price);
          logger.info('[Shop.generateRandomCards] 生成塔罗牌:', tarots[0].id, '价格:', price);
        }
      } else if (rand < weights.joker + weights.tarot + weights.planet) {
        const planets = getRandomConsumables(1, 'planet');
        if (planets.length > 0) {
          const price = this.calculatePrice(planets[0].cost);
          this.addItem('consumable', planets[0], price);
          logger.info('[Shop.generateRandomCards] 生成星球牌:', planets[0].id, '价格:', price);
        }
      }
    }
    logger.info('[Shop.generateRandomCards] 完成，当前商品数:', this.items.length);
  }

  private calculateItemWeights(): { joker: number; tarot: number; planet: number; playingCard: number } {
    let weights = {
      joker: 20,
      tarot: 4,
      planet: 4,
      playingCard: 0
    };

    if (this.vouchersUsed.includes('voucher_tarot_merchant')) {
      weights.tarot = 9.6;
    }
    if (this.vouchersUsed.includes('voucher_tarot_tycoon')) {
      weights.tarot = 32;
    }

    if (this.vouchersUsed.includes('voucher_planet_merchant')) {
      weights.planet = 9.6;
    }
    if (this.vouchersUsed.includes('voucher_planet_tycoon')) {
      weights.planet = 32;
    }

    if (this.vouchersUsed.includes('voucher_magic_trick')) {
      weights.playingCard = 4;
    }

    return weights;
  }

  private generateBoosterPacks(count: number): void {
    logger.info('[Shop.generateBoosterPacks] 生成补充包:', count);
    const shuffledPacks = [...BOOSTER_PACKS].sort(() => Math.random() - 0.5);
    logger.info('[Shop.generateBoosterPacks] 打乱后的卡包顺序:', shuffledPacks.map(p => p.id));
    for (let i = 0; i < count && i < shuffledPacks.length; i++) {
      const pack = shuffledPacks[i];
      const price = this.calculatePrice(pack.cost);
      this.addItem('pack', pack, price);
      logger.info('[Shop.generateBoosterPacks] 添加卡包:', pack.id, '价格:', price);
    }
    logger.info('[Shop.generateBoosterPacks] 完成，当前商品数:', this.items.length);
  }

  private generateVoucher(): void {
    logger.info('[Shop.generateVoucher] 开始生成优惠券');
    const availableVouchers = this.getAvailableVouchers();
    logger.info('[Shop.generateVoucher] 可用优惠券数量:', availableVouchers.length);
    if (availableVouchers.length === 0) {
      const blank = VOUCHERS.find(v => v.id === 'voucher_blank');
      if (blank) {
        const price = this.calculatePrice(blank.cost);
        this.addItem('voucher', blank, price);
        logger.info('[Shop.generateVoucher] 添加空白优惠券:', blank.id, '价格:', price);
      }
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableVouchers.length);
    const voucher = availableVouchers[randomIndex];
    const price = this.calculatePrice(voucher.cost);
    this.addItem('voucher', voucher, price);
    logger.info('[Shop.generateVoucher] 添加优惠券:', voucher.id, '价格:', price, '随机索引:', randomIndex);
  }

  getAvailableVouchers(): Voucher[] {
    return VOUCHER_PAIRS
      .filter(pair => {
        const baseUsed = this.vouchersUsed.includes(pair.base.id);
        const upgradedUsed = this.vouchersUsed.includes(pair.upgraded.id);
        return !baseUsed || !upgradedUsed;
      })
      .map(pair => {
        const baseUsed = this.vouchersUsed.includes(pair.base.id);
        if (baseUsed) {
          return pair.upgraded;
        }
        return pair.base;
      });
  }

  canBuyVoucher(voucherId: string): boolean {
    const pair = VOUCHER_PAIRS.find(p =>
      p.base.id === voucherId || p.upgraded.id === voucherId
    );

    if (!pair) return false;

    if (voucherId === pair.base.id) {
      return !this.vouchersUsed.includes(voucherId);
    }

    if (voucherId === pair.upgraded.id) {
      return this.vouchersUsed.includes(pair.base.id) &&
             !this.vouchersUsed.includes(voucherId);
    }

    return false;
  }

  private calculatePrice(basePrice: number): number {
    let price = basePrice;

    if (this.vouchersUsed.includes('voucher_liquidation')) {
      price = Math.floor(price * 0.5);
    } else if (this.vouchersUsed.includes('voucher_clearance')) {
      price = Math.floor(price * 0.75);
    }

    const inflationMultiplier = 1 + 0.2 * this.vouchersUsed.length;
    price = Math.floor(price * inflationMultiplier);

    return Math.max(1, price);
  }

  calculatePriceWithEdition(basePrice: number, edition: CardEdition): number {
    let price = basePrice;

    switch (edition) {
      case CardEdition.Foil:
        price += 2;
        break;
      case CardEdition.Holographic:
        price += 3;
        break;
      case CardEdition.Polychrome:
        price += 5;
        break;
      case CardEdition.Negative:
        price += 5;
        break;
    }

    return this.calculatePrice(price);
  }

  generateEnhancedPlayingCard(): { card: Card; price: number } | null {
    if (!this.vouchersUsed.includes('voucher_illusion')) {
      return null;
    }

    const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
    const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];

    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];

    // Illusion 优惠券生成的卡牌总是有增强效果
    const enhancement = generateRandomEnhancement();
    const edition = generateRandomPlayingCardEdition(this.vouchersUsed);
    const seal = Math.random() < PLAYING_CARD_PROBABILITIES.seal ? generateRandomSeal() : SealType.None;

    const card = new Card(randomSuit, randomRank, enhancement, seal, edition);
    const basePrice = 1;
    const price = this.calculatePriceWithEdition(basePrice, edition);

    return { card, price };
  }

  private addItem(type: ShopItemType, item: ShopItem['item'], basePrice: number): void {
    const id = `shop_item_${this.itemIdCounter++}`;
    const itemId = (item as any).id || 'unknown';
    logger.info(`[Shop.addItem] 添加商品: id=${id}, type=${type}, itemId=${itemId}, price=${basePrice}`);
    this.items.push({
      id,
      type,
      item,
      basePrice,
      currentPrice: basePrice,
      sold: false
    });
    logger.info(`[Shop.addItem] 商品添加完成，当前商品总数:`, this.items.length);
  }

  buy(itemId: string, playerMoney: number): { success: boolean; message: string; item?: ShopItem; remainingMoney?: number } {
    logger.info(`[Shop.buy] 尝试购买商品:`, { itemId, playerMoney });
    const shopItem = this.items.find(i => i.id === itemId);

    if (!shopItem) {
      logger.warn(`[Shop.buy] 商品不存在:`, itemId);
      return { success: false, message: '商品不存在' };
    }

    if (shopItem.sold) {
      logger.warn(`[Shop.buy] 商品已售出:`, itemId);
      return { success: false, message: '商品已售出' };
    }

    if (playerMoney < shopItem.currentPrice) {
      logger.warn(`[Shop.buy] 资金不足:`, { itemId, playerMoney, price: shopItem.currentPrice });
      return { success: false, message: '资金不足' };
    }

    shopItem.sold = true;
    const remainingMoney = playerMoney - shopItem.currentPrice;
    logger.info(`[Shop.buy] 购买成功:`, { itemId, price: shopItem.currentPrice, remainingMoney });

    return {
      success: true,
      message: `成功购买 ${this.getItemName(shopItem)}`,
      item: shopItem,
      remainingMoney
    };
  }

  reroll(playerMoney: number): { success: boolean; message: string; remainingMoney?: number } {
    logger.info(`[Shop.reroll] 尝试刷新商店:`, { playerMoney, rerollCost: this.rerollCost });
    if (playerMoney < this.rerollCost) {
      logger.warn(`[Shop.reroll] 资金不足:`, { playerMoney, rerollCost: this.rerollCost });
      return { success: false, message: '资金不足，无法刷新' };
    }

    const remainingMoney = playerMoney - this.rerollCost;
    this.rerollShop();
    logger.info(`[Shop.reroll] 刷新成功，剩余金钱:`, remainingMoney);

    return {
      success: true,
      message: '商店已刷新',
      remainingMoney
    };
  }

  applyVoucher(voucherId: string, playerJokerIds: string[] = [], allowDuplicates: boolean = false): void {
    logger.info(`[Shop.applyVoucher] 应用优惠券:`, voucherId);
    if (!this.vouchersUsed.includes(voucherId)) {
      this.vouchersUsed.push(voucherId);
      logger.info(`[Shop.applyVoucher] 优惠券已添加到已使用列表`);
    }

    const oldBaseRerollCost = this.baseRerollCost;
    switch (voucherId) {
      case 'voucher_overstock':
        this.addExtraSlot(playerJokerIds, allowDuplicates);
        break;
      case 'voucher_overstock_plus':
        this.addExtraSlot(playerJokerIds, allowDuplicates);
        this.addExtraSlot(playerJokerIds, allowDuplicates);
        this.refreshItemPrices();
        break;
      case 'voucher_clearance':
      case 'voucher_liquidation':
        this.refreshItemPrices();
        break;
      case 'voucher_reroll_surplus':
        this.baseRerollCost = Math.max(1, this.baseRerollCost - 2);
        break;
      case 'voucher_reroll_glut':
        this.baseRerollCost = Math.max(1, this.baseRerollCost - 4);
        break;
      case 'voucher_reroll':
        this.baseRerollCost = Math.max(1, this.baseRerollCost - 1);
        break;
    }
    // 修复: 如果baseRerollCost发生变化，立即更新rerollCost
    if (this.baseRerollCost !== oldBaseRerollCost) {
      this.rerollCost = this.baseRerollCost + this.rerollCount;
      logger.info(`[Shop.applyVoucher] baseRerollCost 变化:`, { old: oldBaseRerollCost, new: this.baseRerollCost, newRerollCost: this.rerollCost });
    }
    logger.info(`[Shop.applyVoucher] 完成，当前已使用优惠券:`, this.vouchersUsed);
  }

  private refreshItemPrices(): void {
    for (const item of this.items) {
      if (!item.sold) {
        item.currentPrice = this.calculatePrice(item.basePrice);
      }
    }
  }

  getRerollCount(): number {
    return this.rerollCount;
  }

  getVouchersUsedCount(): number {
    return this.vouchersUsed.length;
  }

  getVouchersUsed(): string[] {
    return [...this.vouchersUsed];
  }

  private addExtraSlot(playerJokerIds: string[] = [], allowDuplicates: boolean = false): void {
    // 获取当前商店中已有的小丑牌ID，并合并玩家已有的小丑牌ID
    // 如果有马戏团演员效果，则允许重复
    const shopJokerIds = this.getJokers().map(item => (item.item as Joker).id);
    const existingJokerIds = allowDuplicates ? [] : [...new Set([...shopJokerIds, ...playerJokerIds])];

    if (Math.random() < 0.5) {
      const jokers = getRandomJokers(1, this.vouchersUsed, existingJokerIds);
      if (jokers.length > 0) {
        this.addItem('joker', jokers[0], jokers[0].cost);
      }
    } else {
      const consumable = getRandomConsumables(1)[0];
      this.addItem('consumable', consumable, consumable.cost);
    }
  }

  getAvailableItems(): ShopItem[] {
    return this.items.filter(item => !item.sold);
  }

  getJokers(): ShopItem[] {
    return this.items.filter(item => item.type === 'joker' && !item.sold);
  }

  getConsumables(): ShopItem[] {
    return this.items.filter(item => item.type === 'consumable' && !item.sold);
  }

  getPacks(): ShopItem[] {
    return this.items.filter(item => item.type === 'pack' && !item.sold);
  }

  getVouchers(): ShopItem[] {
    return this.items.filter(item => item.type === 'voucher' && !item.sold);
  }

  calculateSellPrice(item: ShopItem): number {
    return Math.max(1, Math.floor(item.currentPrice / 2));
  }

  /**
   * 增加小丑和消耗牌的售价（礼品卡效果）
   * @param amount 增加的金额
   */
  increaseJokerAndConsumablePrices(amount: number): void {
    logger.info(`[Shop.increaseJokerAndConsumablePrices] 增加售价: +$${amount}`);
    let increasedCount = 0;

    for (const item of this.items) {
      if (!item.sold && (item.type === 'joker' || item.type === 'consumable')) {
        item.basePrice += amount;
        item.currentPrice += amount;
        increasedCount++;
        logger.debug(`[Shop.increaseJokerAndConsumablePrices] 增加售价: ${this.getItemName(item)} +$${amount} = $${item.currentPrice}`);
      }
    }

    logger.info(`[Shop.increaseJokerAndConsumablePrices] 完成，共${increasedCount}个商品售价增加`);
  }

  private getItemName(shopItem: ShopItem): string {
    switch (shopItem.type) {
      case 'joker':
        return (shopItem.item as JokerInterface).name;
      case 'consumable':
        return (shopItem.item as ConsumableInterface).name;
      case 'pack':
        return (shopItem.item as BoosterPack).name;
      case 'voucher':
        return (shopItem.item as Voucher).name;
      default:
        return '未知商品';
    }
  }

  resetRerollCost(): void {
    this.rerollCost = this.baseRerollCost;
  }

  getShopInfo(): string {
    const lines: string[] = [];
    lines.push('=== 商店 ===');
    lines.push(`刷新费用: $${this.rerollCost}`);
    lines.push('');

    const availableItems = this.getAvailableItems();
    if (availableItems.length === 0) {
      lines.push('商店已售罄');
    } else {
      for (const item of availableItems) {
        lines.push(`${item.id}: ${this.getItemName(item)} - $${item.currentPrice}`);
      }
    }

    return lines.join('\n');
  }
}
