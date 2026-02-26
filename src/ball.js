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

    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;

    // Scale radius for depth illusion
    this.radius = BALL_START_RADIUS + (BALL_END_RADIUS - BALL_START_RADIUS) * Math.min(this.progress, 1);
  }

  isPastBatter(batContactY) {
    return this.y > batContactY + BAT_HITZONE_HEIGHT / 2;
  }
}
