const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const background = new Image();
background.src = "assets/background.png";

const robotImage = new Image();
robotImage.src = "assets/robot.png";

const platformImage = new Image();
platformImage.src = "assets/platform.png";


// ================================
// ENEMY ANIMATIONS
// ================================

const enemyAnimations = {
    idle: [],
    walk: [],
    attack: [],
    hit: [],
    death: []
};

function loadAnimation(name, count) {
    for (let i = 1; i <= count; i++) {
        const image = new Image();
        image.src = `assets/enemy/${name}/${name}_${i}.png`;
        enemyAnimations[name].push(image);
    }
}

loadAnimation("idle", 4);
loadAnimation("walk", 6);
loadAnimation("attack", 4);
loadAnimation("hit", 4);
loadAnimation("death", 6);

const bulletImage = new Image();
bulletImage.src = "assets/enemy/bullet.png";


// ================================
// SETTINGS
// ================================

const WORLD_WIDTH = 6000;

const GRAVITY = 1800;
const MOVE_SPEED = 450;
const JUMP_FORCE = 800;

const BULLET_SPEED = 900;
const SHOOT_COOLDOWN = 0.3;


// ================================
// GAME
// ================================

let gameRunning = false;
let gamePaused = false;

let coinsCollected = 0;
let lives = 3;

let camera = {
    x: 0
};


// ================================
// PLAYER
// ================================

const player = {
    x: 150,
    y: 0,

    width: 90,
    height: 120,

    velocityX: 0,
    velocityY: 0,

    grounded: false,

    facing: 1,

    shootTimer: 0
};


// ================================
// INPUT
// ================================

const keys = {};

let jumpPressed = false;
let shootPressed = false;


window.addEventListener("keydown", function(event) {

    const key = event.key.toLowerCase();

    keys[key] = true;

    if (event.code === "Space") {
        event.preventDefault();
        jumpPressed = true;
    }

    if (key === "w") {
        jumpPressed = true;
    }

    if (key === "arrowup") {
        jumpPressed = true;
    }

    if (key === "x") {
        shootPressed = true;
    }

});


window.addEventListener("keyup", function(event) {

    keys[event.key.toLowerCase()] = false;

});


canvas.addEventListener("mousedown", function() {
    shootPressed = true;
});


// ================================
// RESIZE
// ================================

function resizeCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    updateGround();
    updatePlatforms();

}

window.addEventListener("resize", resizeCanvas);


// ================================
// GROUND
// ================================

const ground = {
    x: 0,
    y: 0,
    width: WORLD_WIDTH,
    height: 300
};


function updateGround() {

    ground.y = canvas.height * 0.875;

    ground.height =
        canvas.height - ground.y;

}


// ================================
// PLATFORMS
// ================================

const platforms = [

    { x: 600,  y: 0, width: 400, height: 85 },
    { x: 1200, y: 0, width: 400, height: 85 },
    { x: 1800, y: 0, width: 400, height: 85 },
    { x: 2400, y: 0, width: 400, height: 85 },
    { x: 3000, y: 0, width: 400, height: 85 },
    { x: 3700, y: 0, width: 400, height: 85 },
    { x: 4400, y: 0, width: 400, height: 85 },
    { x: 5100, y: 0, width: 400, height: 85 }

];


function updatePlatforms() {

    const heights = [
        0.70,
        0.60,
        0.72,
        0.58,
        0.68,
        0.60,
        0.70,
        0.58
    ];

    platforms.forEach((platform, index) => {

        platform.y =
            canvas.height * heights[index];

    });

}


// ================================
// COINS
// ================================

const coins = [

    { x: 750,  y: 0, radius: 22, collected: false },
    { x: 1350, y: 0, radius: 22, collected: false },
    { x: 1950, y: 0, radius: 22, collected: false },
    { x: 2550, y: 0, radius: 22, collected: false },
    { x: 3150, y: 0, radius: 22, collected: false },
    { x: 3850, y: 0, radius: 22, collected: false },
    { x: 4550, y: 0, radius: 22, collected: false },
    { x: 5250, y: 0, radius: 22, collected: false }

];


function updateCoins() {

    coins.forEach((coin, index) => {

        if (platforms[index]) {

            coin.y =
                platforms[index].y - 70;

        }

    });

}


// ================================
// ENEMIES
// ================================

const enemies = [

    {
        x: 850,
        y: 0,
        width: 90,
        height: 90,

        health: 3,
        maxHealth: 3,

        startX: 650,
        endX: 1000,

        direction: 1,
        speed: 70,

        state: "walk",

        frame: 0,
        timer: 0,

        hitTimer: 0,
        deathTimer: 0,

        alive: true
    },

    {
        x: 2050,
        y: 0,
        width: 90,
        height: 90,

        health: 3,
        maxHealth: 3,

        startX: 1850,
        endX: 2150,

        direction: -1,
        speed: 80,

        state: "walk",

        frame: 0,
        timer: 0,

        hitTimer: 0,
        deathTimer: 0,

        alive: true
    },

    {
        x: 3250,
        y: 0,
        width: 90,
        height: 90,

        health: 4,
        maxHealth: 4,

        startX: 3050,
        endX: 3350,

        direction: 1,
        speed: 90,

        state: "walk",

        frame: 0,
        timer: 0,

        hitTimer: 0,
        deathTimer: 0,

        alive: true
    },

    {
        x: 4550,
        y: 0,
        width: 90,
        height: 90,

        health: 4,
        maxHealth: 4,

        startX: 4450,
        endX: 4750,

        direction: -1,
        speed: 100,

        state: "walk",

        frame: 0,
        timer: 0,

        hitTimer: 0,
        deathTimer: 0,

        alive: true
    }

];


// ================================
// BULLETS
// ================================

const bullets = [];


// ================================
// FINISH
// ================================

const finish = {
    x: 5600,
    width: 100,
    height: 180
};


// ================================
// PLAYER RESET
// ================================

function resetPlayer() {

    player.x = 150;

    player.y =
        ground.y -
        player.height;

    player.velocityX = 0;
    player.velocityY = 0;

    player.grounded = true;

    player.facing = 1;

    player.shootTimer = 0;

    camera.x = 0;

}


// ================================
// HUD
// ================================

function updateHUD() {

    document.getElementById(
        "coin-count"
    ).textContent = coinsCollected;

    document.getElementById(
        "lives"
    ).textContent = lives;

}


// ================================
// PLAYER UPDATE
// ================================

function updatePlayer(deltaTime) {

    let moving = false;


    // LEFT

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        player.velocityX =
            -MOVE_SPEED;

        player.facing = -1;

        moving = true;

    }


    // RIGHT

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        player.velocityX =
            MOVE_SPEED;

        player.facing = 1;

        moving = true;

    }


    if (!moving) {

        player.velocityX *= 0.80;

    }


    // JUMP

    if (
        jumpPressed &&
        player.grounded
    ) {

        player.velocityY =
            -JUMP_FORCE;

        player.grounded = false;

    }

    jumpPressed = false;


    // GRAVITY

    player.velocityY +=
        GRAVITY * deltaTime;


    const oldY =
        player.y;


    player.x +=
        player.velocityX *
        deltaTime;

    player.y +=
        player.velocityY *
        deltaTime;


    // WORLD LIMIT

    if (player.x < 0) {
        player.x = 0;
    }

    if (
        player.x +
        player.width >
        WORLD_WIDTH
    ) {

        player.x =
            WORLD_WIDTH -
            player.width;

    }


    player.grounded = false;


    // GROUND

    if (
        player.y +
        player.height >=
        ground.y
    ) {

        player.y =
            ground.y -
            player.height;

        player.velocityY = 0;

        player.grounded = true;

    }


    // PLATFORMS

    for (const platform of platforms) {

        const playerBottom =
            player.y +
            player.height;

        const oldBottom =
            oldY +
            player.height;


        const horizontal =
            player.x +
            player.width >
            platform.x &&
            player.x <
            platform.x +
            platform.width;


        const falling =
            player.velocityY >= 0 &&
            oldBottom <= platform.y &&
            playerBottom >= platform.y;


        if (
            horizontal &&
            falling
        ) {

            player.y =
                platform.y -
                player.height;

            player.velocityY = 0;

            player.grounded = true;

        }

    }


    // SHOOT TIMER

    if (
        player.shootTimer > 0
    ) {

        player.shootTimer -=
            deltaTime;

    }


    // SHOOT

    if (
        shootPressed &&
        player.shootTimer <= 0
    ) {

        shoot();

        player.shootTimer =
            SHOOT_COOLDOWN;

    }

    shootPressed = false;


    // FALL

    if (
        player.y >
        canvas.height + 300
    ) {

        loseLife();

    }

}


// ================================
// SHOOT
// ================================

function shoot() {

    bullets.push({

        x:
            player.facing === 1
                ? player.x +
                  player.width
                : player.x - 40,

        y:
            player.y +
            player.height * 0.45,

        width: 40,
        height: 40,

        velocityX:
            BULLET_SPEED *
            player.facing,

        alive: true

    });

}


// ================================
// BULLET UPDATE
// ================================

function updateBullets(deltaTime) {

    for (const bullet of bullets) {

        bullet.x +=
            bullet.velocityX *
            deltaTime;


        if (
            bullet.x < -200 ||
            bullet.x >
            WORLD_WIDTH + 200
        ) {

            bullet.alive = false;

        }


        for (const enemy of enemies) {

            if (!enemy.alive) {
                continue;
            }


            if (
                bullet.x <
                    enemy.x +
                    enemy.width &&

                bullet.x +
                    bullet.width >
                    enemy.x &&

                bullet.y <
                    enemy.y +
                    enemy.height &&

                bullet.y +
                    bullet.height >
                    enemy.y
            ) {

                bullet.alive = false;

                hitEnemy(enemy);

                break;

            }

        }

    }


    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        if (
            !bullets[i].alive
        ) {

            bullets.splice(i, 1);

        }

    }

}


// ================================
// HIT ENEMY
// ================================

function hitEnemy(enemy) {

    if (!enemy.alive) {
        return;
    }


    enemy.health--;

    enemy.state = "hit";

    enemy.hitTimer = 0.30;

    enemy.frame = 0;

    enemy.timer = 0;


    if (
        enemy.health <= 0
    ) {

        enemy.alive = false;

        enemy.state = "death";

        enemy.frame = 0;

        enemy.timer = 0;

        enemy.deathTimer = 0.8;

    }

}


// ================================
// ENEMY UPDATE
// ================================

function updateEnemies(deltaTime) {

    for (const enemy of enemies) {

        if (!enemy.alive) {

            enemy.deathTimer -=
                deltaTime;

            updateAnimation(
                enemy,
                "death",
                deltaTime
            );

            continue;

        }


        // HIT

        if (
            enemy.hitTimer > 0
        ) {

            enemy.hitTimer -=
                deltaTime;

            updateAnimation(
                enemy,
                "hit",
                deltaTime
            );

            continue;

        }


        // WALK

        enemy.x +=
            enemy.speed *
            enemy.direction *
            deltaTime;


        if (
            enemy.x <=
            enemy.startX
        ) {

            enemy.direction = 1;

        }


        if (
            enemy.x +
            enemy.width >=
            enemy.endX
        ) {

            enemy.direction = -1;

        }


        enemy.state = "walk";


        updateAnimation(
            enemy,
            "walk",
            deltaTime
        );

    }

}


// ================================
// ANIMATION
// ================================

function updateAnimation(
    enemy,
    animation,
    deltaTime
) {

    const frames =
        enemyAnimations[animation];


    if (!frames.length) {
        return;
    }


    enemy.timer +=
        deltaTime;


    if (
        enemy.timer >= 0.10
    ) {

        enemy.timer = 0;

        enemy.frame++;


        if (
            enemy.frame >=
            frames.length
        ) {

            if (
                animation === "death"
            ) {

                enemy.frame =
                    frames.length - 1;

            } else {

                enemy.frame = 0;

            }

        }

    }

}


// ================================
// PLAYER / ENEMY COLLISION
// ================================

function checkEnemyCollision() {

    for (const enemy of enemies) {

        if (!enemy.alive) {
            continue;
        }


        if (
            player.x <
                enemy.x +
                enemy.width &&

            player.x +
                player.width >
                enemy.x &&

            player.y <
                enemy.y +
                enemy.height &&

            player.y +
                player.height >
                enemy.y
        ) {

            loseLife();

            return;

        }

    }

}


// ================================
// COINS
// ================================

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
                    player.x +
                    player.width
                )
            );


        const closestY =
            Math.max(
                player.y,
                Math.min(
                    coin.y,
                    player.y +
                    player.height
                )
            );


        const dx =
            coin.x -
            closestX;

        const dy =
            coin.y -
            closestY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
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


// ================================
// CAMERA
// ================================

function updateCamera() {

    const target =
        player.x -
        canvas.width * 0.35;


    camera.x +=
        (
            target -
            camera.x
        ) * 0.08;


    if (camera.x < 0) {
        camera.x = 0;
    }


    const maxCamera =
        WORLD_WIDTH -
        canvas.width;


    if (
        camera.x >
        maxCamera
    ) {

        camera.x =
            maxCamera;

    }

}


// ================================
// BACKGROUND
// ================================

function drawBackground() {

    if (!background.complete) {
        return;
    }


    const ratio =
        background.width /
        background.height;


    const canvasRatio =
        canvas.width /
        canvas.height;


    let width;
    let height;


    if (
        ratio >
        canvasRatio
    ) {

        height =
            canvas.height;

        width =
            height * ratio;

    } else {

        width =
            canvas.width;

        height =
            width / ratio;

    }


    const parallax =
        camera.x * 0.20;


    const maxOffset =
        Math.max(
            1,
            width -
            canvas.width
        );


    const offset =
        -(parallax %
        maxOffset);


    ctx.drawImage(
        background,
        offset,
        0,
        width,
        height
    );


    if (
        offset + width <
        canvas.width
    ) {

        ctx.drawImage(
            background,
            offset + width,
            0,
            width,
            height
        );

    }

}


// ================================
// GROUND
// ================================

function drawGround() {

    const x =
        ground.x -
        camera.x;


    ctx.fillStyle =
        "#68c936";

    ctx.fillRect(
        x,
        ground.y,
        ground.width,
        ground.height
    );


    ctx.fillStyle =
        "#3d9227";

    ctx.fillRect(
        x,
        ground.y + 25,
        ground.width,
        ground.height
    );


    ctx.fillStyle =
        "#a2ed42";

    ctx.fillRect(
        x,
        ground.y,
        ground.width,
        12
    );

}


// ================================
// PLATFORMS
// ================================

function drawPlatforms() {

    for (const platform of platforms) {

        const x =
            platform.x -
            camera.x;


        if (
            x +
            platform.width <
            0 ||
            x >
            canvas.width
        ) {

            continue;

        }


        if (
            platformImage.complete
        ) {

            ctx.drawImage(
                platformImage,
                x,
                platform.y,
                platform.width,
                platform.height
            );

        }

    }

}


// ================================
// COINS DRAW
// ================================

function drawCoins() {

    for (const coin of coins) {

        if (coin.collected) {
            continue;
        }


        const x =
            coin.x -
            camera.x;


        ctx.beginPath();

        ctx.arc(
            x,
            coin.y,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#e39b00";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x,
            coin.y,
            coin.radius - 4,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffd21c";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x - 7,
            coin.y - 8,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#fff5a0";

        ctx.fill();

    }

}


// ================================
// BULLETS DRAW
// ================================

function drawBullets() {

    for (const bullet of bullets) {

        const x =
            bullet.x -
            camera.x;


        if (
            bulletImage.complete
        ) {

            ctx.drawImage(
                bulletImage,
                x,
                bullet.y,
                bullet.width,
                bullet.height
            );

        } else {

            ctx.beginPath();

            ctx.arc(
                x + 20,
                bullet.y + 20,
                12,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#00d9ff";

            ctx.fill();

        }

    }

}


// ================================
// ENEMY DRAW
// ================================

function drawEnemies() {

    for (const enemy of enemies) {

        if (
            !enemy.alive &&
            enemy.deathTimer <= 0
        ) {

            continue;

        }


        const x =
            enemy.x -
            camera.x;


        const frames =
            enemyAnimations[
                enemy.state
            ];


        if (
            !frames ||
            !frames.length
        ) {

            continue;

        }


        let frame =
            enemy.frame;


        if (
            frame >=
            frames.length
        ) {

            frame =
                frames.length - 1;

        }


        const image =
            frames[frame];


        if (
            image.complete
        ) {

            ctx.save();


            if (
                enemy.direction === -1
            ) {

                ctx.translate(
                    x +
                    enemy.width,
                    enemy.y
                );

                ctx.scale(-1, 1);

                ctx.drawImage(
                    image,
                    0,
                    0,
                    enemy.width,
                    enemy.height
                );

            } else {

                ctx.drawImage(
                    image,
                    x,
                    enemy.y,
                    enemy.width,
                    enemy.height
                );

            }


            ctx.restore();

        }


        // Health bar

        if (enemy.alive) {

            const health =
                enemy.health /
                enemy.maxHealth;


            ctx.fillStyle =
                "#222";

            ctx.fillRect(
                x,
                enemy.y - 14,
                enemy.width,
                8
            );


            ctx.fillStyle =
                "#e53935";

            ctx.fillRect(
                x,
                enemy.y - 14,
                enemy.width *
                health,
                8
            );

        }

    }

}


// ================================
// FINISH
// ================================

function drawFinish() {

    const x =
        finish.x -
        camera.x;


    ctx.fillStyle =
        "#eeeeee";

    ctx.fillRect(
        x,
        ground.y -
        finish.height,
        8,
        finish.height
    );


    ctx.fillStyle =
        "#e83d3d";

    ctx.beginPath();

    ctx.moveTo(
        x + 8,
        ground.y -
        finish.height
    );

    ctx.lineTo(
        x + 80,
        ground.y -
        finish.height +
        25
    );

    ctx.lineTo(
        x + 8,
        ground.y -
        finish.height +
        50
    );

    ctx.closePath();

    ctx.fill();

}


// ================================
// PLAYER DRAW
// ================================

function drawPlayer() {

    if (!robotImage.complete) {
        return;
    }


    const x =
        player.x -
        camera.x;


    ctx.save();


    if (
        player.facing === -1
    ) {

        ctx.translate(
            x +
            player.width,
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
            x,
            player.y,
            player.width,
            player.height
        );

    }


    ctx.restore();

}


// ================================
// DRAW EVERYTHING
// ================================

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

    drawBullets();

    drawEnemies();

    drawFinish();

    drawPlayer();

}


// ================================
// LOSE LIFE
// ================================

function loseLife() {

    lives--;

    updateHUD();


    if (
        lives <= 0
    ) {

        gameRunning = false;


        document.getElementById(
            "final-score"
        ).textContent =
            coinsCollected;


        document.getElementById(
            "game-over-screen"
        ).classList.remove(
            "hidden"
        );


        return;

    }


    resetPlayer();

}


// ================================
// RESTART
// ================================

function restartGame() {

    coinsCollected = 0;

    lives = 3;


    for (const coin of coins) {

        coin.collected = false;

    }


    bullets.length = 0;


    for (const enemy of enemies) {

        enemy.health =
            enemy.maxHealth;

        enemy.alive = true;

        enemy.state = "walk";

        enemy.frame = 0;

        enemy.timer = 0;

        enemy.hitTimer = 0;

        enemy.deathTimer = 0;

    }


    updateGround();

    updatePlatforms();

    updateCoins();

    updateEnemyPositions();

    resetPlayer();

    updateHUD();


    document.getElementById(
        "game-over-screen"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "pause-screen"
    ).classList.add(
        "hidden"
    );


    gamePaused = false;

    gameRunning = true;

}


// ================================
// ENEMY POSITIONS
// ================================

function updateEnemyPositions() {

    for (const enemy of enemies) {

        // Find closest platform

        let closest =
            platforms[0];


        let smallest =
            Infinity;


        for (const platform of platforms) {

            const distance =
                Math.abs(
                    enemy.x -
                    platform.x
                );


            if (
                distance <
                smallest
            ) {

                smallest = distance;

                closest =
                    platform;

            }

        }


        enemy.y =
            closest.y -
            enemy.height;

    }

}


// ================================
// FINISH CHECK
// ================================

function checkFinish() {

    if (
        player.x +
        player.width >
        finish.x &&
        player.x <
        finish.x +
        finish.width
    ) {

        gameRunning = false;

        alert(
            "LEVEL 1-2 COMPLETE! 🏆\n" +
            "Coins: " +
            coinsCollected
        );

    }

}


// ================================
// LOOP
// ================================

let lastTime = 0;


function gameLoop(timestamp) {

    const deltaTime =
        Math.min(
            (timestamp -
            lastTime) / 1000,
            0.033
        );


    lastTime =
        timestamp;


    if (
        gameRunning &&
        !gamePaused
    ) {

        updatePlayer(
            deltaTime
        );

        updateBullets(
            deltaTime
        );

        updateEnemies(
            deltaTime
        );

        checkCoins();

        checkEnemyCollision();

        checkFinish();

        updateCamera();

    }


    draw();


    requestAnimationFrame(
        gameLoop
    );

}


// ================================
// BUTTONS
// ================================

document.getElementById(
    "start-button"
).addEventListener(
    "click",
    function() {

        document.getElementById(
            "start-screen"
        ).classList.add(
            "hidden"
        );


        gameRunning = true;


        updateGround();

        updatePlatforms();

        updateCoins();

        updateEnemyPositions();

        resetPlayer();

        updateHUD();

    }
);


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
        ).classList.remove(
            "hidden"
        );

    }
);


document.getElementById(
    "resume-button"
).addEventListener(
    "click",
    function() {

        gamePaused = false;


        document.getElementById(
            "pause-screen"
        ).classList.add(
            "hidden"
        );

    }
);


document.getElementById(
    "restart-button"
).addEventListener(
    "click",
    restartGame
);


document.getElementById(
    "retry-button"
).addEventListener(
    "click",
    restartGame
);


// ================================
// INITIALIZE
// ================================

resizeCanvas();

updatePlatforms();

updateCoins();

updateEnemyPositions();

resetPlayer();

updateHUD();

requestAnimationFrame(
    gameLoop
);