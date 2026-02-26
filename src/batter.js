import {
  BATTER_X, BATTER_Y, BATTER_MOVE_SPEED,
  BATTER_MIN_X, BATTER_MAX_X, BATTER_MIN_Y, BATTER_MAX_Y,
  BAT_IDLE_ANGLE, BAT_IMPACT_END_ANGLE, BAT_FOLLOW_END_ANGLE,
  SWING_IMPACT_MS, SWING_FOLLOWTHROUGH_MS, SWING_RECOVERY_MS,
  BAT_TIP_OFFSET, BAT_CONTACT_Y_OFFSET
} from './constants.js';

export class Batter {
  constructor() {
    this.x = BATTER_X;
    this.y = BATTER_Y;
    this.swingState = 'idle'; // idle | impact | followthrough | recovery
    this.swingTimer = 0;
    this.batAngle = BAT_IDLE_ANGLE;
    this.prevSpace = false;
    this.frameIndex = 0; // Sprite frame index (0~10)
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

    // Update sprite frame index
    this._updateFrameIndex();
  }

  /**
   * Map swing state + progress → sprite frame index (0~10)
   *
   * swing_01 (idx 0)  → Idle
   * swing_02~05 (1~4) → Impact (4 frames across 120ms)
   * swing_06~08 (5~7) → Follow-through (3 frames across 100ms)
   * Recovery: reverse playback 7→6→5→4→3→2→1→0 (8 frames across 280ms)
   */
  _updateFrameIndex() {
    if (this.swingState === 'idle') {
      this.frameIndex = 0;
    } else if (this.swingState === 'impact') {
      const p = Math.min(this.swingTimer / SWING_IMPACT_MS, 0.999);
      this.frameIndex = 1 + Math.floor(p * 4);  // 1,2,3,4
    } else if (this.swingState === 'followthrough') {
      const p = Math.min(this.swingTimer / SWING_FOLLOWTHROUGH_MS, 0.999);
      this.frameIndex = 5 + Math.floor(p * 3);  // 5,6,7
    } else if (this.swingState === 'recovery') {
      const p = Math.min(this.swingTimer / SWING_RECOVERY_MS, 0.999);
      this.frameIndex = 7 - Math.floor(p * 8);  // 7,6,5,4,3,2,1,0 (逆再生)
    }
  }

  isInImpactPhase() {
    return this.swingState === 'impact';
  }

  /**
   * Extended hit window: impact phase + first 50ms of followthrough.
   * Allows push-direction hits (bat past horizontal).
   */
  isInHitWindow() {
    if (this.swingState === 'impact') return true;
    if (this.swingState === 'followthrough' && this.swingTimer < 50) return true;
    return false;
  }

  getBatCenterX() {
    // The bat's sweet spot is at the tip, offset from batter center
    return this.x + Math.cos(this.batAngle) * BAT_TIP_OFFSET;
  }

  getBatContactY() {
    // The bat's horizontal swing plane Y, offset above batter's feet
    return this.y - BAT_CONTACT_Y_OFFSET;
  }

  reset() {
    this.x = BATTER_X;
    this.y = BATTER_Y;
    this.swingState = 'idle';
    this.swingTimer = 0;
    this.batAngle = BAT_IDLE_ANGLE;
    this.prevSpace = false;
    this.frameIndex = 0;
  }
}
