import {
  BATTER_X, BATTER_Y, BATTER_MOVE_SPEED,
  BATTER_MIN_X, BATTER_MAX_X, BATTER_MIN_Y, BATTER_MAX_Y,
  BAT_IDLE_ANGLE, BAT_IMPACT_END_ANGLE, BAT_FOLLOW_END_ANGLE,
  SWING_IMPACT_MS, SWING_FOLLOWTHROUGH_MS, SWING_RECOVERY_MS
} from './constants.js';

export class Batter {
  constructor() {
    this.x = BATTER_X;
    this.y = BATTER_Y;
    this.swingState = 'idle'; // idle | impact | followthrough | recovery
    this.swingTimer = 0;
    this.batAngle = BAT_IDLE_ANGLE;
    this.prevSpace = false;
  }

  update(dt, inputState) {
    // Horizontal movement
    if (inputState.left) {
      this.x -= BATTER_MOVE_SPEED * dt;
    }
    if (inputState.right) {
      this.x += BATTER_MOVE_SPEED * dt;
    }
    this.x = Math.max(BATTER_MIN_X, Math.min(BATTER_MAX_X, this.x));

    // Vertical movement
    if (inputState.up) {
      this.y -= BATTER_MOVE_SPEED * dt;
    }
    if (inputState.down) {
      this.y += BATTER_MOVE_SPEED * dt;
    }
    this.y = Math.max(BATTER_MIN_Y, Math.min(BATTER_MAX_Y, this.y));

    // Swing trigger (rising edge)
    if (inputState.space && !this.prevSpace && this.swingState === 'idle') {
      this.swingState = 'impact';
      this.swingTimer = 0;
    }
    this.prevSpace = inputState.space;

    // Swing state machine
    if (this.swingState === 'impact') {
      // CCW: -120° → -360° (240° 反時計回り)
      this.swingTimer += dt * 1000;
      const progress = Math.min(this.swingTimer / SWING_IMPACT_MS, 1);
      this.batAngle = BAT_IDLE_ANGLE + (BAT_IMPACT_END_ANGLE - BAT_IDLE_ANGLE) * progress;
      if (this.swingTimer >= SWING_IMPACT_MS) {
        this.swingState = 'followthrough';
        this.swingTimer = 0;
      }
    } else if (this.swingState === 'followthrough') {
      // CCW: -360° → -480° (120° 反時計回り)
      this.swingTimer += dt * 1000;
      const progress = Math.min(this.swingTimer / SWING_FOLLOWTHROUGH_MS, 1);
      this.batAngle = BAT_IMPACT_END_ANGLE + (BAT_FOLLOW_END_ANGLE - BAT_IMPACT_END_ANGLE) * progress;
      if (this.swingTimer >= SWING_FOLLOWTHROUGH_MS) {
        this.swingState = 'recovery';
        this.swingTimer = 0;
      }
    } else if (this.swingState === 'recovery') {
      // CW: -480° → -120° (360° 時計回り、角度を増加)
      this.swingTimer += dt * 1000;
      const progress = Math.min(this.swingTimer / SWING_RECOVERY_MS, 1);
      this.batAngle = BAT_FOLLOW_END_ANGLE + (BAT_IDLE_ANGLE - BAT_FOLLOW_END_ANGLE) * progress;
      if (this.swingTimer >= SWING_RECOVERY_MS) {
        this.swingState = 'idle';
        this.swingTimer = 0;
        this.batAngle = BAT_IDLE_ANGLE;
      }
    }
  }

  isInImpactPhase() {
    return this.swingState === 'impact';
  }

  getBatCenterX() {
    // The bat's sweet spot is at the tip, offset from batter center
    const batTipOffset = 40; // px from center
    return this.x + Math.cos(this.batAngle) * batTipOffset;
  }

  reset() {
    this.x = BATTER_X;
    this.y = BATTER_Y;
    this.swingState = 'idle';
    this.swingTimer = 0;
    this.batAngle = BAT_IDLE_ANGLE;
    this.prevSpace = false;
  }
}
