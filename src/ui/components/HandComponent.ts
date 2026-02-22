import { Card } from '../../models/Card';
import { Hand } from '../../models/Hand';
import { CardComponent } from './CardComponent';
import { calculateOverlap, getElementWidth } from '../../utils/overlapCalculator';

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

  constructor(container: HTMLElement, hand: Hand, callbacks: HandComponentCallbacks = {}) {
    this.container = container;
    this.hand = hand;
    this.callbacks = callbacks;
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
   */
  setHand(hand: Hand): void {
    this.hand = hand;
    this.render();
  }

  /**
   * 更新剩余次数
   */
  setRemaining(handsRemaining: number, discardsRemaining: number): void {
    this.handsRemaining = handsRemaining;
    this.discardsRemaining = discardsRemaining;
  }

  /**
   * 渲染手牌区域
   * 只渲染手牌，不包含按钮
   * 手牌重叠范围根据中间区域宽度动态调整，避免越界
   */
  render(): void {
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
      const firstCardElement = CardComponent.renderCard(firstCard, isFirstSelected);
      
      // 临时添加到 DOM 以获取实际尺寸
      firstCardElement.style.position = 'relative';
      firstCardElement.style.flexShrink = '0';
      // 禁用过渡动画，避免闪烁
      firstCardElement.style.transition = 'none';
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
      
      // 设置样式（保持 transition 为 none，避免动画）
      firstCardElement.style.zIndex = '0';
      this.setCardVisualState(firstCardElement, 0, isFirstSelected, totalCards);
      firstCardElement.addEventListener('click', () => this.handleCardClick(0));
      this.cardElements.push(firstCardElement);
      
      // 渲染剩余卡牌
      for (let index = 1; index < cards.length; index++) {
        const card = cards[index];
        const isSelected = selectedIndices.has(index);
        const cardElement = CardComponent.renderCard(card, isSelected);
        
        // 设置卡牌样式
        cardElement.style.position = 'relative';
        cardElement.style.flexShrink = '0';
        cardElement.style.marginLeft = `-${overlap}px`;
        cardElement.style.zIndex = String(index);
        
        // 统一设置卡牌视觉状态
        this.setCardVisualState(cardElement, index, isSelected, totalCards);
        
        // 添加点击事件
        cardElement.addEventListener('click', () => this.handleCardClick(index));
        
        handArea.appendChild(cardElement);
        this.cardElements.push(cardElement);
      }
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
  }
}
