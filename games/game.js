const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileSize = canvas.width / gridSize;

let snake;
let food;
let direction;
let nextDirection;

let score = 0;
let bestScore = Number(localStorage.getItem("snakeBestScore")) || 0;

let gameRunning = false;
let gameLoopTimer = null;


/* =========================
   START GAME
========================= */

function startGame() {

    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    resetGame();

    gameRunning = true;

    clearInterval(gameLoopTimer);

    gameLoopTimer = setInterval(gameLoop, 110);
}


/* =========================
   RESET
========================= */

function resetGame() {

    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    direction = {
        x: 1,
        y: 0
    };

    nextDirection = {
        x: 1,
        y: 0
    };

    score = 0;

    createFood();

    draw();
}


/* =========================
   FOOD
========================= */

function createFood() {

    let validPosition = false;

    while (!validPosition) {

        food = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };

        validPosition = !snake.some(
            segment =>
                segment.x === food.x &&
                segment.y === food.y
        );
    }
}


/* =========================
   CONTROLS
========================= */

document.addEventListener("keydown", function(event) {

    if (
        event.code === "ArrowUp" &&
        direction.y !== 1
    ) {
        nextDirection = { x: 0, y: -1 };
    }

    if (
        event.code === "ArrowDown" &&
        direction.y !== -1
    ) {
        nextDirection = { x: 0, y: 1 };
    }

    if (
        event.code === "ArrowLeft" &&
        direction.x !== 1
    ) {
        nextDirection = { x: -1, y: 0 };
    }

    if (
        event.code === "ArrowRight" &&
        direction.x !== -1
    ) {
        nextDirection = { x: 1, y: 0 };
    }

    if (event.code === "Space" && !gameRunning) {
        startGame();
    }
});


/* =========================
   GAME LOOP
========================= */

function gameLoop() {

    if (!gameRunning) {
        return;
    }

    update();
    draw();
}


/* =========================
   UPDATE
========================= */

function update() {

    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };


    // Wall collision

    if (
        head.x < 0 ||
        head.x >= gridSize ||
        head.y < 0 ||
        head.y >= gridSize
    ) {
        endGame();
        return;
    }


    // Self collision

    if (
        snake.some(
            segment =>
                segment.x === head.x &&
                segment.y === head.y
        )
    ) {
        endGame();
        return;
    }


    // Add new head

    snake.unshift(head);


    // Food eaten

    if (
        head.x === food.x &&
        head.y === food.y
    ) {

        score++;

        if (score > bestScore) {

            bestScore = score;

            localStorage.setItem(
                "snakeBestScore",
                bestScore
            );
        }

        createFood();

    } else {

        snake.pop();
    }
}


/* =========================
   DRAW
========================= */

function draw() {

    drawBackground();
    drawGrid();
    drawFood();
    drawSnake();
    drawScore();

    if (!gameRunning && score > 0) {
        drawGameOver();
    }
}


/* =========================
   BACKGROUND
========================= */

function drawBackground() {

    ctx.fillStyle = "#101510";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


/* =========================
   GRID
========================= */

function drawGrid() {

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridSize; i++) {

        ctx.beginPath();

        ctx.moveTo(
            i * tileSize,
            0
        );

        ctx.lineTo(
            i * tileSize,
            canvas.height
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            0,
            i * tileSize
        );

        ctx.lineTo(
            canvas.width,
            i * tileSize
        );

        ctx.stroke();
    }
}


/* =========================
   SNAKE
========================= */

function drawSnake() {

    snake.forEach((segment, index) => {

        const padding = 2;

        const x =
            segment.x * tileSize + padding;

        const y =
            segment.y * tileSize + padding;

        const size =
            tileSize - padding * 2;


        // Head

        if (index === 0) {

            ctx.fillStyle = "#00ff88";

            roundRect(
                ctx,
                x,
                y,
                size,
                size,
                7
            );

            ctx.fill();


            // Eyes

            ctx.fillStyle = "#06140c";

            const eyeSize = 4;

            if (direction.x !== 0) {

                const eyeX =
                    direction.x === 1
                        ? x + size - 8
                        : x + 4;

                ctx.fillRect(
                    eyeX,
                    y + 6,
                    eyeSize,
                    eyeSize
                );

                ctx.fillRect(
                    eyeX,
                    y + size - 10,
                    eyeSize,
                    eyeSize
                );

            } else {

                const eyeY =
                    direction.y === 1
                        ? y + size - 8
                        : y + 4;

                ctx.fillRect(
                    x + 6,
                    eyeY,
                    eyeSize,
                    eyeSize
                );

                ctx.fillRect(
                    x + size - 10,
                    eyeY,
                    eyeSize,
                    eyeSize
                );
            }

        } else {

            // Body

            const brightness =
                Math.max(0.35, 0.85 - index * 0.015);

            ctx.fillStyle =
                `rgba(0, 220, 100, ${brightness})`;

            roundRect(
                ctx,
                x,
                y,
                size,
                size,
                6
            );

            ctx.fill();
        }
    });
}


/* =========================
   FOOD
========================= */

function drawFood() {

    const centerX =
        food.x * tileSize + tileSize / 2;

    const centerY =
        food.y * tileSize + tileSize / 2;

    const radius = tileSize * 0.32;


    // Glow

    ctx.shadowColor = "#ff3b3b";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#ff3b3b";

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;


    // Highlight

    ctx.fillStyle = "#ffaaaa";

    ctx.beginPath();

    ctx.arc(
        centerX - 4,
        centerY - 4,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================
   SCORE
========================= */

function drawScore() {

    ctx.fillStyle = "white";
    ctx.font = "bold 22px Arial";

    ctx.fillText(
        "SCORE  " + score,
        18,
        30
    );

    ctx.fillStyle = "#aaa";

    ctx.font = "18px Arial";

    ctx.fillText(
        "BEST  " + bestScore,
        18,
        55
    );
}


/* =========================
   GAME OVER
========================= */

function drawGameOver() {

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.72)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.textAlign = "center";

    ctx.fillStyle = "white";

    ctx.font = "bold 52px Arial";

    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        250
    );


    ctx.font = "24px Arial";

    ctx.fillStyle = "#ccc";

    ctx.fillText(
        "Score: " + score,
        canvas.width / 2,
        295
    );

    ctx.fillText(
        "Best: " + bestScore,
        canvas.width / 2,
        330
    );


    ctx.fillStyle = "#00ff88";

    ctx.font = "bold 20px Arial";

    ctx.fillText(
        "Press SPACE to play again",
        canvas.width / 2,
        380
    );


    ctx.textAlign = "left";
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    gameRunning = false;

    clearInterval(gameLoopTimer);

    draw();
}


/* =========================
   ROUNDED RECTANGLE
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