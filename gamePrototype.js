window.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const startButton = document.getElementById('startButton');

    // Ensure canvas size matches HTML
    canvas.width = 512;
    canvas.height = 512;

    // Init variables
    let mouseX = 0;
    let mouseY = 0;
    let isPlacingPlatform = false;
    let newPlatformWidth = 100;
    let newPlatformHeight = 4;
    let lastLandingTime = 0;  // Initialize the last landing sound play time
    let wasGrounded = false;  // Track if the player was grounded in the previous frame

    // Audio for jump and landing
    const jumpSound = new Audio('./audio/jump_sound2.wav');
    const landingSound = new Audio('./audio/landing_sound.wav');
    const pickupSound = new Audio('./audio/pickup_sound.wav');

    // Different kinds of pickups
    const pickupImages = {
        'red': './images/pickup_red.png',
        'blue': './images/pickup_blue.png',
        'star': './images/pickup_star.png',
        // Add more types and their corresponding image paths as needed
    }

    // Set volumes
    jumpSound.volume = 0.15;
    landingSound.volume = 0.3;
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
        speed: 2,
        jumpStrength: 12,
        jumping: false,
        grounded: false,
        image: new Image(),
        blinkImage: new Image(),
        breathOffset: 0,
        blinkTimer: 0,
        blinking: false,
        spawned: false
    };

    const platforms = [
        { x: 0, y: canvas.height - 14, width: canvas.width, height: 4 }, // Bottom platform
        { x: 115, y: 464, width: 123, height: 4, movementType: 'static', tag: '' },
        { x: 294, y: 464, width: 217, height: 4, movementType: 'static', tag: '' },
        { x: 319, y: 428, width: 192, height: 4, movementType: 'static', tag: '' },
        { x: 0, y: 428, width: 184, height: 4, movementType: 'static', tag: '' },
        { x: 0, y: 365, width: 184, height: 4, movementType: 'static', tag: '' },
        { x: 400, y: 366, width: 112, height: 4, movementType: 'static', tag: '' },
        { x: 425, y: 326, width: 87, height: 4, movementType: 'static', tag: '' },
        { x: 0, y: 242, width: 53, height: 4, movementType: 'static', tag: '' },
        { x: 220, y: 230, width: 70, height: 8, movementType: 'static', tag: '' },
        //{ x: 274, y: 74, width: 100, height: 6, movementType: 'static', tag: '' },
        //{ x: 85, y: 122, width: 100, height: 6, movementType: 'static', tag: '' },
        // Moving platforms
        {
            x: 274, y: 70, width: 80, height: 6,
            movementType: 'horizontal', tag: 'special',
            speed: 0.5,
            leftBound: 160,
            rightBound: 400
        },
        {
            x: 400, y: 200, width: 80, height: 6,
            movementType: 'vertical', tag: 'special',
            speed: 0.5,
            upperBound: 150,
            lowerBound: 250
        }
    ];

    const pickups = [
        { x: 15, y: 390, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0, type: 'red' },
        { x: 180, y: 27, width: 30, height: 30, collected: false, image: new Image(), offsetY: 0, type: 'star' },
        { x: 50, y: 180, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0, type: 'red' },
        { x: 250, y: 180, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0, type: 'red' },
        { x: 250, y: 160, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0, type: 'red' },
        { x: 350, y: 330, width: 15, height: 15, collected: false, image: new Image(), offsetY: 0, type: 'red' }
    ];

    // Reference to the used images (Player & pickups)
    player.image.src = './images/character1.png';
    player.blinkImage.src = './images/character1_blink.png';

    // generating the pickups
    pickups.forEach(pickup => {
        if (pickup.type in pickupImages) {
            pickup.image.src = pickupImages[pickup.type];
        } else {
            console.warn(`No image defined for pickup type: ${pickup.type}. Using default.`);
            pickup.image.src = './images/pickup_default.png';
        }
    });

    // Particle system
    class Particle {
        constructor(x, y, type = 'normal') {
            this.x = x;
            this.y = y;
            this.type = type;

            if (this.type === 'dust') {
                this.size = Math.random() * 5 + 3;  // Increased size for dust
                this.speedX = Math.random() * 6 - 3;  // Wider horizontal spread (-3 to 3)
                this.speedY = Math.random() * 0.5 - 0.25;  // Minimal vertical movement (-0.25 to 0.25)
                this.color = `hsl(0, 0%, ${Math.random() * 20 + 70}%)`;  // Lighter shades of gray
                this.life = 30 + Math.random() * 20;  // Longer life for more visible effect
            } else {
                this.size = Math.random() * 5 + 3;
                this.speedX = Math.random() * 3 - 1.5;
                this.speedY = Math.random() * 3 - 1.5;
                this.color = `hsl(${Math.random() * 60 + 0}, 100%, 50%)`; // reddish particles
                this.life = 40;
            }
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.type === 'dust') {
                this.size *= 0.97;  // Slower size reduction for dust
                this.speedX *= 0.95;  // Gradually slow down horizontal movement
                this.speedY += 0.02;  // Very slight gravity effect
            } else {
                this.size *= 0.95;
                this.life--;
            }
            this.life--;
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life / (this.type === 'dust' ? 20 : 30);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    let particles = [];

    function createParticles(x, y, type = 'normal') {
        const count = type === 'dust' ? 10 : 20;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, type));
        }
    }

    // little gray dust particles if Player lands on platform
    function createDustParticles(x, y) {
        const particleCount = 10;  // Increase number of particles
        const spreadX = 10;  // Horizontal spread

        for (let i = 0; i < particleCount; i++) {
            const offsetX = Math.random() * spreadX - spreadX / 2;
            const particleX = x + offsetX;
            particles.push(new Particle(particleX, y, 'dust'));
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
        } else if (Math.random() < 0.002) {
            player.blinking = true;
            player.blinkTimer = 20;
        }
    }

    function drawPlayer() {
        if (player.spawned) {
            const currentImage = player.blinking ? player.blinkImage : player.image;
            ctx.drawImage(
                currentImage,
                player.x,
                player.y - player.breathOffset,
                player.width,
                player.height + player.breathOffset * 2
            );
        }
    }

    function drawPlatforms() {
        ctx.fillStyle = '#f7fe89'; // A light green color for platforms
        platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

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

    function updatePickups() {
        pickupAnimationTime += pickupAnimationSpeed;
        pickups.forEach(pickup => {
            if (!pickup.collected) {
                switch (pickup.type) {
                    case 'star':
                        let t = (pickupAnimationTime * 0.16) % 1;
                        pickup.scaleX = t <= 0.5 ? t * 2 : 2 - t * 2;
                        // Change this line:
                        //pickup.flipped = t > 0.9 || t < 0.1; // Flip when t is in the second half of the cycle
                        break;
                    case 'default':
                    default:
                        pickup.offsetY = Math.sin(pickupAnimationTime) * pickupAnimationAmplitude;
                        break;
                }
            }
        });
    }

    function drawPickups() {
        pickups.forEach(pickup => {
            if (!pickup.collected) {
                ctx.save();
                ctx.translate(pickup.x + pickup.width / 2, pickup.y + pickup.height / 2);

                if (pickup.type === 'star') {
                    let scaleX = 0.0 + pickup.scaleX * 1; // This makes it scale from 0.5 to 1

                    if (pickup.flipped) {
                        scaleX = -scaleX;
                    }

                    ctx.scale(scaleX, 1);
                } else {
                    ctx.translate(0, pickup.offsetY || 0);
                }

                ctx.drawImage(
                    pickup.image,
                    -pickup.width / 2, -pickup.height / 2,
                    pickup.width, pickup.height
                );
                ctx.restore();
            }
        });
    }

    function updateScore() {
        document.getElementById('score').textContent = 'Score: ' + score;
    }

    // play Sound on pickup
    function playPickupSound() {
        pickupSound.currentTime = 0;
        pickupSound.play().catch(error => console.error("Error playing sound:", error));
    }

    // MAIN UPDATE FUNCTION
    function update() {
        // Reset grounded state
        let groundedOnThisFrame = false;  // Make sure this variable is reset at the start of every frame

        if (player.spawned) {
            player.dy += gravity;
            player.x += player.dx;
            player.y += player.dy;
        }

        // Move platforms
        updatePlatforms();

        // Check collision with platforms
        platforms.forEach(platform => {
            if (player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + player.dy &&
                player.x + player.width > platform.x &&
                player.x < platform.x + platform.width) {

                groundedOnThisFrame = true;  // Set this to true when the player is grounded

                player.grounded = true;
                player.y = platform.y - player.height;
                player.dy = 0;

                // Move player with horizontal platform
                if (platform.movementType === 'horizontal') {
                    player.x += platform.speed;
                }
            }
        });

        // Play landing sound and create dust if player transitions from air to grounded
        if (!wasGrounded && groundedOnThisFrame) {
            playLandingSound();
            // Create dust at the player's feet
            const dustY = player.y + player.height;
            createDustParticles(player.x, dustY);  // Left foot
            createDustParticles(player.x + player.width, dustY);  // Right foot
        }

        // Set wasGrounded for the next frame
        wasGrounded = groundedOnThisFrame;

        // Check if player is at the bottom of the canvas
        if (player.y + player.height >= canvas.height) {
            groundedOnThisFrame = true;  // This also needs to set groundedOnThisFrame to true
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
                playPickupSound();
                createParticles(pickup.x + pickup.width / 2, pickup.y - pickup.height);
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
        //drawDebugInfoOnCanvas()
    }

    function drawDebugInfoOnCanvas() {
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
    }

    function handleCanvasClick(e) {
        if (isPlacingPlatform) {
            addPlatform(mouseX, mouseY);
        }
    }

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
            jumpSound.currentTime = 0; // Reset the sound
            jumpSound.play();
        }
    }

    function playLandingSound() {
        const currentTime = performance.now();  // Get the current time

        // Check if 200ms (0.2 seconds) have passed since the last landing sound
        if (currentTime - lastLandingTime >= 200) {
            landingSound.currentTime = 0;  // Reset the sound
            landingSound.play();
            lastLandingTime = currentTime;  // Update the last landing time
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

    // Add event listeners
    canvas.addEventListener('mousemove', updateMousePosition);
    canvas.addEventListener('click', handleCanvasClick);
    startButton.addEventListener('click', startGame);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            togglePlatformPlacement();
        }
    });
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    function gameLoop() {
        update();
        requestAnimationFrame(gameLoop);
    }

    // Start game function
    function startGame() {
        player.spawned = true;
        player.x = 250;
        player.y = 300;
        overlay.style.display = 'none';
    }

    updateScore();
    gameLoop();
});