export interface MainMenuCallbacks {
  onStartGame: () => void;
  onContinueGame: () => void;
  onSettings: () => void;
  onHelp: () => void;
}

export interface MainMenuOptions {
  hasSavedGame: boolean;
  version?: string;
}

/**
 * 主菜单界面组件
 * 游戏入口主菜单
 */
export class MainMenuComponent {
  private container: HTMLElement;
  private callbacks: MainMenuCallbacks;
  private options: MainMenuOptions;

  constructor(
    container: HTMLElement,
    callbacks: MainMenuCallbacks,
    options: MainMenuOptions
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.options = options;
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
   * 渲染主菜单界面
   */
  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'casino-bg game-container overflow-y-auto';

    // 创建主容器
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = 'column';
    mainContainer.style.alignItems = 'center';
    mainContainer.style.justifyContent = 'center';
    mainContainer.style.minHeight = '100vh';
    mainContainer.style.padding = `${this.scaled(20)} ${this.scaled(20)} ${this.scaled(60)}`;

    // 内容包装器 - 限制最大宽度
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.width = '100%';
    contentWrapper.style.maxWidth = '800px';

    // 游戏标题
    const titleContainer = document.createElement('div');
    titleContainer.style.textAlign = 'center';
    titleContainer.style.marginBottom = this.scaled(40);
    titleContainer.style.width = '100%';

    const title = document.createElement('h1');
    title.textContent = '🃏 BALATRO';
    // 使用 clamp 限制字体大小，防止越界
    title.style.fontSize = `clamp(32px, 10vw, ${this.scaled(72)})`;
    title.style.fontWeight = 'bold';
    title.style.color = '#fbbf24';
    title.style.textShadow = '0 0 30px rgba(251, 191, 36, 0.5)';
    title.style.marginBottom = '10px';
    title.style.letterSpacing = '0.1em';
    title.style.wordBreak = 'break-word';
    titleContainer.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = '扑克牌Roguelike游戏';
    subtitle.style.fontSize = `clamp(14px, 4vw, ${this.scaled(24)})`;
    subtitle.style.color = '#9ca3af';
    subtitle.style.letterSpacing = '0.2em';
    titleContainer.appendChild(subtitle);

    // 版本号
    if (this.options.version) {
      const version = document.createElement('span');
      version.textContent = `v${this.options.version}`;
      version.style.fontSize = `clamp(10px, 2.5vw, ${this.scaled(14)})`;
      version.style.color = '#6b7280';
      version.style.marginTop = '10px';
      titleContainer.appendChild(version);
    }

    contentWrapper.appendChild(titleContainer);

    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.display = 'flex';
    buttonArea.style.flexDirection = 'column';
    buttonArea.style.gap = this.scaled(16);
    buttonArea.style.alignItems = 'center';
    buttonArea.style.width = '100%';
    buttonArea.style.maxWidth = this.scaled(400);

    // 继续游戏按钮（如果有存档）
    if (this.options.hasSavedGame) {
      const continueButton = this.createMenuButton('▶️ 继续游戏', 'primary', () => this.callbacks.onContinueGame());
      continueButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      buttonArea.appendChild(continueButton);
    }

    // 开始新游戏按钮
    const startButton = this.createMenuButton(
      this.options.hasSavedGame ? '🔄 开始新游戏' : '▶️ 开始游戏',
      'primary',
      () => this.callbacks.onStartGame()
    );
    buttonArea.appendChild(startButton);

    // 设置按钮
    const settingsButton = this.createMenuButton('⚙️ 设置', 'secondary', () => this.callbacks.onSettings());
    buttonArea.appendChild(settingsButton);

    // 帮助按钮
    const helpButton = this.createMenuButton('❓ 游戏说明', 'secondary', () => this.callbacks.onHelp());
    buttonArea.appendChild(helpButton);

    contentWrapper.appendChild(buttonArea);

    // 底部信息
    const footer = document.createElement('div');
    footer.style.marginTop = this.scaled(40);
    footer.style.textAlign = 'center';
    footer.style.color = '#6b7280';
    footer.style.fontSize = `clamp(10px, 2.5vw, ${this.scaled(14)})`;
    footer.innerHTML = '使用鼠标点击操作 | 支持键盘快捷键';
    contentWrapper.appendChild(footer);

    mainContainer.appendChild(contentWrapper);
    this.container.appendChild(mainContainer);

    // 添加动画
    this.addAnimations();
  }

  /**
   * 创建菜单按钮
   */
  private createMenuButton(
    text: string,
    type: 'primary' | 'secondary',
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `game-btn game-btn-${type}`;
    button.style.fontSize = this.scaled(22);
    button.style.padding = `${this.scaled(16)} ${this.scaled(40)}`;
    button.style.width = '100%';
    button.style.minWidth = this.scaled(280);
    button.style.transition = 'all 0.2s ease';
    button.textContent = text;

    // 悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = 'none';
    });

    button.addEventListener('click', onClick);

    return button;
  }

  /**
   * 添加动画效果
   */
  private addAnimations(): void {
    if (!document.getElementById('main-menu-animations')) {
      const style = document.createElement('style');
      style.id = 'main-menu-animations';
      style.textContent = `
        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
          }
          50% {
            text-shadow: 0 0 50px rgba(251, 191, 36, 0.8), 0 0 70px rgba(251, 191, 36, 0.4);
          }
        }
        
        .game-title {
          animation: glow 3s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
