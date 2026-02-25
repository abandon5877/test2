import { Card } from '../../models/Card';
import { Hand } from '../../models/Hand';
import { CardComponent } from './CardComponent';
import { calculateOverlap, getElementWidth } from '../../utils/overlapCalculator';
import { BossState } from '../../models/BossState';
import { BossSystem } from '../../systems/BossSystem';
import { LongPressHandler } from '../../utils/LongPressHandler';
import { CardDetailModal } from './CardDetailModal';

export interface HandComponentCallbacks {
  onCardSelect?: (card: Card, index: number, isSelected: boolean) => void;
  onPlayHand?: () => void;
  onDiscard?: () => void;
  onSortByRank?: () => void;
  onSortBySuit?: () => void;
}

/**
 * 手牌组件
 * 只负责显示手牌和处理卡牌选择，按钮已移至GameBoard
 */
export class HandComponent {
  private container: HTMLElement;
  private hand: Hand;
  private callbacks: HandComponentCallbacks;
  private cardElements: HTMLElement[] = [];
  private handsRemaining: number = 4;
  private discardsRemaining: number = 3;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: number | null = null;
  private lastContainerWidth: number = 0;
  private bossState: BossState | null = null;
  private cardDetailModal: CardDetailModal;
  private longPressCleanups: (() => void)[] = [];

  // 拖动相关属性
  private dragState: {
    isDragging: boolean;
    draggedIndex: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    placeholderIndex: number;
    dragElement: HTMLElement | null;
    originalElement: HTMLElement | null;
    dragStartTime: number;
    isTouch: boolean;
    rafId: number | null;
    lastUpdateTime: number;
  } = {
    isDragging: false,
    draggedIndex: -1,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    placeholderIndex: -1,
    dragElement: null,
    originalElement: null,
    dragStartTime: 0,
    isTouch: false,
    rafId: null,
    lastUpdateTime: 0
  };

  constructor(container: HTMLElement, hand: Hand, callbacks: HandComponentCallbacks = {}) {
    this.container = container;
    this.hand = hand;
    this.callbacks = callbacks;
    this.cardDetailModal = CardDetailModal.getInstance();
    this.render();
    this.setupResizeListener();
  }

  /**
   * 设置窗口大小变化监听
   * 屏幕大小变化时重新渲染手牌
   * 使用防抖避免频繁渲染
   */
  private setupResizeListener(): void {
    // 使用 ResizeObserver 监听容器大小变化
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        // 获取新的容器宽度
        const newWidth = entries[0]?.contentRect.width || 0;
        
        // 如果宽度变化小于10px，不重新渲染（避免微小变化导致的频繁渲染）
        if (Math.abs(newWidth - this.lastContainerWidth) < 10) {
          return;
        }
        this.lastContainerWidth = newWidth;

        // 使用防抖，避免频繁渲染
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = window.setTimeout(() => {
          this.render();
        }, 150);
      });
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * 更新手牌数据
   * @param hand - 新的手牌数据
   * @param disableAnimation - 是否禁用动画（用于排序等操作，避免卡牌乱抖）
   */
  setHand(hand: Hand, disableAnimation: boolean = false): void {
    this.hand = hand;
    if (disableAnimation) {
      // 排序时禁用动画，避免卡牌乱抖
      this.renderWithoutAnimation();
    } else {
      this.render();
    }
  }

  /**
   * 渲染手牌（无动画版本，用于排序等操作）
   */
  private renderWithoutAnimation(): void {
    // 清理之前的事件绑定
    this.longPressCleanups.forEach(cleanup => cleanup());
    this.longPressCleanups = [];

    this.container.innerHTML = '';
    this.cardElements = [];

    // 创建手牌区域
    const handArea = document.createElement('div');
    handArea.className = 'hand-area';
    handArea.style.display = 'flex';
    handArea.style.justifyContent = 'center';
    handArea.style.alignItems = 'center';
    handArea.style.width = '100%';
    handArea.style.height = '100%';

    const cards = this.hand.getCards();
    const selectedIndices = this.hand.getSelectedIndices();
    const totalCards = cards.length;

    // 获取中间区域实际宽度
    const centerPanel = this.container.closest('.game-layout-center') as HTMLElement;
    
    // 优先使用 game-layout-center 的宽度，其次是容器自身
    let centerWidth = getElementWidth(this.container);
    if (centerPanel) {
      const centerPanelWidth = getElementWidth(centerPanel);
      if (centerPanelWidth > 0) {
        centerWidth = centerPanelWidth;
      }
    }
    
    // 确保最小宽度（防止计算错误）
    centerWidth = Math.max(200, centerWidth);
    
    // 记录当前容器宽度
    this.lastContainerWidth = getElementWidth(this.container);

    // 先把 handArea 添加到 DOM，确保能获取正确的尺寸
    this.container.appendChild(handArea);
    
    // 先渲染第一张卡牌到 DOM，获取实际宽度后再计算重叠量
    let cardWidth = 70; // 默认估算值
    let overlap = 0;
    
    // 渲染第一张卡牌
    if (cards.length > 0) {
      const firstCard = cards[0];
      const isFirstSelected = selectedIndices.has(0);
      const isFirstDisabled = this.bossState ? BossSystem.isCardDisabled(this.bossState, firstCard) : false;
      const firstCardElement = CardComponent.renderCard(firstCard, isFirstSelected, isFirstDisabled);

      // 临时添加到 DOM 以获取实际尺寸
      firstCardElement.style.position = 'relative';
      firstCardElement.style.flexShrink = '0';
      handArea.appendChild(firstCardElement);

      // 强制回流以确保尺寸计算正确
      handArea.offsetHeight;

      // 获取实际卡牌宽度
      const actualWidth = getElementWidth(firstCardElement);
      if (actualWidth > 0) {
        cardWidth = actualWidth;
      }

      // 重新获取容器宽度（此时 handArea 已渲染）
      const actualCenterWidth = getElementWidth(handArea) || centerWidth;

      // 计算重叠量
      overlap = this.calculateCardOverlap(actualCenterWidth, totalCards, cardWidth);

      // 设置样式（排序时永久禁用动画）
      firstCardElement.style.zIndex = '0';
      firstCardElement.style.transition = 'none';
      this.setCardVisualState(firstCardElement, 0, isFirstSelected, totalCards);

      // 绑定长按交互：长按显示详情，单击选择
      const cleanup1 = this.bindCardInteraction(firstCardElement, firstCard, 0);
      this.longPressCleanups.push(cleanup1);

      this.cardElements.push(firstCardElement);

      // 渲染剩余卡牌
      for (let index = 1; index < cards.length; index++) {
        const card = cards[index];
        const isSelected = selectedIndices.has(index);
        const isDisabled = this.bossState ? BossSystem.isCardDisabled(this.bossState, card) : false;
        const cardElement = CardComponent.renderCard(card, isSelected, isDisabled);

        // 设置卡牌样式（排序时永久禁用动画）
        cardElement.style.position = 'relative';
        cardElement.style.flexShrink = '0';
        cardElement.style.marginLeft = `-${overlap}px`;
        cardElement.style.zIndex = String(index);
        cardElement.style.transition = 'none';

        // 统一设置卡牌视觉状态
        this.setCardVisualState(cardElement, index, isSelected, totalCards);

        // 绑定长按交互：长按显示详情，单击选择
        const cleanup = this.bindCardInteraction(cardElement, card, index);
        this.longPressCleanups.push(cleanup);

        handArea.appendChild(cardElement);
        this.cardElements.push(cardElement);
      }
      
      // 排序操作不启用动画，保持 transition: none
      // 但延迟后添加 transition-enabled 类，以便后续点击时有动画
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.cardElements.forEach(cardElement => {
            // 移除内联 transition，让 CSS 类控制过渡效果
            cardElement.style.transition = '';
            cardElement.classList.add('transition-enabled');
          });
        }, 100);
      });
    }
  }

  /**
   * 更新剩余次数
   */
  setRemaining(handsRemaining: number, discardsRemaining: number): void {
    this.handsRemaining = handsRemaining;
    this.discardsRemaining = discardsRemaining;
  }

  /**
   * 设置Boss状态，用于显示失效卡牌
   */
  setBossState(bossState: BossState | null): void {
    this.bossState = bossState;
    // 重新渲染以更新失效标记
    this.render();
  }

  /**
   * 渲染手牌区域
   * 只渲染手牌，不包含按钮
   * 手牌重叠范围根据中间区域宽度动态调整，避免越界
   */
  render(): void {
    // 清理之前的事件绑定
    this.longPressCleanups.forEach(cleanup => cleanup());
    this.longPressCleanups = [];

    this.container.innerHTML = '';
    this.cardElements = [];

    // 创建手牌区域
    const handArea = document.createElement('div');
    handArea.className = 'hand-area';
    handArea.style.display = 'flex';
    handArea.style.justifyContent = 'center';
    handArea.style.alignItems = 'center';
    handArea.style.width = '100%';
    handArea.style.height = '100%';

    const cards = this.hand.getCards();
    const selectedIndices = this.hand.getSelectedIndices();
    const totalCards = cards.length;

    // 获取中间区域实际宽度
    // handArea 刚创建还未渲染，使用 container 或 centerPanel 的宽度
    const centerPanel = this.container.closest('.game-layout-center') as HTMLElement;
    
    // 优先使用 game-layout-center 的宽度，其次是容器自身
    let centerWidth = getElementWidth(this.container);
    if (centerPanel) {
      const centerPanelWidth = getElementWidth(centerPanel);
      if (centerPanelWidth > 0) {
        centerWidth = centerPanelWidth;
      }
    }
    
    // 确保最小宽度（防止计算错误）
    centerWidth = Math.max(200, centerWidth);
    
    // 记录当前容器宽度
    this.lastContainerWidth = getElementWidth(this.container);

    // 先把 handArea 添加到 DOM，确保能获取正确的尺寸
    this.container.appendChild(handArea);
    
    // 先渲染第一张卡牌到 DOM，获取实际宽度后再计算重叠量
    // 这样可以准确获取 CSS 计算后的卡牌尺寸
    let cardWidth = 70; // 默认估算值
    let overlap = 0;
    
    // 渲染第一张卡牌
    if (cards.length > 0) {
      const firstCard = cards[0];
      const isFirstSelected = selectedIndices.has(0);
      const isFirstDisabled = this.bossState ? BossSystem.isCardDisabled(this.bossState, firstCard) : false;
      const firstCardElement = CardComponent.renderCard(firstCard, isFirstSelected, isFirstDisabled);

      // 临时添加到 DOM 以获取实际尺寸
      firstCardElement.style.position = 'relative';
      firstCardElement.style.flexShrink = '0';
      handArea.appendChild(firstCardElement);

      // 强制回流以确保尺寸计算正确
      handArea.offsetHeight;

      // 获取实际卡牌宽度
      const actualWidth = getElementWidth(firstCardElement);
      if (actualWidth > 0) {
        cardWidth = actualWidth;
      }

      // 重新获取容器宽度（此时 handArea 已渲染）
      const actualCenterWidth = getElementWidth(handArea) || centerWidth;

      // 计算重叠量
      overlap = this.calculateCardOverlap(actualCenterWidth, totalCards, cardWidth);

      // 设置样式（初始禁用动画，避免渲染时的闪烁）
      firstCardElement.style.zIndex = '0';
      firstCardElement.style.transition = 'none';
      this.setCardVisualState(firstCardElement, 0, isFirstSelected, totalCards);

      // 绑定长按交互：长按显示详情，单击选择
      const cleanup1 = this.bindCardInteraction(firstCardElement, firstCard, 0);
      this.longPressCleanups.push(cleanup1);

      this.cardElements.push(firstCardElement);

      // 渲染剩余卡牌
      for (let index = 1; index < cards.length; index++) {
        const card = cards[index];
        const isSelected = selectedIndices.has(index);
        const isDisabled = this.bossState ? BossSystem.isCardDisabled(this.bossState, card) : false;
        const cardElement = CardComponent.renderCard(card, isSelected, isDisabled);

        // 设置卡牌样式（初始禁用动画）
        cardElement.style.position = 'relative';
        cardElement.style.flexShrink = '0';
        cardElement.style.marginLeft = `-${overlap}px`;
        cardElement.style.zIndex = String(index);
        cardElement.style.transition = 'none';

        // 统一设置卡牌视觉状态
        this.setCardVisualState(cardElement, index, isSelected, totalCards);

        // 绑定长按交互：长按显示详情，单击选择
        const cleanup = this.bindCardInteraction(cardElement, card, index);
        this.longPressCleanups.push(cleanup);

        handArea.appendChild(cardElement);
        this.cardElements.push(cardElement);
      }
      
      // 延迟启用过渡动画，避免初始渲染时的抖动
      // 使用 requestAnimationFrame + setTimeout 确保在渲染稳定后才启用
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.cardElements.forEach(cardElement => {
            // 移除内联 transition，让 CSS 类控制过渡效果
            cardElement.style.transition = '';
            cardElement.classList.add('transition-enabled');
          });
        }, 100);
      });
    }
  }

  /**
   * 计算卡牌重叠量
   * 根据容器实际尺寸和手牌数量动态计算，确保手牌不会越界
   * 使用连续函数而非分段预设值，实现平滑自适应
   * @param centerWidth - 中间区域宽度
   * @param totalCards - 手牌总数
   * @param cardWidth - 单张卡牌宽度
   * @returns 重叠量（像素）
   */
  private calculateCardOverlap(centerWidth: number, totalCards: number, cardWidth: number): number {
    // 计算倾斜卡牌所需的额外 padding
    // 最大倾斜角度为 12 度（24度范围的一半）
    // 倾斜后卡牌水平投影增加：cardWidth * (cos(12°) - 1) + cardHeight * sin(12°)
    // 简化计算：约等于 cardWidth * 0.15 + cardHeight * 0.2
    const cardHeight = cardWidth * 1.4; // 卡牌高度约为宽度的 1.4 倍
    const maxRotation = 12; // 最大倾斜角度
    const rotationRad = (maxRotation * Math.PI) / 180;
    
    // 计算单侧溢出量（倾斜卡牌超出容器边界的距离）
    // 使用三角函数计算：height * sin(θ) + width * (1 - cos(θ))
    const overflowPerSide = cardHeight * Math.sin(rotationRad) + cardWidth * (1 - Math.cos(rotationRad));
    const totalPadding = overflowPerSide * 2; // 两侧都需要 padding
    
    // 减去 padding 后的可用宽度
    const availableWidth = Math.max(0, centerWidth - totalPadding);
    
    // 使用统一的重叠计算函数
    // 扑克手牌使用更大的最大重叠比例（80%），因为需要显示更多卡牌
    return calculateOverlap(totalCards, availableWidth, cardWidth, {
      minOverlapRatio: 0.05,
      maxOverlapRatio: 0.8,
      slightOverlapRatio: 0
    });
  }

  /**
   * 处理卡牌点击
   */
  private handleCardClick(index: number): void {
    const isSelected = this.hand.toggleCard(index);
    const totalCards = this.hand.getCards().length;

    // 更新UI
    const cardElement = this.cardElements[index];
    if (cardElement) {
      // 确保动画已启用（玩家点击时肯定已经渲染完成）
      // 移除内联的 transition: none，让 CSS 类控制过渡效果
      cardElement.style.transition = '';
      cardElement.classList.add('transition-enabled');
      
      CardComponent.setSelected(cardElement, isSelected);
      // 统一设置卡牌视觉状态
      this.setCardVisualState(cardElement, index, isSelected, totalCards);
    }

    // 回调
    const card = this.hand.getCards()[index];
    this.callbacks.onCardSelect?.(card, index, isSelected);
  }

  /**
   * 处理出牌
   */
  private handlePlayHand(): void {
    if (this.hand.getSelectionCount() === 0) return;
    if (this.handsRemaining <= 0) return;

    // 添加出牌动画
    const selectedIndices = this.hand.getSelectedIndices();
    selectedIndices.forEach(index => {
      const cardElement = this.cardElements[index];
      if (cardElement) {
        CardComponent.addPlayAnimation(cardElement);
      }
    });

    // 延迟执行回调，等待动画
    setTimeout(() => {
      this.callbacks.onPlayHand?.();
    }, 300);
  }

  /**
   * 处理弃牌
   */
  private handleDiscard(): void {
    if (this.hand.getSelectionCount() === 0) return;
    if (this.discardsRemaining <= 0) return;

    this.callbacks.onDiscard?.();
  }

  /**
   * 获取当前选中的卡牌
   */
  getSelectedCards(): Card[] {
    return this.hand.getSelectedCards();
  }

  /**
   * 获取选中数量
   */
  getSelectionCount(): number {
    return this.hand.getSelectionCount();
  }

  /**
   * 计算卡牌的倾斜角度
   * 使用连续函数基于容器宽高比动态计算，实现平滑自适应
   * @param index - 卡牌索引
   * @param totalCards - 手牌总数
   * @returns 倾斜角度（度）
   */
  private calculateCardRotation(index: number, totalCards: number): number {
    // 固定倾斜程度，不跟随屏幕大小变化
    // 基础角度范围固定为24度
    const maxAngleRange = Math.min(24, totalCards * 3);
    
    const angleStep = totalCards > 1 ? maxAngleRange / (totalCards - 1) : 0;
    
    // 从左边开始计算角度
    // 第一张牌为负角度，最后一张为正角度，中间均匀分布
    const rotation = -maxAngleRange / 2 + index * angleStep;
    
    return rotation;
  }

  /**
   * 统一设置卡牌视觉状态
   * @param cardElement - 卡牌元素
   * @param index - 卡牌索引
   * @param isSelected - 是否选中
   * @param totalCards - 手牌总数
   */
  private setCardVisualState(cardElement: HTMLElement, index: number, isSelected: boolean, totalCards: number): void {
    const rotation = this.calculateCardRotation(index, totalCards);
    
    if (isSelected) {
      // 选中：拉正 + 上移
      cardElement.style.transform = `rotate(0deg) translateY(-20px)`;
    } else {
      // 未选中：保持倾斜
      cardElement.style.transform = `rotate(${rotation}deg)`;
    }
  }

  /**
   * 清除所有选择
   */
  clearSelection(): void {
    this.hand.clearSelection();
    const totalCards = this.hand.getCards().length;

    this.cardElements.forEach((cardElement, index) => {
      CardComponent.setSelected(cardElement, false);
      // 统一设置卡牌视觉状态
      this.setCardVisualState(cardElement, index, false, totalCards);
    });
  }

  /**
   * 选择指定索引的卡牌
   */
  selectCard(index: number): void {
    if (this.hand.selectCard(index)) {
      const cardElement = this.cardElements[index];
      if (cardElement) {
        CardComponent.setSelected(cardElement, true);
        // 统一设置卡牌视觉状态
        const totalCards = this.hand.getCards().length;
        this.setCardVisualState(cardElement, index, true, totalCards);
      }
    }
  }

  /**
   * 取消选择指定索引的卡牌
   */
  deselectCard(index: number): void {
    if (this.hand.deselectCard(index)) {
      const cardElement = this.cardElements[index];
      if (cardElement) {
        CardComponent.setSelected(cardElement, false);
        // 统一设置卡牌视觉状态
        const totalCards = this.hand.getCards().length;
        this.setCardVisualState(cardElement, index, false, totalCards);
      }
    }
  }

  /**
   * 销毁组件，清理事件监听器
   */
  destroy(): void {
    // 清理 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 清理防抖定时器
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // 清理长按事件绑定
    this.longPressCleanups.forEach(cleanup => cleanup());
    this.longPressCleanups = [];
  }

  /**
   * 绑定卡牌交互事件
   * 长按显示详情，单击选择/取消选择，拖动调整位置
   */
  private bindCardInteraction(
    cardElement: HTMLElement,
    card: Card,
    index: number
  ): () => void {
    // 绑定长按和点击
    const longPressCleanup = LongPressHandler.bind(
      cardElement,
      () => {
        // 长按显示详情（仅在非拖动状态下）
        if (!this.dragState.isDragging) {
          this.cardDetailModal.show({ card });
        }
      },
      () => {
        // 单击切换选择（仅在非拖动状态下）
        if (!this.dragState.isDragging) {
          this.handleCardClick(index);
        }
      }
    );

    // 绑定拖动事件
    this.bindDragEvents(cardElement, index);

    return longPressCleanup;
  }

  /**
   * 绑定拖动事件（鼠标和触摸）
   */
  private bindDragEvents(cardElement: HTMLElement, index: number): void {
    // 鼠标事件
    cardElement.addEventListener('mousedown', (e) => this.handleMouseDown(e, index));
    
    // 触摸事件 - 使用passive: true避免阻塞滚动，在确定拖动后再阻止默认行为
    cardElement.addEventListener('touchstart', (e) => this.handleTouchStart(e, index), { passive: true });
  }

  /**
   * 处理鼠标按下
   */
  private handleMouseDown(e: MouseEvent, index: number): void {
    // 只响应左键
    if (e.button !== 0) return;
    
    this.initDragState(e.clientX, e.clientY, index, false);
    
    // 添加全局事件监听
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  /**
   * 处理触摸开始
   */
  private handleTouchStart(e: TouchEvent, index: number): void {
    const touch = e.touches[0];
    this.initDragState(touch.clientX, touch.clientY, index, true);
    
    // 添加全局事件监听
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('touchcancel', this.handleTouchEnd);
  }

  /**
   * 初始化拖动状态（不立即标记为拖动中）
   */
  private initDragState(clientX: number, clientY: number, index: number, isTouch: boolean): void {
    this.dragState = {
      isDragging: false, // 初始为false，在移动足够距离后才标记为拖动
      draggedIndex: index,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      placeholderIndex: index,
      dragElement: null,
      originalElement: this.cardElements[index],
      dragStartTime: Date.now(),
      isTouch,
      rafId: null,
      lastUpdateTime: 0
    };
  }

  /**
   * 处理鼠标释放
   */
  private handleMouseUp = (e: MouseEvent): void => {
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    this.handleDragEndInternal();
  };

  /**
   * 处理触摸移动
   */
  private handleTouchMove = (e: TouchEvent): void => {
    // 只有在确定是拖动后才阻止默认行为
    if (this.dragState.isDragging) {
      e.preventDefault();
    }
    this.handleDragMove(e);
  };

  /**
   * 处理触摸结束
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchEnd);
    this.handleDragEndInternal();
  };

  /**
   * 处理拖动移动
   */
  private handleDragMove = (e: MouseEvent | TouchEvent): void => {
    const clientX = this.dragState.isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = this.dragState.isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

    // 检查是否移动了足够距离才认为是拖动
    if (!this.dragState.isDragging) {
      const deltaX = Math.abs(clientX - this.dragState.startX);
      const deltaY = Math.abs(clientY - this.dragState.startY);
      const dragThreshold = 5; // 5像素阈值
      
      if (deltaX < dragThreshold && deltaY < dragThreshold) {
        return; // 移动距离不够，不认为是拖动
      }
      
      // 开始拖动
      this.dragState.isDragging = true;
      this.createDragElement();
      
      // 添加拖动样式
      if (this.dragState.originalElement) {
        this.dragState.originalElement.classList.add('dragging');
        this.dragState.originalElement.style.opacity = '0.3';
      }
    }

    this.dragState.currentX = clientX;
    this.dragState.currentY = clientY;

    // 使用 requestAnimationFrame 优化性能
    if (this.dragState.rafId === null) {
      this.dragState.rafId = requestAnimationFrame(() => {
        this.updateDragPosition();
      });
    }
  };

  /**
   * 创建拖动元素（跟随鼠标的视觉元素）
   */
  private createDragElement(): void {
    if (!this.dragState.originalElement) return;

    const rect = this.dragState.originalElement.getBoundingClientRect();
    const dragElement = this.dragState.originalElement.cloneNode(true) as HTMLElement;
    
    dragElement.style.position = 'fixed';
    dragElement.style.left = `${rect.left}px`;
    dragElement.style.top = `${rect.top}px`;
    dragElement.style.width = `${rect.width}px`;
    dragElement.style.height = `${rect.height}px`;
    dragElement.style.zIndex = '1000';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.transform = 'scale(1.05) rotate(0deg)';
    dragElement.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    dragElement.classList.add('dragging-clone');

    document.body.appendChild(dragElement);
    this.dragState.dragElement = dragElement;
  }

  /**
   * 更新拖动位置（在requestAnimationFrame中调用）
   */
  private updateDragPosition(): void {
    if (!this.dragState.isDragging) {
      this.dragState.rafId = null;
      return;
    }

    const { currentX, currentY, startX, startY } = this.dragState;

    // 更新拖动元素位置
    if (this.dragState.dragElement) {
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      this.dragState.dragElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05) rotate(0deg)`;
    }

    // 计算当前应该插入的位置（限制更新频率）
    const now = Date.now();
    if (now - this.dragState.lastUpdateTime > 50) { // 每50ms更新一次位置
      this.updatePlaceholderIndex(currentX);
      this.dragState.lastUpdateTime = now;
    }

    this.dragState.rafId = null;
  }

  /**
   * 更新占位符位置（计算应该插入的索引）
   */
  private updatePlaceholderIndex(clientX: number): void {
    const handArea = this.container.querySelector('.hand-area') as HTMLElement;
    if (!handArea) return;

    const handRect = handArea.getBoundingClientRect();
    const cards = this.hand.getCards();
    
    // 计算相对于手牌区域的X位置
    const relativeX = clientX - handRect.left;
    const cardWidth = handRect.width / cards.length;
    
    // 计算新的索引
    let newIndex = Math.floor(relativeX / cardWidth);
    newIndex = Math.max(0, Math.min(newIndex, cards.length - 1));

    if (newIndex !== this.dragState.placeholderIndex) {
      this.dragState.placeholderIndex = newIndex;
      this.visualizePlaceholder(newIndex);
    }
  }

  /**
   * 可视化占位符位置 - 简化为仅改变透明度，避免复杂transform
   */
  private visualizePlaceholder(targetIndex: number): void {
    this.cardElements.forEach((el, i) => {
      if (i !== this.dragState.draggedIndex) {
        // 简化动画：目标位置附近的卡牌降低透明度
        const isNearTarget = Math.abs(i - targetIndex) <= 1;
        el.style.opacity = isNearTarget ? '0.6' : '1';
      }
    });
  }

  /**
   * 处理拖动结束（内部方法）
   */
  private handleDragEndInternal(): void {
    const wasDragging = this.dragState.isDragging;
    const dragDuration = Date.now() - this.dragState.dragStartTime;
    const fromIndex = this.dragState.draggedIndex;
    const toIndex = this.dragState.placeholderIndex;

    // 移除拖动元素
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }

    // 恢复原始元素样式
    if (this.dragState.originalElement) {
      this.dragState.originalElement.classList.remove('dragging');
      this.dragState.originalElement.style.opacity = '';
    }

    // 取消可能存在的requestAnimationFrame
    if (this.dragState.rafId !== null) {
      cancelAnimationFrame(this.dragState.rafId);
    }

    // 如果确实是拖动且位置改变
    if (wasDragging && fromIndex !== toIndex && dragDuration > 100) {
      this.reorderCard(fromIndex, toIndex);
    }

    // 重置所有卡牌的样式
    this.cardElements.forEach((el) => {
      el.style.opacity = '';
    });

    // 重置拖动状态
    this.dragState = {
      isDragging: false,
      draggedIndex: -1,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      placeholderIndex: -1,
      dragElement: null,
      originalElement: null,
      dragStartTime: 0,
      isTouch: false,
      rafId: null,
      lastUpdateTime: 0
    };
  }

  /**
   * 重新排序卡牌
   */
  private reorderCard(fromIndex: number, toIndex: number): void {
    // 使用Hand类的reorderCards方法
    const success = this.hand.reorderCards(fromIndex, toIndex);
    if (success) {
      // 重新渲染
      this.render();
    }
  }
}
