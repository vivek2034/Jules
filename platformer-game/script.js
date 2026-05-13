const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Audio Context for simple sounds
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'stomp') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

// Game entities
const player = {
    x: 50,
    y: 200,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpStrength: -12,
    grounded: false,
    color: '#ff0000'
};

const gravity = 0.6;
let score = 0;
let cameraX = 0;

const platforms = [
    { x: 0, y: 350, width: 800, height: 50 }, // Ground 1
    { x: 900, y: 350, width: 800, height: 50 }, // Ground 2
    { x: 200, y: 250, width: 100, height: 20 },
    { x: 400, y: 150, width: 100, height: 20 },
    { x: 600, y: 250, width: 100, height: 20 },
    { x: 1000, y: 200, width: 150, height: 20 },
    { x: 1300, y: 250, width: 100, height: 20 },
];

let coins = [
    { x: 230, y: 200, width: 15, height: 15, collected: false },
    { x: 430, y: 100, width: 15, height: 15, collected: false },
    { x: 630, y: 200, width: 15, height: 15, collected: false },
    { x: 1050, y: 150, width: 15, height: 15, collected: false },
    { x: 1330, y: 200, width: 15, height: 15, collected: false },
];

let enemies = [
    { x: 500, y: 320, width: 30, height: 30, vx: -2, alive: true, startX: 400, endX: 600 },
    { x: 1100, y: 320, width: 30, height: 30, vx: -2, alive: true, startX: 1000, endX: 1300 }
];

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
};

// Controls
window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
});

window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

// Mobile Controls
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
document.getElementById('btnLeft').addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
document.getElementById('btnRight').addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });
document.getElementById('btnJump').addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowUp = true; });
document.getElementById('btnJump').addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowUp = false; });

function update() {
    // Player horizontal movement
    if (keys.ArrowLeft) player.vx = -player.speed;
    else if (keys.ArrowRight) player.vx = player.speed;
    else player.vx = 0;

    // Jumping
    if (keys.ArrowUp && player.grounded) {
        player.vy = player.jumpStrength;
        player.grounded = false;
        playSound('jump');
    }

    // Apply physics
    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    // Reset grounding before collision check
    player.grounded = false;

    // Platform collisions
    platforms.forEach(platform => {
        // Simple AABB collision
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {

            // Resolve collision from top
            if (player.vy > 0 && player.y + player.height - player.vy <= platform.y) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
            }
            // Resolve collision from bottom
            else if (player.vy < 0 && player.y - player.vy >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.vy = 0;
            }
            // Resolve collision from left
            else if (player.vx > 0 && player.x + player.width - player.vx <= platform.x) {
                player.x = platform.x - player.width;
            }
            // Resolve collision from right
            else if (player.vx < 0 && player.x - player.vx >= platform.x + platform.width) {
                player.x = platform.x + platform.width;
            }
        }
    });

    // Coin collection
    coins.forEach(coin => {
        if (!coin.collected &&
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {

            coin.collected = true;
            score += 10;
            scoreElement.innerText = score;
            playSound('coin');
        }
    });

    // Enemy interaction
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        // Move enemy
        enemy.x += enemy.vx;
        if (enemy.x <= enemy.startX || enemy.x + enemy.width >= enemy.endX) {
            enemy.vx *= -1;
        }

        // Collision
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            // Stomp on top
            if (player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 10) {
                enemy.alive = false;
                player.vy = player.jumpStrength * 0.8; // Bounce
                score += 50;
                scoreElement.innerText = score;
                playSound('stomp');
            } else {
                // Hit side - Die
                die();
            }
        }
    });

    // Death (falling off screen)
    if (player.y > canvas.height) {
        die();
    }
}

function die() {
    playSound('die');
    player.x = 50;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    cameraX = 0;

    // Reset enemies and coins (simple approach)
    coins.forEach(c => c.collected = false);
    enemies.forEach(e => { e.alive = true; e.x = e.startX + (e.endX - e.startX)/2; });
    score = 0;
    scoreElement.innerText = score;

    // Camera follow
    let targetCameraX = player.x - canvas.width / 3;
    if (targetCameraX < 0) targetCameraX = 0;
    cameraX += (targetCameraX - cameraX) * 0.1; // Smooth follow

    // Infinite level generation (simple)
    if (player.x > platforms[platforms.length - 1].x - canvas.width) {
        let lastX = platforms[platforms.length - 1].x;
        platforms.push({ x: lastX + 800 + Math.random() * 200, y: 350, width: 800, height: 50 });
        platforms.push({ x: lastX + 300, y: 250, width: 100, height: 20 });
        coins.push({ x: lastX + 340, y: 200, width: 15, height: 15, collected: false });

        if (Math.random() > 0.5) {
            let eX = lastX + 500;
            enemies.push({ x: eX, y: 320, width: 30, height: 30, vx: -2, alive: true, startX: eX - 100, endX: eX + 100 });
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw platforms
    ctx.fillStyle = '#8B4513'; // SaddleBrown
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        // Grass top
        ctx.fillStyle = '#32CD32'; // LimeGreen
        ctx.fillRect(platform.x, platform.y, platform.width, 10);
        ctx.fillStyle = '#8B4513';
    });

    // Draw coins
    ctx.fillStyle = '#FFD700'; // Gold
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw enemies (Goomba style)
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillStyle = '#8B0000'; // DarkRed

            // Body
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
            ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
            ctx.lineTo(enemy.x, enemy.y + enemy.height);
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            ctx.fillRect(enemy.x + 8, enemy.y + 15, 4, 4);
            ctx.fillRect(enemy.x + 18, enemy.y + 15, 4, 4);
        }
    });

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Player eyes (pixel look)
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + (player.vx >= 0 ? 15 : 5), player.y + 5, 10, 10);
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + (player.vx >= 0 ? 20 : 5), player.y + 8, 4, 4);

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
