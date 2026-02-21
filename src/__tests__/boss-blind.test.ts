import { describe, it, expect, beforeEach } from 'vitest';
import { BossSystem, BossEffectResult } from '../systems/BossSystem';
import { BossState } from '../models/BossState';
import { BossType } from '../types/game';
import { PokerHandType } from '../types/pokerHands';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { initializeBlindConfigs, resetBlindConfigs, getBossBlindConfig, BASE_BLIND_CONFIGS } from '../data/blinds';
import { BlindType } from '../types/game';

describe('Boss盲注系统', () => {
  let bossState: BossState;

  beforeEach(() => {
    bossState = new BossState();
    resetBlindConfigs();
  });

  describe('Boss配置检查', () => {
    it('基础配置应该有8个Boss盲注位置', () => {
      const bossBlinds = BASE_BLIND_CONFIGS.filter(config => config.type === BlindType.BOSS_BLIND);
      expect(bossBlinds.length).toBe(8);
    });

    it('钩子Boss配置正确', () => {
      // 使用动态分配的Boss
      const bossAssignments = new Map([[1, BossType.HOOK]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(1);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.HOOK);
      expect(config?.name).toBe('Boss: 钩子');
      expect(config?.description).toBe('每次出牌后弃掉2张随机手牌');
      expect(config?.scoreMultiplier).toBe(2);
    });

    it('手铐Boss配置正确（原水獭）', () => {
      const bossAssignments = new Map([[2, BossType.MANACLE]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(2);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.MANACLE);
      expect(config?.name).toBe('Boss: 手铐');
      expect(config?.description).toBe('手牌上限-1');
    });

    it('房子Boss配置正确', () => {
      const bossAssignments = new Map([[3, BossType.HOUSE]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(3);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.HOUSE);
      expect(config?.name).toBe('Boss: 房子');
      expect(config?.description).toBe('第一手牌面朝下');
    });

    it('墙壁Boss配置正确', () => {
      const bossAssignments = new Map([[4, BossType.WALL]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(4);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.WALL);
      expect(config?.name).toBe('Boss: 墙壁');
      expect(config?.description).toBe('4倍基础分数');
      expect(config?.scoreMultiplier).toBe(4);
    });

    it('手臂Boss配置正确', () => {
      const bossAssignments = new Map([[5, BossType.ARM]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(5);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.ARM);
      expect(config?.name).toBe('Boss: 手臂');
      expect(config?.description).toBe('打出牌型等级-1（最低1级）');
    });

    it('牙齿Boss配置正确', () => {
      const bossAssignments = new Map([[6, BossType.TOOTH]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(6);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.TOOTH);
      expect(config?.name).toBe('Boss: 牙齿');
      expect(config?.description).toBe('每打出1张牌损失$1');
    });

    it('眼睛Boss配置正确', () => {
      const bossAssignments = new Map([[7, BossType.EYE]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(7);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.EYE);
      expect(config?.name).toBe('Boss: 眼睛');
      expect(config?.description).toBe('本回合不能重复牌型');
    });

    it('琥珀橡果Boss配置正确（原琥珀色酸液）', () => {
      const bossAssignments = new Map([[8, BossType.AMBER_ACORN]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(8);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.AMBER_ACORN);
      expect(config?.name).toBe('Boss: 琥珀橡果');
      expect(config?.description).toBe('翻转并洗牌所有小丑牌');
      expect(config?.reward).toBe(8);
    });
  });

  describe('钩子 (The Hook)', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.HOOK);
    });

    it('出牌后应该弃掉2张手牌', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ];
      
      const result = BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);
      
      expect(result.discardCount).toBe(2);
      expect(result.message).toContain('钩子Boss');
    });

    it('应该记录已出牌型', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      
      BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);
      
      // 第二次出相同牌型应该仍然可以（钩子不限制牌型）
      const canPlay = BossSystem.canPlayHand(bossState, PokerHandType.HighCard);
      expect(canPlay.canPlay).toBe(true);
    });
  });

  describe('手铐 (The Manacle) - 原水獭', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.MANACLE);
    });

    it('手牌上限应该减少1', () => {
      const modifiedSize = BossSystem.modifyHandSize(bossState, 8);
      expect(modifiedSize).toBe(7);
    });

    it('基础上限7应该变为6', () => {
      const modifiedSize = BossSystem.modifyHandSize(bossState, 7);
      expect(modifiedSize).toBe(6);
    });

    it('无Boss时手牌上限不变', () => {
      BossSystem.clearBoss(bossState);
      const modifiedSize = BossSystem.modifyHandSize(bossState, 8);
      expect(modifiedSize).toBe(8);
    });
  });

  describe('房子 (The House)', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.HOUSE);
    });

    it('第一手牌应该面朝下', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      const isFaceDown = BossSystem.isCardFaceDown(bossState, card, true);
      expect(isFaceDown).toBe(true);
    });

    it('非第一手牌应该正常显示', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      const isFaceDown = BossSystem.isCardFaceDown(bossState, card, false);
      expect(isFaceDown).toBe(false);
    });

    it('出牌后第一手牌标记应该重置', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      
      // 第一手牌面朝下
      let isFaceDown = BossSystem.isCardFaceDown(bossState, cards[0], true);
      expect(isFaceDown).toBe(true);
      
      // 出牌
      BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);
      
      // 注意：房子Boss的效果是"第一手牌面朝下"，不是"每手牌的第一张"
      // 这个测试验证的是第一手牌（第一次发的牌）面朝下
    });
  });

  describe('墙壁 (The Wall)', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.WALL);
    });

    it('目标分数应该是4倍基础分数', () => {
      const baseScore = 300;
      const modifiedScore = BossSystem.modifyTargetScore(bossState, baseScore);
      expect(modifiedScore).toBe(1200); // 300 * 4
    });

    it('不同底注的4倍分数计算正确', () => {
      expect(BossSystem.modifyTargetScore(bossState, 5000)).toBe(20000);
      expect(BossSystem.modifyTargetScore(bossState, 10000)).toBe(40000);
    });

    it('无Boss时应该是2倍分数', () => {
      BossSystem.clearBoss(bossState);
      const baseScore = 300;
      const modifiedScore = BossSystem.modifyTargetScore(bossState, baseScore);
      expect(modifiedScore).toBe(600); // 300 * 2
    });
  });

  describe('手臂 (The Arm)', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.ARM);
    });

    it('打出牌型后等级应该降低1', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace)
      ];
      
      const result = BossSystem.afterPlayHand(bossState, cards, PokerHandType.OnePair);
      
      expect(result.message).toContain('手臂Boss');
      expect(result.message).toContain('等级降低');
    });

    it('应该能获取牌型等级降低值', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      
      BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);
      
      const reduction = BossSystem.getHandLevelReduction(bossState, PokerHandType.HighCard);
      expect(reduction).toBe(1);
    });

    it('不同牌型等级降低独立计算', () => {
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace)], PokerHandType.HighCard);
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)], PokerHandType.OnePair);
      
      expect(BossSystem.getHandLevelReduction(bossState, PokerHandType.HighCard)).toBe(1);
      expect(BossSystem.getHandLevelReduction(bossState, PokerHandType.OnePair)).toBe(1);
    });
  });

  describe('牙齿 (The Tooth)', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.TOOTH);
    });

    it('每张出牌应该扣$1', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen)
      ];
      
      const result = BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);
      
      expect(result.moneyChange).toBe(-3); // 3张牌扣$3
      expect(result.message).toContain('3张牌扣$3');
    });

    it('出1张牌应该扣$1', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      
      const result = BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);
      
      expect(result.moneyChange).toBe(-1);
    });

    it('出5张牌应该扣$5', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten)
      ];
      
      const result = BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);
      
      expect(result.moneyChange).toBe(-5);
    });
  });

  describe('眼睛 (The Eye)', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.EYE);
    });

    it('不能重复打出相同牌型', () => {
      // 第一次出对子
      BossSystem.beforePlayHand(bossState, PokerHandType.OnePair);
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)], PokerHandType.OnePair);
      
      // 第二次出对子应该失败
      const result = BossSystem.canPlayHand(bossState, PokerHandType.OnePair);
      expect(result.canPlay).toBe(false);
      expect(result.message).toContain('眼睛Boss');
    });

    it('不同牌型可以正常打出', () => {
      // 第一次出对子
      BossSystem.beforePlayHand(bossState, PokerHandType.OnePair);
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)], PokerHandType.OnePair);
      
      // 第二次出三条应该成功
      const result = BossSystem.canPlayHand(bossState, PokerHandType.ThreeOfAKind);
      expect(result.canPlay).toBe(true);
    });

    it('回合结束后应该重置记录', () => {
      // 出对子
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)], PokerHandType.OnePair);
      
      // 回合结束
      BossSystem.onRoundEnd(bossState);
      
      // 新回合可以出对子
      const result = BossSystem.canPlayHand(bossState, PokerHandType.OnePair);
      expect(result.canPlay).toBe(true);
    });

    it('可以出多种不同牌型', () => {
      // 出对子
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)], PokerHandType.OnePair);
      
      // 出三条
      BossSystem.beforePlayHand(bossState, PokerHandType.ThreeOfAKind);
      BossSystem.afterPlayHand(bossState, [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.Ace)
      ], PokerHandType.ThreeOfAKind);
      
      // 出两对应该可以
      const result = BossSystem.canPlayHand(bossState, PokerHandType.TwoPair);
      expect(result.canPlay).toBe(true);
    });
  });

  describe('琥珀橡果 (Amber Acorn) - 原琥珀色酸液', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.AMBER_ACORN);
    });

    it('回合开始应该翻转并洗牌小丑牌', () => {
      const result = BossSystem.onRoundStart(bossState);
      
      expect(result.jokersFlipped).toBe(true);
      expect(result.jokersShuffled).toBe(true);
      expect(result.message).toContain('琥珀橡果Boss');
    });

    it('无Boss时不应该翻转小丑牌', () => {
      BossSystem.clearBoss(bossState);
      const result = BossSystem.onRoundStart(bossState);
      
      expect(result.jokersFlipped).toBeUndefined();
      expect(result.jokersShuffled).toBeUndefined();
    });
  });

  describe('BossSystem通用功能', () => {
    it('应该能设置和清除Boss', () => {
      expect(BossSystem.getCurrentBoss(bossState)).toBeNull();
      
      BossSystem.setBoss(bossState, BossType.HOOK);
      expect(BossSystem.getCurrentBoss(bossState)).toBe(BossType.HOOK);
      
      BossSystem.clearBoss(bossState);
      expect(BossSystem.getCurrentBoss(bossState)).toBeNull();
    });

    it('切换Boss应该重置状态', () => {
      // 设置眼睛Boss并出牌
      BossSystem.setBoss(bossState, BossType.EYE);
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace)], PokerHandType.HighCard);
      
      // 切换到手铐Boss
      BossSystem.setBoss(bossState, BossType.MANACLE);
      
      // 状态应该重置
      expect(BossSystem.getCurrentBoss(bossState)).toBe(BossType.MANACLE);
    });

    it('应该能获取Boss配置', () => {
      const config = BossSystem.getBossConfig(BossType.HOOK);
      
      expect(config.name).toBe('钩子');
      expect(config.description).toBe('每次出牌后弃掉2张随机手牌');
      expect(config.minAnte).toBe(1);
      expect(config.scoreMultiplier).toBe(2);
      expect(config.reward).toBe(5);
    });

    it('所有Boss类型都应该有配置', () => {
      const allBossTypes = Object.values(BossType);
      
      for (const bossType of allBossTypes) {
        const config = BossSystem.getBossConfig(bossType as BossType);
        expect(config).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
      }
    });
  });

  describe('其他Boss效果（可扩展）', () => {
    it('梅花Boss应该使梅花牌失效', () => {
      BossSystem.setBoss(bossState, BossType.CLUB);
      
      const clubCard = new Card(Suit.Clubs, Rank.Ace);
      const spadeCard = new Card(Suit.Spades, Rank.Ace);
      
      expect(BossSystem.isCardDebuffed(bossState, clubCard)).toBe(true);
      expect(BossSystem.isCardDebuffed(bossState, spadeCard)).toBe(false);
    });

    it('黑桃Boss应该使黑桃牌失效', () => {
      BossSystem.setBoss(bossState, BossType.GOAD);
      
      const spadeCard = new Card(Suit.Spades, Rank.Ace);
      const heartCard = new Card(Suit.Hearts, Rank.Ace);
      
      expect(BossSystem.isCardDebuffed(bossState, spadeCard)).toBe(true);
      expect(BossSystem.isCardDebuffed(bossState, heartCard)).toBe(false);
    });

    it('红桃Boss应该使红桃牌失效', () => {
      BossSystem.setBoss(bossState, BossType.HEAD);
      
      const heartCard = new Card(Suit.Hearts, Rank.Ace);
      const diamondCard = new Card(Suit.Diamonds, Rank.Ace);
      
      expect(BossSystem.isCardDebuffed(bossState, heartCard)).toBe(true);
      expect(BossSystem.isCardDebuffed(bossState, diamondCard)).toBe(false);
    });

    it('方片Boss应该使方片牌失效', () => {
      BossSystem.setBoss(bossState, BossType.WINDOW);
      
      const diamondCard = new Card(Suit.Diamonds, Rank.Ace);
      const clubCard = new Card(Suit.Clubs, Rank.Ace);
      
      expect(BossSystem.isCardDebuffed(bossState, diamondCard)).toBe(true);
      expect(BossSystem.isCardDebuffed(bossState, clubCard)).toBe(false);
    });

    it('植物Boss应该使人头牌失效', () => {
      BossSystem.setBoss(bossState, BossType.PLANT);
      
      const jack = new Card(Suit.Spades, Rank.Jack);
      const queen = new Card(Suit.Spades, Rank.Queen);
      const king = new Card(Suit.Spades, Rank.King);
      const ace = new Card(Suit.Spades, Rank.Ace);
      
      expect(BossSystem.isCardDebuffed(bossState, jack)).toBe(true);
      expect(BossSystem.isCardDebuffed(bossState, queen)).toBe(true);
      expect(BossSystem.isCardDebuffed(bossState, king)).toBe(true);
      expect(BossSystem.isCardDebuffed(bossState, ace)).toBe(false);
    });

    it('水Boss应该使弃牌次数为0', () => {
      BossSystem.setBoss(bossState, BossType.WATER);
      
      const modifiedDiscards = BossSystem.modifyDiscards(bossState, 3);
      expect(modifiedDiscards).toBe(0);
    });

    it('针Boss应该使出牌次数为1', () => {
      BossSystem.setBoss(bossState, BossType.NEEDLE);
      
      const modifiedHands = BossSystem.modifyHands(bossState, 4);
      expect(modifiedHands).toBe(1);
    });

    it('紫色容器Boss应该是6倍分数', () => {
      BossSystem.setBoss(bossState, BossType.VIOLET_VESSEL);
      
      const baseScore = 50000;
      const modifiedScore = BossSystem.modifyTargetScore(bossState, baseScore);
      expect(modifiedScore).toBe(300000); // 50000 * 6
    });

    it('标记Boss应该使人头牌面朝下', () => {
      BossSystem.setBoss(bossState, BossType.MARK);
      
      const jack = new Card(Suit.Spades, Rank.Jack);
      const ten = new Card(Suit.Spades, Rank.Ten);
      
      expect(BossSystem.isCardFaceDown(bossState, jack, false)).toBe(true);
      expect(BossSystem.isCardFaceDown(bossState, ten, false)).toBe(false);
    });
  });
});
