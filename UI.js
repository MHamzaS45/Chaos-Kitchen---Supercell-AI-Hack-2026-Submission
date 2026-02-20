// UI management system
import { CONFIG } from './config.js';

export class UI {
  constructor() {
    this.createUI();
    this.score = 0;
    this.ordersCompleted = 0;
  }

  createUI() {
    // Main UI container
    const ui = document.createElement('div');
    ui.id = 'ui';
    document.body.appendChild(ui);

    // View Report Button (top center)
    const viewReportBtn = document.createElement('button');
    viewReportBtn.id = 'viewReportBtn';
    viewReportBtn.textContent = '📊 View Report Card';
    ui.appendChild(viewReportBtn);

    // HUD (top left)
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.innerHTML = `
      <div id="score">$0</div>
      <div id="orderInfo">No active ticket</div>
      <div id="timeLeft">--</div>
    `;
    ui.appendChild(hud);

    // Chef messages (top right)
    const chefMessages = document.createElement('div');
    chefMessages.id = 'chefMessages';
    chefMessages.innerHTML = `
      <div class="chef-message-content">
        <img src="https://rosebud.ai/assets/Gemini_Generated_Image_9hs1379hs1379hs1.png?obts" alt="Head Chef" class="chef-avatar">
        <div class="chef-content">
          <h3>
            <span>🔥 EXECUTIVE CHEF 🔥</span>
            <span id="aiStatus"></span>
          </h3>
          <div id="chefText">Welcome to my kitchen!</div>
        </div>
      </div>
    `;
    ui.appendChild(chefMessages);

    // Banned list (bottom left)
    const bannedList = document.createElement('div');
    bannedList.id = 'bannedList';
    bannedList.innerHTML = `
      <div id="bannedItems">None yet...</div>
    `;
    ui.appendChild(bannedList);

    // Instructions (bottom right)
    const instructions = document.createElement('div');
    instructions.id = 'instructions';
    instructions.innerHTML = `
      <strong>CONTROLS:</strong><br>
      WASD - Move<br>
      E - Interact<br>
      R - Drop item<br>
      ESC - Pause<br><br>
      <strong>HOW TO PLAY:</strong><br>
      1. Pick up ingredients<br>
      2. Process at stations<br>
      3. Deliver to PLATE<br>
      4. Adapt to Chef's rules!
      <div id="volumeControl">
        <strong>🔊 MUSIC:</strong><br>
        <input type="range" id="volumeSlider" min="0" max="100" value="50">
      </div>
    `;
    ui.appendChild(instructions);

    // Holding indicator (center)
    const holding = document.createElement('div');
    holding.id = 'holding';
    holding.style.display = 'none';
    holding.textContent = 'Holding: Nothing';
    ui.appendChild(holding);

    // Quest Tracker (kitchen ticket style)
    const questTracker = document.createElement('div');
    questTracker.id = 'questTracker';
    questTracker.innerHTML = `
      <h3>🍴 TABLE ORDER</h3>
      <div id="mainQuest" class="quest-section">
        <div class="quest-title">📝 ITEMS</div>
        <div id="recipeChecklist"></div>
      </div>
      <div id="sideQuest" class="quest-section" style="display: none;">
        <div class="quest-title quest-alert">🚨 URGENT</div>
        <div id="emergencyTask"></div>
      </div>
    `;
    ui.appendChild(questTracker);
    
    // Chef Escalation Warning Meter
    const escalationMeter = document.createElement('div');
    escalationMeter.id = 'escalationMeter';
    escalationMeter.innerHTML = `
      <div class="meter-label">⚠️ CHEF'S PATIENCE ⚠️</div>
      <div class="meter-container">
        <div class="meter-fill" id="escalationFill"></div>
      </div>
      <div class="meter-time" id="escalationTime">--</div>
    `;
    ui.appendChild(escalationMeter);
  }

  updateScore(score) {
    this.score = score;
    document.getElementById('score').textContent = `$${score}`;
  }

  updateOrderInfo(orderSystem) {
    const order = orderSystem.getCurrentOrder();
    const orderInfoDiv = document.getElementById('orderInfo');
    const checklistDiv = document.getElementById('recipeChecklist');
    
    if (!order) {
      orderInfoDiv.textContent = 'No active ticket';
      checklistDiv.innerHTML = '<i>Waiting for next ticket...</i>';
      return;
    }

    const progress = orderSystem.getProgress();
    const recipeName = order.recipe.name;
    orderInfoDiv.innerHTML = `
      ${recipeName}<br>
      <span style="font-size: 12px;">Ready: ${progress.current}/${progress.total}</span>
    `;

    // Update Checklist in Quest Tracker
    let checklistHtml = '';
    order.requiredIngredients.forEach(ingId => {
      const requiredState = order.requiredStates[ingId] || 'raw';
      const key = `${ingId}_${requiredState}`;
      const isCompleted = order.progress.has(key);
      const displayName = CONFIG.INGREDIENTS[ingId].name;
      const stateName = requiredState === 'raw' ? '' : ` (${requiredState})`;
      
      checklistHtml += `
        <div class="quest-item ${isCompleted ? 'completed' : ''}">
          <span class="quest-check"></span>
          <span>× 1 ${displayName}${stateName}</span>
        </div>
      `;
    });
    checklistDiv.innerHTML = checklistHtml;
  }

  updateDisasterObjective(activeDisaster, timeRemaining) {
    const sideQuest = document.getElementById('sideQuest');
    const emergencyTask = document.getElementById('emergencyTask');

    if (activeDisaster) {
      sideQuest.style.display = 'block';
      emergencyTask.innerHTML = `
        <div class="quest-item">
          <span class="quest-check"></span>
          <span>${activeDisaster.config.name} (${Math.ceil(timeRemaining)}s)</span>
        </div>
        <div class="quest-item" style="font-size: 11px; margin-top: 5px; color: #ff6b6b;">
          → Need: ${activeDisaster.requiredItem.replace('_', ' ')}
        </div>
      `;
    } else {
      sideQuest.style.display = 'none';
    }
  }

  updateTimer(orderSystem) {
    const timeLeft = orderSystem.getTimeRemaining();
    const timePercent = orderSystem.getTimePercent();
    const timeDiv = document.getElementById('timeLeft');
    
    if (timeLeft <= 0) {
      timeDiv.textContent = 'TICKET EXPIRED!';
      timeDiv.style.color = '#ff0000';
    } else {
      timeDiv.textContent = `${Math.ceil(timeLeft)}s`;
      
      // Color based on time remaining
      if (timePercent < 0.3) {
        timeDiv.style.color = '#ff0000';
      } else if (timePercent < 0.6) {
        timeDiv.style.color = '#ffa500';
      } else {
        timeDiv.style.color = '#ffffff';
      }
    }
  }

  updateChefMessage(message) {
    const chefTextDiv = document.getElementById('chefText');
    chefTextDiv.innerHTML = message;
    
    // Pulse animation
    const chefDiv = document.getElementById('chefMessages');
    chefDiv.classList.remove('pulse');
    void chefDiv.offsetWidth; // Trigger reflow
    chefDiv.classList.add('pulse');
  }

  updateBannedList(bannedItems) {
    const bannedDiv = document.getElementById('bannedItems');
    
    const allBanned = [
      ...bannedItems.ingredients.map(name => `❌ ${name}`),
      ...bannedItems.tools.map(name => `🔧 ${name}`)
    ];
    
    if (allBanned.length === 0) {
      bannedDiv.innerHTML = 'None yet...';
    } else {
      bannedDiv.innerHTML = allBanned.map(item => 
        `<div class="banned-item">${item}</div>`
      ).join('');
    }
  }

  updateHolding(ingredient) {
    const holdingDiv = document.getElementById('holding');
    
    if (!ingredient) {
      holdingDiv.style.display = 'none';
      return;
    }
    
    holdingDiv.style.display = 'block';
    
    // Check if it's an emergency item
    if (ingredient.ingredientId === 'EMERGENCY') {
      holdingDiv.textContent = `Holding: ${ingredient.state.toUpperCase()}`;
      holdingDiv.style.background = 'rgba(255, 0, 0, 0.9)';
      holdingDiv.style.borderColor = '#ff0000';
    } else {
      const ingredientData = CONFIG.INGREDIENTS[ingredient.ingredientId];
      const stateName = ingredient.state.toUpperCase();
      holdingDiv.textContent = `Holding: ${stateName} ${ingredientData.name}`;
      holdingDiv.style.background = 'rgba(78, 205, 196, 0.9)';
      holdingDiv.style.borderColor = '#4ecdc4';
    }
  }

  showDisasterAlert(disasterType, config) {
    // Create disaster alert overlay
    const alert = document.createElement('div');
    alert.id = 'disasterAlert';
    alert.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(255, 0, 0, 0.95) 0%, rgba(200, 0, 0, 0.95) 100%);
      border: 4px solid #ff0000;
      border-radius: 15px;
      padding: 30px 40px;
      z-index: 100;
      pointer-events: auto;
      animation: disasterShake 0.5s ease-in-out;
      text-align: center;
      box-shadow: 0 0 40px rgba(255, 0, 0, 0.8);
    `;
    
    alert.innerHTML = `
      <style>
        @keyframes disasterShake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(-5deg); }
          75% { transform: translate(-50%, -50%) rotate(5deg); }
        }
        @keyframes disasterPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>
      <div style="font-size: 48px; margin-bottom: 15px;">🚨</div>
      <h2 style="margin: 0 0 15px 0; font-size: 32px; color: #fff; text-transform: uppercase;">
        ${config.name}
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 18px; color: #ffff00; font-weight: bold;">
        ${config.description}
      </p>
      <p style="margin: 0; font-size: 16px; color: #fff;">
        You have <strong>${config.timeLimit} seconds</strong> to respond!
      </p>
    `;
    
    document.getElementById('ui').appendChild(alert);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (alert && alert.parentNode) {
        alert.style.animation = 'fadeOut 0.3s ease-in-out';
        setTimeout(() => alert.remove(), 300);
      }
    }, 4000);
  }

  updateDisasterTimer(timeRemaining, disasterType) {
    let timerDiv = document.getElementById('disasterTimer');
    
    if (!timerDiv) {
      timerDiv = document.createElement('div');
      timerDiv.id = 'disasterTimer';
      timerDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        border: 3px solid #ff0000;
        border-radius: 10px;
        padding: 15px 30px;
        font-size: 24px;
        font-weight: bold;
        color: white;
        pointer-events: none;
        animation: disasterPulse 1s ease-in-out infinite;
        text-align: center;
        z-index: 50;
      `;
      document.getElementById('ui').appendChild(timerDiv);
    }
    
    const icon = this.getDisasterIcon(disasterType);
    timerDiv.innerHTML = `
      ${icon} DISASTER: ${Math.ceil(timeRemaining)}s
    `;
    
    // Color changes as time runs out
    if (timeRemaining < 5) {
      timerDiv.style.background = 'rgba(255, 0, 0, 1)';
      timerDiv.style.fontSize = '28px';
    } else if (timeRemaining < 10) {
      timerDiv.style.background = 'rgba(255, 50, 0, 0.95)';
    }
  }

  getDisasterIcon(disasterType) {
    const icons = {
      'FIRE': '🔥',
      'POWER_OUTAGE': '⚡',
      'GAS_LEAK': '☠️',
      'FLOOD': '💧'
    };
    return icons[disasterType] || '🚨';
  }

  hideDisasterTimer() {
    const timerDiv = document.getElementById('disasterTimer');
    if (timerDiv) {
      timerDiv.remove();
    }
  }

  showDisasterResolved(success, penalty) {
    const message = success 
      ? '✅ DISASTER RESOLVED!'
      : `❌ DISASTER FAILED! -${penalty} points`;
    
    const color = success ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)';
    
    this.showMessage(message, 2000);
    
    // Flash the holding div with the result
    const holdingDiv = document.getElementById('holding');
    holdingDiv.style.background = color;
    holdingDiv.style.display = 'block';
    holdingDiv.textContent = message;
    
    setTimeout(() => {
      holdingDiv.style.background = 'rgba(78, 205, 196, 0.9)';
    }, 2000);
  }

  showMessage(message, duration = 2000) {
    const holdingDiv = document.getElementById('holding');
    const originalContent = holdingDiv.textContent;
    const originalDisplay = holdingDiv.style.display;
    
    holdingDiv.style.display = 'block';
    holdingDiv.textContent = message;
    holdingDiv.style.background = 'rgba(255, 107, 107, 0.9)';
    
    setTimeout(() => {
      holdingDiv.textContent = originalContent;
      holdingDiv.style.display = originalDisplay;
      holdingDiv.style.background = 'rgba(78, 205, 196, 0.9)';
    }, duration);
  }

  showSuccess(score) {
    this.showMessage(`✓ ORDER UP! +$${score} tips!`, 2000);
  }

  showFailure(reason) {
    this.showMessage(`✗ TICKET FAILED: ${reason}`, 2500);
  }

  setAIThinking(isThinking) {
    const aiStatus = document.getElementById('aiStatus');
    if (isThinking) {
      aiStatus.textContent = '🤖 AI';
      aiStatus.classList.add('ai-thinking');
    } else {
      aiStatus.textContent = '';
      aiStatus.classList.remove('ai-thinking');
    }
  }

  showViewReportButton() {
    const btn = document.getElementById('viewReportBtn');
    if (btn) {
      btn.classList.add('visible');
    }
  }

  hideViewReportButton() {
    const btn = document.getElementById('viewReportBtn');
    if (btn) {
      btn.classList.remove('visible');
    }
  }
  
  updateEscalationMeter(chefAI) {
    const fill = document.getElementById('escalationFill');
    const timeDiv = document.getElementById('escalationTime');
    const meter = document.getElementById('escalationMeter');
    
    if (!chefAI) return;
    
    const timeRemaining = chefAI.getTimeUntilEscalation();
    const progress = chefAI.getEscalationProgress();
    
    // Update fill bar
    fill.style.width = `${progress * 100}%`;
    
    // Update time display
    timeDiv.textContent = `${Math.ceil(timeRemaining)}s`;
    
    // Color changes based on urgency
    if (progress < 0.5) {
      fill.style.background = 'linear-gradient(90deg, #4ecdc4, #45b7aa)';
      meter.classList.remove('warning', 'danger');
    } else if (progress < 0.8) {
      fill.style.background = 'linear-gradient(90deg, #ffa500, #ff8c00)';
      meter.classList.add('warning');
      meter.classList.remove('danger');
    } else {
      fill.style.background = 'linear-gradient(90deg, #ff4444, #cc0000)';
      meter.classList.remove('warning');
      meter.classList.add('danger');
    }
  }
  
  showChefWarning() {
    // Create pulsing warning overlay
    const warning = document.createElement('div');
    warning.id = 'chefWarningAlert';
    warning.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(255, 165, 0, 0.95) 0%, rgba(255, 140, 0, 0.95) 100%);
      border: 4px solid #ffa500;
      border-radius: 15px;
      padding: 25px 40px;
      z-index: 150;
      pointer-events: none;
      animation: warningPulse 0.5s ease-in-out 3;
      text-align: center;
      box-shadow: 0 0 40px rgba(255, 165, 0, 0.8);
    `;
    
    warning.innerHTML = `
      <style>
        @keyframes warningPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.9; }
        }
      </style>
      <div style="font-size: 42px; margin-bottom: 10px;">⚠️</div>
      <h2 style="margin: 0 0 10px 0; font-size: 28px; color: #fff; text-transform: uppercase;">
        CHEF IS GETTING IMPATIENT!
      </h2>
      <p style="margin: 0; font-size: 16px; color: #fff; font-weight: bold;">
        New rule incoming in <span style="color: #ffff00;">5 seconds</span>!
      </p>
    `;
    
    document.getElementById('ui').appendChild(warning);
    
    // Remove after animation completes
    setTimeout(() => {
      if (warning && warning.parentNode) {
        warning.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => warning.remove(), 500);
      }
    }, 1500);
  }
}
