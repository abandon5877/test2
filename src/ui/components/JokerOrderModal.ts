import { GameState } from '../../models/GameState';
import { Joker } from '../../models/Joker';
import { CardComponent } from './CardComponent';
import { JOKER_RARITY_COLORS } from '../../types/joker';

export class JokerOrderModal {
  private modal: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private gameState: GameState;
  private onOrderChanged: () => void;
  private draggedIndex: number | null = null;

  constructor(gameState: GameState, onOrderChanged: () => void = () => {}) {
    this.gameState = gameState;
    this.onOrderChanged = onOrderChanged;
  }

  /**
   * 显示弹窗
   */
  show(): void {
    this.createModal();
    document.body.appendChild(this.overlay!);
    document.body.appendChild(this.modal!);

    requestAnimationFrame(() => {
      this.overlay!.style.opacity = '1';
      this.modal!.style.opacity = '1';
      this.modal!.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  }

  /**
   * 关闭弹窗
   */
  close(): void {
    if (this.overlay && this.modal) {
      this.overlay.style.opacity = '0';
      this.modal.style.opacity = '0';
      this.modal.style.transform = 'translate(-50%, -50%) scale(0.95)';

      setTimeout(() => {
        this.overlay?.remove();
        this.modal?.remove();
        this.overlay = null;
        this.modal = null;
      }, 200);
    }
  }

  /**
   * 创建弹窗
   */
  private createModal(): void {
    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-black/80 z-40 transition-opacity duration-200';
    this.overlay.style.opacity = '0';
    this.overlay.addEventListener('click', () => this.close());

    // 创建弹窗
    this.modal = document.createElement('div');
    this.modal.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-200';
    this.modal.style.opacity = '0';
    this.modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
    this.modal.style.width = '90%';
    this.modal.style.maxWidth = '1000px';

    const content = document.createElement('div');
    content.className = 'game-panel overflow-hidden flex flex-col';

    // 标题栏
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b border-yellow-500/30';
    header.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold text-yellow-400">调整小丑牌顺序</h2>
        <p class="text-gray-400 text-sm mt-1">拖拽卡片调整位置（位置会影响某些小丑牌的结算效果）</p>
      </div>
      <button class="text-gray-400 hover:text-white text-2xl transition-colors" id="close-joker-order">&times;</button>
    `;

    // 内容区域
    const body = document.createElement('div');
    body.className = 'p-6';

    // 小丑牌容器
    const jokersContainer = document.createElement('div');
    jokersContainer.className = 'flex flex-wrap justify-center gap-4 min-h-[200px]';
    jokersContainer.id = 'jokers-sortable-container';

    const jokers = this.gameState.jokers as Joker[];

    if (jokers.length === 0) {
      jokersContainer.innerHTML = `
        <div class="flex items-center justify-center text-gray-500 text-lg">
          暂无小丑牌
        </div>
      `;
    } else {
      jokers.forEach((joker, index) => {
        const jokerCard = this.createDraggableJokerCard(joker, index, jokers.length);
        jokersContainer.appendChild(jokerCard);
      });
    }

    body.appendChild(jokersContainer);

    // 位置提示
    const positionHint = document.createElement('div');
    positionHint.className = 'mt-6 p-4 bg-yellow-500/10 rounded-lg';
    positionHint.innerHTML = `
      <div class="text-yellow-400 font-bold mb-2">💡 位置提示</div>
      <div class="text-gray-300 text-sm space-y-1">
        <p>最左/最右位置的小丑牌会影响某些效果（如"棒球"）</p>
        <p>相邻的小丑牌可能会互相影响（如"照片"）</p>
        <p>位置越靠前，触发顺序越优先</p>
      </div>
    `;
    body.appendChild(positionHint);

    // 底部按钮
    const footer = document.createElement('div');
    footer.className = 'flex justify-center gap-4 p-4 border-t border-yellow-500/30';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'game-btn game-btn-primary';
    confirmBtn.textContent = '确定';
    confirmBtn.addEventListener('click', () => this.close());

    footer.appendChild(confirmBtn);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    this.modal.appendChild(content);

    // 绑定关闭按钮
    setTimeout(() => {
      const closeBtn = document.getElementById('close-joker-order');
      closeBtn?.addEventListener('click', () => this.close());
    }, 0);

    // ESC键关闭
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * 创建可拖拽的小丑牌卡片
   */
  private createDraggableJokerCard(joker: Joker, index: number, total: number): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative group';
    wrapper.style.cursor = 'grab';
    wrapper.draggable = true;
    wrapper.dataset.index = String(index);

    // 位置标签 - 只显示位置编号，不显示最左最右
    const positionLabel = document.createElement('div');
    positionLabel.className = 'absolute -top-3 left-1/2 transform -translate-x-1/2 z-10';
    positionLabel.innerHTML = `
      <span class="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold">
        ${index + 1}
      </span>
    `;
    wrapper.appendChild(positionLabel);

    // 小丑牌卡片
    const card = CardComponent.renderJokerCard({
      id: joker.id,
      name: joker.name,
      description: joker.description,
      rarity: joker.rarity,
      cost: joker.cost,
      disabled: joker.disabled,
      faceDown: joker.faceDown
    });

    // 添加拖拽样式
    card.classList.add('transition-transform', 'duration-200');
    wrapper.appendChild(card);

    // 拖拽手柄提示
    const dragHint = document.createElement('div');
    dragHint.className = 'absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity';
    dragHint.innerHTML = `
      <span class="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">
        拖拽移动
      </span>
    `;
    wrapper.appendChild(dragHint);

    // 拖拽事件（桌面端�?    wrapper.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
    wrapper.addEventListener('dragend', (e) => this.handleDragEnd(e));
    wrapper.addEventListener('dragover', (e) => this.handleDragOver(e));
    wrapper.addEventListener('drop', (e) => this.handleDrop(e, index));
    wrapper.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    wrapper.addEventListener('dragleave', (e) => this.handleDragLeave(e));

    // 触摸事件（移动端�?    wrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e, index), { passive: false });
    wrapper.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    wrapper.addEventListener('touchend', (e) => this.handleTouchEnd(e, index));

    // 点击交换（移动端备选）
    wrapper.addEventListener('click', () => this.handleClick(index));

    return wrapper;
  }

  private handleDragStart(e: DragEvent, index: number): void {
    this.draggedIndex = index;
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
    target.style.cursor = 'grabbing';

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  private handleDragEnd(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    target.style.cursor = 'grab';
    this.draggedIndex = null;

    // 清除所有拖拽样式
    document.querySelectorAll('[data-index]').forEach(el => {
      (el as HTMLElement).style.transform = '';
      (el as HTMLElement).style.border = '';
    });
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  private handleDragEnter(e: DragEvent): void {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    if (this.draggedIndex !== null && this.draggedIndex !== Number(target.dataset.index)) {
      target.style.transform = 'scale(1.05)';
      target.style.border = '2px solid #fbbf24';
    }
  }

  private handleDragLeave(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.border = '';
  }

  private handleDrop(e: DragEvent, targetIndex: number): void {
    e.preventDefault();
    const fromIndex = this.draggedIndex;

    if (fromIndex === null || fromIndex === targetIndex) {
      return;
    }

    this.swapJokers(fromIndex, targetIndex);

    // 清除样式
    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.border = '';
  }

  private handleClick(index: number): void {
    // 如果已经选中了一个，则交换
    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      this.swapJokers(this.draggedIndex, index);
      this.draggedIndex = null;

      // 清除所有选中样式
      document.querySelectorAll('[data-index]').forEach(el => {
        (el as HTMLElement).style.boxShadow = '';
      });
    } else if (this.draggedIndex === index) {
      // 取消选中
      this.draggedIndex = null;
      const wrapper = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
      if (wrapper) {
        wrapper.style.boxShadow = '';
      }
    } else {
      // 选中
      this.draggedIndex = index;
      const wrapper = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
      if (wrapper) {
        wrapper.style.boxShadow = '0 0 0 4px #fbbf24';
      }
    }
  }

  private swapJokers(fromIndex: number, toIndex: number): void {
    const success = this.gameState.getJokerSlots().swapJokers(fromIndex, toIndex);

    if (success) {
      this.onOrderChanged();
      // 重新渲染弹窗内容
      this.close();
      setTimeout(() => this.show(), 210);
    }
  }

  // 触摸事件处理（移动端支持）
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchCurrentIndex: number | null = null;

  private handleTouchStart(e: TouchEvent, index: number): void {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchCurrentIndex = index;
    this.draggedIndex = index;

    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.7';
    target.style.transform = 'scale(1.05)';
    target.style.zIndex = '100';
    target.style.transition = 'none';
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.draggedIndex === null) return;

    const touch = e.touches[0];
    
    // 移动被拖拽的元素跟随手指
    const target = document.querySelector(`[data-index="${this.draggedIndex}"]`) as HTMLElement;
    if (target) {
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      target.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
    }
    
    // 检测下方的元素
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const wrapper = element?.closest('[data-index]') as HTMLElement;

    if (wrapper) {
      const index = Number(wrapper.dataset.index);
      if (index !== this.draggedIndex) {
        // 高亮目标
        document.querySelectorAll('[data-index]').forEach(el => {
          if (Number((el as HTMLElement).dataset.index) !== this.draggedIndex) {
            (el as HTMLElement).style.border = '';
          }
        });
        wrapper.style.border = '3px solid #fbbf24';
        wrapper.style.borderRadius = '8px';
        this.touchCurrentIndex = index;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent, index: number): void {
    e.preventDefault();
    e.stopPropagation();
    
    const target = document.querySelector(`[data-index="${this.draggedIndex}"]`) as HTMLElement;
    if (target) {
      target.style.opacity = '1';
      target.style.transform = '';
      target.style.zIndex = '';
      target.style.transition = 'transform 0.2s ease';
    }

    // 清除所有高亮
    document.querySelectorAll('[data-index]').forEach(el => {
      (el as HTMLElement).style.border = '';
    });

    // 如果移动到了新位置，交换
    if (this.touchCurrentIndex !== null && this.touchCurrentIndex !== this.draggedIndex) {
      this.swapJokers(this.draggedIndex!, this.touchCurrentIndex);
    }

    this.draggedIndex = null;
    this.touchCurrentIndex = null;
  }
}
