import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// =========================
// SCENE
// =========================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);
scene.fog = new THREE.Fog(0x111827, 30, 100);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// =========================
// LIGHTING
// =========================

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xffffff, 2);
moonLight.position.set(20, 40, 20);
moonLight.castShadow = true;
scene.add(moonLight);

// =========================
// MATERIALS
// =========================

const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.9
});

const darkStoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.9
});

const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x292929,
    roughness: 0.8
});

const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2814,
    roughness: 0.9
});

// =========================
// GROUND
// =========================

const ground = new THREE.Mesh(
    new THREE.BoxGeometry(100, 1, 12),
    stoneMaterial
);

ground.position.set(0, -0.5, 0);
ground.receiveShadow = true;
scene.add(ground);

// =========================
// CASTLE BACK WALL
// =========================

const castleWall = new THREE.Mesh(
    new THREE.BoxGeometry(100, 12, 1),
    stoneMaterial
);

castleWall.position.set(0, 5.5, -5);
castleWall.castShadow = true;
scene.add(castleWall);

// =========================
// CASTLE TOWERS
// =========================

function createTower(x) {

    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 12, 12),
        stoneMaterial
    );

    tower.position.set(x, 5.5, -4);
    tower.castShadow = true;
    tower.receiveShadow = true;

    scene.add(tower);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3.3, 4, 12),
        roofMaterial
    );

    roof.position.set(x, 13.5, -4);
    roof.castShadow = true;

    scene.add(roof);

    // Battlements
    for (let i = 0; i < 8; i++) {

        const block = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1, 0.6),
            stoneMaterial
        );

        const angle = (i / 8) * Math.PI * 2;

        block.position.set(
            x + Math.cos(angle) * 2.2,
            12,
            -4 + Math.sin(angle) * 2.2
        );

        scene.add(block);
    }

    // Windows
    for (let y = 4; y <= 9; y += 2) {

        const windowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 1, 0.2),
            new THREE.MeshStandardMaterial({
                color: 0xffff66,
                emissive: 0xffaa00,
                emissiveIntensity: 1
            })
        );

        windowMesh.position.set(x, y, -1.55);
        scene.add(windowMesh);
    }
}

createTower(-35);
createTower(-15);
createTower(15);
createTower(35);

// =========================
// CASTLE GATE
// =========================

const gate = new THREE.Mesh(
    new THREE.BoxGeometry(7, 7, 1),
    woodMaterial
);

gate.position.set(31.5, 3, -4.2);
gate.castShadow = true;
scene.add(gate);

// Gate arch
const gateTop = new THREE.Mesh(
    new THREE.TorusGeometry(3.5, 0.5, 8, 20, Math.PI),
    stoneMaterial
);

gateTop.position.set(31.5, 6.5, -4.7);
gateTop.rotation.z = Math.PI;
scene.add(gateTop);

// =========================
// PLATFORMS
// =========================

const platforms = [];

function createPlatform(x, y, width) {

    const platform = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.6, 3),
        darkStoneMaterial
    );

    platform.position.set(x, y, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;

    scene.add(platform);
    platforms.push(platform);
}

createPlatform(-30, 1.5, 6);
createPlatform(-20, 3, 6);
createPlatform(-8, 1.5, 5);
createPlatform(2, 3, 6);
createPlatform(13, 1.5, 5);
createPlatform(24, 3, 6);

// =========================
// PLAYER
// =========================

const player = new THREE.Group();

player.position.set(-45, 0, 0);

scene.add(player);

let playerModel = null;
let mixer = null;

const animationActions = {};
let currentAction = null;

const loader = new GLTFLoader();

loader.load(
    "character.glb",

    function (gltf) {

        console.log("Character loaded!");

        playerModel = gltf.scene;

        // Change this if your character is too big/small
        playerModel.scale.set(1.5, 1.5, 1.5);

        playerModel.position.set(0, 0, 0);

        playerModel.traverse(function (object) {

            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }

        });

        player.add(playerModel);

        // Animations
        if (gltf.animations.length > 0) {

            mixer = new THREE.AnimationMixer(playerModel);

            gltf.animations.forEach(function (clip) {

                const name = clip.name.toLowerCase();

                animationActions[name] =
                    mixer.clipAction(clip);

            });

            console.log(
                "Animations:",
                gltf.animations.map(a => a.name)
            );

            playAnimation("idle");
        }
    },

    function (progress) {

        if (progress.total) {

            console.log(
                "Character loading:",
                Math.round(
                    progress.loaded / progress.total * 100
                ) + "%"
            );
        }
    },

    function (error) {

        console.error(
            "ERROR loading character.glb:",
            error
        );
    }
);

// =========================
// ANIMATION
// =========================

function findAnimation(words) {

    for (const name in animationActions) {

        for (const word of words) {

            if (name.includes(word)) {
                return animationActions[name];
            }
        }
    }

    return null;
}

function playAnimation(type) {

    if (!mixer) return;

    let action = null;

    if (type === "run") {

        action = findAnimation([
            "run",
            "running",
            "walk",
            "walking"
        ]);
    }

    if (type === "jump") {

        action = findAnimation([
            "jump",
            "jumping"
        ]);
    }

    if (type === "idle") {

        action = findAnimation([
            "idle",
            "stand",
            "standing"
        ]);
    }

    if (!action) {

        action = Object.values(animationActions)[0];
    }

    if (!action) return;

    if (currentAction === action) return;

    if (currentAction) {
        currentAction.fadeOut(0.15);
    }

    action.reset();
    action.fadeIn(0.15);
    action.play();

    currentAction = action;
}

// =========================
// COINS
// =========================

const coins = [];

function createCoin(x, y) {

    const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.12, 8, 16),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.7
        })
    );

    coin.position.set(x, y, 0);

    scene.add(coin);

    coins.push(coin);
}

createCoin(-30, 3);
createCoin(-20, 4.5);
createCoin(-8, 3);
createCoin(2, 4.5);
createCoin(13, 3);
createCoin(24, 4.5);

// =========================
// ENEMIES
// =========================

const enemies = [];

function createEnemy(x) {

    const enemy = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 16, 16),
        new THREE.MeshStandardMaterial({
            color: 0x8b0000
        })
    );

    enemy.position.set(x, 0.7, 0);
    enemy.castShadow = true;

    scene.add(enemy);

    enemies.push({
        mesh: enemy,
        direction: 1
    });
}

createEnemy(-25);
createEnemy(-2);
createEnemy(18);

// =========================
// FINISH FLAG
// =========================

const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(
        0.08,
        0.08,
        5,
        8
    ),
    new THREE.MeshStandardMaterial({
        color: 0xffffff
    })
);

flagPole.position.set(31.5, 2.5, 0);

scene.add(flagPole);

const flag = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.2, 0.1),
    new THREE.MeshStandardMaterial({
        color: 0x55ff88,
        emissive: 0x226633
    })
);

flag.position.set(32.4, 4, 0);

scene.add(flag);

// =========================
// CONTROLS
// =========================

const keys = {};

document.addEventListener("keydown", function(event) {

    keys[event.code] = true;

    if (
        event.code === "Space" &&
        Math.abs(velocityY) < 0.001
    ) {

        velocityY = 0.25;

        playAnimation("jump");
    }

});

document.addEventListener("keyup", function(event) {

    keys[event.code] = false;
});

// =========================
// GAME VARIABLES
// =========================

let velocityY = 0;

const gravity = -0.012;

let lives = 3;
let coinCount = 0;
let score = 0;

let gameStarted = false;
let gameFinished = false;

// =========================
// START BUTTON
// =========================

document
    .getElementById("startButton")
    .addEventListener("click", function() {

        gameStarted = true;

        document
            .getElementById("message")
            .classList.add("hidden");

        playAnimation("idle");
    });

// =========================
// PLAYER MOVEMENT
// =========================

function updatePlayer(delta) {

    if (!gameStarted || gameFinished) return;

    const speed = 0.12;

    const movingRight =
        keys.ArrowRight ||
        keys.KeyD;

    const movingLeft =
        keys.ArrowLeft ||
        keys.KeyA;

    if (movingRight) {

        player.position.x += speed;

        if (playerModel) {
            playerModel.rotation.y = Math.PI / 2;
        }
    }

    if (movingLeft) {

        player.position.x -= speed;

        if (playerModel) {
            playerModel.rotation.y = -Math.PI / 2;
        }
    }

    // Vertical movement
    const oldY = player.position.y;

    velocityY += gravity;

    player.position.y += velocityY;

    // Ground collision
    if (player.position.y <= 0) {

        player.position.y = 0;

        velocityY = 0;
    }

    // Platform collision
    for (const platform of platforms) {

        const width =
            platform.geometry.parameters.width;

        const height =
            platform.geometry.parameters.height;

        const platformLeft =
            platform.position.x - width / 2;

        const platformRight =
            platform.position.x + width / 2;

        const platformTop =
            platform.position.y + height / 2;

        const playerLeft =
            player.position.x - 0.5;

        const playerRight =
            player.position.x + 0.5;

        const horizontalOverlap =
            playerRight > platformLeft &&
            playerLeft < platformRight;

        const crossedPlatform =
            oldY <= platformTop &&
            player.position.y >= platformTop;

        if (
            velocityY <= 0 &&
            horizontalOverlap &&
            crossedPlatform
        ) {

            player.position.y = platformTop;

            velocityY = 0;
        }
    }

    // Animation
    if (mixer) {

        mixer.update(delta);

        if (velocityY > 0.02) {

            playAnimation("jump");
        }
        else if (movingRight || movingLeft) {

            playAnimation("run");
        }
        else {

            playAnimation("idle");
        }
    }
}

// =========================
// COIN UPDATE
// =========================

function updateCoins() {

    for (let i = coins.length - 1; i >= 0; i--) {

        const coin = coins[i];

        coin.rotation.y += 0.06;

        const distance =
            player.position.distanceTo(
                coin.position
            );

        if (distance < 1.5) {

            scene.remove(coin);

            coins.splice(i, 1);

            coinCount++;

            score += 100;

            document.getElementById("coins")
                .textContent = coinCount;

            document.getElementById("score")
                .textContent = score;
        }
    }
}

// =========================
// ENEMY UPDATE
// =========================

function updateEnemies() {

    for (const enemy of enemies) {

        enemy.mesh.position.x +=
            enemy.direction * 0.02;

        if (
            enemy.mesh.position.x > 30 ||
            enemy.mesh.position.x < -40
        ) {

            enemy.direction *= -1;
        }

        const distance =
            player.position.distanceTo(
                enemy.mesh.position
            );

        if (distance < 1.2) {

            lives--;

            document.getElementById("lives")
                .textContent = lives;

            player.position.set(-45, 0, 0);

            velocityY = 0;

            if (lives <= 0) {

                gameFinished = true;

                document
                    .getElementById("gameOver")
                    .classList.remove("hidden");
            }
        }
    }
}

// =========================
// FINISH
// =========================

function checkFinish() {

    if (player.position.x >= 31) {

        gameFinished = true;

        document.getElementById("finalCoins")
            .textContent = coinCount;

        document.getElementById("finalScore")
            .textContent = score;

        document
            .getElementById("levelComplete")
            .classList.remove("hidden");
    }
}

// =========================
// CAMERA
// =========================

function updateCamera() {

    camera.position.x +=
        (
            player.position.x + 8 -
            camera.position.x
        ) * 0.08;

    camera.position.y +=
        (
            6 -
            camera.position.y
        ) * 0.08;

    camera.position.z = 18;

    camera.lookAt(
        player.position.x + 4,
        3,
        0
    );
}

// =========================
// RESIZE
// =========================

window.addEventListener(
    "resize",
    function() {

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

// =========================
// GAME LOOP
// =========================

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const delta =
        Math.min(clock.getDelta(), 0.05);

    updatePlayer(delta);

    updateCoins();

    updateEnemies();

    checkFinish();

    updateCamera();

    renderer.render(
        scene,
        camera
    );
}

camera.position.set(-35, 6, 18);

animate();