// Spawns particles at a given position
export function spawnParticles(x, y, color = 'hsl(0, 100%, 50%)', count = 20) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 3,
            speedX: Math.random() * 3 - 1.5,
            speedY: Math.random() * 3 - 1.5,
            color: color,
            life: 40,
        });
    }
    return particles;
}

// Update particles state
export function updateParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.size *= 0.95;
        particle.life--;

        // Remove particle if its life is over
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}
