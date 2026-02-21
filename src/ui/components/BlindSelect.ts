import { GameState } from '../../models/GameState';
import { BlindType } from '../../types/game';
import { Blind } from '../../models/Blind';

export interface BlindSelectCallbacks {
  onSelectBlind?: (blindType: BlindType) => void;
  onSkipBlind?: () => void;
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
    // 使用 viewport 单位确保内容适应屏幕大小，上下留出空隙，允许内容区域滚动
    this.container.className = 'casino-bg min-h-screen w-full flex flex-col items-center py-[3vh] px-[2vw] overflow-y-auto';

    const currentBlindType = this.getCurrentBlindType();

    // 内容包装器 - 限制最大宽度并居中
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex flex-col items-center w-full max-w-6xl';

    // 标题
    const title = document.createElement('h1');
    title.style.fontSize = 'clamp(1.5rem, 4vw, 2.5rem)';
    title.className = 'font-bold text-yellow-400 mb-[1vh] animate-float';
    title.textContent = '';
    contentWrapper.appendChild(title);

    // 底注显示
    const anteDisplay = document.createElement('div');
    anteDisplay.style.fontSize = 'clamp(0.875rem, 2.5vw, 1.25rem)';
    anteDisplay.className = 'text-gray-400 mb-[2vh]';
    anteDisplay.textContent = `底注 ${this.gameState.ante}`;
    contentWrapper.appendChild(anteDisplay);

    // 关卡卡片容器 - 使用 viewport 单位控制间距
    const cardsContainer = document.createElement('div');
    cardsContainer.style.gap = 'clamp(8px, 2vw, 24px)';
    cardsContainer.className = 'flex flex-wrap justify-center mb-[2vh]';

    // 创建三个关卡卡片，当前盲注高亮显示
    const smallBlind = this.createBlindCard(BlindType.SMALL_BLIND, '小盲注', currentBlindType === BlindType.SMALL_BLIND);
    const bigBlind = this.createBlindCard(BlindType.BIG_BLIND, '大盲注', currentBlindType === BlindType.BIG_BLIND);
    const bossBlind = this.createBlindCard(BlindType.BOSS_BLIND, 'Boss盲注', currentBlindType === BlindType.BOSS_BLIND);

    cardsContainer.appendChild(smallBlind);
    cardsContainer.appendChild(bigBlind);
    cardsContainer.appendChild(bossBlind);

    contentWrapper.appendChild(cardsContainer);

    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.gap = 'clamp(8px, 2vw, 16px)';
    buttonArea.className = 'flex flex-wrap justify-center';

    // 跳过按钮（小盲注和大盲注可跳过）
    const skipButton = document.createElement('button');
    skipButton.style.fontSize = 'clamp(0.75rem, 2vw, 1rem)';
    skipButton.style.padding = 'clamp(6px, 1.2vh, 10px) clamp(12px, 2.5vw, 20px)';
    skipButton.className = 'game-btn game-btn-secondary';
    const currentBlind = Blind.create(this.gameState.ante, currentBlindType);
    const canSkip = currentBlind?.canSkipBlind() ?? false;
    const skipReward = currentBlind?.getSkipReward() ?? 0;
    skipButton.textContent = canSkip ? `跳过 (+$${skipReward})` : '不可跳过';
    skipButton.disabled = !canSkip;
    skipButton.addEventListener('click', () => this.handleSkip());

    // 开始按钮 - 只能开始当前盲注
    const startButton = document.createElement('button');
    startButton.style.fontSize = 'clamp(0.75rem, 2vw, 1rem)';
    startButton.style.padding = 'clamp(6px, 1.2vh, 10px) clamp(12px, 2.5vw, 20px)';
    startButton.className = 'game-btn game-btn-primary';
    startButton.textContent = `开始 ${this.getBlindLabel(currentBlindType)}`;
    startButton.addEventListener('click', () => this.handleStart());

    buttonArea.appendChild(skipButton);
    buttonArea.appendChild(startButton);

    contentWrapper.appendChild(buttonArea);
    this.container.appendChild(contentWrapper);
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
    const ante = this.gameState.ante;
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

    // 标签
    const labelEl = document.createElement('div');
    labelEl.className = 'text-gray-400 text-sm mb-2';
    labelEl.textContent = label;

    // 名称
    const nameEl = document.createElement('div');
    nameEl.className = 'blind-name';
    nameEl.textContent = blind.name;

    // Boss效果描述
    let effectEl: HTMLElement | null = null;
    if (isBoss && blind.description) {
      effectEl = document.createElement('div');
      effectEl.className = 'text-red-400 text-xs mt-2 mb-2 px-2';
      effectEl.textContent = blind.description;
    }

    // 目标分数
    const targetEl = document.createElement('div');
    targetEl.className = 'blind-target';
    targetEl.textContent = blind.targetScore.toLocaleString();

    // 奖励
    const rewardEl = document.createElement('div');
    rewardEl.className = 'blind-reward';
    rewardEl.innerHTML = `奖励: $${blind.reward}`;

    // 跳过奖励（小盲注和大盲注�?
    let skipRewardEl: HTMLElement | null = null;
    if (blind.canSkipBlind() && blind.getSkipReward() > 0) {
      skipRewardEl = document.createElement('div');
      skipRewardEl.className = 'text-blue-400 text-sm mt-2';
      skipRewardEl.textContent = `跳过奖励: $${blind.getSkipReward()}`;
    }

    // 当前盲注指示�?
    if (isCurrent) {
      const currentIndicator = document.createElement('div');
      currentIndicator.className = 'text-yellow-400 text-sm font-bold mt-2';
      currentIndicator.textContent = '当前';
      card.appendChild(currentIndicator);
    }

    card.appendChild(labelEl);
    card.appendChild(nameEl);
    if (effectEl) card.appendChild(effectEl);
    card.appendChild(targetEl);
    card.appendChild(rewardEl);
    if (skipRewardEl) card.appendChild(skipRewardEl);

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
    const jokerStat = this.createStatItem('🤡 小丑牌', `${this.gameState.getJokerCount()}/${this.gameState.getJokerSlots().getAvailableSlots() + this.gameState.getJokerCount()}`);
    statsGrid.appendChild(jokerStat);

    // 消耗牌数量
    const consumableStat = this.createStatItem('🎴 消耗牌', `${this.gameState.getConsumableCount()}/${this.gameState.getMaxConsumableSlots()}`);
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
    const currentBlind = Blind.create(this.gameState.ante, currentBlindType);
    if (currentBlind?.canSkipBlind()) {
      this.callbacks.onSkipBlind?.();
    }
  }
}
