import { PITCHER_X, PITCHER_Y, COUNTDOWN_STEP_MS } from './constants.js';

export class Pitcher {
  constructor() {
    this.x = PITCHER_X;
    this.y = PITCHER_Y;
    this.countdownValue = 3;
    this.countdownTimer = 0;
  }

  reset() {
    this.countdownValue = 3;
    this.countdownTimer = 0;
  }

  updateCountdown(dt) {
    this.countdownTimer += dt * 1000; // to ms
    if (this.countdownTimer >= COUNTDOWN_STEP_MS) {
      this.countdownTimer -= COUNTDOWN_STEP_MS;
      this.countdownValue--;
    }
  }

  isCountdownComplete() {
    return this.countdownValue <= 0;
  }
}
