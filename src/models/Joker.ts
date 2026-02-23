import { JokerInterface, JokerConfig, JokerTrigger, JokerEffectContext, JokerEffectResult, JokerRarity, JokerState, StickerType, JokerEdition } from '../types/joker';

export class Joker implements JokerInterface {
  id: string;
  name: string;
  description: string;
  rarity: JokerRarity;
  cost: number;
  trigger: JokerTrigger;
  effect: (context: JokerEffectContext) => JokerEffectResult;
  state: JokerState;
  sticker: StickerType;
  edition: JokerEdition;
  perishableRounds: number;
  isCopyable: boolean;
  isProbability: boolean;
  sellValueBonus: number; // 礼品卡等增加的售价加成
  disabled: boolean; // 是否被禁用（深红之心Boss效果）
  // 可选回调
  onScoredCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onHeldCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onDiscardCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onPlayCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onHandPlayedCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onRerollCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onBlindSelectCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onEndOfRoundCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onCardAddedCallback?: (context: JokerEffectContext) => JokerEffectResult;
  onSellCallback?: (context: JokerEffectContext) => JokerEffectResult; // 出售时触发（隐形小丑）

  constructor(config: JokerConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.rarity = config.rarity;
    this.cost = config.cost;
    this.trigger = config.trigger;
    this.effect = config.effect;
    this.state = config.initialState || {};
    this.sticker = config.sticker || StickerType.None;
    this.edition = config.edition || JokerEdition.None;
    this.perishableRounds = this.sticker === StickerType.Perishable ? 5 : 0;
    this.isCopyable = config.isCopyable !== false; // 默认为true
    this.isProbability = config.isProbability === true; // 默认为false
    this.sellValueBonus = 0; // 初始售价为0
    this.disabled = false; // 默认不禁用
    // 设置可选回调
    this.onScoredCallback = config.onScored;
    this.onHeldCallback = config.onHeld;
    this.onDiscardCallback = config.onDiscard;
    this.onPlayCallback = config.onPlay;
    this.onHandPlayedCallback = config.onHandPlayed;
    this.onRerollCallback = config.onReroll;
    this.onBlindSelectCallback = config.onBlindSelect;
    this.onEndOfRoundCallback = config.onEndOfRound;
    this.onCardAddedCallback = config.onCardAdded;
    this.onSellCallback = config.onSell;
  }

  /**
   * 增加售价加成（礼品卡效果）
   */
  increaseSellValue(amount: number): void {
    this.sellValueBonus += amount;
  }

  /**
   * 获取总售价（基础售价 + 礼品卡加成）
   */
  getSellPrice(): number {
    // 基础售价 = cost / 2（向下取整），最低$1
    let basePrice = Math.max(1, Math.floor(this.cost / 2));
    
    // 租赁小丑只能卖$1
    if (this.sticker === StickerType.Rental) {
      return 1;
    }
    
    // 加上礼品卡等增加的售价加成
    return basePrice + this.sellValueBonus;
  }

  updateState(updates: Partial<JokerState>): void {
    this.state = { ...this.state, ...updates };
  }

  getState(): JokerState {
    return { ...this.state };
  }

  setSticker(sticker: StickerType): void {
    this.sticker = sticker;
    if (sticker === StickerType.Perishable) {
      this.perishableRounds = 5;
    } else {
      this.perishableRounds = 0;
    }
  }

  decrementPerishable(): boolean {
    if (this.sticker === StickerType.Perishable && this.perishableRounds > 0) {
      this.perishableRounds--;
      return this.perishableRounds === 0; // 返回是否应该摧毁
    }
    return false;
  }

  canBeSold(): boolean {
    return this.sticker !== StickerType.Eternal;
  }

  getRentalCost(): number {
    return this.sticker === StickerType.Rental ? 3 : 0;
  }

  setEdition(edition: JokerEdition): void {
    this.edition = edition;
  }

  getEditionEffects(): { chipBonus: number; multBonus: number; multMultiplier: number; extraSlot: boolean } {
    switch (this.edition) {
      case JokerEdition.Foil:
        return { chipBonus: 50, multBonus: 0, multMultiplier: 1, extraSlot: false };
      case JokerEdition.Holographic:
        return { chipBonus: 0, multBonus: 10, multMultiplier: 1, extraSlot: false };
      case JokerEdition.Polychrome:
        return { chipBonus: 0, multBonus: 0, multMultiplier: 1.5, extraSlot: false };
      case JokerEdition.Negative:
        return { chipBonus: 0, multBonus: 0, multMultiplier: 1, extraSlot: true };
      default:
        return { chipBonus: 0, multBonus: 0, multMultiplier: 1, extraSlot: false };
    }
  }

  onScored(context: JokerEffectContext): JokerEffectResult {
    if (this.onScoredCallback) {
      return this.onScoredCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_SCORED) {
      return this.effect(context);
    }
    return {};
  }

  onHeld(context: JokerEffectContext): JokerEffectResult {
    if (this.onHeldCallback) {
      return this.onHeldCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_HELD) {
      return this.effect(context);
    }
    return {};
  }

  onDiscard(context: JokerEffectContext): JokerEffectResult {
    if (this.onDiscardCallback) {
      return this.onDiscardCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_DISCARD) {
      return this.effect(context);
    }
    return {};
  }

  onPlay(context: JokerEffectContext): JokerEffectResult {
    if (this.onPlayCallback) {
      return this.onPlayCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_PLAY) {
      return this.effect(context);
    }
    return {};
  }

  onIndependent(context: JokerEffectContext): JokerEffectResult {
    if (this.trigger === JokerTrigger.ON_INDEPENDENT) {
      return this.effect(context);
    }
    return {};
  }

  onHandPlayed(context: JokerEffectContext): JokerEffectResult {
    if (this.onHandPlayedCallback) {
      return this.onHandPlayedCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_HAND_PLAYED) {
      return this.effect(context);
    }
    return {};
  }

  onReroll(context: JokerEffectContext): JokerEffectResult {
    if (this.onRerollCallback) {
      return this.onRerollCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_REROLL) {
      return this.effect(context);
    }
    return {};
  }

  onBlindSelect(context: JokerEffectContext): JokerEffectResult {
    if (this.onBlindSelectCallback) {
      return this.onBlindSelectCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_BLIND_SELECT) {
      return this.effect(context);
    }
    return {};
  }

  onEndRound(context: JokerEffectContext): JokerEffectResult {
    if (this.onEndOfRoundCallback) {
      return this.onEndOfRoundCallback(context);
    }
    if (this.trigger === JokerTrigger.END_OF_ROUND) {
      return this.effect(context);
    }
    return {};
  }

  onCardAdded(context: JokerEffectContext): JokerEffectResult {
    if (this.onCardAddedCallback) {
      return this.onCardAddedCallback(context);
    }
    if (this.trigger === JokerTrigger.ON_CARD_ADDED) {
      return this.effect(context);
    }
    return {};
  }

  onSell(context: JokerEffectContext): JokerEffectResult {
    if (this.onSellCallback) {
      return this.onSellCallback(context);
    }
    return {};
  }

  clone(): JokerInterface {
    const cloned = new Joker({
      id: this.id,
      name: this.name,
      description: this.description,
      rarity: this.rarity,
      cost: this.cost,
      trigger: this.trigger,
      effect: this.effect,
      initialState: this.getState(),
      sticker: this.sticker,
      edition: this.edition,
      onScored: this.onScoredCallback,
      onHeld: this.onHeldCallback,
      onDiscard: this.onDiscardCallback,
      onPlay: this.onPlayCallback,
      onHandPlayed: this.onHandPlayedCallback,
      onReroll: this.onRerollCallback,
      onBlindSelect: this.onBlindSelectCallback,
      onEndOfRound: this.onEndOfRoundCallback,
      onCardAdded: this.onCardAddedCallback,
      onSell: this.onSellCallback,
      isCopyable: this.isCopyable
    });
    // 手动复制 perishableRounds，因为构造函数会根据 sticker 重置
    cloned.perishableRounds = this.perishableRounds;
    // 复制禁用状态
    cloned.disabled = this.disabled;
    return cloned;
  }

  getDisplayInfo(): string {
    const disabledTag = this.disabled ? '[已禁用] ' : '';
    return `${disabledTag}${this.name} (${this.rarity}) - ${this.cost}$\n${this.description}`;
  }

  toString(): string {
    return this.name;
  }
}
