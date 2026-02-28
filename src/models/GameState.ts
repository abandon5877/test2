import { Blind } from './Blind';
import type { Card } from './Card';
import { Card as CardClass } from './Card';
import { Hand } from './Hand';
import { Shop } from './Shop';
import { GamePhase, BlindType, BossType, type GameStateInterface, type GameConfig, DEFAULT_GAME_CONFIG, type RoundStats } from '../types/game';
import { ScoringSystem, type ScoreResult } from '../systems/ScoringSystem';
import { JokerSystem } from '../systems/JokerSystem';
import { CardManager } from '../systems/CardManager';
import { ConsumableManager } from '../systems/ConsumableManager';
import { ConsumableSlots } from './ConsumableSlots';
import { JokerSlots } from './JokerSlots';
import { HandLevelState } from './HandLevelState';
import { CardPile } from './CardPile';
import { BossSelectionState } from './BossSelectionState';
import { BossState } from './BossState';
import { BossSelectionSystem, BossRerollResult } from '../systems/BossSelectionSystem';
import { BossSystem } from '../systems/BossSystem';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { SealSystem } from '../systems/SealSystem';
import { initializeBlindConfigs, resetBlindConfigs } from '../data/blinds';
import { ConsumableDataManager } from '../data/ConsumableDataManager';
import { getConsumableById, getPlanetConsumableByHandType } from '../data/consumables';
import type { JokerInterface } from '../types/joker';
import type { ConsumableInterface } from '../types/consumable';
import { getJokerById, resetGrosMichelDestroyed } from '../data/jokers';
import { CardEnhancement, SealType, Suit, Rank, CardEdition } from '../types/card';
import { ConsumableType } from '../types/consumable';
import { PokerHandType } from '../types/pokerHands';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('GameState');

export class GameState implements GameStateInterface {
  phase: GamePhase = GamePhase.BLIND_SELECT;
  cardPile: CardPile;
  currentBlind: Blind | null = null;
  ante: number = 1;
  money: number = 4;
  handsRemaining: number = 4;
  discardsRemaining: number = 3;
  currentScore: number = 0;
  roundScore: number = 0;

  get jokers(): readonly JokerInterface[] {
    return this.jokerSlots.getJokers();
  }

  get consumables(): readonly ConsumableInterface[] {
    return this.consumableSlots.getConsumables();
  }

  shop: Shop | null = null;
  currentPack: {
    pack: any;
    revealedCards: any[];
  } | null = null;

  private config: GameConfig;
  private roundStats: RoundStats;
  private playedHandTypes: Set<string> = new Set();
  private handTypeHistory: Map<string, number> = new Map(); // 牌型历史统计（用于Supernova）
  private lastPlayedHandType: PokerHandType | null = null; // 最后打出的牌型（用于蓝色蜡封）
  private lastPlayScore: number = 0;
  private skippedBlinds: Set<string> = new Set();
  private currentBlindPosition: BlindType = BlindType.SMALL_BLIND;
  jokerSlots: JokerSlots;
  consumableSlots: ConsumableSlots;
  handLevelState: HandLevelState;
  bossSelectionState: BossSelectionState;
  bossState: BossState;
  private globalCounters: {
    totalHandsPlayed: number;
    totalDiscardsUsed: number;
  };
  private extraHandSizeFromVouchers: number = 0;
  private extraHandsFromVouchers: number = 0;
  private extraDiscardsFromVouchers: number = 0;
  private anteDownFromVouchers: number = 0; // 象形文字优惠券减少的底注
  lastUsedConsumable: { id: string; type: ConsumableType } | null = null;
  isEndlessMode: boolean = false; // 无尽模式标志

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.cardPile = new CardPile(this.config.maxHandSize);
    this.roundStats = this.createEmptyRoundStats();
    this.jokerSlots = new JokerSlots(5);
    this.consumableSlots = new ConsumableSlots(2);
    this.handLevelState = new HandLevelState();
    this.bossSelectionState = new BossSelectionState();
    this.bossState = new BossState();
    this.globalCounters = {
      totalHandsPlayed: 0,
      totalDiscardsUsed: 0
    };
    logger.info('GameState initialized', { config: this.config });
  }

  startNewGame(): void {
    logger.info('Starting new game');
    this.phase = GamePhase.BLIND_SELECT;
    this.currentBlind = null;
    this.ante = this.config.startingAnte;
    this.money = this.config.startingMoney;
    this.currentScore = 0;
    this.roundScore = 0;
    this.consumableSlots = new ConsumableSlots(2);
    this.handLevelState = new HandLevelState();
    this.roundStats = this.createEmptyRoundStats();
    this.playedHandTypes.clear();
    this.handTypeHistory.clear();
    this.lastPlayedHandType = null;
    this.lastPlayScore = 0;
    this.skippedBlinds.clear();
    this.currentBlindPosition = BlindType.SMALL_BLIND;
    this.jokerSlots.clear();
    this.globalCounters = {
      totalHandsPlayed: 0,
      totalDiscardsUsed: 0
    };
    // 先重置优惠券效果，再计算手牌和出牌次数
    this.extraHandSizeFromVouchers = 0;
    this.extraHandsFromVouchers = 0;
    this.extraDiscardsFromVouchers = 0;
    this.anteDownFromVouchers = 0;
    // 重置后再初始化CardPile和计算剩余次数
    this.cardPile = new CardPile(this.getMaxHandSize());
    this.cardPile.deck.shuffle();
    this.handsRemaining = this.getMaxHandsPerRound();
    this.discardsRemaining = this.getMaxDiscardsPerRound();

    // 重置Boss选择状态并初始化盲注配置
    this.bossSelectionState.reset();
    this.bossState.clearBoss();
    this.initializeBlindConfigsForNewGame();

    // 重置大麦克自毁状态（新游戏时卡文迪什被锁定）
    resetGrosMichelDestroyed();

    logger.info('New game started', { ante: this.ante, money: this.money });
  }

  /**
   * 初始化盲注配置，为每个底注的Boss盲注随机选择Boss
   */
  private initializeBlindConfigsForNewGame(): void {
    resetBlindConfigs();
    
    const bossAssignments = new Map<number, BossType>();
    const maxAnte = 8; // 最大底注
    
    for (let ante = 1; ante <= maxAnte; ante++) {
      const result = BossSelectionSystem.selectBoss(this.bossSelectionState, ante);
      bossAssignments.set(ante, result.bossType);
      logger.info('Boss assigned for ante', { ante, bossType: result.bossType });
    }
    
    initializeBlindConfigs(bossAssignments);
    logger.info('Blind configs initialized for new game');
  }

  selectBlind(blindType: BlindType): boolean {
    logger.debug('Selecting blind', { blindType, currentPhase: this.phase });
    if (this.phase !== GamePhase.BLIND_SELECT) {
      logger.warn('Cannot select blind: not in BLIND_SELECT phase', { currentPhase: this.phase });
      return false;
    }

    if (blindType !== this.currentBlindPosition) {
      logger.warn('Cannot select blind: wrong position', { blindType, currentPosition: this.currentBlindPosition });
      return false;
    }

    const effectiveAnte = this.getAnte();
    const blind = Blind.create(effectiveAnte, blindType);
    if (!blind) {
      logger.error('Failed to create blind', { ante: effectiveAnte, blindType });
      return false;
    }

    // 如果是Boss盲注，设置当前Boss
    // 传入小丑牌列表，检查是否有奇科（Chicot）让Boss能力无效
    if (blindType === BlindType.BOSS_BLIND && blind.bossType) {
      BossSystem.setBoss(this.bossState, blind.bossType, this.jokerSlots.getJokers());
      logger.info('Boss blind selected', { bossType: blind.bossType });
    } else {
      BossSystem.clearBoss(this.bossState);
    }

    // 盲注结束，将手牌和弃牌堆洗回发牌堆
    this.cardPile.returnToDeckAndShuffle();

    // 修复：保留当前牌库状态，不要重新初始化 CardPile
    // 重新初始化会导致通过DNA等效果添加的卡牌丢失
    // 只需要清空手牌，保留牌库中的卡牌

    this.currentBlind = blind;
    this.phase = GamePhase.PLAYING;
    this.roundScore = 0;
    this.handsRemaining = this.getMaxHandsPerRound();
    this.discardsRemaining = this.getMaxDiscardsPerRound();
    this.roundStats = this.createEmptyRoundStats();
    this.playedHandTypes.clear();
    this.lastPlayedHandType = null;

    // 处理证书 (Certificate) 效果：回合开始前将带印章的牌放入牌库顶部
    // 这样发牌时就能抽到手牌中
    this.handleCertificateEffect();

    this.dealInitialHand();

    // 处理Boss回合开始效果（深红之心、天青铃铛等）
    const handCards = this.cardPile.hand.getCards();
    // 清除之前的禁用状态
    this.jokerSlots.clearAllDisabled();
    const roundStartResult = BossSystem.onRoundStart(this.bossState, this.jokerSlots, handCards);

    // 处理邮寄返利 (Mail-In Rebate) 效果：每回合从牌组随机选择目标点数
    this.updateMailInRebateTargetRank();

    // 处理选择盲注时的小丑牌效果（ON_BLIND_SELECT触发器）
    const blindSelectResult = JokerSystem.processBlindSelect(this.jokerSlots, blindType, this.consumableSlots);

    // 应用盲注选择效果（如额外塔罗牌、星球牌等）
    if (blindSelectResult.tarotBonus > 0) {
      for (let i = 0; i < blindSelectResult.tarotBonus; i++) {
        this.consumableSlots.addConsumable(ConsumableDataManager.getRandomByType(ConsumableType.TAROT));
      }
    }
    if (blindSelectResult.jokerBonus > 0) {
      // 生成小丑牌逻辑（如果有）
    }

    // 修复窃贼效果：应用handBonus和discardReset
    if (blindSelectResult.handBonus > 0) {
      this.handsRemaining += blindSelectResult.handBonus;
      logger.debug('窃贼效果: +3出牌次数', { handsRemaining: this.handsRemaining });
    }
    if (blindSelectResult.discardReset) {
      this.discardsRemaining = 0;
      logger.debug('窃贼效果: 弃牌次数归零', { discardsRemaining: this.discardsRemaining });
    }

    logger.info('Blind selected', {
      blindType,
      targetScore: blind.targetScore,
      hands: this.handsRemaining,
      discards: this.discardsRemaining,
      jokerEffects: blindSelectResult.effects.length
    });
    return true;
  }

  getCurrentBlindPosition(): BlindType {
    return this.currentBlindPosition;
  }

  skipBlind(): boolean {
    logger.debug('Skipping blind', { position: this.currentBlindPosition });
    if (this.phase !== GamePhase.BLIND_SELECT) {
      logger.warn('Cannot skip blind: not in BLIND_SELECT phase');
      return false;
    }

    const effectiveAnte = this.getAnte();
    const blindToSkip = Blind.create(effectiveAnte, this.currentBlindPosition);

    if (!blindToSkip) {
      logger.error('Failed to create blind to skip');
      return false;
    }

    if (!blindToSkip.canSkipBlind()) {
      logger.warn('Cannot skip blind: boss blind cannot be skipped');
      return false;
    }

    const skipKey = `${effectiveAnte}-${blindToSkip.type}`;
    if (this.skippedBlinds.has(skipKey)) {
      logger.warn('Cannot skip blind: already skipped this blind');
      return false;
    }

    const reward = blindToSkip.getSkipReward();
    this.skippedBlinds.add(skipKey);
    this.money += reward;
    logger.info('Blind skipped', {
      blindType: blindToSkip.type,
      reward,
      newMoney: this.money
    });

    // 更新Throwback状态：每跳过盲注，Throwback的blindsSkipped+1
    this.updateThrowbackOnBlindSkipped();

    this.advanceBlindPosition();
    return true;
  }

  /**
   * 更新Throwback状态：当盲注被跳过时
   */
  private updateThrowbackOnBlindSkipped(): void {
    this.jokerSlots.updateBlindsSkipped();
  }

  /**
   * 更新邮寄返利 (Mail-In Rebate) 的目标点数
   * 每回合从牌组中随机选择一个点数
   */
  private updateMailInRebateTargetRank(): void {
    // 获取牌组中的所有牌
    const deckCards = this.cardPile.deck.getCards();
    const handCards = this.cardPile.hand.getCards();
    const discardCards = this.cardPile.discard.getCards();

    // 合并所有牌（牌组+手牌+弃牌堆）
    const allCards = [...deckCards, ...handCards, ...discardCards];

    if (allCards.length === 0) {
      return;
    }

    // 获取所有可用的点数
    const availableRanks = allCards.map(card => card.rank);

    // 随机选择一个点数
    const randomRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];

    // 更新所有邮寄返利小丑牌的目标点数
    const jokers = this.jokerSlots.getJokers();
    for (const joker of jokers) {
      if (joker.id === 'mail_in_rebate') {
        joker.updateState({ targetRank: randomRank });
        logger.info('Mail-In Rebate target rank updated', { targetRank: randomRank });
      }
    }
  }

  private advanceBlindPosition(): void {
    if (this.currentBlindPosition === BlindType.SMALL_BLIND) {
      this.currentBlindPosition = BlindType.BIG_BLIND;
    } else if (this.currentBlindPosition === BlindType.BIG_BLIND) {
      this.currentBlindPosition = BlindType.BOSS_BLIND;
    } else if (this.currentBlindPosition === BlindType.BOSS_BLIND) {
      this.ante++;
      this.currentBlindPosition = BlindType.SMALL_BLIND;
      // 进入新底注，清除Boss状态（与advanceBlindPositionAfterComplete保持一致）
      BossSystem.clearBoss(this.bossState);
      // 触发新底注开始的事件
      BossSystem.onNewAnte(this.bossState);
      // 重置Boss重掷次数（与advanceBlindPositionAfterComplete保持一致）
      this.bossSelectionState.resetBossRerollCount();
      logger.info('New ante started (via skip), boss reroll count reset', { ante: this.ante });
      if (this.ante > 8 && !this.isEndlessMode) {
        this.phase = GamePhase.GAME_OVER;
      } else {
        this.phase = GamePhase.SHOP;
      }
    }
  }

  playHand(): ScoreResult | null {
    if (!this.canPlayHand()) {
      logger.warn('Cannot play hand: conditions not met', { 
        phase: this.phase, 
        handsRemaining: this.handsRemaining,
        selectedCount: this.cardPile.hand.getSelectedIndices().size 
      });
      return null;
    }

    const selectedCards = this.cardPile.hand.getSelectedCards();
    if (selectedCards.length === 0) {
      logger.warn('Cannot play hand: no cards selected');
      return null;
    }

    if (selectedCards.length > 5) {
      logger.warn('Cannot play hand: too many cards selected', { count: selectedCards.length });
      return null;
    }

    logger.info('Playing hand', {
      cardCount: selectedCards.length,
      cards: selectedCards.map(c => c.toString()),
      handsRemaining: this.handsRemaining
    });

    // 检测牌型
    const handResult = PokerHandDetector.detect(selectedCards);

    // 记录牌型出牌次数（用于方尖碑等统计最常出牌型）
    BossSystem.beforePlayHand(this.bossState, handResult.handType);

    const gameState = {
      money: this.money,
      interestCap: this.getInterestCap(),
      hands: this.handsRemaining,
      discards: this.discardsRemaining
    };
    
    const heldCards = this.cardPile.hand.getCards().filter((_, index) => 
      !this.cardPile.hand.getSelectedIndices().has(index)
    );
    
    // 获取牌库信息（用于侵蚀效果）
    // 侵蚀效果：当整副牌的总数少于初始数量（52张）时，每张缺少的牌+4倍率
    const currentTotalCards = this.cardPile.totalCount;
    const initialDeckSize = 52; // 标准牌组初始大小

    // 获取当前回合统计（用于小丑牌效果）
    const handsPlayed = this.roundStats.handsPlayed;
    const discardsUsed = this.roundStats.discardsUsed;
    const cardsDiscarded = this.roundStats.cardsDiscarded;
    const handsRemaining = this.handsRemaining;

    // 获取最常出的牌型（用于方尖碑）
    const mostPlayedHand = this.bossState.getMostPlayedHand();

    // 先检测牌型，获取历史统计（用于Supernova）
    const tempScoreResult = ScoringSystem.calculate(selectedCards);
    const handTypeHistoryCount = this.getHandTypeHistoryCount(tempScoreResult.handType);

    const scoreResult = ScoringSystem.calculate(selectedCards, undefined, gameState, heldCards, this.jokerSlots, currentTotalCards, initialDeckSize, handsPlayed, discardsUsed, handsRemaining, mostPlayedHand, handTypeHistoryCount, false, this.handLevelState, this.bossState, cardsDiscarded);

    this.playedHandTypes.add(scoreResult.handType);
    // 更新最后打出的牌型（用于蓝色蜡封）
    this.lastPlayedHandType = scoreResult.handType as PokerHandType;
    // 更新牌型历史统计（用于Supernova）
    const currentCount = this.handTypeHistory.get(scoreResult.handType) || 0;
    this.handTypeHistory.set(scoreResult.handType, currentCount + 1);
    // 更新BossState的牌型统计（用于Obelisk）
    this.bossState.recordHandPlayCount(scoreResult.handType as PokerHandType);
    this.lastPlayScore = scoreResult.totalScore;
    this.roundScore += scoreResult.totalScore;
    this.currentScore += scoreResult.totalScore;
    this.handsRemaining--;

    this.roundStats.handsPlayed++;
    this.roundStats.cardsPlayed += selectedCards.length;
    this.globalCounters.totalHandsPlayed++;
    if (scoreResult.totalScore > this.roundStats.highestHandScore) {
      this.roundStats.highestHandScore = scoreResult.totalScore;
    }

    // 处理计分时的金钱奖励（幸运牌、金牌蜡封、小丑牌等）
    if (scoreResult.moneyBonus && scoreResult.moneyBonus > 0) {
      this.money += scoreResult.moneyBonus;
      logger.info('计分金钱奖励', { moneyBonus: scoreResult.moneyBonus, newMoney: this.money });
    }

    // 处理DNA效果：复制计分牌到卡组
    // 修复：支持多次复制（蓝图+DNA组合）
    if (scoreResult.copyScoredCardToDeck && scoreResult.copyScoredCardToDeck > 0 && scoreResult.scoringCards.length > 0) {
      const cardToCopy = scoreResult.scoringCards[0];
      for (let i = 0; i < scoreResult.copyScoredCardToDeck; i++) {
        const copiedCard = cardToCopy.clone();
        this.addCardToDeck(copiedCard, 'bottom');
      }
      logger.info('DNA effect: Cards copied to deck', { card: cardToCopy.toString(), count: scoreResult.copyScoredCardToDeck });
    }

    // 处理第六感摧毁计分牌效果
    if (scoreResult.destroyScoredCards && selectedCards.length > 0) {
      logger.info('第六感效果：摧毁计分牌', { count: selectedCards.length });

      // 更新卡尼奥的摧毁人头牌计数
      const canioJoker = this.jokerSlots.getActiveJokers().find(j => j.id === 'canio');
      if (canioJoker) {
        const destroyedFaceCards = selectedCards.filter(card => card.isFaceCard);
        if (destroyedFaceCards.length > 0) {
          const currentCount = canioJoker.getState().destroyedFaceCards || 0;
          canioJoker.updateState({ destroyedFaceCards: currentCount + destroyedFaceCards.length });
          logger.info('卡尼奥更新摧毁人头牌计数（第六感）', { destroyedCount: destroyedFaceCards.length, totalCount: currentCount + destroyedFaceCards.length });
        }
      }

      // 摧毁所有打出的牌（不移动到弃牌堆）
      this.cardPile.hand.removeCards(Array.from(this.cardPile.hand.getSelectedIndices()));
    }
    // 将打出的牌移到弃牌堆
    else if (scoreResult.destroyedCards && scoreResult.destroyedCards.length > 0) {
      logger.info('Glass cards destroyed', { count: scoreResult.destroyedCards.length });
      this.cardPile.playSelected(scoreResult.destroyedCards);

      // 更新Glass Joker（玻璃小丑）的状态
      const glassJokers = this.jokerSlots.getActiveJokers().filter(j => j.id === 'glass_joker');
      for (const glassJoker of glassJokers) {
        const currentBroken = (glassJoker.state?.brokenCount as number) || 0;
        const newBroken = currentBroken + scoreResult.destroyedCards.length;
        glassJoker.updateState({ brokenCount: newBroken });
        logger.info('Glass Joker updated', { brokenCount: newBroken });
      }

      // 更新卡尼奥的摧毁人头牌计数
      const canioJoker = this.jokerSlots.getActiveJokers().find(j => j.id === 'canio');
      if (canioJoker) {
        const destroyedFaceCards = scoreResult.destroyedCards.filter(card => card.isFaceCard);
        if (destroyedFaceCards.length > 0) {
          const currentCount = canioJoker.getState().destroyedFaceCards || 0;
          canioJoker.updateState({ destroyedFaceCards: currentCount + destroyedFaceCards.length });
          logger.info('卡尼奥更新摧毁人头牌计数', { destroyedCount: destroyedFaceCards.length, totalCount: currentCount + destroyedFaceCards.length });
        }
      }
    } else {
      this.cardPile.playSelected();
    }

    // 记录已出的牌（用于柱子Boss效果）并处理Boss效果
    // 修复手臂Boss: 传入当前牌型等级，确保不会降到1级以下
    const currentHandLevel = this.handLevelState.getHandLevel(scoreResult.handType).level;
    const bossResult = BossSystem.afterPlayHand(this.bossState, selectedCards, scoreResult.handType, currentHandLevel);

    // 处理牙齿Boss扣钱效果
    if (bossResult.moneyChange && bossResult.moneyChange < 0) {
      this.money += bossResult.moneyChange;
      logger.info('牙齿Boss扣钱', { moneyChange: bossResult.moneyChange, newMoney: this.money });
    }

    // 修复牛Boss: 处理打出最常用牌型时金钱归零效果
    if (scoreResult.isOxMostPlayedHand) {
      const oldMoney = this.money;
      this.money = 0;
      logger.info('牛Boss效果: 打出最常用牌型，金钱归零', { oldMoney, newMoney: this.money });
    }

    // 处理钩子Boss弃牌效果
    if (bossResult.discardCount && bossResult.discardCount > 0) {
      const handCards = this.cardPile.hand.getCards();
      const discardIndices: number[] = [];
      // 随机选择指定数量的手牌弃掉
      const availableIndices = handCards.map((_, i) => i);
      for (let i = 0; i < bossResult.discardCount && availableIndices.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        discardIndices.push(availableIndices[randomIndex]);
        availableIndices.splice(randomIndex, 1);
      }
      if (discardIndices.length > 0) {
        this.cardPile.hand.removeCards(discardIndices);
        logger.info('钩子Boss弃牌', { discardCount: discardIndices.length, indices: discardIndices });
      }
    }

    // 处理斗牛士效果：如果Boss效果被触发，给予$8
    const isBossTriggered = bossResult.handTypeDowngraded ||
                           bossResult.moneyChange ||
                           bossResult.discardCount ||
                           bossResult.cardsDebuffed;
    if (isBossTriggered) {
      const jokerResult = JokerSystem.processIndependent(this.jokerSlots, this.cardPile.hand.getCards(), true);
      if (jokerResult.moneyBonus > 0) {
        this.money += jokerResult.moneyBonus;
        logger.info('斗牛士效果触发', { moneyBonus: jokerResult.moneyBonus, newMoney: this.money });
      }
    }

    // 抽牌 - 考虑蛇Boss限制
    const currentBoss = this.bossState.getCurrentBoss();
    if (currentBoss === BossType.SERPENT) {
      // 修复蛇Boss: 总是抽3张牌，忽略手牌上限
      this.drawCards(3, { ignoreHandSize: true });
    } else {
      // 修复火祭: 抽牌时补充到手牌满，处理火祭摧毁手牌后的情况
      // 修复鱼Boss: 使用drawCards方法确保新抽的牌翻面
      const cardsNeeded = this.cardPile.hand.maxHandSize - this.cardPile.hand.count;
      if (cardsNeeded > 0) {
        this.drawCards(cardsNeeded);
      }
    }

    logger.info('Hand played', { 
      handType: scoreResult.handType,
      totalScore: scoreResult.totalScore,
      roundScore: this.roundScore,
      targetScore: this.currentBlind?.targetScore,
      handsRemaining: this.handsRemaining
    });

    if (this.handsRemaining === 0 && !this.isRoundWon()) {
      // 检查骨头先生 (Mr. Bones) 效果：防止在25%以下死亡
      if (this.canPreventDeath()) {
        const targetScore = this.currentBlind?.targetScore ?? 0;
        const percentage = (this.roundScore / targetScore) * 100;
        logger.info('Mr. Bones prevented death', { roundScore: this.roundScore, targetScore, percentage: percentage.toFixed(1) + '%' });
        // 骨头先生效果触发，进入商店但不推进盲注
        this.enterShopAfterBonesSave();
      } else {
        logger.warn('Out of hands, game over');
        this.phase = GamePhase.GAME_OVER;
      }
    }

    return scoreResult;
  }

  discardCards(): { discardedCards: Card[]; tarotGenerated: number } | null {
    if (!this.canDiscard()) {
      logger.warn('Cannot discard: conditions not met', { 
        phase: this.phase, 
        discardsRemaining: this.discardsRemaining 
      });
      return null;
    }

    const selectedCards = this.cardPile.hand.getSelectedCards();
    if (selectedCards.length === 0) {
      logger.warn('Cannot discard: no cards selected');
      return null;
    }

    logger.info('Discarding cards', { 
      count: selectedCards.length,
      cards: selectedCards.map(c => c.toString()),
      discardsRemaining: this.discardsRemaining 
    });

    this.discardsRemaining--;
    // 修复：在自增前获取discardsUsed，这样第一次弃牌时值为0
    const discardsUsed = this.roundStats.discardsUsed;
    this.roundStats.discardsUsed++;
    this.globalCounters.totalDiscardsUsed++;
    this.roundStats.cardsDiscarded += selectedCards.length;

    // 将丢弃的牌移到弃牌堆
    const discardedCards = this.cardPile.discardSelected();

    // 处理弃牌时的小丑牌效果（ON_DISCARD触发器）
    // 修复：传入handsPlayed（已出牌次数）和discardsUsed（已弃牌次数）
    const handsPlayed = this.roundStats.handsPlayed;
    const discardResult = JokerSystem.processDiscard(
      this.jokerSlots,
      discardedCards,
      handsPlayed,
      discardsUsed
    );

    // 应用弃牌效果（如额外金钱等）
    if (discardResult.moneyBonus > 0) {
      this.money += discardResult.moneyBonus;
    }

    // 修复交易卡：处理摧毁弃牌效果
    if (discardResult.destroyDiscardedCard && discardedCards.length > 0) {
      // 将弃牌从弃牌堆中移除（摧毁）
      for (const card of discardedCards) {
        this.cardPile.removeFromDiscard(card);
      }
      logger.info('交易卡效果：摧毁弃牌', { count: discardedCards.length });

      // 更新卡尼奥的摧毁人头牌计数
      const canioJoker = this.jokerSlots.getActiveJokers().find(j => j.id === 'canio');
      if (canioJoker) {
        const destroyedFaceCards = discardedCards.filter(card => card.isFaceCard);
        if (destroyedFaceCards.length > 0) {
          const currentCount = canioJoker.getState().destroyedFaceCards || 0;
          canioJoker.updateState({ destroyedFaceCards: currentCount + destroyedFaceCards.length });
          logger.info('卡尼奥更新摧毁人头牌计数（交易卡）', { destroyedCount: destroyedFaceCards.length, totalCount: currentCount + destroyedFaceCards.length });
        }
      }
    }

    // 修复烧焦的小丑：处理升级牌型效果
    if (discardResult.upgradeHandType) {
      // 获取当前手牌类型并升级
      const playedCards = this.cardPile.hand.getCards();
      if (playedCards.length > 0) {
        const handType = PokerHandDetector.detect(playedCards).handType;
        this.handLevelState.upgradeHand(handType);
        logger.info('烧焦的小丑效果：升级牌型', { handType });
      }
    }

    // 处理紫色蜡封：弃牌时生成塔罗牌（每张紫色蜡封生成一张）
    let tarotGenerated = 0;
    const sealEffects = SealSystem.calculateSealsForCards(discardedCards, false, true);
    for (let i = 0; i < sealEffects.tarotCount; i++) {
      const tarotCard = ConsumableDataManager.getRandomByType(ConsumableType.TAROT);
      if (this.consumableSlots.hasAvailableSlot()) {
        this.consumableSlots.addConsumable(tarotCard);
        tarotGenerated++;
        logger.info('紫色蜡封效果：生成塔罗牌', { tarotCard: tarotCard.name, index: i + 1, total: sealEffects.tarotCount });
      } else {
        logger.info('紫色蜡封效果：消耗品槽位已满，无法生成塔罗牌', { index: i + 1, total: sealEffects.tarotCount });
        break;
      }
    }

    // 抽牌 - 考虑蛇Boss限制
    const currentBoss = this.bossState.getCurrentBoss();
    if (currentBoss === BossType.SERPENT) {
      // 修复蛇Boss: 总是抽3张牌，忽略手牌上限
      this.drawCards(3, { ignoreHandSize: true });
    } else {
      // 修复火祭: 抽牌时补充到手牌满，处理火祭摧毁手牌后的情况
      // 修复鱼Boss: 使用drawCards方法确保新抽的牌翻面
      const cardsNeeded = this.cardPile.hand.maxHandSize - this.cardPile.hand.count;
      if (cardsNeeded > 0) {
        this.drawCards(cardsNeeded);
      }
    }

    logger.info('Cards discarded', {
      count: discardedCards.length,
      discardsRemaining: this.discardsRemaining,
      jokerEffects: discardResult.effects.length,
      moneyBonus: discardResult.moneyBonus,
      tarotGenerated
    });

    return { discardedCards, tarotGenerated };
  }

  canPlayHand(): boolean {
    if (
      this.phase !== GamePhase.PLAYING ||
      this.handsRemaining <= 0 ||
      this.cardPile.hand.getSelectionCount() <= 0
    ) {
      return false;
    }

    // 检查 Boss 限制
    const selectedCards = this.cardPile.hand.getSelectedCards();
    if (selectedCards.length > 0) {
      const handResult = PokerHandDetector.detect(selectedCards);
      const bossResult = BossSystem.canPlayHand(this.bossState, handResult.handType);
      if (bossResult.canPlay === false) {
        logger.warn('Boss restriction prevents playing hand', {
          boss: this.bossState.getCurrentBoss(),
          handType: handResult.handType,
          message: bossResult.message
        });
        return false;
      }

      // 通灵Boss: 必须正好打出5张牌
      const currentBoss = this.bossState.getCurrentBoss();
      if (currentBoss === BossType.PSYCHIC && selectedCards.length !== 5) {
        logger.warn('通灵Boss: 必须正好打出5张牌', { selectedCount: selectedCards.length });
        return false;
      }

      // 天青铃铛Boss: 必须选择特定牌
      if (currentBoss === BossType.CERULEAN_BELL) {
        const requiredCardId = this.bossState.getRequiredCardId();
        if (requiredCardId) {
          const hasRequiredCard = selectedCards.some(card => card.toString() === requiredCardId);
          if (!hasRequiredCard) {
            logger.warn('天青铃铛Boss: 必须选择特定牌', { requiredCardId });
            return false;
          }
        }
      }
    }

    return true;
  }

  canDiscard(): boolean {
    return (
      this.phase === GamePhase.PLAYING &&
      this.discardsRemaining > 0 &&
      this.cardPile.hand.getSelectionCount() > 0
    );
  }

  isRoundComplete(): boolean {
    if (!this.currentBlind) {
      return false;
    }

    if (this.roundScore >= this.currentBlind.targetScore) {
      return true;
    }

    if (this.handsRemaining === 0) {
      return true;
    }

    return false;
  }

  isRoundWon(): boolean {
    if (!this.currentBlind) {
      return false;
    }
    return this.roundScore >= this.currentBlind.targetScore;
  }

  completeBlind(): void {
    if (!this.isRoundWon()) {
      logger.warn('Cannot complete blind: round not won', {
        roundScore: this.roundScore,
        targetScore: this.currentBlind?.targetScore
      });
      return;
    }

    const blindReward = this.currentBlind?.reward ?? 0;
    const handsRemainingReward = this.handsRemaining;

    const heldCards = this.cardPile.hand.getCards();
    const goldCardCount = heldCards.filter(
      card => card.enhancement === CardEnhancement.Gold
    ).length;
    const goldBonus = goldCardCount * 3;
    if (goldBonus > 0) {
      this.money += goldBonus;
      logger.info('Gold bonus applied', { goldBonus, goldCardCount });
    }

    this.money += handsRemainingReward;
    this.money += blindReward;

    // 处理回合结束时的小丑牌效果（如大麦克、爆米花等）
    // 检查是否是Boss盲注且被击败
    const defeatedBoss = this.currentBlind?.type === BlindType.BOSS_BLIND;

    // 计算牌库中9的数量（用于九霄云外）
    const deckCards = this.cardPile.deck.getCards();
    const ninesInDeck = deckCards.filter(card => card.rank === Rank.Nine).length;

    const endRoundResult = JokerSystem.processEndRound(this.jokerSlots, {
      money: this.money,
      interestCap: this.config.interestCap,
      hands: this.handsRemaining,
      discards: this.discardsRemaining
    }, defeatedBoss, undefined, ninesInDeck);

    // 添加小丑牌提供的金钱奖励
    if (endRoundResult.moneyBonus > 0) {
      this.money += endRoundResult.moneyBonus;
    }

    // 处理礼品卡效果：增加玩家已拥有的小丑牌和消耗牌的售价
    if (endRoundResult.increaseSellValue > 0) {
      // 增加所有小丑牌的售价
      const jokers = this.jokerSlots.getJokers();
      jokers.forEach(joker => {
        joker.increaseSellValue(endRoundResult.increaseSellValue);
      });
      
      // 增加所有消耗牌的售价
      const consumables = this.consumableSlots.getConsumables();
      consumables.forEach(consumable => {
        consumable.increaseSellValue(endRoundResult.increaseSellValue);
      });
      
      logger.info('Gift Card effect applied', {
        increaseAmount: endRoundResult.increaseSellValue,
        jokersAffected: jokers.length,
        consumablesAffected: consumables.length
      });
    }

    logger.info('Blind completed', {
      blindType: this.currentBlind?.type,
      blindReward,
      handsRemainingReward,
      goldBonus,
      jokerMoneyBonus: endRoundResult.moneyBonus,
      destroyedJokers: endRoundResult.destroyedJokers,
      totalMoney: this.money,
      ante: this.ante
    });

    // 处理蓝色蜡封：回合结束时如果留在手牌中，生成对应最后出牌牌型的星球牌（每张蓝色蜡封生成一张）
    logger.info('蓝色蜡封检查', { lastPlayedHandType: this.lastPlayedHandType, handCardCount: this.cardPile.hand.getCards().length });
    if (this.lastPlayedHandType) {
      const handCards = this.cardPile.hand.getCards();
      logger.info('蓝色蜡封处理', { handCardCount: handCards.length, lastPlayedHandType: this.lastPlayedHandType });
      // 检查手牌中是否有蓝色蜡封
      const blueSealCards = handCards.filter(card => card.seal === 'blue');
      logger.info('手牌中的蓝色蜡封', { blueSealCount: blueSealCards.length });
      
      const sealEffects = SealSystem.calculateSealsForCards(handCards, false, false, this.lastPlayedHandType);
      logger.info('蓝色蜡封效果计算结果', { planetCount: sealEffects.planetCount, planetHandType: sealEffects.planetHandType });
      for (let i = 0; i < sealEffects.planetCount; i++) {
        if (sealEffects.planetHandType) {
          const planetCard = getPlanetConsumableByHandType(sealEffects.planetHandType);
          if (planetCard) {
            if (this.consumableSlots.hasAvailableSlot()) {
              const added = this.consumableSlots.addConsumable(planetCard);
              logger.info('蓝色蜡封效果：生成星球牌', { planetCard: planetCard.name, handType: sealEffects.planetHandType, index: i + 1, total: sealEffects.planetCount, added });
            } else {
              logger.info('蓝色蜡封效果：消耗品槽位已满，无法生成星球牌', { index: i + 1, total: sealEffects.planetCount });
              break;
            }
          }
        }
      }
    }

    this.cardPile.returnToDeckAndShuffle();

    // 清除深红之心Boss禁用的小丑状态
    this.jokerSlots.clearAllDisabled();

    // 重置所有小丑牌的翻面状态（琥珀橡果Boss效果）
    this.jokerSlots.setAllJokersFaceDown(false);

    // 重置Hit the Road（上路）的倍率加成
    this.jokerSlots.getActiveJokers()
      .filter(j => j.id === 'hit_the_road')
      .forEach(j => j.updateState({ multiplierBonus: 0 }));

    // 注意：Campfire（篝火）的重置在 JokerSystem.processEndRound 中处理
    // 只有在击败Boss时才会重置

    this.currentBlind = null;

    // 在进入商店前刷新商店商品（新轮次）
    // 获取玩家已有的小丑牌ID，避免商店生成重复的小丑牌
    const playerJokerIds = this.jokerSlots.getJokers().map(j => j.id);
    const allowDuplicates = this.hasShowman();
    
    // 重置混沌小丑的免费刷新状态
    this.jokerSlots.resetChaosClownFreeReroll();
    
    if (this.shop) {
      logger.info('[GameState.completeBlind] 进入新商店轮次，刷新商店商品');
      this.shop.enterNewShop(playerJokerIds, allowDuplicates);
    } else {
      logger.info('[GameState.completeBlind] 创建新商店');
      this.shop = new Shop();
      // Shop 构造函数已调用 refresh，无需重复刷新
    }

    this.phase = GamePhase.SHOP;

    this.advanceBlindPositionAfterComplete();
  }

  private advanceBlindPositionAfterComplete(): void {
    if (this.currentBlindPosition === BlindType.SMALL_BLIND) {
      this.currentBlindPosition = BlindType.BIG_BLIND;
    } else if (this.currentBlindPosition === BlindType.BIG_BLIND) {
      this.currentBlindPosition = BlindType.BOSS_BLIND;
    } else if (this.currentBlindPosition === BlindType.BOSS_BLIND) {
      this.ante++;
      this.currentBlindPosition = BlindType.SMALL_BLIND;
      // 进入新底注，清除Boss状态
      BossSystem.clearBoss(this.bossState);
      // 触发新底注开始的事件
      BossSystem.onNewAnte(this.bossState);
      // 重置Boss重掷次数
      this.bossSelectionState.resetBossRerollCount();
      logger.info('New ante started, boss reroll count reset', { ante: this.ante });
      if (this.ante > 8 && !this.isEndlessMode) {
        this.phase = GamePhase.GAME_OVER;
      }
    }
  }

  /**
   * 骨头先生 (Mr. Bones) 救场后进入商店
   * 被救场算作胜利，推进盲注，但骨头先生自毁
   */
  private enterShopAfterBonesSave(): void {
    logger.info('[GameState.enterShopAfterBonesSave] 骨头先生救场，进入商店', {
      currentBlind: this.currentBlind?.name,
      roundScore: this.roundScore,
      targetScore: this.currentBlind?.targetScore
    });

    // 销毁骨头先生（自毁）
    this.destroyMrBones();

    // 清理当前回合状态
    this.cardPile.returnToDeckAndShuffle();
    this.jokerSlots.clearAllDisabled();

    // 获取玩家已有的小丑牌ID，避免商店生成重复的小丑牌
    const playerJokerIds = this.jokerSlots.getJokers().map(j => j.id);
    const allowDuplicates = this.hasShowman();

    // 重置混沌小丑的免费刷新状态
    this.jokerSlots.resetChaosClownFreeReroll();

    // 创建或刷新商店
    if (this.shop) {
      this.shop.enterNewShop(playerJokerIds, allowDuplicates);
    } else {
      this.shop = new Shop();
      // Shop 构造函数已调用 refresh，无需重复刷新
    }

    this.phase = GamePhase.SHOP;

    // 推进盲注（被救场算作胜利）
    this.advanceBlindPositionAfterComplete();

    logger.info('[GameState.enterShopAfterBonesSave] 已进入商店，盲注已推进', {
      currentBlind: this.currentBlind?.name,
      ante: this.ante,
      blindPosition: this.currentBlindPosition
    });
  }

  exitShop(): { success: boolean; copiedConsumableIds?: string[]; message?: string } {
    if (this.phase !== GamePhase.SHOP) {
      return { success: false, message: '不在商店阶段' };
    }

    // 处理 ON_SHOP_EXIT 触发器的小丑牌效果（如佩尔科）
    const consumables = this.consumableSlots.getConsumables();
    const shopExitResult = JokerSystem.processShopExit(this.jokerSlots, [...consumables]);

    // 处理所有复制的消耗牌（支持多次复制，如蓝图+佩尔科）
    if (shopExitResult.copiedConsumableIds && shopExitResult.copiedConsumableIds.length > 0) {
      for (const copiedId of shopExitResult.copiedConsumableIds) {
        const copiedConsumable = getConsumableById(copiedId);
        if (copiedConsumable) {
          // 佩尔科复制的牌带有负片效果，不占用槽位
          const negativeConsumable = copiedConsumable.clone();
          (negativeConsumable as any).isNegative = true;

          const added = this.consumableSlots.addConsumable(negativeConsumable);
          if (!added) {
            logger.warn('佩尔科: 无法添加负片消耗牌', { copiedId });
          } else {
            logger.info('佩尔科: 成功复制负片消耗牌', {
              name: negativeConsumable.name,
              id: negativeConsumable.id
            });
          }
        }
      }
    }

    this.phase = GamePhase.BLIND_SELECT;
    this.currentBlind = null;

    return {
      success: true,
      copiedConsumableIds: shopExitResult.copiedConsumableIds,
      message: shopExitResult.effects.length > 0 ? shopExitResult.effects.map(e => e.effect).join(', ') : undefined
    };
  }

  /**
   * 刷新商店
   * 处理 ON_REROLL 触发器的小丑牌效果
   */
  rerollShop(): { success: boolean; message: string; freeReroll?: boolean } {
    if (!this.shop) {
      return { success: false, message: '商店不存在' };
    }

    if (this.phase !== GamePhase.SHOP) {
      return { success: false, message: '不在商店阶段' };
    }

    // 处理 ON_REROLL 触发器的小丑牌效果
    const rerollResult = JokerSystem.processReroll(this.jokerSlots);

    // 检查是否有免费刷新
    const isFreeReroll = rerollResult.freeReroll;

    // 保存当前的刷新费用（因为rerollShop会增加费用）
    const currentRerollCost = this.shop.rerollCost;

    // 如果不是免费刷新，检查资金
    if (!isFreeReroll && this.money < currentRerollCost) {
      return { success: false, message: '资金不足' };
    }

    // 如果不是免费刷新，先扣除资金
    if (!isFreeReroll) {
      this.money -= currentRerollCost;
    }

    // 执行刷新，传入玩家已有的小丑牌ID避免生成重复
    const playerJokerIds = this.jokerSlots.getJokers().map(j => j.id);
    const allowDuplicates = this.hasShowman();
    this.shop.rerollShop(playerJokerIds, allowDuplicates, isFreeReroll);

    logger.info('Shop rerolled', {
      freeReroll: isFreeReroll,
      jokerEffects: rerollResult.effects.length,
      remainingMoney: this.money
    });

    return {
      success: true,
      message: isFreeReroll ? '免费刷新！' : '商店已刷新',
      freeReroll: isFreeReroll
    };
  }

  private dealInitialHand(): void {
    this.cardPile.dealInitialHand(this.getMaxHandSize());

    // 修复房子Boss: 第一手牌强制面朝下
    const currentBoss = this.bossState.getCurrentBoss();
    if (currentBoss === BossType.HOUSE && !this.bossState.isFirstHandPlayed()) {
      const handCards = this.cardPile.hand.getCards();
      for (const card of handCards) {
        card.setFaceDown(true);
      }
      logger.info('房子Boss: 第一手牌面朝下');
    }

    // 修复标记Boss: 所有人头牌面朝下
    if (currentBoss === BossType.MARK) {
      const handCards = this.cardPile.hand.getCards();
      for (const card of handCards) {
        if (card.rank === Rank.Jack || card.rank === Rank.Queen || card.rank === Rank.King) {
          card.setFaceDown(true);
        }
      }
      logger.info('标记Boss: 人头牌面朝下');
    }
  }

  private drawCards(count: number, options?: { ignoreHandSize?: boolean; faceDown?: boolean }): void {
    // 修复Bug: 抽牌应该补充到手牌满，而不是只抽count张
    // 这是为了处理塔罗牌摧毁手牌后的情况
    // 修复蛇Boss: 支持ignoreHandSize选项（总是抽3张，忽略手牌上限）
    // 修复鱼Boss: 支持faceDown选项（抽到的牌翻面）
    // 修复轮子Boss: 在抽牌时应用1/7翻面概率

    const currentBoss = this.bossState.getCurrentBoss();

    // 蛇Boss: 总是抽3张，忽略手牌上限
    if (options?.ignoreHandSize) {
      // 直接抽指定数量的牌，不考虑手牌上限
      for (let i = 0; i < count; i++) {
        const card = this.cardPile.deck.dealOne();
        if (card) {
          // 鱼Boss: 抽到的牌翻面
          if (options?.faceDown || currentBoss === BossType.FISH) {
            card.setFaceDown(true);
          }
          // 修复轮子Boss: 抽牌时有1/7概率翻面
          if (currentBoss === BossType.WHEEL && Math.random() < 1/7) {
            card.setFaceDown(true);
          }
          // 修复标记Boss: 人头牌翻面
          if (currentBoss === BossType.MARK && (card.rank === Rank.Jack || card.rank === Rank.Queen || card.rank === Rank.King)) {
            card.setFaceDown(true);
          }
          this.cardPile.hand.addCard(card);
        }
      }
    } else {
      // 正常抽牌：补充到手牌满
      const cardsNeeded = Math.min(count, this.cardPile.hand.maxHandSize - this.cardPile.hand.count);
      for (let i = 0; i < cardsNeeded; i++) {
        const card = this.cardPile.deck.dealOne();
        if (card) {
          // 鱼Boss: 抽到的牌翻面
          if (options?.faceDown || currentBoss === BossType.FISH) {
            card.setFaceDown(true);
          }
          // 修复轮子Boss: 抽牌时有1/7概率翻面
          if (currentBoss === BossType.WHEEL && Math.random() < 1/7) {
            card.setFaceDown(true);
          }
          // 修复标记Boss: 人头牌翻面
          if (currentBoss === BossType.MARK && (card.rank === Rank.Jack || card.rank === Rank.Queen || card.rank === Rank.King)) {
            card.setFaceDown(true);
          }
          this.cardPile.hand.addCard(card);
        }
      }
    }
  }

  /**
   * 添加卡牌到牌库
   * 处理 ON_CARD_ADDED 触发器的小丑牌效果
   */
  addCardToDeck(card: Card, position: 'top' | 'bottom' = 'bottom'): void {
    // 处理 ON_CARD_ADDED 触发器的小丑牌效果
    const cardAddedResult = JokerSystem.processCardAdded(this.jokerSlots, card);

    if (cardAddedResult.effects.length > 0) {
      logger.info('Card added to deck with joker effects', {
        card: card.toString(),
        position,
        effects: cardAddedResult.effects.map(e => e.effect)
      });
    }

    // 添加卡牌到牌库
    if (position === 'top') {
      this.cardPile.deck.addToTop(card);
    } else {
      this.cardPile.deck.addToBottom(card);
    }
  }

  private createEmptyRoundStats(): RoundStats {
    return {
      handsPlayed: 0,
      discardsUsed: 0,
      cardsPlayed: 0,
      cardsDiscarded: 0,
      highestHandScore: 0
    };
  }

  getRoundStats(): RoundStats {
    return { ...this.roundStats };
  }

  getProgress(): { current: number; target: number; percentage: number } {
    if (!this.currentBlind) {
      return { current: 0, target: 0, percentage: 0 };
    }
    const target = this.currentBlind.targetScore;
    const percentage = Math.min(100, (this.roundScore / target) * 100);
    return {
      current: this.roundScore,
      target,
      percentage
    };
  }

  getRemainingHands(): number {
    return this.handsRemaining;
  }

  getRemainingDiscards(): number {
    return this.discardsRemaining;
  }

  getMoney(): number {
    return this.money;
  }

  addMoney(amount: number): void {
    this.money += amount;
  }

  spendMoney(amount: number): boolean {
    // 计算债务上限（信用卡效果）
    const debtLimit = this.getDebtLimitFromJokers();
    const minMoney = debtLimit; // 可以欠债到debtLimit（负数）

    if (this.money - amount >= minMoney) {
      this.money -= amount;
      return true;
    }
    return false;
  }

  /**
   * 从ON_INDEPENDENT小丑牌获取债务上限
   * 信用卡 (credit_card) 允许欠债-$20
   */
  private getDebtLimitFromJokers(): number {
    let debtLimit = 0; // 默认不能欠债
    for (const joker of this.jokers) {
      if (joker.effect) {
        const result = joker.effect({});
        if (result.debtLimit !== undefined) {
          debtLimit = Math.min(debtLimit, result.debtLimit); // 取最小的债务上限（最宽松的）
        }
      }
    }
    return debtLimit;
  }

  setMoney(amount: number): void {
    this.money = amount;
  }

  sellJoker(index: number): { success: boolean; sellPrice?: number; error?: string; copiedJokerId?: string } {
    console.log(`[GameState.sellJoker] 开始卖小丑, index=${index}, 当前金钱=$${this.money}`);

    // 检查是否是摔跤手 (Luchador) - 出售时禁用当前Boss能力
    const jokers = this.jokerSlots.getJokers();
    const isLuchador = index >= 0 && index < jokers.length && jokers[index].id === 'luchador';

    const result = JokerSystem.sellJoker(this.jokerSlots, index);
    console.log(`[GameState.sellJoker] JokerSystem返回:`, result);
    if (result.success && result.sellPrice) {
      const oldMoney = this.money;
      this.money += result.sellPrice;
      console.log(`[GameState.sellJoker] 金钱更新: ${oldMoney} + ${result.sellPrice} = ${this.money}`);

      // 处理隐形小丑的复制效果
      if (result.copiedJokerId) {
        const jokerToCopy = getJokerById(result.copiedJokerId);
        if (jokerToCopy && this.jokerSlots.getAvailableSlots() > 0) {
          this.jokerSlots.addJoker(jokerToCopy);
          logger.info('Invisible Joker copied joker added', {
            copiedJokerId: result.copiedJokerId,
            jokerName: jokerToCopy.name
          });
        }
      }

      // 摔跤手 (Luchador) 效果: 出售时禁用当前Boss盲注的能力
      if (isLuchador) {
        this.bossState.disableBossAbility();
        logger.info('Luchador sold: Boss ability disabled');
      }

      // 翠绿叶子Boss: 卖出小丑牌后解除卡牌失效
      this.bossState.markJokerSold();

      this.recreateHand();
    }
    console.log(`[GameState.sellJoker] 返回结果:`, result);
    return result;
  }

  sellConsumable(index: number): { success: boolean; sellPrice?: number; error?: string } {
    // 调用 ConsumableManager 处理出售逻辑
    const result = ConsumableManager.sellConsumable(this.consumableSlots, this.jokerSlots, index);

    if (result.success && result.sellPrice !== undefined) {
      // 添加金钱到玩家账户
      this.money += result.sellPrice;
    }

    return result;
  }

  getAnte(): number {
    // 考虑象形文字优惠券的底注减少效果，最小为1
    return Math.max(1, this.ante - this.anteDownFromVouchers);
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getCurrentBlind(): Blind | null {
    return this.currentBlind;
  }

  addJoker(joker: JokerInterface): boolean {
    console.log('[GameState] addJoker 被调用, joker:', joker.id, joker.name);
    console.log('[GameState] 当前小丑牌数量:', this.jokerSlots.getJokerCount());
    console.log('[GameState] 最大槽位:', this.jokerSlots.getMaxSlots());
    const result = this.jokerSlots.addJoker(joker);
    console.log('[GameState] jokerSlots.addJoker 结果:', result);
    if (result) {
      this.recreateHand();
    }
    return result;
  }

  removeJoker(index: number): JokerInterface | null {
    const result = this.jokerSlots.removeJoker(index);
    if (result) {
      this.recreateHand();
    }
    return result;
  }

  private recreateHand(): void {
    const currentCards = this.cardPile.hand.getCards();
    const selectedIndices = Array.from(this.cardPile.hand.getSelectedIndices());
    this.cardPile.hand = new Hand(this.getMaxHandSize());
    this.cardPile.hand.addCards(currentCards);
    selectedIndices.forEach(index => {
      if (index < currentCards.length) {
        this.cardPile.hand.selectCard(index);
      }
    });
  }

  getJokerSlots(): JokerSlots {
    return this.jokerSlots;
  }

  getJokerCount(): number {
    return this.jokerSlots.getJokerCount();
  }

  getConsumableSlots(): ConsumableSlots {
    return this.consumableSlots;
  }

  addConsumable(consumable: ConsumableInterface): boolean {
    return this.consumableSlots.addConsumable(consumable);
  }

  removeConsumable(index: number): ConsumableInterface | null {
    return this.consumableSlots.removeConsumable(index);
  }

  getConsumableCount(): number {
    return this.consumableSlots.getConsumableCount();
  }

  getMaxConsumableSlots(): number {
    return this.consumableSlots.getMaxSlots();
  }

  hasAvailableConsumableSlot(): boolean {
    return this.consumableSlots.hasAvailableSlot();
  }

  getInterestCap(): number {
    // 官方规则：默认利息上限$5，种子资金$10，种子资金+$20
    const vouchersUsed = this.shop?.getVouchersUsed() || [];

    if (vouchersUsed.includes('voucher_money_tree')) {
      return 20;  // 种子资金+：$20
    }
    if (vouchersUsed.includes('voucher_seed_money')) {
      return 10;  // 种子资金：$10
    }
    return 5;  // 默认：$5
  }

  /**
   * 检查是否有马戏团演员 (Showman) 效果
   * 允许小丑牌、塔罗牌、行星牌和幻灵牌重复出现
   */
  hasShowman(): boolean {
    for (const joker of this.jokers) {
      if (joker.effect) {
        const result = joker.effect({});
        if (result.allowDuplicates) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 检查是否有骨头先生 (Mr. Bones) 效果
   * 防止死亡如果得分至少达到所需分数的25%
   * 使用后自毁
   */
  private canPreventDeath(): boolean {
    const hasMrBones = this.jokers.some(joker => joker.id === 'mr_bones');
    if (!hasMrBones) return false;

    const targetScore = this.currentBlind?.targetScore ?? 0;
    if (targetScore <= 0) return false;

    const percentage = (this.roundScore / targetScore) * 100;

    // 如果得分至少达到所需分数的25%，骨头先生可以防止死亡
    return percentage >= 25 && percentage < 100;
  }

  /**
   * 销毁骨头先生 (Mr. Bones)
   * 使用后自毁
   */
  private destroyMrBones(): void {
    const mrBonesIndex = this.jokers.findIndex(joker => joker.id === 'mr_bones');
    if (mrBonesIndex >= 0) {
      this.jokerSlots.removeJoker(mrBonesIndex);
      logger.info('Mr. Bones self-destructed after saving the player');
    }
  }

  /**
   * 处理证书 (Certificate) 效果
   * 回合开始前将带印章的随机牌放入牌库顶部，这样发牌时会抽到手牌中
   */
  private handleCertificateEffect(): void {
    const hasCertificate = this.jokers.some(joker => joker.id === 'certificate');
    if (!hasCertificate) return;

    // 生成带印章的随机牌
    const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
    const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
    const seals = [SealType.Gold, SealType.Red, SealType.Blue, SealType.Purple];

    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    const randomSeal = seals[Math.floor(Math.random() * seals.length)];

    const card = new CardClass(randomSuit, randomRank, CardEnhancement.None, randomSeal, CardEdition.None);

    // 将牌放入牌库顶部，这样发牌时会优先抽到
    this.cardPile.deck.addToTop(card);
    logger.info('证书效果: 添加带印章的牌到牌库顶部', { card: card.toString(), seal: randomSeal });
  }

  getHandLevelState(): HandLevelState {
    return this.handLevelState;
  }

  getLastPlayScore(): number {
    return this.lastPlayScore;
  }

  getExtraHandSizeFromJokers(): number {
    let extraHandSize = 0;
    for (const joker of this.jokers) {
      if (joker.effect) {
        const result = joker.effect({});
        extraHandSize += result.handSizeBonus || 0;
      }
    }
    return extraHandSize;
  }

  getExtraHandsFromJokers(): number {
    let extraHands = 0;
    for (const joker of this.jokers) {
      if (joker.effect) {
        const result = joker.effect({});
        extraHands += result.extraHands || 0;
      }
    }
    return extraHands;
  }

  getMaxHandSize(): number {
    const baseSize = this.config.maxHandSize + this.getExtraHandSizeFromJokers() + this.extraHandSizeFromVouchers;
    return BossSystem.modifyHandSize(this.bossState, baseSize);
  }

  getMaxHandsPerRound(): number {
    const baseHands = this.config.maxHandsPerRound + this.getExtraHandsFromJokers() + this.extraHandsFromVouchers;
    return BossSystem.modifyHands(this.bossState, baseHands);
  }

  getExtraDiscardsFromJokers(): number {
    let extraDiscards = 0;
    for (const joker of this.jokers) {
      if (joker.effect) {
        const result = joker.effect({});
        extraDiscards += result.extraDiscards || 0;
      }
    }
    return extraDiscards;
  }

  getMaxDiscardsPerRound(): number {
    const baseDiscards = this.config.maxDiscardsPerRound + this.getExtraDiscardsFromJokers() + this.extraDiscardsFromVouchers;
    return BossSystem.modifyDiscards(this.bossState, baseDiscards);
  }

  /**
   * 获取指定牌型的历史出牌次数（用于Supernova）
   * @param handType 牌型
   * @returns 该牌型在本局游戏中出过的次数
   */
  getHandTypeHistoryCount(handType: string): number {
    return this.handTypeHistory.get(handType) || 0;
  }

  /**
   * 获取所有牌型的历史统计
   * @returns 牌型历史统计Map
   */
  getHandTypeHistory(): Map<string, number> {
    return new Map(this.handTypeHistory);
  }

  /**
   * 获取全局最常打出的牌型（用于望远镜优惠券）
   * 使用全局牌型历史统计，不会随新底注重置
   * @returns 最常打出的牌型，如果没有打出过任何牌则返回null
   */
  getMostPlayedHandGlobal(): PokerHandType | null {
    let maxCount = 0;
    let mostPlayedHand: PokerHandType | null = null;

    for (const [handType, count] of this.handTypeHistory) {
      if (count > maxCount) {
        maxCount = count;
        mostPlayedHand = handType as PokerHandType;
      }
    }

    return mostPlayedHand;
  }

  isGameOver(): boolean {
    return this.phase === GamePhase.GAME_OVER;
  }

  resetRound(): void {
    if (this.currentBlind) {
      this.roundScore = 0;
      this.handsRemaining = this.getMaxHandsPerRound();
      this.discardsRemaining = this.getMaxDiscardsPerRound();
      this.roundStats = this.createEmptyRoundStats();
      this.playedHandTypes.clear();
      this.lastPlayedHandType = null;
      this.dealInitialHand();
    }
  }

  applyVoucher(voucherId: string): void {
    if (this.shop) {
      // 传入玩家已有的小丑牌ID，避免商店生成重复的小丑牌
      const playerJokerIds = this.jokerSlots.getJokers().map(j => j.id);
      this.shop.applyVoucher(voucherId, playerJokerIds);
    }

    switch (voucherId) {
      case 'voucher_crystal_ball':
        this.consumableSlots.increaseMaxSlots(1);
        break;
      case 'voucher_antimatter':
        this.jokerSlots.increaseMaxSlots(1);
        break;
      case 'voucher_paint_brush':
        this.extraHandSizeFromVouchers += 1;
        this.recreateHand();
        break;
      case 'voucher_palette':
        this.extraHandSizeFromVouchers += 2;
        this.recreateHand();
        break;
      case 'voucher_grabber':
        this.extraHandsFromVouchers += 1;
        this.handsRemaining++;
        break;
      case 'voucher_nacho_tong':
        this.extraHandsFromVouchers += 2;
        this.handsRemaining += 2;
        break;
      case 'voucher_wasteful':
        this.extraDiscardsFromVouchers += 1;
        this.discardsRemaining++;
        break;
      case 'voucher_recyclomancy':
        this.extraDiscardsFromVouchers += 2;
        this.discardsRemaining += 2;
        break;
      case 'voucher_retcon':
        // 导演剪辑版+：设置无限重掷
        this.bossSelectionState.setUnlimitedRerolls(true);
        logger.info('Retcon voucher applied: unlimited boss rerolls enabled');
        break;
      case 'voucher_hieroglyph':
        // 象形文字：底注-1，每回合出牌次数-1
        this.anteDownFromVouchers += 1;
        this.extraHandsFromVouchers -= 1;
        this.handsRemaining = this.getMaxHandsPerRound();
        logger.info('Hieroglyph voucher applied: ante -1, hands per round -1');
        break;
      case 'voucher_petroglyph':
        // 象形文字+：底注-1，每回合弃牌次数-1
        this.anteDownFromVouchers += 1;
        this.extraDiscardsFromVouchers -= 1;
        this.discardsRemaining = this.getMaxDiscardsPerRound();
        logger.info('Petroglyph voucher applied: ante -1, discards per round -1');
        break;
    }
  }

  /**
   * 获取已使用的优惠券列表
   */
  getVouchersUsed(): string[] {
    if (this.shop) {
      return this.shop.getVouchersUsed();
    }
    return [];
  }

  /**
   * 检查是否拥有导演剪辑版优惠券（基础版或升级版）
   */
  hasDirectorsCutVoucher(): boolean {
    const vouchers = this.getVouchersUsed();
    return vouchers.includes('voucher_directors_cut') || vouchers.includes('voucher_retcon');
  }

  /**
   * 检查是否可以重掷Boss盲注
   */
  canRerollBoss(): boolean {
    // 只有在Boss盲注选择阶段才能重掷
    if (this.phase !== GamePhase.BLIND_SELECT) {
      return false;
    }
    // 只有在Boss盲注位置才能重掷
    if (this.currentBlindPosition !== BlindType.BOSS_BLIND) {
      return false;
    }
    return BossSelectionSystem.canRerollBoss(
      this.bossSelectionState,
      this.hasDirectorsCutVoucher()
    );
  }

  /**
   * 获取剩余重掷次数
   */
  getRemainingBossRerolls(): number {
    return BossSelectionSystem.getRemainingRerolls(
      this.bossSelectionState,
      this.hasDirectorsCutVoucher()
    );
  }

  /**
   * 重掷Boss盲注
   */
  rerollBoss(): BossRerollResult {
    if (!this.canRerollBoss()) {
      return {
        success: false,
        message: '无法重掷Boss盲注'
      };
    }

    const result = BossSelectionSystem.rerollBoss(this.bossSelectionState, this.ante);
    logger.info('Boss reroll result', { result });
    return result;
  }

  toString(): string {
    const lines: string[] = [];
    lines.push('=== 游戏状态 ===');
    lines.push(`阶段: ${this.phase}`);
    lines.push(`底注: ${this.ante}`);
    lines.push(`金钱: $${this.money}`);
    lines.push(`当前关卡: ${this.currentBlind?.name ?? '无'}`);
    lines.push(`回合分数: ${this.roundScore} / ${this.currentBlind?.targetScore ?? 0}`);
    lines.push(`剩余出牌: ${this.handsRemaining}`);
    lines.push(`剩余弃牌: ${this.discardsRemaining}`);
    lines.push(`手牌: ${this.cardPile.handCount}张`);
    lines.push(`牌堆剩余: ${this.cardPile.deckCount}张`);
    return lines.join('\n');
  }

  // ========== 牌堆状态访问方法 ==========

  getDeckCards(): readonly Card[] {
    return this.cardPile.deck.getCards();
  }

  getHandCards(): readonly Card[] {
    return this.cardPile.hand.getCards();
  }

  getDiscardCards(): readonly Card[] {
    return this.cardPile.discard.getCards();
  }

  getDeckCount(): number {
    return this.cardPile.deckCount;
  }

  getHandCount(): number {
    return this.cardPile.handCount;
  }

  getDiscardCount(): number {
    return this.cardPile.discardCount;
  }
}
