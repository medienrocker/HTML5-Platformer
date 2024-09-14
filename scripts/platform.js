// Move platforms based on their movement type
export function movePlatforms(platforms) {
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
