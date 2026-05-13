// Canvas and Context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

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
    speed: 5
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    dx: 5,
    dy: 5,
    speed: 5,
    maxSpeed: 8
};

// Game State
let gameRunning = false;
let playerScore = 0;
let computerScore = 0;
let keys = {};

// Input Handling
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        toggleGameState();
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

// Toggle Game State
function toggleGameState() {
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
    gameRunning = false;
    resetBall();
    updateScores();
    updateGameStatus();
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

// Update Ball
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and Bottom Wall Collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }

    // Player Paddle Collision
    if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = Math.abs(ball.dx);
        const deltaY = ball.y - (player.y + player.height / 2);
        ball.dy = (deltaY / (player.height / 2)) * ball.maxSpeed;
        ball.x = player.x + player.width + ball.radius;
        
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
        ball.dx = -Math.abs(ball.dx);
        const deltaY = ball.y - (computer.y + computer.height / 2);
        ball.dy = (deltaY / (computer.height / 2)) * ball.maxSpeed;
        ball.x = computer.x - ball.radius;
        
        // Increase ball speed slightly on paddle hit
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (currentSpeed < ball.maxSpeed) {
            ball.dx *= 1.05;
            ball.dy *= 1.05;
        }
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        computerScore++;
        updateScores();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        updateScores();
        resetBall();
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
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
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
