// AI Head Chef - Dynamic rule escalation system
import { CONFIG } from './config.js';

export class ChefAI {
  constructor(onRuleChange) {
    this.onRuleChange = onRuleChange; // Callback when rules change
    
    // Banned items tracking
    this.bannedIngredients = new Set();
    this.bannedTools = new Set();
    
    // Performance tracking
    this.ordersCompleted = 0;
    this.fastCompletions = 0;
    this.slowCompletions = 0;
    this.perfectOrders = 0;
    this.timeouts = 0;
    
    // Rule escalation state
    this.warningTimer = CONFIG.CHEF.INITIAL_WARNING_TIME;
    this.timeSinceLastRule = 0;
    this.escalationLevel = 0;
    
    // Messages
    this.currentMessage = "Welcome to my kitchen! Let's see if you can handle the heat...";
    this.messageQueue = [];
    
    // AI Agent integration
    this.aiAgent = null;
  }

  // Set AI agent for enhanced behavior
  setAIAgent(aiAgent) {
    this.aiAgent = aiAgent;
  }

  update(deltaTime) {
    this.timeSinceLastRule += deltaTime;
    
    // Calculate time until next escalation
    const timeUntilEscalation = this.warningTimer - this.timeSinceLastRule;
    
    // Trigger warning event when close to escalation (5 seconds before)
    if (timeUntilEscalation <= 5 && timeUntilEscalation > 4.9) {
      window.dispatchEvent(new CustomEvent('chefWarning', { 
        detail: { secondsRemaining: 5 } 
      }));
    }
    
    // Check if it's time to escalate
    if (this.timeSinceLastRule >= this.warningTimer) {
      this.escalate();
      this.timeSinceLastRule = 0;
    }
  }
  
  getTimeUntilEscalation() {
    return Math.max(0, this.warningTimer - this.timeSinceLastRule);
  }
  
  getEscalationProgress() {
    return Math.min(1, this.timeSinceLastRule / this.warningTimer);
  }

  // Track order completion and adapt
  onOrderCompleted(timeRemaining, totalTime, mistakes) {
    this.ordersCompleted++;
    
    const timePercent = timeRemaining / totalTime;
    
    // Track performance
    if (timePercent >= CONFIG.PERFORMANCE.FAST_COMPLETION) {
      this.fastCompletions++;
      this.triggerRule('fast_completion');
    } else if (timePercent <= CONFIG.PERFORMANCE.SLOW_COMPLETION) {
      this.slowCompletions++;
    }
    
    if (mistakes === 0) {
      this.perfectOrders++;
    }
    
    // Notify AI agent
    if (this.aiAgent) {
      this.aiAgent.onOrderCompleted(timeRemaining, totalTime, mistakes);
    }
    
    // Always escalate on success
    this.triggerRule('success');
    
    // Additional escalation for consistent performance
    if (this.ordersCompleted > 0 && this.ordersCompleted % 3 === 0) {
      this.triggerRule('multiple_success');
    }
  }

  // Track timeout failures
  onOrderTimeout() {
    this.timeouts++;
    
    if (this.aiAgent) {
      this.aiAgent.onTimeout(this.timeouts);
    }
  }

  // Trigger a new rule based on context
  triggerRule(context) {
    const availableRules = [];
    
    // Determine which rules can be applied
    for (const [ruleType, config] of Object.entries(CONFIG.CHEF.RULE_TYPES)) {
      if (config.trigger === context || config.trigger === 'success') {
        availableRules.push({ type: ruleType, weight: config.weight });
      }
    }
    
    // Weighted random selection
    if (availableRules.length > 0) {
      const totalWeight = availableRules.reduce((sum, rule) => sum + rule.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const rule of availableRules) {
        random -= rule.weight;
        if (random <= 0) {
          this.applyRule(rule.type);
          break;
        }
      }
    }
  }

  // Apply a specific rule type
  applyRule(ruleType) {
    switch (ruleType) {
      case 'BAN_INGREDIENT':
        this.banRandomIngredient();
        break;
      case 'BAN_TOOL':
        this.banRandomTool();
        break;
      case 'REDUCE_TIME':
        this.reduceTimeLimit();
        break;
      case 'INCREASE_COMPLEXITY':
        this.increaseComplexity();
        break;
    }
    
    this.escalationLevel++;
    this.warningTimer = Math.max(
      CONFIG.CHEF.MIN_WARNING_TIME,
      this.warningTimer * CONFIG.CHEF.ESCALATION_RATE
    );
  }

  banRandomIngredient() {
    // Limit: Don't ban more than 2 ingredients at once
    if (this.bannedIngredients.size >= 2) {
      // Instead of banning, just reduce time
      this.reduceTimeLimit();
      return;
    }
    
    const available = Object.keys(CONFIG.INGREDIENTS).filter(
      id => !this.bannedIngredients.has(id)
    );
    
    if (available.length > 0) {
      const toBan = available[Math.floor(Math.random() * available.length)];
      this.bannedIngredients.add(toBan);
      
      const ingredient = CONFIG.INGREDIENTS[toBan];
      
      // Use AI agent for message if available
      if (this.aiAgent) {
        this.aiAgent.onIngredientBanned(toBan);
      } else {
        this.setMessage(
          `NO MORE ${ingredient.name.toUpperCase()}!`,
          `I'm TIRED of seeing ${ingredient.name} in every dish! Find another way!`
        );
      }
      
      this.onRuleChange();
    }
  }

  banRandomTool() {
    // Limit: Only ban ONE tool at a time (either KNIFE or STOVE, never PLATE)
    if (this.bannedTools.size >= 1) {
      // Instead of banning another tool, reduce time
      this.reduceTimeLimit();
      return;
    }
    
    // NEVER ban PLATE - it's required for all orders
    const available = Object.keys(CONFIG.TOOLS).filter(
      id => id !== 'PLATE' && !this.bannedTools.has(id)
    );
    
    if (available.length > 0) {
      const toBan = available[Math.floor(Math.random() * available.length)];
      this.bannedTools.add(toBan);
      
      const tool = CONFIG.TOOLS[toBan];
      
      // Use AI agent for message if available
      if (this.aiAgent) {
        this.aiAgent.onToolBanned(toBan);
      } else {
        this.setMessage(
          `${tool.name.toUpperCase()} IS BROKEN!`,
          `The ${tool.name} is out of commission. Adapt or fail!`
        );
      }
      
      this.onRuleChange();
    }
  }

  reduceTimeLimit() {
    this.setMessage(
      'TOO SLOW!',
      'You\'re moving like a snail! Time limits are now SHORTER!'
    );
    this.onRuleChange();
  }

  increaseComplexity() {
    this.setMessage(
      'TOO EASY FOR YOU?',
      'Let\'s see how you handle MORE COMPLEX orders!'
    );
    this.onRuleChange();
  }

  // Random escalation (called periodically)
  escalate() {
    // Use AI agent for escalation message if available
    if (this.aiAgent) {
      this.aiAgent.onEscalation();
    } else {
      const messages = [
        { title: 'SPEED IT UP!', text: 'I don\'t have all day! Move faster!' },
        { title: 'PERFECTION REQUIRED!', text: 'Mistakes will NOT be tolerated!' },
        { title: 'ADAPT OR LEAVE!', text: 'A real chef adapts to ANY situation!' },
        { title: 'STOP THINKING!', text: 'Your hands should move faster than your brain!' }
      ];
      
      const msg = messages[Math.floor(Math.random() * messages.length)];
      this.setMessage(msg.title, msg.text);
    }
    
    // 40% chance to add a new rule
    if (Math.random() < 0.4) {
      const ruleTypes = Object.keys(CONFIG.CHEF.RULE_TYPES);
      const randomRule = ruleTypes[Math.floor(Math.random() * ruleTypes.length)];
      this.applyRule(randomRule);
    }
  }

  setMessage(title, text) {
    this.currentMessage = `<strong>${title}</strong><br>${text}`;
  }

  setAIMessage(message) {
    this.currentMessage = message;
  }

  getMessage() {
    return this.currentMessage;
  }

  isIngredientBanned(ingredientId) {
    return this.bannedIngredients.has(ingredientId);
  }

  isToolBanned(toolId) {
    return this.bannedTools.has(toolId);
  }

  getBannedItems() {
    return {
      ingredients: Array.from(this.bannedIngredients).map(id => CONFIG.INGREDIENTS[id].name),
      tools: Array.from(this.bannedTools).map(id => CONFIG.TOOLS[id].name)
    };
  }

  getTimeModifier() {
    // Reduce time by 10% per escalation level (capped at 50% reduction)
    return Math.max(0.5, 1 - (this.escalationLevel * 0.1));
  }

  // Reset for new game
  reset() {
    this.bannedIngredients.clear();
    this.bannedTools.clear();
    this.ordersCompleted = 0;
    this.fastCompletions = 0;
    this.slowCompletions = 0;
    this.perfectOrders = 0;
    this.timeouts = 0;
    this.warningTimer = CONFIG.CHEF.INITIAL_WARNING_TIME;
    this.timeSinceLastRule = 0;
    this.escalationLevel = 0;
    this.currentMessage = "Welcome to my kitchen! Let's see if you can handle the heat...";
    
    if (this.aiAgent) {
      this.aiAgent.reset();
    }
  }
}
