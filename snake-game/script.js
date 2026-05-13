const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
let tileCountX, tileCountY;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoopInterval;
let isGameOver = false;
let isPaused = true;

document.getElementById('highScore').innerText = highScore;

// Audio Setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

function resizeCanvas() {
    // Keep canvas aspect ratio 1:1 visually via CSS, but internally use a fixed resolution
    // to keep logic simple, or scale it. We'll use fixed 400x400 internally for crisp logic
    tileCountX = canvas.width / gridSize;
    tileCountY = canvas.height / gridSize;
}

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    document.getElementById('score').innerText = score;
    isGameOver = false;
    document.getElementById('gameOverOverlay').style.display = 'none';
    spawnFood();
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCountX);
    food.y = Math.floor(Math.random() * tileCountY);

    // Check if food spawns on snake
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            spawnFood();
            return;
        }
    }
}

function drawGame() {
    if (isPaused) return;

    clearCanvas();
    moveSnake();

    if (isGameOver) {
        handleGameOver();
        return;
    }

    checkFoodCollision();
    drawFood();
    drawSnake();
}

function clearCanvas() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? '#00ff88' : '#00cc6a';
        ctx.shadowBlur = index === 0 ? 10 : 0;
        ctx.shadowColor = '#00ff88';
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
        ctx.shadowBlur = 0;
    });
}

function drawFood() {
    ctx.fillStyle = '#ff3366';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff3366';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        isGameOver = true;
        return;
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            isGameOver = true;
            return;
        }
    }

    snake.unshift(head);
    snake.pop();
}

function checkFoodCollision() {
    if (snake[0].x === food.x && snake[0].y === food.y) {
        playSound('eat');
        score += 10;
        document.getElementById('score').innerText = score;

        // Grow snake
        const tail = snake[snake.length - 1];
        snake.push({ x: tail.x, y: tail.y });

        spawnFood();
    }
}

function handleGameOver() {
    playSound('die');
    clearInterval(gameLoopInterval);
    document.getElementById('gameOverOverlay').style.display = 'flex';

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').innerText = highScore;
    }
}

function startGame() {
    if (!isPaused && !isGameOver) return;
    document.getElementById('startOverlay').style.display = 'none';
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (isGameOver) {
        initGame();
    }
    isPaused = false;
    clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(drawGame, 100);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        startGame();
        return;
    }

    if (isPaused) return;

    if ((e.key === 'ArrowUp' || e.key === 'w') && dy === 0) {
        dx = 0; dy = -1;
    } else if ((e.key === 'ArrowDown' || e.key === 's') && dy === 0) {
        dx = 0; dy = 1;
    } else if ((e.key === 'ArrowLeft' || e.key === 'a') && dx === 0) {
        dx = -1; dy = 0;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && dx === 0) {
        dx = 1; dy = 0;
    }
});

// Mobile Controls
document.getElementById('upBtn').addEventListener('click', () => { if(dy === 0){dx=0; dy=-1; startGame();} });
document.getElementById('downBtn').addEventListener('click', () => { if(dy === 0){dx=0; dy=1; startGame();} });
document.getElementById('leftBtn').addEventListener('click', () => { if(dx === 0){dx=-1; dy=0; startGame();} });
document.getElementById('rightBtn').addEventListener('click', () => { if(dx === 0){dx=1; dy=0; startGame();} });

document.getElementById('playAgainBtn').addEventListener('click', () => {
    initGame();
    startGame();
});

resizeCanvas();
initGame();
drawGame(); // Initial draw
