// Main game loop and initialization
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { ChefAI } from './ChefAI.js';
import { AIChefAgent } from './AIChefAgent.js';
import { OrderSystem } from './OrderSystem.js';
import { Kitchen } from './Kitchen.js';
import { Player } from './Player.js';
import { UI } from './UI.js';
import { ReportCard } from './ReportCard.js';
import { TitleScreen } from './TitleScreen.js';
import { GameOverScreen } from './GameOverScreen.js';
import { DisasterSystem } from './DisasterSystem.js';
import { AudioManager } from './AudioManager.js';

class Game {
  constructor() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    
    // Game systems (create but don't initialize yet)
    this.chefAI = null;
    this.aiChefAgent = null;
    this.orderSystem = null;
    this.kitchen = null;
    this.player = null;
    this.ui = null;
    this.reportCard = null;
    this.titleScreen = null;
    this.gameOverScreen = null;
    this.audioManager = new AudioManager();
    
    // Game state
    this.score = 0;
    this.ordersCompleted = 0;
    this.targetOrders = 10;
    this.gameActive = false;
    this.gameStarted = false;
    
    // Interaction
    this.nearestObject = null;
    
    // Game loop
    this.clock = new THREE.Clock();
    this.animate();
    
    // Window resize
    window.addEventListener('resize', () => this.onResize());
    
    // AI thinking indicator
    window.addEventListener('aiThinking', (e) => {
      if (this.ui) {
        this.ui.setAIThinking(e.detail.isThinking);
      }
    });
    
    // Chef warning system
    window.addEventListener('chefWarning', (e) => {
      if (this.ui) {
        this.ui.showChefWarning();
      }
    });

    // Load background music
    this.loadAudio();
    
    // Show title screen
    this.showTitleScreen();
  }

  async loadAudio() {
    // Use the correct asset URL
    const musicUrl = 'https://rosebud.ai/assets/Chaos Kitchen - Main OST.mp3?U1KF';
    await this.audioManager.loadMusic(musicUrl);
  }

  showTitleScreen() {
    this.titleScreen = new TitleScreen((difficulty) => this.startGame(difficulty));
    this.titleScreen.show();
    
    // Stop music on title screen
    if (this.audioManager.isCurrentlyPlaying()) {
      this.audioManager.fadeOut(1000);
    }
  }

  startGame(targetOrders = 10) {
    // Initialize game systems
    this.targetOrders = targetOrders;
    this.score = 0;
    this.ordersCompleted = 0;
    this.gameActive = true;
    this.gameStarted = true;
    
    // Create game systems
    this.chefAI = new ChefAI(() => this.onRuleChange());
    this.aiChefAgent = new AIChefAgent(this.chefAI, (message) => this.onAIMessage(message));
    this.chefAI.setAIAgent(this.aiChefAgent);
    this.orderSystem = new OrderSystem(this.chefAI);
    this.kitchen = new Kitchen(this.scene, this.chefAI);
    this.player = new Player(this.scene);
    this.ui = new UI();
    this.reportCard = new ReportCard();
    this.gameOverScreen = new GameOverScreen(
      () => this.restartGame(),
      () => this.showReportCard()
    );
    this.disasterSystem = new DisasterSystem(
      this.scene,
      this.kitchen,
      this.chefAI,
      (type, config) => this.onDisasterStart(type, config),
      (success, penalty, type) => this.onDisasterEnd(success, penalty, type)
    );
    
    // Player holding emergency item
    this.heldEmergencyItem = null;
    
    // Setup interaction
    this.setupInteraction();
    
    // View Report button
    setTimeout(() => {
      const viewReportBtn = document.getElementById('viewReportBtn');
      if (viewReportBtn) {
        viewReportBtn.addEventListener('click', () => {
          if (this.ordersCompleted > 0) {
            this.showReportCard();
          }
        });
      }
      
      // Volume slider
      const volumeSlider = document.getElementById('volumeSlider');
      if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
          const volume = e.target.value / 100;
          this.audioManager.setVolume(volume);
        });
      }
    }, 100);
    
    // Start first order
    this.startNewOrder();
    
    // Start background music with fade in
    this.audioManager.fadeIn(2000);
  }

  restartGame() {
    // Clean up existing game
    if (this.kitchen) {
      // Remove kitchen objects from scene
      this.scene.children.forEach(child => {
        if (child !== this.camera) {
          this.scene.remove(child);
        }
      });
    }
    
    // Remove UI
    const ui = document.getElementById('ui');
    if (ui) ui.remove();
    
    // Reset scene
    this.setupScene();
    this.setupLights();
    
    // Start new game with same difficulty
    this.startGame(this.targetOrders);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 15, 35);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(
      CONFIG.CAMERA.POSITION.x,
      CONFIG.CAMERA.POSITION.y,
      CONFIG.CAMERA.POSITION.z
    );
    this.camera.lookAt(
      CONFIG.CAMERA.LOOK_AT.x,
      CONFIG.CAMERA.LOOK_AT.y,
      CONFIG.CAMERA.LOOK_AT.z
    );
  }

  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Main directional light
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(5, 12, 8);
    directional.castShadow = true;
    directional.shadow.camera.left = -15;
    directional.shadow.camera.right = 15;
    directional.shadow.camera.top = 15;
    directional.shadow.camera.bottom = -15;
    directional.shadow.mapSize.width = 1024;
    directional.shadow.mapSize.height = 1024;
    this.scene.add(directional);

    // Point lights for kitchen atmosphere
    const light1 = new THREE.PointLight(0xfff4e0, 0.8, 20);
    light1.position.set(-5, 6, -4);
    this.scene.add(light1);

    const light2 = new THREE.PointLight(0xfff4e0, 0.8, 20);
    light2.position.set(5, 6, -4);
    this.scene.add(light2);

    // Rim light/Fill light
    const fillLight = new THREE.PointLight(0x4ecdc4, 0.4, 15);
    fillLight.position.set(0, 4, 4);
    this.scene.add(fillLight);
  }

  setupInteraction() {
    window.addEventListener('keydown', (e) => {
      // ESC to pause/quit
      if (e.key === 'Escape' && this.gameActive) {
        this.pauseGame();
        return;
      }

      if (!this.gameActive) return;

      if (e.key.toLowerCase() === 'e') {
        this.interact();
      } else if (e.key.toLowerCase() === 'r') {
        this.dropItem();
      }
    });
  }

  pauseGame() {
    if (!this.gameActive) return;
    
    this.gameActive = false;
    
    // Pause music
    this.audioManager.pauseMusic();
    
    // Show pause menu using game over screen
    const pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'pauseMenu';
    pauseOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1800;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Orbitron', sans-serif;
      animation: fadeIn 0.3s ease-in-out;
    `;

    pauseOverlay.innerHTML = `
      <div style="text-align: center; color: white;">
        <h1 style="font-size: 48px; color: #4ecdc4; margin-bottom: 30px;">⏸️ PAUSED</h1>
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <button id="resumeBtn" style="
            background: linear-gradient(135deg, #4ecdc4 0%, #3ab0a8 100%);
            border: none;
            color: white;
            padding: 15px 60px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
          ">RESUME</button>
          <button id="quitPauseBtn" style="
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            border: none;
            color: white;
            padding: 15px 60px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
          ">QUIT TO MENU</button>
        </div>
      </div>
    `;

    document.body.appendChild(pauseOverlay);

    const resumeBtn = pauseOverlay.querySelector('#resumeBtn');
    resumeBtn.addEventListener('click', () => {
      pauseOverlay.remove();
      this.gameActive = true;
      // Resume music
      this.audioManager.playMusic();
    });

    const quitBtn = pauseOverlay.querySelector('#quitPauseBtn');
    quitBtn.addEventListener('click', () => {
      pauseOverlay.remove();
      this.audioManager.stopMusic();
      this.showGameOverScreen('quit');
    });

    // ESC to resume
    const escListener = (e) => {
      if (e.key === 'Escape') {
        pauseOverlay.remove();
        this.gameActive = true;
        // Resume music
        this.audioManager.playMusic();
        window.removeEventListener('keydown', escListener);
      }
    };
    window.addEventListener('keydown', escListener);
  }

  interact() {
    // Check for emergency items first
    const playerPos = this.player.getPosition();
    const nearestEmergency = this.disasterSystem.findNearestEmergencyItem(playerPos);
    
    if (nearestEmergency && !this.heldEmergencyItem) {
      // Pick up emergency item
      this.heldEmergencyItem = nearestEmergency.type;
      this.disasterSystem.pickupEmergencyItem(nearestEmergency.type);
      this.audioManager.playPickupItem();
      this.ui.updateHolding({ 
        ingredientId: 'EMERGENCY', 
        state: nearestEmergency.type.replace('_', ' ')
      });
      return;
    }
    
    // Use emergency item if holding one
    if (this.heldEmergencyItem) {
      const playerRotation = this.player.mesh ? this.player.mesh.rotation.y : 0;
      const used = this.disasterSystem.useEmergencyItem(
        this.heldEmergencyItem, 
        playerPos, 
        playerRotation
      );
      if (used) {
        // Play appropriate sound effect based on item type
        this.playEmergencyItemSound(this.heldEmergencyItem);
        
        this.heldEmergencyItem = null;
        this.ui.updateHolding(null);
      } else {
        this.ui.showMessage('Get closer to the disaster!', 1500);
      }
      return;
    }
    
    if (!this.nearestObject) return;

    if (this.nearestObject.type === 'ingredient') {
      // Pick up ingredient
      if (!this.player.hasIngredient()) {
        const spawn = this.nearestObject.data;
        const ingredientId = this.kitchen.spawnIngredient(
          spawn.ingredientId,
          spawn.position
        );
        
        const ingredient = this.kitchen.getIngredient(ingredientId);
        this.player.pickupIngredient(
          spawn.ingredientId,
          ingredient.mesh,
          'raw'
        );
        
        // Track ingredient usage for AI
        this.aiChefAgent.trackIngredientUsage(spawn.ingredientId);
      }
    } else if (this.nearestObject.type === 'station') {
      // Use station
      const station = this.nearestObject.data;
      
      // Track tool usage for AI
      this.aiChefAgent.trackToolUsage(station.id);
      
      if (station.id === 'PLATE') {
        // Deliver to plate
        this.deliverIngredient();
      } else {
        // Process ingredient
        this.processIngredient(station);
      }
    }
  }

  processIngredient(station) {
    if (!this.player.hasIngredient()) return;

    const held = this.player.getHeldIngredient();
    const newState = this.kitchen.processIngredient(
      held.ingredientId,
      held.state,
      station.id
    );

    if (newState !== held.state) {
      this.player.processHeldIngredient(newState);
      this.ui.showMessage(`${newState.toUpperCase()}!`, 1000);
    } else {
      this.ui.showMessage('Cannot process this way!', 1500);
    }
  }

  deliverIngredient() {
    if (!this.player.hasIngredient()) return;

    const held = this.player.getHeldIngredient();
    const added = this.orderSystem.addIngredient(held.ingredientId, held.state);

    if (added) {
      // Remove the ingredient
      const ingredientData = this.player.dropIngredient();
      if (ingredientData) {
        // Find and remove the mesh
        for (const [id, ing] of this.kitchen.activeIngredients) {
          if (ing.ingredientId === ingredientData.ingredientId) {
            this.kitchen.removeIngredient(id);
            break;
          }
        }
      }

      // Check if order is complete
      if (this.orderSystem.isOrderComplete()) {
        this.completeOrder();
      }
    } else {
      // Track mistake for AI
      this.aiChefAgent.trackMistake('wrong_ingredient_or_state');
      this.ui.showMessage('Wrong ingredient or state!', 1500);
    }
  }

  dropItem() {
    if (!this.player.hasIngredient()) return;

    const held = this.player.dropIngredient();
    if (held) {
      // Find and remove the mesh
      for (const [id, ing] of this.kitchen.activeIngredients) {
        if (ing.ingredientId === held.ingredientId) {
          this.kitchen.removeIngredient(id);
          break;
        }
      }
    }
  }

  completeOrder() {
    const result = this.orderSystem.completeOrder();
    
    if (result) {
      this.score += result.score;
      this.ordersCompleted++;
      
      this.ui.updateScore(this.score);
      this.ui.showSuccess(result.score);
      
      // Show report button after first order
      if (this.ordersCompleted === 1) {
        this.ui.showViewReportButton();
      }
      
      // Notify chef AI
      this.chefAI.onOrderCompleted(
        result.timeRemaining,
        result.totalTime,
        result.mistakes
      );
      
      // Check win condition
      if (this.ordersCompleted >= this.targetOrders) {
        this.winGame();
      } else {
        // Start new order after delay
        setTimeout(() => {
          if (this.gameActive) {
            this.startNewOrder();
          }
        }, 2000);
      }
    }
  }

  startNewOrder() {
    this.orderSystem.generateOrder();
    this.ui.updateOrderInfo(this.orderSystem);
    this.ui.updateChefMessage(this.chefAI.getMessage());
  }

  onRuleChange() {
    this.kitchen.updateBannedVisuals();
    this.ui.updateBannedList(this.chefAI.getBannedItems());
    this.ui.updateChefMessage(this.chefAI.getMessage());
  }

  onAIMessage(message) {
    this.chefAI.setAIMessage(message);
    this.ui.updateChefMessage(message);
  }

  async winGame() {
    this.gameActive = false;
    
    // Fade out music
    this.audioManager.fadeOut(2000);
    
    // Show game over screen first
    this.showGameOverScreen('completed');
  }

  showGameOverScreen(reason) {
    // Stop music if not already stopped
    if (this.audioManager.isCurrentlyPlaying()) {
      this.audioManager.fadeOut(1000);
    }
    
    const stats = {
      score: this.score,
      ordersCompleted: this.ordersCompleted,
      targetOrders: this.targetOrders,
      perfectOrders: this.chefAI.perfectOrders,
      fastCompletions: this.chefAI.fastCompletions,
      timeouts: this.chefAI.timeouts,
      bannedCount: this.chefAI.bannedIngredients.size + this.chefAI.bannedTools.size,
      escalationLevel: this.chefAI.escalationLevel
    };

    this.gameOverScreen.show(reason, stats);
  }

  async showReportCard() {
    const gameStats = {
      score: this.score,
      targetOrders: this.targetOrders,
      chefAI: this.chefAI,
      aiChefAgent: this.aiChefAgent
    };
    
    await this.reportCard.show(gameStats, this.aiChefAgent);
  }

  update(deltaTime) {
    if (!this.gameActive || !this.gameStarted) return;

    // Update systems
    if (this.chefAI) this.chefAI.update(deltaTime);
    if (this.player) this.player.update(deltaTime);
    if (this.disasterSystem) this.disasterSystem.update(deltaTime);
    
    // Update order timer
    const orderResult = this.orderSystem.update(deltaTime);
    if (orderResult === 'timeout') {
      this.ui.showFailure('Out of time!');
      this.chefAI.onOrderTimeout();
      this.orderSystem.completeOrder(); // Clear order
      
      setTimeout(() => {
        if (this.gameActive) {
          this.startNewOrder();
        }
      }, 2000);
    }
    
    // Find nearest interactable
    const playerPos = this.player.getPosition();
    const newNearest = this.kitchen.findNearestInteractable(playerPos);
    
    // Update highlights
    if (this.nearestObject !== newNearest) {
      if (this.nearestObject) {
        this.kitchen.highlightObject(this.nearestObject, false);
      }
      if (newNearest) {
        this.kitchen.highlightObject(newNearest, true);
      }
      this.nearestObject = newNearest;
    }
    
    // Update UI
    this.ui.updateOrderInfo(this.orderSystem);
    this.ui.updateTimer(this.orderSystem);
    this.ui.updateHolding(this.heldEmergencyItem ? { 
      ingredientId: 'EMERGENCY', 
      state: this.heldEmergencyItem.replace('_', ' ')
    } : this.player.getHeldIngredient());
    
    // Update escalation meter
    this.ui.updateEscalationMeter(this.chefAI);
    
    // Update disaster UI
    const activeDisaster = this.disasterSystem.getActiveDisaster();
    if (activeDisaster) {
      this.ui.updateDisasterTimer(
        this.disasterSystem.getTimeRemaining(),
        activeDisaster.type
      );
    }
    this.ui.updateDisasterObjective(activeDisaster, this.disasterSystem.getTimeRemaining());
  }

  playEmergencyItemSound(itemType) {
    switch (itemType) {
      case 'FIRE_EXTINGUISHER':
        this.audioManager.playFireExtinguisher(2);
        break;
      case 'GENERATOR':
        this.audioManager.playGeneratorStart();
        break;
      case 'VALVE_WRENCH':
        this.audioManager.playValveWrench();
        break;
      case 'PIPE_WRENCH':
        this.audioManager.playWaterSpray(2);
        break;
    }
  }

  onDisasterStart(type, config) {
    // Show alert
    this.ui.showDisasterAlert(type, config);
    
    // Play alarm sound
    this.audioManager.playDisasterAlarm();
    
    // Play disaster-specific ambient sound
    if (type === 'FIRE') {
      this.activeDisasterSound = this.audioManager.playFireCrackle();
    } else if (type === 'GAS_LEAK') {
      this.activeDisasterSound = this.audioManager.playGasLeak();
    }
    
    // Drop any held items
    if (this.player.hasIngredient()) {
      this.dropItem();
    }
    
    // Notify Chef AI
    if (this.aiChefAgent && this.chefAI) {
      this.chefAI.setAIMessage(`🚨 <strong>${config.name}</strong><br>${config.description}`);
      this.ui.updateChefMessage(this.chefAI.getMessage());
    }
  }

  onDisasterEnd(success, penalty, type) {
    // Hide disaster timer
    this.ui.hideDisasterTimer();
    
    // Stop ambient disaster sounds
    if (this.activeDisasterSound) {
      this.activeDisasterSound.then(stopFn => stopFn());
      this.activeDisasterSound = null;
    }
    
    // Play success or failure sound
    if (success) {
      this.audioManager.playSuccess();
    } else {
      this.audioManager.playFailure();
    }
    
    // Show result
    this.ui.showDisasterResolved(success, penalty);
    
    if (!success) {
      // Apply penalty
      this.score = Math.max(0, this.score - penalty);
      this.ui.updateScore(this.score);
    }
    
    // Clear held emergency item
    this.heldEmergencyItem = null;
    
    // Notify Chef AI
    if (this.aiChefAgent && this.chefAI) {
      const message = success 
        ? 'Good work handling that disaster! Now back to cooking!'
        : `That disaster cost you ${penalty} points! Pay attention next time!`;
      this.chefAI.setAIMessage(message);
      this.ui.updateChefMessage(this.chefAI.getMessage());
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);
    
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Start the game
new Game();
