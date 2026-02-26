import {
  BALL_FLIGHT_HR_DURATION, BALL_FLIGHT_HIT_DURATION,
  BALL_FLIGHT_FOUL_DURATION,
  CANVAS_WIDTH, BALL_END_RADIUS
} from './constants.js';

/**
 * Post-hit ball flight animation.
 * Uses quadratic Bezier curve for parabolic arc (HR, FOUL).
 * Uses multi-phase system for HIT (bezier + 3 bounces + roll).
 */
export class BallFlight {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.radius = BALL_END_RADIUS;
    this.progress = 0;
    this.elapsed = 0;
    this.duration = 0;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.peakY = 0;       // Bezier control point Y (lower = higher on screen)
    this.startRadius = BALL_END_RADIUS;
    this.endRadius = 2;
    this.curvedMidX = undefined; // Override for foul curve (undefined = use default midX)

    // Multi-phase (HIT bounce system)
    this.phase = 0;
    this.phases = null;       // Phase array (HIT only; null = single Bezier)
    this.phaseElapsed = 0;
    this.groundY = 0;
  }

  /**
   * Launch the ball flight based on hit result.
   * @param {object} hitResult - { judgment, direction, distance }
   * @param {number} ballX - Ball X at moment of impact
   * @param {number} ballY - Ball Y at moment of impact
   */
  launch(hitResult, ballX, ballY) {
    this.active = true;
    this.elapsed = 0;
    this.progress = 0;
    this.startX = ballX;
    this.startY = ballY;
    this.x = ballX;
    this.y = ballY;
    this.startRadius = BALL_END_RADIUS;
    this.curvedMidX = undefined;
    this.phases = null;
    this.phase = 0;
    this.phaseElapsed = 0;

    const dir = hitResult.direction || 0; // angle in degrees (-45 to +45)

    switch (hitResult.judgment) {
      case 'HOME_RUN': {
        const dist = hitResult.distance; // 100~160m
        const t = (dist - 100) / 60;    // 0.0~1.0 normalized

        this.duration = 2500 + t * 1000;  // 2500~3500ms (slow, dramatic flight)

        this.peakY = -150 - t * 350;      // -150~-500 (higher arc)

        if (t < 0.75) {
          this.endY = 280 - t * 280;      // 280~70 (lands in stands)
        } else {
          this.endY = 70 - (t - 0.75) * 480; // 70→-50 (moonshot off screen)
        }

        this.endX = CANVAS_WIDTH / 2 + dir * 8;
        this.endRadius = 3 - t * 2.5;     // 3→0.5 (gets very small)
        break;
      }

      case 'HIT': {
        this.groundY = 380;  // Outfield ground Y
        const spread = dir * 3.5;
        const fieldEndX = CANVAS_WIDTH / 2 + spread;

        this.phases = [
          // Phase 0: Initial flight (Bezier) — ball flies to outfield
          { type: 'bezier', duration: 600,
            startX: this.startX, startY: this.startY,
            endX: fieldEndX - 30, endY: this.groundY,
            peakY: this.startY - 120,
            startR: BALL_END_RADIUS, endR: 6 },
          // Phase 1: Bounce 1 — high bounce
          { type: 'bounce', duration: 350,
            height: 40, startR: 6, endR: 5.5 },
          // Phase 2: Bounce 2 — medium
          { type: 'bounce', duration: 250,
            height: 20, startR: 5.5, endR: 5 },
          // Phase 3: Bounce 3 — low
          { type: 'bounce', duration: 150,
            height: 8, startR: 5, endR: 4.5 },
          // Phase 4: Roll — along ground
          { type: 'roll', duration: 300,
            startR: 4.5, endR: 4 }
        ];

        this.duration = this.phases.reduce((sum, p) => sum + p.duration, 0);
        this.phase = 0;
        this.phaseElapsed = 0;

        // Auto-calculate bounce/roll positions from initial bezier endpoint
        let curX = this.phases[0].endX;
        const rollPerPhase = 15;
        for (let i = 1; i < this.phases.length; i++) {
          this.phases[i].startX = curX;
          curX += rollPerPhase * Math.sign(spread || 1);
          this.phases[i].endX = curX;
        }
        break;
      }

      case 'FOUL': {
        this.duration = BALL_FLIGHT_FOUL_DURATION;
        const isLeft = dir < 0;
        this.endX = isLeft ? -120 : CANVAS_WIDTH + 120;
        this.endY = 250;
        this.peakY = 100;
        this.endRadius = 4;

        // Curve: bias midX toward foul direction for outward curve
        this.curvedMidX = this.startX + (this.endX - this.startX) * 0.65;
        break;
      }

      default:
        this.active = false;
        return;
    }
  }

  /**
   * Update ball position.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    this.elapsed += dt * 1000;

    if (this.phases) {
      this._updateMultiPhase(dt);
    } else {
      this._updateSingleBezier(dt);
    }
  }

  /**
   * Single Bezier curve update (HR, FOUL).
   */
  _updateSingleBezier(dt) {
    this.progress = Math.min(this.elapsed / this.duration, 1);

    // Ease-out: fast near batter, slow in distance (perspective)
    const t = Math.pow(this.progress, 0.6);

    const midX = this.curvedMidX !== undefined
      ? this.curvedMidX
      : (this.startX + this.endX) / 2;

    this.x = (1 - t) * (1 - t) * this.startX
           + 2 * (1 - t) * t * midX
           + t * t * this.endX;

    this.y = (1 - t) * (1 - t) * this.startY
           + 2 * (1 - t) * t * this.peakY
           + t * t * this.endY;

    this.radius = this.startRadius + (this.endRadius - this.startRadius) * t;

    if (this.progress >= 1) {
      this.active = false;
    }
  }

  /**
   * Multi-phase update (HIT bounce system).
   */
  _updateMultiPhase(dt) {
    this.phaseElapsed += dt * 1000;

    // Advance through phases
    while (this.phase < this.phases.length - 1 &&
           this.phaseElapsed >= this.phases[this.phase].duration) {
      this.phaseElapsed -= this.phases[this.phase].duration;
      this.phase++;
    }

    const cp = this.phases[this.phase];
    const t = Math.min(this.phaseElapsed / cp.duration, 1);

    switch (cp.type) {
      case 'bezier': {
        const midX = (cp.startX + cp.endX) / 2;
        this.x = (1 - t) * (1 - t) * cp.startX + 2 * (1 - t) * t * midX + t * t * cp.endX;
        this.y = (1 - t) * (1 - t) * cp.startY + 2 * (1 - t) * t * cp.peakY + t * t * cp.endY;
        break;
      }
      case 'bounce': {
        // Sin arc: ground → peak → ground
        this.x = cp.startX + (cp.endX - cp.startX) * t;
        this.y = this.groundY - Math.sin(t * Math.PI) * cp.height;
        break;
      }
      case 'roll': {
        // Horizontal roll along ground
        this.x = cp.startX + (cp.endX - cp.startX) * t;
        this.y = this.groundY;
        break;
      }
    }

    this.radius = cp.startR + (cp.endR - cp.startR) * t;

    // Complete when last phase finishes
    if (this.phase === this.phases.length - 1 && t >= 1) {
      this.active = false;
    }
  }

  isComplete() {
    return !this.active;
  }

  reset() {
    this.active = false;
    this.elapsed = 0;
    this.progress = 0;
    this.curvedMidX = undefined;
    this.phases = null;
    this.phase = 0;
    this.phaseElapsed = 0;
  }
}
