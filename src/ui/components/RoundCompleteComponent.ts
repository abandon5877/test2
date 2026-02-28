import { GameState } from '../../models/GameState';
import { BlindType } from '../../types/game';
import { formatNumber } from '../../utils/numberFormat';

export interface RoundCompleteCallbacks {
  onContinue: () => void;
}

export interface RoundCompleteData {
  roundScore: number;
  targetScore: number;
  blindType: BlindType;
  blindName: string;
  moneyEarned: number;
  interestEarned: number;
  handsRemaining: number;
  discardsRemaining: number;
}

/**
 * 回合结算界面组件
 * 显示回合完成后的结算信息
 */
export class RoundCompleteComponent {
  private container: HTMLElement;
  private gameState: GameState;
  private callbacks: RoundCompleteCallbacks;
  private data: RoundCompleteData;

  constructor(
    container: HTMLElement,
    gameState: GameState,
    data: RoundCompleteData,
    callbacks: RoundCompleteCallbacks
  ) {
    this.container = container;
    this.gameState = gameState;
    this.data = data;
    this.callbacks = callbacks;
    this.render();
  }

  /**
   * 根据屏幕尺寸计算动态缩放值
   */
  private scaled(value: number): string {
    const baseScale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    const scale = Math.max(0.3, Math.min(2.0, baseScale));
    return `${Math.round(value * scale)}px`;
  }

  /**
   * 渲染回合结算界面
   */
  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'casino-bg game-container';

    // 创建主容器
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = 'column';
    mainContainer.style.alignItems = 'center';
    mainContainer.style.justifyContent = 'center';
    mainContainer.style.minHeight = '100vh';
    mainContainer.style.padding = this.scaled(20);

    // 胜利图标
    const icon = document.createElement('div');
    icon.textContent = '🏆';
    icon.style.fontSize = this.scaled(80);
    icon.style.marginBottom = this.scaled(20);
    icon.style.animation = 'bounce 1s ease infinite';
    mainContainer.appendChild(icon);

    // 标题
    const title = document.createElement('h1');
    title.textContent = '回合完成！';
    title.style.fontSize = this.scaled(48);
    title.style.fontWeight = 'bold';
    title.style.color = '#fbbf24';
    title.style.marginBottom = this.scaled(10);
    title.style.textAlign = 'center';
    mainContainer.appendChild(title);

    // Boss名称
    const bossName = document.createElement('p');
    bossName.textContent = `击败了: ${this.data.blindName}`;
    bossName.style.fontSize = this.scaled(24);
    bossName.style.color = '#9ca3af';
    bossName.style.marginBottom = this.scaled(30);
    bossName.style.textAlign = 'center';
    mainContainer.appendChild(bossName);

    // 结算面板
    const panel = this.createSettlementPanel();
    mainContainer.appendChild(panel);

    // 继续按钮
    const continueButton = document.createElement('button');
    continueButton.className = 'game-btn game-btn-primary';
    continueButton.style.fontSize = this.scaled(24);
    continueButton.style.padding = `${this.scaled(16)} ${this.scaled(48)}`;
    continueButton.style.marginTop = this.scaled(40);
    continueButton.textContent = '继续 →';
    continueButton.addEventListener('click', () => this.callbacks.onContinue());
    mainContainer.appendChild(continueButton);

    this.container.appendChild(mainContainer);

    // 添加动画
    this.addAnimations();
  }

  /**
   * 创建结算面板
   */
  private createSettlementPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.background = 'rgba(0, 0, 0, 0.6)';
    panel.style.border = '2px solid rgba(251, 191, 36, 0.4)';
    panel.style.borderRadius = '16px';
    panel.style.padding = this.scaled(30);
    panel.style.minWidth = this.scaled(450);
    panel.style.maxWidth = this.scaled(600);

    // 分数区域
    const scoreSection = document.createElement('div');
    scoreSection.style.display = 'flex';
    scoreSection.style.justifyContent = 'space-between';
    scoreSection.style.alignItems = 'center';
    scoreSection.style.marginBottom = this.scaled(20);
    scoreSection.style.paddingBottom = this.scaled(20);
    scoreSection.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';

    const scoreLabel = document.createElement('span');
    scoreLabel.textContent = '获得分数';
    scoreLabel.style.fontSize = this.scaled(20);
    scoreLabel.style.color = '#9ca3af';
    scoreSection.appendChild(scoreLabel);

    const scoreValue = document.createElement('span');
    scoreValue.textContent = formatNumber(this.data.roundScore);
    scoreValue.style.fontSize = this.scaled(32);
    scoreValue.style.fontWeight = 'bold';
    scoreValue.style.color = '#fbbf24';
    scoreSection.appendChild(scoreValue);

    panel.appendChild(scoreSection);

    // 目标分数
    const targetSection = document.createElement('div');
    targetSection.style.display = 'flex';
    targetSection.style.justifyContent = 'space-between';
    targetSection.style.alignItems = 'center';
    targetSection.style.marginBottom = this.scaled(20);

    const targetLabel = document.createElement('span');
    targetLabel.textContent = '目标分数';
    targetLabel.style.fontSize = this.scaled(18);
    targetLabel.style.color = '#9ca3af';
    targetSection.appendChild(targetLabel);

    const targetValue = document.createElement('span');
    targetValue.textContent = formatNumber(this.data.targetScore);
    targetValue.style.fontSize = this.scaled(20);
    targetValue.style.color = '#fff';
    targetSection.appendChild(targetValue);

    panel.appendChild(targetSection);

    // 剩余资源
    const resourcesSection = document.createElement('div');
    resourcesSection.style.display = 'flex';
    resourcesSection.style.justifyContent = 'center';
    resourcesSection.style.gap = this.scaled(30);
    resourcesSection.style.marginBottom = this.scaled(20);
    resourcesSection.style.padding = `${this.scaled(15)} 0`;
    resourcesSection.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
    resourcesSection.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';

    // 剩余出牌
    const handsDiv = document.createElement('div');
    handsDiv.style.textAlign = 'center';
    const handsIcon = document.createElement('div');
    handsIcon.textContent = '🃏';
    handsIcon.style.fontSize = this.scaled(24);
    handsDiv.appendChild(handsIcon);
    const handsText = document.createElement('div');
    handsText.textContent = `${this.data.handsRemaining} 剩余出牌`;
    handsText.style.fontSize = this.scaled(14);
    handsText.style.color = '#9ca3af';
    handsDiv.appendChild(handsText);
    resourcesSection.appendChild(handsDiv);

    // 剩余弃牌
    const discardsDiv = document.createElement('div');
    discardsDiv.style.textAlign = 'center';
    const discardsIcon = document.createElement('div');
    discardsIcon.textContent = '🗑️';
    discardsIcon.style.fontSize = this.scaled(24);
    discardsDiv.appendChild(discardsIcon);
    const discardsText = document.createElement('div');
    discardsText.textContent = `${this.data.discardsRemaining} 剩余弃牌`;
    discardsText.style.fontSize = this.scaled(14);
    discardsText.style.color = '#9ca3af';
    discardsDiv.appendChild(discardsText);
    resourcesSection.appendChild(discardsDiv);

    panel.appendChild(resourcesSection);

    // 金钱收益
    const moneySection = document.createElement('div');
    moneySection.style.display = 'flex';
    moneySection.style.flexDirection = 'column';
    moneySection.style.gap = this.scaled(10);

    // 基础奖励
    const baseReward = document.createElement('div');
    baseReward.style.display = 'flex';
    baseReward.style.justifyContent = 'space-between';
    baseReward.style.alignItems = 'center';

    const baseLabel = document.createElement('span');
    baseLabel.textContent = '基础奖励';
    baseLabel.style.fontSize = this.scaled(16);
    baseLabel.style.color = '#9ca3af';
    baseReward.appendChild(baseLabel);

    const baseValue = document.createElement('span');
    baseValue.textContent = `+$${this.data.moneyEarned}`;
    baseValue.style.fontSize = this.scaled(18);
    baseValue.style.color = '#2ecc71';
    baseReward.appendChild(baseValue);

    moneySection.appendChild(baseReward);

    // 利息
    if (this.data.interestEarned > 0) {
      const interestReward = document.createElement('div');
      interestReward.style.display = 'flex';
      interestReward.style.justifyContent = 'space-between';
      interestReward.style.alignItems = 'center';

      const interestLabel = document.createElement('span');
      interestLabel.textContent = '利息收益';
      interestLabel.style.fontSize = this.scaled(16);
      interestLabel.style.color = '#9ca3af';
      interestReward.appendChild(interestLabel);

      const interestValue = document.createElement('span');
      interestValue.textContent = `+$${this.data.interestEarned}`;
      interestValue.style.fontSize = this.scaled(18);
      interestValue.style.color = '#2ecc71';
      interestReward.appendChild(interestValue);

      moneySection.appendChild(interestReward);
    }

    // 总计
    const totalReward = document.createElement('div');
    totalReward.style.display = 'flex';
    totalReward.style.justifyContent = 'space-between';
    totalReward.style.alignItems = 'center';
    totalReward.style.marginTop = this.scaled(10);
    totalReward.style.paddingTop = this.scaled(10);
    totalReward.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';

    const totalLabel = document.createElement('span');
    totalLabel.textContent = '总计获得';
    totalLabel.style.fontSize = this.scaled(20);
    totalLabel.style.fontWeight = 'bold';
    totalLabel.style.color = '#fff';
    totalReward.appendChild(totalLabel);

    const totalValue = document.createElement('span');
    const total = this.data.moneyEarned + this.data.interestEarned;
    totalValue.textContent = `+$${total}`;
    totalValue.style.fontSize = this.scaled(28);
    totalValue.style.fontWeight = 'bold';
    totalValue.style.color = '#2ecc71';
    totalReward.appendChild(totalValue);

    moneySection.appendChild(totalReward);

    panel.appendChild(moneySection);

    return panel;
  }

  /**
   * 添加动画效果
   */
  private addAnimations(): void {
    if (!document.getElementById('round-complete-animations')) {
      const style = document.createElement('style');
      style.id = 'round-complete-animations';
      style.textContent = `
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
