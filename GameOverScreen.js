// Game Over Screen for failures/quits
export class GameOverScreen {
  constructor(onRestart, onViewReport) {
    this.onRestart = onRestart;
    this.onViewReport = onViewReport;
    this.visible = false;
  }

  show(reason, stats) {
    this.visible = true;
    
    const overlay = document.createElement('div');
    overlay.id = 'gameOverScreen';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 1500;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.5s ease-in-out;
      font-family: 'Orbitron', sans-serif;
    `;

    const isSuccess = reason === 'completed';
    const title = isSuccess ? '🎉 SESSION COMPLETE! 🎉' : '💀 GAME OVER 💀';
    const titleColor = isSuccess ? '#4ecdc4' : '#ff6b6b';
    
    overlay.innerHTML = `
      <style>
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        @keyframes celebration {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        
        .game-over-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 3px solid ${titleColor};
          border-radius: 20px;
          padding: 50px;
          max-width: 700px;
          width: 90%;
          box-shadow: 0 20px 60px ${isSuccess ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 107, 107, 0.5)'};
          animation: ${isSuccess ? 'celebration' : 'shake'} 0.6s ease-out;
          color: white;
          text-align: center;
        }
        
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        
        .stat-item {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(78, 205, 196, 0.3);
          border-radius: 10px;
          padding: 15px;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #4ecdc4;
          margin: 5px 0;
        }
        
        .stat-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
        }
        
        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
          flex-wrap: wrap;
        }
        
        .game-over-btn {
          padding: 15px 40px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          border: none;
          transition: all 0.3s;
          text-transform: uppercase;
        }
        
        .game-over-btn:hover {
          transform: scale(1.05);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #4ecdc4 0%, #3ab0a8 100%);
          color: white;
        }
        
        .btn-primary:hover {
          box-shadow: 0 5px 20px rgba(78, 205, 196, 0.5);
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          color: white;
        }
        
        .btn-secondary:hover {
          box-shadow: 0 5px 20px rgba(255, 107, 107, 0.5);
        }
        
        .btn-tertiary {
          background: linear-gradient(135deg, #ffd700 0%, #f0c419 100%);
          color: #1a1a2e;
        }
        
        .btn-tertiary:hover {
          box-shadow: 0 5px 20px rgba(255, 215, 0, 0.5);
        }
      </style>
      
      <div class="game-over-card">
        <h1 style="
          font-size: 48px;
          color: ${titleColor};
          margin: 0 0 20px 0;
          font-weight: bold;
        ">
          ${title}
        </h1>
        
        ${this.getReasonMessage(reason)}
        
        <!-- Stats -->
        <div class="stat-grid">
          <div class="stat-item">
            <div class="stat-label">Score</div>
            <div class="stat-value" style="color: #ffd700;">${stats.score}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Orders</div>
            <div class="stat-value">${stats.ordersCompleted}/${stats.targetOrders}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Perfect</div>
            <div class="stat-value" style="color: #00ff00;">${stats.perfectOrders}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Banned Items</div>
            <div class="stat-value" style="color: #ff6b6b;">${stats.bannedCount}</div>
          </div>
        </div>
        
        <!-- Performance Summary -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-left: 4px solid ${titleColor};
          padding: 20px;
          margin: 30px 0;
          text-align: left;
          border-radius: 5px;
        ">
          <h3 style="margin: 0 0 10px 0; color: ${titleColor}; font-size: 18px;">📊 QUICK STATS</h3>
          <div style="color: #ddd; line-height: 1.8; font-size: 14px;">
            ${this.getQuickStats(stats)}
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          ${stats.ordersCompleted > 0 ? `
            <button id="viewReportGameOver" class="game-over-btn btn-tertiary">
              📊 VIEW FULL REPORT
            </button>
          ` : ''}
          <button id="restartGameOver" class="game-over-btn btn-primary">
            🔄 TRY AGAIN
          </button>
          <button id="quitGameOver" class="game-over-btn btn-secondary">
            🚪 MAIN MENU
          </button>
        </div>
        
        ${isSuccess ? `
          <p style="
            margin-top: 30px;
            color: #4ecdc4;
            font-size: 16px;
            font-style: italic;
          ">
            "You survived the chaos. Impressive." - Chef
          </p>
        ` : `
          <p style="
            margin-top: 30px;
            color: #ff6b6b;
            font-size: 16px;
            font-style: italic;
          ">
            "Not everyone can handle the heat." - Chef
          </p>
        `}
      </div>
    `;

    document.body.appendChild(overlay);

    // Setup buttons
    const restartBtn = overlay.querySelector('#restartGameOver');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.hide();
        if (this.onRestart) this.onRestart();
      });
    }

    const quitBtn = overlay.querySelector('#quitGameOver');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        this.hide();
        window.location.reload();
      });
    }

    const viewReportBtn = overlay.querySelector('#viewReportGameOver');
    if (viewReportBtn) {
      viewReportBtn.addEventListener('click', () => {
        this.hide();
        if (this.onViewReport) this.onViewReport();
      });
    }
  }

  getReasonMessage(reason) {
    const messages = {
      'completed': `
        <p style="color: #ddd; font-size: 18px; margin: 0 0 30px 0;">
          You survived the Chef's escalating chaos and completed all orders!<br>
          Check your full performance report below.
        </p>
      `,
      'quit': `
        <p style="color: #ddd; font-size: 18px; margin: 0 0 30px 0;">
          Session ended early.<br>
          The kitchen was too hot to handle?
        </p>
      `,
      'timeout': `
        <p style="color: #ff6b6b; font-size: 18px; margin: 0 0 30px 0;">
          Too many orders failed.<br>
          Speed and accuracy are both essential!
        </p>
      `,
      'gave_up': `
        <p style="color: #ffa500; font-size: 18px; margin: 0 0 30px 0;">
          You left the kitchen.<br>
          Sometimes stepping away is the right choice.
        </p>
      `
    };

    return messages[reason] || messages['quit'];
  }

  getQuickStats(stats) {
    const completionRate = ((stats.ordersCompleted / stats.targetOrders) * 100).toFixed(0);
    const perfectRate = stats.ordersCompleted > 0 
      ? ((stats.perfectOrders / stats.ordersCompleted) * 100).toFixed(0) 
      : 0;
    
    return `
      • Completion Rate: <strong style="color: #4ecdc4;">${completionRate}%</strong><br>
      • Perfect Order Rate: <strong style="color: #00ff00;">${perfectRate}%</strong><br>
      • Fast Completions: <strong style="color: #4ecdc4;">${stats.fastCompletions}</strong><br>
      • Times Out of Time: <strong style="color: #ff6b6b;">${stats.timeouts}</strong><br>
      • Escalation Level: <strong style="color: #ffd700;">${stats.escalationLevel}</strong>
    `;
  }

  hide() {
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
      gameOverScreen.style.animation = 'fadeOut 0.3s ease-in-out';
      setTimeout(() => gameOverScreen.remove(), 300);
    }
    this.visible = false;
  }
}
