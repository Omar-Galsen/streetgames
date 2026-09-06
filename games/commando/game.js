const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameScreen = document.getElementById("game");
const menu = document.getElementById("menu");

const healthBar = document.getElementById("health");
const healthText = document.getElementById("healthText");

const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("finalScore");

const gameOverScreen = document.getElementById("gameOver");
const crosshair = document.getElementById("crosshair");


let width;
let height;

let score = 0;

let health = 100;

let enemies = [];

let bullets = [];

let particles = [];

let gameRunning = false;

let spawnTimer = 0;

let lastTime = 0;

let difficulty = 1;


/* =========================
   RESIZE
========================= */

function resizeCanvas() {

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* =========================
   MOUSE
========================= */

let mouseX = width / 2;
let mouseY = height / 2;


document.addEventListener("mousemove", function(event) {

    mouseX = event.clientX;
    mouseY = event.clientY;

    crosshair.style.left =
        mouseX + "px";

    crosshair.style.top =
        mouseY + "px";
});


document.addEventListener("click", function(event) {

    if (!gameRunning) {
        return;
    }

    shoot(
        event.clientX,
        event.clientY
    );
});


/* =========================
   START
========================= */

function startGame() {

    menu.style.display = "none";

    gameScreen.style.display = "block";

    gameOverScreen.style.display = "none";

    score = 0;

    health = 100;

    enemies = [];

    bullets = [];

    particles = [];

    spawnTimer = 0;

    difficulty = 1;

    gameRunning = true;

    updateHUD();

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


/* =========================
   RETURN MENU
========================= */

function returnMenu() {

    gameRunning = false;

    gameScreen.style.display = "none";

    menu.style.display = "flex";

    gameOverScreen.style.display = "none";
}


/* =========================
   SHOOT
========================= */

function shoot(x, y) {

    bullets.push({

        x: width / 2,

        y: height - 80,

        targetX: x,

        targetY: y,

        speed: 18

    });

}


/* =========================
   SPAWN ENEMY
========================= */

function spawnEnemy() {

    const size =
        25 + Math.random() * 18;

    const side =
        Math.floor(Math.random() * 3);


    let x;
    let y;


    if (side === 0) {

        x =
            Math.random() * width;

        y =
            -size;

    } else if (side === 1) {

        x =
            -size;

        y =
            Math.random() * height * 0.75;

    } else {

        x =
            width + size;

        y =
            Math.random() * height * 0.75;
    }


    enemies.push({

        x: x,

        y: y,

        size: size,

        speed:
            (0.45 + Math.random() * 0.55)
            * difficulty,

        health: 1,

        wobble:
            Math.random() * Math.PI * 2,

        rotation:
            Math.random() * Math.PI * 2
    });
}


/* =========================
   UPDATE
========================= */

function update(delta) {

    difficulty +=
        delta * 0.000015;


    /* Spawn */

    spawnTimer -= delta;

    const spawnRate =
        Math.max(
            300,
            1100 / difficulty
        );


    if (spawnTimer <= 0) {

        spawnEnemy();

        spawnTimer = spawnRate;
    }


    /* Bullets */

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        const dx =
            bullet.targetX -
            bullet.x;

        const dy =
            bullet.targetY -
            bullet.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance < bullet.speed) {

            bullets.splice(i, 1);

            createParticles(
                bullet.targetX,
                bullet.targetY,
                5
            );

            continue;
        }


        bullet.x +=
            (dx / distance) *
            bullet.speed;

        bullet.y +=
            (dy / distance) *
            bullet.speed;
    }


    /* Enemies */

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        const targetX =
            width / 2;

        const targetY =
            height - 70;


        const dx =
            targetX -
            enemy.x;

        const dy =
            targetY -
            enemy.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        enemy.x +=
            (dx / distance) *
            enemy.speed;

        enemy.y +=
            (dy / distance) *
            enemy.speed;


        enemy.wobble +=
            delta * 0.004;


        enemy.rotation +=
            delta * 0.001;


        /* Enemy reaches player */

        if (distance < enemy.size + 35) {

            enemies.splice(i, 1);

            damagePlayer(15);

            createParticles(
                targetX,
                targetY,
                15
            );

            continue;
        }


        /* Bullet collision */

        for (
            let j = bullets.length - 1;
            j >= 0;
            j--
        ) {

            const bullet =
                bullets[j];


            const bx =
                enemy.x -
                bullet.x;

            const by =
                enemy.y -
                bullet.y;


            const hitDistance =
                Math.sqrt(
                    bx * bx +
                    by * by
                );


            if (
                hitDistance <
                enemy.size
            ) {

                enemies.splice(i, 1);

                bullets.splice(j, 1);

                score += 10;

                createParticles(
                    enemy.x,
                    enemy.y,
                    18
                );

                updateHUD();

                break;
            }
        }
    }


    /* Particles */

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];

        particle.x +=
            particle.vx;

        particle.y +=
            particle.vy;

        particle.life -=
            delta * 0.002;

        particle.size *= 0.98;


        if (particle.life <= 0) {

            particles.splice(i, 1);
        }
    }
}


/* =========================
   DAMAGE
========================= */

function damagePlayer(amount) {

    health -= amount;

    health =
        Math.max(0, health);

    updateHUD();


    if (health <= 0) {

        endGame();
    }
}


/* =========================
   HUD
========================= */

function updateHUD() {

    scoreDisplay.textContent =
        score;

    healthText.textContent =
        health;

    healthBar.style.width =
        health + "%";


    if (health <= 30) {

        healthBar.style.background =
            "#ff5147";

    } else if (health <= 60) {

        healthBar.style.background =
            "#f1c40f";

    } else {

        healthBar.style.background =
            "#39d353";
    }
}


/* =========================
   PARTICLES
========================= */

function createParticles(x, y, amount) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            1 + Math.random() * 5;


        particles.push({

            x: x,

            y: y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                2 + Math.random() * 4,

            life: 1
        });
    }
}


/* =========================
   DRAW BACKGROUND
========================= */

function drawBackground() {

    ctx.fillStyle =
        "#17231a";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* Ground */

    ctx.fillStyle =
        "rgba(70,100,65,0.18)";


    for (
        let x = 0;
        x < width;
        x += 70
    ) {

        ctx.fillRect(
            x,
            height * 0.7,
            35,
            height * 0.3
        );
    }


    /* Fog */

    const gradient =
        ctx.createRadialGradient(
            width / 2,
            height / 2,
            100,
            width / 2,
            height / 2,
            width
        );


    gradient.addColorStop(
        0,
        "rgba(100,150,100,0.08)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.55)"
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );
}


/* =========================
   DRAW PLAYER
========================= */

function drawPlayer() {

    const x =
        width / 2;

    const y =
        height - 65;


    /* Body */

    ctx.fillStyle =
        "#202a23";

    ctx.fillRect(
        x - 28,
        y,
        56,
        55
    );


    /* Head */

    ctx.fillStyle =
        "#68756b";

    ctx.beginPath();

    ctx.arc(
        x,
        y - 8,
        19,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Helmet */

    ctx.fillStyle =
        "#303b32";

    ctx.beginPath();

    ctx.arc(
        x,
        y - 13,
        21,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();


    /* Gun */

    const angle =
        Math.atan2(
            mouseY - y,
            mouseX - x
        );


    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(angle);

    ctx.fillStyle =
        "#101512";

    ctx.fillRect(
        0,
        -5,
        55,
        10
    );

    ctx.fillRect(
        35,
        -8,
        22,
        16
    );

    ctx.restore();


    /* Player glow */

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        45,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "rgba(80,220,100,0.15)";

    ctx.stroke();
}


/* =========================
   DRAW ENEMY
========================= */

function drawEnemy(enemy) {

    const x = enemy.x;

    const y =
        enemy.y +
        Math.sin(enemy.wobble) * 3;

    const size =
        enemy.size;


    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(enemy.rotation);


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.3)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        size,
        size,
        size * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Body */

    ctx.fillStyle =
        "#351c1c";

    ctx.fillRect(
        -size * 0.65,
        -size * 0.45,
        size * 1.3,
        size * 1.5
    );


    /* Head */

    ctx.fillStyle =
        "#70504a";

    ctx.beginPath();

    ctx.arc(
        0,
        -size * 0.75,
        size * 0.55,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Helmet */

    ctx.fillStyle =
        "#202520";

    ctx.beginPath();

    ctx.arc(
        0,
        -size * 0.9,
        size * 0.6,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();


    /* Eyes */

    ctx.fillStyle =
        "#ff3b30";

    ctx.beginPath();

    ctx.arc(
        -size * 0.2,
        -size * 0.75,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        size * 0.2,
        -size * 0.75,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();


    /* Enemy health marker */

    ctx.fillStyle =
        "rgba(255,255,255,0.15)";

    ctx.fillRect(
        x - size,
        y - size * 1.7,
        size * 2,
        4
    );

    ctx.fillStyle =
        "#ff5147";

    ctx.fillRect(
        x - size,
        y - size * 1.7,
        size * 2,
        4
    );
}


/* =========================
   DRAW BULLETS
========================= */

function drawBullets() {

    for (const bullet of bullets) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            4,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#fff3a0";

        ctx.shadowBlur = 15;

        ctx.shadowColor =
            "#fff3a0";

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}


/* =========================
   DRAW PARTICLES
========================= */

function drawParticles() {

    for (const particle of particles) {

        ctx.globalAlpha =
            particle.life;

        ctx.fillStyle =
            "#e8c45b";

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
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

    lastTime = timestamp;


    update(delta);


    drawBackground();

    drawBullets();

    for (const enemy of enemies) {

        drawEnemy(enemy);
    }

    drawParticles();

    drawPlayer();


    requestAnimationFrame(gameLoop);
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    gameRunning = false;

    finalScore.textContent =
        score;

    gameOverScreen.style.display =
        "flex";
}