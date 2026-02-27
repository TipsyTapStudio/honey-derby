import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { AssetLoader } from './assetLoader.js';
import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const ctx = canvas.getContext('2d');

// --- Loading Screen ---
function drawLoading(loaded, total) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 36px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('HONEY DERBY', CANVAS_WIDTH / 2, 300);

  // Loading text
  ctx.font = '20px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Loading...', CANVAS_WIDTH / 2, 360);

  // Progress bar
  const barW = 300;
  const barH = 20;
  const barX = (CANVAS_WIDTH - barW) / 2;
  const barY = 400;
  const progress = total > 0 ? loaded / total : 0;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#FFD700';
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);

  // Counter
  ctx.font = '14px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`${loaded} / ${total}`, CANVAS_WIDTH / 2, barY + barH + 25);

  ctx.restore();
}

// Show initial loading screen
drawLoading(0, 13);

// Load assets then start game
const loader = new AssetLoader();
loader.load((loaded, total) => {
  drawLoading(loaded, total);
}).then((assets) => {
  const game = new Game(canvas, assets);
  window.addEventListener('keydown', (e) => game.handleKeyDown(e));
  window.addEventListener('keyup', (e) => game.handleKeyUp(e));
  window._game = game; // expose for debugging

  // Enable debug mode via URL parameter: ?debug=1
  if (new URLSearchParams(window.location.search).get('debug') === '1') {
    game.debugMode = true;
  }

  game.start();
}).catch((err) => {
  console.error('Asset loading failed:', err);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.font = '20px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#ff4444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Loading failed!', CANVAS_WIDTH / 2, 360);
  ctx.font = '14px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(err.message, CANVAS_WIDTH / 2, 400);
});
