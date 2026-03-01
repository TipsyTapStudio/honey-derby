import {
  PITCHER_X, PITCHER_Y,
  STRIKE_ZONE_CENTER_Y,
  COURSE_INSIDE_X, COURSE_MIDDLE_X, COURSE_OUTSIDE_X,
  TOTAL_PITCHES, HR_QUOTA, CANVAS_WIDTH, CANVAS_HEIGHT,
  BALL_SPEED, BATTER_X, BATTER_Y,
  BATTER_MIN_X, BATTER_MAX_X, BATTER_MIN_Y, BATTER_MAX_Y
} from './constants.js';
import { Pitcher } from './pitcher.js';
import { Batter } from './batter.js';
import { Ball } from './ball.js';
import { BallFlight } from './ballFlight.js';
import { ResultDisplay } from './resultDisplay.js';
import { HeartBeat } from './heartbeat.js';
import * as HitDetector from './hitDetector.js';
import * as Renderer from './renderer.js';

// Null input for batter update during RESULT state (no movement, no swing)
const NULL_INPUT = { left: false, right: false, up: false, down: false, space: false };

// Exponential smoothing factor for touch drag (lower = heavier feel)
const TOUCH_SMOOTHING = 8;

export class Game {
  constructor(canvas, assets, audioManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets; // { bg, moai, batter[] }
    this.audio = audioManager;
    this.isTouchDevice = 'ontouchstart' in window;
    this.state = 'READY'; // READY | COUNTDOWN | PITCHING | RESULT | GAME_OVER
    this.pitcher = new Pitcher();
    this.batter = new Batter();
    this.ball = null;
    this.ballFlight = null;
    this.resultDisplay = new ResultDisplay();
    this.heartbeat = new HeartBeat();
    this.lastTimestamp = 0;

    this.inputState = { left: false, right: false, up: false, down: false, space: false, titleReturn: false };
    this.prevSpaceForState = false; // Edge detection for state transitions

    // Score
    this.homeRuns = 0;
    this.totalHRDistance = 0;
    this.pitchCount = 0;
    this.remainingPitches = TOTAL_PITCHES;
    this.cleared = false;

    // Touch state
    this.touchState = {
      dragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      targetX: BATTER_X,
      targetY: BATTER_Y,
    };

    // Pause
    this.paused = false;

    // Debug mode
    this.debugMode = false;
    this.debugData = {
      pitchNumber: 0,
      pitchType: 'Straight',
      pitchCourse: '真ん中',
      pitchSpeed: BALL_SPEED,
      batterX: BATTER_X,
      batterY: BATTER_Y,
      swingState: 'idle',
      ballY: null,
      batContactY: null,
      lastBatAngle: null,
      // Heartbeat
      lastPower: null,
      // Per-hit data
      lastSweetSpotDist: null,
      lastSweetSpotSide: null,
      lastTiming: null,
      lastBallOffsetY: null,
      lastDirectionAngle: null,
      lastJudgment: null,
      lastDistance: null,
      lastXGap: null,
    };
  }

  start() {
    this.lastTimestamp = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  loop(timestamp) {
    let dt = (timestamp - this.lastTimestamp) / 1000;
    dt = Math.min(dt, 0.05); // Clamp to prevent spiral of death
    this.lastTimestamp = timestamp;

    if (!this.paused) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    // Update live debug data
    if (this.debugMode) {
      this.debugData.batterX = Math.round(this.batter.x);
      this.debugData.batterY = Math.round(this.batter.y);
      this.debugData.swingState = this.batter.swingState;
      this.debugData.batContactY = Math.round(this.batter.getBatContactY());
      this.debugData.ballY = this.ball && this.ball.active ? Math.round(this.ball.y) : null;
      this.debugData.lastBatAngle = Math.round(this.batter.batAngle * (180 / Math.PI) * 10) / 10;
    }

    const spacePressed = this.inputState.space && !this.prevSpaceForState;

    switch (this.state) {
      case 'READY':
        // Wait for space to start (rising edge)
        if (spacePressed) {
          this.audio.play('se_game_start');
          this.transitionTo('COUNTDOWN');
        }
        break;

      case 'COUNTDOWN': {
        const prevCount = this.pitcher.countdownValue;
        this.pitcher.updateCountdown(dt);
        const wasIdle = this.batter.swingState === 'idle';
        this.batter.update(dt, this.inputState);
        // 素振り SE
        if (wasIdle && this.batter.swingState === 'impact') {
          this.audio.play('se_swing_miss');
        }
        this.heartbeat.update(dt);
        // カウントダウン tick SE (3→2→1)
        if (this.pitcher.countdownValue < prevCount && this.pitcher.countdownValue > 0) {
          this.audio.play('se_countdown_tick');
        }
        if (this.pitcher.isCountdownComplete()) {
          this.audio.play('se_countdown_go');
          this.audio.play('se_pitch');
          this.transitionTo('PITCHING');
        }
      }
        break;

      case 'PITCHING': {
        this.ball.update(dt);
        this.batter.update(dt, this.inputState);
        this.heartbeat.update(dt);

        // Check for hit during extended hit window (impact + early followthrough)
        if (this.batter.isInHitWindow() && this.ball && this.ball.active) {
          const power = this.heartbeat.getMultiplier();
          const result = HitDetector.evaluate(this.ball, this.batter, power);
          if (result) {
            // For HR/HIT/FOUL: deactivate ball (ballFlight takes over)
            // For contact-STRIKE: keep ball alive for pass-through animation
            if (result.judgment !== 'STRIKE') {
              this.ball.active = false;
            }
            this.handleHitResult(result);
            break;
          }
        }

        // Ball passed batter zone (miss) — keep ball alive for pass-through animation
        if (this.ball && this.ball.active && this.ball.isPastBatter(this.batter.getBatContactY())) {
          // Don't set ball.active = false — let ball continue to screen bottom
          this.audio.play('se_strike');
          this.handleHitResult({
            hit: false,
            timing: 'none',
            xGap: 0,
            direction: 0,
            distance: 0,
            judgment: 'STRIKE'
          });
        }
        break;
      }

      case 'RESULT':
        this.resultDisplay.update(dt);
        // Update batter during RESULT so recovery animation completes
        this.batter.update(dt, NULL_INPUT);
        // Update ball flight animation
        if (this.ballFlight && this.ballFlight.active) {
          this.ballFlight.update(dt);
        }
        // Update ball pass-through (strike: ball continues to screen bottom)
        if (this.ball && this.ball.active) {
          this.ball.update(dt);
          if (this.ball.y > CANVAS_HEIGHT + 50) {
            this.ball.active = false;
          }
        }
        const flightDone = !this.ballFlight || !this.ballFlight.active;
        if (this.resultDisplay.isComplete() && flightDone) {
          this.ballFlight = null;
          if (this.remainingPitches > 0) {
            this.transitionTo('COUNTDOWN');
          } else {
            this.cleared = this.homeRuns >= HR_QUOTA;
            this.audio.play(this.cleared ? 'se_stage_clear' : 'se_game_over');
            this.transitionTo('GAME_OVER');
          }
        }
        break;

      case 'GAME_OVER':
        // Wait for space to retry (rising edge)
        if (spacePressed) {
          this.resetGame();
          this.transitionTo('COUNTDOWN');
        }
        if (this.inputState.titleReturn) {
          this.inputState.titleReturn = false;
          this.returnToTitle();
        }
        break;
    }

    // Touch drag smoothing (frame-rate independent)
    if (this.touchState.dragging) {
      const t = 1 - Math.exp(-TOUCH_SMOOTHING * dt);
      this.batter.x += (this.touchState.targetX - this.batter.x) * t;
      this.batter.y += (this.touchState.targetY - this.batter.y) * t;
    }

    this.prevSpaceForState = this.inputState.space;
  }

  handleHitResult(result) {
    this.pitchCount++;
    this.remainingPitches = TOTAL_PITCHES - this.pitchCount;

    if (result.judgment === 'HOME_RUN') {
      this.homeRuns++;
      this.totalHRDistance += result.distance;
    }

    // FOUL does not count as a pitch (does not reduce remaining)
    if (result.judgment === 'FOUL') {
      this.pitchCount--;
      this.remainingPitches = TOTAL_PITCHES - this.pitchCount;
    }

    const powerLog = result.hit ? ` | power: ${Math.round(this.heartbeat.getMultiplier() * 100)}%` : '';
    console.log(`[PITCH ${this.pitchCount}] ${result.judgment} | timing: ${result.timing} | xGap: ${result.xGap}px | angle: ${result.direction}° | distance: ${result.distance}m${powerLog}`);

    // Store debug data
    this.debugData.pitchNumber = this.pitchCount;
    this.debugData.lastPower = result.hit ? Math.round(this.heartbeat.getMultiplier() * 100) : null;
    this.debugData.lastTiming = result.timing;
    this.debugData.lastDirectionAngle = result.direction;
    this.debugData.lastJudgment = result.judgment;
    this.debugData.lastDistance = result.distance;
    this.debugData.lastXGap = result.xGap;
    if (result._debug) {
      this.debugData.lastSweetSpotDist = result._debug.sweetSpotDist;
      this.debugData.lastSweetSpotSide = result._debug.isRootSide ? 'root' : 'tip';
      this.debugData.lastBallOffsetY = result._debug.ballOffsetY;
      this.debugData.lastBatAngle = result._debug.batAngleDeg;
    } else {
      // Clear per-hit debug data on miss/looking strike
      this.debugData.lastSweetSpotDist = null;
      this.debugData.lastSweetSpotSide = null;
      this.debugData.lastBallOffsetY = null;
    }

    // Launch ball flight animation for contact hits (HR, HIT, FOUL)
    if (result.hit && result.judgment !== 'STRIKE') {
      this.ballFlight = new BallFlight();
      this.ballFlight.launch(result, this.ball.x, this.ball.y);
      // 打撃 SE
      switch (result.judgment) {
        case 'HOME_RUN':
          this.audio.play('se_hit_homerun');
          this.audio.play('se_flight_hr');
          // 歓声は少し遅らせて鳴らす（打球が飛んでから）
          setTimeout(() => this.audio.play('se_crowd_cheer'), 400);
          break;
        case 'HIT':
          this.audio.play('se_hit_foul');
          break;
        case 'FOUL':
          this.audio.play('se_hit_foul');
          break;
      }
    } else {
      this.ballFlight = null;
      // 弱打（当たったが飛ばない）
      if (this.batter.swingState !== 'idle' && result.hit) {
        this.audio.play('se_hit_weak');
      }
      // 見逃しの場合は se_strike は上の PITCHING case で再生済み
    }

    this.resultDisplay.show(result);
    this.state = 'RESULT';
  }

  transitionTo(newState) {
    switch (newState) {
      case 'COUNTDOWN':
        this.audio.stopBgm();
        this.pitcher.reset();
        this.ball = null;
        this.ballFlight = null;
        // Sync batter's prevSpace to prevent auto-swing on first frame
        this.batter.prevSpace = this.inputState.space;
        break;
      case 'PITCHING': {
        this.ball = new Ball();
        const pitch = this.getPitchTarget();
        this.ball.launch(PITCHER_X, PITCHER_Y, pitch.x, pitch.y);
        break;
      }
      case 'RESULT':
        // handled by handleHitResult
        break;
      case 'GAME_OVER':
        break;
    }
    this.state = newState;
  }

  resetGame() {
    this.homeRuns = 0;
    this.totalHRDistance = 0;
    this.pitchCount = 0;
    this.remainingPitches = TOTAL_PITCHES;
    this.cleared = false;
    this.batter.reset();
    this.heartbeat.reset();
    this.ball = null;
    this.ballFlight = null;
  }

  pauseGame() {
    if (this.paused) return;
    this.paused = true;
    this.audio.stopAll();
  }

  resumeGame() {
    if (!this.paused) return;
    this.paused = false;
    // タイムスタンプをリセットして dt 暴走を防ぐ
    this.lastTimestamp = performance.now();
  }

  returnToTitle() {
    this.resetGame();
    this.state = 'READY';
    this.audio.playBgm('bgm_title', { maxLoops: 1 });
  }

  /**
   * Get the pitch target coordinates.
   * Randomly selects from 3 courses: inside, middle, outside.
   */
  getPitchTarget() {
    const courses = [
      { name: '内角', x: COURSE_INSIDE_X },
      { name: '真ん中', x: COURSE_MIDDLE_X },
      { name: '外角', x: COURSE_OUTSIDE_X },
    ];
    const course = courses[Math.floor(Math.random() * courses.length)];
    this.debugData.pitchCourse = course.name;
    return { x: course.x, y: STRIKE_ZONE_CENTER_Y };
  }

  render() {
    // Layer 1: Background image
    Renderer.drawBackground(this.ctx, this.assets.bg);

    // Layer 2: Moai (pitching machine)
    Renderer.drawMoai(this.ctx, this.assets.moai);

    // Layer 3: Ball flight (post-hit) — 打球は外野に飛ぶのでバッターの奥
    if (this.ballFlight && this.ballFlight.active) {
      Renderer.drawBallFlight(this.ctx, this.ballFlight);
    }

    // Layer 4: Ball (pitched) — バッターの裏を通る(奥から来る球)
    if (this.ball && this.ball.active) {
      Renderer.drawBall(this.ctx, this.ball);
    }

    // Layer 5: Batter sprite (手前)
    Renderer.drawBatterSprite(this.ctx, this.batter, this.assets.batter);

    // Scoreboard & power bar (hidden on title screen)
    if (this.state !== 'READY') {
      Renderer.drawScoreboard(this.ctx, {
        homeRuns: this.homeRuns,
        remainingPitches: this.remainingPitches
      });
      Renderer.drawHeartbeat(this.ctx, this.heartbeat);
    }

    // State-specific overlays
    switch (this.state) {
      case 'READY':
        Renderer.drawReady(this.ctx, this.assets.title, this.isTouchDevice);
        break;
      case 'COUNTDOWN':
        Renderer.drawCountdown(this.ctx, this.pitcher.countdownValue);
        break;
      case 'RESULT':
        Renderer.drawResult(this.ctx, this.resultDisplay);
        break;
      case 'GAME_OVER':
        Renderer.drawGameOver(this.ctx, this.cleared, this.totalHRDistance, this.homeRuns);
        break;
    }

    // Pause button (gameplay 中のみ)
    if (this.state !== 'READY' && this.state !== 'GAME_OVER') {
      Renderer.drawPauseButton(this.ctx);
    }

    // Pause overlay
    if (this.paused) {
      Renderer.drawPauseOverlay(this.ctx);
    }

    // Debug overlay (toggled with D key)
    if (this.debugMode) {
      Renderer.drawDebugOverlay(this.ctx, this.debugData);
    }
  }

  handleKeyDown(e) {
    // Escape でポーズトグル（gameplay 中）/ タイトル戻り（GAME_OVER）
    if (e.code === 'Escape') {
      if (this.paused) {
        this.resumeGame();
        return;
      }
      if (this.state === 'GAME_OVER') {
        this.inputState.titleReturn = true;
        return;
      }
      if (this.state !== 'READY') {
        this.pauseGame();
        return;
      }
    }

    // ポーズ中は他のキー入力を無視
    if (this.paused) return;

    if (e.code === 'ArrowLeft') this.inputState.left = true;
    if (e.code === 'ArrowRight') this.inputState.right = true;
    if (e.code === 'ArrowUp') { e.preventDefault(); this.inputState.up = true; }
    if (e.code === 'ArrowDown') { e.preventDefault(); this.inputState.down = true; }
    if (e.code === 'Space') {
      e.preventDefault();
      this.inputState.space = true;
    }
    if (e.code === 'KeyD') {
      this.debugMode = !this.debugMode;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft') this.inputState.left = false;
    if (e.code === 'ArrowRight') this.inputState.right = false;
    if (e.code === 'ArrowUp') this.inputState.up = false;
    if (e.code === 'ArrowDown') this.inputState.down = false;
    if (e.code === 'Space') this.inputState.space = false;
  }

  // =============================================
  // Mouse Input (PC)
  // =============================================

  handleClick(e, canvasRect) {
    const cx = (e.clientX - canvasRect.left) * (CANVAS_WIDTH / canvasRect.width);
    const cy = (e.clientY - canvasRect.top) * (CANVAS_HEIGHT / canvasRect.height);
    const inBtn = (btn) => cx >= btn.x && cx <= btn.x + btn.w && cy >= btn.y && cy <= btn.y + btn.h;

    // ポーズ中 → RESUME / TITLE ボタン判定
    if (this.paused) {
      const RESUME_BTN = { x: 140, y: 385, w: 200, h: 48 };
      const TITLE_BTN = { x: 140, y: 448, w: 200, h: 48 };
      if (inBtn(RESUME_BTN)) this.resumeGame();
      else if (inBtn(TITLE_BTN)) { this.paused = false; this.returnToTitle(); }
      return;
    }

    // || ポーズボタン（gameplay 中のみ）
    const PAUSE_BTN = { x: 432, y: 8, w: 40, h: 40 };
    if (this.state !== 'READY' && this.state !== 'GAME_OVER' && inBtn(PAUSE_BTN)) {
      this.pauseGame();
      return;
    }

    if (this.state === 'READY') {
      this.inputState.space = true;
      return;
    }

    if (this.state === 'GAME_OVER') {
      const RETRY_BTN = { x: 140, y: 415, w: 200, h: 48 };
      const TITLE_BTN = { x: 140, y: 478, w: 200, h: 48 };
      if (inBtn(RETRY_BTN)) {
        this.inputState.space = true;
      } else if (inBtn(TITLE_BTN)) {
        this.inputState.titleReturn = true;
      }
    }
  }

  // =============================================
  // Touch Input (Mobile)
  // =============================================

  _touchToCanvas(touch, canvasRect) {
    return {
      x: (touch.clientX - canvasRect.left) * (CANVAS_WIDTH / canvasRect.width),
      y: (touch.clientY - canvasRect.top) * (CANVAS_HEIGHT / canvasRect.height),
    };
  }

  handleTouchStart(e, canvasRect) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const { x: cx, y: cy } = this._touchToCanvas(touch, canvasRect);
      const inBtn = (btn) => cx >= btn.x && cx <= btn.x + btn.w && cy >= btn.y && cy <= btn.y + btn.h;

      // ポーズ中 → RESUME / TITLE ボタン判定
      if (this.paused) {
        const RESUME_BTN = { x: 140, y: 385, w: 200, h: 48 };
        const TITLE_BTN = { x: 140, y: 448, w: 200, h: 48 };
        if (inBtn(RESUME_BTN)) this.resumeGame();
        else if (inBtn(TITLE_BTN)) { this.paused = false; this.returnToTitle(); }
        return;
      }

      // || ポーズボタン（gameplay 中のみ）
      const PAUSE_BTN = { x: 432, y: 8, w: 40, h: 40 };
      if (this.state !== 'READY' && this.state !== 'GAME_OVER' && inBtn(PAUSE_BTN)) {
        this.pauseGame();
        return;
      }

      // READY → any tap = start
      if (this.state === 'READY') {
        this.inputState.space = true;
        return;
      }

      // GAME_OVER → check button bounds
      if (this.state === 'GAME_OVER') {
        const RETRY_BTN = { x: 140, y: 415, w: 200, h: 48 };
        const TITLE_BTN = { x: 140, y: 478, w: 200, h: 48 };
        if (inBtn(RETRY_BTN)) {
          this.inputState.space = true;
        } else if (inBtn(TITLE_BTN)) {
          this.inputState.titleReturn = true;
        }
        return;
      }

      // Left 55% of screen → drag batter
      if (cx < CANVAS_WIDTH * 0.55) {
        this.touchState.dragging = true;
        this.touchState.dragOffsetX = this.batter.x - cx;
        this.touchState.dragOffsetY = this.batter.y - cy;
        this.touchState.targetX = this.batter.x;
        this.touchState.targetY = this.batter.y;
        return;
      }

      // Right 45%, lower 50% → swing
      if (cx >= CANVAS_WIDTH * 0.55 && cy >= CANVAS_HEIGHT * 0.5) {
        this.inputState.space = true;
      }
    }
  }

  handleTouchMove(e, canvasRect) {
    e.preventDefault();
    if (!this.touchState.dragging) return;
    const touch = e.changedTouches[0];
    const { x: cx, y: cy } = this._touchToCanvas(touch, canvasRect);
    this.touchState.targetX = Math.max(BATTER_MIN_X, Math.min(BATTER_MAX_X, cx + this.touchState.dragOffsetX));
    this.touchState.targetY = Math.max(BATTER_MIN_Y, Math.min(BATTER_MAX_Y, cy + this.touchState.dragOffsetY));
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.touchState.dragging = false;
    this.inputState.space = false;
  }
}
