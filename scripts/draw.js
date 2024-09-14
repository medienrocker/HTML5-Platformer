// Draw the player on the canvas
export function drawPlayer(player, ctx) {
    const currentImage = player.blinking ? player.blinkImage : player.image;
    ctx.drawImage(
        currentImage,
        player.x,
        player.y - player.breathOffset,
        player.width,
        player.height + player.breathOffset * 2
    );
}

// Draw all platforms on the canvas
export function drawPlatforms(platforms, ctx) {
    platforms.forEach(platform => {
        // Check if the platform should glow
        if (platform.isGlowing) {
            ctx.fillStyle = '#fa3d3d';  // Glowing red color
            ctx.shadowColor = '#fa3d3d';
            ctx.shadowBlur = 20;
        } else if (platform.isSpecial) {
            ctx.fillStyle = '#0fb0d7';  // Glowing blue color
            ctx.shadowColor = '#0fb0d7';
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = '#f7fe89';  // Default platform color
            ctx.shadowBlur = 0;  // Reset shadow
        }
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

// Draw all pickups on the canvas
export function drawPickups(pickups, ctx) {
    pickups.forEach(pickup => {
        if (!pickup.collected) {
            ctx.drawImage(pickup.image, pickup.x, pickup.y + pickup.offsetY, pickup.width, pickup.height);
        }
    });
}

// Draw all particles on the canvas
export function drawParticles(particles, ctx) {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;  // Reset global alpha
    });
}
