# Chef's Chaos Kitchen - Complete Game Flow

## Game Phases

### 1. Title Screen
**What happens:**
- Professional title screen with animated logo
- Difficulty selection (5, 10, 15, or 20 orders)
- Feature highlights
- How to play instructions
- "START COOKING" button

**Controls:**
- Click difficulty buttons to select challenge level
- Click "START COOKING" to begin

---

### 2. Gameplay Phase
**What happens:**
- Player moves around 3D kitchen
- Pick up ingredients from stations
- Process at tool stations (Knife, Stove)
- Deliver completed orders to Plate station
- AI Chef dynamically bans ingredients/tools based on performance
- Time pressure increases with success

**Controls:**
- **WASD** - Move around kitchen
- **E** - Pick up ingredient / Use station
- **R** - Drop held item
- **ESC** - Pause game
- **📊 View Report** button (after 1st order) - Check current stats

**UI Elements:**
- **HUD (top left)**: Score, current order, time remaining
- **Chef Messages (top right)**: AI-generated commands and reactions
- **Banned List (bottom left)**: Currently unavailable items
- **Instructions (bottom right)**: Quick reference
- **Holding indicator (center)**: What you're carrying

**Order Flow:**
1. See recipe requirements
2. Collect ingredients
3. Process as needed (chop with knife, cook on stove)
4. Deliver all ingredients to plate station
5. Complete order → earn points
6. Next order begins after 2 seconds

**Escalation System:**
- Chef observes your performance
- Fast completions → harder restrictions
- Success → more bans
- Periodic escalations increase pressure
- AI generates contextual responses

---

### 3. Pause Menu
**What happens:**
- Game freezes
- Simple menu overlay

**Triggered by:**
- Pressing **ESC** during gameplay

**Options:**
- **RESUME** - Continue playing (or press ESC again)
- **QUIT TO MENU** - End session and go to Game Over screen

---

### 4. Game Over Screen
**What happens:**
- Summary of session performance
- Quick stats display
- Options to continue

**Triggered by:**
- Completing all orders (success)
- Quitting from pause menu
- (Future: Multiple timeouts)

**Stats Shown:**
- Final score
- Orders completed / target
- Perfect orders
- Banned items count
- Completion rate
- Perfect order rate
- Fast completions
- Timeouts
- Escalation level

**Options:**
- **📊 VIEW FULL REPORT** - Opens detailed AI-generated report card
- **🔄 TRY AGAIN** - Restart with same difficulty
- **🚪 MAIN MENU** - Reload page to title screen

---

### 5. Performance Report Card
**What happens:**
- Comprehensive AI-generated analysis
- Letter grades (A+ to D) for 4 categories
- Detailed statistics
- Personalized feedback

**Triggered by:**
- Clicking "VIEW FULL REPORT" on Game Over screen
- Clicking "📊 View Report Card" button during gameplay (after 1st order)

**Content:**
- **Overall Grade** with GPA
- **AI-Generated Sections:**
  - Overall Assessment (40 words)
  - Strengths (30 words)
  - Weaknesses (30 words)
  - Improvement Tips (35 words)
  - Chef's Final Notes (15 words)
- **Grade Breakdown:**
  - ⚡ Speed (based on completion time)
  - 🎯 Accuracy (based on mistakes)
  - 🔄 Adaptability (based on rule handling)
  - 💪 Pressure Handling (based on stress)
- **Detailed Statistics**
- **Most-Used Ingredients**

**Options:**
- **📤 SHARE STATS** - Copy formatted summary to clipboard
- **🔄 TRY AGAIN** - New session
- **❌ CLOSE** - Dismiss report

---

## Complete Game Loop

```
Title Screen
    ↓
[Select Difficulty]
    ↓
Gameplay Phase ←─────┐
    ↓                │
[Complete Orders]    │
    ↓                │
Game Over Screen     │
    ↓                │
Performance Report   │
    ↓                │
[Try Again] ─────────┘
    or
[Main Menu] → Reload
```

---

## Difficulty Levels

### 🔥 EASY (5 Orders)
- Good for learning mechanics
- Less escalation pressure
- Perfect for first playthrough

### 🔥🔥 NORMAL (10 Orders)
- Default experience
- Balanced challenge
- Recommended difficulty

### 🔥🔥🔥 HARD (15 Orders)
- Extended challenge
- More bans accumulate
- Higher escalation levels

### 🔥🔥🔥🔥 INSANE (20 Orders)
- Ultimate test
- Extreme restrictions
- Maximum chaos

---

## AI Chef Behavior

### Performance Tracking
- Ingredient usage patterns
- Tool preferences
- Completion speed
- Mistake frequency
- Stress levels
- Adaptability score

### Dynamic Responses
- **Fast Completion**: "TOO EASY for you? Let's FIX that!"
- **Perfect Order**: "Finally! THAT'S what I expect."
- **Mistakes**: "Focus! Quality matters!"
- **Timeout**: "TOO SLOW! Every second counts!"
- **Ban Ingredient**: "NO MORE tomatoes! Be creative!"
- **Ban Tool**: "The knife is BROKEN! Adapt!"

### Escalation Triggers
- Every 15 seconds (initially, decreases over time)
- After fast completions (70%+ time remaining)
- After multiple successes (every 3 orders)
- Random escalations with 40% chance of new rule

---

## Scoring System

### Base Points
- Simple Sandwich: 100 pts
- Cheese Sandwich: 120 pts
- Meat Sandwich: 150 pts
- Deluxe Sandwich: 200 pts

### Multipliers
- **Speed Bonus**: +50% of base × (time remaining %)
- **Mistake Penalty**: -20 pts per mistake

### Example
Recipe: 150 pts
Time: 70% remaining
Mistakes: 1

Score = 150 × (1 + 0.7 × 0.5) - 20
      = 150 × 1.35 - 20
      = 202.5 - 20
      = **182 pts**

---

## Tips for Success

1. **Plan Your Route**: Minimize backtracking
2. **Read Orders Carefully**: Check required states
3. **Stay Organized**: Don't hold ingredients too long
4. **Adapt Quickly**: When items get banned, pivot immediately
5. **Speed vs Accuracy**: Both matter - find balance
6. **Use Report Card**: Learn from your weaknesses
7. **Practice Difficulty**: Start on Easy to learn patterns
8. **Watch Time**: Keep an eye on the countdown
9. **Learn Recipes**: Memorize ingredient requirements
10. **Stay Calm**: Stress affects adaptability score

---

## Technical Features

### Performance
- 60 FPS target
- Responsive controls
- Smooth animations
- Efficient AI calls (with cooldowns)

### Accessibility
- Keyboard-only controls
- Clear visual feedback
- Color-coded UI elements
- Readable fonts

### AI Integration
- ChatManager for dynamic text generation
- Fallback system for reliability
- Context-aware prompts
- Personality consistency

### Scalability
- Modular system architecture
- Easy to add new ingredients
- Simple recipe definition
- Expandable rule types
- Configurable difficulty parameters
