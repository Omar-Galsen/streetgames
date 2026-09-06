const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Deer image
const deer = new Image();
deer.src = "deer.jpg";

// Game settings
let deerX = 350;
let deerY = 200;

let deerWidth = 180;
let deerHeight = 150;

let score = 0;
let bestScore = Number(localStorage.getItem("deerBestScore")) || 0;

let timeLeft = 30;
let gameOver = false;
let gameStarted = false;

let timer;


// Start game
function startGame() {

    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    score = 0;
    timeLeft = 30;
    gameOver = false;
    gameStarted = true;

    moveDeer();

    clearInterval(timer);

    timer = setInterval(function() {

        if (!gameOver) {

            timeLeft--;

            if (timeLeft <= 0) {
                endGame();
            }
        }

    }, 1000);

    gameLoop();
}


// Put deer somewhere random
function moveDeer() {

    deerX = Math.random() * (canvas.width - deerWidth);

    deerY = Math.random() *
        (canvas.height - deerHeight - 20);
}


// Click to shoot
canvas.addEventListener("click", function(event) {

    if (!gameStarted || gameOver) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const mouseX =
        (event.clientX - rect.left) *
        (canvas.width / rect.width);

    const mouseY =
        (event.clientY - rect.top) *
        (canvas.height / rect.height);


    // Did we hit the deer?
    if (
        mouseX >= deerX &&
        mouseX <= deerX + deerWidth &&
        mouseY >= deerY &&
        mouseY <= deerY + deerHeight
    ) {

        score++;

        // Save best score
        if (score > bestScore) {

            bestScore = score;

            localStorage.setItem(
                "deerBestScore",
                bestScore
            );
        }

        // Move deer
        moveDeer();
    }

});


// Draw game
function draw() {

    // Background
    ctx.fillStyle = "#6fae4a";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Ground
    ctx.fillStyle = "#3f7d2a";

    ctx.fillRect(
        0,
        canvas.height - 60,
        canvas.width,
        60
    );


    // Draw deer
    if (deer.complete && deer.naturalWidth > 0) {

        ctx.drawImage(
            deer,
            deerX,
            deerY,
            deerWidth,
            deerHeight
        );

    }


    // Score
    ctx.fillStyle = "white";
    ctx.font = "26px Arial";

    ctx.fillText(
        "Score: " + score,
        20,
        35
    );


    // Best
    ctx.fillText(
        "Best: " + bestScore,
        20,
        70
    );


    // Timer
    ctx.fillText(
        "Time: " + timeLeft,
        canvas.width - 140,
        35
    );


    // Game over
    if (gameOver) {

        ctx.fillStyle = "rgba(0,0,0,0.7)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "white";

        ctx.textAlign = "center";

        ctx.font = "55px Arial";

        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            210
        );

        ctx.font = "28px Arial";

        ctx.fillText(
            "Score: " + score,
            canvas.width / 2,
            260
        );

        ctx.fillText(
            "Best: " + bestScore,
            canvas.width / 2,
            300
        );

        ctx.fillText(
            "Refresh to play again",
            canvas.width / 2,
            350
        );

        ctx.textAlign = "left";
    }
}


// End game
function endGame() {

    gameOver = true;

    clearInterval(timer);
}


// Game loop
function gameLoop() {

    if (!gameStarted) {
        return;
    }

    draw();

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}