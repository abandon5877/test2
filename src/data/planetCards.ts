import { PokerHandType } from '../types/pokerHands';

export interface PlanetCard {
  id: string;
  name: string;
  handType: PokerHandType;
  chipBonus: number;
  multBonus: number;
  description: string;
}

// 星球卡数据 - 对应每种牌型的升级
export const PLANET_CARDS: Record<PokerHandType, PlanetCard> = {
  [PokerHandType.HighCard]: {
    id: 'pluto',
    name: '冥王星',
    handType: PokerHandType.HighCard,
    chipBonus: 10,
    multBonus: 1,
    description: '升级高牌'
  },
  [PokerHandType.OnePair]: {
    id: 'mercury',
    name: '水星',
    handType: PokerHandType.OnePair,
    chipBonus: 15,
    multBonus: 1,
    description: '升级对子'
  },
  [PokerHandType.TwoPair]: {
    id: 'uranus',
    name: '天王星',
    handType: PokerHandType.TwoPair,
    chipBonus: 20,
    multBonus: 1,
    description: '升级两对'
  },
  [PokerHandType.ThreeOfAKind]: {
    id: 'venus',
    name: '金星',
    handType: PokerHandType.ThreeOfAKind,
    chipBonus: 20,
    multBonus: 2,
    description: '升级三条'
  },
  [PokerHandType.Straight]: {
    id: 'saturn',
    name: '土星',
    handType: PokerHandType.Straight,
    chipBonus: 30,
    multBonus: 3,
    description: '升级顺子'
  },
  [PokerHandType.Flush]: {
    id: 'jupiter',
    name: '木星',
    handType: PokerHandType.Flush,
    chipBonus: 15,
    multBonus: 2,
    description: '升级同花'
  },
  [PokerHandType.FullHouse]: {
    id: 'earth',
    name: '地球',
    handType: PokerHandType.FullHouse,
    chipBonus: 25,
    multBonus: 2,
    description: '升级葫芦'
  },
  [PokerHandType.FourOfAKind]: {
    id: 'mars',
    name: '火星',
    handType: PokerHandType.FourOfAKind,
    chipBonus: 30,
    multBonus: 3,
    description: '升级四条'
  },
  [PokerHandType.StraightFlush]: {
    id: 'neptune',
    name: '海王星',
    handType: PokerHandType.StraightFlush,
    chipBonus: 40,
    multBonus: 4,
    description: '升级同花顺'
  },
  [PokerHandType.RoyalFlush]: {
    id: 'neptune',
    name: '海王星',
    handType: PokerHandType.RoyalFlush,
    chipBonus: 40,
    multBonus: 4,
    description: '升级皇家同花顺'
  },
  [PokerHandType.FiveOfAKind]: {
    id: 'planet_x',
    name: '星球X',
    handType: PokerHandType.FiveOfAKind,
    chipBonus: 35,
    multBonus: 3,
    description: '升级五条'
  },
  [PokerHandType.FlushHouse]: {
    id: 'ceres',
    name: '谷神星',
    handType: PokerHandType.FlushHouse,
    chipBonus: 40,
    multBonus: 4,
    description: '升级同花葫芦'
  },
  [PokerHandType.FlushFive]: {
    id: 'eris',
    name: '厄里斯',
    handType: PokerHandType.FlushFive,
    chipBonus: 50,
    multBonus: 3,
    description: '升级同花五条'
  }
};

// 获取星球卡升级数值
export function getPlanetCardBonus(handType: PokerHandType): { chipBonus: number; multBonus: number } {
  const planet = PLANET_CARDS[handType];
  return {
    chipBonus: planet?.chipBonus || 0,
    multBonus: planet?.multBonus || 0
  };
}
