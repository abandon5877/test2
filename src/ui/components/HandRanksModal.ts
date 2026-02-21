import { HAND_BASE_VALUES, PokerHandType, POKER_HAND_HIERARCHY } from '../../types/pokerHands';
import { PLANET_CARDS } from '../../data/planetCards';
import { HandLevelSystem } from '../../systems/HandLevelSystem';
import type { HandLevel, HandLevelState } from '../../models/HandLevelState';

export class HandRanksModal {
  private modal: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private handLevelState: HandLevelState;

  constructor(handLevelState: HandLevelState) {
    this.handLevelState = handLevelState;
  }

  /**
   * 显示牌型等级弹窗
   */
  show(): void {
    this.createModal();
    document.body.appendChild(this.overlay!);
    document.body.appendChild(this.container!);

    // 添加动画效果
    requestAnimationFrame(() => {
      this.overlay!.style.opacity = '1';
      this.modal!.style.opacity = '1';
      this.modal!.style.transform = 'scale(1)';
    });
  }

  /**
   * 关闭弹窗
   */
  close(): void {
    if (this.overlay && this.modal && this.container) {
      this.overlay.style.opacity = '0';
      this.modal.style.opacity = '0';
      this.modal.style.transform = 'scale(0.95)';

      setTimeout(() => {
        this.overlay?.remove();
        this.container?.remove();
        this.overlay = null;
        this.modal = null;
        this.container = null;
      }, 200);
    }
  }

  /**
   * 创建弹窗
   */
  private createModal(): void {

    // 创建遮罩层 - 半透明黑色背景，使用非常高的 z-index
    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-black/70 transition-opacity duration-200';
    this.overlay.style.zIndex = '9999';
    this.overlay.style.opacity = '0';
    this.overlay.addEventListener('click', () => this.close());

    // 创建弹窗容器 - 使用 flex 布局确保居中，同样使用高 z-index
    this.container = document.createElement('div');
    this.container.className = 'fixed inset-0 flex items-center justify-center p-4 pointer-events-none';
    this.container.style.zIndex = '10000';

    // 创建弹窗 - 中心弹出窗口
    this.modal = document.createElement('div');
    this.modal.className = 'game-panel overflow-hidden flex flex-col transition-all duration-200 pointer-events-auto';
    this.modal.style.opacity = '0';
    this.modal.style.transform = 'scale(0.95)';
    this.modal.style.width = '100%';
    this.modal.style.maxWidth = '750px';
    this.modal.style.maxHeight = '85vh';
    this.modal.style.minHeight = '300px';
    this.modal.style.margin = '20px auto';

    const content = document.createElement('div');
    content.className = 'flex flex-col';
    content.style.height = '100%';
    content.style.maxHeight = 'calc(85vh - 40px)';

    // 标题栏
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b border-yellow-500/30';
    header.style.flexShrink = '0';
    header.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold text-yellow-400">牌型等级</h2>
        <p class="text-gray-400 text-sm mt-1">使用星球卡升级牌型，提升基础筹码和倍率</p>
      </div>
      <button class="text-gray-400 hover:text-white text-2xl transition-colors" id="close-hand-ranks">&times;</button>
    `;

    // 内容区域
    const body = document.createElement('div');
    body.className = 'p-4 hand-ranks-scroll';
    body.style.flex = '1';
    body.style.overflowY = 'auto';
    body.style.minHeight = '0';
    body.style.scrollbarWidth = 'thin';
    body.style.scrollbarColor = 'rgba(251, 191, 36, 0.5) rgba(0, 0, 0, 0.3)';

    // 添加 Webkit 滚动条样式
    const style = document.createElement('style');
    style.textContent = `
      .hand-ranks-scroll::-webkit-scrollbar {
        width: 8px;
      }
      .hand-ranks-scroll::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      }
      .hand-ranks-scroll::-webkit-scrollbar-thumb {
        background: rgba(251, 191, 36, 0.5);
        border-radius: 4px;
      }
      .hand-ranks-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(251, 191, 36, 0.8);
      }
    `;
    document.head.appendChild(style);

    // 牌型列表
    const handList = document.createElement('div');
    handList.className = 'space-y-2 pb-2';

    // 按照等级顺序显示所有牌型
    POKER_HAND_HIERARCHY.forEach((handType, index) => {
      const handInfo = HAND_BASE_VALUES[handType];
      const planetCard = PLANET_CARDS[handType];
      const handLevel = HandLevelSystem.getHandLevel(this.handLevelState, handType);
      const upgradedValue = HandLevelSystem.getUpgradedHandValue(this.handLevelState, handType);
      const rank = index + 1;

      const handRow = document.createElement('div');
      handRow.className = 'flex items-center gap-3 p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors';

      // 等级标签样式
      const levelClass = handLevel.level > 1 ? 'bg-purple-500' : 'bg-gray-600';
      const levelText = handLevel.level > 1 ? `Lv.${handLevel.level}` : 'Lv.1';

      // 升级信息
      let upgradeInfo = '';
      if (planetCard) {
        const upgradeText = handLevel.level > 1 
          ? `<span class="text-green-400">+${handLevel.totalChipBonus} 筹码</span> <span class="text-blue-400">+${handLevel.totalMultBonus} 倍率</span>`
          : `<span class="text-gray-500">升级: +${planetCard.chipBonus} 筹码 +${planetCard.multBonus} 倍率</span>`;
        
        upgradeInfo = `
          <div class="flex items-center gap-2 mt-1 text-xs">
            ${upgradeText}
          </div>
        `;
      }

      // 数值显示（基础值 vs 升级后）
      const chipsDisplay = handLevel.level > 1 
        ? `<span class="text-gray-500 line-through text-xs">${handInfo.chips}</span> <span class="text-yellow-400 font-bold">${upgradedValue.chips}</span>`
        : `<span class="text-yellow-400 font-bold">${handInfo.chips}</span>`;
      
      const multDisplay = handLevel.level > 1
        ? `<span class="text-gray-500 line-through text-xs">x${handInfo.multiplier}</span> <span class="text-blue-400 font-bold">x${upgradedValue.multiplier}</span>`
        : `<span class="text-blue-400 font-bold">x${handInfo.multiplier}</span>`;

      handRow.innerHTML = `
        <div class="w-7 h-7 flex items-center justify-center bg-yellow-500/20 rounded-full text-yellow-400 font-bold text-xs flex-shrink-0">
          ${rank}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-white font-bold text-sm">${handInfo.displayName}</span>
            <span class="${levelClass} text-white text-xs px-1.5 py-0.5 rounded font-bold">${levelText}</span>
          </div>
          <div class="text-gray-400 text-xs">${this.getHandDescription(handType)}</div>
          ${upgradeInfo}
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-sm">${chipsDisplay} 筹码</div>
          <div class="text-sm">${multDisplay} 倍率</div>
        </div>
      `;

      handList.appendChild(handRow);
    });

    body.appendChild(handList);

    // 底部说明
    const footer = document.createElement('div');
    footer.className = 'mt-4 p-3 bg-yellow-500/10 rounded-lg text-yellow-400 text-sm text-center';
    footer.style.flexShrink = '0';
    footer.innerHTML = '💡 提示：打出更高等级的牌型可以获得更多分数！使用<span class="text-purple-400">星球卡</span>可以永久升级牌型！';
    body.appendChild(footer);

    content.appendChild(header);
    content.appendChild(body);
    this.modal.appendChild(content);
    this.container.appendChild(this.modal);

    // 绑定关闭按钮事件
    setTimeout(() => {
      const closeBtn = document.getElementById('close-hand-ranks');
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
   * 获取牌型描述
   */
  private getHandDescription(handType: PokerHandType): string {
    const descriptions: Record<PokerHandType, string> = {
      [PokerHandType.HighCard]: '五张牌中没有任何组合',
      [PokerHandType.OnePair]: '两张相同点数的牌',
      [PokerHandType.TwoPair]: '两对相同点数的牌',
      [PokerHandType.ThreeOfAKind]: '三张相同点数的牌',
      [PokerHandType.Straight]: '五张连续点数的牌',
      [PokerHandType.Flush]: '五张相同花色的牌',
      [PokerHandType.FullHouse]: '三张相同点数加一对',
      [PokerHandType.FourOfAKind]: '四张相同点数的牌',
      [PokerHandType.StraightFlush]: '五张连续同花色的牌',
      [PokerHandType.RoyalFlush]: '10-J-Q-K-A 同花色',
      [PokerHandType.FiveOfAKind]: '五张相同点数的牌（需万能牌）',
      [PokerHandType.FlushHouse]: '同花色的葫芦',
      [PokerHandType.FlushFive]: '五张同花色同点数的牌'
    };
    return descriptions[handType] || '';
  }
}
