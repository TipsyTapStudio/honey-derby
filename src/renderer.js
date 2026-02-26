import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  MOAI_X, MOAI_Y,
  BATTER_SPRITE_W, BATTER_SPRITE_H,
  BATTER_ANCHOR_X, BATTER_ANCHOR_Y,
  COLOR_BALL, COLOR_BALL_OUTLINE,
  SCOREBOARD_X, SCOREBOARD_Y, SCOREBOARD_WIDTH, SCOREBOARD_HEIGHT,
  SCOREBOARD_BG, SCOREBOARD_BORDER,
  HR_QUOTA
} from './constants.js';

// =============================================
// Background & Sprites
// =============================================

export function drawBackground(ctx, bgCanvas) {
  ctx.drawImage(bgCanvas, 0, 0);
}

export function drawMoai(ctx, moaiImg) {
  const dx = MOAI_X - moaiImg.width / 2;
  const dy = MOAI_Y;
  ctx.drawImage(moaiImg, dx, dy);
}

export function drawBatterSprite(ctx, batter, batterFrames) {
  const frame = batterFrames[batter.frameIndex];
  if (!frame) return;
  const dx = batter.x - BATTER_ANCHOR_X;
  const dy = batter.y - BATTER_ANCHOR_Y;
  ctx.drawImage(frame, dx, dy, BATTER_SPRITE_W, BATTER_SPRITE_H);
}

// =============================================
// Ball
// =============================================

export function drawBall(ctx, ball) {
  if (!ball || !ball.active) return;

  // Ball shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(ball.x + 2, ball.y + 3, ball.radius * 0.8, ball.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball
  ctx.fillStyle = COLOR_BALL;
  ctx.strokeStyle = COLOR_BALL_OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// =============================================
// Ball Flight (Post-Hit Trajectory)
// =============================================

export function drawBallFlight(ctx, ballFlight) {
  if (!ballFlight || !ballFlight.active) return;

  const r = Math.max(1, ballFlight.radius);

  // Shadow (shrinks as ball flies away)
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(
    ballFlight.x + 1, ballFlight.y + 2,
    r * 0.7, r * 0.3,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // Ball
  ctx.fillStyle = COLOR_BALL;
  ctx.strokeStyle = COLOR_BALL_OUTLINE;
  ctx.lineWidth = Math.max(0.5, r / 7);
  ctx.beginPath();
  ctx.arc(ballFlight.x, ballFlight.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// =============================================
// UI Overlays
// =============================================

export function drawCountdown(ctx, countdownValue) {
  if (countdownValue <= 0) return;

  ctx.save();
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Position above moai's head
  const countdownY = MOAI_Y - 20;

  // Outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeText(String(countdownValue), CANVAS_WIDTH / 2, countdownY);

  // Fill
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(countdownValue), CANVAS_WIDTH / 2, countdownY);
  ctx.restore();
}

export function drawScoreboard(ctx, gameState) {
  const x = SCOREBOARD_X;
  const y = SCOREBOARD_Y;
  const w = SCOREBOARD_WIDTH;
  const h = SCOREBOARD_HEIGHT;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 3, y + 3, w, h);

  // Background
  ctx.fillStyle = SCOREBOARD_BG;
  ctx.fillRect(x, y, w, h);

  // Border (wood frame)
  ctx.strokeStyle = SCOREBOARD_BORDER;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);

  // Horizontal lines
  const rowHeight = h / 3;
  ctx.strokeStyle = SCOREBOARD_BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + rowHeight);
  ctx.lineTo(x + w, y + rowHeight);
  ctx.moveTo(x, y + rowHeight * 2);
  ctx.lineTo(x + w, y + rowHeight * 2);
  ctx.stroke();

  // Text
  ctx.save();
  ctx.textBaseline = 'middle';
  const textX = x + 10;
  const numX = x + w - 30;

  // Row 1: 目標
  const row1Y = y + rowHeight / 2;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('目標', textX, row1Y);
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(HR_QUOTA), numX, row1Y);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('本', x + w - 8, row1Y);

  // Row 2: ホームラン
  const row2Y = y + rowHeight + rowHeight / 2;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ホーム', textX, row2Y - 8);
  ctx.fillText('ラン', textX, row2Y + 8);
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(gameState.homeRuns), numX, row2Y);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('本', x + w - 8, row2Y);

  // Row 3: 残り
  const row3Y = y + rowHeight * 2 + rowHeight / 2;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('残り', textX, row3Y);
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(gameState.remainingPitches), numX, row3Y);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('球', x + w - 8, row3Y);

  ctx.restore();
}

export function drawResult(ctx, resultDisplay) {
  if (!resultDisplay.active) return;

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 250, CANVAS_WIDTH, 200);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let text, color;
  switch (resultDisplay.judgment) {
    case 'HOME_RUN':
      text = 'ホームラン！';
      color = '#FFD700';
      break;
    case 'HIT':
      text = 'ヒット！';
      color = '#ffffff';
      break;
    case 'FOUL':
      text = 'ファウル';
      color = '#FFAA00';
      break;
    case 'STRIKE':
      text = 'ストライク';
      color = '#FF4444';
      break;
    default:
      text = '';
      color = '#ffffff';
  }

  // Judgment text
  ctx.font = 'bold 56px sans-serif';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeText(text, CANVAS_WIDTH / 2, 320);
  ctx.fillStyle = color;
  ctx.fillText(text, CANVAS_WIDTH / 2, 320);

  // Distance (only for HR and HIT)
  if (resultDisplay.distance > 0 && (resultDisplay.judgment === 'HOME_RUN' || resultDisplay.judgment === 'HIT')) {
    ctx.font = 'bold 40px sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    const distText = `${resultDisplay.distance}m`;
    ctx.strokeText(distText, CANVAS_WIDTH / 2, 380);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(distText, CANVAS_WIDTH / 2, 380);
  }

  ctx.restore();
}

export function drawGameOver(ctx, cleared) {
  // Full overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (cleared) {
    ctx.font = 'bold 60px sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('STAGE CLEAR!', CANVAS_WIDTH / 2, 320);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('STAGE CLEAR!', CANVAS_WIDTH / 2, 320);
  } else {
    ctx.font = 'bold 60px sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('GAME OVER', CANVAS_WIDTH / 2, 320);
    ctx.fillStyle = '#FF4444';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 320);
  }

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Space キーでリトライ', CANVAS_WIDTH / 2, 400);

  ctx.restore();
}

export function drawReady(ctx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 48px sans-serif';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('HONEY DERBY', CANVAS_WIDTH / 2, 300);
  ctx.fillStyle = '#FFD700';
  ctx.fillText('HONEY DERBY', CANVAS_WIDTH / 2, 300);

  ctx.font = 'bold 22px sans-serif';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText('Space キーでスタート', CANVAS_WIDTH / 2, 380);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Space キーでスタート', CANVAS_WIDTH / 2, 380);

  ctx.restore();
}
