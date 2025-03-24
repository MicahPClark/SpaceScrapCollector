let ship;
let scraps = [];
let asteroids = [];
let powerups = [];
let bullets = [];
let score = 0;
let gameState = 'menu'; // Can be 'menu', 'playing', 'gameOver', or 'victory'
let highScore = 0;
let stars = []; // For background stars
let particles = []; // For collecting effects
let level = 1;
let nextLevelScore = 100;
let lastShotTime = 0; // Track when the last bullet was fired
const SHOT_COOLDOWN = 300; // Cooldown between shots in milliseconds

// Added for dash ability
let dashAvailable = true;
let dashCooldown = 0;
const DASH_COOLDOWN = 180; // 3 seconds cooldown
let dashDirection = { x: 0, y: 0 };
let isDashing = false;
let dashTimer = 0;
const DASH_DURATION = 10; // Duration of dash in frames

// Simple control variables
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

// Added for level up message
let levelMessage = null;

// Variables for scrolling
let scrollY = 0;
let maxScrollY = 200; // Will be calculated based on content height
let isScrolling = false;
let touchStartY = 0;

function setup() {
  createCanvas(600, 400);
  
  // Create stars with different depths for parallax effect
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      brightness: random(150, 255),
      depth: random(0.2, 1) // Depth factor for parallax (smaller = further away)
    });
  }
  
  // Initialize game elements but don't start the game yet
  resetGame();
}

function resetGame() {
  // Reset game variables
  level = 1;
  score = 0;
  nextLevelScore = 100;
  particles = [];
  bullets = [];
  powerups = [];
  dashAvailable = true;
  dashCooldown = 0;
  
  // Create ship - simple object
  ship = {
    x: width / 2,
    y: height - 50,
    size: 20,
    speed: 5,
    shield: 0,
    speedBoost: 0,
    rapidFire: 0,
    
    display: function() {
      // Draw shield if active
      if (this.shield > 0) {
        push();
        translate(this.x, this.y);
        
        // Animated shield effect
        let shieldPulse = 1 + sin(frameCount * 0.1) * 0.1;
        
        // Outer shield glow
        noFill();
        stroke(0, 100, 255, 100);
        strokeWeight(3);
        ellipse(0, 0, this.size * 2.8 * shieldPulse);
        
        // Inner shield
        stroke(0, 150, 255, 180);
        strokeWeight(2);
        ellipse(0, 0, this.size * 2.5 * shieldPulse);
        
        // Shield details
        noFill();
        stroke(100, 200, 255, 150);
        strokeWeight(1);
        
        // Shield arc effects
        for (let i = 0; i < 3; i++) {
          let rotOffset = frameCount * 0.02 + i * TWO_PI / 3;
          arc(0, 0, this.size * 2.6 * shieldPulse, this.size * 2.6 * shieldPulse, 
              rotOffset, rotOffset + TWO_PI / 2);
        }
        
        pop();
      }
      
      // Draw dash effect when dashing
      if (isDashing) {
        push();
        translate(this.x, this.y);
        
        // Trail effect
        noFill();
        stroke(0, 255, 255, 200 - dashTimer * 20);
        strokeWeight(2);
        
        // Multiple fading trails
        for (let i = 0; i < 3; i++) {
          let trailScale = 1 + (i * 0.5);
          let trailX = -dashDirection.x * 10 * trailScale;
          let trailY = -dashDirection.y * 10 * trailScale;
          
          beginShape();
          vertex(trailX - this.size/2, trailY);
          vertex(trailX + this.size/2, trailY);
          endShape();
        }
        pop();
      }
      
      // Draw ship
      push();
      translate(this.x, this.y);
      
      // Draw engine flame with animation
      let flameHeight = 10 + sin(frameCount * 0.2) * 3;
      fill(255, 100, 0, 200);
      beginShape();
      vertex(-this.size/3, this.size/2);
      vertex(0, this.size/2 + flameHeight);
      vertex(this.size/3, this.size/2);
      endShape(CLOSE);
      
      // Additional flame details
      fill(255, 200, 0, 150);
      beginShape();
      vertex(-this.size/5, this.size/2);
      vertex(0, this.size/2 + flameHeight * 0.7);
      vertex(this.size/5, this.size/2);
      endShape(CLOSE);
      
      // Draw ship body
      fill(0, 255, 150);
      stroke(0, 200, 100);
      strokeWeight(1);
      beginShape();
      vertex(0, -this.size/2); // Nose
      vertex(this.size/2, this.size/2); // Bottom right
      vertex(0, this.size/4); // Middle indent
      vertex(-this.size/2, this.size/2); // Bottom left
      endShape(CLOSE);
      
      // Add cockpit
      fill(100, 200, 255);
      ellipse(0, 0, this.size/3);
      
      // Ship highlights
      noStroke();
      fill(150, 255, 200, 150);
      ellipse(-this.size/6, -this.size/10, this.size/8);
      
      pop();
    },
    
    move: function() {
      // Direct key checking for better responsiveness
      let currentSpeed = this.speed;
      
      if (isDashing) {
        // During dash, move faster in the dash direction
        this.x += dashDirection.x * currentSpeed * 3;
        this.y += dashDirection.y * currentSpeed * 3;
        
        // Create more particles during dash
        if (frameCount % 2 === 0) {
          particles.push(createParticle(
            this.x - dashDirection.x * this.size, 
            this.y - dashDirection.y * this.size, 
            [0, 255, 255]
          ));
        }
        
        // Decrement dash timer
        dashTimer--;
        if (dashTimer <= 0) {
          isDashing = false;
        }
      } else {
        // Normal movement
        if (moveLeft || keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left or A
          this.x -= currentSpeed;
        }
        if (moveRight || keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right or D
          this.x += currentSpeed;
        }
        if (moveUp || keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up or W
          this.y -= currentSpeed;
        }
        if (moveDown || keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // Down or S
          this.y += currentSpeed;
        }
      }
      
      // Keep ship on screen
      this.x = constrain(this.x, this.size/2, width - this.size/2);
      this.y = constrain(this.y, this.size/2, height - this.size/2);
      
      // Update shield timer
      if (this.shield > 0) {
        this.shield--;
      }
    },
    
    shoot: function() {
      // Check if cooldown has elapsed
      if (millis() - lastShotTime > SHOT_COOLDOWN) {
        // Create a new bullet
        bullets.push({
          x: this.x,
          y: this.y - this.size/2, // Start at the nose of the ship
          size: 5,
          speed: 10,
          
          update: function() {
            this.y -= this.speed;
            return this.y < 0; // Return true if bullet is off screen
          },
          
          display: function() {
            fill(255, 240, 100);
            noStroke();
            ellipse(this.x, this.y, this.size);
            
            // Add a glow effect
            for (let i = 1; i <= 3; i++) {
              fill(255, 200, 50, 150 / i);
              ellipse(this.x, this.y, this.size + i * 2);
            }
          },
          
          hits: function(obj) {
            let d = dist(this.x, this.y, obj.x, obj.y);
            return d < (this.size/2 + obj.size/2);
          }
        });
        
        // Update last shot time
        lastShotTime = millis();
      }
    },
    
    dash: function() {
      if (!dashAvailable || isDashing) return;
      
      // Calculate dash direction based on current movement
      dashDirection = { x: 0, y: 0 };
      
      if (moveLeft || keyIsDown(LEFT_ARROW) || keyIsDown(65)) dashDirection.x = -1;
      if (moveRight || keyIsDown(RIGHT_ARROW) || keyIsDown(68)) dashDirection.x = 1;
      if (moveUp || keyIsDown(UP_ARROW) || keyIsDown(87)) dashDirection.y = -1;
      if (moveDown || keyIsDown(DOWN_ARROW) || keyIsDown(83)) dashDirection.y = 1;
      
      // If no direction, dash forward
      if (dashDirection.x === 0 && dashDirection.y === 0) {
        dashDirection.y = -1;
      }
      
      // Normalize for diagonal movement
      let magnitude = Math.sqrt(dashDirection.x * dashDirection.x + dashDirection.y * dashDirection.y);
      if (magnitude > 0) {
        dashDirection.x /= magnitude;
        dashDirection.y /= magnitude;
      }
      
      // Start dashing
      isDashing = true;
      dashTimer = DASH_DURATION;
      dashAvailable = false;
      dashCooldown = DASH_COOLDOWN;
      
      // Create burst of particles
      for (let i = 0; i < 10; i++) {
        particles.push(createParticle(this.x, this.y, [0, 255, 255]));
      }
    },
    
    hits: function(obj) {
      if (!obj || typeof obj.x === 'undefined' || typeof obj.y === 'undefined') {
        return false;
      }
      
      let objSize = obj.size || 15; // Default size if not specified
      let d = dist(this.x, this.y, obj.x, obj.y);
      return d < (this.size/2 + objSize/2);
    }
  };

  // Create scraps
  scraps = [];
  for (let i = 0; i < 5; i++) {
    scraps.push(createScrap());
  }
  
  // Create asteroids
  asteroids = [];
  for (let i = 0; i < 3; i++) { // Simplified to just 3 asteroids initially
    asteroids.push(createAsteroid());
  }
}

function draw() {
  // Check game state periodically
  if (frameCount % 60 === 0) { // Check once per second
    checkGameState();
  }
  
  // Create a subtle gradient background
  background(10, 5, 20); // Dark space background
  
  // Draw distant nebula-like effects for depth - just subtle color patches
  noStroke();
  fill(30, 20, 50, 10);
  ellipse(width/4, height/2, 300, 200);
  fill(50, 20, 40, 8);
  ellipse(width*3/4, height/3, 250, 150);
  
  // Draw stars with parallax effect
  drawStars();
  
  try {
    if (gameState === 'menu') {
      drawMenu();
    } else if (gameState === 'playing') {
      updateGame();
      drawGame();
    } else if (gameState === 'gameOver') {
      drawGameOver();
    } else if (gameState === 'victory') {
      drawVictory();
    } else {
      // Invalid game state, reset to menu
      gameState = 'menu';
      drawMenu();
    }
  } catch (error) {
    console.error("Error in main draw loop:", error);
    // Try to recover
    gameState = 'menu';
    drawMenu();
  }
}

function drawStars() {
  // Update star positions for parallax based on game state
  let ySpeed = 0;
  
  // Stars move faster during gameplay to create a sense of motion
  if (gameState === 'playing') {
    ySpeed = 0.5;
  }
  
  for (let star of stars) {
    // Move stars faster or slower based on their depth
    star.y += ySpeed * star.depth;
    
    // Wrap around if off screen
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
    }
    
    // Draw star with size based on depth
    fill(star.brightness);
    noStroke();
    let displaySize = star.size * (0.5 + star.depth * 0.5);
    ellipse(star.x, star.y, displaySize);
    
    // Add twinkle effect to some stars
    if (random() < 0.002) {
      fill(255, 255, 255, 150);
      ellipse(star.x, star.y, displaySize * 2);
    }
  }
}

function drawMenu() {
  // Reset scroll position when entering menu
  if (frameCount === 1 || scrollY === undefined) {
    scrollY = 0;
  }
  
  // Create a dynamic starfield background with depth effect
  background(5, 2, 15); // Deep space background
  
  // Add a subtle cosmic nebula glow
  noStroke();
  drawNebula();
  
  // Draw animated title particles
  drawTitleParticles();
  
  // Create a semi-transparent overlay at the top for title
  let gradientHeight = height/3;
  for (let i = 0; i < gradientHeight; i++) {
    let alpha = map(i, 0, gradientHeight, 150, 0);
    fill(20, 30, 80, alpha);
    rect(0, i, width, 1);
  }
  
  // Draw cosmic decorations
  drawCosmicDecorations();
  
  // Apply scrolling transformation
  push();
  translate(0, -scrollY);
  
  // Game title with glow effect - moved up to fit better
  textAlign(CENTER, CENTER);
  
  // Title shadow for depth
  fill(50, 50, 150, 50);
  textFont('Arial');
  textStyle(BOLD);
  textSize(46);
  text("SPACE SCRAP", width/2 + 4, height/8 + 4); // Moved up from height/6
  text("COLLECTOR", width/2 + 4, height/8 + 54);  // Moved up
  
  // Create animated pulse for the title
  let pulse = sin(frameCount * 0.05) * 5;
  
  // Add glowing title text
  drawingContext.shadowBlur = 10 + pulse;
  drawingContext.shadowColor = color(100, 150, 255);
  fill(160, 180, 255);
  textSize(46);
  text("SPACE SCRAP", width/2, height/8); // Moved up from height/6
  
  fill(220, 220, 255);
  text("COLLECTOR", width/2, height/8 + 50); // Moved up
  drawingContext.shadowBlur = 0;
  
  // Draw the game logo/ship icon - moved up
  drawGameLogo(width/2, height/8 - 70, 40);
  
  // Create main menu container with animated border - pushed down for better spacing
  let containerY = max(height/2 - 30, height/3 + 60); // Adjusted positioning
  drawMenuContainer(width/2 - 150, containerY);
  
  // Calculate bottom of container for proper button placement
  let containerBottom = containerY + 310; // Match the container height
  
  // Buttons - positioned relative to container bottom with spacing
  drawMenuButtons(containerBottom + 50); // Position relative to container bottom
  
  // Draw animated prompt at bottom - moved further down
  let promptY = containerBottom + 110; // Position relative to container bottom
  drawAnimatedPrompt(promptY);
  
  // Calculate the max scroll based on the content
  maxScrollY = max(0, promptY - height + 80);
  
  pop(); // End scrolling transformation
  
  // Draw scroll indicator if needed
  if (maxScrollY > 0) {
    drawScrollIndicator();
  }
}

// Helper functions for menu elements

function drawMenuContainer(containerX, containerY) {
  // Container background with pulsing border
  let pulse = sin(frameCount * 0.05) * 2;
  let containerWidth = 300;
  let containerHeight = 310; // Increased from 280 to 310 for more space
  
  // Outer glow
  noFill();
  for(let i = 0; i < 5; i++) {
    let alpha = map(i, 0, 5, 150, 0);
    stroke(100, 120, 255, alpha);
    strokeWeight(i + pulse);
    rect(containerX - i, containerY - i, containerWidth + i*2, containerHeight + i*2, 15);
  }
  
  // Main panel
  noStroke();
  fill(15, 20, 60, 220);
  rect(containerX, containerY, containerWidth, containerHeight, 10);
  
  // Inner highlight
  stroke(100, 140, 255, 100);
  strokeWeight(2);
  noFill();
  rect(containerX + 6, containerY + 6, containerWidth - 12, containerHeight - 12, 6);
  
  // Add subtle header background
  noStroke();
  fill(60, 80, 150, 80);
  rect(containerX + 6, containerY + 6, containerWidth - 12, 40, 6, 6, 0, 0);
  
  // Section Heading
  fill(255);
  textAlign(CENTER);
  textSize(20);
  text("MISSION BRIEFING", width/2, containerY + 30);
  
  // Content area
  let contentX = containerX + 20;
  let contentY = containerY + 60;
  
  // Controls section
  fill(150, 200, 255);
  textAlign(LEFT);
  textSize(16);
  text("CONTROLS", contentX, contentY);
  
  // Separator line
  stroke(100, 150, 255, 100);
  strokeWeight(1);
  line(contentX, contentY + 5, contentX + 80, contentY + 5);
  
  // Controls content with icons
  textSize(14);
  noStroke();
  let controlsY = contentY + 25;
  let iconSize = 18;
  let textOffset = 65;
  
  // Movement control
  drawControlIcon(contentX, controlsY, iconSize, "move");
  fill(200, 220, 255);
  text("ARROW KEYS / WASD", contentX + textOffset, controlsY + 5);
  
  // Shoot control
  drawControlIcon(contentX, controlsY + 30, iconSize, "shoot");
  fill(200, 220, 255);
  text("SPACE", contentX + textOffset, controlsY + 35);
  
  // Dash control
  drawControlIcon(contentX, controlsY + 60, iconSize, "dash");
  fill(200, 220, 255);
  text("SHIFT", contentX + textOffset, controlsY + 65);
  
  // Objectives section - moved down for better spacing
  fill(255, 215, 0);
  textAlign(LEFT);
  textSize(16);
  text("OBJECTIVES", contentX, controlsY + 110); // Increased from 100 to 110
  
  // Separator line
  stroke(255, 215, 0, 100);
  strokeWeight(1);
  line(contentX, contentY + 115, contentX + 90, contentY + 115); // Adjusted to match
  
  // Objectives list
  noStroke();
  textSize(14);
  fill(255, 245, 200);
  
  // Objective bullets with icons
  let objY = controlsY + 135; // Increased from 125 to 135
  
  // Objective 1: Collect scraps
  drawObjectiveIcon(contentX, objY, iconSize, "scrap");
  text("Collect gold scraps", contentX + textOffset, objY + 5);
  
  // Objective 2: Destroy asteroids
  drawObjectiveIcon(contentX, objY + 30, iconSize, "asteroid");
  text("Destroy asteroids", contentX + textOffset, objY + 35);
  
  // Objective 3: Reach level 20
  drawObjectiveIcon(contentX, objY + 60, iconSize, "level");
  text("Reach Level 20 to win!", contentX + textOffset, objY + 65);
}

function drawControlIcon(x, y, size, type) {
  // Draw background
  fill(40, 60, 120);
  stroke(100, 150, 255);
  strokeWeight(1);
  rect(x, y, size*2.5, size, 4);
  
  // Draw icon based on type
  noStroke();
  
  if (type === "move") {
    // Movement arrows
    fill(150, 200, 255);
    // Up arrow
    triangle(
      x + size*1.25, y + size*0.2,
      x + size*0.9, y + size*0.7,
      x + size*1.6, y + size*0.7
    );
    // Down arrow
    triangle(
      x + size*1.25, y + size*0.8,
      x + size*0.9, y + size*0.3,
      x + size*1.6, y + size*0.3
    );
  } 
  else if (type === "shoot") {
    // Bullet icon
    fill(255, 220, 50);
    ellipse(x + size*1.25, y + size*0.4, size*0.6);
    // Shooting trail
    rect(x + size*1.1, y + size*0.6, size*0.3, size*0.3);
  } 
  else if (type === "dash") {
    // Dash movement lines
    fill(0, 255, 255);
    for (let i = 0; i < 3; i++) {
      rect(x + size*(0.6 + i*0.4), y + size*0.4, size*0.2, size*0.2);
    }
    // Ship
    triangle(
      x + size*1.8, y + size*0.5,
      x + size*1.4, y + size*0.3,
      x + size*1.4, y + size*0.7
    );
  }
}

function drawObjectiveIcon(x, y, size, type) {
  if (type === "scrap") {
    // Gold scrap icon
    fill(60, 60, 120);
    stroke(255, 215, 0);
    strokeWeight(1);
    rect(x, y, size*2.5, size, 4);
    
    // Star shape
    noStroke();
    fill(255, 215, 0);
    push();
    translate(x + size*1.25, y + size*0.5);
    rotate(frameCount * 0.01);
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI * i / 5 - PI/2;
      let x1 = cos(angle) * size*0.4;
      let y1 = sin(angle) * size*0.4;
      let x2 = cos(angle + TWO_PI/10) * size*0.2;
      let y2 = sin(angle + TWO_PI/10) * size*0.2;
      line(0, 0, x1, y1);
      line(x1, y1, x2, y2);
    }
    pop();
  } 
  else if (type === "asteroid") {
    // Asteroid icon
    fill(60, 60, 120);
    stroke(150, 150, 150);
    strokeWeight(1);
    rect(x, y, size*2.5, size, 4);
    
    // Asteroid shape
    noStroke();
    fill(150, 140, 140);
    push();
    translate(x + size*1.25, y + size*0.5);
    beginShape();
    for (let i = 0; i < 8; i++) {
      let angle = TWO_PI * i / 8;
      let rad = size * 0.35 * (0.8 + sin(i * 3) * 0.2);
      vertex(cos(angle) * rad, sin(angle) * rad);
    }
    endShape(CLOSE);
    // Crater
    fill(100, 100, 100);
    ellipse(size*0.1, -size*0.1, size*0.15);
    pop();
  } 
  else if (type === "level") {
    // Level icon
    fill(60, 60, 120);
    stroke(255, 200, 50);
    strokeWeight(1);
    rect(x, y, size*2.5, size, 4);
    
    // Trophy icon
    noStroke();
    fill(255, 215, 0);
    // Trophy cup
    push();
    translate(x + size*1.25, y + size*0.5);
    rect(-size*0.25, -size*0.3, size*0.5, size*0.4, size*0.1);
    // Trophy base
    rect(-size*0.15, size*0.1, size*0.3, size*0.2, size*0.05);
    // Trophy handles
    ellipse(-size*0.25, -size*0.1, size*0.2, size*0.4);
    ellipse(size*0.25, -size*0.1, size*0.2, size*0.4);
    pop();
  }
}

function drawMenuButtons(buttonY) {
  // Position constants
  let buttonWidth = 180;
  let buttonHeight = 50;
  
  // Start button
  let startBtnX = width/2;
  let btnPulse = sin(frameCount * 0.1) * 3;
  
  // Button glow
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(100, 200, 255);
  
  // Button background
  fill(40, 100, 180);
  stroke(120, 200, 255);
  strokeWeight(2);
  rect(startBtnX - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 25);
  
  // Button text
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textSize(22 + btnPulse);
  text("START MISSION", startBtnX, buttonY);
  
  drawingContext.shadowBlur = 0;
}

function drawAnimatedPrompt(promptY) {
  // Animated prompt text
  let promptPulse = sin(frameCount * 0.05) * 2;
  
  fill(200, 200, 255, 200 + promptPulse * 20);
  textSize(16);
  text("PRESS SPACE TO START", width/2, promptY);
  
  // Draw key icon
  fill(150, 150, 220, 200);
  stroke(200, 200, 255, 150);
  strokeWeight(1);
  rect(width/2 - 50, promptY + 15, 100, 18, 4);
  fill(200, 200, 255);
  noStroke();
  text("SPACE", width/2, promptY + 15);
}

function drawTitleParticles() {
  // Create title particles
  if (random() < 0.3) {
    let px = random(width);
    let py = random(height/4);
    
    particles.push({
      x: px,
      y: py,
      size: random(1, 3),
      color: [random(150, 255), random(150, 255), random(200, 255)],
      xvel: random(-0.3, 0.3),
      yvel: random(-0.1, 0.3),
      alpha: random(150, 255),
      life: random(30, 60),
      
      update: function() {
        this.x += this.xvel;
        this.y += this.yvel;
        this.alpha -= this.alpha / this.life;
        return this.alpha <= 0;
      },
      
      display: function() {
        noStroke();
        fill(this.color[0], this.color[1], this.color[2], this.alpha);
        ellipse(this.x, this.y, this.size);
      }
    });
  }
  
  // Update and display particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].update()) {
      particles.splice(i, 1);
    } else {
      particles[i].display();
    }
  }
}

function drawGameLogo(x, y, size) {
  push();
  translate(x, y);
  
  // Draw glowing orbit
  noFill();
  for (let i = 0; i < 3; i++) {
    let orbitSize = size * 1.5 + i*5;
    stroke(100, 150, 255, 150 - i*40);
    strokeWeight(2 - i*0.5);
    ellipse(0, 0, orbitSize);
  }
  
  // Draw animated planets/stars
  let angle = frameCount * 0.03;
  
  // Orbiting elements
  for (let i = 0; i < 3; i++) {
    let orbitAngle = angle + (i * TWO_PI / 3);
    let orbitX = cos(orbitAngle) * size * 0.8;
    let orbitY = sin(orbitAngle) * size * 0.8;
    
    // Draw orbiting element
    noStroke();
    fill(200, 220, 255);
    ellipse(orbitX, orbitY, size/5);
  }
  
  // Center ship
  drawShipIcon(0, 0, size * 0.7);
  
  pop();
}

function drawShipIcon(x, y, size) {
  push();
  translate(x, y);
  
  // Ship body
  fill(0, 200, 100);
  stroke(100, 200, 255);
  strokeWeight(2);
  beginShape();
  vertex(0, -size/2); // Nose
  vertex(size/2, size/2); // Bottom right
  vertex(0, size/4); // Middle indent
  vertex(-size/2, size/2); // Bottom left
  endShape(CLOSE);
  
  // Engine glow - animated
  let flameSize = sin(frameCount * 0.2) * 5;
  noStroke();
  fill(255, 100, 50, 200);
  beginShape();
  vertex(-size/4, size/2);
  vertex(0, size/2 + size/3 + flameSize);
  vertex(size/4, size/2);
  endShape(CLOSE);
  
  // Cockpit
  fill(150, 200, 255);
  ellipse(0, 0, size/3);
  
  pop();
}

function drawNebula() {
  // Subtle nebula clouds in background
  for (let i = 0; i < 3; i++) {
    let x = width * (0.25 + i * 0.25);
    let y = height * (0.3 + sin(frameCount * 0.01 + i) * 0.1);
    let size = 300 + i * 50;
    
    for (let j = 0; j < 5; j++) {
      let alpha = map(j, 0, 5, 5, 0);
      let r = map(i, 0, 3, 30, 80);
      let g = map(i, 0, 3, 20, 40);
      let b = map(i, 0, 3, 80, 150);
      
      fill(r, g, b, alpha);
      ellipse(x, y, size + j*40);
    }
  }
}

function drawCosmicDecorations() {
  // Add decorative elements in the background
  
  // Constellation lines
  stroke(100, 150, 255, 30);
  strokeWeight(1);
  
  // Fixed constellation pattern
  let constellationPoints = [
    {x: width*0.1, y: height*0.2},
    {x: width*0.2, y: height*0.15},
    {x: width*0.3, y: height*0.25},
    {x: width*0.25, y: height*0.4},
    {x: width*0.15, y: height*0.35}
  ];
  
  // Draw constellation
  for (let i = 0; i < constellationPoints.length; i++) {
    let nextIndex = (i + 1) % constellationPoints.length;
    line(
      constellationPoints[i].x, 
      constellationPoints[i].y,
      constellationPoints[nextIndex].x, 
      constellationPoints[nextIndex].y
    );
    
    // Draw constellation points
    noStroke();
    fill(200, 220, 255, 150);
    ellipse(constellationPoints[i].x, constellationPoints[i].y, 3);
  }
  
  // Draw some distant planets
  noStroke();
  
  // Planet 1
  fill(80, 100, 180, 100);
  ellipse(width*0.85, height*0.2, 40);
  
  // Rings
  push();
  translate(width*0.85, height*0.2);
  rotate(PI/6);
  stroke(150, 180, 220, 80);
  strokeWeight(1);
  noFill();
  ellipse(0, 0, 60, 15);
  pop();
  
  // Planet 2
  fill(100, 70, 120, 80);
  ellipse(width*0.75, height*0.6, 25);
}

function updateGame() {
  try {
    // Move the ship
    if (ship && typeof ship.move === 'function') {
      ship.move();
    }
    
    // Create engine exhaust particles
    createExhaustParticles();
    
    // Handle shooting
    if (keyIsDown(32) && ship && typeof ship.shoot === 'function') { // Spacebar
      ship.shoot();
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      try {
        if (bullets[i] && typeof bullets[i].update === 'function') {
          let remove = bullets[i].update();
          if (remove) {
            bullets.splice(i, 1);
          }
        } else {
          bullets.splice(i, 1); // Remove invalid bullets
        }
      } catch (error) {
        console.error("Error updating bullet:", error);
        bullets.splice(i, 1); // Remove problematic bullet
      }
    }
    
    // Update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
      try {
        if (asteroids[i] && typeof asteroids[i].update === 'function') {
    asteroids[i].update();
        } else {
          asteroids[i] = createAsteroid(level); // Replace invalid asteroid
        }
      } catch (error) {
        console.error("Error updating asteroid:", error);
        asteroids[i] = createAsteroid(level); // Replace problematic asteroid
      }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      try {
        if (particles[i] && typeof particles[i].update === 'function') {
          if (particles[i].update()) {
            particles.splice(i, 1);
          }
        } else {
          particles.splice(i, 1); // Remove invalid particles
        }
      } catch (error) {
        console.error("Error updating particle:", error);
        particles.splice(i, 1); // Remove problematic particle
      }
    }
    
    // Bullet collisions with asteroids (with error handling)
    handleBulletAsteroidCollisions();
    
    // Check for scrap collection
    handleScrapCollection();
    
    // Check for asteroid collisions with ship
    handleAsteroidShipCollisions();
    
    // Update powerups with error handling
    handlePowerups();
    
    // Check for level up
    if (score >= nextLevelScore) {
      levelUp();
    }
    
    // Check for victory condition (Level 20)
    if (level >= 20) {
      if (score > highScore) {
        highScore = score;
      }
      gameState = 'victory';
    }
    
    // Handle active power-ups duration
    if (ship.rapidFire > 0) {
      ship.rapidFire--;
      if (ship.rapidFire <= 0) {
        SHOT_COOLDOWN = 300; // Reset to default when expired
      }
    }
    
    if (ship.speedBoost > 0) {
      ship.speedBoost--;
      if (ship.speedBoost <= 0) {
        ship.speed = 5; // Reset to default when expired
      }
    }
    
    // Update dash cooldown
    if (!dashAvailable) {
      dashCooldown--;
      if (dashCooldown <= 0) {
        dashAvailable = true;
      }
    }
  } catch (error) {
    console.error("Error in updateGame:", error);
    // Prevent game from completely breaking by continuing
  }
}

function drawGame() {
  // Create a semi-transparent UI header
  fill(0, 0, 30, 200);
    noStroke();
  rect(0, 0, width, 50);
  
  // Add subtle separator line
  stroke(100, 100, 255, 100);
  strokeWeight(1);
  line(0, 50, width, 50);
  
  // Display score and high score
  noStroke();
  fill(255);
  textAlign(LEFT);
  textSize(16);
  text(`SCORE: ${score}`, 20, 25);
  text(`HIGH SCORE: ${highScore}`, 20, 45);
  
  // Display level indicator with fractions (e.g., "LEVEL 5/20")
  fill(100, 200, 255);
  textAlign(CENTER);
  textSize(18);
  text(`LEVEL ${level}/20`, width/2, 30);
  
  // Progress bar for levels
  noFill();
  stroke(100, 200, 255, 150);
  rect(width/2 - 75, 35, 150, 8, 4);
  noStroke();
  fill(100, 200, 255);
  rect(width/2 - 75, 35, 150 * (level / 20), 8, 4);
  
  // Add home button
  drawHomeButton();
  
  // Display active power-ups
  if (ship.shield > 0 || ship.speedBoost > 0 || ship.rapidFire > 0) {
    textAlign(RIGHT);
    textSize(14);
    
    let yPos = 20;
    
    if (ship.shield > 0) {
      let remaining = ceil(ship.shield / 60);
      fill(0, 100, 255);
      text(`SHIELD: ${remaining}s`, width - 20, yPos);
      yPos += 18;
    }
    
    if (ship.speedBoost > 0) {
      let remaining = ceil(ship.speedBoost / 60);
      fill(50, 255, 50);
      text(`BOOST: ${remaining}s`, width - 20, yPos);
      yPos += 18;
    }
    
    if (ship.rapidFire > 0) {
      let remaining = ceil(ship.rapidFire / 60);
      fill(255, 100, 50);
      text(`RAPID FIRE: ${remaining}s`, width - 20, yPos);
    }
  }
  
  // Display dash cooldown
  if (!dashAvailable) {
    let percent = map(dashCooldown, 0, DASH_COOLDOWN, 0, 100);
    fill(0, 150, 150);
    textAlign(RIGHT);
    text(`DASH: ${floor(dashCooldown / 60)}s`, width - 20, 75);
    
    // Cooldown bar with rounded corners
    stroke(0, 150, 150, 100);
    strokeWeight(1);
    noFill();
    rect(width - 100, 80, 80, 5, 2);
    noStroke();
    fill(0, 255, 255);
    rect(width - 100, 80, 80 * (1 - percent/100), 5, 2);
  } else {
    // Dash is available
    fill(0, 255, 255);
    textAlign(RIGHT);
    text("DASH READY", width - 20, 75);
  }
  
  // Display ship
  ship.display();
  
  // Display bullets
  for (let bullet of bullets) {
    bullet.display();
  }
  
  // Display scraps
  for (let scrap of scraps) {
    scrap.display();
  }
  
  // Display asteroids
  for (let asteroid of asteroids) {
    asteroid.display();
  }
  
  // Display powerups
  for (let powerup of powerups) {
    powerup.display();
  }
  
  // Display particles
  for (let particle of particles) {
    particle.display();
  }
  
  // Display level message if it exists
  if (levelMessage && levelMessage.alpha > 0) {
    levelMessage.display();
  }
}

function drawGameOver() {
  // Semi-transparent overlay
  fill(0, 0, 30, 200);
  rect(0, 0, width, height);
  
  // Game over text
  fill(255, 50, 50);
  textSize(52);
  textAlign(CENTER, CENTER);
  text("GAME OVER", width/2, height/3 - 20);
  
  // Score display
  fill(255);
  textSize(24);
  text(`Final Score: ${score}`, width/2, height/2);
  
  // High score notification
  if (score >= highScore && score > 0) {
    fill(255, 200, 0);
    textSize(28);
    text("NEW HIGH SCORE!", width/2, height/2 + 40);
  } else {
    fill(200);
    textSize(20);
    text(`High Score: ${highScore}`, width/2, height/2 + 40);
  }
  
  // Restart prompt
  fill(255, 255, 100);
  textSize(24);
  text("Press SPACE to play again", width/2, height*3/4);
}

function drawVictory() {
  // Semi-transparent background
  fill(0, 0, 50, 200);
  rect(0, 0, width, height);
  
  // Create animated particle background for victory
  if (random() < 0.3) {
    let pos = {
      x: random(width),
      y: random(height)
    };
    // Random colors for celebration
    let colors = [
      [255, 200, 0],  // Gold
      [0, 255, 255],  // Cyan
      [255, 0, 255],  // Magenta
      [0, 255, 0]     // Green
    ];
    particles.push(createParticle(pos.x, pos.y, random(colors)));
  }
  
  // Display particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].update()) {
      particles.splice(i, 1);
    } else {
      particles[i].display();
    }
  }
  
  // Victory text with pulse animation
  let pulseSize = sin(frameCount * 0.05) * 3;
  
  fill(255, 255, 100);
  textSize(52 + pulseSize);
  textAlign(CENTER, CENTER);
  text("VICTORY!", width/2, height/3 - 20);
  
  // Score display
  fill(255);
  textSize(28);
  text(`Final Score: ${score}`, width/2, height/2);
  
  // Level display
  fill(100, 200, 255);
  textSize(24);
  text(`You reached Level ${level}!`, width/2, height/2 + 40);
  
  // High score notification
  if (score >= highScore && score > 0) {
    fill(255, 200, 0);
    textSize(24);
    text("NEW HIGH SCORE!", width/2, height/2 + 80);
  } else {
    fill(200);
    textSize(20);
    text(`High Score: ${highScore}`, width/2, height/2 + 80);
  }
  
  // Restart prompt
  fill(255, 255, 100);
  textSize(24);
  text("Press SPACE to play again", width/2, height*3/4);
}

function keyPressed() {
  if (keyCode === 32) { // Space key
    if (gameState === 'menu') {
      startPlaying();
    } else if (gameState === 'gameOver' || gameState === 'victory') {
      resetGame();
      startPlaying();
    }
  }
  
  // Dash with Shift key
  if (keyCode === SHIFT && gameState === 'playing') {
    ship.dash();
  }
  
  // For debugging
  console.log("p5.js keyPressed: ", key, keyCode);
  
  // Allow default behaviors
  return true;
}

// Improve compatibility with browser event handlers for more reliable input
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft = true;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') moveUp = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moveDown = true;
  
  // Add dash ability with Shift key
  if (e.key === 'Shift' && gameState === 'playing') {
    try {
      if (ship && typeof ship.dash === 'function') {
        ship.dash();
      }
    } catch (error) {
      console.error("Error in dash:", error);
    }
  }
  
  // Start game with Space
  if (e.key === ' ') {
    if (gameState === 'menu') {
      startPlaying();
    } else if (gameState === 'gameOver' || gameState === 'victory') {
      resetGame();
      startPlaying();
    }
  }
  
  // Prevent default behavior for game control keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Shift'].includes(e.key)) {
    e.preventDefault();
  }
}, false);

document.addEventListener('keyup', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft = false;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') moveUp = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moveDown = false;
  
  // Prevent default
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
    e.preventDefault();
  }
}, false);

function startPlaying() {
  console.log("Starting game...");
  gameState = 'playing';
}

function createScrap() {
  return {
    x: random(width),
    y: random(height/2),
    size: 15,
    rotation: random(TWO_PI),
    rotSpeed: random(-0.05, 0.05),
    glowOffset: random(TWO_PI), // For oscillating glow effect
    
    display: function() {
      push();
      translate(this.x, this.y);
      rotate(this.rotation);
      this.rotation += this.rotSpeed;
      
      // Draw glow effect
      let glowSize = 1.2 + sin(frameCount * 0.05 + this.glowOffset) * 0.2;
      noStroke();
      fill(255, 200, 50, 50);
      ellipse(0, 0, this.size * glowSize * 1.5);
      
      // Draw gold star-shaped scrap
    fill(255, 215, 0); // Gold color
      stroke(200, 150, 0);
      strokeWeight(1);
      
      // Create star shape
      beginShape();
      for (let i = 0; i < 5; i++) {
        let angle = map(i, 0, 5, 0, TWO_PI);
        let outerRadius = this.size * 0.8;
        let innerRadius = this.size * 0.4;
        
        // Outer point
        let x1 = cos(angle) * outerRadius;
        let y1 = sin(angle) * outerRadius;
        vertex(x1, y1);
        
        // Inner point
        let nextAngle = angle + TWO_PI / 10;
        let x2 = cos(nextAngle) * innerRadius;
        let y2 = sin(nextAngle) * innerRadius;
        vertex(x2, y2);
      }
      endShape(CLOSE);
      
      // Add shine highlight
      noStroke();
      fill(255, 255, 150, 200);
      ellipse(-this.size/4, -this.size/4, this.size/3);
      
      pop();
    }
  };
}

function createAsteroid(currentLevel = 1) {
  // Calculate difficulty modifiers based on level
  let sizeModifier = map(currentLevel, 1, 20, 1, 0.7); // Smaller asteroids at higher levels
  let speedModifier = map(currentLevel, 1, 20, 1, 3.5); // Much faster asteroids at higher levels
  
  return {
    x: random(width),
    y: -20,
    size: random(30, 40) * sizeModifier,
    speed: random(1, 2) * speedModifier,
    rotation: random(TWO_PI),
    rotSpeed: random(-0.02, 0.02),
    vertices: [], // Points for irregular shape
    health: Math.min(Math.ceil(currentLevel / 3), 3), // Cap max health at 3 hits
    maxHealth: Math.min(Math.ceil(currentLevel / 3), 3), // Store original max health
    
    update: function() {
      this.y += this.speed;
      this.rotation += this.rotSpeed;
      
      // Reset if off screen
      if (this.y > height + this.size) {
        this.reset();
      }
    },
    
    reset: function() {
      this.y = -this.size;
    this.x = random(width);
      this.health = Math.min(Math.ceil(level / 3), 3); // Cap max health at 3 hits
      this.maxHealth = this.health;
    },
    
    hit: function() {
      this.health = max(0, this.health - 1); // Ensure health never goes below 0
      // Create a particle for visual feedback
      for (let i = 0; i < 3; i++) {
        particles.push(createParticle(this.x, this.y, [150, 150, 150]));
      }
      return this.health <= 0; // Return true if destroyed
    },
    
    display: function() {
      push();
      translate(this.x, this.y);
      rotate(this.rotation);
      
      // Draw asteroid with rocky texture - color based on health
      let healthPercent = this.health / this.maxHealth;
      
      // Redder as it takes damage
      let r = map(healthPercent, 0, 1, 180, 120);
      let g = map(healthPercent, 0, 1, 80, 110);
      let b = map(healthPercent, 0, 1, 70, 100);
      
      fill(r, g, b);
      stroke(80);
      strokeWeight(1);
      
      // Draw irregular shape
      beginShape();
      for (let v of this.vertices) {
        vertex(v.x, v.y);
      }
      endShape(CLOSE);
      
      // Add some simple crater details
      noStroke();
      fill(90, 85, 80);
      ellipse(-this.size/4, this.size/5, this.size/3);
      ellipse(this.size/3, -this.size/4, this.size/4);
      
      // Show health if more than 1
      if (this.maxHealth > 1 && gameState === 'playing') {
        noStroke();
        fill(255, 255, 255, 180);
        textAlign(CENTER, CENTER);
        textSize(this.size/3);
        text(this.health, 0, 0);
      }
      
      pop();
    },
    
    init: function() {
      // Create irregular shape with 6-9 vertices
      let numVertices = floor(random(6, 10));
      for (let i = 0; i < numVertices; i++) {
        let angle = map(i, 0, numVertices, 0, TWO_PI);
        let r = this.size/2 * random(0.8, 1.2); // Vary the radius
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        this.vertices.push({x, y});
      }
      return this;
    }
  }.init(); // Initialize immediately
}

function createParticle(x, y, colorArray) {
  // Validate input parameters
  if (typeof x !== 'number' || isNaN(x)) {
    x = width/2;
  }
  
  if (typeof y !== 'number' || isNaN(y)) {
    y = height/2;
  }
  
  // Ensure color array is properly formatted
  if (!Array.isArray(colorArray) || colorArray.length < 3) {
    colorArray = [255, 215, 0]; // Default gold color
  }
  
  // Make sure color values are numbers
  const safeColor = [
    Number(colorArray[0]) || 255,
    Number(colorArray[1]) || 215,
    Number(colorArray[2]) || 0
  ];
  
  return {
    x: x,
    y: y,
    size: random(2, 6),
    color: safeColor,
    xvel: random(-2, 2),
    yvel: random(-2, 2),
    alpha: 255,
    life: random(20, 40), // Vary particle lifespans
    
    update: function() {
      this.x += this.xvel;
      this.y += this.yvel;
      this.alpha -= 255 / this.life; // Fade based on lifespan
      this.xvel *= 0.95;
      this.yvel *= 0.95;
      this.size *= 0.97; // Shrink gradually
      return this.alpha <= 0;
    },
    
    display: function() {
      try {
        noStroke();
        fill(
          this.color[0],
          this.color[1],
          this.color[2],
          this.alpha
        );
        ellipse(this.x, this.y, this.size);
      } catch (error) {
        console.error("Error displaying particle:", error);
      }
    }
  };
}

function createPowerup() {
  const types = ['shield', 'speed', 'rapidfire'];
  const type = random(types);
  
  let powerupColor;
  if (type === 'shield') {
    powerupColor = [0, 100, 255]; // Blue
  } else if (type === 'speed') {
    powerupColor = [50, 255, 50]; // Green
  } else {
    powerupColor = [255, 50, 50]; // Red
  }
  
  return {
    x: random(width),
    y: -20,
    size: 15,
    type: type,
    color: powerupColor,
    speed: random(1, 3),
    rotation: 0,
    pulseOffset: random(TWO_PI),
    
    update: function() {
    this.y += this.speed;
      this.rotation += 0.03;
      
      // Check if off screen
      if (this.y > height + this.size) {
        return true; // Return true to remove this powerup
      }
      return false; // Otherwise keep it
    },
    
    display: function() {
      push();
      translate(this.x, this.y);
      rotate(this.rotation);
      
      // Draw glow
      let pulseSize = 1 + sin(frameCount * 0.1 + this.pulseOffset) * 0.2;
      noStroke();
      fill(this.color[0], this.color[1], this.color[2], 70);
      ellipse(0, 0, this.size * 2 * pulseSize);
      
      // Draw powerup
      fill(this.color[0], this.color[1], this.color[2]);
      stroke(255);
      strokeWeight(1);
      ellipse(0, 0, this.size);
      
      // Draw icon based on type
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      
      if (this.type === 'shield') {
        text("S", 0, 0);
      } else if (this.type === 'speed') {
        text("B", 0, 0);
      } else if (this.type === 'rapidfire') {
        text("F", 0, 0);
      }
      
      pop();
    },
    
    apply: function(ship) {
      if (!ship) return; // Safety check
      
      try {
        switch(this.type) {
          case 'shield':
            ship.shield = 300; // 5 seconds of shield
            console.log("Shield powerup activated");
            break;
          case 'speed':
            ship.speed = 8; // Temporarily increase speed
            ship.speedBoost = 300; // 5 seconds
            console.log("Speed powerup activated");
            break;
          case 'rapidfire':
            ship.rapidFire = 300; // 5 seconds
            SHOT_COOLDOWN = 150; // Set faster cooldown
            console.log("Rapid fire powerup activated");
            break;
        }
      } catch (error) {
        console.error("Error in apply powerup:", error);
      }
    }
  };
}

function levelUp() {
  try {
    // Increment level
    level++;
    
    // Increase next level threshold (higher score needed for each level)
    nextLevelScore += 100 * level;
    
    // Add more asteroids based on level with increased difficulty
    let newAsteroids = Math.min(level, 3); // Maximum 3 new asteroids per level
    for (let i = 0; i < newAsteroids; i++) {
      try {
        let newAsteroid = createAsteroid(level);
        if (newAsteroid) {
          asteroids.push(newAsteroid);
        }
      } catch (error) {
        console.error("Error creating asteroid:", error);
      }
    }
    
    // Check for victory condition
    if (level >= 20) {
      if (score > highScore) {
        highScore = score;
      }
      gameState = 'victory';
      
      // Create victory particles
      for (let i = 0; i < 50; i++) {
        let colors = [
          [255, 215, 0],  // Gold
          [0, 255, 255],  // Cyan
          [255, 100, 255] // Pink
        ];
        try {
          particles.push(createParticle(
            random(width), 
            random(height), 
            random(colors)
          ));
        } catch (error) {
          console.error("Error creating particle:", error);
        }
      }
      return;
    }
    
    // Create level-up particles for visual feedback
    for (let i = 0; i < 15; i++) {
      try {
        let pos = {
          x: random(width),
          y: random(height)
        };
        particles.push(createParticle(pos.x, pos.y, [100, 200, 255]));
      } catch (error) {
        console.error("Error creating particle:", error);
      }
    }
    
    // Create a powerup as a reward - only if not too many already
    if (random() < 0.8 && powerups.length < 3) { // 80% chance for a powerup, max 3 on screen
      try {
        powerups.push(createPowerup());
      } catch (error) {
        console.error("Error creating powerup:", error);
      }
    }
    
    // Dash cooldown reset - bonus for leveling up
    dashAvailable = true;
    dashCooldown = 0;
    
    // Show level up message temporarily
    levelMessage = {
      text: "LEVEL " + level,
      alpha: 255,
      display: function() {
        if (this.alpha > 0) {
          textAlign(CENTER, CENTER);
          textSize(36);
          fill(100, 200, 255, this.alpha);
          text(this.text, width/2, height/2);
          this.alpha -= 5;
        }
      }
    };
    
    console.log("Level up to:", level);
  } catch (error) {
    console.error("Error in levelUp function:", error);
    // Ensure game continues even if there's an error
    if (level < 20) {
      gameState = 'playing';
    } else {
      gameState = 'victory';
    }
  }
}

// Add a function to create engine exhaust particles
function createExhaustParticles() {
  // Only create particles occasionally to maintain performance
  if (frameCount % 3 !== 0 || gameState !== 'playing') return;
  
  // Create exhaust behind the ship
  particles.push({
    x: ship.x + random(-5, 5),
    y: ship.y + ship.size/2 + random(0, 5),
    size: random(3, 8),
    color: [255, random(100, 200), 0],
    xvel: random(-0.5, 0.5),
    yvel: random(0.5, 2),
    alpha: 150,
    life: random(10, 20),
    
    update: function() {
      this.x += this.xvel;
      this.y += this.yvel;
      this.alpha -= 255 / this.life;
      this.size *= 0.93; // Shrink faster than normal particles
      return this.alpha <= 0;
    },
    
    display: function() {
      noStroke();
      fill(
        this.color[0],
        this.color[1],
        this.color[2],
        this.alpha
      );
      ellipse(this.x, this.y, this.size);
    }
  });
}

// Helper functions for collision handling
function handleBulletAsteroidCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bulletRemoved = false;
    
    for (let j = asteroids.length - 1; j >= 0; j--) {
      try {
        if (bullets[i] && !bulletRemoved && 
            typeof bullets[i].hits === 'function' && 
            typeof asteroids[j].hit === 'function' && 
            bullets[i].hits(asteroids[j])) {
          
          // Remove bullet
          bullets.splice(i, 1);
          bulletRemoved = true;
          
          // Damage asteroid
          if (asteroids[j].hit()) {
            // Asteroid destroyed
            score += 15 * level; // More points for higher levels
            
            // Create explosion effect
            for (let k = 0; k < 10; k++) {
              try {
                particles.push(createParticle(asteroids[j].x, asteroids[j].y, [150, 150, 150]));
              } catch (error) {
                console.error("Error creating explosion particle:", error);
              }
            }
            
            // Reset asteroid
            try {
              asteroids[j].reset();
            } catch (error) {
              console.error("Error resetting asteroid:", error);
              asteroids[j] = createAsteroid(level); // Create new one if reset fails
            }
            
            // Small chance to spawn powerup on destroy
            let powerupChance = min(0.1 * level, 0.5);
            if (random() < powerupChance && powerups.length < 5) { // Limit total powerups
              try {
                powerups.push(createPowerup());
              } catch (error) {
                console.error("Error creating powerup:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in bullet-asteroid collision:", error);
      }
    }
  }
}

function handleScrapCollection() {
  for (let i = scraps.length - 1; i >= 0; i--) {
    try {
      if (ship && typeof ship.hits === 'function' && ship.hits(scraps[i])) {
        score += 10;
        // Replace with a new scrap
        scraps[i] = createScrap();
      }
    } catch (error) {
      console.error("Error in scrap collection:", error);
      scraps[i] = createScrap(); // Replace problematic scrap
    }
  }
}

function handleAsteroidShipCollisions() {
  if (!ship) return;
  
  for (let i = 0; i < asteroids.length; i++) {
    try {
      if (typeof ship.hits === 'function' && ship.hits(asteroids[i])) {
        if (ship.shield > 0) {
          // Use shield instead of dying
          ship.shield = 0;
          // Reset asteroid
          try {
            asteroids[i].reset();
          } catch (error) {
            asteroids[i] = createAsteroid(level);
          }
        } else {
          if (score > highScore) {
            highScore = score;
          }
          gameState = 'gameOver';
          break; // End checking once game is over
        }
      }
    } catch (error) {
      console.error("Error in asteroid-ship collision:", error);
    }
  }
}

function handlePowerups() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    try {
      let shouldRemove = false;
      
      if (typeof powerups[i].update === 'function') {
        shouldRemove = powerups[i].update();
      } else {
        shouldRemove = true; // Remove invalid powerups
      }
      
      if (shouldRemove) {
        powerups.splice(i, 1);
        continue;
      }
      
      // Check for powerup collection
      if (ship && powerups[i] && typeof ship.hits === 'function' && ship.hits(powerups[i])) {
        try {
          // Create collection particles
          for (let j = 0; j < 8; j++) {
            if (powerups[i] && powerups[i].color) {
              let pColor = [...powerups[i].color]; // Copy the color array
              particles.push(createParticle(powerups[i].x, powerups[i].y, pColor));
            }
          }
          
          // Apply powerup effect
          if (typeof powerups[i].apply === 'function') {
            powerups[i].apply(ship);
          }
          
          // Remove powerup
          powerups.splice(i, 1);
        } catch (error) {
          console.error("Error applying powerup:", error);
          powerups.splice(i, 1); // Remove problematic powerup
        }
      }
    } catch (error) {
      console.error("Error handling powerup:", error);
      powerups.splice(i, 1); // Remove problematic powerup
    }
  }
  
  // Occasionally spawn powerups (about 2% chance per frame when level > 1)
  if (level > 1 && powerups.length < 2 && random() < 0.002) {
    try {
      powerups.push(createPowerup());
    } catch (error) {
      console.error("Error creating random powerup:", error);
    }
  }
}

// Add a function to safely reset the game if it breaks
function emergencyReset() {
  // Clear any existing game objects
  asteroids = [];
  bullets = [];
  scraps = [];
  powerups = [];
  particles = [];
  
  // Reset variables
  level = 1;
  score = 0;
  nextLevelScore = 100;
  dashAvailable = true;
  dashCooldown = 0;
  isDashing = false;
  
  // Recreate the player ship
  ship = {
    x: width / 2,
    y: height - 50,
    size: 20,
    speed: 5,
    shield: 0,
    speedBoost: 0,
    rapidFire: 0,
    
    // ... rest of ship object methods
    display: function() {
      // Draw ship
      push();
      translate(this.x, this.y);
      
      // Draw ship body
      fill(0, 255, 150);
      stroke(0, 200, 100);
      strokeWeight(1);
      beginShape();
      vertex(0, -this.size/2); // Nose
      vertex(this.size/2, this.size/2); // Bottom right
      vertex(0, this.size/4); // Middle indent
      vertex(-this.size/2, this.size/2); // Bottom left
      endShape(CLOSE);
      
      // Add cockpit
      fill(100, 200, 255);
      ellipse(0, 0, this.size/3);
      
      pop();
    },
    
    move: function() {
      // Basic movement
      let currentSpeed = this.speed;
      
      if (moveLeft || keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= currentSpeed;
      if (moveRight || keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += currentSpeed;
      if (moveUp || keyIsDown(UP_ARROW) || keyIsDown(87)) this.y -= currentSpeed;
      if (moveDown || keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.y += currentSpeed;
      
      // Keep ship on screen
      this.x = constrain(this.x, this.size/2, width - this.size/2);
      this.y = constrain(this.y, this.size/2, height - this.size/2);
    },
    
    shoot: function() {
      if (millis() - lastShotTime > SHOT_COOLDOWN) {
        bullets.push({
          x: this.x,
          y: this.y - this.size/2,
          size: 5,
          speed: 10,
          
          update: function() {
            this.y -= this.speed;
            return this.y < 0;
          },
          
          display: function() {
            fill(255, 240, 100);
            noStroke();
            ellipse(this.x, this.y, this.size);
          },
          
          hits: function(obj) {
            let d = dist(this.x, this.y, obj.x, obj.y);
            return d < (this.size/2 + obj.size/2);
          }
        });
        
        lastShotTime = millis();
      }
    },
    
    dash: function() {
      if (!dashAvailable) return;
      
      // Set dash direction
      dashDirection = { x: 0, y: -1 }; // Default is up
      if (moveLeft) dashDirection.x = -1;
      if (moveRight) dashDirection.x = 1;
      if (moveUp) dashDirection.y = -1;
      if (moveDown) dashDirection.y = 1;
      
      // Start dashing
      isDashing = true;
      dashTimer = DASH_DURATION;
      dashAvailable = false;
      dashCooldown = DASH_COOLDOWN;
    },
    
    hits: function(obj) {
      if (!obj || typeof obj.x === 'undefined' || typeof obj.y === 'undefined') {
        return false;
      }
      
      let objSize = obj.size || 15;
      let d = dist(this.x, this.y, obj.x, obj.y);
      return d < (this.size/2 + objSize/2);
    }
  };
  
  // Create initial game objects
  for (let i = 0; i < 5; i++) {
    scraps.push(createScrap());
  }
  
  for (let i = 0; i < 3; i++) {
    asteroids.push(createAsteroid());
  }
  
  // Reset game state
  gameState = 'menu';
}

// Check if game is in a broken state and reset if needed
function checkGameState() {
  // Define conditions that indicate a broken game
  let gameIsBroken = false;
  
  // Check if ship exists
  if (!ship || typeof ship.x !== 'number' || typeof ship.y !== 'number') {
    gameIsBroken = true;
  }
  
  // Check if any arrays have invalid values
  if (asteroids.some(a => !a || typeof a.update !== 'function') ||
      bullets.some(b => !b || typeof b.update !== 'function') ||
      scraps.some(s => !s || typeof s.display !== 'function')) {
    gameIsBroken = true;
  }
  
  // Reset if game is broken
  if (gameIsBroken) {
    console.log("Game state corrupted, resetting...");
    emergencyReset();
  }
}

// Add home button function
function drawHomeButton() {
  // Button background
  fill(40, 60, 120);
  stroke(100, 150, 255);
  strokeWeight(1);
  rect(width - 55, 5, 40, 40, 5);
  
  // Home icon
  noStroke();
  fill(200, 220, 255);
  
  // Roof
  beginShape();
  vertex(width - 35, 12);
  vertex(width - 20, 20);
  vertex(width - 50, 20);
  endShape(CLOSE);
  
  // House body
  rect(width - 45, 20, 20, 20);
  
  // Door
  fill(40, 60, 120);
  rect(width - 38, 30, 6, 10);
}

function mouseWheel(event) {
  // Only handle scrolling in menu
  if (gameState === 'menu') {
    scrollY += event.delta * 0.5;
    scrollY = constrain(scrollY, 0, maxScrollY);
    return false; // Prevent default behavior
  }
}

function touchStarted() {
  if (gameState === 'menu') {
    touchStartY = mouseY;
    isScrolling = true;
    return false;
  }
}

function touchMoved() {
  if (gameState === 'menu' && isScrolling) {
    let deltaY = touchStartY - mouseY;
    scrollY += deltaY * 0.1;
    scrollY = constrain(scrollY, 0, maxScrollY);
    touchStartY = mouseY;
    return false;
  }
}

function touchEnded() {
  isScrolling = false;
}

function drawScrollIndicator() {
  // Draw scroll indicator at the bottom of the screen
  let indicatorPulse = sin(frameCount * 0.1) * 3;
  let scrollPercent = scrollY / maxScrollY;
  
  // Draw scroll track
  noStroke();
  fill(100, 100, 150, 80);
  rect(width - 15, 10, 5, height - 20, 5);
  
  // Draw scroll handle
  let handleHeight = max(30, (height - 20) * (height / (height + maxScrollY)));
  let handleY = 10 + (height - 20 - handleHeight) * scrollPercent;
  
  fill(150, 200, 255, 150 + indicatorPulse);
  rect(width - 15, handleY, 5, handleHeight, 5);
  
  // Draw down arrow indicator when at the top
  if (scrollY < 10 && maxScrollY > 10) {
    fill(255, 255, 255, 100 + indicatorPulse * 10);
    triangle(
      width/2, height - 20 + indicatorPulse,
      width/2 - 10, height - 30 + indicatorPulse,
      width/2 + 10, height - 30 + indicatorPulse
    );
  }
  
  // Draw up arrow indicator when at the bottom
  if (scrollY > maxScrollY - 10 && maxScrollY > 10) {
    fill(255, 255, 255, 100 + indicatorPulse * 10);
    triangle(
      width/2, 20 - indicatorPulse,
      width/2 - 10, 30 - indicatorPulse,
      width/2 + 10, 30 - indicatorPulse
    );
  }
}

// Mouse interaction function with home button and scrolling support
function mousePressed() {
  if (gameState === 'menu') {
    // Only start the game if we're not in the middle of scrolling
    if (!isScrolling) {
      startPlaying();
    }
  } else if (gameState === 'gameOver' || gameState === 'victory') {
    resetGame();
    startPlaying();
  } else if (gameState === 'playing') {
    // Check if home button is clicked
    if (mouseX > width - 55 && mouseX < width - 15 && mouseY > 5 && mouseY < 45) {
      gameState = 'menu';
      // Save high score if current score is higher
      if (score > highScore) {
        highScore = score;
      }
      scrollY = 0; // Reset scroll position
      return false;
    }
  }
  
  // Start tracking for possible scrolling
  if (gameState === 'menu') {
    touchStartY = mouseY;
    isScrolling = true;
  }
  return true;
}

// Update mouseDragged to handle scrolling
function mouseDragged() {
  if (gameState === 'menu' && isScrolling) {
    let deltaY = touchStartY - mouseY;
    scrollY += deltaY * 0.5;
    scrollY = constrain(scrollY, 0, maxScrollY);
    touchStartY = mouseY;
    return false;
  }
  return true;
}

function mouseReleased() {
  isScrolling = false;
  return true;
}
