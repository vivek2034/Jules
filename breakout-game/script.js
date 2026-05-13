const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Audio Context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'paddle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'brick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'wall') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

// Game state
let score = 0;
let gameOver = false;

// Paddle
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 15,
    speed: 8,
    color: '#0ff'
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 8,
    speed: 6,
    dx: 4 * (Math.random() > 0.5 ? 1 : -1),
    dy: -4,
    color: '#fff'
};

// Bricks
const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 50;
const brickOffsetLeft = 20;

const bricks = [];
const colors = ['#f00', '#f80', '#ff0', '#0f0', '#00f'];

function initBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, color: colors[r] };
        }
    }
}
initBricks();

const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Input
window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
});

// Mobile Controls
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
document.getElementById('btnLeft').addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
document.getElementById('btnRight').addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreElement.innerText = score;
                    playSound('brick');

                    // Increase speed slightly
                    if(score % 50 === 0) {
                        ball.speed += 0.5;
                        const angle = Math.atan2(ball.dy, ball.dx);
                        ball.dx = Math.cos(angle) * ball.speed;
                        ball.dy = Math.sin(angle) * ball.speed;
                    }

                    // Check win
                    if (score === brickRowCount * brickColumnCount * 10) {
                        alert("YOU WIN, CONGRATS!");
                        document.location.reload();
                    }
                }
            }
        }
    }
}

function update() {
    if (gameOver) return;

    // Paddle movement
    if (keys.ArrowLeft && paddle.x > 0) paddle.x -= paddle.speed;
    if (keys.ArrowRight && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (left/right)
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
        playSound('wall');
    }
    // Wall collision (top)
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
        playSound('wall');
    }
    // Bottom collision
    else if (ball.y + ball.dy > canvas.height - ball.radius) {
        // Paddle collision
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            playSound('paddle');
            // Calculate bounce angle based on where it hit the paddle
            let hitPoint = ball.x - (paddle.x + paddle.width / 2);
            let normalizedHitPoint = hitPoint / (paddle.width / 2);
            let bounceAngle = normalizedHitPoint * (Math.PI / 3); // Max angle 60 degrees

            ball.dx = ball.speed * Math.sin(bounceAngle);
            ball.dy = -ball.speed * Math.cos(bounceAngle);
        } else {
            // Death
            playSound('die');
            gameOver = true;
            setTimeout(() => {
                alert("GAME OVER");
                document.location.reload();
            }, 100);
        }
    }

    collisionDetection();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Bricks
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.fillStyle = bricks[c][r].color;
                ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
                // Highlight for retro look
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(brickX, brickY, brickWidth, 3);
            }
        }
    }

    // Draw Paddle
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, 3);

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

gameLoop();
