const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Airplane
const airplane = new Image();
airplane.src = "aero.jpg";

// Plane
let plane = {
    x: 100,
    y: 220,
    width: 80,
    height: 50,
    velocityY: 0
};

// Physics
const gravity = 0.5;
const flyPower = -8;

// Obstacles
let obstacles = [];
let obstacleSpeed = 5;
let obstacleTimer = 0;

// Scores
let score = 0;
let bestScore = Number(localStorage.getItem("airplaneBestScore")) || 0;

let gameOver = false;


// SPACE = fly upward
document.addEventListener("keydown", function(event) {

    if (event.code === "Space") {

        event.preventDefault();

        if (gameOver) {
            restartGame();
            return;
        }

        plane.velocityY = flyPower;
    }

});


// Start game
function startGame() {

    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    gameOver = false;
    gameLoop();
}


// Create obstacle
function createObstacle() {

    let gap = 160;

    let topHeight =
        Math.floor(Math.random() * 220) + 40;

    let bottomY = topHeight + gap;

    obstacles.push({

        x: canvas.width,

        top: {
            x: canvas.width,
            y: 0,
            width: 60,
            height: topHeight
        },

        bottom: {
            x: canvas.width,
            y: bottomY,
            width: 60,
            height: canvas.height - bottomY
        },

        passed: false
    });

}


// Update
function update() {

    if (gameOver) {
        return;
    }

    // Gravity
    plane.velocityY += gravity;
    plane.y += plane.velocityY;

    // Spawn obstacles
    obstacleTimer++;

    if (obstacleTimer > 100) {

        createObstacle();
        obstacleTimer = 0;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {

        let obstacle = obstacles[i];

        obstacle.top.x -= obstacleSpeed;
        obstacle.bottom.x -= obstacleSpeed;

        // Score
        if (
            !obstacle.passed &&
            obstacle.top.x + obstacle.top.width < plane.x
        ) {

            obstacle.passed = true;
            score++;

            // New best score
            if (score > bestScore) {

                bestScore = score;

                localStorage.setItem(
                    "airplaneBestScore",
                    bestScore
                );
            }
        }

        // Remove obstacle
        if (obstacle.top.x + obstacle.top.width < 0) {

            obstacles.splice(i, 1);
        }

        // Collision
        if (
            checkCollision(plane, obstacle.top) ||
            checkCollision(plane, obstacle.bottom)
        ) {

            gameOver = true;
        }
    }

    // Ceiling / ground
    if (
        plane.y < 0 ||
        plane.y + plane.height > canvas.height
    ) {

        gameOver = true;
    }
}


// Collision
function checkCollision(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );

}


// Draw
function draw() {

    // Sky
    ctx.fillStyle = "#5ec8ff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Clouds
    ctx.fillStyle = "white";

    ctx.beginPath();
    ctx.arc(200, 100, 25, 0, Math.PI * 2);
    ctx.arc(230, 100, 35, 0, Math.PI * 2);
    ctx.arc(265, 100, 25, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles
    ctx.fillStyle = "#228B22";

    for (let obstacle of obstacles) {

        ctx.fillRect(
            obstacle.top.x,
            obstacle.top.y,
            obstacle.top.width,
            obstacle.top.height
        );

        ctx.fillRect(
            obstacle.bottom.x,
            obstacle.bottom.y,
            obstacle.bottom.width,
            obstacle.bottom.height
        );
    }

    // Plane
    if (airplane.complete) {

        ctx.drawImage(
            airplane,
            plane.x,
            plane.y,
            plane.width,
            plane.height
        );
    }

    // Score
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";

    ctx.fillText(
        "Score: " + score,
        20,
        40
    );

    // Best score
    ctx.fillText(
        "Best: " + bestScore,
        20,
        75
    );

    // Game over
    if (gameOver) {

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "white";
        ctx.font = "50px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            220
        );

        ctx.font = "25px Arial";

        ctx.fillText(
            "Score: " + score,
            canvas.width / 2,
            260
        );

        ctx.fillText(
            "Best: " + bestScore,
            canvas.width / 2,
            295
        );

        ctx.fillText(
            "Press SPACE to restart",
            canvas.width / 2,
            340
        );

        ctx.textAlign = "left";
    }
}


// Restart
function restartGame() {

    plane.y = 220;
    plane.velocityY = 0;

    obstacles = [];

    obstacleTimer = 0;

    score = 0;

    gameOver = false;
}


// Game loop
function gameLoop() {

    update();
    draw();

    requestAnimationFrame(gameLoop);
}