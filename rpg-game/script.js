const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const MAP_ROWS = 15;
const MAP_COLS = 15;

const scoreElement = document.getElementById('score');
let score = 0;

// Audio
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'bump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'item') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }
}

function playBumpSound() {
    playSound('bump');
}

// 0: grass, 1: tree, 2: water, 3: item (on grass)
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 2, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 2, 2, 2, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 3, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 3, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const player = {
    col: 2,
    row: 2,
    color: '#ff0000',
    isMoving: false,
    targetCol: 2,
    targetRow: 2,
    x: 2 * TILE_SIZE,
    y: 2 * TILE_SIZE,
    speed: 4
};

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Input handling
window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Mobile Input
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowUp = true; });
btnUp.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowUp = false; });
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowDown = true; });
btnDown.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowDown = false; });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });

function canMoveTo(col, row) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
    return map[row][col] === 0 || map[row][col] === 3; // Grass and Items are walkable
}

function update() {
    if (!player.isMoving) {
        let dc = 0, dr = 0;

        if (keys.ArrowUp) dr = -1;
        else if (keys.ArrowDown) dr = 1;
        else if (keys.ArrowLeft) dc = -1;
        else if (keys.ArrowRight) dc = 1;

        if (dc !== 0 || dr !== 0) {
            const nextCol = player.col + dc;
            const nextRow = player.row + dr;

            if (canMoveTo(nextCol, nextRow)) {
                player.targetCol = nextCol;
                player.targetRow = nextRow;
                player.isMoving = true;
            } else {
                playBumpSound(); // Bump into wall
            }
        }
    } else {
        // Handle pixel movement
        const targetX = player.targetCol * TILE_SIZE;
        const targetY = player.targetRow * TILE_SIZE;

        if (player.x < targetX) player.x += player.speed;
        if (player.x > targetX) player.x -= player.speed;
        if (player.y < targetY) player.y += player.speed;
        if (player.y > targetY) player.y -= player.speed;

        // Snap to grid if close enough to avoid jitter
        if (Math.abs(player.x - targetX) < player.speed && Math.abs(player.y - targetY) < player.speed) {
            player.x = targetX;
            player.y = targetY;
            player.col = player.targetCol;
            player.row = player.targetRow;
            player.isMoving = false;

            // Check for item collection
            if (map[player.row][player.col] === 3) {
                map[player.row][player.col] = 0; // Remove item
                score += 10;
                scoreElement.innerText = score;
                playSound('item');
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw map
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            const tile = map[r][c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            if (tile === 0 || tile === 3) { // Grass (or grass with item)
                ctx.fillStyle = '#7CFC00'; // LawnGreen
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                if (tile === 3) {
                    // Draw Pokeball-like item
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 8, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 8, Math.PI, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (tile === 1) { // Tree
                ctx.fillStyle = '#228B22'; // ForestGreen
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#8B4513'; // Trunk
                ctx.fillRect(x + 12, y + 20, 8, 12);
            } else if (tile === 2) { // Water
                ctx.fillStyle = '#1E90FF'; // DodgerBlue
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }

            // Grid lines (optional for retro feel)
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw player
    ctx.fillStyle = player.color;
    // Simple bobbing animation if moving
    const bob = player.isMoving ? (Math.sin(Date.now() / 50) * 2) : 0;

    // Draw character body
    ctx.fillRect(player.x + 4, player.y + 4 + bob, TILE_SIZE - 8, TILE_SIZE - 8);

    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 8, player.y + 10 + bob, 6, 6);
    ctx.fillRect(player.x + 18, player.y + 10 + bob, 6, 6);

    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + 10, player.y + 12 + bob, 2, 2);
    ctx.fillRect(player.x + 20, player.y + 12 + bob, 2, 2);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
