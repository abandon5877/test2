import { describe, it, expect } from 'vitest';
import { PLANET_CARDS, getPlanetCardBonus, PlanetCard } from '../data/planetCards';
import { PokerHandType } from '../types/pokerHands';

describe('Planet Cards', () => {
  describe('基础结构测试', () => {
    it('应该包含所有13种牌型', () => {
      const allHandTypes = Object.values(PokerHandType);
      const planetCardKeys = Object.keys(PLANET_CARDS);

      expect(planetCardKeys.length).toBe(allHandTypes.length);

      for (const handType of allHandTypes) {
        expect(PLANET_CARDS[handType]).toBeDefined();
      }
    });

    it('每个星球牌都应该有正确的字段', () => {
      for (const [handType, planet] of Object.entries(PLANET_CARDS)) {
        expect(planet).toHaveProperty('id');
        expect(planet).toHaveProperty('name');
        expect(planet).toHaveProperty('handType');
        expect(planet).toHaveProperty('chipBonus');
        expect(planet).toHaveProperty('multBonus');
        expect(planet).toHaveProperty('description');

        expect(typeof planet.id).toBe('string');
        expect(typeof planet.name).toBe('string');
        expect(planet.handType).toBe(handType);
        expect(typeof planet.chipBonus).toBe('number');
        expect(typeof planet.multBonus).toBe('number');
        expect(typeof planet.description).toBe('string');
      }
    });
  });

  describe('数值正确性测试', () => {
    it('冥王星(Pluto) - 高牌: chipBonus=10, multBonus=1', () => {
      const planet = PLANET_CARDS[PokerHandType.HighCard];
      expect(planet.id).toBe('pluto');
      expect(planet.name).toBe('冥王星');
      expect(planet.chipBonus).toBe(10);
      expect(planet.multBonus).toBe(1);
    });

    it('水星(Mercury) - 一对: chipBonus=15, multBonus=1', () => {
      const planet = PLANET_CARDS[PokerHandType.OnePair];
      expect(planet.id).toBe('mercury');
      expect(planet.name).toBe('水星');
      expect(planet.chipBonus).toBe(15);
      expect(planet.multBonus).toBe(1);
    });

    it('天王星(Uranus) - 两对: chipBonus=20, multBonus=1', () => {
      const planet = PLANET_CARDS[PokerHandType.TwoPair];
      expect(planet.id).toBe('uranus');
      expect(planet.name).toBe('天王星');
      expect(planet.chipBonus).toBe(20);
      expect(planet.multBonus).toBe(1);
    });

    it('金星(Venus) - 三条: chipBonus=20, multBonus=2', () => {
      const planet = PLANET_CARDS[PokerHandType.ThreeOfAKind];
      expect(planet.id).toBe('venus');
      expect(planet.name).toBe('金星');
      expect(planet.chipBonus).toBe(20);
      expect(planet.multBonus).toBe(2);
    });

    it('土星(Saturn) - 顺子: chipBonus=30, multBonus=3', () => {
      const planet = PLANET_CARDS[PokerHandType.Straight];
      expect(planet.id).toBe('saturn');
      expect(planet.name).toBe('土星');
      expect(planet.chipBonus).toBe(30);
      expect(planet.multBonus).toBe(3);
    });

    it('木星(Jupiter) - 同花: chipBonus=15, multBonus=2', () => {
      const planet = PLANET_CARDS[PokerHandType.Flush];
      expect(planet.id).toBe('jupiter');
      expect(planet.name).toBe('木星');
      expect(planet.chipBonus).toBe(15);
      expect(planet.multBonus).toBe(2);
    });

    it('地球(Earth) - 葫芦: chipBonus=25, multBonus=2', () => {
      const planet = PLANET_CARDS[PokerHandType.FullHouse];
      expect(planet.id).toBe('earth');
      expect(planet.name).toBe('地球');
      expect(planet.chipBonus).toBe(25);
      expect(planet.multBonus).toBe(2);
    });

    it('火星(Mars) - 四条: chipBonus=30, multBonus=3', () => {
      const planet = PLANET_CARDS[PokerHandType.FourOfAKind];
      expect(planet.id).toBe('mars');
      expect(planet.name).toBe('火星');
      expect(planet.chipBonus).toBe(30);
      expect(planet.multBonus).toBe(3);
    });

    it('海王星(Neptune) - 同花顺: chipBonus=40, multBonus=4', () => {
      const planet = PLANET_CARDS[PokerHandType.StraightFlush];
      expect(planet.id).toBe('neptune');
      expect(planet.name).toBe('海王星');
      expect(planet.chipBonus).toBe(40);
      expect(planet.multBonus).toBe(4);
    });

    it('海王星(Neptune) - 皇家同花顺: chipBonus=40, multBonus=4', () => {
      const planet = PLANET_CARDS[PokerHandType.RoyalFlush];
      expect(planet.id).toBe('neptune');
      expect(planet.name).toBe('海王星');
      expect(planet.chipBonus).toBe(40);
      expect(planet.multBonus).toBe(4);
    });

    it('星球X(Planet X) - 五条: chipBonus=35, multBonus=3', () => {
      const planet = PLANET_CARDS[PokerHandType.FiveOfAKind];
      expect(planet.id).toBe('planet_x');
      expect(planet.name).toBe('星球X');
      expect(planet.chipBonus).toBe(35);
      expect(planet.multBonus).toBe(3);
    });

    it('谷神星(Ceres) - 同花葫芦: chipBonus=40, multBonus=4', () => {
      const planet = PLANET_CARDS[PokerHandType.FlushHouse];
      expect(planet.id).toBe('ceres');
      expect(planet.name).toBe('谷神星');
      expect(planet.chipBonus).toBe(40);
      expect(planet.multBonus).toBe(4);
    });

    it('厄里斯(Eris) - 同花五条: chipBonus=50, multBonus=3', () => {
      const planet = PLANET_CARDS[PokerHandType.FlushFive];
      expect(planet.id).toBe('eris');
      expect(planet.name).toBe('厄里斯');
      expect(planet.chipBonus).toBe(50);
      expect(planet.multBonus).toBe(3);
    });
  });

  describe('getPlanetCardBonus 函数测试', () => {
    it('应该对所有牌型返回正确的值', () => {
      const testCases: { handType: PokerHandType; expected: { chipBonus: number; multBonus: number } }[] = [
        { handType: PokerHandType.HighCard, expected: { chipBonus: 10, multBonus: 1 } },
        { handType: PokerHandType.OnePair, expected: { chipBonus: 15, multBonus: 1 } },
        { handType: PokerHandType.TwoPair, expected: { chipBonus: 20, multBonus: 1 } },
        { handType: PokerHandType.ThreeOfAKind, expected: { chipBonus: 20, multBonus: 2 } },
        { handType: PokerHandType.Straight, expected: { chipBonus: 30, multBonus: 3 } },
        { handType: PokerHandType.Flush, expected: { chipBonus: 15, multBonus: 2 } },
        { handType: PokerHandType.FullHouse, expected: { chipBonus: 25, multBonus: 2 } },
        { handType: PokerHandType.FourOfAKind, expected: { chipBonus: 30, multBonus: 3 } },
        { handType: PokerHandType.StraightFlush, expected: { chipBonus: 40, multBonus: 4 } },
        { handType: PokerHandType.RoyalFlush, expected: { chipBonus: 40, multBonus: 4 } },
        { handType: PokerHandType.FiveOfAKind, expected: { chipBonus: 35, multBonus: 3 } },
        { handType: PokerHandType.FlushHouse, expected: { chipBonus: 40, multBonus: 4 } },
        { handType: PokerHandType.FlushFive, expected: { chipBonus: 50, multBonus: 3 } },
      ];

      for (const { handType, expected } of testCases) {
        const result = getPlanetCardBonus(handType);
        expect(result).toEqual(expected);
      }
    });

    it('对无效牌型应该返回默认值 {chipBonus: 0, multBonus: 0}', () => {
      const result = getPlanetCardBonus('invalidHandType' as PokerHandType);
      expect(result).toEqual({ chipBonus: 0, multBonus: 0 });
    });
  });

  describe('一致性测试', () => {
    it('所有星球牌名称都不为空', () => {
      for (const planet of Object.values(PLANET_CARDS)) {
        expect(planet.name).toBeTruthy();
        expect(planet.name.length).toBeGreaterThan(0);
      }
    });

    it('所有星球牌描述都不为空', () => {
      for (const planet of Object.values(PLANET_CARDS)) {
        expect(planet.description).toBeTruthy();
        expect(planet.description.length).toBeGreaterThan(0);
      }
    });

    it('handType 与对象键一致', () => {
      for (const [key, planet] of Object.entries(PLANET_CARDS)) {
        expect(planet.handType).toBe(key);
      }
    });

    it('所有星球牌ID都不为空', () => {
      for (const planet of Object.values(PLANET_CARDS)) {
        expect(planet.id).toBeTruthy();
        expect(planet.id.length).toBeGreaterThan(0);
      }
    });

    it('筹码和倍率奖励都应该为非负数', () => {
      for (const planet of Object.values(PLANET_CARDS)) {
        expect(planet.chipBonus).toBeGreaterThanOrEqual(0);
        expect(planet.multBonus).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
