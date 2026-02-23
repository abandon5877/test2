import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ProbabilitySystem,
  PROBABILITIES,
  checkBloodstone,
  checkStuntman,
  checkSpaceJoker,
  checkHallucination,
  checkLuckyCash,
  checkLuckyMult,
  checkGlassDestroy
} from '../systems/ProbabilitySystem';

describe('ProbabilitySystem 概率系统测试', () => {
  beforeEach(() => {
    ProbabilitySystem.reset();
  });

  describe('基础功能', () => {
    it('初始状态Oops!_All_6s数量应为0', () => {
      expect(ProbabilitySystem.getOopsAll6sCount()).toBe(0);
    });

    it('应能设置Oops!_All_6s数量', () => {
      ProbabilitySystem.setOopsAll6sCount(2);
      expect(ProbabilitySystem.getOopsAll6sCount()).toBe(2);
    });

    it('Oops!_All_6s数量不应为负数', () => {
      ProbabilitySystem.setOopsAll6sCount(-1);
      expect(ProbabilitySystem.getOopsAll6sCount()).toBe(0);
    });

    it('reset应重置所有状态', () => {
      ProbabilitySystem.setOopsAll6sCount(3);
      ProbabilitySystem.check(0.5);
      ProbabilitySystem.reset();

      expect(ProbabilitySystem.getOopsAll6sCount()).toBe(0);
      expect(ProbabilitySystem.getEventLog()).toHaveLength(0);
    });
  });

  describe('概率计算', () => {
    it('无Oops!_All_6s时应返回基础概率', () => {
      const result = ProbabilitySystem.apply(0.5);
      expect(result).toBe(0.5);
    });

    it('1张Oops!_All_6s应使概率翻倍', () => {
      ProbabilitySystem.setOopsAll6sCount(1);
      const result = ProbabilitySystem.apply(0.25);
      expect(result).toBe(0.5);
    });

    it('2张Oops!_All_6s应使概率变为4倍', () => {
      ProbabilitySystem.setOopsAll6sCount(2);
      const result = ProbabilitySystem.apply(0.25);
      expect(result).toBe(1); // 0.25 * 4 = 1, 但上限为1
    });

    it('概率不应超过100%', () => {
      ProbabilitySystem.setOopsAll6sCount(10);
      const result = ProbabilitySystem.apply(0.5);
      expect(result).toBe(1);
    });

    it('1张Oops!_All_6s应使Bloodstone概率变为100%', () => {
      ProbabilitySystem.setOopsAll6sCount(1);
      const modifiedProb = ProbabilitySystem.getModifiedProbability(PROBABILITIES.BLOODSTONE);
      expect(modifiedProb).toBe(1); // 0.5 * 2 = 1
    });

    it('1张Oops!_All_6s应使Stuntman概率变为50%', () => {
      ProbabilitySystem.setOopsAll6sCount(1);
      const modifiedProb = ProbabilitySystem.getModifiedProbability(PROBABILITIES.STUNTMAN);
      expect(modifiedProb).toBe(0.5); // 0.25 * 2 = 0.5
    });
  });

  describe('概率检查', () => {
    it('应记录概率检查事件', () => {
      ProbabilitySystem.check(0.5);
      const log = ProbabilitySystem.getEventLog();
      expect(log).toHaveLength(1);
      expect(log[0].baseProbability).toBe(0.5);
    });

    it('事件日志应包含所有必要字段', () => {
      ProbabilitySystem.setOopsAll6sCount(1);
      ProbabilitySystem.check(0.25);

      const log = ProbabilitySystem.getEventLog();
      expect(log[0]).toHaveProperty('baseProbability');
      expect(log[0]).toHaveProperty('modifiedProbability');
      expect(log[0]).toHaveProperty('result');
      expect(log[0]).toHaveProperty('timestamp');
    });

    it('clearEventLog应清空日志', () => {
      ProbabilitySystem.check(0.5);
      expect(ProbabilitySystem.getEventLog()).toHaveLength(1);

      ProbabilitySystem.clearEventLog();
      expect(ProbabilitySystem.getEventLog()).toHaveLength(0);
    });
  });

  describe('便捷函数', () => {
    it('checkBloodstone应使用正确的概率', () => {
      // Mock ProbabilitySystem.check
      const mockCheck = vi.spyOn(ProbabilitySystem, 'check').mockReturnValue(true);

      checkBloodstone();

      expect(mockCheck).toHaveBeenCalledWith(PROBABILITIES.BLOODSTONE);
      mockCheck.mockRestore();
    });

    it('checkStuntman应使用正确的概率', () => {
      const mockCheck = vi.spyOn(ProbabilitySystem, 'check').mockReturnValue(true);

      checkStuntman();

      expect(mockCheck).toHaveBeenCalledWith(PROBABILITIES.STUNTMAN);
      mockCheck.mockRestore();
    });

    it('checkSpaceJoker应使用正确的概率', () => {
      const mockCheck = vi.spyOn(ProbabilitySystem, 'check').mockReturnValue(true);

      checkSpaceJoker();

      expect(mockCheck).toHaveBeenCalledWith(PROBABILITIES.SPACE_JOKER);
      mockCheck.mockRestore();
    });

    it('checkHallucination应使用正确的概率', () => {
      const mockCheck = vi.spyOn(ProbabilitySystem, 'check').mockReturnValue(true);

      checkHallucination();

      expect(mockCheck).toHaveBeenCalledWith(PROBABILITIES.HALLUCINATION);
      mockCheck.mockRestore();
    });

    it('checkLuckyCash应使用正确的概率', () => {
      const mockCheck = vi.spyOn(ProbabilitySystem, 'check').mockReturnValue(true);

      checkLuckyCash();

      expect(mockCheck).toHaveBeenCalledWith(PROBABILITIES.LUCKY_CASH);
      mockCheck.mockRestore();
    });

    it('checkLuckyMult应使用正确的概率', () => {
      const mockCheck = vi.spyOn(ProbabilitySystem, 'check').mockReturnValue(true);

      checkLuckyMult();

      expect(mockCheck).toHaveBeenCalledWith(PROBABILITIES.LUCKY_MULT);
      mockCheck.mockRestore();
    });

    it('checkGlassDestroy应使用正确的概率', () => {
      const mockCheck = vi.spyOn(ProbabilitySystem, 'check').mockReturnValue(true);

      checkGlassDestroy();

      expect(mockCheck).toHaveBeenCalledWith(PROBABILITIES.GLASS_DESTROY);
      mockCheck.mockRestore();
    });

    it('便捷函数应能设置Oops!_All_6s数量', () => {
      checkBloodstone(2);
      expect(ProbabilitySystem.getOopsAll6sCount()).toBe(2);
    });
  });

  describe('Oops!_All_6s效果验证', () => {
    it('1张Oops!_All_6s时，50%概率应变为100%', () => {
      ProbabilitySystem.setOopsAll6sCount(1);
      const modified = ProbabilitySystem.getModifiedProbability(0.5);
      expect(modified).toBe(1);
    });

    it('2张Oops!_All_6s时，25%概率应变为100%', () => {
      ProbabilitySystem.setOopsAll6sCount(2);
      const modified = ProbabilitySystem.getModifiedProbability(0.25);
      expect(modified).toBe(1); // 0.25 * 4 = 1
    });

    it('3张Oops!_All_6s时，10%概率应变为80%', () => {
      ProbabilitySystem.setOopsAll6sCount(3);
      const modified = ProbabilitySystem.getModifiedProbability(0.1);
      expect(modified).toBe(0.8); // 0.1 * 8 = 0.8
    });

    it('概率常量的值应正确', () => {
      expect(PROBABILITIES.BLOODSTONE).toBe(0.5);
      expect(PROBABILITIES.STUNTMAN).toBe(0.25);
      expect(PROBABILITIES.SPACE_JOKER).toBe(0.25);
      expect(PROBABILITIES.HALLUCINATION).toBe(0.5);
      expect(PROBABILITIES.LUCKY_CASH).toBe(0.2);
      expect(PROBABILITIES.LUCKY_MULT).toBe(0.2);
      expect(PROBABILITIES.GLASS_DESTROY).toBe(1 / 15);
    });
  });
});
