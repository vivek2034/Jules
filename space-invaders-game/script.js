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

    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

// Game State
let score = 0;
let gameOver = false;

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    width: 40,
    height: 20,
    speed: 5,
    color: '#0f0'
};

const bullets = [];
const aliens = [];
const alienRows = 4;
const alienCols = 10;
const alienWidth = 40;
const alienHeight = 30;
const alienPadding = 20;

let alienDirection = 1;
let alienSpeed = 1;

// Init Aliens
for (let r = 0; r < alienRows; r++) {
    for (let c = 0; c < alienCols; c++) {
        aliens.push({
            x: c * (alienWidth + alienPadding) + 50,
            y: r * (alienHeight + alienPadding) + 50,
            width: alienWidth,
            height: alienHeight,
            alive: true,
            color: r % 2 === 0 ? '#ff00ff' : '#00ffff'
        });
    }
}

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

let lastShotTime = 0;

// Inputs
window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space') {
        keys.Space = true;
        shoot();
    }
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
    if (e.code === 'Space') keys.Space = false;
});

// Mobile Controls
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
document.getElementById('btnLeft').addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
document.getElementById('btnRight').addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });
document.getElementById('btnShoot').addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });

function shoot() {
    const now = Date.now();
    if (now - lastShotTime > 300) { // Cooldown
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 7,
            color: '#fff'
        });
        playSound('shoot');
        lastShotTime = now;
    }
}

function update() {
    if (gameOver) return;

    // Player movement
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;

    // Bullet movement
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }

    // Alien movement
    let hitWall = false;
    let anyAlive = false;

    aliens.forEach(alien => {
        if (alien.alive) {
            anyAlive = true;
            alien.x += alienSpeed * alienDirection;
            if (alien.x + alien.width >= canvas.width || alien.x <= 0) {
                hitWall = true;
            }
        }
    });

    if (hitWall) {
        alienDirection *= -1;
        aliens.forEach(alien => {
            if (alien.alive) alien.y += 20;
        });
        alienSpeed += 0.2; // Speed up
    }

    // Win condition
    if (!anyAlive) {
        gameOver = true;
        setTimeout(() => alert('You Win!'), 100);
    }

    // Collision Detection (Bullet -> Alien)
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bulletHit = false;
        for (let j = 0; j < aliens.length; j++) {
            const a = aliens[j];
            if (a.alive &&
                bullets[i].x < a.x + a.width &&
                bullets[i].x + bullets[i].width > a.x &&
                bullets[i].y < a.y + a.height &&
                bullets[i].y + bullets[i].height > a.y) {

                a.alive = false;
                bulletHit = true;
                score += 100;
                scoreElement.innerText = score;
                playSound('hit');
                break;
            }
        }
        if (bulletHit) bullets.splice(i, 1);
    }

    // Collision Detection (Alien -> Player or Bottom)
    aliens.forEach(alien => {
        if (alien.alive) {
            if (alien.y + alien.height >= player.y || alien.y + alien.height >= canvas.height) {
                gameOver = true;
            }
        }
    });
}

function drawPixelBox(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = '#f00';
        ctx.font = '40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Draw Player (Tank shape)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y + 10, player.width, 10);
    ctx.fillRect(player.x + 15, player.y, 10, 10);

    // Draw Bullets
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Draw Aliens
    aliens.forEach(a => {
        if (a.alive) {
            ctx.fillStyle = a.color;
            // Simple space invader pixel art representation
            ctx.fillRect(a.x + 10, a.y, 20, 10);
            ctx.fillRect(a.x, a.y + 10, 40, 10);
            ctx.fillRect(a.x + 5, a.y + 20, 10, 10);
            ctx.fillRect(a.x + 25, a.y + 20, 10, 10);

            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(a.x + 10, a.y + 10, 5, 5);
            ctx.fillRect(a.x + 25, a.y + 10, 5, 5);
        }
    });
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

gameLoop();
