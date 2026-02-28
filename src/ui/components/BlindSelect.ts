import { GameState } from '../../models/GameState';
import { BlindType } from '../../types/game';
import { Blind } from '../../models/Blind';
import { formatNumber } from '../../utils/numberFormat';

export interface BlindSelectCallbacks {
  onSelectBlind?: (blindType: BlindType) => void;
  onSkipBlind?: () => void;
  onRerollBoss?: () => void;
}

export class BlindSelect {
  private container: HTMLElement;
  private gameState: GameState;
  private callbacks: BlindSelectCallbacks;

  constructor(container: HTMLElement, gameState: GameState, callbacks: BlindSelectCallbacks = {}) {
    this.container = container;
    this.gameState = gameState;
    this.callbacks = callbacks;
    this.render();
  }

  /**
   * 更新游戏状态
   */
  setGameState(gameState: GameState): void {
    this.gameState = gameState;
    this.render();
  }

  /**
   * 获取当前应该进行的盲注类型
   */
  private getCurrentBlindType(): BlindType {
    return this.gameState.getCurrentBlindPosition();
  }

  /**
   * 渲染关卡选择界面 - 使用 viewport 单位实现流体式响应布局
   */
  render(): void {
    this.container.innerHTML = '';
    // 使用 viewport 单位确保内容适应屏幕大小，优先保证按钮在屏幕内
    this.container.className = 'casino-bg min-h-screen w-full flex flex-col';

    const currentBlindType = this.getCurrentBlindType();

    // 顶部区域 - 标题和底注
    const headerArea = document.createElement('div');
    headerArea.className = 'flex flex-col items-center w-full pt-[2vh] pb-[1vh] px-[2vw]';

    // 标题
    const title = document.createElement('h1');
    title.style.fontSize = 'clamp(1.5rem, 4vw, 2.5rem)';
    title.className = 'font-bold text-yellow-400 mb-[1vh] animate-float';
    title.textContent = '';
    headerArea.appendChild(title);

    // 底注显示
    const anteDisplay = document.createElement('div');
    anteDisplay.style.fontSize = 'clamp(1rem, 3vw, 2rem)';
    anteDisplay.className = 'text-gray-400';
    anteDisplay.textContent = `底注 ${this.gameState.getAnte()}`;
    headerArea.appendChild(anteDisplay);

    this.container.appendChild(headerArea);

    // 关卡卡片容器 - 占据中间所有剩余空间
    const cardsContainer = document.createElement('div');
    cardsContainer.style.gap = 'clamp(8px, 2vw, 24px)';
    cardsContainer.style.padding = '0 clamp(8px, 2vw, 24px)';
    cardsContainer.className = 'flex-1 flex justify-center items-stretch min-h-0';

    // 创建三个关卡卡片，当前盲注高亮显示
    const smallBlind = this.createBlindCard(BlindType.SMALL_BLIND, '小盲注', currentBlindType === BlindType.SMALL_BLIND);
    const bigBlind = this.createBlindCard(BlindType.BIG_BLIND, '大盲注', currentBlindType === BlindType.BIG_BLIND);
    const bossBlind = this.createBlindCard(BlindType.BOSS_BLIND, 'Boss盲注', currentBlindType === BlindType.BOSS_BLIND);

    cardsContainer.appendChild(smallBlind);
    cardsContainer.appendChild(bigBlind);
    cardsContainer.appendChild(bossBlind);

    this.container.appendChild(cardsContainer);

    // 按钮区域 - 固定在底部，优先保证可见
    const buttonArea = document.createElement('div');
    buttonArea.style.gap = 'clamp(16px, 4vw, 32px)';
    buttonArea.style.padding = 'clamp(16px, 3vh, 24px) clamp(16px, 4vw, 32px)';
    buttonArea.className = 'flex justify-center w-full shrink-0';

    // 跳过按钮（小盲注和大盲注可跳过）
    const skipButton = document.createElement('button');
    skipButton.style.fontSize = 'clamp(1rem, 2.5vw, 1.25rem)';
    skipButton.style.height = 'clamp(48px, 9vh, 60px)';
    skipButton.style.minWidth = 'clamp(120px, 25vw, 160px)';
    skipButton.style.display = 'flex';
    skipButton.style.alignItems = 'center';
    skipButton.style.justifyContent = 'center';
    skipButton.className = 'game-btn game-btn-secondary px-[clamp(20px,4vw,32px)]';
    const currentBlind = Blind.create(this.gameState.getAnte(), currentBlindType);
    const canSkip = currentBlind?.canSkipBlind() ?? false;
    const skipReward = currentBlind?.getSkipReward() ?? 0;
    skipButton.textContent = canSkip ? `跳过 (+$${skipReward})` : '不可跳过';
    skipButton.disabled = !canSkip;
    skipButton.addEventListener('click', () => this.handleSkip());

    // 重掷Boss按钮（仅在Boss盲注且有导演剪辑版优惠券时显示）
    const canRerollBoss = this.gameState.canRerollBoss();
    const remainingRerolls = this.gameState.getRemainingBossRerolls();
    const isBossBlind = currentBlindType === BlindType.BOSS_BLIND;

    if (isBossBlind && canRerollBoss) {
      const rerollButton = document.createElement('button');
      rerollButton.style.fontSize = 'clamp(1rem, 2.5vw, 1.25rem)';
      rerollButton.style.height = 'clamp(48px, 9vh, 60px)';
      rerollButton.style.minWidth = 'clamp(120px, 25vw, 160px)';
      rerollButton.style.display = 'flex';
      rerollButton.style.alignItems = 'center';
      rerollButton.style.justifyContent = 'center';
      rerollButton.className = 'game-btn game-btn-secondary px-[clamp(20px,4vw,32px)]';

      const rerollText = remainingRerolls === Infinity
        ? '重掷 Boss (∞)'
        : `重掷 Boss (${remainingRerolls})`;
      rerollButton.textContent = rerollText;
      rerollButton.addEventListener('click', () => this.handleRerollBoss());
      buttonArea.appendChild(rerollButton);
    }

    // 开始按钮 - 只能开始当前盲注
    const startButton = document.createElement('button');
    startButton.style.fontSize = 'clamp(1rem, 2.5vw, 1.25rem)';
    startButton.style.height = 'clamp(48px, 9vh, 60px)';
    startButton.style.minWidth = 'clamp(120px, 25vw, 160px)';
    startButton.style.display = 'flex';
    startButton.style.alignItems = 'center';
    startButton.style.justifyContent = 'center';
    startButton.className = 'game-btn game-btn-primary px-[clamp(20px,4vw,32px)]';
    startButton.textContent = `开始 ${this.getBlindLabel(currentBlindType)}`;
    startButton.addEventListener('click', () => this.handleStart());

    buttonArea.appendChild(skipButton);
    buttonArea.appendChild(startButton);

    this.container.appendChild(buttonArea);
  }

  /**
   * 获取盲注标签
   */
  private getBlindLabel(blindType: BlindType): string {
    switch (blindType) {
      case BlindType.SMALL_BLIND:
        return '小盲注';
      case BlindType.BIG_BLIND:
        return '大盲注';
      case BlindType.BOSS_BLIND:
        return 'Boss盲注';
      default:
        return '盲注';
    }
  }

  /**
   * 创建关卡卡片
   */
  private createBlindCard(blindType: BlindType, label: string, isCurrent: boolean): HTMLElement {
    const ante = this.gameState.getAnte();
    const blind = Blind.create(ante, blindType);

    if (!blind) {
      const errorCard = document.createElement('div');
      errorCard.className = 'blind-card';
      errorCard.textContent = '加载失败';
      return errorCard;
    }

    const isBoss = blindType === BlindType.BOSS_BLIND;
    const card = document.createElement('div');
    // 当前盲注高亮显示，非当前盲注变暗
    card.className = `blind-card ${isBoss ? 'boss' : ''} ${isCurrent ? 'selected' : 'opacity-50'}`;
    card.dataset.blindType = blindType;
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.style.overflow = 'hidden';

    // 标题区域 - 顶部对齐
    const headerSection = document.createElement('div');
    headerSection.style.display = 'flex';
    headerSection.style.flexDirection = 'column';
    headerSection.style.alignItems = 'center';
    headerSection.style.marginBottom = '8px';

    // 名称
    const nameEl = document.createElement('div');
    nameEl.className = 'blind-name';
    nameEl.style.fontSize = 'clamp(16px, 4vw, 32px)';
    nameEl.style.lineHeight = '1.2';
    nameEl.style.textAlign = 'center';
    nameEl.textContent = blind.name;

    headerSection.appendChild(nameEl);

    // 中间区域 - Boss效果描述（仅Boss盲注）
    const middleSection = document.createElement('div');
    middleSection.style.display = 'flex';
    middleSection.style.flexDirection = 'column';
    middleSection.style.alignItems = 'center';
    middleSection.style.justifyContent = 'center';
    middleSection.style.flex = '1';
    middleSection.style.minHeight = '0';
    middleSection.style.overflow = 'hidden';
    middleSection.style.padding = '4px 0';

    if (isBoss && blind.description) {
      const effectEl = document.createElement('div');
      effectEl.className = 'text-red-400';
      effectEl.style.fontSize = 'clamp(12px, 2.5vw, 24px)';
      effectEl.style.textAlign = 'center';
      effectEl.style.lineHeight = '1.4';
      effectEl.style.maxHeight = '100%';
      effectEl.style.overflow = 'hidden';
      effectEl.style.display = '-webkit-box';
      effectEl.style.webkitLineClamp = '3';
      effectEl.style.webkitBoxOrient = 'vertical';
      effectEl.style.width = '100%';
      effectEl.style.wordBreak = 'break-word';
      effectEl.textContent = blind.description;
      middleSection.appendChild(effectEl);
    }

    // 底部区域 - 目标分数和奖励
    const bottomSection = document.createElement('div');
    bottomSection.style.display = 'flex';
    bottomSection.style.flexDirection = 'column';
    bottomSection.style.alignItems = 'center';
    bottomSection.style.marginTop = '8px';

    // 目标分数
    const targetEl = document.createElement('div');
    targetEl.className = 'blind-target';
    targetEl.style.fontSize = 'clamp(20px, 4.5vw, 48px)';
    targetEl.style.lineHeight = '1.2';
    targetEl.style.marginBottom = '4px';
    targetEl.textContent = formatNumber(blind.targetScore);

    // 奖励
    const rewardEl = document.createElement('div');
    rewardEl.className = 'blind-reward';
    rewardEl.style.fontSize = 'clamp(12px, 3vw, 28px)';
    rewardEl.textContent = `奖励: $${blind.reward}`;

    bottomSection.appendChild(targetEl);
    bottomSection.appendChild(rewardEl);

    card.appendChild(headerSection);
    card.appendChild(middleSection);
    card.appendChild(bottomSection);

    return card;
  }

  /**
   * 创建信息面板
   */
  private createInfoPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'game-panel mt-8 max-w-2xl';

    const title = document.createElement('h3');
    title.className = 'text-yellow-400 font-bold mb-4 text-center';
    title.textContent = '当前状态';
    panel.appendChild(title);

    const statsGrid = document.createElement('div');
    statsGrid.className = 'grid grid-cols-4 gap-4';

    // 金钱
    const moneyStat = this.createStatItem('💰 金钱', `$${this.gameState.money}`);
    statsGrid.appendChild(moneyStat);

    // 小丑牌数量
    const jokerStat = this.createStatItem('🤡 小丑牌', `${this.gameState.getJokerCount()}/${this.gameState.getJokerSlots().getEffectiveMaxSlots()}`);
    statsGrid.appendChild(jokerStat);

    // 消耗牌数量
    const consumableStat = this.createStatItem('🎴 消耗牌', `${this.gameState.getConsumableCount()}/${this.gameState.getConsumableSlots().getEffectiveMaxSlots()}`);
    statsGrid.appendChild(consumableStat);

    // 牌堆剩余
    const deckStat = this.createStatItem('🎲 牌堆', `${this.gameState.getDeckCount()}`);
    statsGrid.appendChild(deckStat);

    panel.appendChild(statsGrid);

    return panel;
  }

  /**
   * 创建统计�?
   */
  private createStatItem(label: string, value: string): HTMLElement {
    const item = document.createElement('div');
    item.className = 'text-center';
    item.innerHTML = `
      <div class="text-gray-400 text-sm">${label}</div>
      <div class="text-yellow-400 font-bold text-lg">${value}</div>
    `;
    return item;
  }

  /**
   * 处理开始游�?- 只能开始当前盲�?
   */
  private handleStart(): void {
    const currentBlindType = this.getCurrentBlindType();
    this.callbacks.onSelectBlind?.(currentBlindType);
  }

  /**
   * 处理跳过
   */
  private handleSkip(): void {
    const currentBlindType = this.getCurrentBlindType();
    const currentBlind = Blind.create(this.gameState.getAnte(), currentBlindType);
    if (currentBlind?.canSkipBlind()) {
      this.callbacks.onSkipBlind?.();
    }
  }

  /**
   * 处理重掷Boss
   */
  private handleRerollBoss(): void {
    this.callbacks.onRerollBoss?.();
  }
}
