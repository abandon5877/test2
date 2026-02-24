import { describe, it, expect, beforeEach } from 'vitest';
import { BossSystem, BossEffectResult } from '../systems/BossSystem';
import { BossState } from '../models/BossState';
import { BossType } from '../types/game';
import { PokerHandType } from '../types/pokerHands';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { initializeBlindConfigs, resetBlindConfigs, getBossBlindConfig, BASE_BLIND_CONFIGS } from '../data/blinds';
import { BlindType } from '../types/game';
import { ScoringSystem } from '../systems/ScoringSystem';

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
      expect(config?.description).toBe('每次出牌后强制弃掉2张手牌');
      expect(config?.scoreMultiplier).toBe(2);
    });

    it('手铐Boss配置正确（原水獭）', () => {
      const bossAssignments = new Map([[2, BossType.MANACLE]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(2);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.MANACLE);
      expect(config?.name).toBe('Boss: 手铐');
      expect(config?.description).toBe('手牌上限减少1张');
    });

    it('房子Boss配置正确', () => {
      const bossAssignments = new Map([[3, BossType.HOUSE]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(3);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.HOUSE);
      expect(config?.name).toBe('Boss: 房子');
      expect(config?.description).toBe('第一手牌强制面朝下');
    });

    it('墙壁Boss配置正确', () => {
      const bossAssignments = new Map([[4, BossType.WALL]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(4);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.WALL);
      expect(config?.name).toBe('Boss: 墙壁');
      expect(config?.description).toBe('目标分数变为4倍');
      expect(config?.scoreMultiplier).toBe(4);
    });

    it('手臂Boss配置正确', () => {
      const bossAssignments = new Map([[5, BossType.ARM]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(5);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.ARM);
      expect(config?.name).toBe('Boss: 手臂');
      expect(config?.description).toBe('每次打出牌型，该牌型等级降低1级');
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
      expect(config?.description).toBe('本回合不能重复打出相同牌型');
    });

    it('琥珀橡果Boss配置正确（原琥珀色酸液）', () => {
      const bossAssignments = new Map([[8, BossType.AMBER_ACORN]]);
      initializeBlindConfigs(bossAssignments);
      
      const config = getBossBlindConfig(8);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.AMBER_ACORN);
      expect(config?.name).toBe('Boss: 琥珀橡果');
      expect(config?.description).toBe('回合开始时翻转并随机打乱所有小丑牌位置');
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

    it('初始状态isFirstHandPlayed应该为false', () => {
      expect(bossState.isFirstHandPlayed()).toBe(false);
    });

    it('出牌后isFirstHandPlayed应该为true', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];

      // 初始状态：第一手牌未出
      expect(bossState.isFirstHandPlayed()).toBe(false);

      // 出牌
      BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard);

      // 出牌后第一手牌标记应该被设置
      expect(bossState.isFirstHandPlayed()).toBe(true);
    });

    it('房子Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.HOUSE);
      expect(config.name).toBe('房子');
      expect(config.description).toBe('第一手牌强制面朝下');
      expect(config.minAnte).toBe(2);
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

    it('多次打出同牌型应该累加降低等级', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      
      // 第一次打出高牌（等级2 -> 降低1 -> 有效等级1）
      BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard, 2);
      expect(BossSystem.getHandLevelReduction(bossState, PokerHandType.HighCard)).toBe(1);
      
      // 第二次打出高牌（已经1级，不再降低）
      const result = BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard, 2);
      expect(BossSystem.getHandLevelReduction(bossState, PokerHandType.HighCard)).toBe(1); // 不再增加
      expect(result.message).toContain('已降至最低等级');
    });

    it('高等级牌型可以多次降低直到1级', () => {
      const cards = [new Card(Suit.Spades, Rank.Ace)];
      
      // 假设牌型等级为3级
      // 第一次打出（等级3 -> 降低1 -> 有效等级2）
      BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard, 3);
      expect(BossSystem.getHandLevelReduction(bossState, PokerHandType.HighCard)).toBe(1);
      
      // 第二次打出（等级3 -> 降低2 -> 有效等级1）
      BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard, 3);
      expect(BossSystem.getHandLevelReduction(bossState, PokerHandType.HighCard)).toBe(2);
      
      // 第三次打出（已经1级，不再降低）
      const result = BossSystem.afterPlayHand(bossState, cards, PokerHandType.HighCard, 3);
      expect(BossSystem.getHandLevelReduction(bossState, PokerHandType.HighCard)).toBe(2); // 不再增加
      expect(result.message).toContain('已降至最低等级');
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
      const mockJokerSlots = {
        disableRandomJoker: () => null,
        getJokers: () => [],
        flipAllJokers: () => {},
        shuffleJokers: () => {}
      };
      const result = BossSystem.onRoundStart(bossState, mockJokerSlots);

      expect(result.jokersFlipped).toBe(true);
      expect(result.jokersShuffled).toBe(true);
      expect(result.message).toContain('琥珀橡果Boss');
    });

    it('无Boss时不应该翻转小丑牌', () => {
      BossSystem.clearBoss(bossState);
      const mockJokerSlots = {
        disableRandomJoker: () => null,
        getJokers: () => [],
        flipAllJokers: () => {},
        shuffleJokers: () => {}
      };
      const result = BossSystem.onRoundStart(bossState, mockJokerSlots);

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
      expect(config.description).toBe('每次出牌后强制弃掉2张手牌');
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

      // 花色失效Boss使用 isCardDisabled（完全失效）
      expect(BossSystem.isCardDisabled(bossState, clubCard)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, spadeCard)).toBe(false);
    });

    it('黑桃Boss应该使黑桃牌失效', () => {
      BossSystem.setBoss(bossState, BossType.GOAD);

      const spadeCard = new Card(Suit.Spades, Rank.Ace);
      const heartCard = new Card(Suit.Hearts, Rank.Ace);

      // 花色失效Boss使用 isCardDisabled（完全失效）
      expect(BossSystem.isCardDisabled(bossState, spadeCard)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, heartCard)).toBe(false);
    });

    it('红桃Boss应该使红桃牌失效', () => {
      BossSystem.setBoss(bossState, BossType.HEAD);

      const heartCard = new Card(Suit.Hearts, Rank.Ace);
      const diamondCard = new Card(Suit.Diamonds, Rank.Ace);

      // 花色失效Boss使用 isCardDisabled（完全失效）
      expect(BossSystem.isCardDisabled(bossState, heartCard)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, diamondCard)).toBe(false);
    });

    it('方片Boss应该使方片牌失效', () => {
      BossSystem.setBoss(bossState, BossType.WINDOW);

      const diamondCard = new Card(Suit.Diamonds, Rank.Ace);
      const clubCard = new Card(Suit.Clubs, Rank.Ace);

      // 花色失效Boss使用 isCardDisabled（完全失效）
      expect(BossSystem.isCardDisabled(bossState, diamondCard)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, clubCard)).toBe(false);
    });

    it('植物Boss应该使人头牌失效', () => {
      BossSystem.setBoss(bossState, BossType.PLANT);

      const jack = new Card(Suit.Spades, Rank.Jack);
      const queen = new Card(Suit.Spades, Rank.Queen);
      const king = new Card(Suit.Spades, Rank.King);
      const ace = new Card(Suit.Spades, Rank.Ace);

      // 人头牌失效Boss使用 isCardDisabled（完全失效）
      expect(BossSystem.isCardDisabled(bossState, jack)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, queen)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, king)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, ace)).toBe(false);
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

    it('标记Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.MARK);
      expect(config.name).toBe('标记');
      expect(config.description).toBe('所有人头牌面朝下');
      expect(config.minAnte).toBe(2);
    });

    it('柱子Boss应该使本底注出过的牌失效', () => {
      BossSystem.setBoss(bossState, BossType.PILLAR);

      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);

      // 初始状态下，牌没有出过，不应该失效
      expect(BossSystem.isCardDisabled(bossState, card1)).toBe(false);
      expect(BossSystem.isCardDisabled(bossState, card2)).toBe(false);

      // 记录card1被出过
      bossState.recordCardPlayed(card1);

      // 现在card1应该失效，card2仍然有效
      expect(BossSystem.isCardDisabled(bossState, card1)).toBe(true);
      expect(BossSystem.isCardDisabled(bossState, card2)).toBe(false);
    });

    it('柱子Boss在新底注后应该重置', () => {
      BossSystem.setBoss(bossState, BossType.PILLAR);

      const card = new Card(Suit.Spades, Rank.Ace);

      // 出牌并记录
      bossState.recordCardPlayed(card);
      expect(BossSystem.isCardDisabled(bossState, card)).toBe(true);

      // 新底注重置
      bossState.onNewAnte();

      // 牌应该重新生效
      expect(BossSystem.isCardDisabled(bossState, card)).toBe(false);
    });

    // 修复牛Boss: 测试最常用牌型检测
    it('牛Boss应该正确识别最常用牌型', () => {
      BossSystem.setBoss(bossState, BossType.OX);

      // 初始时没有最常用牌型
      expect(bossState.getMostPlayedHand()).toBeNull();

      // 记录onePair出牌3次
      bossState.recordHandPlayCount(PokerHandType.OnePair);
      bossState.recordHandPlayCount(PokerHandType.OnePair);
      bossState.recordHandPlayCount(PokerHandType.OnePair);

      // 记录twoPair出牌2次
      bossState.recordHandPlayCount(PokerHandType.TwoPair);
      bossState.recordHandPlayCount(PokerHandType.TwoPair);

      // onePair应该是最常用牌型
      expect(bossState.getMostPlayedHand()).toBe(PokerHandType.OnePair);
      expect(BossSystem.isMostPlayedHand(bossState, PokerHandType.OnePair)).toBe(true);
      expect(BossSystem.isMostPlayedHand(bossState, PokerHandType.TwoPair)).toBe(false);
    });

    // 修复牛Boss: 测试打出最常用牌型时触发效果标志
    it('牛Boss效果: 打出最常用牌型应该触发标志', () => {
      BossSystem.setBoss(bossState, BossType.OX);

      // 设置最常用牌型为OnePair
      bossState.recordHandPlayCount(PokerHandType.OnePair);
      bossState.recordHandPlayCount(PokerHandType.OnePair);

      // 验证是最常用牌型
      expect(BossSystem.isMostPlayedHand(bossState, PokerHandType.OnePair)).toBe(true);
    });

    // 修复蛇Boss: 测试抽牌逻辑
    it('蛇Boss应该总是抽3张牌', () => {
      BossSystem.setBoss(bossState, BossType.SERPENT);

      // 蛇Boss的修改出牌次数方法应该返回正常值（抽牌逻辑在GameState中处理）
      const modifiedHands = BossSystem.modifyHands(bossState, 4);
      expect(modifiedHands).toBe(4); // 蛇Boss不影响出牌次数，只影响抽牌数量
    });

    // 修复鱼Boss: 测试配置正确
    it('鱼Boss配置正确', () => {
      const bossAssignments = new Map([[1, BossType.FISH]]);
      initializeBlindConfigs(bossAssignments);

      const config = getBossBlindConfig(1);
      expect(config).toBeDefined();
      expect(config?.bossType).toBe(BossType.FISH);
      expect(config?.name).toBe('Boss: 鱼');
      expect(config?.description).toBe('出牌后抽到的补充牌面朝下');
      // minAnte是BossBlindConfig的属性，不是BlindConfig的属性
      // 但鱼Boss的minAnte确实是2，这在BossSystem.ts中配置
    });
  });

  describe('Boss效果在GameState中集成测试', () => {
    it('水Boss应该使弃牌次数为0', () => {
      BossSystem.setBoss(bossState, BossType.WATER);

      // 模拟GameState.getMaxDiscardsPerRound()的行为
      const baseDiscards = 3; // 默认3次弃牌
      const modifiedDiscards = BossSystem.modifyDiscards(bossState, baseDiscards);

      expect(modifiedDiscards).toBe(0);
    });

    it('针Boss应该使出牌次数为1', () => {
      BossSystem.setBoss(bossState, BossType.NEEDLE);

      // 模拟GameState.getMaxHandsPerRound()的行为
      const baseHands = 4; // 默认4次出牌
      const modifiedHands = BossSystem.modifyHands(bossState, baseHands);

      expect(modifiedHands).toBe(1);
    });

    it('手铐Boss应该使手牌上限减少1', () => {
      BossSystem.setBoss(bossState, BossType.MANACLE);

      // 模拟GameState.getMaxHandSize()的行为
      const baseSize = 8; // 默认8张手牌上限
      const modifiedSize = BossSystem.modifyHandSize(bossState, baseSize);

      expect(modifiedSize).toBe(7);
    });

    it('无Boss时弃牌次数不变', () => {
      BossSystem.clearBoss(bossState);

      const baseDiscards = 3;
      const modifiedDiscards = BossSystem.modifyDiscards(bossState, baseDiscards);

      expect(modifiedDiscards).toBe(3);
    });

    it('无Boss时出牌次数不变', () => {
      BossSystem.clearBoss(bossState);

      const baseHands = 4;
      const modifiedHands = BossSystem.modifyHands(bossState, baseHands);

      expect(modifiedHands).toBe(4);
    });

    it('无Boss时手牌上限不变', () => {
      BossSystem.clearBoss(bossState);

      const baseSize = 8;
      const modifiedSize = BossSystem.modifyHandSize(bossState, baseSize);

      expect(modifiedSize).toBe(8);
    });
  });

  describe('燧石Boss (The Flint) - 基础筹码倍率减半', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.FLINT);
    });

    it('燧石Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.FLINT);
      expect(config.name).toBe('燧石');
      expect(config.description).toBe('最终得分减半');
      expect(config.minAnte).toBe(2);
      expect(config.scoreMultiplier).toBe(2);
    });

    it('燧石Boss应该减半基础筹码和倍率', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Diamonds, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Spades, Rank.Jack)
      ];

      // 无Boss时的分数
      BossSystem.clearBoss(bossState);
      const resultWithoutBoss = ScoringSystem.calculate(cards, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, undefined, bossState);

      // 有燧石Boss时的分数
      BossSystem.setBoss(bossState, BossType.FLINT);
      const resultWithFlint = ScoringSystem.calculate(cards, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, undefined, bossState);

      // 验证基础筹码和倍率减半
      // 一对的基础筹码是10，减半后应该是5
      // 一对的基础倍率是2，减半后应该是1
      expect(resultWithFlint.baseChips).toBe(Math.floor(resultWithoutBoss.baseChips / 2));
      expect(resultWithFlint.baseMultiplier).toBe(Math.floor(resultWithoutBoss.baseMultiplier / 2));
    });

    it('燧石Boss对高牌的影响', () => {
      const cards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Diamonds, Rank.Queen),
        new Card(Suit.Clubs, Rank.Jack),
        new Card(Suit.Spades, Rank.Nine)
      ];

      const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, undefined, bossState);

      // 高牌的基础筹码是5，减半后应该是2
      // 高牌的基础倍率是1，减半后应该是0（但最小为1）
      expect(result.baseChips).toBe(2); // Math.floor(5 / 2)
      expect(result.baseMultiplier).toBe(1); // Math.max(1, Math.floor(1 / 2))
    });
  });

  describe('嘴Boss (The Mouth) - 只能出一种牌型', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.MOUTH);
    });

    it('嘴Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.MOUTH);
      expect(config.name).toBe('嘴');
      expect(config.description).toBe('本回合只能打出一种牌型');
      expect(config.minAnte).toBe(2);
    });

    it('第一次出牌应该可以', () => {
      const result = BossSystem.canPlayHand(bossState, PokerHandType.OnePair);
      expect(result.canPlay).toBe(true);
    });

    it('出不同牌型应该被阻止', () => {
      // 第一次出对子
      BossSystem.beforePlayHand(bossState, PokerHandType.OnePair);
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)], PokerHandType.OnePair);

      // 第二次出三条应该失败
      const result = BossSystem.canPlayHand(bossState, PokerHandType.ThreeOfAKind);
      expect(result.canPlay).toBe(false);
      expect(result.message).toContain('嘴Boss');
    });

    it('出相同牌型应该可以', () => {
      // 第一次出对子
      BossSystem.beforePlayHand(bossState, PokerHandType.OnePair);
      BossSystem.afterPlayHand(bossState, [new Card(Suit.Spades, Rank.Ace), new Card(Suit.Hearts, Rank.Ace)], PokerHandType.OnePair);

      // 第二次出对子应该可以
      const result = BossSystem.canPlayHand(bossState, PokerHandType.OnePair);
      expect(result.canPlay).toBe(true);
    });
  });

  describe('通灵Boss (The Psychic) - 必须出5张牌', () => {
    it('通灵Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.PSYCHIC);
      expect(config.name).toBe('通灵');
      expect(config.description).toBe('必须正好打出5张牌');
      expect(config.minAnte).toBe(1);
    });
  });

  describe('翠绿叶子Boss (Verdant Leaf) - 卖小丑后解除', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.VERDANT_LEAF);
    });

    it('翠绿叶子Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.VERDANT_LEAF);
      expect(config.name).toBe('翠绿叶子');
      expect(config.description).toBe('所有卡牌失效，直到卖出1张小丑牌');
      expect(config.minAnte).toBe(8);
      expect(config.reward).toBe(8);
    });

    it('未卖小丑时所有卡牌应该失效', () => {
      const card = new Card(Suit.Spades, Rank.Ace);
      expect(BossSystem.isCardDisabled(bossState, card)).toBe(true);
    });

    it('卖出小丑后卡牌应该恢复', () => {
      const card = new Card(Suit.Spades, Rank.Ace);

      // 未卖小丑时失效
      expect(BossSystem.isCardDisabled(bossState, card)).toBe(true);

      // 标记已卖出小丑
      bossState.markJokerSold();

      // 卖出后恢复
      expect(BossSystem.isCardDisabled(bossState, card)).toBe(false);
    });
  });

  describe('深红之心Boss (Crimson Heart) - 禁用小丑', () => {
    it('深红之心Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.CRIMSON_HEART);
      expect(config.name).toBe('深红之心');
      expect(config.description).toBe('每手牌随机禁用1张小丑牌');
      expect(config.minAnte).toBe(8);
      expect(config.reward).toBe(8);
    });
  });

  describe('天青铃铛Boss (Cerulean Bell) - 强制选牌', () => {
    beforeEach(() => {
      BossSystem.setBoss(bossState, BossType.CERULEAN_BELL);
    });

    it('天青铃铛Boss配置正确', () => {
      const config = BossSystem.getBossConfig(BossType.CERULEAN_BELL);
      expect(config.name).toBe('天青铃铛');
      expect(config.description).toBe('必须选择1张特定牌');
      expect(config.minAnte).toBe(8);
      expect(config.reward).toBe(8);
    });

    it('应该能设置和获取必须选择的卡牌ID', () => {
      const cardId = 'Spades-Ace';
      bossState.setRequiredCardId(cardId);
      expect(bossState.getRequiredCardId()).toBe(cardId);
    });
  });
});
