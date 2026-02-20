// Game configuration and constants

export const CONFIG = {
  // Ingredient definitions
  INGREDIENTS: {
    TOMATO: {
      id: 'TOMATO',
      name: 'Tomato',
      color: 0xff6347,
      canChop: true,
      canCook: true
    },
    LETTUCE: {
      id: 'LETTUCE',
      name: 'Lettuce',
      color: 0x90ee90,
      canChop: true,
      canCook: false
    },
    CHEESE: {
      id: 'CHEESE',
      name: 'Cheese',
      color: 0xffd700,
      canChop: false,
      canCook: true
    },
    BREAD: {
      id: 'BREAD',
      name: 'Bread',
      color: 0xdeb887,
      canChop: false,
      canCook: true
    },
    MEAT: {
      id: 'MEAT',
      name: 'Meat',
      color: 0x8b4513,
      canChop: false,
      canCook: true
    }
  },

  // Tool definitions
  TOOLS: {
    KNIFE: { id: 'KNIFE', name: 'Knife', action: 'chop' },
    STOVE: { id: 'STOVE', name: 'Stove', action: 'cook' },
    PLATE: { id: 'PLATE', name: 'Plate', action: 'assemble' }
  },

  // Recipe definitions
  RECIPES: [
    // RAW ONLY recipes (no tools needed except plate)
    {
      name: 'Quick Snack',
      ingredients: ['BREAD', 'CHEESE'],
      requiredStates: {},
      baseScore: 80,
      baseTime: 30
    },
    {
      name: 'Simple Platter',
      ingredients: ['BREAD', 'LETTUCE', 'TOMATO'],
      requiredStates: {},
      baseScore: 90,
      baseTime: 35
    },
    {
      name: 'Raw Special',
      ingredients: ['LETTUCE', 'TOMATO', 'CHEESE'],
      requiredStates: {},
      baseScore: 85,
      baseTime: 35
    },
    // CHOP ONLY recipes (needs knife)
    {
      name: 'Fresh Salad',
      ingredients: ['LETTUCE', 'TOMATO'],
      requiredStates: { LETTUCE: 'chopped', TOMATO: 'chopped' },
      baseScore: 100,
      baseTime: 40
    },
    {
      name: 'Chopped Sandwich',
      ingredients: ['BREAD', 'LETTUCE', 'TOMATO'],
      requiredStates: { LETTUCE: 'chopped', TOMATO: 'chopped' },
      baseScore: 110,
      baseTime: 45
    },
    // COOK ONLY recipes (needs stove)
    {
      name: 'Grilled Cheese',
      ingredients: ['BREAD', 'CHEESE'],
      requiredStates: { CHEESE: 'cooked' },
      baseScore: 120,
      baseTime: 45
    },
    {
      name: 'Hot Meal',
      ingredients: ['BREAD', 'MEAT'],
      requiredStates: { MEAT: 'cooked' },
      baseScore: 140,
      baseTime: 50
    },
    // MIXED recipes (needs both tools)
    {
      name: 'Cheese Sandwich',
      ingredients: ['BREAD', 'CHEESE', 'LETTUCE'],
      requiredStates: { CHEESE: 'cooked', LETTUCE: 'chopped' },
      baseScore: 130,
      baseTime: 50
    },
    {
      name: 'Meat Sandwich',
      ingredients: ['BREAD', 'MEAT', 'TOMATO'],
      requiredStates: { MEAT: 'cooked', TOMATO: 'chopped' },
      baseScore: 160,
      baseTime: 55
    },
    {
      name: 'Deluxe Sandwich',
      ingredients: ['BREAD', 'MEAT', 'CHEESE', 'LETTUCE'],
      requiredStates: { MEAT: 'cooked', CHEESE: 'cooked', LETTUCE: 'chopped' },
      baseScore: 200,
      baseTime: 60
    }
  ],

  // Chef behavior parameters
  CHEF: {
    INITIAL_WARNING_TIME: 30, // Seconds before first warning
    ESCALATION_RATE: 0.85, // Multiplier for next warning time
    MIN_WARNING_TIME: 10, // Minimum seconds between warnings
    
    // Rule types and their triggers
    RULE_TYPES: {
      BAN_INGREDIENT: { weight: 0.3, trigger: 'success' },
      BAN_TOOL: { weight: 0.2, trigger: 'success' },
      REDUCE_TIME: { weight: 0.3, trigger: 'fast_completion' },
      INCREASE_COMPLEXITY: { weight: 0.2, trigger: 'multiple_success' }
    }
  },

  // Performance tracking thresholds
  PERFORMANCE: {
    FAST_COMPLETION: 0.7, // Completed with 70%+ time remaining
    PERFECT_SCORE: 1.0, // No mistakes
    SLOW_COMPLETION: 0.3 // Less than 30% time remaining
  },

  // Mission progression
  MISSIONS: {
    ORDERS_PER_LEVEL: 5,
    DIFFICULTY_SCALING: 1.2 // Multiplier per level
  },

  // Visual settings
  CAMERA: {
    POSITION: { x: 0, y: 8, z: 12 },
    LOOK_AT: { x: 0, y: 0, z: 0 }
  },

  COLORS: {
    KITCHEN_FLOOR: 0x2c3e50,
    COUNTER: 0x34495e,
    WALL: 0x1a1a2e,
    HIGHLIGHT: 0x4ecdc4,
    BANNED: 0xff0000,
    SUCCESS: 0x00ff00
  }
};
