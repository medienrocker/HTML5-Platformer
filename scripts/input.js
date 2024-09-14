export function handleKeyDown(event, player) {
    console.log('Key down:', event.key);
    switch (event.key) {
        case 'ArrowLeft':
            player.dx = -player.speed;
            break;
        case 'ArrowRight':
            player.dx = player.speed;
            break;
        case 'ArrowUp':
        case ' ':
            jump(player);
            break;
    }
    console.log('Player dx after keydown:', player.dx, 'Player dy after keydown:', player.dy);
}

export function handleKeyUp(event, player) {
    console.log('Key up:', event.key);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        player.dx = 0;
    }
    console.log('Player dx after keyup:', player.dx);
}

// Jump logic for the player
function jump(player) {
    if (player.grounded && !player.jumping) {
        player.dy = -player.jumpStrength;
        player.jumping = true;
        player.grounded = false;
        console.log('Jumping: player.dy:', player.dy);
        playSound('audio/jump_sound2.wav');
    }
}
