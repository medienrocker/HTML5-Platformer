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

    // Coyote time and jump force variables / const
    const COYOTE_TIME = 100; // milliseconds
    const MIN_JUMP_STRENGTH = 6;
    const MAX_JUMP_STRENGTH = 12;
    let lastGroundedTime = 0;
    let jumpButtonHeld = false;

    // Debug variables
    let debugLastGroundedState = false;
    let debugGroundedStateChangeCount = 0;
    let debugLastUpdateTime = 0;

    const gravity = 0.5;
    let score = 0;

    // Player object with properties and images
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

    // Platforms array
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
        // Moving platforms below
        {
            x: 100, y: 300, width: 100, height: 4,
            movementType: 'horizontal',
            speed: 0.5,
            leftBound: 50,
            rightBound: 300
        },
        {
            x: 400, y: 200, width: 100, height: 4,
            movementType: 'vertical',
            speed: 0.5,
            upperBound: 150,
            lowerBound: 250
        }
    ];

    // Pickups array
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
            this.size = Math.random() * 6 + 3;
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 3 - 1.5;
            this.color = `hsl(${Math.random() * 60 + 0}, 100%, 50%)`; // reddish particles
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

    // Player animation for breathing and blinking
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
        } else if (Math.random() < 0.002) {
            player.blinking = true;
            player.blinkTimer = 20;
        }
    }

    // Draw the player with breath and blink animations
    function drawPlayer() {
        const currentImage = player.blinking ? player.blinkImage : player.image;
        ctx.drawImage(
            currentImage,
            player.x,
            player.y - player.breathOffset,
            player.width,
            player.height + player.breathOffset * 2
        );
    }

    // Platform drawing
    function drawPlatforms() {
        ctx.fillStyle = '#f7fe89';
        platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    // Platform movement update
    function updatePlatforms() {
        platforms.forEach(platform => {
            if (platform.movementType === 'horizontal') {
                platform.x += platform.speed;
                if (platform.x <= platform.leftBound || platform.x + platform.width >= platform.rightBound) {
                    platform.speed *= -1;
                }
            } else if (platform.movementType === 'vertical') {
                platform.y += platform.speed;
                if (platform.y <= platform.upperBound || platform.y >= platform.lowerBound) {
                    platform.speed *= -1;
                }
            }
        });
    }

    // Update and draw pickups with animation
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

    // Update the score display
    function updateScore() {
        document.getElementById('score').textContent = 'Score: ' + score;
    }

    // Sound playback for pickup collection
    function playPickupSound() {
        pickupSound.currentTime = 0;
        pickupSound.play().catch(error => console.error("Error playing sound:", error));
    }

    // Ground collision detection
    function checkGroundCollision(player, platforms) {
        let standingPlatform = null;
        let minIntersection = Infinity;

        platforms.forEach(platform => {
            if (player.x + player.width > platform.x && player.x < platform.x + platform.width) {
                const intersection = player.y + player.height - platform.y;
                if (player.y + player.height >= platform.y && player.y + player.height <= platform.y + platform.height) {
                    if (intersection < minIntersection) {
                        minIntersection = intersection;
                        standingPlatform = platform;
                    }
                }
            }
        });

        if (standingPlatform) {
            player.grounded = true;
            player.y = standingPlatform.y - player.height;
            player.dy = 0;
            if (standingPlatform.movementType === 'horizontal') {
                player.x += standingPlatform.speed;
            }
        } else {
            player.grounded = false;
        }
    }

    // Handle player jump, with coyote time
    function canJump(timestamp) {
        return player.grounded || (timestamp - lastGroundedTime <= COYOTE_TIME);
    }

    function jump(timestamp) {
        if (canJump(timestamp)) {
            player.dy = -MAX_JUMP_STRENGTH;
            player.jumping = true;
            player.grounded = false;
            lastGroundedTime = 0; // Reset the coyote time
        }
    }

    // Main update function
    function update(timestamp) {
        const deltaTime = timestamp - debugLastUpdateTime;
        debugLastUpdateTime = timestamp;

        if (player.grounded) {
            lastGroundedTime = timestamp;
        }

        updatePlatforms();
        checkGroundCollision(player, platforms);

        if (!player.grounded) {
            player.dy += gravity;
        }

        player.x += player.dx;
        player.y += player.dy;

        if (player.y + player.height > canvas.height) {
            player.grounded = true;
            player.y = canvas.height - player.height;
            player.dy = 0;
        }

        if (player.jumping && !jumpButtonHeld && player.dy < -MIN_JUMP_STRENGTH) {
            player.dy = -MIN_JUMP_STRENGTH;
        }

        pickups.forEach(pickup => {
            if (!pickup.collected && player.y + player.height > pickup.y &&
                player.y < pickup.y + pickup.height &&
                player.x + player.width > pickup.x &&
                player.x < pickup.x + pickup.width) {
                pickup.collected = true;
                score += 10;
                updateScore();
                playPickupSound();
                createParticles(pickup.x + pickup.width / 2, pickup.y + pickup.height / 2);
            }
        });

        player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
        player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));

        if (player.grounded !== debugLastGroundedState) {
            debugGroundedStateChangeCount++;
            debugLastGroundedState = player.grounded;
        }

        updatePlayerAnimation();
        updatePickups();
        updateParticles();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlatforms();
        drawPickups();
        drawPlayer();
        drawParticles();

        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText(`Grounded: ${player.grounded}`, 10, 20);
        ctx.fillText(`Jumping: ${player.jumping}`, 10, 40);
        ctx.fillText(`Y Velocity: ${player.dy.toFixed(2)}`, 10, 60);
        ctx.fillText(`Mouse: (${mouseX}, ${mouseY})`, 10, 80);
        ctx.fillText(`Placing Platform: ${isPlacingPlatform}`, 10, 100);
        ctx.fillText(`Grounded State Changes: ${debugGroundedStateChangeCount}`, 10, 120);
        ctx.fillText(`Delta Time: ${deltaTime.toFixed(2)}`, 10, 140);
    }

    // Mouse and platform placement logic
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
        console.log(`New platform added at (${x}, ${y})`);
    }

    function handleCanvasClick(e) {
        if (isPlacingPlatform) {
            addPlatform(mouseX, mouseY);
        }
    }

    // Movement controls
    function moveLeft() {
        player.dx = -player.speed;
    }

    function moveRight() {
        player.dx = player.speed;
    }

    // Event handlers
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
                jump(performance.now());
                jumpButtonHeld = true;
                break;
        }
    }

    function keyUpHandler(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            player.dx = 0;
        }
        if (e.key === 'ArrowUp' || e.key === ' ') {
            jumpButtonHeld = false;
        }
    }

    canvas.addEventListener('mousemove', updateMousePosition);
    canvas.addEventListener('click', handleCanvasClick);
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    function gameLoop(timestamp) {
        update(timestamp);
        requestAnimationFrame(gameLoop);
    }

    updateScore();
    requestAnimationFrame(gameLoop);
});
