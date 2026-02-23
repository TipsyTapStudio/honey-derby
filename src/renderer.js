import {
  CANVAS_WIDTH, CANVAS_HEIGHT, FIELD_DIRT_Y,
  PITCHER_MOUND_RADIUS,
  BAT_LENGTH, BAT_WIDTH, BAT_IDLE_ANGLE,
  COLOR_GRASS, COLOR_DIRT, COLOR_MOUND, COLOR_HOME_PLATE,
  COLOR_PITCHER_BODY, COLOR_PITCHER_HEAD,
  COLOR_BATTER_BODY, COLOR_BATTER_HEAD, COLOR_BAT,
  COLOR_BALL, COLOR_BALL_OUTLINE,
  SCOREBOARD_X, SCOREBOARD_Y, SCOREBOARD_WIDTH, SCOREBOARD_HEIGHT,
  SCOREBOARD_BG, SCOREBOARD_BORDER,
  HR_QUOTA
} from './constants.js';

export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function drawField(ctx) {
  // Grass (upper portion)
  ctx.fillStyle = COLOR_GRASS;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Dirt/sand area (lower portion)
  ctx.fillStyle = COLOR_DIRT;
  ctx.beginPath();
  ctx.moveTo(0, FIELD_DIRT_Y);
  ctx.quadraticCurveTo(CANVAS_WIDTH / 2, FIELD_DIRT_Y - 60, CANVAS_WIDTH, FIELD_DIRT_Y);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.lineTo(0, CANVAS_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Pitcher mound
  ctx.fillStyle = COLOR_MOUND;
  ctx.beginPath();
  ctx.ellipse(240, 120, PITCHER_MOUND_RADIUS, PITCHER_MOUND_RADIUS * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Home plate
  ctx.fillStyle = COLOR_HOME_PLATE;
  ctx.beginPath();
  ctx.moveTo(240, 620);
  ctx.lineTo(255, 635);
  ctx.lineTo(248, 650);
  ctx.lineTo(232, 650);
  ctx.lineTo(225, 635);
  ctx.closePath();
  ctx.fill();
}

export function drawPitcher(ctx, pitcher) {
  const px = pitcher.x;
  const py = pitcher.y;

  // Body
  ctx.fillStyle = COLOR_PITCHER_BODY;
  ctx.fillRect(px - 10, py - 15, 20, 35);

  // Head
  ctx.fillStyle = COLOR_PITCHER_HEAD;
  ctx.beginPath();
  ctx.arc(px, py - 25, 10, 0, Math.PI * 2);
  ctx.fill();

  // Cap
  ctx.fillStyle = COLOR_PITCHER_BODY;
  ctx.fillRect(px - 12, py - 35, 24, 6);
}

export function drawBatter(ctx, batter) {
  const bx = batter.x;
  const by = batter.y;

  // Body
  ctx.fillStyle = COLOR_BATTER_BODY;
  ctx.fillRect(bx - 12, by - 20, 24, 40);

  // Head
  ctx.fillStyle = COLOR_BATTER_HEAD;
  ctx.beginPath();
  ctx.arc(bx, by - 30, 12, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = COLOR_BATTER_BODY;
  ctx.beginPath();
  ctx.arc(bx, by - 32, 12, Math.PI, Math.PI * 2);
  ctx.fill();

  // Bat
  ctx.save();
  ctx.translate(bx, by - 10);
  ctx.rotate(batter.batAngle);
  ctx.fillStyle = COLOR_BAT;
  ctx.fillRect(0, -BAT_WIDTH / 2, BAT_LENGTH, BAT_WIDTH);
  // Bat knob
  ctx.fillRect(BAT_LENGTH - 2, -BAT_WIDTH, 6, BAT_WIDTH * 2);
  ctx.restore();
}

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

export function drawCountdown(ctx, countdownValue) {
  if (countdownValue <= 0) return;

  ctx.save();
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeText(String(countdownValue), 240, 300);

  // Fill
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(countdownValue), 240, 300);
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
      text = 'ファール';
      color = '#FFAA00';
      break;
    case 'OUT':
      text = 'アウト';
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
