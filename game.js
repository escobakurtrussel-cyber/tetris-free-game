const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// Colors for tetrominos
const COLORS = ['#00F0F1', '#FFFF00', '#FF00FF', '#00FF00', '#FF0000', '#0000FF', '#FFA500'];
const SHAPES = [
    [[1, 1, 1, 1]],           // I
    [[1, 1], [1, 1]],         // O
    [[0, 1, 0], [1, 1, 1]],   // T
    [[0, 1, 1], [1, 1, 0]],   // S
    [[1, 1, 0], [0, 1, 1]],   // Z
    [[1, 0, 0], [1, 1, 1]],   // J
    [[0, 0, 1], [1, 1, 1]]    // L
];

let gameBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = true;
let gameSpeed = 1000;
let lastDropTime = 0;
let keys = {};

class Tetromino {
    constructor(shapeIndex = null) {
        const index = shapeIndex !== null ? shapeIndex : Math.floor(Math.random() * SHAPES.length);
        this.shape = SHAPES[index];
        this.colorIndex = index;
        this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
    }

    rotate() {
        const newShape = this.shape[0].map((_, i) =>
            this.shape.map(row => row[i]).reverse()
        );
        const oldShape = this.shape;
        this.shape = newShape;
        
        if (!isValidMove(this.x, this.y, this.shape)) {
            this.shape = oldShape;
        }
    }

    draw(ctx, offsetX = 0, offsetY = 0, blockSize = BLOCK_SIZE) {
        this.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    ctx.fillStyle = COLORS[this.colorIndex];
                    ctx.fillRect(
                        (offsetX + this.x + x) * blockSize,
                        (offsetY + this.y + y) * blockSize,
                        blockSize,
                        blockSize
                    );
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        (offsetX + this.x + x) * blockSize,
                        (offsetY + this.y + y) * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            });
        });
    }
}

function isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                
                if (newY >= 0 && gameBoard[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function lockPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    gameBoard[boardY][boardX] = currentPiece.colorIndex + 1;
                }
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        if (gameBoard[row].every(cell => cell !== 0)) {
            gameBoard.splice(row, 1);
            gameBoard.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        const points = [100, 300, 500, 800];
        score += points[linesCleared - 1] || 100;
        updateLevel();
    }
    
    return linesCleared;
}

function updateLevel() {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
        level = newLevel;
        gameSpeed = Math.max(200, 1000 - (level - 1) * 50);
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

function spawnPiece() {
    if (nextPiece === null) {
        currentPiece = new Tetromino();
        nextPiece = new Tetromino();
    } else {
        currentPiece = nextPiece;
        nextPiece = new Tetromino();
    }
    
    if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        endGame();
    }
}

function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('finalLines').textContent = lines;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function restartGame() {
    gameBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    currentPiece = null;
    nextPiece = null;
    score = 0;
    lines = 0;
    level = 1;
    gameSpeed = 1000;
    lastDropTime = 0;
    gameRunning = true;
    document.getElementById('gameOverScreen').classList.add('hidden');
    updateScore();
    spawnPiece();
    gameLoop();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // Draw locked pieces
    gameBoard.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell !== 0) {
                ctx.fillStyle = COLORS[cell - 1];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
    
    // Draw current piece
    if (currentPiece) {
        currentPiece.draw(ctx);
    }
    
    // Draw next piece preview
    nextCtx.fillStyle = '#f0f0f0';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const previewX = (nextCanvas.width - nextPiece.shape[0].length * 20) / 40;
        const previewY = (nextCanvas.height - nextPiece.shape.length * 20) / 40;
        nextCtx.save();
        nextCtx.scale(0.67, 0.67);
        nextPiece.draw(nextCtx, previewX, previewY, 20);
        nextCtx.restore();
    }
}

function update(deltaTime) {
    if (!gameRunning) return;
    
    lastDropTime += deltaTime;
    
    // Handle input
    if (keys['ArrowLeft'] || keys['a']) {
        if (isValidMove(currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
            currentPiece.x--;
        }
        keys['ArrowLeft'] = keys['a'] = false;
    }
    
    if (keys['ArrowRight'] || keys['d']) {
        if (isValidMove(currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
            currentPiece.x++;
        }
        keys['ArrowRight'] = keys['d'] = false;
    }
    
    if (keys['ArrowUp'] || keys['z'] || keys['Z']) {
        currentPiece.rotate();
        keys['ArrowUp'] = keys['z'] = keys['Z'] = false;
    }
    
    const dropSpeed = keys[' '] ? 50 : gameSpeed;
    
    if (lastDropTime > dropSpeed) {
        if (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
            currentPiece.y++;
        } else {
            lockPiece();
            clearLines();
            spawnPiece();
        }
        lastDropTime = 0;
    }
    
    if (keys['ArrowDown']) {
        if (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
            currentPiece.y++;
            score += 1;
        }
    }
    
    updateScore();
}

function gameLoop(currentTime = 0) {
    const deltaTime = 16; // Approximate 60 FPS
    
    update(deltaTime);
    draw();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < -50) {
            keys['ArrowLeft'] = true;
            touchStartX = touchEndX;
        } else if (diffX > 50) {
            keys['ArrowRight'] = true;
            touchStartX = touchEndX;
        }
    } else {
        if (diffY > 50) {
            keys['ArrowDown'] = true;
            touchStartY = touchEndY;
        }
    }
});

canvas.addEventListener('tap', () => {
    if (gameRunning) {
        currentPiece.rotate();
    }
});

// Start game
spawnPiece();
gameLoop();
