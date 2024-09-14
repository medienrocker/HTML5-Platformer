// Utility function to check collision between two rectangular entities
export function checkCollision(entity1, entity2) {
    return (
        entity1.x < entity2.x + entity2.width &&
        entity1.x + entity1.width > entity2.x &&
        entity1.y < entity2.y + entity2.height &&
        entity1.y + entity1.height > entity2.y
    );
}

// Utility function to play a sound
export function playSound(filename) {
    const sound = new Audio(filename);
    sound.currentTime = 0;
    sound.play().catch(error => console.error("Error playing sound:", error));
}

// Utility function to spawn particles
export function spawnParticles(x, y, color = 'hsl(0, 100%, 50%)', amount = 20, sizeRange = [3, 8], speedRange = [-1.5, 1.5], life = 40) {
    const particles = [];
    for (let i = 0; i < amount; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
            speedX: Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0],
            speedY: Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0],
            color: color,
            life: life,
        });
    }
    return particles;
}

// Utility function to update score display
export function updateScore(score) {
    document.getElementById('score').textContent = 'Score: ' + score;
}
