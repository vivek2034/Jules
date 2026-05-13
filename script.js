// Canvas and Context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Audio Setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'hit') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'wall') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'score') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

// Game Objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballRadius = 8;

// Player Paddle (Left)
const player = {
    x: 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    maxSpeed: 6
};

// Computer Paddle (Right)
const computer = {
    x: canvas.width - 30,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 5, // Default normal speed
    baseSpeed: 5
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    dx: 5,
    dy: 5,
    speed: 5,
    maxSpeed: 8, // Default normal max speed
    baseMaxSpeed: 8
};

const difficultySettings = {
    easy: {
        computerSpeed: 3,
        ballMaxSpeed: 6
    },
    normal: {
        computerSpeed: 5,
        ballMaxSpeed: 8
    },
    hard: {
        computerSpeed: 7,
        ballMaxSpeed: 11
    }
};

// Game State
let gameRunning = false;
let playerScore = 0;
let computerScore = 0;
let keys = {};
let particles = [];
let ballTrail = [];
const WINNING_SCORE = 10;
let gameOver = false;

// Input Handling
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        if (gameOver) {
            resetGame();
        } else {
            toggleGameState();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse Movement
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    player.y = Math.max(0, Math.min(canvas.height - player.height, y - player.height / 2));
});

// Touch Support
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const y = touch.clientY - rect.top;
    player.y = Math.max(0, Math.min(canvas.height - player.height, y - player.height / 2));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    toggleGameState();
});

// Canvas Click to Start/Pause
canvas.addEventListener('click', toggleGameState);

// Reset Button
document.getElementById('resetBtn').addEventListener('click', resetGame);

// Difficulty Selector
const difficultySelect = document.getElementById('difficulty');
difficultySelect.addEventListener('change', updateDifficulty);

// Overlay Elements
const gameOverOverlay = document.getElementById('gameOverOverlay');
const winnerText = document.getElementById('winnerText');
document.getElementById('playAgainBtn').addEventListener('click', resetGame);

function updateDifficulty() {
    const level = difficultySelect.value;
    const settings = difficultySettings[level];

    computer.speed = settings.computerSpeed;
    ball.maxSpeed = settings.ballMaxSpeed;
}

// Toggle Game State
function toggleGameState() {
    if (gameOver) return;
    gameRunning = !gameRunning;
    updateGameStatus();
}

// Update Game Status Display
function updateGameStatus() {
    const statusEl = document.getElementById('gameStatus');
    statusEl.textContent = gameRunning ? 'Playing' : 'Paused';
}

// Reset Game
function resetGame() {
    playerScore = 0;
    computerScore = 0;
    gameOver = false;
    gameRunning = false;
    gameOverOverlay.style.display = 'none';
    particles = [];
    ballTrail = [];
    resetBall();
    updateScores();
    updateGameStatus();
}

function checkWinCondition() {
    if (playerScore >= WINNING_SCORE || computerScore >= WINNING_SCORE) {
        gameOver = true;
        gameRunning = false;
        gameOverOverlay.style.display = 'flex';
        updateGameStatus();

        if (playerScore >= WINNING_SCORE) {
            winnerText.textContent = 'Player Wins!';
            winnerText.style.color = '#00ff88';
        } else {
            winnerText.textContent = 'Computer Wins!';
            winnerText.style.color = '#ff3366';
        }
    }
}

// Reset Ball to Center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * ball.speed;
    
    player.y = canvas.height / 2 - player.height / 2;
    computer.y = canvas.height / 2 - computer.height / 2;
}

// Update Player Paddle
function updatePlayer() {
    if (keys['ArrowUp']) {
        player.dy = -player.maxSpeed;
    } else if (keys['ArrowDown']) {
        player.dy = player.maxSpeed;
    } else {
        player.dy *= 0.9; // Friction
    }

    player.y += player.dy;

    // Wall Collision
    if (player.y < 0) {
        player.y = 0;
        player.dy = 0;
    }
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
    }
}

// Update Computer Paddle (AI)
function updateComputer() {
    const computerCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;
    const diff = ballCenter - computerCenter;

    if (Math.abs(diff) > 10) {
        if (diff > 0) {
            computer.dy = computer.speed;
        } else {
            computer.dy = -computer.speed;
        }
    } else {
        computer.dy *= 0.95; // Smooth deceleration
    }

    computer.y += computer.dy;

    // Wall Collision
    if (computer.y < 0) {
        computer.y = 0;
    }
    if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

function createParticles(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 10,
            dy: (Math.random() - 0.5) * 10,
            life: 1,
            color: `hsl(${Math.random() * 60 + 200}, 100%, 50%)`
        });
    }
}

// Update Ball
function updateBall() {
    // Add to trail
    ballTrail.push({x: ball.x, y: ball.y});
    if (ballTrail.length > 10) {
        ballTrail.shift();
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and Bottom Wall Collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
        playSound('wall');
    }

    // Player Paddle Collision
    if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        playSound('hit');
        ball.dx = Math.abs(ball.dx);
        const deltaY = ball.y - (player.y + player.height / 2);
        ball.dy = (deltaY / (player.height / 2)) * ball.maxSpeed;
        ball.x = player.x + player.width + ball.radius;
        
        createParticles(ball.x - ball.radius, ball.y);

        // Increase ball speed slightly on paddle hit
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (currentSpeed < ball.maxSpeed) {
            ball.dx *= 1.05;
            ball.dy *= 1.05;
        }
    }

    // Computer Paddle Collision
    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        playSound('hit');
        ball.dx = -Math.abs(ball.dx);
        const deltaY = ball.y - (computer.y + computer.height / 2);
        ball.dy = (deltaY / (computer.height / 2)) * ball.maxSpeed;
        ball.x = computer.x - ball.radius;
        
        createParticles(ball.x + ball.radius, ball.y);

        // Increase ball speed slightly on paddle hit
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (currentSpeed < ball.maxSpeed) {
            ball.dx *= 1.05;
            ball.dy *= 1.05;
        }
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        playSound('score');
        computerScore++;
        updateScores();
        checkWinCondition();
        if (!gameOver) resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        playSound('score');
        playerScore++;
        updateScores();
        checkWinCondition();
        if (!gameOver) resetBall();
    }
}

// Update Scores Display
function updateScores() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

// Draw Functions
function drawPaddle(paddle) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    // Draw trail
    for (let i = 0; i < ballTrail.length; i++) {
        const point = ballTrail[i];
        const alpha = i / ballTrail.length;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, ball.radius * (alpha * 0.8 + 0.2), 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw main ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.dx;
        p.y += p.dy;
        p.life -= 0.05;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGame() {
    // Clear Canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Center Line
    drawCenterLine();

    // Draw Paddles
    drawPaddle(player);
    drawPaddle(computer);

    // Draw Ball
    drawBall();

    // Draw Particles
    drawParticles();
}

// Game Loop
function gameLoop() {
    if (gameRunning) {
        updatePlayer();
        updateComputer();
        updateBall();
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}

// Initialize Game
updateGameStatus();
gameLoop();
