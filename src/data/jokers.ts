import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger, type JokerEffectContext, type JokerEffectResult } from '../types/joker';
import { Suit, CardEnhancement } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import type { Card } from '../models/Card';

export const JOKERS: Joker[] = [
  new Joker({
    id: 'lusty_joker',
    name: '色欲小丑',
    description: '每张打出的红桃+3倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const heartCount = context.scoredCards.filter(card => card.suit === Suit.Hearts).length;
      if (heartCount > 0) {
        return {
          multBonus: heartCount * 3,
          message: `色欲小丑: ${heartCount}张红桃 +${heartCount * 3}倍率`
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'wrathful_joker',
    name: '暴怒小丑',
    description: '每张打出的黑桃+3倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const spadeCount = context.scoredCards.filter(card => card.suit === Suit.Spades).length;
      if (spadeCount > 0) {
        return {
          multBonus: spadeCount * 3,
          message: `暴怒小丑: ${spadeCount}张黑桃 +${spadeCount * 3}倍率`
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'scary_face',
    name: '恐怖面孔',
    description: '每张打出的人头牌+30筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const faceCount = context.scoredCards.filter(card => card.isFaceCard).length;
      if (faceCount > 0) {
        return {
          chipBonus: faceCount * 30,
          message: `恐怖面孔: ${faceCount}张人头牌 +${faceCount * 30}筹码`
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'jolly_joker',
    name: '开心小丑',
    description: '打出对子时+8倍率',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.OnePair) {
        return {
          multBonus: 8,
          message: '开心小丑: +8倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'droll_joker',
    name: '同花小丑',
    description: '打出同花时+10倍率',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const flushTypes = [
        PokerHandType.Flush,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush
      ];
      if (context.handType && flushTypes.includes(context.handType)) {
        return {
          multBonus: 10,
          message: '同花小丑: +10倍率'
        };
      }
      return {};
    }
  }),

  // 顺序相关的小丑牌
  new Joker({
    id: 'blueprint',
    name: '蓝图',
    description: '复制右侧小丑牌的能力',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const rightJoker = context.rightJokers?.[0];
      if (rightJoker && rightJoker.id !== 'blueprint') {
        // 复制右侧小丑的效果
        const result = rightJoker.effect(context);
        return {
          ...result,
          message: `蓝图复制 [${rightJoker.name}]: ${result.message || '触发效果'}`
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'swashbuckler',
    name: '剑客',
    description: '将左侧所有小丑牌的售价加到倍率',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const leftJokers = context.leftJokers || [];
      const totalSellValue = leftJokers.reduce((sum, j) => sum + j.cost, 0);
      if (totalSellValue > 0) {
        return {
          multBonus: totalSellValue,
          message: `剑客: 左侧${leftJokers.length}张小丑 +${totalSellValue}倍率`
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'brainstorm',
    name: '头脑风暴',
    description: '复制最左侧小丑牌的能力',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const leftmostJoker = context.leftmostJoker;
      if (leftmostJoker && leftmostJoker.id !== 'brainstorm') {
        const result = leftmostJoker.effect(context);
        return {
          ...result,
          message: `头脑风暴复制 [${leftmostJoker.name}]: ${result.message || '触发效果'}`
        };
      }
      return {};
    }
  }),

  // 基础牌型类小丑牌
  new Joker({
    id: 'zany_joker',
    name: '滑稽小丑',
    description: '打出三条时+12倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.ThreeOfAKind) {
        return {
          multBonus: 12,
          message: '滑稽小丑: +12倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'mad_joker',
    name: '疯狂小丑',
    description: '打出两对时+10倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.TwoPair) {
        return {
          multBonus: 10,
          message: '疯狂小丑: +10倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'crazy_joker',
    name: '狂热小丑',
    description: '打出顺子时+12倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const straightTypes = [
        PokerHandType.Straight,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush
      ];
      if (context.handType && straightTypes.includes(context.handType)) {
        return {
          multBonus: 12,
          message: '狂热小丑: +12倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'half_joker',
    name: '半张小丑',
    description: '出牌≤3张时+20倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.scoredCards && context.scoredCards.length <= 3) {
        return {
          multBonus: 20,
          message: '半张小丑: +20倍率'
        };
      }
      return {};
    }
  }),

  // 花色类小丑牌
  new Joker({
    id: 'greedy_joker',
    name: '贪婪小丑',
    description: '每张打出的方片+3倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const diamondCount = context.scoredCards.filter(card => card.suit === Suit.Diamonds).length;
      if (diamondCount > 0) {
        return {
          multBonus: diamondCount * 3,
          message: `贪婪小丑: ${diamondCount}张方片 +${diamondCount * 3}倍率`
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'gluttonous_joker',
    name: '暴食小丑',
    description: '每张打出的梅花+3倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const clubCount = context.scoredCards.filter(card => card.suit === Suit.Clubs).length;
      if (clubCount > 0) {
        return {
          multBonus: clubCount * 3,
          message: `暴食小丑: ${clubCount}张梅花 +${clubCount * 3}倍率`
        };
      }
      return {};
    }
  }),

  // 罕见(Uncommon)小丑牌
  new Joker({
    id: 'sock_and_buskin',
    name: '喜剧与悲剧',
    description: '脸牌触发2次',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT, // 改为ON_INDEPENDENT，实际效果在ScoringSystem中处理
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 实际触发两次效果在ScoringSystem中实现
      // 这里只返回提示信息
      return {
        message: '喜剧与悲剧: 脸牌将触发2次'
      };
    }
  }),

  new Joker({
    id: 'loyalty_card',
    name: '忠诚卡',
    description: '每第6次出牌x4倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const handsPlayed = context.handsPlayed || 0;
      if (handsPlayed > 0 && handsPlayed % 6 === 0) {
        return {
          multMultiplier: 4,
          message: '忠诚卡: x4倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'cartomancer',
    name: '纸牌占卜师',
    description: '选盲注时生成一张塔罗牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_BLIND_SELECT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 从 jokerSlots 检查是否有空间
      const jokerSlots = (context as unknown as { jokerSlots?: { getAvailableSlots: () => number } }).jokerSlots;
      if (jokerSlots && jokerSlots.getAvailableSlots() <= 0) {
        return {};
      }
      return {
        tarotBonus: 1,
        message: '纸牌占卜师: 生成一张塔罗牌'
      };
    }
  }),

  new Joker({
    id: 'space_joker',
    name: '太空小丑',
    description: '1/5概率升级牌型等级',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (Math.random() < 0.2) {
        return {
          message: '太空小丑: 升级牌型等级'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'flower_pot',
    name: '花盆',
    description: '四种花色时x3倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const suits = new Set(context.scoredCards.map(card => card.suit));
      if (suits.size === 4) {
        return {
          multMultiplier: 3,
          message: '花盆: x3倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'four_fingers',
    name: '四指',
    description: '同花/顺子只需4张',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        fourFingers: true,
        message: '四指: 同花/顺子只需4张'
      };
    }
  }),

  new Joker({
    id: 'dusk',
    name: '黄昏',
    description: '最后一次出牌触发2次',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const gameState = context.gameState;
      if (gameState && gameState.hands === 1) {
        return {
          multMultiplier: 2,
          message: '黄昏: 最后一次出牌触发2次'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'constellation',
    name: '星座',
    description: '每使用一张行星牌x0.1倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const planetCardsUsed = (context as unknown as { jokerState?: { planetCardsUsed?: number } }).jokerState?.planetCardsUsed || 0;
      const multiplier = 1 + planetCardsUsed * 0.1;
      return {
        multMultiplier: multiplier,
        message: `星座: 已使用${planetCardsUsed}张行星牌, x${multiplier.toFixed(1)}倍率`
      };
    }
  }),

  new Joker({
    id: 'hiker',
    name: '远足者',
    description: '打出牌永久+1筹码',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const cardCount = context.scoredCards.length;
      const permanentBonus = (context as unknown as { jokerState?: { hikerBonus?: number } }).jokerState?.hikerBonus || 0;
      return {
        chipBonus: cardCount + permanentBonus,
        stateUpdate: { hikerBonus: permanentBonus + cardCount },
        message: `远足者: ${cardCount}张牌+${cardCount}筹码，累计永久+${permanentBonus + cardCount}筹码`
      };
    }
  }),

  new Joker({
    id: 'shortcut',
    name: '捷径',
    description: '顺子可跳1个数字',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 捷径效果在PokerHandDetector中实现
      return {
        message: '捷径: 顺子可跳1个数字'
      };
    }
  }),

  // 稀有(Rare)小丑牌
  new Joker({
    id: 'the_duo',
    name: '二人组',
    description: '对子时x2倍率',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.OnePair) {
        return {
          multMultiplier: 2,
          message: '二人组: x2倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'the_trio',
    name: '三人组',
    description: '三条时x3倍率',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.ThreeOfAKind) {
        return {
          multMultiplier: 3,
          message: '三人组: x3倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'the_family',
    name: '家庭',
    description: '四条时x4倍率',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.FourOfAKind) {
        return {
          multMultiplier: 4,
          message: '家庭: x4倍率'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'dna',
    name: 'DNA',
    description: '首出1张时永久复制加入卡组',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 检查是否是第一手（handsPlayed === 0）且只有1张牌
      if (context.handsPlayed === 0 && 
          context.scoredCards && 
          context.scoredCards.length === 1) {
        return {
          message: 'DNA: 永久复制该牌加入卡组'
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'baseball_card',
    name: '棒球卡',
    description: '罕见小丑各x1.5倍率',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const uncommonCount = context.allJokers?.filter(j => j.rarity === JokerRarity.UNCOMMON).length || 0;
      if (uncommonCount > 0) {
        const multiplier = Math.pow(1.5, uncommonCount);
        return {
          multMultiplier: multiplier,
          message: `棒球卡: ${uncommonCount}张罕见小丑 x${multiplier.toFixed(2)}倍率`
        };
      }
      return {};
    }
  }),

  // 传说(Legendary)小丑牌
  new Joker({
    id: 'triboulet',
    name: '特里布莱',
    description: 'K和Q给予x2倍率',
    rarity: JokerRarity.LEGENDARY,
    cost: 20,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const kingQueenCount = context.scoredCards.filter(card => 
        card.rank === 'K' || card.rank === 'Q'
      ).length;
      if (kingQueenCount > 0) {
        const multiplier = Math.pow(2, kingQueenCount);
        return {
          multMultiplier: multiplier,
          message: `特里布莱: ${kingQueenCount}张K/Q x${multiplier.toFixed(2)}倍率`
        };
      }
      return {};
    }
  }),

  new Joker({
    id: 'chicot',
    name: '奇科',
    description: 'Boss盲注能力无效',
    rarity: JokerRarity.LEGENDARY,
    cost: 20,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        message: '奇科: Boss盲注能力无效'
      };
    }
  }),

  new Joker({
    id: 'perkeo',
    name: '佩尔科',
    description: '离开商店时复制随机塔罗/行星牌',
    rarity: JokerRarity.LEGENDARY,
    cost: 20,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        message: '佩尔科: 复制随机塔罗/行星牌'
      };
    }
  }),

  // ==================== 更多普通(Common)小丑牌 ====================
  
  // 基础小丑牌
  new Joker({
    id: 'joker',
    name: '小丑',
    description: '+4倍率',
    rarity: JokerRarity.COMMON,
    cost: 2,
    trigger: JokerTrigger.ON_PLAY,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        multBonus: 4,
        message: '小丑: +4倍率'
      };
    }
  }),

  // 混沌小丑 - 需要商店系统支持免费刷新
  new Joker({
    id: 'chaos_the_clown',
    name: '混沌小丑',
    description: '每回合1次免费刷新',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_REROLL,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        freeReroll: true,
        message: '混沌小丑: 免费刷新'
      };
    }
  }),

  // 石头小丑
  new Joker({
    id: 'stone_joker',
    name: '石头小丑',
    description: '打出石头牌永久+20筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const stoneCount = context.scoredCards.filter(card => card.enhancement === CardEnhancement.Stone).length;
      const permanentBonus = (context as unknown as { jokerState?: { stoneBonus?: number } }).jokerState?.stoneBonus || 0;
      if (stoneCount > 0) {
        return {
          chipBonus: stoneCount * 20 + permanentBonus,
          stateUpdate: { stoneBonus: permanentBonus + stoneCount * 20 },
          message: `石头小丑: ${stoneCount}张石头牌+${stoneCount * 20}筹码，累计永久+${permanentBonus + stoneCount * 20}筹码`
        };
      }
      // 即使没有打出石头牌，也提供永久加成
      if (permanentBonus > 0) {
        return {
          chipBonus: permanentBonus,
          message: `石头小丑: 永久+${permanentBonus}筹码`
        };
      }
      return {};
    }
  }),

  // 戏法师
  new Joker({
    id: 'juggler',
    name: '杂耍者',
    description: '手牌上限+2',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        extraHandSize: 2,
        message: '杂耍者: 手牌上限+2'
      };
    }
  }),

  // 酒鬼
  new Joker({
    id: 'drunkard',
    name: '酒鬼',
    description: '弃牌次数+1',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        extraDiscards: 1,
        message: '酒鬼: 弃牌次数+1'
      };
    }
  }),

  // 游吟诗人
  new Joker({
    id: 'troubadour',
    name: '吟游诗人',
    description: '+2手牌上限，-1出牌次数',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        extraHandSize: 2,
        extraHands: -1,
        message: '吟游诗人: +2手牌上限，-1出牌次数'
      };
    }
  }),

  // 旗帜
  new Joker({
    id: 'banner',
    name: '旗帜',
    description: '每剩余弃牌+40筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const remainingDiscards = context.gameState?.discards || 0;
      if (remainingDiscards > 0) {
        const bonus = remainingDiscards * 40;
        return {
          chipBonus: bonus,
          message: `旗帜: ${remainingDiscards}剩余弃牌 +${bonus}筹码`
        };
      }
      return {};
    }
  }),

  // 神秘峰顶
  new Joker({
    id: 'mystic_summit',
    name: '神秘峰顶',
    description: '0弃牌时+15倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const remainingDiscards = context.gameState?.discards || 0;
      if (remainingDiscards === 0) {
        return {
          multBonus: 15,
          message: '神秘峰顶: +15倍率'
        };
      }
      return {};
    }
  }),

  // 错版印刷
  new Joker({
    id: 'misprint',
    name: '印刷错误',
    description: '随机+0~20倍率',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const randomMult = Math.floor(Math.random() * 21);
      return {
        multBonus: randomMult,
        message: `印刷错误: +${randomMult}倍率`
      };
    }
  }),

  // 钢铁小丑
  new Joker({
    id: 'steel_joker',
    name: '钢铁小丑',
    description: '钢铁牌在手牌中+10倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HELD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.heldCards) return {};
      const steelCount = context.heldCards.filter(card => card.enhancement === CardEnhancement.Steel).length;
      if (steelCount > 0) {
        return {
          multBonus: steelCount * 10,
          message: `钢铁小丑: ${steelCount}张钢铁牌 +${steelCount * 10}倍率`
        };
      }
      return {};
    }
  }),

  // 抽象小丑
  new Joker({
    id: 'abstract_joker',
    name: '抽象小丑',
    description: '每小丑牌+2倍率',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerCount = context.allJokers?.length || 0;
      if (jokerCount > 0) {
        const bonus = jokerCount * 2;
        return {
          multBonus: bonus,
          message: `抽象小丑: ${jokerCount}张小丑 +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // 延迟收获
  new Joker({
    id: 'delayed_gratification',
    name: '延迟满足',
    description: '未用弃牌每机会+$2',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const remainingDiscards = context.gameState?.discards || 0;
      if (remainingDiscards > 0) {
        const money = remainingDiscards * 2;
        return {
          moneyBonus: money,
          message: `延迟满足: ${remainingDiscards}未用弃牌 +$${money}`
        };
      }
      return {};
    }
  }),

  // 金票券
  new Joker({
    id: 'golden_ticket',
    name: '金票',
    description: '每出一张金牌+$4',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const goldCount = context.scoredCards.filter(card => card.enhancement === CardEnhancement.Gold).length;
      if (goldCount > 0) {
        const money = goldCount * 4;
        return {
          moneyBonus: money,
          message: `金票: ${goldCount}张金牌 +$${money}`
        };
      }
      return {};
    }
  }),

  // 半斤八两 (Odd Todd的对应)
  new Joker({
    id: 'odd_todd',
    name: '奇数托德',
    description: '每张奇数牌+31筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const oddRanks = ['A', '3', '5', '7', '9'];
      const oddCount = context.scoredCards.filter(card => oddRanks.includes(card.rank)).length;
      if (oddCount > 0) {
        const bonus = oddCount * 31;
        return {
          chipBonus: bonus,
          message: `奇数托德: ${oddCount}张奇数牌 +${bonus}筹码`
        };
      }
      return {};
    }
  }),

  // 学者
  new Joker({
    id: 'scholar',
    name: '学者',
    description: '每个A+4倍率和+20筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const aceCount = context.scoredCards.filter(card => card.rank === 'A').length;
      if (aceCount > 0) {
        return {
          multBonus: aceCount * 4,
          chipBonus: aceCount * 20,
          message: `学者: ${aceCount}张A +${aceCount * 4}倍率 +${aceCount * 20}筹码`
        };
      }
      return {};
    }
  }),

  // 名片
  new Joker({
    id: 'business_card',
    name: '名片',
    description: '脸牌50%概率给$2',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const faceCount = context.scoredCards.filter(card => card.isFaceCard).length;
      if (faceCount > 0) {
        let money = 0;
        for (let i = 0; i < faceCount; i++) {
          if (Math.random() < 0.5) money += 2;
        }
        if (money > 0) {
          return {
            moneyBonus: money,
            message: `名片: 获得$${money}`
          };
        }
      }
      return {};
    }
  }),

  // 超新星
  new Joker({
    id: 'supernova',
    name: '超新星',
    description: '将出牌次数加到倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const handsPlayed = context.handsPlayed || 0;
      if (handsPlayed > 0) {
        return {
          multBonus: handsPlayed,
          message: `超新星: 出牌${handsPlayed}次 +${handsPlayed}倍率`
        };
      }
      return {};
    }
  }),

  // 占卜师
  new Joker({
    id: 'fortune_teller',
    name: '算命先生',
    description: '每张使用过的塔罗牌+1倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const tarotCardsUsed = (context as unknown as { jokerState?: { tarotCardsUsed?: number } }).jokerState?.tarotCardsUsed || 0;
      return {
        multBonus: tarotCardsUsed,
        message: `算命先生: 已使用${tarotCardsUsed}张塔罗牌, +${tarotCardsUsed}倍率`
      };
    }
  }),

  // 悬挂票
  new Joker({
    id: 'hanging_chad',
    name: '悬挂票',
    description: '第一张牌触发2次',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_INDEPENDENT, // 改为ON_INDEPENDENT，实际效果在ScoringSystem中处理
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 实际触发两次效果在ScoringSystem中实现
      // 这里只返回提示信息
      return {
        message: '悬挂票: 第一张牌将触发2次'
      };
    }
  }),

  // 水花飞溅
  new Joker({
    id: 'splash',
    name: '水花',
    description: '打出的每一张牌都将被记分',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        allCardsScore: true,
        message: '水花: 所有打出牌计分'
      };
    }
  }),

  // 诡诈小丑
  new Joker({
    id: 'sly_joker',
    name: '狡猾小丑',
    description: '对子时+50筹码',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.OnePair) {
        return {
          chipBonus: 50,
          message: '狡猾小丑: +50筹码'
        };
      }
      return {};
    }
  }),

  // 狡猾小丑
  new Joker({
    id: 'wily_joker',
    name: '诡计小丑',
    description: '三条时+100筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.ThreeOfAKind) {
        return {
          chipBonus: 100,
          message: '诡计小丑: +100筹码'
        };
      }
      return {};
    }
  }),

  // 欺诈小丑
  new Joker({
    id: 'devious_joker',
    name: '阴险小丑',
    description: '顺子时+100筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const straightTypes = [
        PokerHandType.Straight,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush
      ];
      if (context.handType && straightTypes.includes(context.handType)) {
        return {
          chipBonus: 100,
          message: '阴险小丑: +100筹码'
        };
      }
      return {};
    }
  }),

  // 狡诈小丑
  new Joker({
    id: 'crafty_joker',
    name: '灵巧小丑',
    description: '同花时+80筹码',
    rarity: JokerRarity.COMMON,
    cost: 3,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const flushTypes = [
        PokerHandType.Flush,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush
      ];
      if (context.handType && flushTypes.includes(context.handType)) {
        return {
          chipBonus: 80,
          message: '灵巧小丑: +80筹码'
        };
      }
      return {};
    }
  }),

  // ==================== 更多罕见(Uncommon)小丑牌 ====================

  // 黑客
  new Joker({
    id: 'hack',
    name: '黑客',
    description: '2,3,4,5触发2次',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT, // 改为ON_INDEPENDENT，实际效果在ScoringSystem中处理
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 实际触发两次效果在ScoringSystem中实现
      // 这里只返回提示信息
      return {
        message: '黑客: 2,3,4,5将触发2次'
      };
    }
  }),

  // 斐波那契
  new Joker({
    id: 'fibonacci',
    name: '斐波那契',
    description: 'A,2,3,5,8各+8倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 8,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const fibRanks = ['A', '2', '3', '5', '8'];
      const fibCount = context.scoredCards.filter(card => fibRanks.includes(card.rank)).length;
      if (fibCount > 0) {
        const bonus = fibCount * 8;
        return {
          multBonus: bonus,
          message: `斐波那契: ${fibCount}张A,2,3,5,8 +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // 哎呀全是6
  new Joker({
    id: 'oops_all_6s',
    name: '哎呀全是6',
    description: '所有概率翻倍',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        message: '哎呀全是6: 概率翻倍'
      };
    }
  }),

  // 特技演员
  new Joker({
    id: 'stuntman',
    name: '特技演员',
    description: '1/5概率+500筹码',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (Math.random() < 0.2) {
        return {
          chipBonus: 500,
          message: '特技演员: +500筹码'
        };
      }
      return {};
    }
  }),

  // 驾照
  new Joker({
    id: 'drivers_license',
    name: '驾照',
    description: '16+强化牌时x2倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 从context中获取强化牌数量（需要游戏系统提供）
      const enhancedCardsCount = (context as unknown as { enhancedCardsCount?: number }).enhancedCardsCount || 0;
      if (enhancedCardsCount >= 16) {
        return {
          multMultiplier: 2,
          message: `驾照: ${enhancedCardsCount}张强化牌，x2倍率`
        };
      }
      return {
        message: `驾照: ${enhancedCardsCount}/16张强化牌`
      };
    }
  }),

  // 天文学家
  new Joker({
    id: 'astronomer',
    name: '天文学家',
    description: '商店行星牌免费',
    rarity: JokerRarity.UNCOMMON,
    cost: 8,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        message: '天文学家: 行星牌免费'
      };
    }
  }),

  // 复古
  new Joker({
    id: 'throwback',
    name: '复古',
    description: '每跳过盲注x0.25倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const blindsSkipped = (context as unknown as { jokerState?: { blindsSkipped?: number } }).jokerState?.blindsSkipped || 0;
      const multiplier = 1 + blindsSkipped * 0.25;
      return {
        multMultiplier: multiplier,
        message: `复古: 已跳过${blindsSkipped}个盲注, x${multiplier.toFixed(2)}倍率`
      };
    }
  }),

  // 卫星
  new Joker({
    id: 'satellite',
    name: '卫星',
    description: '每张独特行星牌每轮+$1',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const uniquePlanets = (context as unknown as { uniquePlanetCards?: number }).uniquePlanetCards || 0;
      const moneyBonus = uniquePlanets * 1;
      return {
        moneyBonus: moneyBonus,
        message: `卫星: ${uniquePlanets}张独特行星牌 +$${moneyBonus}`
      };
    }
  }),

  // 跑者
  new Joker({
    id: 'runner',
    name: '跑者',
    description: '顺子+15筹码(永久)',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const straightTypes = [
        PokerHandType.Straight,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush
      ];
      const straightCount = (context as unknown as { jokerState?: { straightCount?: number } }).jokerState?.straightCount || 0;
      const permanentBonus = straightCount * 15;
      if (context.handType && straightTypes.includes(context.handType)) {
        return {
          chipBonus: permanentBonus,
          stateUpdate: { straightCount: straightCount + 1 },
          message: `跑者: +${permanentBonus}筹码 (已打出${straightCount + 1}次顺子)`
        };
      }
      return {
        chipBonus: permanentBonus,
        message: `跑者: +${permanentBonus}筹码 (已打出${straightCount}次顺子)`
      };
    }
  }),

  // 礼品卡
  new Joker({
    id: 'gift_card',
    name: '礼品卡',
    description: '每轮小丑/消耗牌售价+$1',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        message: '礼品卡: 售价增加'
      };
    }
  }),

  // 公牛
  new Joker({
    id: 'bull',
    name: '公牛',
    description: '每美元+2筹码',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const money = context.gameState?.money || 0;
      if (money > 0) {
        const bonus = money * 2;
        return {
          chipBonus: bonus,
          message: `公牛: $${money} +${bonus}筹码`
        };
      }
      return {};
    }
  }),

  // ==================== 更多稀有(Rare)小丑牌 ====================

  // 社团
  new Joker({
    id: 'the_order',
    name: '秩序',
    description: '顺子时x3倍率',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const straightTypes = [
        PokerHandType.Straight,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush
      ];
      if (context.handType && straightTypes.includes(context.handType)) {
        return {
          multMultiplier: 3,
          message: '秩序: x3倍率'
        };
      }
      return {};
    }
  }),

  // 宗族
  new Joker({
    id: 'the_tribe',
    name: '部落',
    description: '同花时x2倍率',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const flushTypes = [
        PokerHandType.Flush,
        PokerHandType.StraightFlush,
        PokerHandType.RoyalFlush
      ];
      if (context.handType && flushTypes.includes(context.handType)) {
        return {
          multMultiplier: 2,
          message: '部落: x2倍率'
        };
      }
      return {};
    }
  }),

  // 污损小丑
  new Joker({
    id: 'smeared_joker',
    name: '污损小丑',
    description: '花色只有红黑两种',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        message: '污损小丑: 花色简化为红黑'
      };
    }
  }),

  // 粗糙宝石
  new Joker({
    id: 'rough_gem',
    name: '粗糙宝石',
    description: '每张方片+$1',
    rarity: JokerRarity.RARE,
    cost: 7,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const diamondCount = context.scoredCards.filter(card => card.suit === Suit.Diamonds).length;
      if (diamondCount > 0) {
        const money = diamondCount * 1;
        return {
          moneyBonus: money,
          message: `粗糙宝石: ${diamondCount}张方片 +$${money}`
        };
      }
      return {};
    }
  }),

  // 血石
  new Joker({
    id: 'bloodstone',
    name: '血石',
    description: '红桃1/2概率x1.5倍率',
    rarity: JokerRarity.RARE,
    cost: 7,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const heartCount = context.scoredCards.filter(card => card.suit === Suit.Hearts).length;
      if (heartCount > 0) {
        let multiplier = 1;
        for (let i = 0; i < heartCount; i++) {
          if (Math.random() < 0.5) multiplier *= 1.5;
        }
        if (multiplier > 1) {
          return {
            multMultiplier: multiplier,
            message: `血石: x${multiplier.toFixed(2)}倍率`
          };
        }
      }
      return {};
    }
  }),

  // 箭头
  new Joker({
    id: 'arrowhead',
    name: '箭头',
    description: '每张黑桃+50筹码',
    rarity: JokerRarity.RARE,
    cost: 7,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const spadeCount = context.scoredCards.filter(card => card.suit === Suit.Spades).length;
      if (spadeCount > 0) {
        const bonus = spadeCount * 50;
        return {
          chipBonus: bonus,
          message: `箭头: ${spadeCount}张黑桃 +${bonus}筹码`
        };
      }
      return {};
    }
  }),

  // 黑玛瑙
  new Joker({
    id: 'onyx_agate',
    name: '黑玛瑙',
    description: '每张梅花+7倍率',
    rarity: JokerRarity.RARE,
    cost: 7,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const clubCount = context.scoredCards.filter(card => card.suit === Suit.Clubs).length;
      if (clubCount > 0) {
        const bonus = clubCount * 7;
        return {
          multBonus: bonus,
          message: `黑玛瑙: ${clubCount}张梅花 +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // 自力更生
  new Joker({
    id: 'bootstraps',
    name: '自力更生',
    description: '每$5+2倍率',
    rarity: JokerRarity.RARE,
    cost: 7,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const money = context.gameState?.money || 0;
      const bonus = Math.floor(money / 5) * 2;
      if (bonus > 0) {
        return {
          multBonus: bonus,
          message: `自力更生: $${money} +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // ==================== 更多传说(Legendary)小丑牌 ====================

  // 约里克
  new Joker({
    id: 'yorick',
    name: '约里克',
    description: '23次弃牌后x5倍率',
    rarity: JokerRarity.LEGENDARY,
    cost: 20,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const discardsUsed = context.discardsUsed || 0;
      if (discardsUsed >= 23) {
        return {
          multMultiplier: 5,
          message: '约里克: x5倍率'
        };
      }
      return {};
    }
  }),

  // ==================== 缺失的Common小丑牌 ====================

  // Ceremonial Dagger - 选盲注时摧毁右侧小丑，永久加双倍售价到倍率
  new Joker({
    id: 'ceremonial_dagger',
    name: '仪式匕首',
    description: '选盲注时摧毁右侧小丑，永久加双倍售价到倍率',
    rarity: JokerRarity.COMMON,
    cost: 6,
    trigger: JokerTrigger.ON_BLIND_SELECT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const rightJoker = context.rightJokers && context.rightJokers[0];
      if (rightJoker) {
        // 右侧有小丑，摧毁并加双倍售价到倍率
        const sellPrice = Math.max(1, Math.floor(rightJoker.cost / 2));
        const multBonus = sellPrice * 2;
        return {
          multBonus: multBonus,
          destroyRightJoker: true,
          message: `仪式匕首: 摧毁${rightJoker.name}，永久+${multBonus}倍率`
        };
      }
      // 右侧无小丑，不触发
      return {};
    }
  }),

  // 8 Ball - 1/4概率打出8时生成塔罗牌
  new Joker({
    id: 'eight_ball',
    name: '八号球',
    description: '1/4概率打出8时生成一张塔罗牌',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const eightCount = context.scoredCards.filter(card => card.rank === '8').length;
      if (eightCount > 0) {
        let tarotGenerated = 0;
        for (let i = 0; i < eightCount; i++) {
          if (Math.random() < 0.25) tarotGenerated++;
        }
        if (tarotGenerated > 0) {
          return {
            tarotBonus: tarotGenerated,
            message: `八号球: 生成${tarotGenerated}张塔罗牌`
          };
        }
      }
      return {};
    }
  }),

  // Raised Fist - 手牌中最低牌点数x2加到倍率
  new Joker({
    id: 'raised_fist',
    name: '高举拳头',
    description: '手牌中最低牌点数x2加到倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HELD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const heldCards = (context as unknown as { heldCards?: Card[] }).heldCards;
      if (heldCards && heldCards.length > 0) {
        const rankValues: Record<string, number> = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10 };
        const minValue = Math.min(...heldCards.map(card => rankValues[card.rank] || 10));
        const bonus = minValue * 2;
        return {
          multBonus: bonus,
          message: `高举拳头: 最低牌点数${minValue} x2 +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // Gros Michel - +15倍率，1/6概率回合结束摧毁
  new Joker({
    id: 'gros_michel',
    name: '大麦克',
    description: '+15倍率，1/6概率回合结束摧毁',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_PLAY,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        multBonus: 15,
        message: '大麦克: +15倍率'
      };
    },
    onEndOfRound: (): JokerEffectResult => {
      if (Math.random() < 1/6) {
        return {
          destroySelf: true,
          message: '大麦克: 被摧毁了!'
        };
      }
      return {};
    }
  }),

  // Even Steven - 偶数牌+4倍率
  new Joker({
    id: 'even_steven',
    name: '偶数史蒂文',
    description: '每张打出的偶数牌+4倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const evenRanks = ['2', '4', '6', '8', '10'];
      const evenCount = context.scoredCards.filter(card => evenRanks.includes(card.rank)).length;
      if (evenCount > 0) {
        const bonus = evenCount * 4;
        return {
          multBonus: bonus,
          message: `偶数史蒂文: ${evenCount}张偶数牌 +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // Ride the Bus - 连续不出脸牌每手+1倍率
  new Joker({
    id: 'ride_the_bus',
    name: '巴士之旅',
    description: '连续不出脸牌，每手+1倍率',
    rarity: JokerRarity.COMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { consecutiveHands?: number; noFaceStreak?: number } }).jokerState || {};
      const noFaceStreak = jokerState.noFaceStreak || 0;
      const scoredCards = context.scoredCards || [];
      const hasFaceCard = scoredCards.some(card => card.isFaceCard);
      
      if (!hasFaceCard) {
        const newStreak = noFaceStreak + 1;
        return {
          multBonus: newStreak,
          message: `巴士之旅: 连续${newStreak}手无脸牌 +${newStreak}倍率`,
          stateUpdate: { ...jokerState, noFaceStreak: newStreak }
        };
      } else {
        return {
          multBonus: noFaceStreak,
          message: `巴士之旅: streak中断，+${noFaceStreak}倍率`,
          stateUpdate: { ...jokerState, noFaceStreak: 0 }
        };
      }
    }
  }),

  // Egg - 回合结束售价+$3
  new Joker({
    id: 'egg',
    name: '蛋',
    description: '回合结束售价+$3',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        increaseSellValue: 3,
        message: '蛋: 售价+$3'
      };
    }
  }),

  // Ice Cream - +100筹码，每手-5
  new Joker({
    id: 'ice_cream',
    name: '冰淇淋',
    description: '+100筹码，每出牌一次-5筹码',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { remainingBonus?: number } }).jokerState || {};
      const remainingBonus = jokerState.remainingBonus ?? 100;
      const newBonus = Math.max(0, remainingBonus - 5);
      return {
        chipBonus: remainingBonus,
        message: `冰淇淋: +${remainingBonus}筹码`,
        stateUpdate: { remainingBonus: newBonus }
      };
    }
  }),

  // Blue Joker - 牌库剩余牌x2筹码
  new Joker({
    id: 'blue_joker',
    name: '蓝色小丑',
    description: '牌库剩余牌数量x2筹码',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const deckSize = context.deckSize || 0;
      const bonus = deckSize * 2;
      return {
        chipBonus: bonus,
        message: `蓝色小丑: ${deckSize}张剩余牌 +${bonus}筹码`
      };
    }
  }),

  // Faceless Joker - 弃3+脸牌同时弃时+$5
  new Joker({
    id: 'faceless_joker',
    name: '无面小丑',
    description: '同时弃掉3张或以上脸牌时+$5',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_DISCARD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const discardedCards = (context as unknown as { discardedCards?: Card[] }).discardedCards;
      if (discardedCards) {
        const faceCards = discardedCards.filter(card => card.isFaceCard);
        if (faceCards.length >= 3) {
          return {
            moneyBonus: 5,
            message: `无面小丑: 弃掉${faceCards.length}张脸牌 +$5`
          };
        }
      }
      return {};
    }
  }),

  // Green Joker - 每出牌+1倍率，每弃牌-1
  new Joker({
    id: 'green_joker',
    name: '绿色小丑',
    description: '每出牌一次+1倍率，每弃牌一次-1倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { multBonus?: number } }).jokerState || {};
      const currentBonus = (jokerState.multBonus || 0) + 1;
      return {
        multBonus: currentBonus,
        message: `绿色小丑: 出牌+1，当前+${currentBonus}倍率`,
        stateUpdate: { multBonus: currentBonus }
      };
    },
    onDiscard: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { multBonus?: number } }).jokerState || {};
      const currentBonus = Math.max(0, (jokerState.multBonus || 0) - 1);
      return {
        message: `绿色小丑: 弃牌-1，当前+${currentBonus}倍率`,
        stateUpdate: { multBonus: currentBonus }
      };
    }
  }),

  // Superposition - 含A的顺子生成塔罗牌
  new Joker({
    id: 'superposition',
    name: '叠加态',
    description: '打出的顺子包含A时生成一张塔罗牌',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const straightTypes = [PokerHandType.Straight, PokerHandType.StraightFlush, PokerHandType.RoyalFlush];
      if (context.handType && straightTypes.includes(context.handType)) {
        const hasAce = context.scoredCards?.some(card => card.rank === 'A');
        if (hasAce) {
          return {
            tarotBonus: 1,
            message: '叠加态: 含A的顺子生成1张塔罗牌'
          };
        }
      }
      return {};
    }
  }),

  // To Do List - 特定牌型+$4，每轮换牌型
  new Joker({
    id: 'to_do_list',
    name: '待办清单',
    description: '打出特定牌型+$4，每回合更换目标牌型',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { targetHandType?: PokerHandType } }).jokerState || {};
      const targetHandType = jokerState.targetHandType || PokerHandType.OnePair;
      if (context.handType === targetHandType) {
        return {
          moneyBonus: 4,
          message: `待办清单: 完成${targetHandType} +$4`
        };
      }
      return {};
    }
  }),

  // Red Card - 跳卡包+3倍率
  new Joker({
    id: 'red_card',
    name: '红牌',
    description: '跳过卡包时+3倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const skippedBooster = (context as unknown as { skippedBooster?: boolean }).skippedBooster;
      if (skippedBooster) {
        const jokerState = (context as unknown as { jokerState?: { multBonus?: number } }).jokerState || {};
        const currentBonus = (jokerState.multBonus || 0) + 3;
        return {
          multBonus: currentBonus,
          message: `红牌: 跳过卡包 +3倍率 (共+${currentBonus})`,
          stateUpdate: { multBonus: currentBonus }
        };
      }
      return {};
    }
  }),

  // Square Joker - 正好4张牌+4筹码
  new Joker({
    id: 'square_joker',
    name: '方块小丑',
    description: '正好打出4张牌时+4筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.scoredCards && context.scoredCards.length === 4) {
        return {
          chipBonus: 4,
          message: '方块小丑: 4张牌 +4筹码'
        };
      }
      return {};
    }
  }),

  // Photograph - 第一张脸牌x2倍率
  new Joker({
    id: 'photograph',
    name: '照片',
    description: '打出的第一张脸牌x2倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const firstFaceCard = context.scoredCards.find(card => card.isFaceCard);
      if (firstFaceCard) {
        return {
          multMultiplier: 2,
          message: `照片: 第一张脸牌(${firstFaceCard.rank}) x2倍率`
        };
      }
      return {};
    }
  }),

  // Reserved Parking - 手牌脸牌1/2概率+$1
  new Joker({
    id: 'reserved_parking',
    name: '预留车位',
    description: '手牌中每张脸牌有1/2概率+$1',
    rarity: JokerRarity.COMMON,
    cost: 6,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const heldCards = (context as unknown as { heldCards?: Card[] }).heldCards;
      if (heldCards) {
        const faceCards = heldCards.filter(card => card.isFaceCard);
        let moneyEarned = 0;
        for (const _ of faceCards) {
          if (Math.random() < 0.5) moneyEarned++;
        }
        if (moneyEarned > 0) {
          return {
            moneyBonus: moneyEarned,
            message: `预留车位: ${faceCards.length}张脸牌，${moneyEarned}张触发 +$${moneyEarned}`
          };
        }
      }
      return {};
    }
  }),

  // Mail-In Rebate - 弃特定点数牌+$5
  new Joker({
    id: 'mail_in_rebate',
    name: '邮寄返利',
    description: '弃掉特定点数的牌时+$5',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_DISCARD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { targetRank?: string } }).jokerState || {};
      const targetRank = jokerState.targetRank || '2';
      const discardedCards = (context as unknown as { discardedCards?: Card[] }).discardedCards;
      if (discardedCards) {
        const matchingCards = discardedCards.filter(card => card.rank === targetRank);
        if (matchingCards.length > 0) {
          const money = matchingCards.length * 5;
          return {
            moneyBonus: money,
            message: `邮寄返利: 弃掉${matchingCards.length}张${targetRank} +$${money}`
          };
        }
      }
      return {};
    }
  }),

  // Golden Joker - 回合结束+$4
  new Joker({
    id: 'golden_joker',
    name: '金色小丑',
    description: '回合结束+$4',
    rarity: JokerRarity.COMMON,
    cost: 6,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        moneyBonus: 4,
        message: '金色小丑: +$4'
      };
    }
  }),

  // Popcorn - +20倍率，每轮-4
  new Joker({
    id: 'popcorn',
    name: '爆米花',
    description: '+20倍率，每回合-4倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_PLAY,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { remainingMult?: number } }).jokerState || {};
      const remainingMult = jokerState.remainingMult ?? 20;
      return {
        multBonus: remainingMult,
        message: `爆米花: +${remainingMult}倍率`
      };
    },
    onEndOfRound: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { remainingMult?: number } }).jokerState || {};
      const currentMult = (jokerState.remainingMult ?? 20) - 4;
      if (currentMult <= 0) {
        return {
          destroySelf: true,
          message: '爆米花: 吃完了!'
        };
      }
      return {
        message: `爆米花: 剩余+${currentMult}倍率`,
        stateUpdate: { remainingMult: currentMult }
      };
    }
  }),

  // Smiley Face - 脸牌+5倍率
  new Joker({
    id: 'smiley_face',
    name: '笑脸',
    description: '每张打出的人头牌+5倍率',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const faceCount = context.scoredCards.filter(card => card.isFaceCard).length;
      if (faceCount > 0) {
        const bonus = faceCount * 5;
        return {
          multBonus: bonus,
          message: `笑脸: ${faceCount}张脸牌 +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // Shoot the Moon - 每张Q在手牌+13倍率
  new Joker({
    id: 'shoot_the_moon',
    name: '射月',
    description: '手牌中每张Q+13倍率',
    rarity: JokerRarity.COMMON,
    cost: 5,
    trigger: JokerTrigger.ON_HELD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const heldCards = (context as unknown as { heldCards?: Card[] }).heldCards;
      if (heldCards) {
        const queenCount = heldCards.filter(card => card.rank === 'Q').length;
        if (queenCount > 0) {
          const bonus = queenCount * 13;
          return {
            multBonus: bonus,
            message: `射月: 手牌${queenCount}张Q +${bonus}倍率`
          };
        }
      }
      return {};
    }
  }),

  // ==================== 缺失的Uncommon小丑牌 ====================

  // Joker Stencil - 每空槽位x1倍率
  new Joker({
    id: 'joker_stencil',
    name: '小丑模板',
    description: '每有一个空的小丑牌槽位x1倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const emptySlots = (context as unknown as { emptySlots?: number }).emptySlots || 0;
      if (emptySlots > 0) {
        const multiplier = 1 + emptySlots;
        return {
          multMultiplier: multiplier,
          message: `小丑模板: ${emptySlots}个空槽位 x${multiplier}倍率`
        };
      }
      return {};
    }
  }),

  // Mime - 手牌中牌能力触发2次
  new Joker({
    id: 'mime',
    name: '默剧演员',
    description: '手牌中牌的能力触发2次',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        heldCardRetrigger: true,
        message: '默剧演员: 手牌能力触发2次'
      };
    }
  }),

  // Credit Card - 可欠-$20
  new Joker({
    id: 'credit_card',
    name: '信用卡',
    description: '可以欠债最多-$20',
    rarity: JokerRarity.UNCOMMON,
    cost: 1,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        debtLimit: -20,
        message: '信用卡: 可欠债-$20'
      };
    }
  }),

  // Marble Joker - 选盲注时加石头牌到牌库
  new Joker({
    id: 'marble_joker',
    name: '大理石小丑',
    description: '选盲注时添加一张石头牌到牌库',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_BLIND_SELECT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        addStoneCard: true,
        message: '大理石小丑: 添加石头牌到牌库'
      };
    }
  }),

  // Pareidolia - 所有牌视为脸牌
  new Joker({
    id: 'pareidolia',
    name: '幻想性错觉',
    description: '所有牌都视为人头牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        allCardsAreFace: true,
        message: '幻想性错觉: 所有牌视为人头牌'
      };
    }
  }),

  // Burglar - 选盲注时+3出牌，弃牌归零
  new Joker({
    id: 'burglar',
    name: '窃贼',
    description: '选盲注时+3次出牌次数，弃牌次数归零',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_BLIND_SELECT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        handBonus: 3,
        discardReset: true,
        message: '窃贼: +3出牌，弃牌归零'
      };
    }
  }),

  // Blackboard - 手牌全黑桃/梅花时x3倍率
  new Joker({
    id: 'blackboard',
    name: '黑板',
    description: '手牌全为黑桃或梅花时x3倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const heldCards = context.heldCards;
      if (heldCards && heldCards.length > 0) {
        const allBlack = heldCards.every(card => card.suit === Suit.Spades || card.suit === Suit.Clubs);
        if (allBlack) {
          return {
            multMultiplier: 3,
            message: '黑板: 全黑手牌 x3倍率'
          };
        }
      }
      return {};
    }
  }),

  // Sixth Sense - 第一手单6摧毁并生成幻灵牌
  new Joker({
    id: 'sixth_sense',
    name: '第六感',
    description: '第一手只出一张6时摧毁它并生成一张幻灵牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const handsPlayed = (context as unknown as { handsPlayed?: number }).handsPlayed || 0;
      if (handsPlayed === 0 && context.scoredCards?.length === 1 && context.scoredCards[0].rank === '6') {
        return {
          destroyScoredCards: true,
          spectralBonus: 1,
          message: '第六感: 摧毁6并生成幻灵牌'
        };
      }
      return {};
    }
  }),

  // Cavendish - x3倍率，1/1000摧毁
  new Joker({
    id: 'cavendish',
    name: '卡文迪什',
    description: 'x3倍率，1/1000概率回合结束摧毁',
    rarity: JokerRarity.UNCOMMON,
    cost: 4,
    trigger: JokerTrigger.ON_PLAY,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        multMultiplier: 3,
        message: '卡文迪什: x3倍率'
      };
    },
    onEndOfRound: (): JokerEffectResult => {
      if (Math.random() < 0.001) {
        return {
          destroySelf: true,
          message: '卡文迪什: 枯萎了!'
        };
      }
      return {};
    }
  }),

  // Card Sharp - 重复出牌型x3倍率
  new Joker({
    id: 'card_sharp',
    name: '老千',
    description: '重复打出相同牌型时x3倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { lastHandType?: PokerHandType } }).jokerState || {};
      const lastHandType = jokerState.lastHandType;
      if (lastHandType && context.handType === lastHandType) {
        return {
          multMultiplier: 3,
          message: `老千: 重复${context.handType} x3倍率`,
          stateUpdate: { lastHandType: context.handType }
        };
      }
      return {
        stateUpdate: { lastHandType: context.handType }
      };
    }
  }),

  // Madness - 选小/大盲注时x0.5倍率并摧毁随机小丑
  new Joker({
    id: 'madness',
    name: '疯狂',
    description: '选小盲注或大盲注时x0.5倍率并摧毁随机小丑',
    rarity: JokerRarity.UNCOMMON,
    cost: 7,
    trigger: JokerTrigger.ON_BLIND_SELECT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const blindType = (context as unknown as { blindType?: string }).blindType;
      // 支持多种盲注类型格式
      if (blindType && (blindType.toLowerCase().includes('small') || 
                        blindType.toLowerCase().includes('big') ||
                        blindType === 'SMALL_BLIND' || 
                        blindType === 'BIG_BLIND')) {
        // 从 jokerSlots 检查小丑牌数量，只有一张时不触发
        const jokerSlots = (context as unknown as { jokerSlots?: { getJokerCount: () => number } }).jokerSlots;
        if (jokerSlots && jokerSlots.getJokerCount() <= 1) {
          return {};
        }
        return {
          multMultiplier: 1.5,
          destroyRandomJoker: true,
          message: '疯狂: x1.5倍率并摧毁随机小丑'
        };
      }
      return {};
    }
  }),

  // Seance - 同花顺生成幻灵牌
  new Joker({
    id: 'seance',
    name: '降神会',
    description: '打出同花顺时生成一张幻灵牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.StraightFlush || context.handType === PokerHandType.RoyalFlush) {
        return {
          spectralBonus: 1,
          message: '降神会: 同花顺生成幻灵牌'
        };
      }
      return {};
    }
  }),

  // Riff-Raff - 选盲注时生成2张普通小丑
  new Joker({
    id: 'riff_raff',
    name: '乌合之众',
    description: '选盲注时生成2张普通小丑',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_BLIND_SELECT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      // 从 jokerSlots 检查是否有足够空间
      const jokerSlots = (context as unknown as { jokerSlots?: { getAvailableSlots: () => number } }).jokerSlots;
      if (jokerSlots && jokerSlots.getAvailableSlots() < 2) {
        return {};
      }
      return {
        jokerBonus: 2,
        message: '乌合之众: 生成2张普通小丑'
      };
    }
  }),

  // Vampire - 每张强化计分牌x0.1倍率，移除强化
  new Joker({
    id: 'vampire',
    name: '吸血鬼',
    description: '每张强化的计分牌x0.1倍率并移除强化',
    rarity: JokerRarity.UNCOMMON,
    cost: 7,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const enhancedCards = context.scoredCards.filter(card => card.enhancement !== undefined);
      if (enhancedCards.length > 0) {
        const multiplier = 1 + (enhancedCards.length * 0.1);
        return {
          multMultiplier: multiplier,
          removeEnhancements: true,
          message: `吸血鬼: ${enhancedCards.length}张强化牌 x${multiplier.toFixed(1)}倍率并移除强化`
        };
      }
      return {};
    }
  }),

  // Hologram - 每加一张牌到牌库x0.25倍率
  new Joker({
    id: 'hologram',
    name: '全息影像',
    description: '每添加一张牌到牌库x0.25倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 7,
    trigger: JokerTrigger.ON_PLAY,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { cardsAdded?: number } }).jokerState || {};
      const cardsAdded = jokerState.cardsAdded || 0;
      if (cardsAdded > 0) {
        const multiplier = 1 + (cardsAdded * 0.25);
        return {
          multMultiplier: multiplier,
          message: `全息影像: ${cardsAdded}张牌加入牌库 x${multiplier.toFixed(2)}倍率`
        };
      }
      return {};
    }
  }),

  // Vagabond - ≤$4时出牌生成塔罗牌
  new Joker({
    id: 'vagabond',
    name: '流浪者',
    description: '资金≤$4时出牌生成一张塔罗牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const money = context.gameState?.money || 0;
      if (money <= 4) {
        return {
          tarotBonus: 1,
          message: '流浪者: 资金≤$4生成塔罗牌'
        };
      }
      return {};
    }
  }),

  // Cloud 9 - 牌库中9的数量回合结束+$1
  new Joker({
    id: 'cloud_9',
    name: '九霄云外',
    description: '牌库中每张9回合结束+$1',
    rarity: JokerRarity.UNCOMMON,
    cost: 7,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const ninesInDeck = (context as unknown as { ninesInDeck?: number }).ninesInDeck || 0;
      if (ninesInDeck > 0) {
        return {
          moneyBonus: ninesInDeck,
          message: `九霄云外: ${ninesInDeck}张9 +$${ninesInDeck}`
        };
      }
      return {};
    }
  }),

  // Rocket - 回合结束+$1，击败Boss+$2
  new Joker({
    id: 'rocket',
    name: '火箭',
    description: '回合结束+$1，击败Boss盲注+$2',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const defeatedBoss = context.defeatedBoss;
      const bonus = defeatedBoss ? 3 : 1;
      return {
        moneyBonus: bonus,
        message: `火箭: ${defeatedBoss ? '击败Boss ' : ''}+$${bonus}`
      };
    }
  }),

  // Obelisk - 不出最常出牌型连续x0.2倍率
  new Joker({
    id: 'obelisk',
    name: '方尖碑',
    description: '连续不打最常出的牌型，每手x0.2倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 8,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { mostPlayedHand?: PokerHandType; streak?: number } }).jokerState || {};
      const mostPlayedHand = jokerState.mostPlayedHand;
      const currentStreak = jokerState.streak || 0;
      
      if (mostPlayedHand && context.handType !== mostPlayedHand) {
        const newStreak = currentStreak + 1;
        const multiplier = 1 + (newStreak * 0.2);
        return {
          multMultiplier: multiplier,
          message: `方尖碑: 连续${newStreak}手不打${mostPlayedHand} x${multiplier.toFixed(1)}倍率`,
          stateUpdate: { ...jokerState, streak: newStreak }
        };
      } else if (context.handType === mostPlayedHand) {
        return {
          stateUpdate: { ...jokerState, streak: 0 }
        };
      }
      return {};
    }
  }),

  // Midas Mask - 脸牌变金牌
  new Joker({
    id: 'midas_mask',
    name: '迈达斯面具',
    description: '打出的人头牌变成金牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 7,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const faceCards = context.scoredCards.filter(card => card.isFaceCard);
      if (faceCards.length > 0) {
        return {
          turnToGold: faceCards.length,
          message: `迈达斯面具: ${faceCards.length}张脸牌变成金牌`
        };
      }
      return {};
    }
  }),

  // Luchador - 出售禁用当前Boss
  new Joker({
    id: 'luchador',
    name: '摔跤手',
    description: '出售时禁用当前Boss盲注的能力',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        disableBossOnSell: true,
        message: '摔跤手: 出售禁用Boss'
      };
    }
  }),

  // Turtle Bean - +5手牌上限，每轮-1
  new Joker({
    id: 'turtle_bean',
    name: '龟豆',
    description: '+5手牌上限，每回合-1',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { handSizeBonus?: number } }).jokerState || {};
      const currentBonus = jokerState.handSizeBonus ?? 5;
      return {
        handSizeBonus: currentBonus,
        message: `龟豆: +${currentBonus}手牌上限`
      };
    },
    onEndOfRound: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { handSizeBonus?: number } }).jokerState || {};
      const currentBonus = (jokerState.handSizeBonus ?? 5) - 1;
      if (currentBonus <= 0) {
        return {
          destroySelf: true,
          message: '龟豆: 吃完了!'
        };
      }
      return {
        handSizeBonus: currentBonus,
        message: `龟豆: 剩余+${currentBonus}手牌上限`,
        stateUpdate: { handSizeBonus: currentBonus }
      };
    }
  }),

  // Erosion - 牌库少于初始时每张+4倍率
  new Joker({
    id: 'erosion',
    name: '侵蚀',
    description: '牌库少于初始数量时，每少一张+4倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const deckSize = (context as unknown as { deckSize?: number }).deckSize || 52;
      const initialDeckSize = (context as unknown as { initialDeckSize?: number }).initialDeckSize || 52;
      const cardsMissing = initialDeckSize - deckSize;
      if (cardsMissing > 0) {
        const bonus = cardsMissing * 4;
        return {
          multBonus: bonus,
          message: `侵蚀: 缺少${cardsMissing}张牌 +${bonus}倍率`
        };
      }
      return {};
    }
  }),

  // To the Moon - 每$5利息+$1
  new Joker({
    id: 'to_the_moon',
    name: '登月',
    description: '每$5利息上限+$1利息',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.END_OF_ROUND,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const interestCap = context.gameState?.interestCap || 20;
      const extraInterest = Math.floor(interestCap / 5);
      if (extraInterest > 0) {
        return {
          moneyBonus: extraInterest,
          message: `登月: $${interestCap}利息上限 +$${extraInterest}`
        };
      }
      return {};
    }
  }),

  // Hallucination - 开卡包1/2概率生成塔罗牌
  new Joker({
    id: 'hallucination',
    name: '幻觉',
    description: '开启卡包时有1/2概率生成一张塔罗牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 4,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const openedBooster = (context as unknown as { openedBooster?: boolean }).openedBooster;
      if (openedBooster && Math.random() < 0.5) {
        return {
          tarotBonus: 1,
          message: '幻觉: 生成塔罗牌'
        };
      }
      return {};
    }
  }),

  // Lucky Cat - 幸运牌触发时x0.25倍率
  new Joker({
    id: 'lucky_cat',
    name: '招财猫',
    description: '幸运牌触发效果时x0.25倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const luckyCards = context.scoredCards.filter(card => card.enhancement === CardEnhancement.Lucky);
      if (luckyCards.length > 0) {
        const jokerState = (context as unknown as { jokerState?: { triggeredCount?: number } }).jokerState || {};
        const triggeredCount = (jokerState.triggeredCount || 0) + luckyCards.length;
        const multiplier = 1 + (triggeredCount * 0.25);
        return {
          multMultiplier: multiplier,
          message: `招财猫: ${triggeredCount}次幸运触发 x${multiplier.toFixed(2)}倍率`,
          stateUpdate: { triggeredCount }
        };
      }
      return {};
    }
  }),

  // Flash Card - 每次刷新商店+2倍率
  new Joker({
    id: 'flash_card',
    name: '闪卡',
    description: '每次刷新商店+2倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_REROLL,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = context.jokerState as { multBonus?: number } | undefined;
      const currentBonus = (jokerState?.multBonus || 0) + 2;
      return {
        multBonus: currentBonus,
        message: `闪卡: 刷新商店 +2倍率 (共+${currentBonus})`,
        stateUpdate: { multBonus: currentBonus }
      };
    }
  }),

  // Spare Trousers - 两对+2倍率
  new Joker({
    id: 'spare_trousers',
    name: '备用裤子',
    description: '打出两对时+2倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.TwoPair) {
        const jokerState = (context as unknown as { jokerState?: { multBonus?: number } }).jokerState || {};
        const currentBonus = (jokerState.multBonus || 0) + 2;
        return {
          multBonus: currentBonus,
          message: `备用裤子: 两对 +2倍率 (共+${currentBonus})`,
          stateUpdate: { multBonus: currentBonus }
        };
      }
      return {};
    }
  }),

  // Ramen - x2倍率，每弃牌-0.01
  new Joker({
    id: 'ramen',
    name: '拉面',
    description: 'x2倍率，每次弃牌-0.01倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_PLAY,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { multiplier?: number } }).jokerState || {};
      const currentMult = jokerState.multiplier ?? 2;
      return {
        multMultiplier: currentMult,
        message: `拉面: x${currentMult.toFixed(2)}倍率`
      };
    },
    onDiscard: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { multiplier?: number } }).jokerState || {};
      const currentMult = (jokerState.multiplier ?? 2) - 0.01;
      return {
        message: `拉面: 弃牌后 x${currentMult.toFixed(2)}倍率`,
        stateUpdate: { multiplier: currentMult }
      };
    }
  }),

  // Seltzer - 接下来10手触发所有牌2次
  new Joker({
    id: 'seltzer',
    name: '苏打水',
    description: '接下来10手牌触发所有打出牌2次',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { handsRemaining?: number } }).jokerState || {};
      const handsRemaining = (jokerState.handsRemaining ?? 10) - 1;
      if (handsRemaining >= 0) {
        return {
          retriggerCards: true,
          message: `苏打水: 剩余${handsRemaining}手触发2次`,
          stateUpdate: { handsRemaining }
        };
      }
      return {};
    }
  }),

  // Castle - 弃特定花色+3筹码，每轮换
  new Joker({
    id: 'castle',
    name: '城堡',
    description: '弃掉特定花色的牌+3筹码，每回合更换目标花色',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_DISCARD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { targetSuit?: Suit } }).jokerState || {};
      const targetSuit = jokerState.targetSuit || Suit.Hearts;
      const discardedCards = (context as unknown as { discardedCards?: Card[] }).discardedCards;
      if (discardedCards) {
        const matchingCards = discardedCards.filter(card => card.suit === targetSuit);
        if (matchingCards.length > 0) {
          const bonus = matchingCards.length * 3;
          return {
            chipBonus: bonus,
            message: `城堡: 弃掉${matchingCards.length}张${targetSuit} +${bonus}筹码`
          };
        }
      }
      return {};
    }
  }),

  // Mr. Bones - 分数≥25%目标时防止死亡
  new Joker({
    id: 'mr_bones',
    name: '骨头先生',
    description: '得分≥25%目标分数时防止死亡',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        preventDeathAt25: true,
        message: '骨头先生: ≥25%分数防止死亡'
      };
    }
  }),

  // Acrobat - 最后一手x3倍率
  new Joker({
    id: 'acrobat',
    name: '杂技演员',
    description: '最后一手牌x3倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const handsRemaining = context.handsRemaining ?? 1;
      if (handsRemaining === 1) {
        return {
          multMultiplier: 3,
          message: '杂技演员: 最后一手 x3倍率'
        };
      }
      return {};
    }
  }),

  // Certificate - 回合开始加带印章的随机牌
  new Joker({
    id: 'certificate',
    name: '证书',
    description: '回合开始时添加一张带印章的随机牌到手牌',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        addSealedCard: true,
        message: '证书: 添加带印章的牌'
      };
    }
  }),

  // Showman - 小丑/塔罗/行星/幻灵可重复
  new Joker({
    id: 'showman',
    name: '马戏团演员',
    description: '小丑牌、塔罗牌、行星牌和幻灵牌可以重复出现',
    rarity: JokerRarity.UNCOMMON,
    cost: 5,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        allowDuplicates: true,
        message: '马戏团演员: 允许重复卡片'
      };
    }
  }),

  // Merry Andy - +3弃牌，-1手牌
  new Joker({
    id: 'merry_andy',
    name: '快乐的安迪',
    description: '+3弃牌次数，-1手牌上限',
    rarity: JokerRarity.UNCOMMON,
    cost: 7,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      return {
        discardsBonus: 3,
        handSizeBonus: -1,
        message: '快乐的安迪: +3弃牌，-1手牌'
      };
    }
  }),

  // Seeing Double - 含梅花和其他花色x2倍率
  new Joker({
    id: 'seeing_double',
    name: '重影',
    description: '打出的牌包含梅花和其他花色时x2倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.scoredCards && context.scoredCards.length >= 2) {
        const hasClub = context.scoredCards.some(card => card.suit === Suit.Clubs);
        const hasOtherSuit = context.scoredCards.some(card => card.suit !== Suit.Clubs);
        if (hasClub && hasOtherSuit) {
          return {
            multMultiplier: 2,
            message: '重影: 梅花+其他花色 x2倍率'
          };
        }
      }
      return {};
    }
  }),

  // Matador - 触发Boss能力时+$8
  new Joker({
    id: 'matador',
    name: '斗牛士',
    description: '触发Boss盲注能力时+$8',
    rarity: JokerRarity.UNCOMMON,
    cost: 7,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const bossTriggered = (context as unknown as { bossTriggered?: boolean }).bossTriggered;
      if (bossTriggered) {
        return {
          moneyBonus: 8,
          message: '斗牛士: 触发Boss能力 +$8'
        };
      }
      return {};
    }
  }),

  // Hit the Road - 每弃J+x0.5倍率
  new Joker({
    id: 'hit_the_road',
    name: '上路',
    description: '每弃掉一张J，本回合x0.5倍率',
    rarity: JokerRarity.UNCOMMON,
    cost: 8,
    trigger: JokerTrigger.ON_DISCARD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const discardedCards = (context as unknown as { discardedCards?: Card[] }).discardedCards;
      if (discardedCards) {
        const jacksDiscarded = discardedCards.filter(card => card.rank === 'J').length;
        if (jacksDiscarded > 0) {
          const jokerState = (context as unknown as { jokerState?: { multiplierBonus?: number } }).jokerState || {};
          const currentBonus = (jokerState.multiplierBonus || 0) + (jacksDiscarded * 0.5);
          return {
            multMultiplier: 1 + currentBonus,
            message: `上路: 弃掉${jacksDiscarded}张J x${(1 + currentBonus).toFixed(1)}倍率`,
            stateUpdate: { multiplierBonus: currentBonus }
          };
        }
      }
      return {};
    }
  }),

  // Burnt Joker - 第一手弃牌升级牌型
  new Joker({
    id: 'burnt_joker',
    name: '烧焦的小丑',
    description: '第一手弃牌时升级该手牌对应的牌型',
    rarity: JokerRarity.UNCOMMON,
    cost: 8,
    trigger: JokerTrigger.ON_DISCARD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const handsPlayed = (context as unknown as { handsPlayed?: number }).handsPlayed || 0;
      if (handsPlayed === 0) {
        return {
          upgradeHandType: true,
          message: '烧焦的小丑: 第一手弃牌升级牌型'
        };
      }
      return {};
    }
  }),

  // Trading Card - 第一手弃1张牌时摧毁并获得$3
  new Joker({
    id: 'trading_card',
    name: '交易卡',
    description: '第一手弃掉1张牌时摧毁该牌并获得$3',
    rarity: JokerRarity.UNCOMMON,
    cost: 6,
    trigger: JokerTrigger.ON_DISCARD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const handsPlayed = (context as unknown as { handsPlayed?: number }).handsPlayed || 0;
      const discardedCards = (context as unknown as { discardedCards?: Card[] }).discardedCards || [];
      // 第一手且只弃1张牌
      if (handsPlayed === 0 && discardedCards.length === 1) {
        return {
          moneyBonus: 3,
          destroyDiscardedCard: true,
          message: '交易卡: 摧毁弃牌 +$3'
        };
      }
      return {};
    }
  }),

  // ==================== 缺失的Rare小丑牌 ====================

  // Walkie Talkie - 每张10或4+10筹码+4倍率
  new Joker({
    id: 'walkie_talkie',
    name: '对讲机',
    description: '每张打出的10或4+10筹码和+4倍率',
    rarity: JokerRarity.RARE,
    cost: 4,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const targetRanks = ['4', '10'];
      const matchingCards = context.scoredCards.filter(card => targetRanks.includes(card.rank));
      if (matchingCards.length > 0) {
        const chipBonus = matchingCards.length * 10;
        const multBonus = matchingCards.length * 4;
        return {
          chipBonus,
          multBonus,
          message: `对讲机: ${matchingCards.length}张4/10 +${chipBonus}筹码 +${multBonus}倍率`
        };
      }
      return {};
    }
  }),

  // Campfire - 每卖一张牌x0.25倍率，Boss后重置
  new Joker({
    id: 'campfire',
    name: '篝火',
    description: '每卖出一张牌x0.25倍率，击败Boss后重置',
    rarity: JokerRarity.RARE,
    cost: 9,
    trigger: JokerTrigger.ON_PLAY,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { cardsSold?: number } }).jokerState || {};
      const cardsSold = jokerState.cardsSold || 0;
      if (cardsSold > 0) {
        const multiplier = 1 + (cardsSold * 0.25);
        return {
          multMultiplier: multiplier,
          message: `篝火: 卖出${cardsSold}张牌 x${multiplier.toFixed(2)}倍率`
        };
      }
      return {};
    }
  }),

  // Wee Joker - 每张2+8筹码
  new Joker({
    id: 'wee_joker',
    name: '微小丑',
    description: '每张打出的2+8筹码',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const twosCount = context.scoredCards.filter(card => card.rank === '2').length;
      if (twosCount > 0) {
        const bonus = twosCount * 8;
        return {
          chipBonus: bonus,
          message: `微小丑: ${twosCount}张2 +${bonus}筹码`
        };
      }
      return {};
    }
  }),

  // The Idol - 特定牌x2倍率，每轮换
  new Joker({
    id: 'the_idol',
    name: '偶像',
    description: '特定牌x2倍率，每回合更换目标牌',
    rarity: JokerRarity.RARE,
    cost: 6,
    trigger: JokerTrigger.ON_SCORED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (!context.scoredCards) return {};
      const jokerState = (context as unknown as { jokerState?: { targetRank?: string; targetSuit?: Suit } }).jokerState || {};
      const targetRank = jokerState.targetRank || 'A';
      const targetSuit = jokerState.targetSuit || Suit.Spades;
      const matchingCards = context.scoredCards.filter(
        card => card.rank === targetRank && card.suit === targetSuit
      );
      if (matchingCards.length > 0) {
        return {
          multMultiplier: 2,
          message: `偶像: ${targetRank}${targetSuit} x2倍率`
        };
      }
      return {};
    }
  }),

  // Invisible Joker - 2轮后出售复制随机小丑
  new Joker({
    id: 'invisible_joker',
    name: '隐形小丑',
    description: '2回合后出售时复制一张随机小丑',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { roundsHeld?: number } }).jokerState || {};
      const roundsHeld = jokerState.roundsHeld || 0;
      return {
        message: `隐形小丑: 已持有${roundsHeld}回合`
      };
    },
    onEndOfRound: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { roundsHeld?: number } }).jokerState || {};
      const roundsHeld = (jokerState.roundsHeld || 0) + 1;
      return {
        message: `隐形小丑: ${roundsHeld}回合后可复制`,
        stateUpdate: { roundsHeld }
      };
    }
  }),

  // ==================== 缺失的Legendary小丑牌 ====================

  // Canio - 摧毁脸牌时x1倍率
  new Joker({
    id: 'canio',
    name: '卡尼奥',
    description: '摧毁一张人头牌时永久x1倍率',
    rarity: JokerRarity.LEGENDARY,
    cost: 20,
    trigger: JokerTrigger.ON_INDEPENDENT,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const jokerState = (context as unknown as { jokerState?: { destroyedFaceCards?: number } }).jokerState || {};
      const destroyedFaceCards = jokerState.destroyedFaceCards || 0;
      if (destroyedFaceCards > 0) {
        const multiplier = 1 + destroyedFaceCards;
        return {
          multMultiplier: multiplier,
          message: `卡尼奥: 摧毁${destroyedFaceCards}张脸牌 x${multiplier}倍率`
        };
      }
      return {};
    }
  }),

  // ==================== 补充缺失的小丑牌 ====================

  // Clever Joker - 两对时+80筹码
  new Joker({
    id: 'clever_joker',
    name: '聪明小丑',
    description: '打出两对时+80筹码',
    rarity: JokerRarity.COMMON,
    cost: 4,
    trigger: JokerTrigger.ON_HAND_PLAYED,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      if (context.handType === PokerHandType.TwoPair) {
        return {
          chipBonus: 80,
          message: '聪明小丑: +80筹码'
        };
      }
      return {};
    }
  }),

  // Baron - 每张K在手牌x1.5倍率
  new Joker({
    id: 'baron',
    name: '男爵',
    description: '手牌中每张K给予x1.5倍率',
    rarity: JokerRarity.RARE,
    cost: 8,
    trigger: JokerTrigger.ON_HELD,
    effect: (context: JokerEffectContext): JokerEffectResult => {
      const heldCards = (context as unknown as { heldCards?: Card[] }).heldCards;
      if (heldCards) {
        const kingCount = heldCards.filter(card => card.rank === 'K').length;
        if (kingCount > 0) {
          const multiplier = Math.pow(1.5, kingCount);
          return {
            multMultiplier: multiplier,
            message: `男爵: 手牌${kingCount}张K x${multiplier.toFixed(2)}倍率`
          };
        }
      }
      return {};
    }
  }),

];

export function getJokerById(id: string): Joker | undefined {
  const found = JOKERS.find(joker => joker.id === id);
  return found ? (found.clone() as Joker) : undefined;
}

export function getJokersByRarity(rarity: JokerRarity): Joker[] {
  return JOKERS.filter(joker => joker.rarity === rarity).map(j => j.clone() as Joker);
}

export function getRandomJokers(count: number): Joker[] {
  const shuffled = [...JOKERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(j => j.clone() as Joker);
}

export function getRandomJoker(): Joker {
  const randomIndex = Math.floor(Math.random() * JOKERS.length);
  return JOKERS[randomIndex].clone() as Joker;
}
