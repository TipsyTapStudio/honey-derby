import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const BATTER_FRAME_COUNT = 11;
const BATTER_SPRITE_SCALE = 180 / 2000; // 2000px → 180px

/**
 * Preload all game images and resize via offscreen Canvas.
 */
export class AssetLoader {
  /**
   * @param {Function} onProgress - callback(loaded, total)
   * @returns {Promise<{bg: HTMLCanvasElement, moai: HTMLImageElement, batter: HTMLCanvasElement[]}>}
   */
  async load(onProgress) {
    const total = 1 + 1 + BATTER_FRAME_COUNT; // bg + moai + 11 batter
    let loaded = 0;

    const report = () => {
      loaded++;
      if (onProgress) onProgress(loaded, total);
    };

    // Load all images in parallel
    const [bgImg, moaiImg, ...batterImgs] = await Promise.all([
      this._loadImage('assets/bg/bg_day_nomoai.PNG').then(img => { report(); return img; }),
      this._loadImage('assets/bg/moai_day.png').then(img => { report(); return img; }),
      ...Array.from({ length: BATTER_FRAME_COUNT }, (_, i) => {
        const num = String(i + 1).padStart(2, '0');
        return this._loadImage(`assets/batter/swing_${num}.png`).then(img => { report(); return img; });
      })
    ]);

    // Resize BG to canvas size (848x1264 → 480x720)
    const bg = this._resizeToCanvas(bgImg, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Resize batter frames (2000x1320 → 180x119)
    const batter = batterImgs.map(img => {
      const w = Math.round(img.naturalWidth * BATTER_SPRITE_SCALE);
      const h = Math.round(img.naturalHeight * BATTER_SPRITE_SCALE);
      return this._resizeToCanvas(img, w, h);
    });

    // Moai is small (87x164) — use as-is, no resize
    return { bg, moai: moaiImg, batter };
  }

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }

  _resizeToCanvas(img, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  }
}
