import {
  PITCHER_X, PITCHER_Y, HOME_PLATE_Y,
  TOTAL_PITCHES, HR_QUOTA
} from './constants.js';
import { Pitcher } from './pitcher.js';
import { Batter } from './batter.js';
import { Ball } from './ball.js';
import { BallFlight } from './ballFlight.js';
import { ResultDisplay } from './resultDisplay.js';
import * as HitDetector from './hitDetector.js';
import * as Renderer from './renderer.js';

// Null input for batter update during RESULT state (no movement, no swing)
const NULL_INPUT = { left: false, right: false, up: false, down: false, space: false };

export class Game {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets; // { bg, moai, batter[] }
    this.state = 'READY'; // READY | COUNTDOWN | PITCHING | RESULT | GAME_OVER
    this.pitcher = new Pitcher();
    this.batter = new Batter();
    this.ball = null;
    this.ballFlight = null;
    this.resultDisplay = new ResultDisplay();
    this.lastTimestamp = 0;

    this.inputState = { left: false, right: false, up: false, down: false, space: false };
    this.prevSpaceForState = false; // Edge detection for state transitions

    // Score
    this.homeRuns = 0;
    this.pitchCount = 0;
    this.remainingPitches = TOTAL_PITCHES;
    this.cleared = false;
  }

  start() {
    this.lastTimestamp = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  loop(timestamp) {
    let dt = (timestamp - this.lastTimestamp) / 1000;
    dt = Math.min(dt, 0.05); // Clamp to prevent spiral of death
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    const spacePressed = this.inputState.space && !this.prevSpaceForState;

    switch (this.state) {
      case 'READY':
        // Wait for space to start (rising edge)
        if (spacePressed) {
          // TODO: audioManager.play('se_game_start')
          this.transitionTo('COUNTDOWN');
        }
        break;

      case 'COUNTDOWN':
        this.pitcher.updateCountdown(dt);
        this.batter.update(dt, this.inputState);
        if (this.pitcher.isCountdownComplete()) {
          // TODO: audioManager.play('se_pitch')
          this.transitionTo('PITCHING');
        }
        break;

      case 'PITCHING':
        this.ball.update(dt);
        this.batter.update(dt, this.inputState);

        // Check for hit during Impact phase
        if (this.batter.isInImpactPhase() && this.ball && this.ball.active) {
          const result = HitDetector.evaluate(this.ball, this.batter);
          if (result) {
            this.ball.active = false;
            this.handleHitResult(result);
            break;
          }
        }

        // Ball passed batter zone (miss)
        if (this.ball && this.ball.active && this.ball.isPastBatter()) {
          this.ball.active = false;
          // TODO: audioManager.play('se_strike')
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

      case 'RESULT':
        this.resultDisplay.update(dt);
        // Update batter during RESULT so recovery animation completes
        this.batter.update(dt, NULL_INPUT);
        // Update ball flight animation
        if (this.ballFlight && this.ballFlight.active) {
          this.ballFlight.update(dt);
        }
        if (this.resultDisplay.isComplete()) {
          this.ballFlight = null;
          if (this.remainingPitches > 0) {
            this.transitionTo('COUNTDOWN');
          } else {
            this.cleared = this.homeRuns >= HR_QUOTA;
            // TODO: audioManager.play(this.cleared ? 'se_stage_clear' : 'se_game_over')
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
        break;
    }

    this.prevSpaceForState = this.inputState.space;
  }

  handleHitResult(result) {
    this.pitchCount++;
    this.remainingPitches = TOTAL_PITCHES - this.pitchCount;

    if (result.judgment === 'HOME_RUN') {
      this.homeRuns++;
    }

    // FOUL does not count as a pitch (does not reduce remaining)
    if (result.judgment === 'FOUL') {
      this.pitchCount--;
      this.remainingPitches = TOTAL_PITCHES - this.pitchCount;
    }

    console.log(`[PITCH ${this.pitchCount}] ${result.judgment} | timing: ${result.timing} | xGap: ${result.xGap}px | angle: ${result.direction}° | distance: ${result.distance}m`);

    // Launch ball flight animation for contact hits (HR, HIT, FOUL)
    if (result.hit && result.judgment !== 'STRIKE') {
      this.ballFlight = new BallFlight();
      this.ballFlight.launch(result, this.ball.x, this.ball.y);
      // TODO: audioManager.play('se_hit_xxx') based on judgment
      // TODO: audioManager.play('se_crowd_xxx') based on judgment
    } else {
      this.ballFlight = null;
      // TODO: audioManager.play('se_swing_miss') if swung, or 'se_strike' if not
    }

    this.resultDisplay.show(result);
    this.state = 'RESULT';
  }

  transitionTo(newState) {
    switch (newState) {
      case 'COUNTDOWN':
        this.pitcher.reset();
        this.ball = null;
        this.ballFlight = null;
        break;
      case 'PITCHING':
        this.ball = new Ball();
        this.ball.launch(PITCHER_X, PITCHER_Y, PITCHER_X, HOME_PLATE_Y);
        break;
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
    this.pitchCount = 0;
    this.remainingPitches = TOTAL_PITCHES;
    this.cleared = false;
    this.batter.reset();
    this.ball = null;
    this.ballFlight = null;
  }

  render() {
    // Layer 1: Background image
    Renderer.drawBackground(this.ctx, this.assets.bg);

    // Layer 2: Moai (pitching machine)
    Renderer.drawMoai(this.ctx, this.assets.moai);

    // Layer 3: Batter sprite
    Renderer.drawBatterSprite(this.ctx, this.batter, this.assets.batter);

    // Layer 4: Ball (pitched, in flight toward batter)
    if (this.ball && this.ball.active) {
      Renderer.drawBall(this.ctx, this.ball);
    }

    // Layer 5: Ball flight (post-hit trajectory)
    if (this.ballFlight && this.ballFlight.active) {
      Renderer.drawBallFlight(this.ctx, this.ballFlight);
    }

    // Scoreboard (always visible)
    Renderer.drawScoreboard(this.ctx, {
      homeRuns: this.homeRuns,
      remainingPitches: this.remainingPitches
    });

    // State-specific overlays
    switch (this.state) {
      case 'READY':
        Renderer.drawReady(this.ctx);
        break;
      case 'COUNTDOWN':
        Renderer.drawCountdown(this.ctx, this.pitcher.countdownValue);
        break;
      case 'RESULT':
        Renderer.drawResult(this.ctx, this.resultDisplay);
        break;
      case 'GAME_OVER':
        Renderer.drawGameOver(this.ctx, this.cleared);
        break;
    }
  }

  handleKeyDown(e) {
    if (e.code === 'ArrowLeft') this.inputState.left = true;
    if (e.code === 'ArrowRight') this.inputState.right = true;
    if (e.code === 'ArrowUp') { e.preventDefault(); this.inputState.up = true; }
    if (e.code === 'ArrowDown') { e.preventDefault(); this.inputState.down = true; }
    if (e.code === 'Space') {
      e.preventDefault();
      this.inputState.space = true;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft') this.inputState.left = false;
    if (e.code === 'ArrowRight') this.inputState.right = false;
    if (e.code === 'ArrowUp') this.inputState.up = false;
    if (e.code === 'ArrowDown') this.inputState.down = false;
    if (e.code === 'Space') this.inputState.space = false;
  }
}
