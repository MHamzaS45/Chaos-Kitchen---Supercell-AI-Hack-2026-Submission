// Title Screen and Menu System
export class TitleScreen {
  constructor(onStart) {
    this.onStart = onStart;
    this.visible = false;
  }

  show() {
    this.visible = true;
    
    const overlay = document.createElement('div');
    overlay.id = 'titleScreen';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #2d1b00 0%, #1a0f00 50%, #000000 100%);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.5s ease-in-out;
      font-family: 'Roboto', sans-serif;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes titlePulse {
          0%, 100% { transform: scale(1); text-shadow: 0 0 30px rgba(212, 175, 55, 0.6); }
          50% { transform: scale(1.03); text-shadow: 0 0 50px rgba(212, 175, 55, 0.9); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes neonFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .menu-button {
          background: linear-gradient(135deg, #d4af37 0%, #b8941e 100%);
          border: 4px solid #ffd700;
          color: #000;
          padding: 20px 60px;
          font-size: 28px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Bebas Neue', sans-serif;
          transition: all 0.3s;
          margin: 15px;
          text-transform: uppercase;
          letter-spacing: 3px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.5);
        }
        
        .menu-button:hover {
          transform: scale(1.05) translateY(-3px);
          box-shadow: 0 10px 40px rgba(212, 175, 55, 0.8);
          border-color: #fff;
          background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
        }
        
        .menu-button:active {
          transform: scale(0.98);
        }
        
        .menu-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .menu-button:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .difficulty-selector {
          display: flex;
          gap: 15px;
          margin: 20px 0;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .difficulty-btn {
          background: rgba(0, 0, 0, 0.5);
          border: 3px solid rgba(139, 69, 19, 0.6);
          color: #d4af37;
          padding: 15px 25px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Bebas Neue', sans-serif;
          transition: all 0.3s;
          letter-spacing: 1px;
        }
        
        .difficulty-btn:hover {
          background: rgba(139, 69, 19, 0.3);
          border-color: #d4af37;
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }
        
        .difficulty-btn.selected {
          background: linear-gradient(135deg, #8b4513 0%, #654321 100%);
          border-color: #d4af37;
          color: #ffd700;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        }
        
        .feature-list {
          margin: 30px 0;
          text-align: center;
        }
        
        .feature-item {
          color: #d4af37;
          font-size: 16px;
          margin: 10px 0;
          animation: float 3s ease-in-out infinite;
          font-weight: 500;
        }
        
        .feature-item:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .feature-item:nth-child(3) {
          animation-delay: 1s;
        }
        
        .restaurant-sign {
          background: #2a2a2a;
          border: 5px solid #8b4513;
          padding: 20px 40px;
          border-radius: 10px;
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.5);
          margin-bottom: 20px;
        }
      </style>
      
      <div style="text-align: center; max-width: 900px; padding: 20px;">
        <!-- Title -->
        <div class="restaurant-sign">
          <h1 style="
            font-size: 64px;
            color: #ffd700;
            margin: 0;
            font-weight: bold;
            font-family: 'Bebas Neue', sans-serif;
            animation: titlePulse 2s ease-in-out infinite;
            text-shadow: 0 0 30px rgba(212, 175, 55, 0.6);
            letter-spacing: 4px;
          ">
            🔥 CHEF'S CHAOS KITCHEN 🔥
          </h1>
          <p style="
            font-size: 20px;
            color: #d4af37;
            margin: 10px 0 0 0;
            font-family: 'Permanent Marker', cursive;
            letter-spacing: 2px;
          ">
            ~ Adapt or Burn Out ~
          </p>
        </div>
        
        <!-- Features -->
        <div class="feature-list">
          <div class="feature-item">👨‍🍳 Executive Chef demands perfection</div>
          <div class="feature-item">🚫 Menu items get 86'd constantly</div>
          <div class="feature-item">📊 Performance review at end of shift</div>
        </div>
        
        <!-- Difficulty Selection -->
        <div style="margin: 40px 0;">
          <p style="color: #d4af37; font-size: 20px; margin-bottom: 15px; font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px;">SELECT YOUR SHIFT LENGTH:</p>
          <div class="difficulty-selector">
            <button class="difficulty-btn" data-difficulty="5">
              <div style="font-size: 20px; margin-bottom: 5px;">🍽️ BRUNCH</div>
              <div style="font-size: 12px; opacity: 0.8;">5 Tickets</div>
            </button>
            <button class="difficulty-btn selected" data-difficulty="10">
              <div style="font-size: 20px; margin-bottom: 5px;">🍽️🍽️ LUNCH</div>
              <div style="font-size: 12px; opacity: 0.8;">10 Tickets</div>
            </button>
            <button class="difficulty-btn" data-difficulty="15">
              <div style="font-size: 20px; margin-bottom: 5px;">🍽️🍽️🍽️ DINNER</div>
              <div style="font-size: 12px; opacity: 0.8;">15 Tickets</div>
            </button>
            <button class="difficulty-btn" data-difficulty="20">
              <div style="font-size: 20px; margin-bottom: 5px;">🍽️🍽️🍽️🍽️ RUSH</div>
              <div style="font-size: 12px; opacity: 0.8;">20 Tickets</div>
            </button>
          </div>
        </div>
        
        <!-- Start Button -->
        <button id="startGameBtn" class="menu-button">
          <span style="position: relative; z-index: 1;">🔪 CLOCK IN 🔪</span>
        </button>
        
        <!-- Instructions -->
        <div style="
          margin-top: 50px;
          padding: 20px 30px;
          background: rgba(0, 0, 0, 0.6);
          border: 3px solid #8b4513;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        ">
          <h3 style="color: #d4af37; margin: 0 0 15px 0; font-size: 22px; font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; border-bottom: 2px solid #8b4513; padding-bottom: 10px;">KITCHEN BASICS</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; text-align: left; color: #ddd; font-size: 14px; line-height: 1.8;">
            <div>
              <strong style="color: #d4af37; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1px;">CONTROLS:</strong><br>
              • WASD - Move around<br>
              • E - Interact / Pick up<br>
              • R - Drop item
            </div>
            <div>
              <strong style="color: #d4af37; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1px;">THE FLOW:</strong><br>
              1. Grab ingredients<br>
              2. Prep at stations<br>
              3. Plate & serve<br>
              4. Adapt to Chef's rules!
            </div>
          </div>
        </div>
        
        <p style="
          margin-top: 30px;
          color: #8b4513;
          font-size: 11px;
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 1px;
        ">
          AI-Powered Chef • Built with Three.js
        </p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Setup difficulty selection
    let selectedDifficulty = 10; // Default
    const difficultyBtns = overlay.querySelectorAll('.difficulty-btn');
    difficultyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDifficulty = parseInt(btn.dataset.difficulty);
      });
    });

    // Setup start button
    const startBtn = overlay.querySelector('#startGameBtn');
    startBtn.addEventListener('click', () => {
      this.hide();
      if (this.onStart) {
        this.onStart(selectedDifficulty);
      }
    });
  }

  hide() {
    const titleScreen = document.getElementById('titleScreen');
    if (titleScreen) {
      titleScreen.style.animation = 'fadeOut 0.3s ease-in-out';
      setTimeout(() => titleScreen.remove(), 300);
    }
    this.visible = false;
  }
}
