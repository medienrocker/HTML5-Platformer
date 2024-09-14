// Update player animations for breathing and blinking
export function updatePlayerAnimation(player) {
    // Breathing
    player.animationTime += player.breathSpeed;
    player.breathOffset = Math.sin(player.animationTime) * player.breathAmplitude;

    // Blinking
    if (player.blinking) {
        player.blinkTimer--;
        if (player.blinkTimer <= 0) {
            player.blinking = false;
        }
    } else if (Math.random() < 0.002) {
        player.blinking = true;
        player.blinkTimer = 20;
    }
}
