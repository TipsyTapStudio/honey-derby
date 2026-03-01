import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { AssetLoader } from './assetLoader.js';
import { AudioManager } from './audioManager.js';
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
  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('HONEY DERBY', CANVAS_WIDTH / 2, 300);

  // Loading text
  ctx.font = '20px Arial, Helvetica, sans-serif';
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
  ctx.font = '14px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`${loaded} / ${total}`, CANVAS_WIDTH / 2, barY + barH + 25);

  ctx.restore();
}

// Show initial loading screen
drawLoading(0, 1);

// Load assets then audio, then start game
const loader = new AssetLoader();
const audioManager = new AudioManager();

loader.load((loaded, total) => {
  // 画像ロード中は前半分（0〜50%）
  drawLoading(loaded, total * 2);
}).then(async (assets) => {
  // 音声ロード（後半 50%）
  const imageCount = 14; // AssetLoader のアセット数
  await audioManager.loadAll((loaded, total) => {
    drawLoading(imageCount + loaded, imageCount + total);
  });

  const game = new Game(canvas, assets, audioManager);
  window.addEventListener('keydown', (e) => game.handleKeyDown(e));
  window.addEventListener('keyup', (e) => game.handleKeyUp(e));

  // タイトル BGM 再生（自動再生ポリシーでブロックされる場合あり）
  audioManager.playBgm('bgm_title', { maxLoops: 1 });

  // 初回ユーザー操作で音声アンロック + BGM 再生を保証
  const startBgmOnce = () => {
    audioManager.unlock();
    if (game.state === 'READY') audioManager.playBgm('bgm_title', { maxLoops: 1 });
  };

  // モバイル音声アンロック + タッチ入力
  const getRect = () => canvas.getBoundingClientRect();
  canvas.addEventListener('touchstart', (e) => {
    startBgmOnce();
    game.handleTouchStart(e, getRect());
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => game.handleTouchMove(e, getRect()), { passive: false });
  canvas.addEventListener('touchend', (e) => game.handleTouchEnd(e), { passive: false });

  // PC マウスクリック（READY/GAME_OVER ボタン + 音声アンロック）
  canvas.addEventListener('click', (e) => {
    startBgmOnce();
    game.handleClick(e, getRect());
  });
  window.addEventListener('keydown', () => startBgmOnce(), { once: true });

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
  ctx.font = '20px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#ff4444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Loading failed!', CANVAS_WIDTH / 2, 360);
  ctx.font = '14px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(err.message, CANVAS_WIDTH / 2, 400);
});
