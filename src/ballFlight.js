import {
  BALL_FLIGHT_HR_DURATION, BALL_FLIGHT_HIT_DURATION,
  BALL_FLIGHT_FOUL_DURATION,
  CANVAS_WIDTH, BALL_END_RADIUS
} from './constants.js';

/**
 * Post-hit ball flight animation.
 * Uses quadratic Bezier curve for parabolic arc with perspective (depth).
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
    this.x = ballX;        // Initialize position to avoid (0,0) on first frame
    this.y = ballY;
    this.startRadius = BALL_END_RADIUS;

    const dir = hitResult.direction || 0; // angle in degrees (-45 to +45)

    switch (hitResult.judgment) {
      case 'HOME_RUN':
        this.duration = BALL_FLIGHT_HR_DURATION;
        this.endX = CANVAS_WIDTH / 2 + dir * 1.5;
        this.endY = -50;          // off-screen top (into the stands)
        this.peakY = 100;         // high arc
        this.endRadius = 2;       // tiny (far away)
        break;

      case 'HIT':
        this.duration = BALL_FLIGHT_HIT_DURATION;
        this.endX = CANVAS_WIDTH / 2 + dir * 2;
        this.endY = 200;          // lands in outfield (before stands)
        this.peakY = 150;         // moderate arc
        this.endRadius = 4;
        break;

      case 'FOUL':
        this.duration = BALL_FLIGHT_FOUL_DURATION;
        // Fly off left or right based on direction sign
        this.endX = dir < 0 ? -50 : CANVAS_WIDTH + 50;
        this.endY = 300;
        this.peakY = 200;
        this.endRadius = 5;
        break;

      default:
        // Weak contact — should not normally reach here
        this.active = false;
        return;
    }
  }

  /**
   * Update ball position along Bezier curve.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    this.elapsed += dt * 1000;
    this.progress = Math.min(this.elapsed / this.duration, 1);

    const t = this.progress;

    // Quadratic Bezier: P = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    // P0 = start, P1 = control (midX, peakY), P2 = end
    const midX = (this.startX + this.endX) / 2;

    this.x = (1 - t) * (1 - t) * this.startX
           + 2 * (1 - t) * t * midX
           + t * t * this.endX;

    this.y = (1 - t) * (1 - t) * this.startY
           + 2 * (1 - t) * t * this.peakY
           + t * t * this.endY;

    // Radius: linear interpolation (shrink as ball flies away)
    this.radius = this.startRadius + (this.endRadius - this.startRadius) * t;

    if (this.progress >= 1) {
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
  }
}
