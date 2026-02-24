/**
 * 效果提示弹出框组件
 * 用于显示游戏内各种效果的详细说明
 */
export class EffectTooltip {
  private static instance: EffectTooltip | null = null;
  private tooltipElement: HTMLElement | null = null;
  private outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  static getInstance(): EffectTooltip {
    if (!EffectTooltip.instance) {
      EffectTooltip.instance = new EffectTooltip();
    }
    return EffectTooltip.instance;
  }

  /**
   * 显示效果提示
   * @param options - 配置选项
   */
  show(options: {
    target: HTMLElement;
    title: string;
    description: string;
    relatedEffects?: Array<{ name: string; description: string }>;
  }): void {
    this.close();

    // 创建 tooltip 元素
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'effect-tooltip';
    this.tooltipElement.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border: 2px solid #d4af37;
      border-radius: 8px;
      padding: 12px 16px;
      max-width: 280px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      font-family: inherit;
    `;

    // 设置内容
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="
        color: #fbbf24;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        padding-bottom: 6px;
      ">${options.title}</div>
      <div style="
        color: #d1d5db;
        font-size: 14px;
        line-height: 1.5;
      ">${options.description}</div>
    `;

    // 添加相关效果（如果有）
    if (options.relatedEffects && options.relatedEffects.length > 0) {
      const relatedSection = document.createElement('div');
      relatedSection.style.cssText = `
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(212, 175, 55, 0.2);
      `;

      const relatedTitle = document.createElement('div');
      relatedTitle.style.cssText = `
        color: #9ca3af;
        font-size: 12px;
        margin-bottom: 6px;
      `;
      relatedTitle.textContent = '相关效果';
      relatedSection.appendChild(relatedTitle);

      options.relatedEffects.forEach(effect => {
        const effectItem = document.createElement('div');
        effectItem.style.cssText = `
          padding: 6px 8px;
          margin-top: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        `;
        effectItem.innerHTML = `
          <div style="color: #c084fc; font-size: 13px; font-weight: bold;">${effect.name}</div>
          <div style="color: #9ca3af; font-size: 11px; margin-top: 2px;">${effect.description}</div>
        `;

        // 悬停效果
        effectItem.addEventListener('mouseenter', () => {
          effectItem.style.background = 'rgba(212, 175, 55, 0.2)';
        });
        effectItem.addEventListener('mouseleave', () => {
          effectItem.style.background = 'rgba(0, 0, 0, 0.3)';
        });

        relatedSection.appendChild(effectItem);
      });

      content.appendChild(relatedSection);
    }

    this.tooltipElement.appendChild(content);

    // 计算位置
    this.positionTooltip(options.target);

    // 添加到 DOM
    document.body.appendChild(this.tooltipElement);

    // 绑定点击外部关闭事件
    this.outsideClickHandler = (e: MouseEvent) => {
      if (this.tooltipElement && !this.tooltipElement.contains(e.target as Node)) {
        // 检查点击目标是否不是触发元素
        if (e.target !== options.target && !options.target.contains(e.target as Node)) {
          this.close();
        }
      }
    };

    // 延迟绑定，避免立即触发关闭
    setTimeout(() => {
      document.addEventListener('click', this.outsideClickHandler!);
    }, 0);
  }

  /**
   * 计算并设置 tooltip 位置
   */
  private positionTooltip(target: HTMLElement): void {
    if (!this.tooltipElement) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    // 默认显示在目标元素右侧
    let left = targetRect.right + 10;
    let top = targetRect.top;

    // 检查是否超出右边界
    if (left + tooltipRect.width > window.innerWidth) {
      // 显示在左侧
      left = targetRect.left - tooltipRect.width - 10;
    }

    // 检查是否超出下边界
    if (top + tooltipRect.height > window.innerHeight) {
      // 向上调整
      top = window.innerHeight - tooltipRect.height - 10;
    }

    // 确保不超出上边界
    if (top < 10) {
      top = 10;
    }

    // 确保不超出左边界
    if (left < 10) {
      left = 10;
    }

    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.style.top = `${top}px`;
  }

  /**
   * 关闭 tooltip
   */
  close(): void {
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }

    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
  }

  /**
   * 检查是否已显示
   */
  isVisible(): boolean {
    return this.tooltipElement !== null;
  }
}
