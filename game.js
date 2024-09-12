window.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Ensure canvas size matches HTML
    canvas.width = 512;
    canvas.height = 512;

    //Init mouse Pos
    let mouseX = 0;
    let mouseY = 0;
    let isPlacingPlatform = false;
    let newPlatformWidth = 100;
    let newPlatformHeight = 4;

    const gravity = 0.5;
    let score = 0;
    const player = {
        x: 50,
        y: 400,
        width: 32,
        height: 32,
        dx: 0,
        dy: 0,
        speed: 2.5,
        jumpStrength: 12,
        jumping: false,
        grounded: false,
        image: new Image(),
    };

    const platforms = [
        { x: 0, y: canvas.height - 14, width: canvas.width, height: 4 }, // Bottom platform
        { x: 115, y: 464, width: 123, height: 4 },
        { x: 294, y: 464, width: 217, height: 4 },
        { x: 319, y: 428, width: 192, height: 4 },
        { x: 0, y: 428, width: 184, height: 4 },
        { x: 0, y: 365, width: 184, height: 4 },
        { x: 400, y: 366, width: 112, height: 4 },
        { x: 425, y: 326, width: 87, height: 4 },
        { x: 0, y: 242, width: 53, height: 4 },
        { x: 225, y: 200, width: 70, height: 8 },
        { x: 274, y: 74, width: 100, height: 4 },
        { x: 85, y: 122, width: 100, height: 4 },
    ];

    const pickups = [
        { x: 150, y: 380, width: 15, height: 15, collected: false, image: new Image() },
        { x: 350, y: 280, width: 15, height: 15, collected: false, image: new Image() },
        { x: 50, y: 180, width: 15, height: 15, collected: false, image: new Image() },
        { x: 250, y: 180, width: 15, height: 15, collected: false, image: new Image() },
        { x: 250, y: 160, width: 15, height: 15, collected: false, image: new Image() }
    ];

    player.image.src = 'character1.png';
    pickups.forEach(pickup => pickup.image.src = 'pickup1.png');

    function drawPlayer() {
        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    }

    function drawPlatforms() {
        ctx.fillStyle = '#f7fe89'; // '#f7fe89'; // A light green color for platforms
        platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    function drawPickups() {
        pickups.forEach(pickup => {
            if (!pickup.collected) {
                ctx.drawImage(pickup.image, pickup.x, pickup.y, pickup.width, pickup.height);
            }
        });
    }

    function updateScore() {
        document.getElementById('score').textContent = 'Score: ' + score;
    }

    function update() {
        player.dy += gravity;

        player.x += player.dx;
        player.y += player.dy;

        // Reset grounded state
        player.grounded = false;

        // Check collision with platforms
        platforms.forEach(platform => {
            if (player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + player.dy &&
                player.x + player.width > platform.x &&
                player.x < platform.x + platform.width) {
                player.grounded = true;
                player.y = platform.y - player.height;
                player.dy = 0;
            }
        });

        // Check if player is at the bottom of the canvas
        if (player.y + player.height >= canvas.height) {
            player.grounded = true;
            player.y = canvas.height - player.height;
            player.dy = 0;
        }

        // Reset jumping state when grounded
        if (player.grounded) {
            player.jumping = false;
        }

        // Handle pickup collection
        pickups.forEach(pickup => {
            if (!pickup.collected && player.y + player.height > pickup.y &&
                player.y < pickup.y + pickup.height &&
                player.x + player.width > pickup.x &&
                player.x < pickup.x + pickup.width) {
                pickup.collected = true;
                score += 10;
                updateScore();
            }
        });

        // Boundary checking
        player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
        player.y = Math.min(player.y, canvas.height - player.height);

        // Clear and redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlatforms();
        drawPickups();
        drawPlayer();

        // Draw debug info
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText(`Grounded: ${player.grounded}`, 10, 20);
        ctx.fillText(`Jumping: ${player.jumping}`, 10, 40);
        ctx.fillText(`Y Velocity: ${player.dy.toFixed(2)}`, 10, 60);
        ctx.fillText(`Mouse: (${mouseX}, ${mouseY})`, 10, 80);
        ctx.fillText(`Placing Platform: ${isPlacingPlatform}`, 4, 100);
    }

    //  handle mouse movement
    function updateMousePosition(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = Math.round(e.clientX - rect.left);
        mouseY = Math.round(e.clientY - rect.top);
    }


    // Press P to enter / exit plattform creation mode [use console of developer Tool in browser]
    function togglePlatformPlacement() {
        isPlacingPlatform = !isPlacingPlatform;
    }

    function addPlatform(x, y) {
        const newPlatform = { x, y, width: newPlatformWidth, height: newPlatformHeight };
        platforms.push(newPlatform);
        console.log(`New platform added: { x: ${x}, y: ${y}, width: ${newPlatformWidth}, height: ${newPlatformHeight} },`);
        console.log('Updated platforms array:');
        console.log('const platforms = [');
        platforms.forEach(platform => {
            console.log(`    { x: ${platform.x}, y: ${platform.y}, width: ${platform.width}, height: ${platform.height} },`);
        });
        console.log('];');
    }

    function handleCanvasClick(e) {
        if (isPlacingPlatform) {
            addPlatform(mouseX, mouseY);
        }
    }

    // Add event listeners
    canvas.addEventListener('mousemove', updateMousePosition);
    canvas.addEventListener('click', handleCanvasClick);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            togglePlatformPlacement();
        }
    });

    function moveLeft() {
        player.dx = -player.speed;
    }

    function moveRight() {
        player.dx = player.speed;
    }

    function jump() {
        if (player.grounded && !player.jumping) {
            player.dy = -player.jumpStrength;
            player.jumping = true;
            player.grounded = false;
        }
    }

    function keyDownHandler(e) {
        switch (e.key) {
            case 'ArrowLeft':
                moveLeft();
                break;
            case 'ArrowRight':
                moveRight();
                break;
            case 'ArrowUp':
            case ' ':
                jump();
                break;
        }
    }

    function keyUpHandler(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            player.dx = 0;
        }
    }

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    function gameLoop() {
        update();
        requestAnimationFrame(gameLoop);
    }

    updateScore();
    gameLoop();
});