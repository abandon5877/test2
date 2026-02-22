import { describe, it, expect } from 'vitest';
import {
  getEditionMultiplier,
  getPlayingCardEditionProbabilities,
  getJokerEditionProbabilities,
  generateRandomEnhancement,
  generateRandomSeal,
  generateRandomPlayingCardEdition,
  generateRandomJokerEdition,
  generatePlayingCardModifiers,
  generateJokerModifier,
  PLAYING_CARD_PROBABILITIES,
  JOKER_PROBABILITIES
} from '../data/probabilities';
import { CardEdition, CardEnhancement, SealType } from '../types/card';
import { JokerEdition } from '../types/joker';

describe('Enhancement Probabilities', () => {
  describe('getEditionMultiplier', () => {
    it('should return 1 when no vouchers', () => {
      expect(getEditionMultiplier([])).toBe(1);
    });

    it('should return 2 when Hone voucher is used', () => {
      expect(getEditionMultiplier(['voucher_hone'])).toBe(2);
    });

    it('should return 4 when Glow Up voucher is used', () => {
      expect(getEditionMultiplier(['voucher_glow_up'])).toBe(4);
    });

    it('should return 4 when both Hone and Glow Up are used (Glow Up takes precedence)', () => {
      expect(getEditionMultiplier(['voucher_hone', 'voucher_glow_up'])).toBe(4);
    });
  });

  describe('getPlayingCardEditionProbabilities', () => {
    it('should return base probabilities with no vouchers', () => {
      const probs = getPlayingCardEditionProbabilities([]);

      expect(probs[CardEdition.None]).toBeGreaterThan(0.9);
      expect(probs[CardEdition.Foil]).toBeGreaterThan(0.03);
      expect(probs[CardEdition.Holographic]).toBeGreaterThan(0.02);
      expect(probs[CardEdition.Polychrome]).toBeGreaterThan(0.01);

      // 概率总和应为1
      const sum = Object.values(probs).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should double probabilities with Hone voucher', () => {
      const baseProbs = getPlayingCardEditionProbabilities([]);
      const honeProbs = getPlayingCardEditionProbabilities(['voucher_hone']);

      expect(honeProbs[CardEdition.Foil]).toBeGreaterThan(baseProbs[CardEdition.Foil]);
      expect(honeProbs[CardEdition.Holographic]).toBeGreaterThan(baseProbs[CardEdition.Holographic]);
      expect(honeProbs[CardEdition.Polychrome]).toBeGreaterThan(baseProbs[CardEdition.Polychrome]);
      expect(honeProbs[CardEdition.None]).toBeLessThan(baseProbs[CardEdition.None]);
    });

    it('should quadruple probabilities with Glow Up voucher', () => {
      const baseProbs = getPlayingCardEditionProbabilities([]);
      const glowUpProbs = getPlayingCardEditionProbabilities(['voucher_glow_up']);

      expect(glowUpProbs[CardEdition.Foil]).toBeGreaterThan(baseProbs[CardEdition.Foil] * 3);
      expect(glowUpProbs[CardEdition.Holographic]).toBeGreaterThan(baseProbs[CardEdition.Holographic] * 3);
      expect(glowUpProbs[CardEdition.Polychrome]).toBeGreaterThan(baseProbs[CardEdition.Polychrome] * 3);
    });
  });

  describe('getJokerEditionProbabilities', () => {
    it('should return base probabilities with no vouchers', () => {
      const probs = getJokerEditionProbabilities([]);

      expect(probs[JokerEdition.None]).toBeGreaterThan(0.95);

      // 概率总和应为1
      const sum = Object.values(probs).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should increase probabilities with Hone voucher', () => {
      const baseProbs = getJokerEditionProbabilities([]);
      const honeProbs = getJokerEditionProbabilities(['voucher_hone']);

      expect(honeProbs[JokerEdition.Foil]).toBeGreaterThan(baseProbs[JokerEdition.Foil]);
      expect(honeProbs[JokerEdition.Holographic]).toBeGreaterThan(baseProbs[JokerEdition.Holographic]);
      expect(honeProbs[JokerEdition.Polychrome]).toBeGreaterThan(baseProbs[JokerEdition.Polychrome]);
    });
  });

  describe('generateRandomEnhancement', () => {
    it('should return a valid enhancement type', () => {
      const enhancement = generateRandomEnhancement();
      expect(Object.values(CardEnhancement)).toContain(enhancement);
    });

    it('should not return None', () => {
      // generateRandomEnhancement 只返回非None的增强类型
      const enhancement = generateRandomEnhancement();
      expect(enhancement).not.toBe(CardEnhancement.None);
    });
  });

  describe('generateRandomSeal', () => {
    it('should return a valid seal type', () => {
      const seal = generateRandomSeal();
      expect(Object.values(SealType)).toContain(seal);
    });

    it('should not return None', () => {
      const seal = generateRandomSeal();
      expect(seal).not.toBe(SealType.None);
    });
  });

  describe('generateRandomPlayingCardEdition', () => {
    it('should return a valid edition', () => {
      const edition = generateRandomPlayingCardEdition();
      expect(Object.values(CardEdition)).toContain(edition);
    });

    it('should return None most of the time with no vouchers', () => {
      // 测试概率分布 - 大部分应该是 None
      let noneCount = 0;
      const totalRuns = 1000;

      for (let i = 0; i < totalRuns; i++) {
        const edition = generateRandomPlayingCardEdition([]);
        if (edition === CardEdition.None) {
          noneCount++;
        }
      }

      // 无优惠券时，None 应该占约 92.8%
      const noneRate = noneCount / totalRuns;
      expect(noneRate).toBeGreaterThan(0.85);
      expect(noneRate).toBeLessThan(0.98);
    });

    it('should return more editions with Hone voucher', () => {
      let noneCountBase = 0;
      let noneCountHone = 0;
      const totalRuns = 1000;

      for (let i = 0; i < totalRuns; i++) {
        if (generateRandomPlayingCardEdition([]) === CardEdition.None) {
          noneCountBase++;
        }
        if (generateRandomPlayingCardEdition(['voucher_hone']) === CardEdition.None) {
          noneCountHone++;
        }
      }

      // Hone 应该减少 None 的比例
      expect(noneCountHone).toBeLessThan(noneCountBase);
    });
  });

  describe('generateRandomJokerEdition', () => {
    it('should return a valid edition', () => {
      const edition = generateRandomJokerEdition();
      expect(Object.values(JokerEdition)).toContain(edition);
    });

    it('should return None most of the time with no vouchers', () => {
      let noneCount = 0;
      const totalRuns = 1000;

      for (let i = 0; i < totalRuns; i++) {
        const edition = generateRandomJokerEdition([]);
        if (edition === JokerEdition.None) {
          noneCount++;
        }
      }

      // 无优惠券时，None 应该占约 97%
      const noneRate = noneCount / totalRuns;
      expect(noneRate).toBeGreaterThan(0.92);
    });
  });

  describe('generatePlayingCardModifiers', () => {
    it('should return valid modifiers', () => {
      const modifiers = generatePlayingCardModifiers([]);

      expect(Object.values(CardEnhancement)).toContain(modifiers.enhancement);
      expect(Object.values(CardEdition)).toContain(modifiers.edition);
      expect(Object.values(SealType)).toContain(modifiers.seal);
    });

    it('should have approximately 40% enhancement rate', () => {
      let enhancementCount = 0;
      const totalRuns = 1000;

      for (let i = 0; i < totalRuns; i++) {
        const modifiers = generatePlayingCardModifiers([]);
        if (modifiers.enhancement !== CardEnhancement.None) {
          enhancementCount++;
        }
      }

      const rate = enhancementCount / totalRuns;
      expect(rate).toBeGreaterThan(0.35);
      expect(rate).toBeLessThan(0.45);
    });

    it('should have approximately 20% seal rate', () => {
      let sealCount = 0;
      const totalRuns = 1000;

      for (let i = 0; i < totalRuns; i++) {
        const modifiers = generatePlayingCardModifiers([]);
        if (modifiers.seal !== SealType.None) {
          sealCount++;
        }
      }

      const rate = sealCount / totalRuns;
      expect(rate).toBeGreaterThan(0.15);
      expect(rate).toBeLessThan(0.25);
    });
  });

  describe('generateJokerModifier', () => {
    it('should return a valid edition', () => {
      const edition = generateJokerModifier([]);
      expect(Object.values(JokerEdition)).toContain(edition);
    });

    it('should return None most of the time', () => {
      let noneCount = 0;
      const totalRuns = 1000;

      for (let i = 0; i < totalRuns; i++) {
        const edition = generateJokerModifier([]);
        if (edition === JokerEdition.None) {
          noneCount++;
        }
      }

      const noneRate = noneCount / totalRuns;
      expect(noneRate).toBeGreaterThan(0.90);
    });
  });

  describe('Probability Constants', () => {
    it('should have correct playing card probabilities', () => {
      expect(PLAYING_CARD_PROBABILITIES.enhancement).toBe(0.40);
      expect(PLAYING_CARD_PROBABILITIES.seal).toBe(0.20);
    });

    it('should have correct edition base probabilities that sum to 1', () => {
      const baseEditionProbs = PLAYING_CARD_PROBABILITIES.edition.base;
      const sum = Object.values(baseEditionProbs).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should have correct joker edition base probabilities that sum to 1', () => {
      const baseEditionProbs = JOKER_PROBABILITIES.edition.base;
      const sum = Object.values(baseEditionProbs).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });
  });
});
