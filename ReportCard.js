// Performance Report Card System
import { CONFIG } from './config.js';

export class ReportCard {
  constructor() {
    this.visible = false;
  }

  async show(gameStats, aiChefAgent) {
    this.visible = true;
    
    // Create report card overlay
    const overlay = document.createElement('div');
    overlay.id = 'reportCardOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.5s ease-in-out;
    `;

    const card = document.createElement('div');
    card.id = 'reportCard';
    card.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 3px solid #ff6b6b;
      border-radius: 20px;
      padding: 40px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(255, 107, 107, 0.5);
      animation: slideIn 0.6s ease-out;
      color: white;
      font-family: 'Orbitron', sans-serif;
    `;

    // Build report card content
    card.innerHTML = this.buildLoadingState();
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Generate AI report
    await this.generateAIReport(card, gameStats, aiChefAgent);

    // Add animations
    this.addStyles();
  }

  buildLoadingState() {
    return `
      <div style="text-align: center;">
        <h1 style="color: #ff6b6b; margin: 0 0 30px 0; font-size: 36px;">
          🔥 PERFORMANCE EVALUATION 🔥
        </h1>
        <div style="margin: 50px 0;">
          <div class="thinking-spinner"></div>
          <p style="color: #4ecdc4; font-size: 18px; margin-top: 20px;">
            Chef is reviewing your performance...
          </p>
        </div>
      </div>
    `;
  }

  async generateAIReport(card, gameStats, aiChefAgent) {
    // Calculate statistics
    const stats = this.calculateStats(gameStats);
    
    // Generate AI sections
    const aiSections = await this.generateAISections(stats, aiChefAgent);
    
    // Build complete report
    card.innerHTML = this.buildCompleteReport(stats, aiSections);
    
    // Add close button functionality
    const closeBtn = card.querySelector('#closeReportBtn');
    if (closeBtn) {
      closeBtn.onclick = () => this.hide();
    }

    // Add restart button functionality
    const restartBtn = card.querySelector('#restartBtn');
    if (restartBtn) {
      restartBtn.onclick = () => {
        this.hide();
        window.location.reload();
      };
    }

    // Add share button functionality
    const shareBtn = card.querySelector('#shareStatsBtn');
    if (shareBtn) {
      shareBtn.onclick = () => this.shareStats(stats);
    }
  }

  shareStats(stats) {
    const shareText = `🔥 Chef's Chaos Kitchen Report Card 🔥

Overall Grade: ${stats.grades.overall.letter} (GPA ${stats.grades.overall.gpa})
Score: ${stats.finalScore}
Orders: ${stats.ordersCompleted}/${stats.ordersTarget}
Perfect Orders: ${stats.perfectOrders}

Grades:
⚡ Speed: ${stats.grades.speed.letter}
🎯 Accuracy: ${stats.grades.accuracy.letter}
🔄 Adaptability: ${stats.grades.adaptability.letter}
💪 Pressure: ${stats.grades.pressure.letter}

Can YOU do better?`;

    // Try to use native share if available
    if (navigator.share) {
      navigator.share({
        title: 'Chef\'s Chaos Kitchen Report',
        text: shareText
      }).catch(() => {
        // Fallback to clipboard
        this.copyToClipboard(shareText);
      });
    } else {
      this.copyToClipboard(shareText);
    }
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Show success message
      const btn = document.querySelector('#shareStatsBtn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ COPIED!';
        btn.style.background = 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)';
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = 'linear-gradient(135deg, #ffd700 0%, #f0c419 100%)';
        }, 2000);
      }
    }).catch(() => {
      alert('Could not copy to clipboard. Please try again.');
    });
  }

  calculateStats(gameStats) {
    const profile = gameStats.aiChefAgent.playerBehaviorProfile;
    const chef = gameStats.chefAI;
    
    return {
      // Basic stats
      finalScore: gameStats.score,
      ordersCompleted: chef.ordersCompleted,
      ordersTarget: gameStats.targetOrders,
      completionRate: ((chef.ordersCompleted / gameStats.targetOrders) * 100).toFixed(1),
      
      // Performance metrics
      perfectOrders: chef.perfectOrders,
      fastCompletions: chef.fastCompletions,
      slowCompletions: chef.slowCompletions,
      timeouts: chef.timeouts,
      
      // Efficiency
      averageSpeed: (profile.averageCompletionTime * 100).toFixed(1),
      adaptabilityScore: profile.adaptabilityScore,
      stressLevel: profile.stressLevel,
      
      // Ingredient usage
      favoriteIngredients: this.getTopIngredients(profile.favoriteIngredients, 3),
      totalIngredientUsage: Object.values(profile.favoriteIngredients).reduce((a, b) => a + b, 0),
      
      // Tool usage
      toolUsage: profile.toolUsagePatterns,
      
      // Mistakes
      totalMistakes: profile.mistakeTypes.length,
      recentMistakes: profile.mistakeTypes.slice(-5),
      
      // Rules faced
      ingredientsBanned: chef.bannedIngredients.size,
      toolsBanned: chef.bannedTools.size,
      escalationLevel: chef.escalationLevel,
      
      // Grades
      grades: this.calculateGrades(gameStats, profile, chef)
    };
  }

  getTopIngredients(ingredientMap, count) {
    return Object.entries(ingredientMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([id, uses]) => ({
        name: CONFIG.INGREDIENTS[id].name,
        uses: uses
      }));
  }

  calculateGrades(gameStats, profile, chef) {
    const grades = {};
    
    // Speed Grade (based on average completion time)
    const speedPercent = profile.averageCompletionTime * 100;
    if (speedPercent >= 70) grades.speed = { letter: 'A+', color: '#00ff00' };
    else if (speedPercent >= 50) grades.speed = { letter: 'A', color: '#4ecdc4' };
    else if (speedPercent >= 35) grades.speed = { letter: 'B', color: '#ffd700' };
    else if (speedPercent >= 20) grades.speed = { letter: 'C', color: '#ffa500' };
    else grades.speed = { letter: 'D', color: '#ff6b6b' };
    
    // Accuracy Grade (based on mistakes per order)
    const mistakesPerOrder = profile.mistakeTypes.length / Math.max(1, chef.ordersCompleted);
    if (mistakesPerOrder <= 0.5) grades.accuracy = { letter: 'A+', color: '#00ff00' };
    else if (mistakesPerOrder <= 1) grades.accuracy = { letter: 'A', color: '#4ecdc4' };
    else if (mistakesPerOrder <= 2) grades.accuracy = { letter: 'B', color: '#ffd700' };
    else if (mistakesPerOrder <= 3) grades.accuracy = { letter: 'C', color: '#ffa500' };
    else grades.accuracy = { letter: 'D', color: '#ff6b6b' };
    
    // Adaptability Grade
    const adaptScore = profile.adaptabilityScore;
    if (adaptScore >= 90) grades.adaptability = { letter: 'A+', color: '#00ff00' };
    else if (adaptScore >= 75) grades.adaptability = { letter: 'A', color: '#4ecdc4' };
    else if (adaptScore >= 60) grades.adaptability = { letter: 'B', color: '#ffd700' };
    else if (adaptScore >= 45) grades.adaptability = { letter: 'C', color: '#ffa500' };
    else grades.adaptability = { letter: 'D', color: '#ff6b6b' };
    
    // Pressure Handling Grade (inverse of stress level)
    const stressScore = 100 - profile.stressLevel;
    if (stressScore >= 80) grades.pressure = { letter: 'A+', color: '#00ff00' };
    else if (stressScore >= 65) grades.pressure = { letter: 'A', color: '#4ecdc4' };
    else if (stressScore >= 50) grades.pressure = { letter: 'B', color: '#ffd700' };
    else if (stressScore >= 35) grades.pressure = { letter: 'C', color: '#ffa500' };
    else grades.pressure = { letter: 'D', color: '#ff6b6b' };
    
    // Overall Grade (average)
    const gradeValues = { 'A+': 4.3, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0 };
    const avgGrade = (
      gradeValues[grades.speed.letter] +
      gradeValues[grades.accuracy.letter] +
      gradeValues[grades.adaptability.letter] +
      gradeValues[grades.pressure.letter]
    ) / 4;
    
    if (avgGrade >= 4.0) grades.overall = { letter: 'A+', color: '#00ff00', gpa: avgGrade.toFixed(2) };
    else if (avgGrade >= 3.5) grades.overall = { letter: 'A', color: '#4ecdc4', gpa: avgGrade.toFixed(2) };
    else if (avgGrade >= 2.5) grades.overall = { letter: 'B', color: '#ffd700', gpa: avgGrade.toFixed(2) };
    else if (avgGrade >= 1.5) grades.overall = { letter: 'C', color: '#ffa500', gpa: avgGrade.toFixed(2) };
    else grades.overall = { letter: 'D', color: '#ff6b6b', gpa: avgGrade.toFixed(2) };
    
    return grades;
  }

  async generateAISections(stats, aiChefAgent) {
    const sections = {
      overallAssessment: '',
      strengths: '',
      weaknesses: '',
      improvement: '',
      chefNotes: ''
    };

    // Don't generate if using fallback
    if (aiChefAgent.useFallback) {
      return this.getFallbackSections(stats);
    }

    try {
      // Overall Assessment
      const assessmentPrompt = `As the Head Chef, write a brief (40 words) overall assessment of this cook's session:
      - Orders completed: ${stats.ordersCompleted}/${stats.ordersTarget}
      - Final score: ${stats.finalScore}
      - Overall grade: ${stats.grades.overall.letter} (GPA: ${stats.grades.overall.gpa})
      - Perfect orders: ${stats.perfectOrders}
      - Timeouts: ${stats.timeouts}
      
      Be honest but fair. Reference their grade.`;
      
      sections.overallAssessment = await aiChefAgent.chatManager.sendUserMessage(assessmentPrompt);

      // Strengths
      const strengthsPrompt = `List 2-3 specific strengths this cook showed (30 words max):
      - Speed grade: ${stats.grades.speed.letter}
      - Accuracy grade: ${stats.grades.accuracy.letter}
      - Fast completions: ${stats.fastCompletions}
      - Perfect orders: ${stats.perfectOrders}
      - Adaptability: ${stats.adaptabilityScore}/100
      
      Be specific and encouraging.`;
      
      sections.strengths = await aiChefAgent.chatManager.sendUserMessage(strengthsPrompt);

      // Weaknesses
      const weaknessesPrompt = `List 2-3 areas where this cook needs improvement (30 words max):
      - Total mistakes: ${stats.totalMistakes}
      - Timeouts: ${stats.timeouts}
      - Stress level: ${stats.stressLevel}/100
      - Slow completions: ${stats.slowCompletions}
      
      Be constructive, not cruel.`;
      
      sections.weaknesses = await aiChefAgent.chatManager.sendUserMessage(weaknessesPrompt);

      // Improvement Tips
      const improvementPrompt = `Give 2-3 specific, actionable tips for improvement (35 words max):
      - Weakest grade: ${this.getWeakestCategory(stats.grades)}
      - Average speed: ${stats.averageSpeed}%
      - Recent mistakes: ${stats.recentMistakes.slice(0, 2).join(', ')}
      
      Be practical and helpful.`;
      
      sections.improvement = await aiChefAgent.chatManager.sendUserMessage(improvementPrompt);

      // Chef's Final Notes
      const notesPrompt = `Write a memorable closing line (15 words max) from the Chef:
      - Overall grade: ${stats.grades.overall.letter}
      - Completion rate: ${stats.completionRate}%
      
      Match the tone to their performance. End with personality.`;
      
      sections.chefNotes = await aiChefAgent.chatManager.sendUserMessage(notesPrompt);

    } catch (error) {
      console.error('AI section generation failed:', error);
      return this.getFallbackSections(stats);
    }

    return sections;
  }

  getFallbackSections(stats) {
    const grade = stats.grades.overall.letter;
    const isGood = ['A+', 'A'].includes(grade);
    const isOk = grade === 'B';
    
    return {
      overallAssessment: isGood 
        ? `Outstanding work! You completed ${stats.ordersCompleted} orders with a ${grade} grade. Your adaptability and speed were impressive under pressure.`
        : isOk
        ? `Solid performance. You finished ${stats.ordersCompleted} orders with a ${grade} grade. You showed competence but there's room for improvement.`
        : `You struggled today. ${stats.ordersCompleted} orders completed with a ${grade} grade. The kitchen demands more focus and speed.`,
      
      strengths: stats.perfectOrders > 2
        ? `Multiple perfect orders show attention to detail. ${stats.fastCompletions > 0 ? 'Good speed on several orders.' : 'Consistent accuracy.'}`
        : stats.fastCompletions > 3
        ? `Excellent speed! You're quick on your feet. Adaptability to rule changes was decent.`
        : `You persevered through ${stats.escalationLevel} escalation levels. That shows determination.`,
      
      weaknesses: stats.timeouts > 2
        ? `Too many timeouts (${stats.timeouts}). Speed is critical. ${stats.totalMistakes} mistakes suggest rushing without thinking.`
        : stats.totalMistakes > 5
        ? `${stats.totalMistakes} mistakes is too many. Focus on accuracy over speed. Read orders carefully.`
        : `Stress management needs work (${stats.stressLevel}/100). Stay calm under pressure.`,
      
      improvement: stats.grades.speed.letter === 'D'
        ? `Work on speed: plan your route, minimize backtracking. Practice ingredient preparation. Keep moving.`
        : stats.grades.accuracy.letter === 'D'
        ? `Focus on accuracy: double-check order requirements. Match ingredient states carefully. No rushing.`
        : `Build adaptability: memorize station locations, practice with fewer ingredients. Stay flexible.`,
      
      chefNotes: isGood
        ? `You've got potential. Keep that fire burning. Now get back to work!`
        : isOk
        ? `Not bad, but I expect MORE next time. Practice makes perfect.`
        : `This kitchen isn't for everyone. Come back when you're ready to COMMIT.`
    };
  }

  getWeakestCategory(grades) {
    const gradeValues = { 'A+': 4.3, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0 };
    let weakest = { category: 'speed', value: 5 };
    
    for (const [category, grade] of Object.entries(grades)) {
      if (category !== 'overall' && gradeValues[grade.letter] < weakest.value) {
        weakest = { category, value: gradeValues[grade.letter] };
      }
    }
    
    return weakest.category;
  }

  buildCompleteReport(stats, aiSections) {
    return `
      <div style="text-align: center;">
        <h1 style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 36px;">
          🔥 PERFORMANCE REPORT CARD 🔥
        </h1>
        <p style="color: #888; margin: 0 0 30px 0; font-size: 14px;">
          Session Complete: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </p>
      </div>

      <!-- Overall Grade -->
      <div style="background: rgba(255, 107, 107, 0.1); border: 2px solid ${stats.grades.overall.color}; border-radius: 15px; padding: 30px; margin: 20px 0; text-align: center;">
        <h2 style="margin: 0 0 15px 0; color: #fff; font-size: 24px;">OVERALL GRADE</h2>
        <div style="font-size: 80px; font-weight: bold; color: ${stats.grades.overall.color}; line-height: 1; margin: 10px 0;">
          ${stats.grades.overall.letter}
        </div>
        <div style="color: #4ecdc4; font-size: 18px; margin-top: 10px;">
          GPA: ${stats.grades.overall.gpa}
        </div>
      </div>

      <!-- AI Overall Assessment -->
      <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid #ff6b6b; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #ff6b6b; font-size: 18px;">📋 CHEF'S ASSESSMENT</h3>
        <p style="margin: 0; line-height: 1.6; color: #ddd;">${aiSections.overallAssessment}</p>
      </div>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 25px 0;">
        <div class="stat-box">
          <div class="stat-value">${stats.ordersCompleted}/${stats.ordersTarget}</div>
          <div class="stat-label">Orders Completed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" style="color: #ffd700;">${stats.finalScore}</div>
          <div class="stat-label">Final Score</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" style="color: #00ff00;">${stats.perfectOrders}</div>
          <div class="stat-label">Perfect Orders</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" style="color: #ff6b6b;">${stats.timeouts}</div>
          <div class="stat-label">Timeouts</div>
        </div>
      </div>

      <!-- Grade Breakdown -->
      <div style="margin: 30px 0;">
        <h3 style="color: #4ecdc4; margin: 0 0 20px 0; font-size: 20px; text-align: center;">📊 GRADE BREAKDOWN</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
          ${this.buildGradeCard('⚡ Speed', stats.grades.speed, stats.averageSpeed + '% avg')}
          ${this.buildGradeCard('🎯 Accuracy', stats.grades.accuracy, stats.totalMistakes + ' mistakes')}
          ${this.buildGradeCard('🔄 Adaptability', stats.grades.adaptability, stats.adaptabilityScore + '/100')}
          ${this.buildGradeCard('💪 Pressure', stats.grades.pressure, 'Stress: ' + stats.stressLevel)}
        </div>
      </div>

      <!-- Strengths & Weaknesses -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
        <div style="background: rgba(78, 205, 196, 0.1); border: 2px solid #4ecdc4; border-radius: 10px; padding: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #4ecdc4; font-size: 18px;">✅ STRENGTHS</h3>
          <p style="margin: 0; line-height: 1.6; color: #ddd; font-size: 14px;">${aiSections.strengths}</p>
        </div>
        <div style="background: rgba(255, 107, 107, 0.1); border: 2px solid #ff6b6b; border-radius: 10px; padding: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #ff6b6b; font-size: 18px;">⚠️ AREAS TO IMPROVE</h3>
          <p style="margin: 0; line-height: 1.6; color: #ddd; font-size: 14px;">${aiSections.weaknesses}</p>
        </div>
      </div>

      <!-- Improvement Tips -->
      <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid #ffd700; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #ffd700; font-size: 18px;">💡 IMPROVEMENT TIPS</h3>
        <p style="margin: 0; line-height: 1.6; color: #ddd; font-size: 14px;">${aiSections.improvement}</p>
      </div>

      <!-- Detailed Stats -->
      <div style="background: rgba(255, 255, 255, 0.03); border-radius: 10px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #fff; font-size: 18px;">📈 DETAILED STATISTICS</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
          <div><span style="color: #888;">Fast Completions:</span> <span style="color: #4ecdc4;">${stats.fastCompletions}</span></div>
          <div><span style="color: #888;">Slow Completions:</span> <span style="color: #ffa500;">${stats.slowCompletions}</span></div>
          <div><span style="color: #888;">Ingredients Banned:</span> <span style="color: #ff6b6b;">${stats.ingredientsBanned}</span></div>
          <div><span style="color: #888;">Tools Banned:</span> <span style="color: #ff6b6b;">${stats.toolsBanned}</span></div>
          <div><span style="color: #888;">Escalation Level:</span> <span style="color: #ffd700;">${stats.escalationLevel}</span></div>
          <div><span style="color: #888;">Total Ingredients Used:</span> <span style="color: #4ecdc4;">${stats.totalIngredientUsage}</span></div>
        </div>
        ${stats.favoriteIngredients.length > 0 ? `
          <div style="margin-top: 15px;">
            <span style="color: #888;">Most Used Ingredients:</span>
            <span style="color: #4ecdc4;">
              ${stats.favoriteIngredients.map(ing => `${ing.name} (${ing.uses}×)`).join(', ')}
            </span>
          </div>
        ` : ''}
      </div>

      <!-- Chef's Final Notes -->
      <div style="background: linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 107, 107, 0.1) 100%); border: 2px solid #ff6b6b; border-radius: 10px; padding: 25px; margin: 25px 0; text-align: center;">
        <h3 style="margin: 0 0 15px 0; color: #ff6b6b; font-size: 20px;">👨‍🍳 CHEF'S FINAL WORD</h3>
        <p style="margin: 0; font-size: 18px; color: #fff; font-style: italic; line-height: 1.6;">
          "${aiSections.chefNotes}"
        </p>
        <p style="margin: 15px 0 0 0; color: #888; font-size: 14px;">- Head Chef</p>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px; flex-wrap: wrap;">
        <button id="shareStatsBtn" style="
          background: linear-gradient(135deg, #ffd700 0%, #f0c419 100%);
          border: none;
          color: #1a1a2e;
          padding: 15px 30px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 20px rgba(255, 215, 0, 0.5)';" 
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
          📤 SHARE STATS
        </button>
        <button id="restartBtn" style="
          background: linear-gradient(135deg, #4ecdc4 0%, #3ab0a8 100%);
          border: none;
          color: white;
          padding: 15px 40px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 20px rgba(78, 205, 196, 0.5)';" 
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
          🔄 TRY AGAIN
        </button>
        <button id="closeReportBtn" style="
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          border: none;
          color: white;
          padding: 15px 40px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 20px rgba(255, 107, 107, 0.5)';" 
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
          ❌ CLOSE
        </button>
      </div>
    `;
  }

  buildGradeCard(label, grade, detail) {
    return `
      <div style="background: rgba(255, 255, 255, 0.05); border: 2px solid ${grade.color}; border-radius: 10px; padding: 15px; text-align: center;">
        <div style="font-size: 14px; color: #888; margin-bottom: 8px;">${label}</div>
        <div style="font-size: 36px; font-weight: bold; color: ${grade.color}; margin: 5px 0;">${grade.letter}</div>
        <div style="font-size: 12px; color: #aaa;">${detail}</div>
      </div>
    `;
  }

  addStyles() {
    if (document.getElementById('reportCardStyles')) return;

    const style = document.createElement('style');
    style.id = 'reportCardStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { 
          transform: translateY(-50px);
          opacity: 0;
        }
        to { 
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .thinking-spinner {
        width: 60px;
        height: 60px;
        border: 5px solid rgba(78, 205, 196, 0.2);
        border-top: 5px solid #4ecdc4;
        border-radius: 50%;
        margin: 0 auto;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .stat-box {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(78, 205, 196, 0.3);
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        transition: transform 0.2s, border-color 0.2s;
      }
      
      .stat-box:hover {
        transform: translateY(-5px);
        border-color: rgba(78, 205, 196, 0.6);
      }
      
      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #4ecdc4;
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #888;
      }
      
      #reportCard::-webkit-scrollbar {
        width: 10px;
      }
      
      #reportCard::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 5px;
      }
      
      #reportCard::-webkit-scrollbar-thumb {
        background: #4ecdc4;
        border-radius: 5px;
      }
      
      #reportCard::-webkit-scrollbar-thumb:hover {
        background: #3ab0a8;
      }
    `;
    document.head.appendChild(style);
  }

  hide() {
    const overlay = document.getElementById('reportCardOverlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease-in-out';
      setTimeout(() => overlay.remove(), 300);
    }
    this.visible = false;
  }
}
