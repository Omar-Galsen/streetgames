const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const game = document.getElementById("game");

const scoreDisplay = document.getElementById("score");
const speedDisplay = document.getElementById("speed");
const livesDisplay = document.getElementById("lives");

const gameOver = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");


let width;
let height;

let gameRunning = false;

let score = 0;

let lives = 3;

let speed = 5;

let roadOffset = 0;

let enemies = [];

let particles = [];

let lastTime = 0;

let spawnTimer = 0;


/* =========================
   PLAYER
========================= */

const player = {

    x: 0,

    y: 0,

    width: 48,

    height: 82,

    speed: 7,

    movingLeft: false,

    movingRight: false

};


/* =========================
   ROAD
========================= */

let roadWidth;

let roadLeft;

let roadRight;


/* =========================
   RESIZE
========================= */

function resizeCanvas() {

    width = window.innerWidth;

    height = window.innerHeight;

    canvas.width = width;

    canvas.height = height;

    roadWidth =
        Math.min(
            width * 0.72,
            620
        );

    roadLeft =
        (width - roadWidth) / 2;

    roadRight =
        roadLeft + roadWidth;

    player.y =
        height - 130;

    if (!player.x) {

        player.x =
            width / 2;
    }
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            player.movingLeft = true;
        }


        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            player.movingRight = true;
        }


        if (
            event.key === "ArrowUp" ||
            event.key.toLowerCase() === "w"
        ) {

            speed += 0.3;

            speed =
                Math.min(speed, 15);
        }
    }
);


document.addEventListener(
    "keyup",
    function(event) {

        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            player.movingLeft = false;
        }


        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            player.movingRight = false;
        }
    }
);


/* =========================
   START
========================= */

function startGame() {

    menu.style.display = "none";

    game.style.display = "block";

    gameOver.style.display = "none";

    score = 0;

    lives = 3;

    speed = 5;

    roadOffset = 0;

    enemies = [];

    particles = [];

    spawnTimer = 0;

    player.x =
        width / 2;

    player.y =
        height - 130;

    gameRunning = true;

    updateHUD();

    lastTime =
        performance.now();

    requestAnimationFrame(
        gameLoop
    );
}


/* =========================
   MENU
========================= */

function returnMenu() {

    gameRunning = false;

    game.style.display = "none";

    menu.style.display = "flex";

    gameOver.style.display = "none";
}


/* =========================
   SPAWN CAR
========================= */

function spawnEnemy() {

    const lanes = 4;

    const laneWidth =
        roadWidth / lanes;

    const lane =
        Math.floor(
            Math.random() * lanes
        );


    const carX =
        roadLeft +
        laneWidth * lane +
        laneWidth / 2;


    const carColors = [
        "#3498db",
        "#f1c40f",
        "#9b59b6",
        "#2ecc71",
        "#e67e22",
        "#ecf0f1"
    ];


    enemies.push({

        x: carX,

        y: -100,

        width: 48,

        height: 82,

        speed:
            speed * (
                0.65 +
                Math.random() * 0.35
            ),

        color:
            carColors[
                Math.floor(
                    Math.random() *
                    carColors.length
                )
            ],

        passed: false

    });
}


/* =========================
   UPDATE
========================= */

function update(delta) {

    /* Gradually increase speed */

    speed +=
        delta * 0.00008;

    speed =
        Math.min(speed, 16);


    /* Road */

    roadOffset +=
        speed * 1.8;

    if (roadOffset > 80) {

        roadOffset -= 80;
    }


    /* Player */

    if (player.movingLeft) {

        player.x -=
            player.speed;
    }

    if (player.movingRight) {

        player.x +=
            player.speed;
    }


    /* Keep player on road */

    const half =
        player.width / 2;


    if (
        player.x - half <
        roadLeft + 8
    ) {

        player.x =
            roadLeft + 8 + half;
    }


    if (
        player.x + half >
        roadRight - 8
    ) {

        player.x =
            roadRight - 8 - half;
    }


    /* Spawn traffic */

    spawnTimer -= delta;


    const spawnRate =
        Math.max(
            450,
            1000 -
            speed * 35
        );


    if (spawnTimer <= 0) {

        spawnEnemy();

        spawnTimer =
            spawnRate;
    }


    /* Enemy cars */

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        enemy.y +=
            enemy.speed;


        /* Collision */

        if (
            checkCollision(
                player,
                enemy
            )
        ) {

            enemies.splice(i, 1);

            crash();

            continue;
        }


        /* Passed player */

        if (
            !enemy.passed &&
            enemy.y >
            player.y + player.height
        ) {

            enemy.passed = true;

            score += 10;

            updateHUD();
        }


        /* Remove old cars */

        if (
            enemy.y >
            height + 120
        ) {

            enemies.splice(i, 1);
        }
    }


    /* Particles */

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];

        p.x += p.vx;

        p.y += p.vy;

        p.life -=
            delta * 0.002;

        p.size *= 0.98;


        if (p.life <= 0) {

            particles.splice(i, 1);
        }
    }
}


/* =========================
   COLLISION
========================= */

function checkCollision(a, b) {

    return (

        a.x - a.width / 2 <
        b.x + b.width / 2 &&

        a.x + a.width / 2 >
        b.x - b.width / 2 &&

        a.y <
        b.y + b.height &&

        a.y + a.height >
        b.y

    );
}


/* =========================
   CRASH
========================= */

function crash() {

    lives--;

    createExplosion(
        player.x,
        player.y + 35
    );

    updateHUD();


    if (lives <= 0) {

        endGame();

        return;
    }


    /* Give player a little recovery */

    player.x =
        width / 2;
}


/* =========================
   HUD
========================= */

function updateHUD() {

    scoreDisplay.textContent =
        score;

    speedDisplay.textContent =
        Math.floor(speed * 12) +
        " MPH";

    livesDisplay.textContent =
        "❤️".repeat(lives) +
        "🖤".repeat(3 - lives);
}


/* =========================
   DRAW BACKGROUND
========================= */

function drawBackground() {

    /* Grass */

    ctx.fillStyle =
        "#25452a";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* Road */

    ctx.fillStyle =
        "#292929";

    ctx.fillRect(
        roadLeft,
        0,
        roadWidth,
        height
    );


    /* Road edge */

    ctx.fillStyle =
        "#eeeeee";

    ctx.fillRect(
        roadLeft,
        0,
        5,
        height
    );

    ctx.fillRect(
        roadRight - 5,
        0,
        5,
        height
    );


    /* Road lane markings */

    const lanes = 4;

    const laneWidth =
        roadWidth / lanes;


    for (
        let lane = 1;
        lane < lanes;
        lane++
    ) {

        const x =
            roadLeft +
            laneWidth * lane;


        for (
            let y = -80 + roadOffset;
            y < height;
            y += 80
        ) {

            ctx.fillStyle =
                "rgba(255,255,255,0.55)";

            ctx.fillRect(
                x - 3,
                y,
                6,
                42
            );
        }
    }


    /* Grass stripes */

    for (
        let y = -40 + roadOffset;
        y < height;
        y += 80
    ) {

        ctx.fillStyle =
            "rgba(255,255,255,0.035)";

        ctx.fillRect(
            0,
            y,
            roadLeft,
            35
        );

        ctx.fillRect(
            roadRight,
            y,
            width - roadRight,
            35
        );
    }
}


/* =========================
   DRAW PLAYER
========================= */

function drawPlayer() {

    drawCar(
        player.x,
        player.y,
        player.width,
        player.height,
        "#e53935",
        true
    );
}


/* =========================
   DRAW ENEMY
========================= */

function drawEnemy(enemy) {

    drawCar(
        enemy.x,
        enemy.y,
        enemy.width,
        enemy.height,
        enemy.color,
        false
    );
}


/* =========================
   CAR
========================= */

function drawCar(
    x,
    y,
    w,
    h,
    color,
    playerCar
) {

    ctx.save();

    ctx.translate(
        x - w / 2,
        y
    );


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.4)";

    ctx.fillRect(
        5,
        7,
        w,
        h
    );


    /* Body */

    ctx.fillStyle =
        color;

    roundRect(
        ctx,
        0,
        0,
        w,
        h,
        9
    );

    ctx.fill();


    /* Windows */

    ctx.fillStyle =
        "#18252b";

    roundRect(
        ctx,
        8,
        12,
        w - 16,
        28,
        6
    );

    ctx.fill();


    /* Front window */

    ctx.fillStyle =
        "#263b44";

    ctx.fillRect(
        11,
        15,
        w - 22,
        10
    );


    /* Rear window */

    ctx.fillStyle =
        "#17252b";

    ctx.fillRect(
        11,
        29,
        w - 22,
        7
    );


    /* Wheels */

    ctx.fillStyle =
        "#090909";

    ctx.fillRect(
        -5,
        14,
        8,
        22
    );

    ctx.fillRect(
        w - 3,
        14,
        8,
        22
    );

    ctx.fillRect(
        -5,
        h - 36,
        8,
        22
    );

    ctx.fillRect(
        w - 3,
        h - 36,
        8,
        22
    );


    /* Headlights */

    ctx.fillStyle =
        "#fff3a0";

    ctx.fillRect(
        7,
        3,
        10,
        5
    );

    ctx.fillRect(
        w - 17,
        3,
        10,
        5
    );


    /* Player spoiler */

    if (playerCar) {

        ctx.fillStyle =
            "#202020";

        ctx.fillRect(
            -4,
            h - 10,
            w + 8,
            7
        );
    }


    ctx.restore();
}


/* =========================
   ROUND RECT
========================= */

function roundRect(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    context.beginPath();

    context.moveTo(
        x + radius,
        y
    );

    context.lineTo(
        x + width - radius,
        y
    );

    context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    context.lineTo(
        x + width,
        y + height - radius
    );

    context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    context.lineTo(
        x + radius,
        y + height
    );

    context.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    context.lineTo(
        x,
        y + radius
    );

    context.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    context.closePath();
}


/* =========================
   EXPLOSION
========================= */

function createExplosion(x, y) {

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const velocity =
            2 +
            Math.random() * 6;


        particles.push({

            x: x,

            y: y,

            vx:
                Math.cos(angle) *
                velocity,

            vy:
                Math.sin(angle) *
                velocity,

            size:
                3 +
                Math.random() * 6,

            life: 1
        });
    }
}


/* =========================
   PARTICLES
========================= */

function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha =
            p.life;

        ctx.fillStyle =
            "#ff9f1c";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}


/* =========================
   GAME LOOP
========================= */

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }


    const delta =
        timestamp - lastTime;

    lastTime =
        timestamp;


    update(delta);


    drawBackground();

    for (const enemy of enemies) {

        drawEnemy(enemy);
    }

    drawParticles();

    drawPlayer();


    requestAnimationFrame(
        gameLoop
    );
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    gameRunning = false;

    finalScore.textContent =
        score;

    gameOver.style.display =
        "flex";
}