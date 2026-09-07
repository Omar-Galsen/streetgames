const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ========================================
// IMAGES
// ========================================

const background = new Image();
background.src = "assets/background.png";

const robotImage = new Image();
robotImage.src = "assets/robot.png";

const platformImage = new Image();
platformImage.src = "assets/platform.png";


// ========================================
// GAME SETTINGS
// ========================================

const WORLD_WIDTH = 5000;

const GRAVITY = 1800;

const MOVE_SPEED = 450;

const JUMP_FORCE = 800;


// ========================================
// GAME VARIABLES
// ========================================

let gameRunning = false;

let gamePaused = false;

let gameWon = false;

let coinsCollected = 0;

let lives = 3;

let camera = {
    x: 0
};


// ========================================
// PLAYER
// ========================================

const player = {

    x: 150,

    y: 0,

    width: 90,

    height: 120,

    velocityX: 0,

    velocityY: 0,

    grounded: false,

    facing: 1
};


// ========================================
// INPUT
// ========================================

const keys = {};

let jumpPressed = false;


window.addEventListener("keydown", function(event) {

    const key = event.key.toLowerCase();

    keys[key] = true;


    // SPACE
    if (event.code === "Space") {

        event.preventDefault();

        jumpPressed = true;
    }


    // W
    if (key === "w") {

        jumpPressed = true;
    }


    // UP ARROW
    if (key === "arrowup") {

        jumpPressed = true;
    }

});


window.addEventListener("keyup", function(event) {

    const key = event.key.toLowerCase();

    keys[key] = false;

});


// ========================================
// RESIZE
// ========================================

function resizeCanvas() {

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;

    updateGround();

}

window.addEventListener("resize", resizeCanvas);


// ========================================
// GROUND
// ========================================

const ground = {

    x: 0,

    y: 0,

    width: WORLD_WIDTH,

    height: 300
};


function updateGround() {

    ground.y = canvas.height * 0.875;

    ground.height = canvas.height - ground.y;

}


// ========================================
// PLATFORMS
// ========================================

const platforms = [

    {
        x: 650,
        y: 0,
        width: 400,
        height: 85
    },

    {
        x: 1150,
        y: 0,
        width: 400,
        height: 85
    },

    {
        x: 1650,
        y: 0,
        width: 400,
        height: 85
    },

    {
        x: 2200,
        y: 0,
        width: 400,
        height: 85
    },

    {
        x: 2750,
        y: 0,
        width: 400,
        height: 85
    },

    {
        x: 3400,
        y: 0,
        width: 400,
        height: 85
    },

    {
        x: 4000,
        y: 0,
        width: 400,
        height: 85
    }

];


// ========================================
// COINS
// ========================================

const coins = [

    {
        x: 800,
        y: 0,
        radius: 22,
        collected: false
    },

    {
        x: 1300,
        y: 0,
        radius: 22,
        collected: false
    },

    {
        x: 1800,
        y: 0,
        radius: 22,
        collected: false
    },

    {
        x: 2350,
        y: 0,
        radius: 22,
        collected: false
    },

    {
        x: 2900,
        y: 0,
        radius: 22,
        collected: false
    },

    {
        x: 3550,
        y: 0,
        radius: 22,
        collected: false
    },

    {
        x: 4150,
        y: 0,
        radius: 22,
        collected: false
    }

];


// ========================================
// FINISH
// ========================================

const finish = {

    x: 4700,

    width: 100,

    height: 180
};


// ========================================
// RESET PLAYER
// ========================================

function resetPlayer() {

    player.x = 150;

    player.y = ground.y - player.height;

    player.velocityX = 0;

    player.velocityY = 0;

    player.grounded = true;

    camera.x = 0;

}


// ========================================
// UPDATE PLATFORM POSITIONS
// ========================================

function updatePlatformPositions() {

    // Different heights for each platform

    const heights = [

        0.70,
        0.63,
        0.72,
        0.58,
        0.68,
        0.62,
        0.70

    ];


    platforms.forEach((platform, index) => {

        platform.y =
            canvas.height * heights[index];

    });


    // Put coins above platforms

    coins.forEach((coin, index) => {

        if (platforms[index]) {

            coin.y =
                platforms[index].y - 70;

        }

    });

}


// ========================================
// HUD
// ========================================

function updateHUD() {

    document.getElementById("coin-count").textContent =
        coinsCollected;

    document.getElementById("lives").textContent =
        lives;

}


// ========================================
// PLAYER UPDATE
// ========================================

function updatePlayer(deltaTime) {

    // ------------------------------------
    // MOVEMENT
    // ------------------------------------

    let moving = false;


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        player.velocityX = -MOVE_SPEED;

        player.facing = -1;

        moving = true;

    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        player.velocityX = MOVE_SPEED;

        player.facing = 1;

        moving = true;

    }


    if (!moving) {

        player.velocityX *= 0.80;

    }


    // ------------------------------------
    // JUMP
    // ------------------------------------

    if (
        jumpPressed &&
        player.grounded
    ) {

        player.velocityY = -JUMP_FORCE;

        player.grounded = false;

    }

    jumpPressed = false;


    // ------------------------------------
    // GRAVITY
    // ------------------------------------

    player.velocityY +=
        GRAVITY * deltaTime;


    // ------------------------------------
    // SAVE OLD POSITION
    // ------------------------------------

    const oldY = player.y;


    // ------------------------------------
    // MOVE
    // ------------------------------------

    player.x +=
        player.velocityX * deltaTime;

    player.y +=
        player.velocityY * deltaTime;


    // ------------------------------------
    // WORLD LIMITS
    // ------------------------------------

    if (player.x < 0) {

        player.x = 0;

    }


    if (
        player.x + player.width >
        WORLD_WIDTH
    ) {

        player.x =
            WORLD_WIDTH - player.width;

    }


    // ------------------------------------
    // GROUND COLLISION
    // ------------------------------------

    player.grounded = false;


    if (
        player.y + player.height >=
        ground.y
    ) {

        player.y =
            ground.y - player.height;

        player.velocityY = 0;

        player.grounded = true;

    }


    // ------------------------------------
    // PLATFORM COLLISION
    // ------------------------------------

    for (const platform of platforms) {

        const playerBottom =
            player.y + player.height;

        const oldBottom =
            oldY + player.height;


        const horizontalCollision =
            player.x + player.width >
                platform.x &&
            player.x <
                platform.x + platform.width;


        const fallingOntoPlatform =
            player.velocityY >= 0 &&
            oldBottom <= platform.y &&
            playerBottom >= platform.y;


        if (
            horizontalCollision &&
            fallingOntoPlatform
        ) {

            player.y =
                platform.y - player.height;

            player.velocityY = 0;

            player.grounded = true;

        }

    }


    // ------------------------------------
    // FALL OFF WORLD
    // ------------------------------------

    if (
        player.y >
        canvas.height + 300
    ) {

        loseLife();

    }

}


// ========================================
// COIN COLLISION
// ========================================

function checkCoins() {

    for (const coin of coins) {

        if (coin.collected) {
            continue;
        }


        const closestX =
            Math.max(
                player.x,
                Math.min(
                    coin.x,
                    player.x + player.width
                )
            );


        const closestY =
            Math.max(
                player.y,
                Math.min(
                    coin.y,
                    player.y + player.height
                )
            );


        const distanceX =
            coin.x - closestX;

        const distanceY =
            coin.y - closestY;


        const distance =
            Math.sqrt(
                distanceX * distanceX +
                distanceY * distanceY
            );


        if (
            distance <
            coin.radius
        ) {

            coin.collected = true;

            coinsCollected++;

            updateHUD();

        }

    }

}


// ========================================
// CAMERA
// ========================================

function updateCamera() {

    const targetX =
        player.x -
        canvas.width * 0.35;


    camera.x +=
        (targetX - camera.x) * 0.08;


    if (camera.x < 0) {

        camera.x = 0;

    }


    const maxCamera =
        WORLD_WIDTH -
        canvas.width;


    if (camera.x > maxCamera) {

        camera.x = maxCamera;

    }

}


// ========================================
// BACKGROUND
// ========================================

function drawBackground() {

    if (!background.complete) {
        return;
    }


    const imageRatio =
        background.width /
        background.height;


    const canvasRatio =
        canvas.width /
        canvas.height;


    let drawWidth;
    let drawHeight;


    if (imageRatio > canvasRatio) {

        drawHeight =
            canvas.height;

        drawWidth =
            drawHeight * imageRatio;

    } else {

        drawWidth =
            canvas.width;

        drawHeight =
            drawWidth / imageRatio;

    }


    const parallax =
        camera.x * 0.20;


    const offsetX =
        -(parallax %
        (drawWidth - canvas.width));


    ctx.drawImage(
        background,
        offsetX,
        0,
        drawWidth,
        drawHeight
    );


    // Second copy for scrolling

    if (offsetX + drawWidth < canvas.width) {

        ctx.drawImage(
            background,
            offsetX + drawWidth,
            0,
            drawWidth,
            drawHeight
        );

    }

}


// ========================================
// DRAW GROUND
// ========================================

function drawGround() {

    const screenX =
        ground.x - camera.x;


    // Green grass ground

    ctx.fillStyle = "#68c936";

    ctx.fillRect(
        screenX,
        ground.y,
        ground.width,
        ground.height
    );


    // Darker bottom

    ctx.fillStyle = "#3d9227";

    ctx.fillRect(
        screenX,
        ground.y + 25,
        ground.width,
        ground.height
    );


    // Grass line

    ctx.fillStyle = "#a2ed42";

    ctx.fillRect(
        screenX,
        ground.y,
        ground.width,
        12
    );

}


// ========================================
// DRAW PLATFORM IMAGE
// ========================================

function drawPlatforms() {

    for (const platform of platforms) {

        const screenX =
            platform.x - camera.x;


        if (
            screenX + platform.width < 0 ||
            screenX > canvas.width
        ) {

            continue;

        }


        if (platformImage.complete) {

            ctx.drawImage(
                platformImage,
                screenX,
                platform.y,
                platform.width,
                platform.height
            );

        }

    }

}


// ========================================
// DRAW COINS
// ========================================

function drawCoins() {

    for (const coin of coins) {

        if (coin.collected) {
            continue;
        }


        const screenX =
            coin.x - camera.x;


        // Outer gold

        ctx.beginPath();

        ctx.arc(
            screenX,
            coin.y,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#e39b00";

        ctx.fill();


        // Main gold

        ctx.beginPath();

        ctx.arc(
            screenX,
            coin.y,
            coin.radius - 4,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffd21c";

        ctx.fill();


        // Shine

        ctx.beginPath();

        ctx.arc(
            screenX - 7,
            coin.y - 8,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#fff5a0";

        ctx.fill();

    }

}


// ========================================
// DRAW FINISH
// ========================================

function drawFinish() {

    const x =
        finish.x - camera.x;


    // Pole

    ctx.fillStyle = "#eeeeee";

    ctx.fillRect(
        x,
        ground.y - finish.height,
        8,
        finish.height
    );


    // Flag

    ctx.fillStyle = "#e83d3d";

    ctx.beginPath();

    ctx.moveTo(
        x + 8,
        ground.y - finish.height
    );

    ctx.lineTo(
        x + 80,
        ground.y - finish.height + 25
    );

    ctx.lineTo(
        x + 8,
        ground.y - finish.height + 50
    );

    ctx.closePath();

    ctx.fill();

}


// ========================================
// DRAW PLAYER
// ========================================

function drawPlayer() {

    const screenX =
        player.x - camera.x;


    if (!robotImage.complete) {
        return;
    }


    ctx.save();


    if (player.facing === -1) {

        ctx.translate(
            screenX + player.width,
            player.y
        );

        ctx.scale(-1, 1);

        ctx.drawImage(
            robotImage,
            0,
            0,
            player.width,
            player.height
        );

    } else {

        ctx.drawImage(
            robotImage,
            screenX,
            player.y,
            player.width,
            player.height
        );

    }


    ctx.restore();

}


// ========================================
// DRAW GAME
// ========================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawBackground();

    drawGround();

    drawPlatforms();

    drawCoins();

    drawFinish();

    drawPlayer();

}


// ========================================
// LOSE LIFE
// ========================================

function loseLife() {

    lives--;

    updateHUD();


    if (lives <= 0) {

        gameRunning = false;

        document.getElementById(
            "final-score"
        ).textContent = coinsCollected;

        document.getElementById(
            "game-over-screen"
        ).classList.remove("hidden");

        return;

    }


    resetPlayer();

}


// ========================================
// WIN
// ========================================

function winLevel() {

    gameRunning = false;
    gameWon = true;

    alert(
        "LEVEL 1-1 COMPLETE! 🏆\n" +
        "Coins: " +
        coinsCollected
    );

    window.location.href = "level1-2.html";
}


// ========================================
// RESTART
// ========================================

function restartGame() {

    coinsCollected = 0;

    lives = 3;

    gameWon = false;

    gamePaused = false;

    for (const coin of coins) {

        coin.collected = false;

    }


    updateGround();

    updatePlatformPositions();

    resetPlayer();

    updateHUD();


    document.getElementById(
        "game-over-screen"
    ).classList.add("hidden");

    document.getElementById(
        "pause-screen"
    ).classList.add("hidden");

    gameRunning = true;

}


// ========================================
// CHECK FINISH
// ========================================

function checkFinish() {

    if (
        player.x + player.width >
        finish.x &&
        player.x <
        finish.x + finish.width
    ) {

        winLevel();

    }

}


// ========================================
// GAME LOOP
// ========================================

let lastTime = 0;


function gameLoop(timestamp) {

    const deltaTime =
        Math.min(
            (timestamp - lastTime) / 1000,
            0.033
        );


    lastTime = timestamp;


    if (
        gameRunning &&
        !gamePaused &&
        !gameWon
    ) {

        updatePlayer(deltaTime);

        checkCoins();

        checkFinish();

        updateCamera();

    }


    draw();


    requestAnimationFrame(gameLoop);

}


// ========================================
// START BUTTON
// ========================================

document.getElementById(
    "start-button"
).addEventListener(
    "click",
    function() {

        document.getElementById(
            "start-screen"
        ).classList.add("hidden");


        gameRunning = true;

        gamePaused = false;

        updateGround();

        updatePlatformPositions();

        resetPlayer();

        updateHUD();

    }
);


// ========================================
// PAUSE
// ========================================

document.getElementById(
    "pause-button"
).addEventListener(
    "click",
    function() {

        if (!gameRunning) {
            return;
        }


        gamePaused = true;


        document.getElementById(
            "pause-screen"
        ).classList.remove("hidden");

    }
);


// ========================================
// RESUME
// ========================================

document.getElementById(
    "resume-button"
).addEventListener(
    "click",
    function() {

        gamePaused = false;


        document.getElementById(
            "pause-screen"
        ).classList.add("hidden");

    }
);


// ========================================
// RESTART FROM PAUSE
// ========================================

document.getElementById(
    "restart-button"
).addEventListener(
    "click",
    function() {

        restartGame();

    }
);


// ========================================
// RETRY
// ========================================

document.getElementById(
    "retry-button"
).addEventListener(
    "click",
    function() {

        restartGame();

    }
);


// ========================================
// INITIALIZE
// ========================================

resizeCanvas();

updatePlatformPositions();

resetPlayer();

updateHUD();


// Start animation

requestAnimationFrame(gameLoop);