import { checkCollision, playSound, spawnParticles, updateScore } from './utils.js';

// Handle player-platform collisions
export function handlePlayerPlatformCollision(player, platforms, particles) {
    let groundedOnThisFrame = false;
    let landedOnPlatform = false;

    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Set player grounded state and position
            groundedOnThisFrame = true;
            player.grounded = true;
            player.y = platform.y - player.height;
            player.dy = 0;

            // Handle moving platforms
            if (platform.movementType === 'horizontal') {
                player.x += platform.speed;
            }

            // Limit particle generation for vertical platforms
            if (platform.movementType !== 'vertical' || Math.abs(platform.speed) < 0.1) {
                if (!player.wasGrounded && !landedOnPlatform) {
                    particles.push(...spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 'hsl(60, 100%, 50%)', 20));
                    playSound('audio/landing_sound.wav');
                    landedOnPlatform = true;
                }
            }
        }
    });

    // Update player's grounded state
    player.wasGrounded = player.grounded;
    player.grounded = groundedOnThisFrame;
}

// Handle player-pickup collisions
export function handlePlayerPickupCollision(player, pickups) {
    pickups.forEach(pickup => {
        if (!pickup.collected && checkCollision(player, pickup)) {
            // Mark pickup as collected
            pickup.collected = true;

            // Update score
            updateScore(player.score += 10);

            // Play pickup sound
            playSound('audio/pickup_sound.wav');

            // Generate pickup particles
            spawnParticles(pickup.x + pickup.width / 2, pickup.y - pickup.height, 'hsl(120, 100%, 50%)', 20);
        }
    });
}
