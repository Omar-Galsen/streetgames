const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const background = new Image();
background.src = "/games/runner/bckgrnd.jpg";

const character = new Image();
character.src = "/games/runner/character.jpeg";

let player = {
x: 100,
y: 300,
width: 60,
height: 70,
velocityY: 0,
jumping: false
};

const gravity = 1;
const ground = 360;

// SPACE TO JUMP
document.addEventListener("keydown", function(event) {

```
if (event.code === "Space" && !player.jumping) {
    player.velocityY = -18;
    player.jumping = true;
}
```

});

function update() {

```
player.velocityY += gravity;
player.y += player.velocityY;

if (player.y + player.height >= ground) {

    player.y = ground - player.height;
    player.velocityY = 0;
    player.jumping = false;

}
```

}

function draw() {

```
// Clear screen
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Background
if (background.complete) {
    ctx.drawImage(
        background,
        0,
        0,
        canvas.width,
        canvas.height
    );
} else {
    ctx.fillStyle = "skyblue";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

// Ground
ctx.fillStyle = "green";
ctx.fillRect(
    0,
    ground,
    canvas.width,
    40
);

// Character
if (character.complete) {
    ctx.drawImage(
        character,
        player.x,
        player.y,
        player.width,
        player.height
    );
} else {
    ctx.fillStyle = "red";
    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );
}
```

}

function gameLoop() {

```
update();
draw();

requestAnimationFrame(gameLoop);
```

}

gameLoop();
