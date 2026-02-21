import { GameState } from '../../models/GameState';

export interface GameOverCallbacks {
  onRestart: () => void;
  onMainMenu: () => void;
}

export interface GameOverStats {
  finalScore: number;
  highestAnte: number;
  roundsPlayed: number;
  handsPlayed: number;
  jokersCollected: number;
  moneyEarned: number;
}

/**
 * 游戏结束界面组件
 * 显示游戏结束信息和统计
 */
export class GameOverComponent {
  private container: HTMLElement;
  private gameState: GameState;
  private callbacks: GameOverCallbacks;
  private isVictory: boolean;
  private stats: GameOverStats;

  constructor(
    container: HTMLElement,
    gameState: GameState,
    isVictory: boolean,
    stats: GameOverStats,
    callbacks: GameOverCallbacks
  ) {
    this.container = container;
    this.gameState = gameState;
    this.isVictory = isVictory;
    this.stats = stats;
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
   * 渲染游戏结束界面
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

    // 标题
    const title = document.createElement('h1');
    title.style.fontSize = this.scaled(64);
    title.style.fontWeight = 'bold';
    title.style.marginBottom = this.scaled(20);
    title.style.textAlign = 'center';
    
    if (this.isVictory) {
      title.textContent = '🎉 恭喜通关！';
      title.style.color = '#fbbf24';
      title.style.textShadow = '0 0 20px rgba(251, 191, 36, 0.5)';
    } else {
      title.textContent = '💀 游戏结束';
      title.style.color = '#ef4444';
      title.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.5)';
    }
    mainContainer.appendChild(title);

    // 副标题
    const subtitle = document.createElement('p');
    subtitle.style.fontSize = this.scaled(24);
    subtitle.style.color = '#9ca3af';
    subtitle.style.marginBottom = this.scaled(40);
    subtitle.style.textAlign = 'center';
    subtitle.textContent = this.isVictory 
      ? '你成功击败了所有Boss！' 
      : '未能达到目标分数，再试一次吧！';
    mainContainer.appendChild(subtitle);

    // 统计面板
    const statsPanel = this.createStatsPanel();
    mainContainer.appendChild(statsPanel);

    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.display = 'flex';
    buttonArea.style.gap = this.scaled(20);
    buttonArea.style.marginTop = this.scaled(40);

    // 重新开始按钮
    const restartButton = document.createElement('button');
    restartButton.className = 'game-btn game-btn-primary';
    restartButton.style.fontSize = this.scaled(20);
    restartButton.style.padding = `${this.scaled(16)} ${this.scaled(32)}`;
    restartButton.textContent = '🔄 重新开始';
    restartButton.addEventListener('click', () => this.callbacks.onRestart());
    buttonArea.appendChild(restartButton);

    // 主菜单按钮
    const menuButton = document.createElement('button');
    menuButton.className = 'game-btn game-btn-secondary';
    menuButton.style.fontSize = this.scaled(20);
    menuButton.style.padding = `${this.scaled(16)} ${this.scaled(32)}`;
    menuButton.textContent = '🏠 主菜单';
    menuButton.addEventListener('click', () => this.callbacks.onMainMenu());
    buttonArea.appendChild(menuButton);

    mainContainer.appendChild(buttonArea);

    this.container.appendChild(mainContainer);

    // 添加动画效果
    this.addAnimations();
  }

  /**
   * 创建统计面板
   */
  private createStatsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.background = 'rgba(0, 0, 0, 0.5)';
    panel.style.border = '2px solid rgba(251, 191, 36, 0.3)';
    panel.style.borderRadius = '16px';
    panel.style.padding = this.scaled(30);
    panel.style.minWidth = this.scaled(400);
    panel.style.maxWidth = this.scaled(600);

    const title = document.createElement('h2');
    title.textContent = '📊 游戏统计';
    title.style.fontSize = this.scaled(28);
    title.style.color = '#fbbf24';
    title.style.marginBottom = this.scaled(20);
    title.style.textAlign = 'center';
    panel.appendChild(title);

    // 统计项网格
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    grid.style.gap = `${this.scaled(16)} ${this.scaled(30)}`;

    // 添加统计项
    const statItems = [
      { label: '最终分数', value: this.stats.finalScore.toLocaleString(), icon: '🏆' },
      { label: '最高底注', value: `底注 ${this.stats.highestAnte}`, icon: '📈' },
      { label: '进行回合', value: `${this.stats.roundsPlayed} 回合`, icon: '🎮' },
      { label: '出牌次数', value: `${this.stats.handsPlayed} 次`, icon: '🃏' },
      { label: '收集小丑', value: `${this.stats.jokersCollected} 张`, icon: '🤡' },
      { label: '获得金钱', value: `$${this.stats.moneyEarned}`, icon: '💰' },
    ];

    for (const item of statItems) {
      const statItem = document.createElement('div');
      statItem.style.display = 'flex';
      statItem.style.flexDirection = 'column';
      statItem.style.alignItems = 'center';
      statItem.style.padding = this.scaled(12);
      statItem.style.background = 'rgba(255, 255, 255, 0.05)';
      statItem.style.borderRadius = '8px';

      const icon = document.createElement('span');
      icon.textContent = item.icon;
      icon.style.fontSize = this.scaled(24);
      icon.style.marginBottom = this.scaled(4);
      statItem.appendChild(icon);

      const value = document.createElement('span');
      value.textContent = item.value;
      value.style.fontSize = this.scaled(20);
      value.style.fontWeight = 'bold';
      value.style.color = '#fff';
      statItem.appendChild(value);

      const label = document.createElement('span');
      label.textContent = item.label;
      label.style.fontSize = this.scaled(14);
      label.style.color = '#9ca3af';
      statItem.appendChild(label);

      grid.appendChild(statItem);
    }

    panel.appendChild(grid);

    return panel;
  }

  /**
   * 添加动画效果
   */
  private addAnimations(): void {
    // 添加CSS动画
    if (!document.getElementById('game-over-animations')) {
      const style = document.createElement('style');
      style.id = 'game-over-animations';
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .game-over-title {
          animation: fadeInUp 0.6s ease, pulse 2s ease infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
