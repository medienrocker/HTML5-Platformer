window.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Ensure canvas size matches HTML
    canvas.width = 512;
    canvas.height = 512;

    //Init variables
    let mouseX = 0;
    let mouseY = 0;
    let isPlacingPlatform = false;
    let newPlatformWidth = 100;
    let newPlatformHeight = 4;
    const pickupSound = new Audio('pickup_sound.wav');
    pickupSound.volume = 0.3;

    // Anim vars
    let pickupAnimationTime = 0;
    let playerAnimationTime = 0;
    const pickupAnimationSpeed = 0.03;
    const pickupAnimationAmplitude = 2.5;
    const playerBreathSpeed = 0.02;
    const playerBreathAmplitude = 0.8;

    const gravity = 0.5;
    let score = 0;
    const player = {
        x: 50,
        y: 400,
        width: 32,
        height: 32,
        dx: 0,
        dy: 0,
        speed: 5,
        jumpStrength: 12,
        jumping: false,
        grounded: false,
        image: new Image(),
        blinkImage: new Image(),
        breathOffset: 0,
        blinkTimer: 0,
        blinking: false,
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
        { x: 15, y: 390, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0 },
        { x: 350, y: 50, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0 },
        { x: 50, y: 180, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0 },
        { x: 250, y: 180, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0 },
        { x: 250, y: 160, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0 }
    ];

    // Reference to the used images (Player & pickups)
    player.image.src = 'character1.png';
    player.blinkImage.src = 'character1_blink.png';
    pickups.forEach(pickup => pickup.image.src = 'pickup1.png');

    // Particle system
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 5 + 3;
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 3 - 1.5;
            //this.color = `hsl(${Math.random() * 60 + 180}, 100%, 50%)`; // blueish particles
            //this.color = `hsl(${Math.random() * 60 + 90}, 100%, 50%)`; // greenish particles
            this.color = `hsl(${Math.random() * 60 + 0}, 100%, 50%)`; // redish particles
            this.life = 30;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.size *= 0.95;
            this.life--;
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life / 30;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    let particles = [];

    function createParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(x, y));
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        particles.forEach(particle => particle.draw(ctx));
    }

    // Make Player breath and blink
    function updatePlayerAnimation() {
        // Breathing
        playerAnimationTime += playerBreathSpeed;
        player.breathOffset = Math.sin(playerAnimationTime) * playerBreathAmplitude;

        // Blinking
        if (player.blinking) {
            player.blinkTimer--;
            if (player.blinkTimer <= 0) {
                player.blinking = false;
            }
        } else if (Math.random() < 0.002) { // 0.2% chance each frame
            player.blinking = true;
            player.blinkTimer = 20; // Blink for 20 frames
        }
    }

    function drawPlayer() {
        const currentImage = player.blinking ? player.blinkImage : player.image;
        ctx.drawImage(
            currentImage,
            player.x,
            player.y - player.breathOffset, // Subtract to move up
            player.width,
            player.height + player.breathOffset * 2 // Increase height slightly
        );
    }

    function drawPlatforms() {
        ctx.fillStyle = '#f7fe89'; // A light green color for platforms
        platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    function updatePickups() {
        pickupAnimationTime += pickupAnimationSpeed;
        pickups.forEach(pickup => {
            if (!pickup.collected) {
                pickup.offsetY = Math.sin(pickupAnimationTime) * pickupAnimationAmplitude;
            }
        });
    }

    function drawPickups() {
        pickups.forEach(pickup => {
            if (!pickup.collected) {
                ctx.drawImage(pickup.image, pickup.x, pickup.y + pickup.offsetY, pickup.width, pickup.height);
            }
        });
    }

    function updateScore() {
        document.getElementById('score').textContent = 'Score: ' + score;
    }

    // play Sound on pickup
    function playPickupSound() {
        pickupSound.currentTime = 0; // Reset the audio to the start
        pickupSound.play().catch(error => console.error("Error playing sound:", error));
    }

    // MAIN UPDATE FUNCTION
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
                playPickupSound(); // Play sound when pickup is collected
                createParticles(pickup.x + pickup.width / 2, pickup.y + pickup.height / 2);
            }
        });

        // Boundary checking
        player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
        player.y = Math.min(player.y, canvas.height - player.height);

        updatePlayerAnimation();
        updatePickups();
        updateParticles();

        // Clear and redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlatforms();
        drawPickups();
        drawPlayer();
        drawParticles();

        // Draw debug info
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText(`Grounded: ${player.grounded}`, 10, 20);
        ctx.fillText(`Jumping: ${player.jumping}`, 10, 40);
        ctx.fillText(`Y Velocity: ${player.dy.toFixed(2)}`, 10, 60);
        ctx.fillText(`Mouse: (${mouseX}, ${mouseY})`, 10, 80);
        ctx.fillText(`Placing Platform: ${isPlacingPlatform}`, 4, 100);
    }

    function updateMousePosition(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = Math.round(e.clientX - rect.left);
        mouseY = Math.round(e.clientY - rect.top);
    }

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