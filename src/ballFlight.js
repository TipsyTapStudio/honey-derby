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
    this.curvedMidX = undefined; // Override for foul curve (undefined = use default midX)
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
    this.curvedMidX = undefined; // Reset curve override

    const dir = hitResult.direction || 0; // angle in degrees (-45 to +45)

    switch (hitResult.judgment) {
      case 'HOME_RUN': {
        const dist = hitResult.distance; // 100~160m
        const t = (dist - 100) / 60;    // 0.0 (100m) ~ 1.0 (160m) normalized

        this.duration = 1200 + t * 400;  // 1200~1600ms (longer for bigger HRs)

        // peakY: Bezier control point (lower value = higher arc on screen)
        this.peakY = -100 - t * 200;     // -100 (short HR) ~ -300 (moonshot)

        // endY: landing point (must be > peakY for descent arc)
        if (t < 0.75) {
          // 100~145m: lands in stands (descent visible on screen)
          this.endY = 300 - t * 300;     // 300 (barely HR) ~ 75 (deep stands)
        } else {
          // 145~160m: 場外ホームラン (flies off screen)
          this.endY = 75 - (t - 0.75) * 500; // 75 → -50 (off screen)
        }

        this.endX = CANVAS_WIDTH / 2 + dir * 4;
        this.endRadius = 6 - t * 4;     // 6 (short HR) ~ 2 (moonshot)
        break;
      }

      case 'HIT':
        this.duration = BALL_FLIGHT_HIT_DURATION;
        this.endX = CANVAS_WIDTH / 2 + dir * 3.5;  // 大きなL/Rスプレッド (旧 dir*2)
        this.endY = 200;          // lands in outfield (before stands)
        this.peakY = 150;         // moderate arc
        this.endRadius = 4;
        break;

      case 'FOUL': {
        this.duration = BALL_FLIGHT_FOUL_DURATION;
        const isLeft = dir < 0;
        this.endX = isLeft ? -120 : CANVAS_WIDTH + 120;  // 画面外へ
        this.endY = 250;
        this.peakY = 100;         // 高い弧
        this.endRadius = 4;

        // ★ Curve: bias midX toward foul direction for outward curve
        // Ball starts fair-ish then curves sharply foul
        this.curvedMidX = this.startX + (this.endX - this.startX) * 0.65;
        break;
      }

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
    const midX = this.curvedMidX !== undefined
      ? this.curvedMidX
      : (this.startX + this.endX) / 2;

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
    this.curvedMidX = undefined;
  }
}
