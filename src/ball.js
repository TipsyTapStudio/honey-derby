import {
  BALL_SPEED, BALL_START_RADIUS, BALL_END_RADIUS, BAT_HITZONE_HEIGHT
} from './constants.js';

export class Ball {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.speed = BALL_SPEED;
    this.progress = 0;
    this.radius = BALL_START_RADIUS;
    this.active = false;
    this.totalDistance = 0;
  }

  launch(startX, startY, targetX, targetY) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.progress = 0;
    this.active = true;
    this.totalDistance = Math.sqrt(
      (targetX - startX) ** 2 + (targetY - startY) ** 2
    );
  }

  update(dt) {
    if (!this.active) return;

    const distanceThisFrame = this.speed * dt;
    this.progress += distanceThisFrame / this.totalDistance;
    this.progress = Math.min(this.progress, 3.5); // allow ball to pass through to screen bottom

    // Perspective ease-in: ball appears slow far away, accelerates as it approaches
    // progress is linear (0→1), visualProgress applies power curve for depth illusion
    const clamped = Math.min(this.progress, 1);
    const visualProgress = Math.pow(clamped, 2.5);
    // For progress > 1 (ball past batter), use linear extension
    const effectiveProgress = this.progress <= 1 ? visualProgress : visualProgress + (this.progress - 1);

    this.x = this.startX + (this.targetX - this.startX) * effectiveProgress;
    this.y = this.startY + (this.targetY - this.startY) * effectiveProgress;

    // Scale radius for depth illusion (also use visual progress for consistent perspective)
    this.radius = BALL_START_RADIUS + (BALL_END_RADIUS - BALL_START_RADIUS) * visualProgress;
  }

  isPastBatter(batContactY) {
    return this.y > batContactY + BAT_HITZONE_HEIGHT / 2;
  }
}
