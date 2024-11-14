const board = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const width = 8;
const candyColors = ["red", "yellow", "green", "blue", "purple", "orange"];
let squares = [];
let score = 0;
let selectedCandy = null;
let bombPresent = false;
const crushSound = new Audio('crush-sound.wav');

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Initialize the game board
function createBoard() {
    squares = [];
    for (let i = 0; i < width * width; i++) {
        const square = document.createElement("div");
        let randomColor = Math.floor(Math.random() * candyColors.length);
        square.classList.add("candy", candyColors[randomColor]);
        square.setAttribute("id", i);
        square.setAttribute("draggable", true);
        square.addEventListener("dragstart", handleDragStart);
        square.addEventListener("dragover", handleDragOver);
        square.addEventListener("drop", handleDrop);
        square.addEventListener("touchstart", handleTouchStart);
        square.addEventListener("touchend", handleTouchEnd);
        board.appendChild(square);
        squares.push(square);
    }
    checkAndClearMatches();
    updateScore();
}

function updateScore() {
    scoreDisplay.textContent = "Score: " + score;
}

createBoard();

// Desktop Drag and Drop Handlers
let dragCandy = null;

function handleDragStart(event) {
    dragCandy = event.target;
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    event.preventDefault();
    if (!dragCandy || dragCandy === event.target) return;

    const draggedIndex = parseInt(dragCandy.id);
    const targetIndex = parseInt(event.target.id);

    if (isAdjacent(draggedIndex, targetIndex)) {
        swapCandies(dragCandy, event.target);
        checkAndClearMatches();
    }
    dragCandy = null;
}

// Mobile Swipe Handlers
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    selectedCandy = event.target;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    handleSwipe();
}

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const selectedIndex = parseInt(selectedCandy.id);

    let targetIndex;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && selectedIndex % width < width - 1) {
            targetIndex = selectedIndex + 1; // Swipe right
        } else if (deltaX < 0 && selectedIndex % width > 0) {
            targetIndex = selectedIndex - 1; // Swipe left
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && selectedIndex + width < width * width) {
            targetIndex = selectedIndex + width; // Swipe down
        } else if (deltaY < 0 && selectedIndex - width >= 0) {
            targetIndex = selectedIndex - width; // Swipe up
        }
    }

    if (targetIndex !== undefined && isAdjacent(selectedIndex, targetIndex)) {
        swapCandies(squares[selectedIndex], squares[targetIndex]);
        checkAndClearMatches();
    }
    selectedCandy = null;
}

function isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / width);
    const row2 = Math.floor(index2 / width);
    return (Math.abs(index1 - index2) === 1 && row1 === row2) || (Math.abs(index1 - index2) === width);
}

// Swap candies and check for matches
function swapCandies(candy1, candy2) {
    const color1 = candy1.classList[1];
    const color2 = candy2.classList[1];

    candy1.classList.replace(color1, color2);
    candy2.classList.replace(color2, color1);
}

function checkMatches() {
    let matchesFound = false;

    // Check row matches
    for (let i = 0; i < 64; i++) {
        if (i % width > width - 3) continue;
        let match = [i];
        let decidedColor = squares[i].className.split(" ")[1];
        if (decidedColor === "blank") continue;

        for (let j = 1; j < width - i % width && squares[i + j].className.includes(decidedColor); j++) {
            match.push(i + j);
        }

        if (match.length >= 3) {
            match.forEach(index => {
                squares[index].className = "candy blank";
            });
            addScore(match.length);
            playCrushSound();
            matchesFound = true;
        }
    }

    // Check column matches
    for (let i = 0; i < 47; i++) {
        let match = [i];
        let decidedColor = squares[i].className.split(" ")[1];
        if (decidedColor === "blank") continue;

        for (let j = 1; j < 8 && squares[i + j * width].className.includes(decidedColor); j++) {
            match.push(i + j * width);
        }

        if (match.length >= 3) {
            match.forEach(index => {
                squares[index].className = "candy blank";
            });
            addScore(match.length);
            playCrushSound();
            matchesFound = true;
        }
    }

    return matchesFound;
}

function addScore(matchLength) {
    score += matchLength * 10;
    updateScore();
}

function playCrushSound() {
    crushSound.play();
}

function moveDown() {
    for (let i = 0; i < 56; i++) {
        if (squares[i + width].classList.contains("blank")) {
            squares[i + width].className = squares[i].className;
            squares[i].className = "candy blank";
        }
    }
}

function fillBlanks() {
    for (let i = 0; i < width; i++) {
        if (squares[i].classList.contains("blank")) {
            let randomColor = Math.floor(Math.random() * candyColors.length);
            squares[i].className = `candy ${candyColors[randomColor]}`;
        }
    }
}

function checkAndClearMatches() {
    let matchesFound;
    do {
        matchesFound = checkMatches();
        moveDown();
        fillBlanks();
    } while (matchesFound);
}

// Add bomb every 30 seconds
setInterval(() => {
    if (!bombPresent) {
        let randomIndex = Math.floor(Math.random() * squares.length);
        squares[randomIndex].className = "candy bomb";
        bombPresent = true;
    }
}, 30000);

function triggerBomb(index) {
    const surroundingIndices = [
        index - width, index - width - 1, index - width + 1,
        index - 1, index, index + 1,
        index + width, index + width - 1, index + width + 1
    ];

    surroundingIndices.forEach(idx => {
        if (idx >= 0 && idx < width * width) {
            squares[idx].className = "candy blank";
        }
    });
    addScore(30);
}

board.addEventListener("click", (event) => {
    if (event.target.classList.contains("bomb")) {
        const index = parseInt(event.target.id);
        triggerBomb(index);
        playCrushSound();
        event.target.classList.add("blank");
        bombPresent = false;
    }
});

setInterval(() => {
    checkAndClearMatches();
}, 1000);
