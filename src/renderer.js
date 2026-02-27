import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  MOAI_X, MOAI_Y,
  BATTER_SPRITE_W, BATTER_SPRITE_H,
  BATTER_ANCHOR_X, BATTER_ANCHOR_Y,
  COLOR_BALL, COLOR_BALL_OUTLINE,
  SCOREBOARD_X, SCOREBOARD_Y, SCOREBOARD_WIDTH, SCOREBOARD_HEIGHT,
  SCOREBOARD_BG, SCOREBOARD_BORDER,
  HR_QUOTA,
  BALL_SHADOW_OFFSET_MIN, BALL_SHADOW_OFFSET_MAX,
  POWER_BAR_X, POWER_BAR_TOP, POWER_BAR_BOTTOM, POWER_BAR_WIDTH
} from './constants.js';

// =============================================
// Background & Sprites
// =============================================

export function drawBackground(ctx, bgCanvas) {
  ctx.drawImage(bgCanvas, 0, 0);
}

export function drawMoai(ctx, moaiImg) {
  const scale = 0.7; // 元サイズの70%
  const w = moaiImg.width * scale;
  const h = moaiImg.height * scale;
  const dx = MOAI_X - w / 2;
  const dy = MOAI_Y + moaiImg.height * (1 - scale); // 下端を揃える(球の出る口の位置を維持)
  ctx.drawImage(moaiImg, dx, dy, w, h);
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

  // Ground shadow — follows ball, offset grows with proximity (perspective depth)
  // Shadow is on the ground directly below the ball, appearing ahead (higher Y)
  // As ball approaches batter, the gap between ball and shadow increases
  const t = Math.min(ball.progress || 0, 1.0);
  const shadowOffsetY = BALL_SHADOW_OFFSET_MIN + t * (BALL_SHADOW_OFFSET_MAX - BALL_SHADOW_OFFSET_MIN);
  const shadowX = ball.x;
  const shadowY = ball.y + shadowOffsetY;
  const shadowRadiusX = 4 + t * 14;
  const shadowRadiusY = 1.5 + t * 5;
  const shadowAlpha = 0.06 + t * 0.26;
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(shadowX, shadowY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball shadow (follows ball — gives volume/depth to the ball itself)
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
  ctx.font = 'bold 72px "Bebas Neue", sans-serif';
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

  // Row 1: Target
  const row1Y = y + rowHeight / 2;
  ctx.font = 'bold 16px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('Target', textX, row1Y);
  ctx.font = 'bold 24px "Bebas Neue", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(HR_QUOTA), numX + 14, row1Y);

  // Row 2: HR
  const row2Y = y + rowHeight + rowHeight / 2;
  ctx.font = 'bold 16px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HR', textX, row2Y);
  ctx.font = 'bold 24px "Bebas Neue", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(gameState.homeRuns), numX + 14, row2Y);

  // Row 3: Balls
  const row3Y = y + rowHeight * 2 + rowHeight / 2;
  ctx.font = 'bold 16px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Balls', textX, row3Y);
  ctx.font = 'bold 24px "Bebas Neue", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(gameState.remainingPitches), numX + 14, row3Y);

  ctx.restore();
}

// =============================================
// Heartbeat (pulsing heart icon)
// =============================================

export function drawHeartbeat(ctx, heartbeat) {
  const power = heartbeat.getPower(); // 0.0 〜 1.0

  const x = POWER_BAR_X;
  const top = POWER_BAR_TOP;
  const bottom = POWER_BAR_BOTTOM;
  const barH = bottom - top;
  const w = POWER_BAR_WIDTH;  // 定数で2倍に(12px)
  const fillH = barH * power;
  const STRIPE_H = 4;         // ストライプの黒帯間隔(px)
  const GAP_H = 2;            // ストライプ間のギャップ(px)
  const STEP = STRIPE_H + GAP_H;

  ctx.save();

  // Background track (dark)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(x - w / 2, top, w, barH);

  // Equalizer stripes — ショッキングピンク + 黒ストライプ
  const fillTop = bottom - fillH;
  const pink = '#FF1493'; // ショッキングピンク

  // Glow at high power (drawn first, behind stripes)
  if (power > 0.7) {
    const glowAlpha = (power - 0.7) * 2.5;
    ctx.shadowColor = pink;
    ctx.shadowBlur = 10 + power * 12;
    ctx.globalAlpha = 0.3 + glowAlpha * 0.5;
    ctx.fillStyle = pink;
    ctx.fillRect(x - w / 2, fillTop, w, fillH);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }

  // Draw filled stripes bottom-up (pink bars with black gaps = equalizer look)
  ctx.fillStyle = pink;
  for (let sy = bottom - STRIPE_H; sy >= fillTop; sy -= STEP) {
    const stripeTop = Math.max(sy, fillTop);
    const stripeBottom = sy + STRIPE_H;
    if (stripeBottom > fillTop) {
      ctx.fillRect(x - w / 2, stripeTop, w, stripeBottom - stripeTop);
    }
  }

  // Thin border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, top, w, barH);

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
      text = 'HOME RUN!';
      color = '#FFD700';
      break;
    case 'HIT':
      text = 'OUT!';
      color = '#ffffff';
      break;
    case 'FOUL':
      text = 'FOUL';
      color = '#FFAA00';
      break;
    case 'STRIKE':
      text = 'STRIKE';
      color = '#FF4444';
      break;
    default:
      text = '';
      color = '#ffffff';
  }

  // Judgment text
  ctx.font = 'bold 56px "Bebas Neue", sans-serif';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeText(text, CANVAS_WIDTH / 2, 320);
  ctx.fillStyle = color;
  ctx.fillText(text, CANVAS_WIDTH / 2, 320);

  // Distance (only for HR)
  if (resultDisplay.distance > 0 && resultDisplay.judgment === 'HOME_RUN') {
    ctx.font = 'bold 40px "Bebas Neue", sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    const distText = `${resultDisplay.distance}m`;
    ctx.strokeText(distText, CANVAS_WIDTH / 2, 380);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(distText, CANVAS_WIDTH / 2, 380);
  }

  ctx.restore();
}

export function drawGameOver(ctx, cleared, score, hrCount) {
  // Full overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = CANVAS_WIDTH / 2;

  if (cleared) {
    ctx.font = '64px "Bebas Neue", sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('STAGE CLEAR!', cx, 280);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('STAGE CLEAR!', cx, 280);
  } else {
    ctx.font = '64px "Bebas Neue", sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('GAME OVER', cx, 280);
    ctx.fillStyle = '#FF4444';
    ctx.fillText('GAME OVER', cx, 280);
  }

  // Score display
  ctx.font = '40px "Bebas Neue", sans-serif';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  const scoreText = `Score: ${score}m`;
  ctx.strokeText(scoreText, cx, 345);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(scoreText, cx, 345);

  // HR count
  ctx.font = '22px "Bebas Neue", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  const hrText = hrCount === 1 ? '1 Home Run' : `${hrCount} Home Runs`;
  ctx.fillText(hrText, cx, 385);

  // Retry instruction
  ctx.font = '24px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Press Space to Retry', cx, 440);

  ctx.restore();
}

export function drawReady(ctx, titleImg) {
  ctx.save();

  // Title image — centered at top, aspect-ratio preserved
  if (titleImg) {
    const maxW = 380;
    const scale = maxW / titleImg.width;
    const w = maxW;
    const h = titleImg.height * scale;
    ctx.drawImage(titleImg, (CANVAS_WIDTH - w) / 2, 80, w, h);
  }

  // "Tap to Start" (touch) / "Press Space to Start" (keyboard)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '26px "Bebas Neue", sans-serif';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText('Tap to Start', CANVAS_WIDTH / 2, 350);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Tap to Start', CANVAS_WIDTH / 2, 350);

  // Footer credits
  ctx.font = '16px "Bebas Neue", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('\u00A9 2025 Tipsy Tap Studio', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

  ctx.restore();
}

// =============================================
// Debug Overlay
// =============================================

export function drawDebugOverlay(ctx, d) {
  const panelY = 640;
  const panelH = 80;

  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, panelY, CANVAS_WIDTH, panelH);

  ctx.save();
  ctx.font = '11px monospace'; // debug stays monospace
  ctx.fillStyle = '#00ff00';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const x = 8;
  const lineH = 15;

  // Row 1: Pitch info + batter position
  const course = d.pitchCourse || '';
  const r1 = `#${d.pitchNumber} | ${d.pitchType} ${course} ${d.pitchSpeed}px/s | Batter(${d.batterX}, ${d.batterY}) | Swing:${d.swingState}`;
  ctx.fillText(r1, x, panelY + 4);

  // Row 2: Hit detection details (after first hit)
  if (d.lastTiming !== null) {
    const side = d.lastSweetSpotSide || '-';
    const sweet = d.lastSweetSpotDist !== null ? `${d.lastSweetSpotDist}px(${side})` : '-';
    const yOff = d.lastBallOffsetY !== null ? `${d.lastBallOffsetY}px` : '-';
    const r2 = `Sweet:${sweet} | Timing:${d.lastTiming}(Y:${yOff}) | xGap:${d.lastXGap}px | Dir:${d.lastDirectionAngle}deg`;
    ctx.fillText(r2, x, panelY + 4 + lineH);
  }

  // Row 3: Result (color-coded)
  if (d.lastJudgment !== null) {
    const dist = d.lastDistance > 0 ? `${d.lastDistance}m` : '';
    const powerStr = d.lastPower !== null ? ` | Power:${d.lastPower}%` : '';
    const r3 = `Result: ${d.lastJudgment} ${dist}${powerStr} | batAngle:${d.lastBatAngle}deg`;
    ctx.fillStyle = d.lastJudgment === 'HOME_RUN' ? '#FFD700' :
                    d.lastJudgment === 'HIT' ? '#ffffff' :
                    d.lastJudgment === 'FOUL' ? '#FFAA00' : '#FF4444';
    ctx.fillText(r3, x, panelY + 4 + lineH * 2);
  }

  // Row 4: Live ball position
  ctx.fillStyle = '#00ff00';
  if (d.ballY !== null) {
    const r4 = `Ball.y:${d.ballY} | BatContact.y:${d.batContactY}`;
    ctx.fillText(r4, x, panelY + 4 + lineH * 3);
  }

  ctx.restore();
}
