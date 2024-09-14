// Create an object to store all game-related data
export const gameData = {
    platforms: [],
    pickups: [],
    particles: [],
    player: {},
};

// Initialize the game data
export function initializeGameData(canvasWidth, canvasHeight) {
    // Initialize player
    gameData.player = {
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
        wasGrounded: false,
        score: 0,
        image: new Image(),
        blinkImage: new Image(),
        animationTime: 0,
        breathOffset: 0,
        blinkTimer: 0,
        blinking: false,
        breathSpeed: 0.02,
        breathAmplitude: 0.8,
    };

    // Log player data to verify initialization
    console.log('Player initialized:', gameData.player);

    // Initialize platforms
    gameData.platforms = [
        { x: 0, y: canvasHeight - 14, width: canvasWidth, height: 4, type: 'static' },
        { x: 115, y: 464, width: 123, height: 4, type: 'static' },
        // Add more platforms as needed
    ];
    console.log('Platforms initialized:', gameData.platforms);

    // Initialize pickups
    gameData.pickups = [
        { x: 150, y: 300, width: 20, height: 20, collected: false, image: new Image() },
    ];
    gameData.pickups.forEach(pickup => {
        pickup.image.src = 'images/pickup1.png';
    });
    console.log('Pickups initialized:', gameData.pickups);

    // Initialize particles
    gameData.particles = [];
    console.log('Particles initialized:', gameData.particles);

    // Set player images
    gameData.player.image.src = 'images/character1.png';
    gameData.player.blinkImage.src = 'images/character1_blink.png';
}
