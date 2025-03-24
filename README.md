# Space Scrap Collector

![Space Scrap Collector](./screenshot.png)

## Overview

Space Scrap Collector is an action-packed space-themed arcade game where players control a spaceship to collect valuable scraps, destroy asteroids, and level up through 20 challenging levels. The game features smooth controls, power-ups, special abilities, and progressively increasing difficulty.

## 🚀 Features

- **Dynamic Gameplay**: Navigate through space, collect scraps, and destroy asteroids
- **Level Progression**: Battle through 20 levels with increasing difficulty
- **Power-up System**: Collect and utilize different power-ups:
  - Shield (protects from asteroid collisions)
  - Speed Boost (increases ship speed)
  - Rapid Fire (decreases weapon cooldown)
- **Special Abilities**: Use dash ability to quickly navigate and evade obstacles
- **Particle Effects**: Beautiful visual effects for explosions, collectibles, and ship movement
- **Visually Engaging**: Parallax star backgrounds, cosmic decorations, and nebula effects
- **Responsive Controls**: Keyboard controls with responsive handling
- **Mobile-Friendly**: Touch controls and scrolling support for mobile devices

## 🎮 How to Play

### Controls
- **Movement**: Arrow keys or WASD
- **Shoot**: Spacebar
- **Dash**: Shift key
- **Start Game**: Space (from menu)
- **Return to Menu**: Home button (top-right during gameplay)

### Objectives
1. Collect gold scraps to increase your score
2. Destroy asteroids to earn points and level up
3. Reach level 20 to achieve victory
4. Avoid collisions with asteroids (unless shielded)

### Power-ups
- **S (Blue)**: Shield - Protects your ship from one asteroid collision
- **B (Green)**: Speed Boost - Temporarily increases your ship's speed
- **F (Red)**: Rapid Fire - Temporarily reduces the cooldown between shots

## 🔧 Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/space-scrap-collector.git
   ```

2. Open the game:
   - Option 1: Open `index.html` in a modern web browser
   - Option 2: Use a local server like Python's `http.server`:
     ```
     python -m http.server
     ```
     Then navigate to `http://localhost:8000` in your browser

3. No additional dependencies required - the game uses pure JavaScript with the p5.js library

## 🧠 Game Mechanics

- **Leveling System**: Each level requires more points than the previous
- **Asteroids**: Higher levels spawn faster, smaller, and more numerous asteroids
- **Health System**: Some asteroids require multiple hits to destroy
- **Dash Cooldown**: 3-second cooldown between dashes (resets on level-up)
- **Scoring**:
  - Scraps: 10 points each
  - Asteroids: 15 points × current level

## 🛠️ Technical Details

- Built with JavaScript using the p5.js library
- Modular code structure with organized functions
- Object-oriented design pattern for game entities
- Robust error handling to prevent gameplay interruptions
- Responsive design that works on various screen sizes

## 📊 Future Enhancements

- Additional weapon types
- Enemy spaceships
- Boss battles
- Persistent high scores
- More power-up types
- Sound effects and background music
- Customizable ships

## 👨‍💻 Credits

Created by [MicahPClark]

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 
