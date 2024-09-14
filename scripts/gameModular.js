import { checkCollision, playSound, updateScore } from './utils.js'; // Removed spawnParticles from here
import { handlePlayerPlatformCollision, handlePlayerPickupCollision } from './collision.js';
import { movePlatforms } from './platform.js';
import { handleKeyDown, handleKeyUp } from './input.js';
import { updatePlayerAnimation } from './animation.js';
import { drawPlayer, drawPlatforms, drawPickups, drawParticles } from './draw.js';
import { gameData, initializeGameData } from './gameData.js';
import { spawnParticles, updateParticles } from './particles.js'; // Import from particles.js

// Set up the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 512;
canvas.height = 512;

// Initialize game state
function initializeGame() {
    initializeGameData(canvas.width, canvas.height);  // Pass canvas dimensions

    updateScore(gameData.player.score); // Initialize score display
}

// Main game loop
function update() {
    // Log player position before movement
    console.log('Player position before update:', gameData.player.x, gameData.player.y);

    // Update player position based on velocity
    gameData.player.x += gameData.player.dx;
    gameData.player.y += gameData.player.dy;

    // Apply gravity to player
    if (!gameData.player.grounded) {
        gameData.player.dy += 0.5; // Gravity value
    }

    // Log player position after movement
    console.log('Player position after update:', gameData.player.x, gameData.player.y);

    // Handle platform collisions
    handlePlayerPlatformCollision(gameData.player, gameData.platforms, gameData.particles);

    // Handle pickup collisions
    handlePlayerPickupCollision(gameData.player, gameData.pickups);

    // Move platforms
    movePlatforms(gameData.platforms);

    // Update animations and particles
    updatePlayerAnimation(gameData.player);
    updateParticles(gameData.particles);

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlatforms(gameData.platforms, ctx);
    drawPickups(gameData.pickups, ctx);
    drawPlayer(gameData.player, ctx);
    drawParticles(gameData.particles, ctx);
}



function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

initializeGame();
//gameLoop();

// Event listeners
document.addEventListener('keydown', (event) => handleKeyDown(event, gameData.player));
document.addEventListener('keyup', (event) => handleKeyUp(event, gameData.player));
