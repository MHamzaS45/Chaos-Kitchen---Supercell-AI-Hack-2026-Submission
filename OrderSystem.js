// Order management and recipe system
import { CONFIG } from './config.js';

export class OrderSystem {
  constructor(chefAI) {
    this.chefAI = chefAI;
    this.currentOrder = null;
    this.timeRemaining = 0;
    this.totalTime = 0;
    this.mistakes = 0;
  }

  // Generate a new order based on current rules
  generateOrder() {
    // Filter recipes based on banned ingredients AND tools
    const availableRecipes = CONFIG.RECIPES.filter(recipe => {
      // Check if any ingredients are banned
      const hasUnavailableIngredient = recipe.ingredients.some(ingredientId => {
        return this.chefAI.isIngredientBanned(ingredientId);
      });
      
      if (hasUnavailableIngredient) return false;
      
      // Check if required tools are available
      const requiredTools = new Set();
      for (const [ingredientId, state] of Object.entries(recipe.requiredStates)) {
        if (state === 'chopped') requiredTools.add('KNIFE');
        else if (state === 'cooked') requiredTools.add('STOVE');
      }
      
      // Check if any required tools are banned
      for (const tool of requiredTools) {
        if (this.chefAI.isToolBanned(tool)) {
          return false;
        }
      }
      
      return true;
    });

    if (availableRecipes.length === 0) {
      // Fallback: find the simplest recipe that doesn't require tools
      const simpleRecipe = CONFIG.RECIPES.find(r => Object.keys(r.requiredStates).length === 0);
      return this.createOrder(simpleRecipe || CONFIG.RECIPES[0]);
    }

    // Select random recipe from available
    const recipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
    return this.createOrder(recipe);
  }

  createOrder(recipe) {
    // Apply chef's time modifier
    const timeModifier = this.chefAI.getTimeModifier();
    const adjustedTime = recipe.baseTime * timeModifier;

    this.currentOrder = {
      recipe: recipe,
      requiredIngredients: [...recipe.ingredients],
      requiredStates: { ...recipe.requiredStates },
      progress: new Set(),
      score: recipe.baseScore
    };

    this.timeRemaining = adjustedTime;
    this.totalTime = adjustedTime;
    this.mistakes = 0;

    return this.currentOrder;
  }

  update(deltaTime) {
    if (this.currentOrder) {
      this.timeRemaining -= deltaTime;
      
      if (this.timeRemaining <= 0) {
        return 'timeout';
      }
    }
    return null;
  }

  // Check if an ingredient can be added to the current order
  canAddIngredient(ingredientId, state) {
    if (!this.currentOrder) return false;

    const required = this.currentOrder.requiredIngredients;
    if (!required.includes(ingredientId)) {
      this.mistakes++;
      return false;
    }

    // Check if the state is correct
    const requiredState = this.currentOrder.requiredStates[ingredientId];
    if (requiredState && state !== requiredState) {
      this.mistakes++;
      return false;
    }

    return true;
  }

  addIngredient(ingredientId, state) {
    if (this.canAddIngredient(ingredientId, state)) {
      const key = `${ingredientId}_${state || 'raw'}`;
      this.currentOrder.progress.add(key);
      return true;
    }
    return false;
  }

  isOrderComplete() {
    if (!this.currentOrder) return false;

    // Check if all required ingredients with correct states are added
    for (const ingredientId of this.currentOrder.requiredIngredients) {
      const requiredState = this.currentOrder.requiredStates[ingredientId] || 'raw';
      const key = `${ingredientId}_${requiredState}`;
      
      if (!this.currentOrder.progress.has(key)) {
        return false;
      }
    }

    return true;
  }

  completeOrder() {
    if (!this.currentOrder) return null;

    const result = {
      score: this.currentOrder.score,
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      mistakes: this.mistakes,
      perfect: this.mistakes === 0
    };

    // Bonus for speed
    const timePercent = this.timeRemaining / this.totalTime;
    result.score = Math.floor(result.score * (1 + timePercent * 0.5));

    // Penalty for mistakes
    result.score = Math.max(0, result.score - (this.mistakes * 20));

    this.currentOrder = null;
    return result;
  }

  getCurrentOrder() {
    return this.currentOrder;
  }

  getProgress() {
    if (!this.currentOrder) return { current: 0, total: 0 };
    
    return {
      current: this.currentOrder.progress.size,
      total: this.currentOrder.requiredIngredients.length
    };
  }

  getTimeRemaining() {
    return Math.max(0, this.timeRemaining);
  }

  getTimePercent() {
    if (this.totalTime === 0) return 1;
    return this.timeRemaining / this.totalTime;
  }
}
