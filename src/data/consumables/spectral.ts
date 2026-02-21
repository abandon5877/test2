import { ConsumableType, type ConsumableEffectContext, type ConsumableEffectResult } from '../../types/consumable';
import { Suit, Rank, CardEnhancement, SealType, CardEdition } from '../../types/card';
import { Consumable } from '../../models/Consumable';
import { Card } from '../../models/Card';
import { getConsumableById, getRandomConsumables, getRandomConsumable } from './utils';

/**
 * 幻灵牌消耗品实例（19张）
 * 这是幻灵牌的唯一数据源
 */
export const SPECTRAL_CONSUMABLES: Consumable[] = [
  // 1. 火祭 - 摧毁5张随机手牌，获得$20
  new Consumable({
    id: 'spectral_immolate',
    name: '火祭',
    description: '摧毁5张随机手牌，获得$20',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要至少5张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.handCards || context.handCards.length < 5) {
        return { success: false, message: '需要至少5张手牌' };
      }

      const shuffled = [...context.handCards].sort(() => Math.random() - 0.5);
      const destroyedCards = shuffled.slice(0, 5);

      return {
        success: true,
        message: `火祭: 摧毁5张随机手牌，获得$20`,
        affectedCards: destroyedCards,
        moneyChange: 20
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.handCards && context.handCards.length >= 5);
    }
  }),

  // 2. 幽灵 - 将选中的1张牌添加玻璃增强
  new Consumable({
    id: 'spectral_ghost',
    name: '幽灵',
    description: '将选中的1张牌添加玻璃增强',
    type: ConsumableType.SPECTRAL,
    cost: 4,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.enhancement = CardEnhancement.Glass;
      return {
        success: true,
        message: `幽灵: ${card.toString()} 获得玻璃增强`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  }),

  // 3. 神秘生物 - 创建2张选定牌的精确复制
  new Consumable({
    id: 'spectral_cryptid',
    name: '神秘生物',
    description: '创建2张选定牌的精确复制(包括增强、版本、印章)',
    type: ConsumableType.SPECTRAL,
    cost: 6,
    useCondition: '需要选择1-2张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择至少1张牌' };
      }
      if (context.selectedCards.length > 2) {
        return { success: false, message: '最多选择2张牌' };
      }

      const clonedCards: Card[] = [];
      for (const card of context.selectedCards) {
        const clonedCard = card.clone();
        clonedCards.push(clonedCard);
      }

      return {
        success: true,
        message: `神秘生物: 复制${context.selectedCards.length}张牌`,
        affectedCards: context.selectedCards,
        newCards: clonedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      const count = context.selectedCards?.length ?? 0;
      return count >= 1 && count <= 2;
    }
  }),

  // 4. 使魔 - 摧毁1张随机手牌，添加3张增强人头牌到手牌
  new Consumable({
    id: 'spectral_familiar',
    name: '使魔',
    description: '摧毁1张随机手牌，添加3张增强人头牌到手牌',
    type: ConsumableType.SPECTRAL,
    cost: 4,
    useCondition: '需要至少有1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.handCards || context.handCards.length === 0) {
        return { success: false, message: '需要手牌' };
      }
      const randomIndex = Math.floor(Math.random() * context.handCards.length);
      const destroyedCard = context.handCards[randomIndex];

      const faceRanks = [Rank.Jack, Rank.Queen, Rank.King];
      const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      const newCards: Card[] = [];

      for (const rank of faceRanks) {
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        const enhancements = [CardEnhancement.Bonus, CardEnhancement.Mult, CardEnhancement.Wild];
        const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
        newCards.push(new Card(randomSuit, rank, randomEnhancement));
      }

      return {
        success: true,
        message: `使魔: 摧毁 ${destroyedCard.toString()}，添加3张增强人头牌`,
        affectedCards: [destroyedCard],
        newCards: newCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.handCards && context.handCards.length > 0);
    }
  }),

  // 5. 冷酷 - 摧毁1张随机手牌，添加2张增强A到手牌
  new Consumable({
    id: 'spectral_grim',
    name: '冷酷',
    description: '摧毁1张随机手牌，添加2张增强A到手牌',
    type: ConsumableType.SPECTRAL,
    cost: 4,
    useCondition: '需要至少有1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.handCards || context.handCards.length === 0) {
        return { success: false, message: '需要手牌' };
      }
      const randomIndex = Math.floor(Math.random() * context.handCards.length);
      const destroyedCard = context.handCards[randomIndex];

      const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      const newCards: Card[] = [];

      for (let i = 0; i < 2; i++) {
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        const enhancements = [CardEnhancement.Bonus, CardEnhancement.Mult, CardEnhancement.Glass];
        const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
        newCards.push(new Card(randomSuit, Rank.Ace, randomEnhancement));
      }

      return {
        success: true,
        message: `冷酷: 摧毁 ${destroyedCard.toString()}，添加2张增强A`,
        affectedCards: [destroyedCard],
        newCards: newCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.handCards && context.handCards.length > 0);
    }
  }),

  // 6. 咒语 - 摧毁1张随机手牌，添加4张增强数字牌到手牌
  new Consumable({
    id: 'spectral_incantation',
    name: '咒语',
    description: '摧毁1张随机手牌，添加4张增强数字牌到手牌',
    type: ConsumableType.SPECTRAL,
    cost: 4,
    useCondition: '需要至少有1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.handCards || context.handCards.length === 0) {
        return { success: false, message: '需要手牌' };
      }
      const randomIndex = Math.floor(Math.random() * context.handCards.length);
      const destroyedCard = context.handCards[randomIndex];

      const numberRanks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten];
      const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      const newCards: Card[] = [];

      for (let i = 0; i < 4; i++) {
        const randomRank = numberRanks[Math.floor(Math.random() * numberRanks.length)];
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        const enhancements = [CardEnhancement.Bonus, CardEnhancement.Mult, CardEnhancement.Lucky];
        const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
        newCards.push(new Card(randomSuit, randomRank, randomEnhancement));
      }

      return {
        success: true,
        message: `咒语: 摧毁 ${destroyedCard.toString()}，添加4张增强数字牌`,
        affectedCards: [destroyedCard],
        newCards: newCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.handCards && context.handCards.length > 0);
    }
  }),

  // 7. 护身符 - 给选中的1张牌添加黄金蜡封
  new Consumable({
    id: 'spectral_talisman',
    name: '护身符',
    description: '给选中的1张牌添加黄金蜡封',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.seal = SealType.Gold;
      return {
        success: true,
        message: `护身符: ${card.toString()} 获得黄金蜡封`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  }),

  // 8. 光环 - 给选中的1张牌随机添加箔片/全息/多色版本
  new Consumable({
    id: 'spectral_aura',
    name: '光环',
    description: '给选中的1张牌随机添加箔片/全息/多色版本',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      const rand = Math.random();
      let editionName = '';

      if (rand < 0.33) {
        card.edition = CardEdition.Foil;
        editionName = '箔片';
      } else if (rand < 0.66) {
        card.edition = CardEdition.Holographic;
        editionName = '全息';
      } else {
        card.edition = CardEdition.Polychrome;
        editionName = '多色';
      }

      return {
        success: true,
        message: `光环: ${card.toString()} 获得${editionName}版本`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  }),

  // 9. 怨灵 - 创建1张稀有小丑，金钱设为$0
  new Consumable({
    id: 'spectral_wraith',
    name: '怨灵',
    description: '创建1张稀有小丑，金钱设为$0',
    type: ConsumableType.SPECTRAL,
    cost: 6,
    useCondition: '需要至少1个小丑牌空位',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (context.canAddJoker && !context.canAddJoker()) {
        return { success: false, message: '小丑牌槽位已满' };
      }

      const moneyLost = context.money || 0;

      let jokerAdded = false;
      if (context.addJoker) {
        jokerAdded = context.addJoker('rare');
      }

      return {
        success: true,
        message: jokerAdded ? '怨灵: 创建稀有小丑，金钱设为$0' : '怨灵: 金钱设为$0（小丑槽位已满）',
        moneyChange: -moneyLost
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      // 如果没有 canAddJoker 函数，默认允许使用（向后兼容）
      if (!context.canAddJoker) return true;
      return context.canAddJoker();
    }
  }),

  // 10. 印记 - 将手牌转为同一随机花色
  new Consumable({
    id: 'spectral_sigil',
    name: '印记',
    description: '将手牌转为同一随机花色',
    type: ConsumableType.SPECTRAL,
    cost: 4,
    useCondition: '需要至少有1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.handCards || context.handCards.length === 0) {
        return { success: false, message: '需要手牌' };
      }

      const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      const randomSuit = suits[Math.floor(Math.random() * suits.length)];

      for (const card of context.handCards) {
        card.suit = randomSuit;
      }

      return {
        success: true,
        message: `印记: 所有手牌变为${randomSuit}`,
        affectedCards: context.handCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.handCards && context.handCards.length > 0);
    }
  }),

  // 11. 通灵板 - 将手牌转为同一随机点数，手牌上限-1
  new Consumable({
    id: 'spectral_ouija',
    name: '通灵板',
    description: '将手牌转为同一随机点数，手牌上限-1',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要至少有1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.handCards || context.handCards.length === 0) {
        return { success: false, message: '需要手牌' };
      }

      const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
      const randomRank = ranks[Math.floor(Math.random() * ranks.length)];

      for (const card of context.handCards) {
        card.rank = randomRank;
      }

      if (context.decreaseHandSize) {
        context.decreaseHandSize(1);
      }

      return {
        success: true,
        message: `通灵板: 所有手牌变为${randomRank}，手牌上限-1`,
        affectedCards: context.handCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.handCards && context.handCards.length > 0);
    }
  }),

  // 12. 外质 - 给随机小丑添加负片版本，手牌上限-1
  new Consumable({
    id: 'spectral_ectoplasm',
    name: '外质',
    description: '给随机小丑添加负片版本，手牌上限-1',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要至少有1张小丑牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      let editionAdded = false;
      if (context.addEditionToRandomJoker) {
        editionAdded = context.addEditionToRandomJoker('negative');
      }

      if (context.decreaseHandSize) {
        context.decreaseHandSize(1);
      }

      return {
        success: true,
        message: editionAdded ? '外质: 随机小丑获得负片版本，手牌上限-1' : '外质: 没有可添加版本的小丑，手牌上限-1'
      };
    }
  }),

  // 13. 生命之符 - 随机复制1张小丑，摧毁其他所有小丑
  new Consumable({
    id: 'spectral_ankh',
    name: '生命之符',
    description: '随机复制1张小丑，摧毁其他所有小丑',
    type: ConsumableType.SPECTRAL,
    cost: 8,
    useCondition: '需要至少有2张小丑牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      let destroyedCount = 0;
      if (context.destroyOtherJokers) {
        destroyedCount = context.destroyOtherJokers();
      }

      return {
        success: true,
        message: `生命之符: 复制1张小丑，摧毁了${destroyedCount}张小丑`
      };
    }
  }),

  // 14. 既视感 - 给选中的1张牌添加红色蜡封
  new Consumable({
    id: 'spectral_deja_vu',
    name: '既视感',
    description: '给选中的1张牌添加红色蜡封',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.seal = SealType.Red;
      return {
        success: true,
        message: `既视感: ${card.toString()} 获得红色蜡封`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  }),

  // 15. 诅咒 - 给随机小丑添加多色版本，摧毁其他所有小丑
  new Consumable({
    id: 'spectral_hex',
    name: '诅咒',
    description: '给随机小丑添加多色版本，摧毁其他所有小丑',
    type: ConsumableType.SPECTRAL,
    cost: 8,
    useCondition: '需要至少有2张小丑牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      let editionAdded = false;
      if (context.addEditionToRandomJoker) {
        editionAdded = context.addEditionToRandomJoker('polychrome');
      }

      let destroyedCount = 0;
      if (context.destroyOtherJokers) {
        destroyedCount = context.destroyOtherJokers();
      }

      return {
        success: true,
        message: editionAdded
          ? `诅咒: 随机小丑获得多色版本，摧毁了${destroyedCount}张小丑`
          : `诅咒: 没有可添加版本的小丑，摧毁了${destroyedCount}张小丑`
      };
    }
  }),

  // 16. 恍惚 - 给选中的1张牌添加蓝色蜡封
  new Consumable({
    id: 'spectral_trance',
    name: '恍惚',
    description: '给选中的1张牌添加蓝色蜡封',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.seal = SealType.Blue;
      return {
        success: true,
        message: `恍惚: ${card.toString()} 获得蓝色蜡封`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  }),

  // 17. 灵媒 - 给选中的1张牌添加紫色蜡封
  new Consumable({
    id: 'spectral_medium',
    name: '灵媒',
    description: '给选中的1张牌添加紫色蜡封',
    type: ConsumableType.SPECTRAL,
    cost: 5,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.seal = SealType.Purple;
      return {
        success: true,
        message: `灵媒: ${card.toString()} 获得紫色蜡封`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  }),

  // 18. 灵魂 - 创建1张传奇小丑（卡包限定，0.3%概率）
  new Consumable({
    id: 'spectral_soul',
    name: '灵魂',
    description: '创建1张传奇小丑（卡包限定，0.3%概率）',
    type: ConsumableType.SPECTRAL,
    cost: 0,
    useCondition: '需要至少1个小丑牌空位',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (context.canAddJoker && !context.canAddJoker()) {
        return { success: false, message: '小丑牌槽位已满' };
      }
      return {
        success: true,
        message: '灵魂: 创建传奇小丑'
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      // 如果没有 canAddJoker 函数，默认允许使用（向后兼容）
      if (!context.canAddJoker) return true;
      return context.canAddJoker();
    }
  }),

  // 19. 黑洞 - 升级所有牌型1级（卡包限定，0.3%概率）
  new Consumable({
    id: 'spectral_black_hole',
    name: '黑洞',
    description: '升级所有牌型1级（卡包限定，0.3%概率）',
    type: ConsumableType.SPECTRAL,
    cost: 0,
    useCondition: '无特殊条件',
    use: (): ConsumableEffectResult => {
      return {
        success: true,
        message: '黑洞: 所有牌型等级+1',
        upgradeAllHandLevels: true
      };
    }
  })
];

/**
 * 根据ID获取幻灵牌
 */
export function getSpectralById(id: string): Consumable | undefined {
  return getConsumableById(SPECTRAL_CONSUMABLES, id);
}

/**
 * 获取随机幻灵牌
 */
export function getRandomSpectrals(count: number): Consumable[] {
  return getRandomConsumables(SPECTRAL_CONSUMABLES, count);
}

/**
 * 获取单张随机幻灵牌
 */
export function getRandomSpectral(): Consumable {
  return getRandomConsumable(SPECTRAL_CONSUMABLES);
}
