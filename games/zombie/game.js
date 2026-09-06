const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ROWS = 5;
const COLS = 9;

const CELL_WIDTH = canvas.width / COLS;
const CELL_HEIGHT = canvas.height / ROWS;

let energy = 200;
let score = 0;
let wave = 1;

let selectedPlant = "shooter";

let plants = [];
let zombies = [];
let bullets = [];
let suns = [];
let explosions = [];

let spawnTimer = 0;
let gameRunning = true;

const costs = {
    shooter: 100,
    sun: 50,
    wall: 75,
    bomb: 150
};

document.querySelectorAll(".plant-button").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".plant-button")
            .forEach(btn => btn.classList.remove("selected"));

        button.classList.add("selected");

        selectedPlant = button.dataset.type;
    });

});


canvas.addEventListener("click", event => {

    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    const col = Math.floor(mouseX / CELL_WIDTH);
    const row = Math.floor(mouseY / CELL_HEIGHT);

    const existingPlant = plants.find(
        plant => plant.row === row && plant.col === col
    );

    if (existingPlant) return;

    const cost = costs[selectedPlant];

    if (energy < cost) return;

    energy -= cost;

    plants.push(createPlant(selectedPlant, row, col));

    updateUI();
});


function createPlant(type, row, col) {

    let hp = 100;

    if (type === "wall") hp = 500;
    if (type === "bomb") hp = 60;

    return {
        type,
        row,
        col,
        x: col * CELL_WIDTH + CELL_WIDTH / 2,
        y: row * CELL_HEIGHT + CELL_HEIGHT / 2,
        hp,
        timer: 0
    };
}


function spawnZombie() {

    const row = Math.floor(Math.random() * ROWS);

    let hp = 120 + wave * 25;

    let speed = 0.25 + wave * 0.025;

    zombies.push({
        row,
        x: canvas.width + 40,
        y: row * CELL_HEIGHT + CELL_HEIGHT / 2,
        hp,
        maxHp: hp,
        speed,
        attacking: false
    });
}


function updatePlants() {

    plants.forEach((plant, index) => {

        plant.timer++;

        if (plant.type === "shooter") {

            const zombieInLane = zombies.some(
                zombie =>
                    zombie.row === plant.row &&
                    zombie.x > plant.x
            );

            if (zombieInLane && plant.timer > 80) {

                bullets.push({
                    x: plant.x + 25,
                    y: plant.y,
                    row: plant.row,
                    speed: 5,
                    damage: 25
                });

                plant.timer = 0;
            }
        }


        if (plant.type === "sun") {

            if (plant.timer > 300) {

                suns.push({
                    x: plant.x,
                    y: plant.y,
                    life: 400
                });

                plant.timer = 0;
            }
        }


        if (plant.type === "bomb") {

            if (plant.timer > 100) {

                explosions.push({
                    x: plant.x,
                    y: plant.y,
                    radius: 10,
                    maxRadius: 130,
                    life: 40
                });

                zombies.forEach(zombie => {

                    const dx = zombie.x - plant.x;
                    const dy = zombie.y - plant.y;

                    const distance = Math.sqrt(
                        dx * dx + dy * dy
                    );

                    if (distance < 150) {

                        zombie.hp -= 250;
                    }
                });

                plants.splice(index, 1);
            }
        }
    });

}


function updateBullets() {

    bullets.forEach((bullet, bulletIndex) => {

        bullet.x += bullet.speed;

        zombies.forEach((zombie) => {

            if (
                zombie.row === bullet.row &&
                bullet.x > zombie.x - 30 &&
                bullet.x < zombie.x + 30
            ) {

                zombie.hp -= bullet.damage;

                bullets.splice(bulletIndex, 1);
            }
        });

        if (bullet.x > canvas.width) {

            bullets.splice(bulletIndex, 1);
        }
    });

}


function updateZombies() {

    zombies.forEach((zombie, zombieIndex) => {

        let blocked = false;

        plants.forEach((plant, plantIndex) => {

            if (
                zombie.row === plant.row &&
                zombie.x < plant.x + 45 &&
                zombie.x > plant.x - 50
            ) {

                blocked = true;

                plant.hp -= 0.4 + wave * 0.04;

                if (plant.hp <= 0) {

                    plants.splice(plantIndex, 1);
                }
            }
        });

        if (!blocked) {

            zombie.x -= zombie.speed;
        }

        if (zombie.hp <= 0) {

            zombies.splice(zombieIndex, 1);

            score += 25;
            energy += 15;

            updateUI();
        }


        if (zombie.x < 0) {

            endGame();
        }
    });

}


function updateSuns() {

    suns.forEach((sun, index) => {

        sun.life--;

        if (sun.life <= 0) {

            energy += 50;

            suns.splice(index, 1);

            updateUI();
        }
    });

}


function updateExplosions() {

    explosions.forEach((explosion, index) => {

        explosion.radius += 4;

        explosion.life--;

        if (explosion.life <= 0) {

            explosions.splice(index, 1);
        }
    });

}


function drawGrid() {

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            if ((row + col) % 2 === 0) {
                ctx.fillStyle = "#419b40";
            } else {
                ctx.fillStyle = "#368835";
            }

            ctx.fillRect(
                col * CELL_WIDTH,
                row * CELL_HEIGHT,
                CELL_WIDTH,
                CELL_HEIGHT
            );

            ctx.strokeStyle = "rgba(255,255,255,0.12)";

            ctx.strokeRect(
                col * CELL_WIDTH,
                row * CELL_HEIGHT,
                CELL_WIDTH,
                CELL_HEIGHT
            );
        }
    }
}


function drawPlants() {

    plants.forEach(plant => {

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (plant.type === "shooter") {

            ctx.font = "55px Arial";
            ctx.fillText("🌱", plant.x, plant.y);

        }

        if (plant.type === "sun") {

            ctx.font = "55px Arial";
            ctx.fillText("🌻", plant.x, plant.y);

        }

        if (plant.type === "wall") {

            ctx.font = "55px Arial";
            ctx.fillText("🪵", plant.x, plant.y);

        }

        if (plant.type === "bomb") {

            ctx.font = "55px Arial";
            ctx.fillText("💣", plant.x, plant.y);

        }


        ctx.fillStyle = "#222";

        ctx.fillRect(
            plant.x - 30,
            plant.y + 38,
            60,
            6
        );

        let maxHP = 100;

        if (plant.type === "wall") maxHP = 500;
        if (plant.type === "bomb") maxHP = 60;

        ctx.fillStyle = "#55ff77";

        ctx.fillRect(
            plant.x - 30,
            plant.y + 38,
            60 * Math.max(0, plant.hp / maxHP),
            6
        );
    });

}


function drawZombies() {

    zombies.forEach(zombie => {

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "58px Arial";

        ctx.fillText(
            "🧟",
            zombie.x,
            zombie.y
        );


        ctx.fillStyle = "#222";

        ctx.fillRect(
            zombie.x - 30,
            zombie.y + 40,
            60,
            7
        );


        ctx.fillStyle = "#ff4040";

        ctx.fillRect(
            zombie.x - 30,
            zombie.y + 40,
            60 * Math.max(0, zombie.hp / zombie.maxHp),
            7
        );
    });

}


function drawBullets() {

    bullets.forEach(bullet => {

        ctx.beginPath();

        ctx.fillStyle = "#b7ff49";

        ctx.arc(
            bullet.x,
            bullet.y,
            9,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 12;
        ctx.shadowColor = "#91ff00";

        ctx.fill();

        ctx.shadowBlur = 0;
    });

}


function drawSuns() {

    suns.forEach(sun => {

        ctx.font = "42px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "☀️",
            sun.x,
            sun.y
        );
    });

}


function drawExplosions() {

    explosions.forEach(explosion => {

        ctx.beginPath();

        ctx.fillStyle =
            "rgba(255,100,20,0.45)";

        ctx.arc(
            explosion.x,
            explosion.y,
            explosion.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

}


function updateWave() {

    const newWave =
        Math.floor(score / 250) + 1;

    if (newWave !== wave) {

        wave = newWave;

        updateUI();
    }
}


function update() {

    if (!gameRunning) return;

    spawnTimer++;

    const spawnRate =
        Math.max(80, 220 - wave * 15);

    if (spawnTimer > spawnRate) {

        spawnZombie();

        spawnTimer = 0;
    }


    updatePlants();
    updateBullets();
    updateZombies();
    updateSuns();
    updateExplosions();
    updateWave();
}


function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawGrid();
    drawPlants();
    drawBullets();
    drawZombies();
    drawSuns();
    drawExplosions();
}


function gameLoop() {

    update();
    draw();

    requestAnimationFrame(gameLoop);
}


function updateUI() {

    document.getElementById("energy").textContent =
        Math.floor(energy);

    document.getElementById("score").textContent =
        score;

    document.getElementById("wave").textContent =
        wave;
}


function endGame() {

    gameRunning = false;

    document.getElementById(
        "finalScore"
    ).textContent = score;

    document.getElementById(
        "gameOver"
    ).classList.remove("hidden");
}


function restartGame() {

    plants = [];
    zombies = [];
    bullets = [];
    suns = [];
    explosions = [];

    energy = 200;
    score = 0;
    wave = 1;

    spawnTimer = 0;

    gameRunning = true;

    document.getElementById(
        "gameOver"
    ).classList.add("hidden");

    updateUI();
}


updateUI();
gameLoop();