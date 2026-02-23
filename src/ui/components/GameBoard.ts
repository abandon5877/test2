import { GameState } from '../../models/GameState';
import { Joker } from '../../models/Joker';
import { Consumable } from '../../models/Consumable';
import { CardComponent } from './CardComponent';
import { HandComponent } from './HandComponent';
import { HAND_BASE_VALUES, PokerHandType } from '../../types/pokerHands';
import { PokerHandDetector } from '../../systems/PokerHandDetector';
import { BossSystem } from '../../systems/BossSystem';
import { ScoringSystem } from '../../systems/ScoringSystem';
import type { ScoreResult } from '../../systems/ScoringSystem';
import { HandRanksModal } from './HandRanksModal';
import { JokerOrderModal } from './JokerOrderModal';
import { DeckOverviewModal } from './DeckOverviewModal';
import { CONSUMABLE_TYPE_NAMES } from '../../types/consumable';
import { ResponsiveLayoutManager } from '../../utils/ResponsiveLayoutManager';
import { JokerDetailModal } from './JokerDetailModal';
import { ConsumableDetailModal } from './ConsumableDetailModal';
import { Toast } from './Toast';
import { Storage } from '../../utils/storage';
import { getRandomJoker } from '../../data/jokers';
import { getConsumableById } from '../../data/consumables';
import { JokerRarity, JokerEdition } from '../../types/joker';
import { ConsumableHelper } from '../../utils/consumableHelper';

export interface GameBoardCallbacks {
  onPlayHand?: (scoreResult: ScoreResult) => void;
  onDiscard?: () => void;
  onSortByRank?: () => void;
  onSortBySuit?: () => void;
  onEnterShop?: () => void;
  onEndRound?: () => void;
}

export class GameBoard {
  private container: HTMLElement;
  private gameState: GameState;
  private callbacks: GameBoardCallbacks;
  private handComponent: HandComponent | null = null;
  private handPreviewArea: HTMLElement | null = null;
  private jokersArea: HTMLElement | null = null;
  private scorePopup: HTMLElement | null = null;
  private handRanksModal: HandRanksModal;
  private jokerOrderModal: JokerOrderModal;
  private deckOverviewModal: DeckOverviewModal;
  private jokerDetailModal: JokerDetailModal;
  private consumableDetailModal: ConsumableDetailModal;
  private layoutManager: ResponsiveLayoutManager | null = null;
  private fullscreenButton: HTMLElement | null = null;
  private consumableHelper: ConsumableHelper;

  constructor(container: HTMLElement, gameState: GameState, callbacks: GameBoardCallbacks = {}) {
    this.container = container;
    this.gameState = gameState;
    this.callbacks = callbacks;
    this.deckOverviewModal = new DeckOverviewModal(gameState);
    this.handRanksModal = new HandRanksModal(gameState.handLevelState);
    this.jokerOrderModal = new JokerOrderModal(gameState, () => this.refresh());
    this.jokerDetailModal = JokerDetailModal.getInstance();
    this.consumableDetailModal = ConsumableDetailModal.getInstance();
    this.consumableHelper = new ConsumableHelper(gameState, {
      onToast: (msg, type) => {
        if (type === 'success') Toast.success(msg);
        else if (type === 'warning') Toast.warning(msg);
        else Toast.error(msg);
      },
      onRender: () => this.render()
    });
    this.render();
    this.createFullscreenButton();
  }

  /**
   * 创建全屏按钮
   * 在非全屏状态下显示在右上角，全屏后自动隐藏
   */
  private createFullscreenButton(): void {
    // 检查是否支持全屏
    if (!document.fullscreenEnabled) {
      return;
    }

    // 创建全屏按钮
    this.fullscreenButton = document.createElement('button');
    this.fullscreenButton.className = 'fullscreen-btn';
    this.fullscreenButton.innerHTML = '⛶'; // 全屏图标
    this.fullscreenButton.title = '进入全屏';
    
    // 添加点击事件
    this.fullscreenButton.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // 添加到body
    document.body.appendChild(this.fullscreenButton);

    // 监听全屏变化事件
    document.addEventListener('fullscreenchange', () => {
      this.updateFullscreenButton();
    });

    // 初始状态更新
    this.updateFullscreenButton();
  }

  /**
   * 切换全屏状态
   */
  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      // 进入全屏
      document.documentElement.requestFullscreen().catch(err => {
        console.log('无法进入全屏:', err);
      });
    } else {
      // 退出全屏
      document.exitFullscreen().catch(err => {
        console.log('无法退出全屏:', err);
      });
    }
  }

  /**
   * 更新全屏按钮状态
   */
  private updateFullscreenButton(): void {
    if (!this.fullscreenButton) return;

    if (document.fullscreenElement) {
      // 全屏状态下隐藏按钮
      this.fullscreenButton.style.display = 'none';
    } else {
      // 非全屏状态下显示按钮
      this.fullscreenButton.style.display = 'flex';
    }
  }

  /**
   * 更新游戏状态
   */
  setGameState(gameState: GameState): void {
    this.gameState = gameState;
    this.render();
  }

  /**
   * 刷新显示（不重新渲染整个结构）
   */
  refresh(): void {
    this.updateTopBar();
    this.updateProgressBar();
    this.updateHandPreview();
    this.updateJokers();
    this.updateConsumables();
    this.updateActionButtons();

    if (this.handComponent) {
      this.handComponent.setHand(this.gameState.cardPile.hand);
      this.handComponent.setRemaining(
        this.gameState.handsRemaining,
        this.gameState.discardsRemaining
      );
      this.handComponent.setBossState(this.gameState.bossState);
    }
  }

  /**
   * 仅刷新手牌显示（用于排序操作，不重新渲染小丑牌）
   * @param disableAnimation - 是否禁用动画（排序时设为true避免卡牌乱抖）
   */
  refreshHandOnly(disableAnimation: boolean = false): void {
    if (this.handComponent) {
      this.handComponent.setHand(this.gameState.cardPile.hand, disableAnimation);
      this.handComponent.setBossState(this.gameState.bossState);
    }
  }

  /**
   * 刷新手牌和UI状态（用于出牌弃牌操作，不重新渲染小丑牌和消耗牌）
   */
  refreshHandAndUI(): void {
    this.updateTopBar();
    this.updateProgressBar();
    this.updateHandPreview();
    this.updateActionButtons();

    if (this.handComponent) {
      this.handComponent.setHand(this.gameState.cardPile.hand);
      this.handComponent.setRemaining(
        this.gameState.handsRemaining,
        this.gameState.discardsRemaining
      );
      this.handComponent.setBossState(this.gameState.bossState);
    }
  }

  /**
   * 更新出牌/弃牌按钮文本
   */
  private updateActionButtons(): void {
    const playBtn = document.getElementById('play-hand-btn');
    const discardBtn = document.getElementById('discard-btn');
    
    if (playBtn) {
      playBtn.innerHTML = `出牌 (${this.gameState.handsRemaining})`;
    }
    
    if (discardBtn) {
      discardBtn.innerHTML = `弃牌 (${this.gameState.discardsRemaining})`;
    }
  }

  /**
   * 计算小丑牌区域所需宽度
   * 5张牌 = 1张完整 + 4张重叠部分 + 右侧空隙 + 内边距
   * 适配3840x2048到800x400分辨率
   */
  private calculateJokerAreaWidth(): number {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minDimension = Math.min(viewportWidth, viewportHeight);
    
    // 根据屏幕尺寸动态计算卡牌宽度和重叠度
    // 大屏幕：卡牌更大，重叠更少
    // 小屏幕：卡牌更小，重叠更多
    const scale = Math.max(0.6, Math.min(1.5, minDimension / 720));
    
    const cardWidth = Math.round(110 * scale);  // 66px - 165px
    const overlap = Math.round(55 * scale);     // 33px - 82px
    const gap = Math.round(16 * scale);         // 10px - 24px
    const padding = Math.round(24 * scale);     // 14px - 36px
    
    // 5张牌 = 1张完整 + 4张重叠部分 + 空隙 + 内边距
    return cardWidth + (4 * overlap) + gap + padding;
  }

  /**
   * 根据屏幕尺寸计算动态缩放值
   * 适配3840x2048到800x400分辨率
   * 小屏幕时缩小到0.3，防止手牌出界
   */
  private scaled(value: number): string {
    const baseScale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    // 扩展缩放范围到0.3 - 2.0，小屏幕可以更小
    const scale = Math.max(0.3, Math.min(2.0, baseScale));
    return `${Math.round(value * scale)}px`;
  }

  /**
   * 计算按钮动态尺寸
   * 适配3840x2048到800x400分辨率
   */
  private calculateButtonScale(): { padding: string; fontSize: string; gap: string } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minDimension = Math.min(viewportWidth, viewportHeight);

    // 基础尺寸 - 按钮字体放大
    const basePaddingX = 12;
    const basePaddingY = 8;
    const baseFontSize = 24;
    const baseGap = 8;

    // 根据最小边缩放 (0.35 - 2.0 范围，适配800x400到3840x2048)
    // 基准: 720px = 1.0
    // 最小 400px = 0.35 (超小屏幕需要更小的字体)
    // 最大 2048px = 2.84，但限制2.0
    const scale = Math.max(0.35, Math.min(2.0, minDimension / 720));

    return {
      padding: `${Math.round(basePaddingY * scale)}px ${Math.round(basePaddingX * scale)}px`,
      fontSize: `${Math.round(baseFontSize * scale)}px`,
      gap: `${Math.round(baseGap * scale)}px`
    };
  }

  /**
   * 渲染游戏主界面 - 响应式布局
   * 
   * 布局结构:
   * ┌─────────────────────────────────────────────────────────────┐
   * │ [左侧信息栏]  │     [中间区域]       │ [右侧小丑牌区域]   │
   * │  固定宽度     │     flex-1          │   固定宽度        │
   * │ 140-160px    │  占据剩余空间        │  280-320px       │
   * └─────────────────────────────────────────────────────────────┘
   * 
   * 底部按钮:
   * ┌─────────────────────────────────────────────────────────────┐
   * │[按点数] [按花色] [出牌] [弃牌]          [📋 牌型] [🃏 卡组] │
   * │    左侧按钮(动态缩放)                右下角按钮           │
   * └─────────────────────────────────────────────────────────────┘
   */
  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'casino-bg game-container';

    const buttonScale = this.calculateButtonScale();

    // 创建主布局容器 - 使用CSS Grid
    // 右侧栏宽度已在CSS中写死，根据响应式断点自动调整
    const mainLayout = document.createElement('div');
    mainLayout.className = 'game-layout';

    // ===== 1. 左侧信息栏 =====
    const leftPanel = this.createLeftPanel();
    leftPanel.className = 'game-layout-left';
    mainLayout.appendChild(leftPanel);

    // ===== 2. 中间区域 =====
    const centerPanel = this.createCenterPanel();
    centerPanel.className = 'game-layout-center';
    mainLayout.appendChild(centerPanel);

    // ===== 3. 右侧小丑牌区域 =====
    const rightPanel = this.createRightPanel();
    rightPanel.className = 'game-layout-right';
    mainLayout.appendChild(rightPanel);

    // ===== 4. 底部按钮区域 =====
    const bottomPanel = this.createBottomPanel();
    bottomPanel.className = 'game-layout-bottom';
    mainLayout.appendChild(bottomPanel);

    this.container.appendChild(mainLayout);

    // 分数弹出框
    this.scorePopup = this.createScorePopup();
    this.container.appendChild(this.scorePopup);

    // 初始化响应式布局管理器
    this.setupResponsiveLayout();

    this.refresh();
  }

  /**
   * 创建左侧信息栏
   * 字体整体-2px，宽度减小，进度条改为分数显示
   */
  private createLeftPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'game-panel-column';
    panel.style.padding = this.scaled(4);
    panel.style.gap = this.scaled(3);

    // 底注和盲注名称合并显示
    const anteBlindSection = document.createElement('div');
    anteBlindSection.className = 'game-panel';
    anteBlindSection.style.cursor = 'pointer';
    anteBlindSection.style.position = 'relative';
    anteBlindSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(19)}">底注 ${this.gameState.ante}</div>
      <div class="text-yellow-400 font-bold text-center" style="font-size: ${this.scaled(23)}" id="blind-name">${this.gameState.currentBlind?.name || '选择关卡'}</div>
    `;
    
    // 添加长按/悬停显示 Boss 效果
    this.setupBossTooltip(anteBlindSection);
    
    panel.appendChild(anteBlindSection);

    // 金币
    const moneySection = document.createElement('div');
    moneySection.className = 'game-panel';
    moneySection.id = 'money-section';
    moneySection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(19)}">金币</div>
      <div class="text-yellow-400 font-bold text-center" style="font-size: ${this.scaled(29)}">$${this.gameState.money}</div>
    `;
    panel.appendChild(moneySection);

    // 当前分数 - 单独一行
    const currentScoreSection = document.createElement('div');
    currentScoreSection.className = 'game-panel';
    currentScoreSection.id = 'current-score-section';
    currentScoreSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(19)}">当前分数</div>
      <div class="text-green-400 font-bold text-center" style="font-size: ${this.scaled(27)}" id="current-score">${this.gameState.roundScore}</div>
    `;
    panel.appendChild(currentScoreSection);

    // 目标分数 - 单独一行
    const targetScoreSection = document.createElement('div');
    targetScoreSection.className = 'game-panel';
    targetScoreSection.id = 'target-score-section';
    targetScoreSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(19)}">目标分数</div>
      <div class="text-yellow-400 font-bold text-center" style="font-size: ${this.scaled(23)}" id="target-score">${this.gameState.currentBlind?.targetScore || 0}</div>
    `;
    panel.appendChild(targetScoreSection);

    // 牌组剩余卡牌数量
    const deckSection = document.createElement('div');
    deckSection.className = 'game-panel';
    deckSection.id = 'deck-section';
    const remainingCards = this.gameState.cardPile.deck?.remaining() ?? 52;
    deckSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(19)}">牌组剩余</div>
      <div class="text-blue-400 font-bold text-center" style="font-size: ${this.scaled(27)}" id="deck-count">${remainingCards}</div>
    `;
    panel.appendChild(deckSection);

    // 利息提示 - 显示当前利息和上限
    const interestSection = document.createElement('div');
    interestSection.className = 'game-panel';
    interestSection.id = 'interest-section';
    const interestCap = this.gameState.getInterestCap?.() ?? 5;
    const currentInterest = Math.min(Math.floor(this.gameState.money / 5), interestCap);
    interestSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(19)}">利息</div>
      <div class="text-green-400 font-bold text-center" style="font-size: ${this.scaled(23)}" id="interest-info">+$${currentInterest}/${interestCap}</div>
      <div class="text-gray-500 text-center" style="font-size: ${this.scaled(14)}" id="interest-hint">每$5得$1</div>
    `;
    panel.appendChild(interestSection);

    return panel;
  }

  /**
   * 创建中间区域
   */
  private createCenterPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = this.scaled(8);
    panel.style.padding = this.scaled(8);

    // 牌型预览区域 - 占据中间区域的顶部，宽高自适应
    this.handPreviewArea = this.createHandPreviewArea();
    this.handPreviewArea.style.flex = '1';
    this.handPreviewArea.style.minHeight = 'clamp(80px, 15vh, 150px)';
    this.handPreviewArea.style.maxHeight = 'clamp(150px, 25vh, 200px)';
    panel.appendChild(this.handPreviewArea);

    // 手牌区域 - 自适应高度
    const handContainer = document.createElement('div');
    handContainer.className = 'hand-container';
    handContainer.style.minHeight = 'clamp(100px, 20vh, 160px)';
    handContainer.style.marginTop = 'auto';
    
    this.handComponent = new HandComponent(handContainer, this.gameState.cardPile.hand, {
      onCardSelect: () => this.handleCardSelect(),
      onPlayHand: () => this.handlePlayHand(),
      onDiscard: () => this.handleDiscard(),
      onSortByRank: () => this.callbacks.onSortByRank?.(),
      onSortBySuit: () => this.callbacks.onSortBySuit?.()
    });
    this.handComponent.setRemaining(
      this.gameState.handsRemaining,
      this.gameState.discardsRemaining
    );
    panel.appendChild(handContainer);

    return panel;
  }

  /**
   * 创建右侧小丑牌区�?
   */
  private createRightPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'game-panel-column';
    panel.style.padding = `${this.scaled(8)} ${this.scaled(16)} ${this.scaled(8)} ${this.scaled(8)}`;
    panel.style.gap = this.scaled(8);

    // 小丑牌区�?
    const jokersSection = document.createElement('div');
    jokersSection.style.flex = '0 0 auto';
    jokersSection.style.display = 'flex';
    jokersSection.style.flexDirection = 'column';

    const jokersTitle = document.createElement('h3');
    jokersTitle.style.fontSize = this.scaled(19);
    jokersTitle.className = 'text-yellow-400 font-bold mb-2 text-center';
    jokersTitle.textContent = `🤡 小丑牌 (${this.gameState.getJokerCount()}/5)`;
    jokersSection.appendChild(jokersTitle);

    this.jokersArea = document.createElement('div');
    this.jokersArea.className = 'jokers-area';
    this.jokersArea.id = 'jokers-area';
    jokersSection.appendChild(this.jokersArea);
    panel.appendChild(jokersSection);

    // 消耗牌区域 - 紧跟小丑牌
    const consumablesSection = document.createElement('div');
    consumablesSection.style.flex = '0 0 auto';
    consumablesSection.style.marginTop = this.scaled(8);

    const consumablesTitle = document.createElement('h3');
    consumablesTitle.style.fontSize = this.scaled(19);
    consumablesTitle.className = 'text-purple-400 font-bold mb-2 text-center';
    consumablesTitle.textContent = `🎴 消耗牌 (${this.gameState.getConsumableCount()}/${this.gameState.getMaxConsumableSlots()})`;
    consumablesSection.appendChild(consumablesTitle);

    const consumablesArea = document.createElement('div');
    consumablesArea.className = 'consumables-area';
    consumablesArea.id = 'consumables-area';
    consumablesSection.appendChild(consumablesArea);
    panel.appendChild(consumablesSection);

    // 右侧按钮组：牌型和卡组（放在消耗牌下面）水平排列
    const rightButtonsSection = document.createElement('div');
    rightButtonsSection.style.flex = '1';
    rightButtonsSection.style.display = 'flex';
    rightButtonsSection.style.flexDirection = 'row';
    rightButtonsSection.style.justifyContent = 'center';
    rightButtonsSection.style.alignItems = 'flex-end';
    rightButtonsSection.style.padding = `${this.scaled(8)} 0`;
    rightButtonsSection.style.gap = this.scaled(8);

    const buttonScale = this.calculateButtonScale();

    // 牌型按钮
    const handRanksBtn = document.createElement('button');
    handRanksBtn.className = 'game-btn game-btn-secondary';
    handRanksBtn.style.fontSize = buttonScale.fontSize;
    handRanksBtn.style.padding = buttonScale.padding;
    handRanksBtn.style.flex = '1';
    handRanksBtn.innerHTML = '📋 牌型';
    handRanksBtn.addEventListener('click', () => this.handRanksModal.show());
    rightButtonsSection.appendChild(handRanksBtn);

    // 卡组按钮
    const deckOverviewBtn = document.createElement('button');
    deckOverviewBtn.className = 'game-btn game-btn-secondary';
    deckOverviewBtn.style.fontSize = buttonScale.fontSize;
    deckOverviewBtn.style.padding = buttonScale.padding;
    deckOverviewBtn.style.flex = '1';
    deckOverviewBtn.innerHTML = '🃏 卡组';
    deckOverviewBtn.addEventListener('click', () => this.deckOverviewModal.show());
    rightButtonsSection.appendChild(deckOverviewBtn);

    panel.appendChild(rightButtonsSection);

    return panel;
  }

  /**
   * 创建底部按钮区域
   * 只包含排序和出牌弃牌按钮，均匀分布，四个按钮一样宽
   * 按钮宽度根据中间栏宽度自适应
   */
  private createBottomPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.display = 'flex';
    panel.style.justifyContent = 'space-evenly';
    panel.style.alignItems = 'center';
    panel.style.padding = `${this.scaled(8)} ${this.scaled(16)}`;
    panel.style.gap = this.scaled(16);
    panel.style.width = '100%';
    panel.style.boxSizing = 'border-box';

    const buttonScale = this.calculateButtonScale();

    // 按点数排序按钮
    const sortRankBtn = document.createElement('button');
    sortRankBtn.className = 'game-btn game-btn-secondary';
    sortRankBtn.style.fontSize = buttonScale.fontSize;
    sortRankBtn.style.padding = `${this.scaled(10)} ${this.scaled(8)}`;
    sortRankBtn.style.flex = '1 1 0';
    sortRankBtn.style.minWidth = '0';
    sortRankBtn.style.whiteSpace = 'nowrap';
    sortRankBtn.style.overflow = 'hidden';
    sortRankBtn.style.textOverflow = 'ellipsis';
    sortRankBtn.textContent = '按点数';
    sortRankBtn.addEventListener('click', () => this.callbacks.onSortByRank?.());
    panel.appendChild(sortRankBtn);

    // 按花色排序按钮
    const sortSuitBtn = document.createElement('button');
    sortSuitBtn.className = 'game-btn game-btn-secondary';
    sortSuitBtn.style.fontSize = buttonScale.fontSize;
    sortSuitBtn.style.padding = `${this.scaled(10)} ${this.scaled(8)}`;
    sortSuitBtn.style.flex = '1 1 0';
    sortSuitBtn.style.minWidth = '0';
    sortSuitBtn.style.whiteSpace = 'nowrap';
    sortSuitBtn.style.overflow = 'hidden';
    sortSuitBtn.style.textOverflow = 'ellipsis';
    sortSuitBtn.textContent = '按花色';
    sortSuitBtn.addEventListener('click', () => this.callbacks.onSortBySuit?.());
    panel.appendChild(sortSuitBtn);

    // 出牌按钮
    const playBtn = document.createElement('button');
    playBtn.className = 'game-btn game-btn-primary';
    playBtn.id = 'play-hand-btn';
    playBtn.style.fontSize = buttonScale.fontSize;
    playBtn.style.padding = `${this.scaled(10)} ${this.scaled(8)}`;
    playBtn.style.flex = '1 1 0';
    playBtn.style.minWidth = '0';
    playBtn.style.whiteSpace = 'nowrap';
    playBtn.style.overflow = 'hidden';
    playBtn.style.textOverflow = 'ellipsis';
    playBtn.innerHTML = `出牌 (${this.gameState.handsRemaining})`;
    playBtn.addEventListener('click', () => this.handlePlayHand());
    panel.appendChild(playBtn);

    // 弃牌按钮
    const discardBtn = document.createElement('button');
    discardBtn.className = 'game-btn game-btn-danger';
    discardBtn.id = 'discard-btn';
    discardBtn.style.fontSize = buttonScale.fontSize;
    discardBtn.style.padding = `${this.scaled(10)} ${this.scaled(8)}`;
    discardBtn.style.flex = '1 1 0';
    discardBtn.style.minWidth = '0';
    discardBtn.style.whiteSpace = 'nowrap';
    discardBtn.style.overflow = 'hidden';
    discardBtn.style.textOverflow = 'ellipsis';
    discardBtn.innerHTML = `弃牌 (${this.gameState.discardsRemaining})`;
    discardBtn.addEventListener('click', () => this.handleDiscard());
    panel.appendChild(discardBtn);

    return panel;
  }

  /**
   * 设置 Boss 盲注提示框
   * 长按或悬停显示 Boss 详细效果
   */
  private setupBossTooltip(element: HTMLElement): void {
    // 点击显示Boss效果弹窗
    element.addEventListener('click', () => {
      this.showBossEffectModal();
    });
  }

  /**
   * 显示Boss效果弹窗
   */
  private showBossEffectModal(): void {
    const currentBoss = this.gameState.bossState.getCurrentBoss();
    const currentBlind = this.gameState.currentBlind;

    // 创建弹窗背景
    const modal = document.createElement('div');
    modal.className = 'boss-effect-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    // 创建弹窗内容
    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border: 3px solid #ef4444;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 40px rgba(239, 68, 68, 0.5);
    `;

    // 标题
    const title = document.createElement('div');
    title.textContent = '盲注信息';
    title.style.cssText = `
      font-size: ${this.scaled(24)};
      font-weight: bold;
      color: #fbbf24;
      text-align: center;
      margin-bottom: 20px;
    `;
    content.appendChild(title);

    // 盲注名称
    if (currentBlind) {
      const blindName = document.createElement('div');
      blindName.textContent = currentBlind.name;
      blindName.style.cssText = `
        font-size: ${this.scaled(20)};
        font-weight: bold;
        color: #ffffff;
        text-align: center;
        margin-bottom: 8px;
      `;
      content.appendChild(blindName);

      // 目标分数
      const targetScore = document.createElement('div');
      targetScore.textContent = `目标分数: ${currentBlind.targetScore}`;
      targetScore.style.cssText = `
        font-size: ${this.scaled(16)};
        color: #9ca3af;
        text-align: center;
        margin-bottom: 20px;
      `;
      content.appendChild(targetScore);
    }

    // Boss信息
    if (currentBoss) {
      const bossConfig = BossSystem.getBossConfig(currentBoss);
      if (bossConfig) {
        const divider = document.createElement('div');
        divider.style.cssText = `
          height: 2px;
          background: linear-gradient(90deg, transparent, #ef4444, transparent);
          margin: 16px 0;
        `;
        content.appendChild(divider);

        const bossTitle = document.createElement('div');
        bossTitle.textContent = 'Boss效果';
        bossTitle.style.cssText = `
          font-size: ${this.scaled(18)};
          font-weight: bold;
          color: #ef4444;
          text-align: center;
          margin-bottom: 12px;
        `;
        content.appendChild(bossTitle);

        const bossName = document.createElement('div');
        bossName.textContent = bossConfig.name;
        bossName.style.cssText = `
          font-size: ${this.scaled(20)};
          font-weight: bold;
          color: #ffffff;
          text-align: center;
          margin-bottom: 8px;
        `;
        content.appendChild(bossName);

        const bossDesc = document.createElement('div');
        bossDesc.textContent = bossConfig.description;
        bossDesc.style.cssText = `
          font-size: ${this.scaled(16)};
          color: #d1d5db;
          text-align: center;
          line-height: 1.5;
        `;
        content.appendChild(bossDesc);
      }
    } else {
      const noBoss = document.createElement('div');
      noBoss.textContent = '当前没有Boss效果';
      noBoss.style.cssText = `
        font-size: ${this.scaled(16)};
        color: #6b7280;
        text-align: center;
        margin-top: 20px;
      `;
      content.appendChild(noBoss);
    }

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = `
      margin-top: 24px;
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: ${this.scaled(16)};
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.transform = 'scale(1.05)';
    });
    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.transform = 'scale(1)';
    });
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    content.appendChild(closeBtn);

    modal.appendChild(content);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * 设置响应式布局管理器
   * 屏幕大小变化时只刷新手牌布局，避免重复渲染
   */
  private setupResponsiveLayout(): void {
    // 清理旧的管理器
    if (this.layoutManager) {
      this.layoutManager.destroy();
    }

    // 创建新的管理器
    this.layoutManager = new ResponsiveLayoutManager(this.container, {
      minScale: 0.25,
      maxScale: 2.5,
      scaleStep: 0.05,
      overflowTolerance: 2,
      autoScale: true
    });

    // 初始检查
    setTimeout(() => {
      this.layoutManager?.checkAndAdjustLayout();
    }, 300);

    // 窗口大小改变时只刷新手牌，不重新渲染整个布局
    // 手牌组件有自己的 ResizeObserver，这里只需要处理布局缩放
    window.addEventListener('resize', () => {
      // 由 ResponsiveLayoutManager 处理缩放调整
      setTimeout(() => {
        this.layoutManager?.checkAndAdjustLayout();
        // 重新计算小丑牌重叠量
        this.recalculateJokerOverlap();
      }, 100);
    });
  }

  /**
   * 重新计算小丑牌和消耗牌重叠量（用于窗口大小改变时）
   */
  private recalculateJokerOverlap(): void {
    // 重新计算小丑牌重叠量
    if (this.jokersArea) {
      const jokerCards = this.jokersArea.querySelectorAll('.joker-card');
      if (jokerCards.length > 1) {
        const overlap = this.calculateJokerOverlap(jokerCards.length);
        jokerCards.forEach((card, index) => {
          if (index > 0) {
            (card as HTMLElement).style.marginLeft = `-${overlap}px`;
          } else {
            (card as HTMLElement).style.marginLeft = '0';
          }
        });
      }
    }

    // 重新计算消耗牌重叠量
    const consumablesArea = document.getElementById('consumables-area');
    if (consumablesArea) {
      const consumableCards = consumablesArea.querySelectorAll('.consumable-card');
      if (consumableCards.length > 1) {
        const overlap = this.calculateConsumableOverlap(consumableCards.length);
        consumableCards.forEach((card, index) => {
          if (index > 0) {
            (card as HTMLElement).style.marginLeft = `-${overlap}px`;
          } else {
            (card as HTMLElement).style.marginLeft = '0';
          }
        });
      }
    }
  }

  /**
   * 创建牌型预览区域
   * 布局：左右列宽度比例固定为 1:3（左列减小）
   * ┌───────────────────┬────────────────────────────────────────────────┐
   * │                   │  ┌────────────────┬────────────────┐           │
   * │   高牌            │  │    5 筹码      │   × 1 倍率     │           │
   * │   选择卡牌查看牌型 │  │   + 10         │   + 44         │           │
   * ├───────────────────┤  └────────────────┴────────────────┘           │
   * │   已选择 5 张      │      预计: 15 × 45 = 675                       │
   * └───────────────────┴────────────────────────────────────────────────┘
   * 
   * 响应式设计：
   * - 小屏幕 (宽度<600px): 紧凑布局，较小字体
   * - 中等屏幕 (600px-1200px): 标准布局
   * - 大屏幕 (宽度>1200px): 限制最大尺寸，避免太空
   * - 文字自适应：每个可变文字外层有固定大小的父容器，文字根据父容器大小动态调整
   */
  private createHandPreviewArea(): HTMLElement {
    const area = document.createElement('div');
    area.className = 'hand-preview';
    area.id = 'hand-preview-area';
    area.style.display = 'flex';
    area.style.flexDirection = 'row';
    area.style.justifyContent = 'center';
    area.style.alignItems = 'center';
    // 减小上下padding，避免边框间距太大；增大左右padding
    area.style.padding = 'clamp(4px, 1vh, 8px) clamp(16px, 4vw, 32px)';
    area.style.margin = 'clamp(2px, 0.5vh, 4px)';
    // 左右栏中间增加padding
    area.style.gap = 'clamp(16px, 4vw, 32px)';

    area.innerHTML = `
      <!-- 左列：牌型（占2/3）和选牌数（占1/3），宽度占比 25%，高度占90% -->
      <div class="preview-left-column" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 25%; height: 90%; flex-shrink: 0;">
        <!-- 牌型区域：占2/3高度，单行显示，字体可放大 -->
        <div class="preview-hand-type-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 66.67%; margin-bottom: 4px; width: 100%; overflow: hidden;">
          <!-- 固定大小的父容器，初次渲染后大小固定 -->
          <div class="auto-fit-text-container" data-container-id="hand-type" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            <div class="hand-preview-name auto-fit-text" id="preview-hand-type" data-max-font="48" data-container-id="hand-type" style="font-size: clamp(0.875rem, 3vw, 3rem); font-weight: bold; color: #ffd700; line-height: 1; text-align: center; white-space: nowrap;">选择卡牌查看牌型</div>
          </div>
        </div>
        <!-- 选牌数：占1/3高度，强制单行 -->
        <div class="auto-fit-text-container" data-container-id="selected-count" style="width: 100%; height: 33.33%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <div class="hand-preview-selected auto-fit-text" id="preview-selected-count" data-max-font="20" data-container-id="selected-count" style="font-size: clamp(0.625rem, 1.5vw, 1.25rem); color: #9ca3af; line-height: 1; text-align: center; white-space: nowrap;">已选择 0 张卡牌</div>
        </div>
      </div>

      <!-- 右列：筹码/倍率信息和预计分数，宽度占比 75%，高度占90% -->
      <div class="preview-right-column" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 75%; height: 90%;">
        <!-- 右列第一行：筹码、乘号、倍率三列布局 -->
        <div class="preview-stats-row" style="display: flex; flex-direction: row; align-items: center; justify-content: center; width: 100%; height: 60%;">
          <!-- 左边：筹码信息 -->
          <div class="preview-chips-section" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 45%; height: 100%; overflow: hidden; gap: 4px;">
            <!-- 基础值和加成各占50%高度，1:1比例 -->
            <div class="auto-fit-text-container" data-container-id="base-chips" style="width: 100%; height: 50%; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; overflow: hidden;">
              <div class="auto-fit-text" id="preview-base-chips" data-max-font="32" data-container-id="base-chips" style="font-size: clamp(0.75rem, 2vw, 2rem); color: #60a5fa; white-space: nowrap; line-height: 1; text-align: center;">0 筹码</div>
            </div>
            <div class="auto-fit-text-container" data-container-id="chip-bonus" style="width: 100%; height: 50%; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; overflow: hidden;">
              <div class="auto-fit-text" id="preview-chip-bonus" data-max-font="24" data-container-id="chip-bonus" style="font-size: clamp(0.625rem, 1.8vw, 1.5rem); color: #93c5fd; white-space: nowrap; line-height: 1; text-align: center;">+ 0</div>
            </div>
          </div>
          <!-- 中间：乘号 -->
          <div class="preview-multiply-sign" style="display: flex; align-items: center; justify-content: center; width: 10%; height: 100%;">
            <span style="font-size: 1.5rem; color: #9ca3af; font-weight: bold;">×</span>
          </div>
          <!-- 右边：倍率信息 -->
          <div class="preview-mult-section" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 45%; height: 100%; overflow: hidden; gap: 4px;">
            <!-- 基础值和加成各占50%高度，1:1比例 -->
            <div class="auto-fit-text-container" data-container-id="base-mult" style="width: 100%; height: 50%; display: flex; align-items: center; justify-content: flex-start; padding-left: 8px; overflow: hidden;">
              <div class="auto-fit-text" id="preview-base-mult" data-max-font="32" data-container-id="base-mult" style="font-size: clamp(0.75rem, 2vw, 2rem); color: #f87171; white-space: nowrap; line-height: 1; text-align: center;">1 倍率</div>
            </div>
            <div class="auto-fit-text-container" data-container-id="mult-bonus" style="width: 100%; height: 50%; display: flex; align-items: center; justify-content: flex-start; padding-left: 8px; overflow: hidden;">
              <div class="auto-fit-text" id="preview-mult-bonus" data-max-font="24" data-container-id="mult-bonus" style="font-size: clamp(0.625rem, 1.8vw, 1.5rem); color: #fca5a5; white-space: nowrap; line-height: 1; text-align: center;">+ 0</div>
            </div>
          </div>
        </div>
        <!-- 右列第二行：预计分数 -->
        <div class="auto-fit-text-container" data-container-id="total-score" style="width: 100%; height: 40%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <div class="preview-total-row auto-fit-text" id="preview-total-score" data-max-font="28" data-container-id="total-score" style="font-size: clamp(0.75rem, 2vw, 1.75rem); color: #fbbf24; font-weight: bold; white-space: nowrap; line-height: 1; text-align: center;">
            -
          </div>
        </div>
      </div>
    `;

    // 初始化父容器固定大小
    requestAnimationFrame(() => {
      this.fixContainerSizes();
    });

    return area;
  }

  /**
   * 固定父容器大小
   * 在初次渲染完成后，记录每个容器的大小并设为固定值
   */
  private fixContainerSizes(): void {
    const previewArea = document.getElementById('hand-preview-area');
    if (!previewArea) return;

    const containers = previewArea.querySelectorAll('.auto-fit-text-container');
    
    containers.forEach((container) => {
      const element = container as HTMLElement;
      // 如果已经固定过大小，跳过
      if (element.dataset.fixed === 'true') return;
      
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement?.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        // 将大小固定为当前实际大小
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
        element.style.flex = 'none';
        element.dataset.fixed = 'true';
      }
    });
  }

  /**
   * 调整预览区域文字大小以适应容器
   * 根据文字长度动态计算最合适的字号，支持放大和缩小
   * 基于固定大小的父容器来判断是否越界
   * 出牌后牌型变化时重新计算
   */
  private adjustPreviewFontSizes(): void {
    const previewArea = document.getElementById('hand-preview-area');
    if (!previewArea) return;

    // 确保父容器大小已固定
    this.fixContainerSizes();

    const autoFitElements = previewArea.querySelectorAll('.auto-fit-text');
    
    autoFitElements.forEach((el) => {
      const element = el as HTMLElement;
      // 通过 data-container-id 找到对应的固定大小父容器
      const containerId = element.dataset.containerId;
      const container = containerId 
        ? previewArea.querySelector(`.auto-fit-text-container[data-container-id="${containerId}"]`) as HTMLElement
        : element.parentElement;
      
      if (!container) return;
      
      // 使用父容器的固定大小来判断越界
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 获取最大字体限制（从 data 属性或默认值）
      const maxFontSize = parseInt(element.dataset.maxFont || '48');
      const minFontSize = 10;
      
      // 先重置字体大小为最小值，然后逐步放大
      let fontSize = minFontSize;
      element.style.fontSize = `${fontSize}px`;
      
      // 逐步增大字体直到填满容器或达到最大值
      let attempts = 0;
      while (attempts < 50) {
        const nextFontSize = fontSize + 1;
        if (nextFontSize > maxFontSize) break;
        
        // 尝试设置更大的字体
        element.style.fontSize = `${nextFontSize}px`;
        
        // 检查是否溢出（基于固定大小的父容器）
        const isOverflowX = element.scrollWidth > containerWidth;
        const isOverflowY = element.scrollHeight > containerHeight;
        
        if (isOverflowX || isOverflowY) {
          // 如果溢出，回退到上一个大小
          element.style.fontSize = `${fontSize}px`;
          break;
        }
        
        fontSize = nextFontSize;
        attempts++;
      }
    });
  }

  /**
   * 创建分数弹出框
   */
  private createScorePopup(): HTMLElement {
    const popup = document.createElement('div');
    popup.id = 'score-popup';
    popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 hidden';
    popup.innerHTML = `
      <div class="text-center">
        <div class="text-6xl font-bold text-yellow-400 drop-shadow-lg" id="popup-score">0</div>
        <div class="text-2xl text-white mt-2" id="popup-hand-type"></div>
      </div>
    `;
    return popup;
  }

  /**
   * 更新左侧信息栏
   */
  private updateTopBar(): void {
    // 更新底注和盲注名称（合并在一个格子中）
    const blindName = document.getElementById('blind-name');
    if (blindName) {
      blindName.textContent = this.gameState.currentBlind?.name || '选择关卡';
      // 更新底注值（在父元素的第一个子元素中）
      const anteLabel = blindName.parentElement?.querySelector('.text-gray-400');
      if (anteLabel) {
        anteLabel.textContent = `底注 ${this.gameState.ante}`;
      }
    }

    // 更新金币
    const moneySection = document.getElementById('money-section');
    if (moneySection) {
      const valueDiv = moneySection.querySelector('.text-yellow-400');
      if (valueDiv) {
        valueDiv.textContent = `$${this.gameState.money}`;
      }
    }

    // 更新当前得分
    const currentScore = document.getElementById('current-score');
    if (currentScore) {
      currentScore.textContent = String(this.gameState.roundScore);
    }

    // 更新目标分数
    const targetScore = document.getElementById('target-score');
    if (targetScore) {
      targetScore.textContent = String(this.gameState.currentBlind?.targetScore || 0);
    }

    // 更新牌组剩余数量
    const deckCount = document.getElementById('deck-count');
    if (deckCount) {
      const remainingCards = this.gameState.cardPile.deck?.remaining() ?? 52;
      deckCount.textContent = String(remainingCards);
    }

    // 更新利息显示
    const interestInfo = document.getElementById('interest-info');
    if (interestInfo) {
      const interestCap = this.gameState.getInterestCap?.() ?? 5;
      const currentInterest = Math.min(Math.floor(this.gameState.money / 5), interestCap);
      interestInfo.textContent = `+$${currentInterest}/${interestCap}`;
    }
  }

  /**
   * 更新进度条
   */
  private updateProgressBar(): void {
    const progressFill = document.getElementById('progress-fill') as HTMLElement;
    if (progressFill) {
      const progress = this.gameState.getProgress();
      progressFill.style.width = `${progress.percentage}%`;

      progressFill.classList.remove('warning', 'danger');
      if (progress.percentage >= 100) {
        progressFill.style.background = 'linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)';
      } else if (progress.percentage >= 70) {
        progressFill.classList.add('warning');
      } else if (progress.percentage >= 40) {
        progressFill.classList.add('danger');
      }
    }
  }

  /**
   * 更新牌型预览
   * 左列：牌型名称（占2/3高度）+ 选牌数（占1/3高度）
   * 右列：筹码/倍率信息 + 预计分数
   */
  private updateHandPreview(): void {
    const handTypeEl = document.getElementById('preview-hand-type');
    const selectedCountEl = document.getElementById('preview-selected-count');
    const baseChipsEl = document.getElementById('preview-base-chips');
    const chipBonusEl = document.getElementById('preview-chip-bonus');
    const baseMultEl = document.getElementById('preview-base-mult');
    const multBonusEl = document.getElementById('preview-mult-bonus');
    const totalScoreEl = document.getElementById('preview-total-score');

    if (!handTypeEl || !totalScoreEl) return;

    const selectedCards = this.gameState.cardPile.hand.getSelectedCards();
    const jokers = this.gameState.getJokerSlots().getJokers();

    // 检查是否有翻面的牌（手牌或小丑牌）
    const hasFaceDownCards = selectedCards.some(card => card.faceDown) ||
                              jokers.some(joker => joker.faceDown);

    // 更新已选择卡牌数量（左列下方 - 选牌数）
    if (selectedCountEl) {
      selectedCountEl.textContent = `已选择 ${selectedCards.length} 张卡牌`;
    }

    if (selectedCards.length === 0) {
      // 重置所有显示
      handTypeEl.textContent = '选择卡牌查看牌型';
      if (baseChipsEl) baseChipsEl.textContent = '0 筹码';
      if (chipBonusEl) chipBonusEl.textContent = '';
      if (baseMultEl) baseMultEl.textContent = '1 倍率';
      if (multBonusEl) multBonusEl.textContent = '';
      totalScoreEl.textContent = '-';
      // 调整字体大小以适应容器
      requestAnimationFrame(() => {
        this.adjustPreviewFontSizes();
      });
      return;
    }

    // 如果有翻面的牌，不显示预览分数
    if (hasFaceDownCards) {
      handTypeEl.textContent = '有翻面的牌，无法预览分数';
      if (baseChipsEl) baseChipsEl.textContent = '-';
      if (chipBonusEl) chipBonusEl.textContent = '';
      if (baseMultEl) baseMultEl.textContent = '-';
      if (multBonusEl) multBonusEl.textContent = '';
      totalScoreEl.textContent = '翻面中...';
      // 调整字体大小以适应容器
      requestAnimationFrame(() => {
        this.adjustPreviewFontSizes();
      });
      return;
    }

    // 检查是否有四指效果并设置配置
    const fourFingers = jokers.some(j => j.effect?.({}).fourFingers);
    PokerHandDetector.setConfig({ fourFingers });

    const detectionResult = PokerHandDetector.detect(selectedCards);

    // 清除配置
    PokerHandDetector.clearConfig();

    if (detectionResult) {
      const baseValue = HAND_BASE_VALUES[detectionResult.handType];

      // 使用ScoringSystem计算完整分数
      const gameState = {
        money: this.gameState.money,
        interestCap: this.gameState.getInterestCap(),
        hands: this.gameState.handsRemaining,
        discards: this.gameState.discardsRemaining
      };

      // 获取手持卡牌（未选中的手牌）用于计算Steel效果
      const handCards = this.gameState.cardPile.hand.getCards();
      const selectedIndices = this.gameState.cardPile.hand.getSelectedIndices();
      const heldCards = handCards.filter((_, index) => !selectedIndices.has(index));

      const scoreResult = ScoringSystem.calculate(selectedCards, detectionResult.handType, gameState, heldCards, this.gameState.getJokerSlots(), undefined, undefined, undefined, undefined, undefined, undefined, undefined, true, this.gameState.getHandLevelState());

      // 左列：牌型名称
      handTypeEl.textContent = baseValue.displayName;

      // 右列第一行左边：筹码信息
      if (baseChipsEl) {
        baseChipsEl.textContent = `${scoreResult.baseChips} 筹码`;
      }
      if (chipBonusEl) {
        const cardChipBonus = scoreResult.chipBonus;
        chipBonusEl.textContent = cardChipBonus > 0 ? `+ ${cardChipBonus}` : '';
      }

      // 右列第一行右边：倍率信息（显示数字+倍率，乘号在中间列）
      if (baseMultEl) {
        baseMultEl.textContent = `${scoreResult.baseMultiplier} 倍率`;
      }
      if (multBonusEl) {
        multBonusEl.textContent = scoreResult.multBonus > 0 ? `+ ${scoreResult.multBonus}` : '';
      }

      // 右列第二行：预计分数
      // 注意：预览时不计算概率触发类小丑牌的效果
      totalScoreEl.textContent = `预计: ${scoreResult.totalChips} × ${scoreResult.totalMultiplier} = ${scoreResult.totalScore}`;
    } else {
      handTypeEl.textContent = '无效牌型';
      if (baseChipsEl) baseChipsEl.textContent = '-';
      if (chipBonusEl) chipBonusEl.textContent = '';
      if (baseMultEl) baseMultEl.textContent = '-';
      if (multBonusEl) multBonusEl.textContent = '';
      totalScoreEl.textContent = '-';
    }

    // 调整字体大小以适应容器
    requestAnimationFrame(() => {
      this.adjustPreviewFontSizes();
    });
  }

  /**
   * 计算卡牌重叠量 - 完全基于容器大小的响应式计算
   * 目标：让卡牌填满整个容器，充分利用空间
   * @param cardCount 卡牌数量
   * @param containerWidth 容器宽度（包含padding）
   * @param cardWidth 单张卡牌宽度
   * @returns 重叠量（像素）
   */
  private calculateOverlap(cardCount: number, containerWidth: number, cardWidth: number): number {
    if (cardCount <= 1) return 0;

    // jokers-area 的 padding-left 为 0，不需要减去 padding
    const availableWidth = Math.max(0, containerWidth);
    const totalCardsWidth = cardWidth * cardCount;

    // 如果所有卡牌不重叠也能放下，使用最小重叠（5%）
    if (totalCardsWidth <= availableWidth) {
      return cardWidth * 0.05;
    }

    // 需要重叠才能放下
    // 计算需要的重叠量，让最后一张牌刚好填满容器
    // 公式：第一张牌完整显示 + (n-1)张牌重叠显示 = 可用宽度
    // cardWidth + (cardCount - 1) * (cardWidth - overlap) = availableWidth
    // 解得：overlap = (totalCardsWidth - availableWidth) / (cardCount - 1)
    const requiredOverlap = (totalCardsWidth - availableWidth) / (cardCount - 1);

    // 限制重叠量：最小5%，最大70%（允许更紧密的排列以充分利用空间）
    const minOverlap = cardWidth * 0.05;
    const maxOverlap = cardWidth * 0.7;

    return Math.max(minOverlap, Math.min(requiredOverlap, maxOverlap));
  }

  /**
   * 根据小丑牌数量计算重叠量
   */
  private calculateJokerOverlap(jokerCount: number): number {
    if (!this.jokersArea) return 0;
    if (jokerCount <= 1) return 0;

    // 使用 getBoundingClientRect 获取更准确的容器宽度
    const containerRect = this.jokersArea.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // 获取第一个卡片的真实宽度
    const firstCard = this.jokersArea.querySelector('.joker-card') as HTMLElement;
    const cardWidth = firstCard?.getBoundingClientRect().width || 90;

    return this.calculateOverlap(jokerCount, containerWidth, cardWidth);
  }

  /**
   * 创建小丑牌区域 - 水平重叠排列，支持点击展开
   */
  private updateJokers(): void {
    if (!this.jokersArea) return;
    this.jokersArea.innerHTML = '';

    const jokers = this.gameState.jokers as Joker[];

    if (jokers.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-gray-500 text-center';
      emptyMsg.style.fontSize = 'clamp(0.625rem, 1.5vw, 0.875rem)';
      emptyMsg.textContent = '暂无小丑牌';
      this.jokersArea.appendChild(emptyMsg);
      return;
    }

    // 先渲染所有小丑牌以获取实际尺寸
    const jokerCards: HTMLElement[] = [];
    jokers.forEach((joker, index) => {
      const jokerCard = CardComponent.renderJokerCard({
        id: joker.id,
        name: joker.name,
        description: joker.description,
        rarity: joker.rarity,
        cost: joker.cost,
        edition: joker.edition,
        disabled: joker.disabled,
        faceDown: joker.faceDown
      });

      jokerCard.draggable = jokers.length > 1;
      jokerCard.style.cursor = jokers.length > 1 ? 'grab' : 'pointer';
      jokerCard.dataset.index = String(index);
      jokerCards.push(jokerCard);
      this.jokersArea!.appendChild(jokerCard);
    });

    // 计算并应用重叠量
    const overlap = this.calculateJokerOverlap(jokers.length);
    jokerCards.forEach((card, index) => {
      if (index > 0) {
        card.style.marginLeft = `-${overlap}px`;
      }
    });

    // 重新绑定事件（因为已经添加到DOM）
    jokerCards.forEach((jokerCard, index) => {
      const joker = jokers[index];

      // 点击显示详情弹窗（Board界面不带卖出按钮）
      jokerCard.addEventListener('click', (e) => {
        // 如果正在拖拽，不触发点击
        if (this.draggedJokerIndex !== null) return;
        this.jokerDetailModal.show({
          joker,
          index,
          showSellButton: false
        });
      });

      // 拖拽事件（桌面端）
      if (jokers.length > 1) {
        jokerCard.addEventListener('dragstart', (e) => this.handleJokerDragStart(e, index));
        jokerCard.addEventListener('dragend', (e) => this.handleJokerDragEnd(e));
        jokerCard.addEventListener('dragover', (e) => this.handleJokerDragOver(e));
        jokerCard.addEventListener('drop', (e) => this.handleJokerDrop(e, index));
        jokerCard.addEventListener('dragenter', (e) => this.handleJokerDragEnter(e));
        jokerCard.addEventListener('dragleave', (e) => this.handleJokerDragLeave(e));

        // 触摸事件（移动端支持）
        jokerCard.addEventListener('touchstart', (e) => this.handleJokerTouchStart(e, index), { passive: true });
        jokerCard.addEventListener('touchmove', (e) => this.handleJokerTouchMove(e), { passive: false });
        jokerCard.addEventListener('touchend', (e) => this.handleJokerTouchEnd(e, joker, index));
        jokerCard.addEventListener('touchcancel', (e) => this.handleJokerTouchEnd(e, joker, index));
      }
    });
  }

  private draggedJokerIndex: number | null = null;

  // 触摸事件相关状态
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchCurrentIndex: number | null = null;
  private isTouchDragging: boolean = false;
  private hasTouchMoved: boolean = false;
  private readonly TOUCH_MOVE_THRESHOLD = 10; // 移动超过10px认为是拖拽

  private handleJokerDragStart(e: DragEvent, index: number): void {
    console.log('[Joker Drag] DragStart - index:', index);
    this.draggedJokerIndex = index;
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
    target.style.cursor = 'grabbing';
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  private handleJokerDragEnd(e: DragEvent): void {
    console.log('[Joker Drag] DragEnd');
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    target.style.cursor = 'grab';
    this.draggedJokerIndex = null;
    document.querySelectorAll('[data-index]').forEach(el => {
      (el as HTMLElement).style.transform = '';
      (el as HTMLElement).style.border = '';
    });
  }

  private handleJokerDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  private handleJokerDragEnter(e: DragEvent): void {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    if (this.draggedJokerIndex !== null && this.draggedJokerIndex !== Number(target.dataset.index)) {
      target.style.transform = 'scale(1.02)';
      target.style.border = '2px solid #fbbf24';
    }
  }

  private handleJokerDragLeave(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.border = '';
  }

  private handleJokerDrop(e: DragEvent, targetIndex: number): void {
    e.preventDefault();
    const fromIndex = this.draggedJokerIndex;
    console.log('[Joker Drag] Drop - from:', fromIndex, 'to:', targetIndex);
    if (fromIndex === null || fromIndex === targetIndex) return;

    const success = this.gameState.getJokerSlots().swapJokers(fromIndex, targetIndex);
    console.log('[Joker Drag] Swap result:', success);
    if (success) {
      this.refresh();
      // 修复：交换小丑牌后自动保存
      this.autoSave();
    }

    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.border = '';
  }

  // 触摸事件处理（移动端支持）
  private handleJokerTouchStart(e: TouchEvent, index: number): void {
    console.log('[Joker Touch] TouchStart - index:', index);
    // 不要阻止默认行为，让点击事件能正常触发
    // e.preventDefault();
    // e.stopPropagation();

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchCurrentIndex = index;
    this.draggedJokerIndex = index;
    this.isTouchDragging = true;
    this.hasTouchMoved = false;

    console.log('[Joker Touch] TouchStart completed');
  }

  private handleJokerTouchMove(e: TouchEvent): void {
    if (!this.isTouchDragging || this.draggedJokerIndex === null) {
      console.log('[Joker Touch] TouchMove ignored - not dragging');
      return;
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 如果移动距离超过阈值，认为是拖�?
    if (moveDistance > this.TOUCH_MOVE_THRESHOLD) {
      if (!this.hasTouchMoved) {
        console.log('[Joker Touch] TouchMove - start dragging, distance:', moveDistance);
        this.hasTouchMoved = true;

        // 开始拖动视觉效果
        const target = document.querySelector(`#jokers-area [data-index="${this.draggedJokerIndex}"]`) as HTMLElement;
        if (target) {
          target.style.opacity = '0.7';
          target.style.transform = 'scale(1.05)';
          target.style.zIndex = '100';
          target.style.transition = 'none';
          target.style.cursor = 'grabbing';
        }
      }

      // 检查事件是否可取消，避免 passive 事件警告
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      // 移动被拖拽的元素跟随手指
      const target = document.querySelector(`#jokers-area [data-index="${this.draggedJokerIndex}"]`) as HTMLElement;
      if (target) {
        target.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
        // 临时隐藏被拖动的元素，以�?elementFromPoint 能检测到下方的元�?
        target.style.pointerEvents = 'none';
      }

      // 检测下方的元素（在隐藏被拖动元素后）
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const wrapper = element?.closest('#jokers-area [data-index]') as HTMLElement;

      if (wrapper) {
        const index = Number(wrapper.dataset.index);
        if (index !== this.draggedJokerIndex) {
          // 高亮目标
          document.querySelectorAll('#jokers-area [data-index]').forEach(el => {
            if (Number((el as HTMLElement).dataset.index) !== this.draggedJokerIndex) {
              (el as HTMLElement).style.border = '';
            }
          });
          wrapper.style.border = '3px solid #fbbf24';
          wrapper.style.borderRadius = '8px';
          this.touchCurrentIndex = index;
          console.log('[Joker Touch] TouchMove - over index:', index);
        }
      }

      // 恢复被拖动元素的 pointerEvents
      if (target) {
        target.style.pointerEvents = '';
      }
    }
  }

  private handleJokerTouchEnd(e: TouchEvent, joker: Joker, index: number): void {
    console.log('[Joker Touch] TouchEnd - draggedIndex:', this.draggedJokerIndex, 'currentIndex:', this.touchCurrentIndex, 'hasMoved:', this.hasTouchMoved);

    // 如果没有移动（只是点击），不阻止事件，让 click 事件处理
    if (!this.hasTouchMoved) {
      console.log('[Joker Touch] TouchEnd - was a click, not drag');
      this.resetTouchState();
      return;
    }

    // 是拖动，阻止默认行为
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    console.log('[Joker Touch] TouchEnd - processing drag end');

    const target = document.querySelector(`#jokers-area [data-index="${this.draggedJokerIndex}"]`) as HTMLElement;
    if (target) {
      target.style.opacity = '1';
      target.style.transform = '';
      target.style.zIndex = '';
      target.style.transition = 'transform 0.2s ease';
      target.style.cursor = 'grab';
    }

    // 清除所有高亮
    document.querySelectorAll('#jokers-area [data-index]').forEach(el => {
      (el as HTMLElement).style.border = '';
    });

    // 如果移动到了新位置，交换
    console.log('[Joker Touch] Checking swap condition - currentIndex:', this.touchCurrentIndex, 'draggedIndex:', this.draggedJokerIndex);
    if (this.touchCurrentIndex !== null && this.touchCurrentIndex !== this.draggedJokerIndex && this.draggedJokerIndex !== null) {
      console.log('[Joker Touch] Swapping - from:', this.draggedJokerIndex, 'to:', this.touchCurrentIndex);
      const success = this.gameState.getJokerSlots().swapJokers(this.draggedJokerIndex, this.touchCurrentIndex);
      console.log('[Joker Touch] Swap result:', success);
      if (success) {
        console.log('[Joker Touch] Swap successful, calling refresh and autoSave');
        this.refresh();
        // 修复：交换小丑牌后自动保存
        this.autoSave();
      } else {
        console.log('[Joker Touch] Swap failed, not calling autoSave');
      }
    } else {
      console.log('[Joker Touch] Swap condition not met, skipping swap');
    }

    this.resetTouchState();
  }

  private resetTouchState(): void {
    this.draggedJokerIndex = null;
    this.touchCurrentIndex = null;
    this.isTouchDragging = false;
    this.hasTouchMoved = false;
  }

  /**
   * 自动保存游戏
   */
  private autoSave(): void {
    console.log('[GameBoard] autoSave called');
    try {
      Storage.autoSave(this.gameState);
      console.log('[GameBoard] autoSave success');
    } catch (error) {
      console.error('[GameBoard] autoSave failed:', error);
    }
  }

  /**
   * 根据消耗牌数量计算重叠量
   * 动态调整margin-left，使消耗牌填满整个consumables-area
   */
  private calculateConsumableOverlap(consumableCount: number): number {
    const consumablesArea = document.getElementById('consumables-area');
    if (!consumablesArea) return 0;
    if (consumableCount <= 1) return 0;

    // 使用 getBoundingClientRect 获取更准确的容器宽度
    const containerRect = consumablesArea.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // 获取第一个卡片的真实宽度
    const firstCard = consumablesArea.querySelector('.consumable-card') as HTMLElement;
    const cardWidth = firstCard?.getBoundingClientRect().width || 90;

    return this.calculateOverlap(consumableCount, containerWidth, cardWidth);
  }

  /**
   * 更新消耗牌区域
   */
  private updateConsumables(): void {
    const consumablesArea = document.getElementById('consumables-area');
    if (!consumablesArea) return;

    consumablesArea.innerHTML = '';

    const consumables = this.gameState.consumables as Consumable[];

    if (consumables.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-gray-500 text-center';
      emptyMsg.style.fontSize = 'clamp(0.625rem, 1.5vw, 0.875rem)';
      emptyMsg.textContent = '暂无消耗牌';
      consumablesArea.appendChild(emptyMsg);
      return;
    }

    // 先渲染所有消耗牌
    const consumableCards: HTMLElement[] = [];
    consumables.forEach((consumable, index) => {
      const consumableCard = CardComponent.renderConsumableCard({
        id: consumable.id,
        name: consumable.name,
        description: consumable.description,
        type: consumable.type,
        cost: consumable.cost,
        isNegative: (consumable as any).isNegative
      });

      consumableCard.style.cursor = 'pointer';
      consumableCard.dataset.index = String(index);

      // 点击显示详情弹窗
      consumableCard.addEventListener('click', () => {
        this.consumableDetailModal.show({
          consumable,
          index,
          onUse: (idx) => this.handleUseConsumable(idx),
          onSell: (idx) => this.handleSellConsumable(idx)
        });
      });

      consumableCards.push(consumableCard);
      consumablesArea.appendChild(consumableCard);
    });

    // 计算并应用重叠量
    const overlap = this.calculateConsumableOverlap(consumables.length);
    consumableCards.forEach((card, index) => {
      if (index > 0) {
        card.style.marginLeft = `-${overlap}px`;
      }
    });

    // 更新标题中的数量（区分负片牌）
    const consumablesTitle = consumablesArea.parentElement?.querySelector('h3');
    if (consumablesTitle) {
      const nonNegativeCount = consumables.filter(c => !(c as any).isNegative).length;
      const totalCount = consumables.length;
      const negativeCount = totalCount - nonNegativeCount;
      let titleText = `🎴 消耗牌 (${nonNegativeCount}/${this.gameState.getMaxConsumableSlots()})`;
      if (negativeCount > 0) {
        titleText += ` (+${negativeCount}负片)`;
      }
      consumablesTitle.textContent = titleText;
    }
  }

  /**
   * 处理卡牌选择
   */
  private handleCardSelect(): void {
    this.updateHandPreview();
    this.updateButtonStates();
  }

  /**
   * 更新按钮状态
   */
  private updateButtonStates(): void {
    const hasSelection = this.gameState.cardPile.hand.getSelectionCount() > 0;

    const playBtn = document.getElementById('play-hand-btn') as HTMLButtonElement;
    const discardBtn = document.getElementById('discard-btn') as HTMLButtonElement;

    if (playBtn) {
      playBtn.disabled = !hasSelection || this.gameState.handsRemaining <= 0;
      playBtn.innerHTML = `出牌 (${this.gameState.handsRemaining})`;
    }

    if (discardBtn) {
      discardBtn.disabled = !hasSelection || this.gameState.discardsRemaining <= 0;
      discardBtn.innerHTML = `弃牌 (${this.gameState.discardsRemaining})`;
    }
  }

  /**
   * 处理出牌
   */
  private handlePlayHand(): void {
    // 检查 Boss 限制
    if (!this.gameState.canPlayHand()) {
      // 获取 Boss 限制信息
      const selectedCards = this.gameState.cardPile.hand.getSelectedCards();
      if (selectedCards.length > 0) {
        const handResult = PokerHandDetector.detect(selectedCards);
        const bossResult = BossSystem.canPlayHand(this.gameState.bossState, handResult.handType);
        if (bossResult.canPlay === false && bossResult.message) {
          Toast.error(bossResult.message);
          return;
        }
      }
      return;
    }

    const scoreResult = this.gameState.playHand();

    if (scoreResult) {
      // 显示分数动画
      this.showScorePopup(scoreResult);

      // 回调
      this.callbacks.onPlayHand?.(scoreResult);

      // 刷新显示（只刷新手牌和UI，不重新渲染小丑牌和消耗牌）
      setTimeout(() => {
        this.refreshHandAndUI();
      }, 500);
    }
  }

  /**
   * 处理弃牌
   */
  private handleDiscard(): void {
    const discarded = this.gameState.discardCards();

    if (discarded) {
      this.callbacks.onDiscard?.();
      // 只刷新手牌和UI，不重新渲染小丑牌和消耗牌
      this.refreshHandAndUI();
    }
  }

  /**
   * 处理使用消耗牌
   */
  private handleUseConsumable(index: number): void {
    this.consumableHelper.useConsumable(index);
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理卖出消耗牌
   */
  private handleSellConsumable(index: number): void {
    const result = this.gameState.sellConsumable(index);
    
    if (result.success) {
      this.refresh();
      Toast.success(`消耗牌已卖出，获得 $${result.sellPrice}！`);
    } else {
      Toast.error(result.error || '卖出失败');
    }
  }

  /**
   * 显示分数弹出动画
   */
  private showScorePopup(scoreResult: ScoreResult): void {
    if (!this.scorePopup) return;

    const scoreEl = document.getElementById('popup-score');
    const handTypeEl = document.getElementById('popup-hand-type');
    
    if (scoreEl) scoreEl.textContent = scoreResult.totalScore.toString();
    if (handTypeEl) {
      const baseValue = HAND_BASE_VALUES[scoreResult.handType];
      handTypeEl.textContent = baseValue.displayName;
    }

    this.scorePopup.classList.remove('hidden');
    this.scorePopup.classList.add('animate-score');

    setTimeout(() => {
      this.scorePopup?.classList.add('hidden');
      this.scorePopup?.classList.remove('animate-score');
    }, 1500);
  }

  /**
   * 获取手牌组件
   */
  getHandComponent(): HandComponent | null {
    return this.handComponent;
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this.layoutManager) {
      this.layoutManager.destroy();
      this.layoutManager = null;
    }
  }
}
