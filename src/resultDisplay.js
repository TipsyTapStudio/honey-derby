import { RESULT_DISPLAY_MS } from './constants.js';

export class ResultDisplay {
  constructor() {
    this.active = false;
    this.distance = 0;
    this.judgment = '';
    this.displayTimer = 0;
  }

  show(hitResult) {
    this.active = true;
    this.distance = hitResult.distance;
    this.judgment = hitResult.judgment;
    this.displayTimer = 0;
  }

  update(dt) {
    if (!this.active) return;
    this.displayTimer += dt * 1000;
    if (this.displayTimer >= RESULT_DISPLAY_MS) {
      this.active = false;
    }
  }

  isComplete() {
    return !this.active;
  }
}
