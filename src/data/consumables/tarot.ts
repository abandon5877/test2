import { ConsumableType, type ConsumableEffectContext, type ConsumableEffectResult } from '../../types/consumable';
import { Suit, Rank, CardEnhancement, SealType } from '../../types/card';
import { Card } from '../../models/Card';
import type { TarotData } from './types';
import { getConsumableById as getConsumableByIdFromAll } from './index';

/**
 * 塔罗牌数据（22张）
 */
export const TAROT_CARDS: TarotData[] = [
  {
    id: 'tarot_fool',
    name: '愚者',
    description: '复制上一次使用的塔罗牌或星球牌效果',
    type: ConsumableType.TAROT,
    cost: 3,
    useCondition: '需要本回合使用过塔罗牌或星球牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.lastUsedConsumable) {
        return {
          success: false,
          message: '愚者: 没有上一次使用的消耗牌'
        };
      }
      if (context.lastUsedConsumable.type !== ConsumableType.TAROT &&
          context.lastUsedConsumable.type !== ConsumableType.PLANET) {
        return {
          success: false,
          message: '愚者: 上一次使用的不是塔罗牌或星球牌'
        };
      }
      if (context.lastUsedConsumable.id === 'tarot_fool') {
        return {
          success: false,
          message: '愚者: 不能复制自己'
        };
      }
      return {
        success: true,
        message: `愚者: 复制了 ${context.lastUsedConsumable.id}`,
        affectedCards: [],
        copiedConsumableId: context.lastUsedConsumable.id
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      if (!context.lastUsedConsumable) return false;
      if (context.lastUsedConsumable.type !== ConsumableType.TAROT &&
          context.lastUsedConsumable.type !== ConsumableType.PLANET) return false;
      if (context.lastUsedConsumable.id === 'tarot_fool') return false;
      
      // 检查被复制的牌是否需要选中牌
      const lastConsumable = getConsumableByIdFromAll(context.lastUsedConsumable.id);
      if (lastConsumable && lastConsumable.canUse) {
        // 如果被复制的牌需要选中牌，则当前也必须有选中牌
        const canLastUse = lastConsumable.canUse(context);
        if (!canLastUse) {
          return false;
        }
      }
      
      return true;
    }
  },

  {
    id: 'tarot_magician',
    name: '魔术师',
    description: '将选中的2张牌变为幸运牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择2张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length !== 2) {
        return { success: false, message: '需要选择2张牌' };
      }
      for (const card of context.selectedCards) {
        card.enhancement = CardEnhancement.Lucky;
      }
      return {
        success: true,
        message: `魔术师: ${context.selectedCards.length}张牌变为幸运牌`,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 2);
    }
  },

  {
    id: 'tarot_high_priestess',
    name: '女祭司',
    description: '生成最多2张随机星球牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '无特殊条件',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      const planetIds = [
        'planet_mercury', 'planet_venus', 'planet_earth', 'planet_mars',
        'planet_jupiter', 'planet_saturn', 'planet_uranus', 'planet_neptune', 'planet_pluto'
      ];
      const shuffled = [...planetIds].sort(() => Math.random() - 0.5);
      const selectedIds = shuffled.slice(0, 2);
      
      return {
        success: true,
        message: `女祭司: 生成${selectedIds.length}张随机星球牌`,
        affectedCards: [],
        newConsumableIds: selectedIds
      };
    }
  },

  {
    id: 'tarot_empress',
    name: '皇后',
    description: '将选中的2张牌变为倍率牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择2张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length !== 2) {
        return { success: false, message: '需要选择2张牌' };
      }
      for (const card of context.selectedCards) {
        card.enhancement = CardEnhancement.Mult;
      }
      return {
        success: true,
        message: `皇后: ${context.selectedCards.length}张牌变为倍率牌`,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 2);
    }
  },

  {
    id: 'tarot_emperor',
    name: '皇帝',
    description: '生成最多2张随机塔罗牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '无特殊条件',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      const tarotIds = [
        'tarot_fool', 'tarot_magician', 'tarot_high_priestess', 'tarot_empress',
        'tarot_emperor', 'tarot_hierophant', 'tarot_lovers', 'tarot_chariot',
        'tarot_justice', 'tarot_hermit', 'tarot_wheel_of_fortune', 'tarot_strength',
        'tarot_hanged_man', 'tarot_death', 'tarot_temperance', 'tarot_devil',
        'tarot_tower', 'tarot_star', 'tarot_moon', 'tarot_sun', 'tarot_judgement', 'tarot_world'
      ].filter(id => id !== 'tarot_emperor');
      const shuffled = [...tarotIds].sort(() => Math.random() - 0.5);
      const selectedIds = shuffled.slice(0, 2);
      
      return {
        success: true,
        message: `皇帝: 生成${selectedIds.length}张随机塔罗牌`,
        affectedCards: [],
        newConsumableIds: selectedIds
      };
    }
  },

  {
    id: 'tarot_hierophant',
    name: '教皇',
    description: '将选中的2张牌变为增强牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择2张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length !== 2) {
        return { success: false, message: '需要选择2张牌' };
      }
      for (const card of context.selectedCards) {
        card.enhancement = CardEnhancement.Bonus;
      }
      return {
        success: true,
        message: `教皇: 2张牌获得增强`,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 2);
    }
  },

  {
    id: 'tarot_lovers',
    name: '恋人',
    description: '将选中的1张牌变为万能牌',
    type: ConsumableType.TAROT,
    cost: 3,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.enhancement = CardEnhancement.Wild;
      return {
        success: true,
        message: `恋人: ${card.toString()} 变为万能牌`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  },

  {
    id: 'tarot_chariot',
    name: '战车',
    description: '将选中的1张牌变为钢铁牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.enhancement = CardEnhancement.Steel;
      return {
        success: true,
        message: `战车: ${card.toString()} 变为钢铁牌`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  },

  {
    id: 'tarot_justice',
    name: '正义',
    description: '将选中的1张牌变为玻璃牌',
    type: ConsumableType.TAROT,
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
        message: `正义: ${card.toString()} 变为玻璃牌`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  },

  {
    id: 'tarot_hermit',
    name: '隐士',
    description: '将资金翻倍（最多$20）',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '无特殊条件',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      const currentMoney = context.money || 0;
      const increase = Math.min(currentMoney, 20);
      const newMoney = currentMoney + increase;
      
      if (context.setMoney) {
        context.setMoney(newMoney);
      }
      
      return {
        success: true,
        message: `隐士: 资金翻倍 +$${increase}`,
        affectedCards: [],
        moneyChange: increase
      };
    }
  },

  {
    id: 'tarot_wheel_of_fortune',
    name: '命运之轮',
    description: '1/4概率给随机小丑牌添加箔片/全息/多色版本',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要至少拥有1张小丑牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.jokers || context.jokers.length === 0) {
        return {
          success: false,
          message: '命运之轮: 没有小丑牌可以添加版本'
        };
      }

      const eligibleJokers = context.jokers.filter(j => !j.hasEdition);
      if (eligibleJokers.length === 0) {
        return {
          success: false,
          message: '命运之轮: 所有小丑牌都已有版本'
        };
      }

      const rand = Math.random();
      if (rand < 0.25) {
        const editionRand = Math.random();
        let editionName = '';

        if (editionRand < 0.5) {
          editionName = '箔片';
        } else if (editionRand < 0.85) {
          editionName = '全息';
        } else {
          editionName = '多色';
        }

        if (context.addEditionToRandomJoker) {
          context.addEditionToRandomJoker(editionName === '箔片' ? 'foil' : editionName === '全息' ? 'holographic' : 'polychrome');
        }

        return {
          success: true,
          message: `命运之轮: 随机小丑牌获得${editionName}版本`,
          affectedCards: []
        };
      }
      return {
        success: true,
        message: '命运之轮: 运气不好，没有效果',
        affectedCards: []
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      if (!context.jokers || context.jokers.length === 0) return false;
      const eligibleJokers = context.jokers.filter(j => !j.hasEdition);
      return eligibleJokers.length > 0;
    }
  },

  {
    id: 'tarot_strength',
    name: '力量',
    description: '将最多2张选中牌的点数+1',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择1-2张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择至少1张牌' };
      }
      if (context.selectedCards.length > 2) {
        return { success: false, message: '最多选择2张牌' };
      }
      let message = '力量: ';
      for (const card of context.selectedCards) {
        card.increaseRank(1);
        message += `${card.toString()}+1 `;
      }
      return {
        success: true,
        message,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      const count = context.selectedCards?.length ?? 0;
      return count >= 1 && count <= 2;
    }
  },

  {
    id: 'tarot_hanged_man',
    name: '倒吊人',
    description: '摧毁最多2张选中牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择1-2张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0 || context.selectedCards.length > 2) {
        return { success: false, message: '需要选择1-2张牌' };
      }
      return {
        success: true,
        message: `倒吊人: 摧毁${context.selectedCards.length}张牌`,
        destroyedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length >= 1 && context.selectedCards.length <= 2);
    }
  },

  {
    id: 'tarot_death',
    name: '死神',
    description: '将左边选中的牌变成右边牌的花色和点数',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择2张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length !== 2) {
        return { success: false, message: '需要选择2张牌' };
      }
      const [card1, card2] = context.selectedCards;
      card1.suit = card2.suit;
      card1.rank = card2.rank;
      return {
        success: true,
        message: `死神: ${card1.toString()} 变成了 ${card2.toString()}`,
        affectedCards: [card1, card2]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 2);
    }
  },

  {
    id: 'tarot_temperance',
    name: '节制',
    description: '获得当前所有小丑牌总售价的资金（最多$50）',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '无特殊条件',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.jokers || context.jokers.length === 0) {
        return {
          success: true,
          message: '节制: 没有小丑牌',
          affectedCards: [],
          moneyChange: 0
        };
      }
      
      const totalSellValue = context.jokers.reduce((sum, joker) => sum + (joker.sellPrice || 0), 0);
      const moneyGain = Math.min(totalSellValue, 50);
      
      return {
        success: true,
        message: `节制: 获得$${moneyGain}（小丑牌总售价）`,
        affectedCards: [],
        moneyChange: moneyGain
      };
    }
  },

  {
    id: 'tarot_devil',
    name: '恶魔',
    description: '将选中的1张牌变为黄金牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.enhancement = CardEnhancement.Gold;
      return {
        success: true,
        message: `恶魔: ${card.toString()} 变为黄金牌`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  },

  {
    id: 'tarot_tower',
    name: '塔',
    description: '将选中的1张牌变为石头牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '需要选择1张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择1张牌' };
      }
      const card = context.selectedCards[0];
      card.enhancement = CardEnhancement.Stone;
      return {
        success: true,
        message: `塔: ${card.toString()} 变为石头牌`,
        affectedCards: [card]
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      return !!(context.selectedCards && context.selectedCards.length === 1);
    }
  },

  {
    id: 'tarot_star',
    name: '星星',
    description: '将选中的最多3张牌变为红桃',
    type: ConsumableType.TAROT,
    cost: 3,
    useCondition: '需要选择1-3张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择至少1张牌' };
      }
      if (context.selectedCards.length > 3) {
        return { success: false, message: '最多选择3张牌' };
      }
      for (const card of context.selectedCards) {
        card.suit = Suit.Hearts;
      }
      return {
        success: true,
        message: `星星: ${context.selectedCards.length}张牌变为红桃`,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      const count = context.selectedCards?.length ?? 0;
      return count >= 1 && count <= 3;
    }
  },

  {
    id: 'tarot_moon',
    name: '月亮',
    description: '将选中的最多3张牌变为黑桃',
    type: ConsumableType.TAROT,
    cost: 3,
    useCondition: '需要选择1-3张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择至少1张牌' };
      }
      if (context.selectedCards.length > 3) {
        return { success: false, message: '最多选择3张牌' };
      }
      for (const card of context.selectedCards) {
        card.suit = Suit.Spades;
      }
      return {
        success: true,
        message: `月亮: ${context.selectedCards.length}张牌变为黑桃`,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      const count = context.selectedCards?.length ?? 0;
      return count >= 1 && count <= 3;
    }
  },

  {
    id: 'tarot_sun',
    name: '太阳',
    description: '将选中的最多3张牌变为方块',
    type: ConsumableType.TAROT,
    cost: 3,
    useCondition: '需要选择1-3张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择至少1张牌' };
      }
      if (context.selectedCards.length > 3) {
        return { success: false, message: '最多选择3张牌' };
      }
      for (const card of context.selectedCards) {
        card.suit = Suit.Diamonds;
      }
      return {
        success: true,
        message: `太阳: ${context.selectedCards.length}张牌变为方块`,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      const count = context.selectedCards?.length ?? 0;
      return count >= 1 && count <= 3;
    }
  },

  {
    id: 'tarot_judgement',
    name: '审判',
    description: '生成1张随机小丑牌',
    type: ConsumableType.TAROT,
    cost: 4,
    useCondition: '无特殊条件',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      console.log('[Judgement] 审判牌被使用, context.addJoker 存在:', !!context.addJoker);
      let jokerAdded = false;
      if (context.addJoker) {
        console.log('[Judgement] 调用 context.addJoker()');
        jokerAdded = context.addJoker();
        console.log('[Judgement] context.addJoker() 返回:', jokerAdded);
      } else {
        console.log('[Judgement] context.addJoker 不存在!');
      }

      return {
        success: true,
        message: jokerAdded ? '审判: 生成1张随机小丑牌' : '审判: 小丑槽位已满，无法生成',
        affectedCards: []
      };
    }
  },

  {
    id: 'tarot_world',
    name: '世界',
    description: '将选中的最多3张牌变为梅花',
    type: ConsumableType.TAROT,
    cost: 3,
    useCondition: '需要选择1-3张手牌',
    use: (context: ConsumableEffectContext): ConsumableEffectResult => {
      if (!context.selectedCards || context.selectedCards.length === 0) {
        return { success: false, message: '需要选择至少1张牌' };
      }
      if (context.selectedCards.length > 3) {
        return { success: false, message: '最多选择3张牌' };
      }
      for (const card of context.selectedCards) {
        card.suit = Suit.Clubs;
      }
      return {
        success: true,
        message: `世界: ${context.selectedCards.length}张牌变为梅花`,
        affectedCards: context.selectedCards
      };
    },
    canUse: (context: ConsumableEffectContext): boolean => {
      const count = context.selectedCards?.length ?? 0;
      return count >= 1 && count <= 3;
    }
  }
];

// ==================== Consumable 实例 ====================

import { Consumable } from '../../models/Consumable';
import { getConsumableById, getRandomConsumables, getRandomConsumable } from './utils';

/**
 * 塔罗牌消耗品实例（22张）
 */
export const TAROT_CONSUMABLES: Consumable[] = TAROT_CARDS.map(card => new Consumable({
  id: card.id,
  name: card.name,
  description: card.description,
  type: card.type,
  cost: card.cost,
  useCondition: card.useCondition,
  use: card.use,
  canUse: card.canUse
}));

/**
 * 根据ID获取塔罗牌
 */
export function getTarotById(id: string): Consumable | undefined {
  return getConsumableById(TAROT_CONSUMABLES, id);
}

/**
 * 获取随机塔罗牌
 */
export function getRandomTarots(count: number): Consumable[] {
  return getRandomConsumables(TAROT_CONSUMABLES, count);
}

/**
 * 获取单张随机塔罗牌
 */
export function getRandomTarot(): Consumable {
  return getRandomConsumable(TAROT_CONSUMABLES);
}
