import { Blind } from './Blind';
import type { Card } from './Card';
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
import { initializeBlindConfigs, resetBlindConfigs } from '../data/blinds';
import { ConsumableDataManager } from '../data/ConsumableDataManager';
import { getConsumableById } from '../data/consumables';
import type { JokerInterface } from '../types/joker';
import type { ConsumableInterface } from '../types/consumable';
import { getJokerById } from '../data/jokers';
import { CardEnhancement } from '../types/card';
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
  lastUsedConsumable: { id: string; type: ConsumableType } | null = null;

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
    this.cardPile = new CardPile(this.getMaxHandSize());
    this.cardPile.deck.shuffle();
    this.currentBlind = null;
    this.ante = this.config.startingAnte;
    this.money = this.config.startingMoney;
    this.handsRemaining = this.getMaxHandsPerRound();
    this.discardsRemaining = this.getMaxDiscardsPerRound();
    this.currentScore = 0;
    this.roundScore = 0;
    this.consumableSlots = new ConsumableSlots(2);
    this.handLevelState = new HandLevelState();
    this.roundStats = this.createEmptyRoundStats();
    this.playedHandTypes.clear();
    this.lastPlayScore = 0;
    this.skippedBlinds.clear();
    this.currentBlindPosition = BlindType.SMALL_BLIND;
    this.jokerSlots.clear();
    this.globalCounters = {
      totalHandsPlayed: 0,
      totalDiscardsUsed: 0
    };
    this.extraHandSizeFromVouchers = 0;
    this.extraHandsFromVouchers = 0;
    this.extraDiscardsFromVouchers = 0;
    
    // 重置Boss选择状态并初始化盲注配置
    this.bossSelectionState.reset();
    this.bossState.clearBoss();
    this.initializeBlindConfigsForNewGame();
    
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

    const blind = Blind.create(this.ante, blindType);
    if (!blind) {
      logger.error('Failed to create blind', { ante: this.ante, blindType });
      return false;
    }

    // 如果是Boss盲注，设置当前Boss
    if (blindType === BlindType.BOSS_BLIND && blind.bossType) {
      BossSystem.setBoss(this.bossState, blind.bossType);
      logger.info('Boss blind selected', { bossType: blind.bossType });
    } else {
      BossSystem.clearBoss(this.bossState);
    }

    // 盲注结束，将手牌和弃牌堆洗回发牌堆
    this.cardPile.returnToDeckAndShuffle();

    // 重新初始化 CardPile
    this.cardPile = new CardPile(this.getMaxHandSize());
    this.cardPile.deck.shuffle();

    this.currentBlind = blind;
    this.phase = GamePhase.PLAYING;
    this.roundScore = 0;
    this.handsRemaining = this.getMaxHandsPerRound();
    this.discardsRemaining = this.getMaxDiscardsPerRound();
    this.roundStats = this.createEmptyRoundStats();
    this.playedHandTypes.clear();

    this.dealInitialHand();

    // 处理Boss回合开始效果（深红之心、天青铃铛等）
    const handCards = this.cardPile.hand.getCards();
    // 清除之前的禁用状态
    this.jokerSlots.clearAllDisabled();
    const roundStartResult = BossSystem.onRoundStart(this.bossState, this.jokerSlots, handCards);

    // 处理选择盲注时的小丑牌效果（ON_BLIND_SELECT触发器）
    const blindSelectResult = JokerSystem.processBlindSelect(this.jokerSlots, blindType);

    // 应用盲注选择效果（如额外塔罗牌、星球牌等）
    if (blindSelectResult.tarotBonus > 0) {
      for (let i = 0; i < blindSelectResult.tarotBonus; i++) {
        this.consumableSlots.addConsumable(ConsumableDataManager.getRandomByType(ConsumableType.TAROT));
      }
    }
    if (blindSelectResult.jokerBonus > 0) {
      // 生成小丑牌逻辑（如果有）
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

    const blindToSkip = Blind.create(this.ante, this.currentBlindPosition);

    if (!blindToSkip) {
      logger.error('Failed to create blind to skip');
      return false;
    }

    if (!blindToSkip.canSkipBlind()) {
      logger.warn('Cannot skip blind: boss blind cannot be skipped');
      return false;
    }

    const skipKey = `${this.ante}-${blindToSkip.type}`;
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
    const jokers = this.jokerSlots.getJokers();
    for (const joker of jokers) {
      if (joker.id === 'throwback') {
        const currentBlindsSkipped = (joker.state?.blindsSkipped as number) || 0;
        joker.updateState({ blindsSkipped: currentBlindsSkipped + 1 });
        logger.info('Throwback updated', { blindsSkipped: currentBlindsSkipped + 1 });
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
      if (this.ante > 8) {
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
    const handsRemaining = this.handsRemaining;

    // 获取最常出的牌型（用于方尖碑）
    const mostPlayedHand = this.bossState.getMostPlayedHand();

    // 先检测牌型，获取历史统计（用于Supernova）
    const tempScoreResult = ScoringSystem.calculate(selectedCards);
    const handTypeHistoryCount = this.getHandTypeHistoryCount(tempScoreResult.handType);

    const scoreResult = ScoringSystem.calculate(selectedCards, undefined, gameState, heldCards, this.jokerSlots, currentTotalCards, initialDeckSize, handsPlayed, discardsUsed, handsRemaining, mostPlayedHand, handTypeHistoryCount, false, this.handLevelState, this.bossState);

    this.playedHandTypes.add(scoreResult.handType);
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

    // 处理DNA效果：复制计分牌到卡组
    if (scoreResult.copyScoredCardToDeck && scoreResult.scoringCards.length > 0) {
      const cardToCopy = scoreResult.scoringCards[0];
      const copiedCard = cardToCopy.clone();
      this.addCardToDeck(copiedCard, 'bottom');
      logger.info('DNA effect: Card copied to deck', { card: cardToCopy.toString() });
    }

    // 将打出的牌移到弃牌堆
    if (scoreResult.destroyedCards && scoreResult.destroyedCards.length > 0) {
      logger.info('Glass cards destroyed', { count: scoreResult.destroyedCards.length });
      this.cardPile.playSelected(scoreResult.destroyedCards);
    } else {
      this.cardPile.playSelected();
    }

    // 记录已出的牌（用于柱子Boss效果）并处理Boss效果
    const bossResult = BossSystem.afterPlayHand(this.bossState, selectedCards, scoreResult.handType);

    // 处理牙齿Boss扣钱效果
    if (bossResult.moneyChange && bossResult.moneyChange < 0) {
      this.money += bossResult.moneyChange;
      logger.info('牙齿Boss扣钱', { moneyChange: bossResult.moneyChange, newMoney: this.money });
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

    // 抽牌 - 考虑蛇Boss限制
    const currentBoss = this.bossState.getCurrentBoss();
    if (currentBoss === BossType.SERPENT) {
      // 蛇Boss: 只抽3张牌
      this.drawCards(Math.min(3, selectedCards.length));
    } else {
      this.drawCards(selectedCards.length);
    }

    logger.info('Hand played', { 
      handType: scoreResult.handType,
      totalScore: scoreResult.totalScore,
      roundScore: this.roundScore,
      targetScore: this.currentBlind?.targetScore,
      handsRemaining: this.handsRemaining
    });

    if (this.handsRemaining === 0 && !this.isRoundWon()) {
      logger.warn('Out of hands, game over');
      this.phase = GamePhase.GAME_OVER;
    }

    return scoreResult;
  }

  discardCards(): Card[] | null {
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
    this.roundStats.discardsUsed++;
    this.globalCounters.totalDiscardsUsed++;
    this.roundStats.cardsDiscarded += selectedCards.length;

    // 将丢弃的牌移到弃牌堆
    const discardedCards = this.cardPile.discardSelected();

    // 处理弃牌时的小丑牌效果（ON_DISCARD触发器）
    const discardResult = JokerSystem.processDiscard(
      this.jokerSlots,
      discardedCards,
      this.discardsRemaining
    );

    // 应用弃牌效果（如额外金钱等）
    if (discardResult.moneyBonus > 0) {
      this.money += discardResult.moneyBonus;
    }

    // 抽牌 - 考虑蛇Boss限制
    const currentBoss = this.bossState.getCurrentBoss();
    if (currentBoss === BossType.SERPENT) {
      // 蛇Boss: 只抽3张牌
      this.drawCards(Math.min(3, discardedCards.length));
    } else {
      this.drawCards(discardedCards.length);
    }

    logger.info('Cards discarded', {
      count: discardedCards.length,
      discardsRemaining: this.discardsRemaining,
      jokerEffects: discardResult.effects.length,
      moneyBonus: discardResult.moneyBonus
    });

    return discardedCards;
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
    const endRoundResult = JokerSystem.processEndRound(this.jokerSlots, {
      money: this.money,
      interestCap: this.config.interestCap,
      hands: this.handsRemaining,
      discards: this.discardsRemaining
    }, defeatedBoss);

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

    this.cardPile.returnToDeckAndShuffle();

    // 清除深红之心Boss禁用的小丑状态
    this.jokerSlots.clearAllDisabled();

    this.currentBlind = null;

    // 在进入商店前刷新商店商品（新轮次）
    if (this.shop) {
      logger.info('[GameState.completeBlind] 进入新商店轮次，刷新商店商品');
      this.shop.enterNewShop();
    } else {
      logger.info('[GameState.completeBlind] 创建新商店');
      this.shop = new Shop();
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
      if (this.ante > 8) {
        this.phase = GamePhase.GAME_OVER;
      }
    }
  }

  enterShop(): void {
    logger.info('[GameState.enterShop] 尝试进入商店', {
      phase: this.phase,
      isRoundWon: this.isRoundWon(),
      hasShop: !!this.shop
    });
    if (this.phase === GamePhase.PLAYING && this.isRoundWon()) {
      this.phase = GamePhase.SHOP;
      if (!this.shop) {
        logger.info('[GameState.enterShop] 创建新商店');
        this.shop = new Shop();
      } else {
        logger.info('[GameState.enterShop] 使用已有商店');
      }
      logger.info('[GameState.enterShop] 成功进入商店');
    } else {
      logger.warn('[GameState.enterShop] 无法进入商店', {
        phase: this.phase,
        isRoundWon: this.isRoundWon()
      });
    }
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

    // 执行刷新
    this.shop.rerollShop();

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
  }

  private drawCards(count: number): void {
    // 修复Bug: 抽牌应该补充到手牌满，而不是只抽count张
    // 这是为了处理塔罗牌摧毁手牌后的情况
    this.cardPile.drawToMaxHandSize();
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
    if (this.money >= amount) {
      this.money -= amount;
      return true;
    }
    return false;
  }

  setMoney(amount: number): void {
    this.money = amount;
  }

  sellJoker(index: number): { success: boolean; sellPrice?: number; error?: string; copiedJokerId?: string } {
    const result = JokerSystem.sellJoker(this.jokerSlots, index);
    if (result.success && result.sellPrice) {
      this.money += result.sellPrice;

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

      // 翠绿叶子Boss: 卖出小丑牌后解除卡牌失效
      this.bossState.markJokerSold();

      this.recreateHand();
    }
    return result;
  }

  sellConsumable(index: number): { success: boolean; sellPrice?: number; error?: string } {
    const consumable = this.consumableSlots.getConsumable(index);
    if (!consumable) {
      return { success: false, error: 'Invalid consumable index' };
    }

    // 使用消耗牌的getSellPrice方法计算售价（包含礼品卡加成）
    const sellPrice = consumable.getSellPrice();
    this.consumableSlots.removeConsumable(index);
    this.money += sellPrice;

    return { success: true, sellPrice };
  }

  getAnte(): number {
    return this.ante;
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
    return 20 + this.jokerSlots.getInterestCapBonus();
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
        extraHandSize += result.extraHandSize || 0;
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
    return this.config.maxHandSize + this.getExtraHandSizeFromJokers() + this.extraHandSizeFromVouchers;
  }

  getMaxHandsPerRound(): number {
    return this.config.maxHandsPerRound + this.getExtraHandsFromJokers() + this.extraHandsFromVouchers;
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
    return this.config.maxDiscardsPerRound + this.getExtraDiscardsFromJokers() + this.extraDiscardsFromVouchers;
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
      this.dealInitialHand();
    }
  }

  applyVoucher(voucherId: string): void {
    if (this.shop) {
      this.shop.applyVoucher(voucherId);
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
