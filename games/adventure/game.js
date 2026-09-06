import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(0x87ceeb, 25, 100);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);


// =============================
// LIGHTING
// =============================

const sunlight = new THREE.DirectionalLight(
    0xffffff,
    2
);

sunlight.position.set(20, 30, 10);
sunlight.castShadow = true;

scene.add(sunlight);

const ambient = new THREE.AmbientLight(
    0xffffff,
    0.6
);

scene.add(ambient);


// =============================
// GROUND
// =============================

const groundGeometry = new THREE.BoxGeometry(
    100,
    1,
    12
);

const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b9b45
});

const ground = new THREE.Mesh(
    groundGeometry,
    groundMaterial
);

ground.position.set(0, -0.5, 0);
ground.receiveShadow = true;

scene.add(ground);


// =============================
// PLAYER
// =============================

const player = new THREE.Group();

const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.2, 0.8),
    new THREE.MeshStandardMaterial({
        color: 0x2878ff
    })
);

body.position.y = 0.6;
body.castShadow = true;

player.add(body);


const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 16),
    new THREE.MeshStandardMaterial({
        color: 0xffc18a
    })
);

head.position.y = 1.45;
head.castShadow = true;

player.add(head);


player.position.set(-35, 0, 0);

scene.add(player);


// =============================
// PLATFORMS
// =============================

const platforms = [];

function createPlatform(x, y, z, width, height = 0.6) {

    const geometry = new THREE.BoxGeometry(
        width,
        height,
        3
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x8b5a2b
    });

    const platform = new THREE.Mesh(
        geometry,
        material
    );

    platform.position.set(x, y, z);

    platform.castShadow = true;
    platform.receiveShadow = true;

    scene.add(platform);

    platforms.push(platform);
}


// Main path

createPlatform(-25, 1.5, 0, 6);
createPlatform(-16, 2.5, 0, 5);
createPlatform(-7, 1.5, 0, 7);
createPlatform(3, 3, 0, 5);
createPlatform(13, 1.5, 0, 7);
createPlatform(24, 2.5, 0, 6);


// =============================
// COINS
// =============================

const coins = [];

function createCoin(x, y, z) {

    const geometry = new THREE.TorusGeometry(
        0.35,
        0.1,
        12,
        24
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0x996600
    });

    const coin = new THREE.Mesh(
        geometry,
        material
    );

    coin.position.set(x, y, z);

    coin.rotation.x = Math.PI / 2;

    scene.add(coin);

    coins.push(coin);
}


createCoin(-27, 3, 0);
createCoin(-25, 3, 0);
createCoin(-16, 4, 0);
createCoin(-7, 3, 0);
createCoin(3, 4.5, 0);
createCoin(13, 3, 0);
createCoin(24, 4, 0);


// =============================
// ENEMIES
// =============================

const enemies = [];

function createEnemy(x, z) {

    const enemy = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1, 0.8),
        new THREE.MeshStandardMaterial({
            color: 0x7b2cff
        })
    );

    body.position.y = 0.5;
    body.castShadow = true;

    enemy.add(body);


    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        new THREE.MeshStandardMaterial({
            color: 0x66cc66
        })
    );

    head.position.y = 1.25;
    head.castShadow = true;

    enemy.add(head);


    enemy.position.set(x, 0, z);

    scene.add(enemy);

    enemies.push({
        mesh: enemy,
        speed: 0.015 + Math.random() * 0.01,
        alive: true
    });
}


createEnemy(-20, 0);
createEnemy(-2, 0);
createEnemy(10, 0);
createEnemy(20, 0);


// =============================
// TREES
// =============================

function createTree(x, z) {

    const tree = new THREE.Group();


    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.3,
            0.4,
            2,
            10
        ),
        new THREE.MeshStandardMaterial({
            color: 0x704214
        })
    );

    trunk.position.y = 1;

    tree.add(trunk);


    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(
            1.4,
            16,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0x228b22
        })
    );

    leaves.position.y = 2.5;

    tree.add(leaves);

    tree.position.set(x, 0, z);

    scene.add(tree);
}


createTree(-30, -4);
createTree(-10, -4);
createTree(8, -4);
createTree(28, -4);


// =============================
// FINISH FLAG
// =============================

const flag = new THREE.Group();

const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(
        0.08,
        0.08,
        4,
        10
    ),
    new THREE.MeshStandardMaterial({
        color: 0xffffff
    })
);

pole.position.y = 2;

flag.add(pole);


const flagShape = new THREE.Mesh(
    new THREE.BoxGeometry(
        1.5,
        0.8,
        0.1
    ),
    new THREE.MeshStandardMaterial({
        color: 0xff3333
    })
);

flagShape.position.set(
    0.7,
    3.3,
    0
);

flag.add(flagShape);

flag.position.set(30, 0, 0);

scene.add(flag);


// =============================
// CONTROLS
// =============================

const keys = {};

window.addEventListener("keydown", event => {

    keys[event.code] = true;

    if (
        event.code === "Space" &&
        player.position.y <= 0.05
    ) {
        velocityY = 0.25;
    }
});


window.addEventListener("keyup", event => {

    keys[event.code] = false;
});


// =============================
// PHYSICS
// =============================

let velocityY = 0;

const gravity = -0.012;

let lives = 3;
let coinCount = 0;
let score = 0;

let gameStarted = false;
let gameFinished = false;


// =============================
// START BUTTON
// =============================

document.getElementById("startButton").addEventListener(
    "click",
    () => {

        gameStarted = true;

        document.getElementById(
            "message"
        ).classList.add("hidden");
    }
);


// =============================
// PLAYER MOVEMENT
// =============================

function updatePlayer() {

    if (!gameStarted || gameFinished) return;


    let speed = 0.12;


    if (
        keys["ArrowLeft"] ||
        keys["KeyA"]
    ) {
        player.position.x -= speed;
    }


    if (
        keys["ArrowRight"] ||
        keys["KeyD"]
    ) {
        player.position.x += speed;
    }


    // Gravity

    velocityY += gravity;

    player.position.y += velocityY;


    // Ground

    if (player.position.y < 0) {

        player.position.y = 0;

        velocityY = 0;
    }


    // Camera

    camera.position.x =
        player.position.x + 6;

    camera.position.y = 6;

    camera.position.z = 12;

    camera.lookAt(
        player.position.x + 5,
        1,
        0
    );
}


// =============================
// COIN COLLECTION
// =============================

function updateCoins() {

    coins.forEach((coin, index) => {

        coin.rotation.z += 0.05;

        const distance =
            player.position.distanceTo(
                coin.position
            );

        if (distance < 1.2) {

            scene.remove(coin);

            coins.splice(index, 1);

            coinCount++;
            score += 100;

            updateHUD();
        }
    });
}


// =============================
// ENEMIES
// =============================

function updateEnemies() {

    enemies.forEach(enemy => {

        if (!enemy.alive) return;


        enemy.mesh.position.x -=
            enemy.speed;


        const distance =
            player.position.distanceTo(
                enemy.mesh.position
            );


        if (distance < 1.3) {

            enemy.alive = false;

            scene.remove(enemy.mesh);

            lives--;

            updateHUD();


            if (lives <= 0) {

                endGame();
            }
        }
    });
}


// =============================
// FINISH
// =============================

function checkFinish() {

    if (
        player.position.x >
        flag.position.x - 1
    ) {

        gameFinished = true;

        document.getElementById(
            "finalCoins"
        ).textContent = coinCount;

        document.getElementById(
            "finalScore"
        ).textContent = score;

        document.getElementById(
            "levelComplete"
        ).classList.remove("hidden");
    }
}


// =============================
// GAME OVER
// =============================

function endGame() {

    gameFinished = true;

    document.getElementById(
        "finalScore"
    ).textContent = score;

    document.getElementById(
        "gameOver"
    ).classList.remove("hidden");
}


// =============================
// HUD
// =============================

function updateHUD() {

    document.getElementById(
        "lives"
    ).textContent = lives;

    document.getElementById(
        "coins"
    ).textContent = coinCount;

    document.getElementById(
        "score"
    ).textContent = score;
}


// =============================
// ANIMATION
// =============================

function animate() {

    requestAnimationFrame(animate);


    if (gameStarted && !gameFinished) {

        updatePlayer();

        updateCoins();

        updateEnemies();

        checkFinish();
    }


    renderer.render(
        scene,
        camera
    );
}


window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


updateHUD();

animate();