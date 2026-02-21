import { describe, it, expect } from 'vitest';
import { ALL_CONSUMABLE_INSTANCES as CONSUMABLES, getConsumablesByType } from '../data/consumables/index';
import { ConsumableType } from '../types/consumable';

describe('Consumables - Planet Cards', () => {
  describe('Planet Card Count', () => {
    it('should have 12 planet cards (excluding Royal Flush which shares with Straight Flush)', () => {
      const planetCards = getConsumablesByType(ConsumableType.PLANET);
      // 注意：皇家同花顺和海王星共享同一个星球牌，所以consumables中只有12个
      expect(planetCards.length).toBe(12);
    });

    it('should have all planet card IDs', () => {
      const expectedIds = [
        'planet_pluto', 'planet_mercury', 'planet_uranus', 'planet_venus',
        'planet_saturn', 'planet_jupiter', 'planet_earth', 'planet_mars',
        'planet_neptune', 'planet_planet_x', 'planet_ceres', 'planet_eris'
      ];

      for (const id of expectedIds) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card).toBeDefined();
        expect(card?.type).toBe(ConsumableType.PLANET);
      }
    });
  });

  describe('Planet Card Effects', () => {
    it('Pluto should upgrade High Card', () => {
      const pluto = CONSUMABLES.find(c => c.id === 'planet_pluto');
      const result = pluto!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('高牌');
    });

    it('Mercury should upgrade One Pair', () => {
      const mercury = CONSUMABLES.find(c => c.id === 'planet_mercury');
      const result = mercury!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('对子');
    });

    it('Uranus should upgrade Two Pair', () => {
      const uranus = CONSUMABLES.find(c => c.id === 'planet_uranus');
      const result = uranus!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('两对');
    });

    it('Venus should upgrade Three of a Kind', () => {
      const venus = CONSUMABLES.find(c => c.id === 'planet_venus');
      const result = venus!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('三条');
    });

    it('Saturn should upgrade Straight', () => {
      const saturn = CONSUMABLES.find(c => c.id === 'planet_saturn');
      const result = saturn!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('顺子');
    });

    it('Jupiter should upgrade Flush', () => {
      const jupiter = CONSUMABLES.find(c => c.id === 'planet_jupiter');
      const result = jupiter!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('同花');
    });

    it('Earth should upgrade Full House', () => {
      const earth = CONSUMABLES.find(c => c.id === 'planet_earth');
      expect(earth?.description).toContain('葫芦');
      const result = earth!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('葫芦');
    });

    it('Mars should upgrade Four of a Kind', () => {
      const mars = CONSUMABLES.find(c => c.id === 'planet_mars');
      const result = mars!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('四条');
    });

    it('Neptune should upgrade Straight Flush', () => {
      const neptune = CONSUMABLES.find(c => c.id === 'planet_neptune');
      const result = neptune!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('同花顺');
    });

    it('Planet X should upgrade Five of a Kind', () => {
      const planetX = CONSUMABLES.find(c => c.id === 'planet_planet_x');
      expect(planetX).toBeDefined();
      expect(planetX?.description).toContain('五条');
      const result = planetX!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('五条');
    });

    it('Ceres should upgrade Flush House', () => {
      const ceres = CONSUMABLES.find(c => c.id === 'planet_ceres');
      expect(ceres).toBeDefined();
      expect(ceres?.description).toContain('同花葫芦');
      const result = ceres!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('同花葫芦');
    });

    it('Eris should upgrade Flush Five', () => {
      const eris = CONSUMABLES.find(c => c.id === 'planet_eris');
      expect(eris).toBeDefined();
      expect(eris?.description).toContain('同花五条');
      const result = eris!.use({});
      expect(result.success).toBe(true);
      expect(result.message).toContain('同花五条');
    });
  });

  describe('Planet Card Costs', () => {
    it('should have correct costs for planet cards', () => {
      const lowCostCards = ['planet_pluto']; // $3
      const mediumCostCards = ['planet_mercury', 'planet_venus', 'planet_uranus', 'planet_earth']; // $4
      const highCostCards = ['planet_saturn', 'planet_jupiter']; // $5
      const higherCostCards = ['planet_mars', 'planet_neptune']; // $6
      const highestCostCards = ['planet_planet_x', 'planet_ceres', 'planet_eris']; // $7

      for (const id of lowCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(3);
      }

      for (const id of mediumCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(4);
      }

      for (const id of highCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(5);
      }

      for (const id of higherCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(6);
      }

      for (const id of highestCostCards) {
        const card = CONSUMABLES.find(c => c.id === id);
        expect(card?.cost).toBe(7);
      }
    });
  });

  describe('Planet Card Upgrade Values', () => {
    it('should have correct upgrade values in messages', () => {
      const testCases = [
        { id: 'planet_pluto', chipBonus: 10, multBonus: 1 },
        { id: 'planet_mercury', chipBonus: 15, multBonus: 1 },
        { id: 'planet_uranus', chipBonus: 20, multBonus: 1 },
        { id: 'planet_venus', chipBonus: 20, multBonus: 2 },
        { id: 'planet_saturn', chipBonus: 30, multBonus: 3 },
        { id: 'planet_jupiter', chipBonus: 15, multBonus: 2 },
        { id: 'planet_earth', chipBonus: 25, multBonus: 2 },
        { id: 'planet_mars', chipBonus: 30, multBonus: 3 },
        { id: 'planet_neptune', chipBonus: 40, multBonus: 4 },
        { id: 'planet_planet_x', chipBonus: 35, multBonus: 3 },
        { id: 'planet_ceres', chipBonus: 40, multBonus: 4 },
        { id: 'planet_eris', chipBonus: 50, multBonus: 3 },
      ];

      for (const { id, chipBonus, multBonus } of testCases) {
        const card = CONSUMABLES.find(c => c.id === id);
        const result = card!.use({});
        expect(result.message).toContain(`+${chipBonus}筹码`);
        expect(result.message).toContain(`+${multBonus}倍率`);
      }
    });
  });
});
