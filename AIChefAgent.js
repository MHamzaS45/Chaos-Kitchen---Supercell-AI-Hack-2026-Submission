// AI-powered Chef Agent using ChatManager for dynamic, contextual responses
import { CONFIG } from './config.js';

export class AIChefAgent {
  constructor(chefAI, onMessageUpdate) {
    this.chefAI = chefAI;
    this.onMessageUpdate = onMessageUpdate;
    
    // AI state tracking
    this.conversationHistory = [];
    this.playerBehaviorProfile = {
      favoriteIngredients: {},
      toolUsagePatterns: {},
      averageCompletionTime: 0,
      mistakeTypes: [],
      adaptabilityScore: 100,
      stressLevel: 0
    };
    
    // AI generation tracking
    this.isGenerating = false;
    this.lastAIMessageTime = 0;
    this.aiMessageCooldown = 10; // Seconds between AI messages
    
    // Initialize ChatManager if available
    this.initializeChatManager();
  }

  async initializeChatManager() {
    if (typeof window.ChatManager === 'undefined') {
      console.warn('ChatManager not available, using fallback messages');
      this.useFallback = true;
      return;
    }

    try {
      // System prompt defining the Chef's personality and role
      const systemPrompt = `You are an intense, demanding Head Chef in a chaotic kitchen game. Your role is to:

1. DYNAMICALLY REACT to player performance and adapt your rules accordingly
2. Issue SHORT, INTENSE commands (2-3 sentences max)
3. Show personality: demanding, fiery, but fair when players perform well
4. Reference specific player behaviors you observe
5. Escalate pressure based on their skill level

PERSONALITY TRAITS:
- Passionate about cooking perfection
- Gets more demanding as players succeed
- Notices patterns (ingredient preferences, speed, mistakes)
- Occasionally shows brief approval when impressed
- Uses culinary metaphors and kitchen slang

RESPONSE STYLE:
- Keep responses under 50 words
- Use CAPS for emphasis
- Be direct and commanding
- Reference the specific situation
- Vary your intensity based on context

Remember: You're teaching through pressure, not being cruel. Push skilled players harder, ease up slightly on struggling ones.`;

      this.chatManager = new window.ChatManager({
        systemPrompt: systemPrompt,
        temperature: 0.9, // High creativity for varied responses
        maxTokens: 100 // Keep responses short and punchy
      });
      
      this.useFallback = false;
      console.log('AI Chef Agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ChatManager:', error);
      this.useFallback = true;
    }
  }

  // Track player behavior for AI context
  trackIngredientUsage(ingredientId) {
    if (!this.playerBehaviorProfile.favoriteIngredients[ingredientId]) {
      this.playerBehaviorProfile.favoriteIngredients[ingredientId] = 0;
    }
    this.playerBehaviorProfile.favoriteIngredients[ingredientId]++;
  }

  trackToolUsage(toolId) {
    if (!this.playerBehaviorProfile.toolUsagePatterns[toolId]) {
      this.playerBehaviorProfile.toolUsagePatterns[toolId] = 0;
    }
    this.playerBehaviorProfile.toolUsagePatterns[toolId]++;
  }

  trackMistake(mistakeType) {
    this.playerBehaviorProfile.mistakeTypes.push(mistakeType);
    this.playerBehaviorProfile.adaptabilityScore = Math.max(0, 
      this.playerBehaviorProfile.adaptabilityScore - 5
    );
  }

  trackOrderCompletion(timePercent, mistakes) {
    // Update average completion time
    const samples = this.chefAI.ordersCompleted;
    this.playerBehaviorProfile.averageCompletionTime = 
      (this.playerBehaviorProfile.averageCompletionTime * (samples - 1) + timePercent) / samples;
    
    // Update stress level based on performance
    if (timePercent < 0.3) {
      this.playerBehaviorProfile.stressLevel += 10;
    } else if (timePercent > 0.7) {
      this.playerBehaviorProfile.stressLevel = Math.max(0, 
        this.playerBehaviorProfile.stressLevel - 5
      );
      this.playerBehaviorProfile.adaptabilityScore = Math.min(100,
        this.playerBehaviorProfile.adaptabilityScore + 3
      );
    }

    // Cap stress level
    this.playerBehaviorProfile.stressLevel = Math.min(100, 
      this.playerBehaviorProfile.stressLevel
    );
  }

  // Generate AI response for specific events
  async generateResponse(eventType, context = {}) {
    if (this.useFallback || this.isGenerating) {
      return this.getFallbackMessage(eventType, context);
    }

    const currentTime = Date.now() / 1000;
    if (currentTime - this.lastAIMessageTime < this.aiMessageCooldown) {
      return null; // Don't spam messages
    }

    this.isGenerating = true;
    this.lastAIMessageTime = currentTime;
    
    // Notify UI that AI is thinking
    if (this.onMessageUpdate) {
      this.notifyThinking(true);
    }

    try {
      const prompt = this.buildPrompt(eventType, context);
      const response = await this.chatManager.sendMessage(prompt);
      
      this.conversationHistory.push({
        event: eventType,
        context: context,
        response: response,
        timestamp: currentTime
      });

      this.isGenerating = false;
      this.notifyThinking(false);
      return response;
    } catch (error) {
      console.error('AI generation error:', error);
      this.isGenerating = false;
      this.notifyThinking(false);
      return this.getFallbackMessage(eventType, context);
    }
  }

  notifyThinking(isThinking) {
    // Dispatch event for UI to catch
    window.dispatchEvent(new CustomEvent('aiThinking', { 
      detail: { isThinking } 
    }));
  }

  buildPrompt(eventType, context) {
    const profile = this.playerBehaviorProfile;
    const chefState = this.chefAI;

    let prompt = `SITUATION: ${eventType}\n\n`;

    // Add relevant context
    switch (eventType) {
      case 'ORDER_COMPLETED':
        prompt += `Player completed order ${chefState.ordersCompleted} `;
        prompt += `with ${context.timePercent}% time remaining and ${context.mistakes} mistakes.\n`;
        prompt += `Their average completion rate: ${(profile.averageCompletionTime * 100).toFixed(0)}%\n`;
        prompt += `Stress level: ${profile.stressLevel}/100\n`;
        
        if (context.timePercent > 0.7) {
          prompt += `They're performing WELL. Consider escalating difficulty.\n`;
        } else if (context.timePercent < 0.3) {
          prompt += `They're struggling. Maybe acknowledge it briefly.\n`;
        }
        break;

      case 'BAN_INGREDIENT':
        const favoriteIngredients = Object.entries(profile.favoriteIngredients)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2);
        
        prompt += `Banning ${context.ingredientName}.\n`;
        if (favoriteIngredients.length > 0) {
          prompt += `Player frequently uses: ${favoriteIngredients.map(([id]) => 
            CONFIG.INGREDIENTS[id].name).join(', ')}\n`;
        }
        prompt += `This will force them to adapt.\n`;
        break;

      case 'BAN_TOOL':
        prompt += `Disabling ${context.toolName}.\n`;
        prompt += `Player has used tools ${profile.toolUsagePatterns.KNIFE || 0} (knife), `;
        prompt += `${profile.toolUsagePatterns.STOVE || 0} (stove) times.\n`;
        break;

      case 'FAST_COMPLETION':
        prompt += `Player is TOO fast (${context.timePercent}% time left).\n`;
        prompt += `Orders completed: ${chefState.ordersCompleted}\n`;
        prompt += `Time to increase pressure significantly.\n`;
        break;

      case 'MULTIPLE_MISTAKES':
        prompt += `Player made ${context.mistakes} mistakes on this order.\n`;
        prompt += `Recent mistake types: ${profile.mistakeTypes.slice(-3).join(', ')}\n`;
        prompt += `Stress level: ${profile.stressLevel}/100\n`;
        break;

      case 'TIMEOUT':
        prompt += `Player ran out of time!\n`;
        prompt += `This is their ${context.failureCount} timeout.\n`;
        prompt += `Stress level is ${profile.stressLevel}/100\n`;
        break;

      case 'ESCALATION':
        prompt += `General escalation - time to raise the stakes.\n`;
        prompt += `Escalation level: ${chefState.escalationLevel}\n`;
        prompt += `Orders completed: ${chefState.ordersCompleted}\n`;
        prompt += `Banned items: ${chefState.bannedIngredients.size} ingredients, ${chefState.bannedTools.size} tools\n`;
        break;

      case 'PERFECT_ORDER':
        prompt += `Player delivered a PERFECT order (no mistakes)!\n`;
        prompt += `This is rare - show brief approval but maintain pressure.\n`;
        break;
    }

    prompt += `\nRespond as the Head Chef with a SHORT, intense reaction (max 40 words):`;
    
    return prompt;
  }

  getFallbackMessage(eventType, context) {
    const fallbacks = {
      'ORDER_COMPLETED': [
        'Acceptable. But I expect MORE from you next time!',
        'You call that speed? My GRANDMOTHER moves faster!',
        'Not bad... for a beginner. Keep it up!',
        'Is that all you\'ve got? FASTER!'
      ],
      'BAN_INGREDIENT': [
        `NO MORE ${context.ingredientName}! Time to think CREATIVELY!`,
        `${context.ingredientName} is BANNED! Adapt or fail!`,
        `I\'m SICK of ${context.ingredientName}! Use something else!`
      ],
      'BAN_TOOL': [
        `The ${context.toolName} is BROKEN! Work around it!`,
        `${context.toolName} is OUT! A real chef adapts!`,
        `No more ${context.toolName}! Figure it out!`
      ],
      'FAST_COMPLETION': [
        'TOO EASY for you? Let\'s FIX that!',
        'Impressive speed. Time to make things HARDER!',
        'You think you\'re FAST? We\'ll see about that!'
      ],
      'TIMEOUT': [
        'OUT OF TIME! This kitchen demands SPEED!',
        'TOO SLOW! Every second counts!',
        'UNACCEPTABLE! Pick up the pace!'
      ],
      'PERFECT_ORDER': [
        'Finally! THAT\'S what I expect. Keep it up!',
        'Perfect execution. But don\'t get comfortable!',
        'Excellent work. Now do it FASTER!'
      ]
    };

    const messages = fallbacks[eventType] || fallbacks['ORDER_COMPLETED'];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Integration methods for game events
  async onOrderCompleted(timeRemaining, totalTime, mistakes) {
    const timePercent = timeRemaining / totalTime;
    this.trackOrderCompletion(timePercent, mistakes);

    let eventType = 'ORDER_COMPLETED';
    if (mistakes === 0) {
      eventType = 'PERFECT_ORDER';
    } else if (timePercent >= 0.7) {
      eventType = 'FAST_COMPLETION';
    } else if (mistakes >= 3) {
      eventType = 'MULTIPLE_MISTAKES';
    }

    const message = await this.generateResponse(eventType, {
      timePercent: (timePercent * 100).toFixed(0),
      mistakes,
      totalOrders: this.chefAI.ordersCompleted
    });

    if (message) {
      this.onMessageUpdate(message);
    }
  }

  async onIngredientBanned(ingredientId) {
    const ingredient = CONFIG.INGREDIENTS[ingredientId];
    const message = await this.generateResponse('BAN_INGREDIENT', {
      ingredientName: ingredient.name,
      ingredientId
    });

    if (message) {
      this.onMessageUpdate(message);
    }
  }

  async onToolBanned(toolId) {
    const tool = CONFIG.TOOLS[toolId];
    const message = await this.generateResponse('BAN_TOOL', {
      toolName: tool.name,
      toolId
    });

    if (message) {
      this.onMessageUpdate(message);
    }
  }

  async onTimeout(failureCount) {
    const message = await this.generateResponse('TIMEOUT', {
      failureCount
    });

    if (message) {
      this.onMessageUpdate(message);
    }
  }

  async onEscalation() {
    const message = await this.generateResponse('ESCALATION', {
      escalationLevel: this.chefAI.escalationLevel,
      bannedCount: this.chefAI.bannedIngredients.size + this.chefAI.bannedTools.size
    });

    if (message) {
      this.onMessageUpdate(message);
    }
  }

  // Get AI-powered analysis of player performance
  async getPerformanceAnalysis() {
    if (this.useFallback) return null;

    const profile = this.playerBehaviorProfile;
    const prompt = `Analyze this player's performance:
    - Orders completed: ${this.chefAI.ordersCompleted}
    - Average completion: ${(profile.averageCompletionTime * 100).toFixed(0)}%
    - Adaptability: ${profile.adaptabilityScore}/100
    - Stress level: ${profile.stressLevel}/100
    - Recent mistakes: ${profile.mistakeTypes.slice(-5).join(', ')}
    
    Give a brief (20 words) assessment of their skill level and what they need to improve:`;

    try {
      const analysis = await this.chatManager.sendMessage(prompt);
      return analysis;
    } catch (error) {
      return null;
    }
  }

  reset() {
    this.conversationHistory = [];
    this.playerBehaviorProfile = {
      favoriteIngredients: {},
      toolUsagePatterns: {},
      averageCompletionTime: 0,
      mistakeTypes: [],
      adaptabilityScore: 100,
      stressLevel: 0
    };
    this.lastAIMessageTime = 0;
  }
}
