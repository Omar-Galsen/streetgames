const board = document.getElementById("board");

const scoreDisplay = document.getElementById("score");
const bestDisplay = document.getElementById("best");
const message = document.getElementById("message");

const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");


let score = 0;

let bestScore =
    Number(localStorage.getItem("chessPuzzleBest")) || 0;

let selectedSquare = null;

let currentPuzzle = 0;

let hintUsed = false;


/* =========================
   CHESS PIECES
========================= */

const pieces = {

    white: {
        king: "♔",
        queen: "♕",
        rook: "♖",
        bishop: "♗",
        knight: "♘",
        pawn: "♙"
    },

    black: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟"
    }

};


/* =========================
   PUZZLES
========================= */

const puzzles = [

    {
        message: "Find the winning move!",
        position: {

            e1: ["white", "king"],
            d1: ["white", "queen"],
            a1: ["white", "rook"],
            f1: ["white", "bishop"],
            g1: ["white", "knight"],

            a2: ["white", "pawn"],
            b2: ["white", "pawn"],
            c2: ["white", "pawn"],
            f2: ["white", "pawn"],
            g2: ["white", "pawn"],
            h2: ["white", "pawn"],

            e8: ["black", "king"],
            d8: ["black", "queen"],
            a8: ["black", "rook"],
            h8: ["black", "rook"],

            a7: ["black", "pawn"],
            b7: ["black", "pawn"],
            c7: ["black", "pawn"],
            d7: ["black", "pawn"],
            f7: ["black", "pawn"],
            g7: ["black", "pawn"],
            h7: ["black", "pawn"],

            e5: ["black", "pawn"]

        },

        correctFrom: "d1",
        correctTo: "h5"
    },


    {
        message: "Can you spot the attack?",

        position: {

            e1: ["white", "king"],
            d1: ["white", "queen"],
            a1: ["white", "rook"],
            h1: ["white", "rook"],

            c4: ["white", "bishop"],
            f3: ["white", "knight"],

            a2: ["white", "pawn"],
            b2: ["white", "pawn"],
            c2: ["white", "pawn"],
            d2: ["white", "pawn"],
            e2: ["white", "pawn"],
            g2: ["white", "pawn"],
            h2: ["white", "pawn"],

            e8: ["black", "king"],
            a8: ["black", "rook"],
            h8: ["black", "rook"],

            a7: ["black", "pawn"],
            b7: ["black", "pawn"],
            c7: ["black", "pawn"],
            d7: ["black", "pawn"],
            f7: ["black", "pawn"],
            g7: ["black", "pawn"],
            h7: ["black", "pawn"],

            e5: ["black", "pawn"],
            f6: ["black", "knight"]

        },

        correctFrom: "c4",
        correctTo: "f7"
    },


    {
        message: "Find the powerful move!",

        position: {

            e1: ["white", "king"],
            d1: ["white", "queen"],
            f1: ["white", "bishop"],
            b1: ["white", "knight"],

            a2: ["white", "pawn"],
            b2: ["white", "pawn"],
            c2: ["white", "pawn"],
            d2: ["white", "pawn"],
            e2: ["white", "pawn"],
            f2: ["white", "pawn"],
            g2: ["white", "pawn"],
            h2: ["white", "pawn"],

            e8: ["black", "king"],
            d8: ["black", "queen"],
            a8: ["black", "rook"],
            h8: ["black", "rook"],

            a7: ["black", "pawn"],
            b7: ["black", "pawn"],
            c7: ["black", "pawn"],
            d7: ["black", "pawn"],
            e7: ["black", "pawn"],
            f7: ["black", "pawn"],
            g7: ["black", "pawn"],
            h7: ["black", "pawn"],

            e5: ["black", "pawn"]

        },

        correctFrom: "d1",
        correctTo: "h5"
    }

];


/* =========================
   START GAME
========================= */

function startGame() {

    document.getElementById("menu").style.display = "none";

    document.getElementById("game").style.display = "block";

    score = 0;

    updateStats();

    newPuzzle();
}


/* =========================
   NEW PUZZLE
========================= */

function newPuzzle() {

    selectedSquare = null;

    hintUsed = false;

    result.style.display = "none";

    currentPuzzle =
        Math.floor(Math.random() * puzzles.length);

    const puzzle = puzzles[currentPuzzle];

    message.textContent = puzzle.message;

    drawBoard(puzzle.position);
}


/* =========================
   DRAW BOARD
========================= */

function drawBoard(position) {

    board.innerHTML = "";

    const files = ["a","b","c","d","e","f","g","h"];

    for (let row = 7; row >= 0; row--) {

        for (let col = 0; col < 8; col++) {

            const square = document.createElement("div");

            const file = files[col];

            const rank = row + 1;

            const squareName =
                file + rank;

            square.classList.add("square");

            if ((row + col) % 2 === 0) {
                square.classList.add("light");
            } else {
                square.classList.add("dark");
            }


            square.dataset.square =
                squareName;


            if (position[squareName]) {

                const [color, type] =
                    position[squareName];

                const piece =
                    document.createElement("span");

                piece.classList.add("piece");

                piece.classList.add(
                    color === "white"
                        ? "white-piece"
                        : "black-piece"
                );

                piece.textContent =
                    pieces[color][type];

                square.appendChild(piece);
            }


            square.addEventListener(
                "click",
                () => handleSquareClick(squareName)
            );


            board.appendChild(square);
        }
    }
}


/* =========================
   CLICK SQUARE
========================= */

function handleSquareClick(squareName) {

    if (selectedSquare === null) {

        const puzzle =
            puzzles[currentPuzzle];

        if (puzzle.position[squareName]) {

            const [color] =
                puzzle.position[squareName];

            if (color === "white") {

                selectedSquare =
                    squareName;

                highlightSelected();

                message.textContent =
                    "Choose where to move it.";
            }
        }

        return;
    }


    checkMove(
        selectedSquare,
        squareName
    );
}


/* =========================
   CHECK MOVE
========================= */

function checkMove(from, to) {

    const puzzle =
        puzzles[currentPuzzle];


    if (
        from === puzzle.correctFrom &&
        to === puzzle.correctTo
    ) {

        showCorrectMove(
            from,
            to
        );

    } else {

        showWrongMove(
            from,
            to
        );
    }
}


/* =========================
   CORRECT
========================= */

function showCorrectMove(from, to) {

    const squares =
        document.querySelectorAll(".square");


    squares.forEach(square => {

        if (
            square.dataset.square === from ||
            square.dataset.square === to
        ) {

            square.classList.add("correct");
        }

    });


    score++;

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "chessPuzzleBest",
            bestScore
        );
    }

    updateStats();

    message.textContent =
        "Excellent move! ♟️";


    setTimeout(() => {

        resultTitle.textContent =
            "♟️ PUZZLE SOLVED!";

        resultText.textContent =
            "Great move! Your score is " +
            score + ".";

        result.style.display =
            "flex";

    }, 650);
}


/* =========================
   WRONG
========================= */

function showWrongMove(from, to) {

    const squares =
        document.querySelectorAll(".square");


    squares.forEach(square => {

        if (
            square.dataset.square === to
        ) {

            square.classList.add("wrong");

        }

    });


    message.textContent =
        "Not quite. Try again!";


    setTimeout(() => {

        squares.forEach(square => {

            square.classList.remove("wrong");

        });

        selectedSquare = null;

        message.textContent =
            puzzles[currentPuzzle].message;

    }, 500);
}


/* =========================
   SELECTED
========================= */

function highlightSelected() {

    const squares =
        document.querySelectorAll(".square");

    squares.forEach(square => {

        square.classList.remove("selected");

        if (
            square.dataset.square ===
            selectedSquare
        ) {

            square.classList.add("selected");

        }

    });
}


/* =========================
   HINT
========================= */

function showHint() {

    const puzzle =
        puzzles[currentPuzzle];

    const squares =
        document.querySelectorAll(".square");


    squares.forEach(square => {

        square.classList.remove("hint");

        if (
            square.dataset.square ===
            puzzle.correctTo
        ) {

            square.classList.add("hint");
        }

    });


    message.textContent =
        "💡 Look at the highlighted square!";

    hintUsed = true;


    setTimeout(() => {

        squares.forEach(square => {

            square.classList.remove("hint");

        });

    }, 1500);
}


/* =========================
   STATS
========================= */

function updateStats() {

    scoreDisplay.textContent =
        score;

    bestDisplay.textContent =
        bestScore;
}