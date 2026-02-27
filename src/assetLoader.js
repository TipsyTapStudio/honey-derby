import { CANVAS_WIDTH, CANVAS_HEIGHT, BATTER_SPRITE_W, BATTER_SPRITE_H } from './constants.js';

const BATTER_FRAME_COUNT = 11;

/**
 * Preload all game images and resize via offscreen Canvas.
 */
export class AssetLoader {
  /**
   * @param {Function} onProgress - callback(loaded, total)
   * @returns {Promise<{bg: HTMLCanvasElement, moai: HTMLImageElement, batter: HTMLCanvasElement[]}>}
   */
  async load(onProgress) {
    const total = 1 + 1 + 1 + BATTER_FRAME_COUNT; // bg + moai + title + 11 batter
    let loaded = 0;

    const report = () => {
      loaded++;
      if (onProgress) onProgress(loaded, total);
    };

    // Load all images in parallel
    const [bgImg, moaiImg, titleImg, ...batterImgs] = await Promise.all([
      this._loadImage('assets/bg/bg_day_nomoai.PNG').then(img => { report(); return img; }),
      this._loadImage('assets/bg/moai_day.png').then(img => { report(); return img; }),
      this._loadImage('assets/title/title.png').then(img => { report(); return img; }),
      ...Array.from({ length: BATTER_FRAME_COUNT }, (_, i) => {
        const num = String(i + 1).padStart(2, '0');
        return this._loadImage(`assets/batter/swing_${num}.png`).then(img => { report(); return img; });
      })
    ]);

    // Resize BG to canvas size (848x1264 → 480x720)
    const bg = this._resizeToCanvas(bgImg, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Resize batter frames (2000x1320 → BATTER_SPRITE_W x BATTER_SPRITE_H)
    const batter = batterImgs.map(img => {
      return this._resizeToCanvas(img, BATTER_SPRITE_W, BATTER_SPRITE_H);
    });

    // Moai is small (87x164) — use as-is, no resize
    // Title image — use as-is (drawn with scaling in renderer)
    return { bg, moai: moaiImg, batter, title: titleImg };
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
