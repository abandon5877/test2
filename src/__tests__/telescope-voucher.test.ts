import { describe, it, expect } from 'vitest';
import { PokerHandType } from '../types/pokerHands';
import { getPlanetConsumableByHandType } from '../data/consumables/planets';

describe('望远镜优惠券效果测试', () => {
  it('不同牌型应该对应不同的星球牌', () => {
    const testCases = [
      { handType: PokerHandType.HighCard, planetId: 'planet_pluto', name: '冥王星' },
      { handType: PokerHandType.OnePair, planetId: 'planet_mercury', name: '水星' },
      { handType: PokerHandType.TwoPair, planetId: 'planet_uranus', name: '天王星' },
      { handType: PokerHandType.ThreeOfAKind, planetId: 'planet_venus', name: '金星' },
      { handType: PokerHandType.Straight, planetId: 'planet_saturn', name: '土星' },
      { handType: PokerHandType.Flush, planetId: 'planet_jupiter', name: '木星' },
      { handType: PokerHandType.FullHouse, planetId: 'planet_earth', name: '地球' },
      { handType: PokerHandType.FourOfAKind, planetId: 'planet_mars', name: '火星' },
      { handType: PokerHandType.StraightFlush, planetId: 'planet_neptune', name: '海王星' },
    ];

    for (const { handType, planetId, name } of testCases) {
      const planet = getPlanetConsumableByHandType(handType);
      expect(planet).toBeDefined();
      expect(planet?.id).toBe(planetId);
      expect(planet?.name).toBe(name);
    }
  });
});
