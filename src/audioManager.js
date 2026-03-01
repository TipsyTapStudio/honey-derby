/**
 * AudioManager - Sound effect system for HONEY-DERBY.
 *
 * Sound manifest (13 effects):
 *   se_game_start      - ゲーム開始（ジャン！）
 *   se_countdown_tick   - カウントダウン 3, 2, 1（ピッ）
 *   se_countdown_go     - カウント完了（決定音）
 *   se_pitch            - 投球（風切り音）
 *   se_swing_miss       - 素振り・空振り（ブンッ）
 *   se_hit_homerun      - 打撃：HR（カキーン）
 *   se_hit_foul         - 打撃：FOUL / OUT（カッ）
 *   se_hit_weak         - 打撃：弱STRIKE（ボテッ）
 *   se_strike           - 見逃しSTRIKE（ミットの音）
 *   se_flight_hr        - HR飛球中（歓声＋ヒュー）
 *   se_crowd_cheer      - 歓声：HR（大歓声）
 *   se_stage_clear      - ステージクリア（ファンファーレ）
 *   se_game_over        - ゲームオーバー（短い失敗ジングル）
 *
 * BGM:
 *   bgm_title           - タイトル画面 BGM（ループ再生）
 */

const SOUND_MANIFEST = [
  'se_game_start',
  'se_countdown_tick',
  'se_countdown_go',
  'se_pitch',
  'se_swing_miss',
  'se_hit_homerun',
  'se_hit_foul',
  'se_hit_weak',
  'se_strike',
  'se_flight_hr',
  'se_crowd_cheer',
  'se_stage_clear',
  'se_game_over',
];

const BGM_MANIFEST = [
  { name: 'bgm_title', ext: 'ogg' },
];

export class AudioManager {
  constructor() {
    this.sounds = {};       // name → HTMLAudioElement (template)
    this.playing = {};      // name → HTMLAudioElement[] (active clones)
    this.bgm = {};          // name → HTMLAudioElement (BGM, 使い回し)
    this.currentBgm = null; // 現在再生中の BGM 名
    this.enabled = true;
    this.volume = 0.7;
    this.bgmVolume = 0.4;   // BGM は SE より控えめ
    this.loaded = false;
    this._unlocked = false; // モバイル AudioContext アンロック済みフラグ
  }

  /**
   * Preload all sound effects.
   * @param {Function} onProgress - callback(loaded, total)
   * @returns {Promise<void>}
   */
  async loadAll(onProgress) {
    const total = SOUND_MANIFEST.length + BGM_MANIFEST.length;
    let loaded = 0;

    const loadAudio = (src) => {
      return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.preload = 'auto';

        const onReady = () => {
          loaded++;
          if (onProgress) onProgress(loaded, total);
          resolve(audio);
        };

        audio.addEventListener('canplaythrough', onReady, { once: true });
        audio.addEventListener('error', () => {
          console.warn(`[AudioManager] Failed to load: ${src}`);
          loaded++;
          if (onProgress) onProgress(loaded, total);
          resolve(null);
        }, { once: true });

        audio.load();
      });
    };

    // SE ロード
    const sePromises = SOUND_MANIFEST.map(async (name) => {
      const audio = await loadAudio(`assets/audio/${name}.mp3`);
      if (audio) this.sounds[name] = audio;
    });

    // BGM ロード
    const bgmPromises = BGM_MANIFEST.map(async ({ name, ext }) => {
      const audio = await loadAudio(`assets/audio/${name}.${ext}`);
      if (audio) this.bgm[name] = audio;
    });

    await Promise.all([...sePromises, ...bgmPromises]);
    this.loaded = true;
  }

  /**
   * モバイルブラウザの音声再生制限を解除する。
   * ユーザー操作（タッチ/クリック）イベント内で呼ぶこと。
   */
  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;

    // AudioContext を resume して iOS の音声再生制限を解除
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume().then(() => ctx.close()).catch(() => {});
    } catch (_) {
      // AudioContext 非対応環境ではスキップ
    }
  }

  /**
   * Play a named sound effect.
   * @param {string} name - Sound identifier (e.g., 'se_hit_homerun')
   * @param {object} [options] - { volume?: number, loop?: boolean }
   * @returns {HTMLAudioElement|null}
   */
  play(name, options = {}) {
    if (!this.enabled || !this.sounds[name]) return null;

    // cloneNode で同時再生対応
    const clone = this.sounds[name].cloneNode();
    clone.volume = Math.min(1, (options.volume ?? 1) * this.volume);
    clone.loop = options.loop ?? false;

    // 再生中リストに追加、終了時に自動削除
    if (!this.playing[name]) this.playing[name] = [];
    this.playing[name].push(clone);

    clone.addEventListener('ended', () => {
      const arr = this.playing[name];
      if (arr) {
        const idx = arr.indexOf(clone);
        if (idx >= 0) arr.splice(idx, 1);
      }
    }, { once: true });

    clone.play().catch(() => {
      // 自動再生制限でブロックされた場合は無視
    });

    return clone;
  }

  // =============================================
  // BGM
  // =============================================

  /**
   * Play a BGM track with loop.
   * @param {string} name - BGM identifier (e.g., 'bgm_title')
   * @param {object} [options] - { maxLoops?: number } — 省略 or 0 で無限ループ
   */
  playBgm(name, options = {}) {
    if (!this.enabled || !this.bgm[name]) return;
    // 同じ BGM が再生中ならスキップ
    if (this.currentBgm === name) return;
    this.stopBgm();
    const audio = this.bgm[name];
    const maxLoops = options.maxLoops || 0; // 0 = 無限

    // ループカウント管理用リスナーをクリーンアップ
    if (this._bgmEndedHandler) {
      audio.removeEventListener('ended', this._bgmEndedHandler);
      this._bgmEndedHandler = null;
    }

    if (maxLoops > 0) {
      // N 回ループ後にフェードアウトして停止
      let loopCount = 0;
      audio.loop = false;
      this._bgmEndedHandler = () => {
        loopCount++;
        if (loopCount >= maxLoops) {
          // 最終ループ終了 → 停止
          audio.removeEventListener('ended', this._bgmEndedHandler);
          this._bgmEndedHandler = null;
          if (this.currentBgm === name) this.currentBgm = null;
        } else {
          // まだループ回数残り → 先頭から再生
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      };
      audio.addEventListener('ended', this._bgmEndedHandler);
    } else {
      audio.loop = true;
    }

    audio.volume = Math.min(1, this.bgmVolume * this.volume);
    audio.currentTime = 0;
    this.currentBgm = name;
    audio.play().catch(() => {
      // 自動再生ポリシーでブロックされた → 状態をリセットしてリトライ可能にする
      if (this.currentBgm === name) this.currentBgm = null;
    });
  }

  /**
   * Stop the currently playing BGM.
   * 全 BGM 要素を強制停止する（currentBgm 追跡漏れ対策）
   */
  stopBgm() {
    // リスナーをクリーンアップ
    if (this._bgmEndedHandler) {
      for (const audio of Object.values(this.bgm)) {
        audio.removeEventListener('ended', this._bgmEndedHandler);
      }
      this._bgmEndedHandler = null;
    }
    // 全 BGM 要素を停止
    for (const audio of Object.values(this.bgm)) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.currentBgm = null;
  }

  /**
   * Fade out the current BGM over the given duration.
   * @param {number} duration - Fade duration in ms (default: 500)
   */
  fadeOutBgm(duration = 500) {
    if (!this.currentBgm) return;
    const audio = this.bgm[this.currentBgm];
    if (!audio) return;
    const startVol = audio.volume;
    const step = 30; // ms per tick
    const decrement = startVol / (duration / step);
    const name = this.currentBgm;

    const timer = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - decrement);
      if (audio.volume <= 0) {
        clearInterval(timer);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = startVol;
        if (this.currentBgm === name) this.currentBgm = null;
      }
    }, step);
  }

  // =============================================
  // SE controls
  // =============================================

  /**
   * Stop all currently playing instances of a named sound.
   * @param {string} name - Sound identifier
   */
  stop(name) {
    const arr = this.playing[name];
    if (!arr) return;
    for (const audio of arr) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.playing[name] = [];
  }

  /**
   * Stop all sounds.
   */
  stopAll() {
    for (const name of Object.keys(this.playing)) {
      this.stop(name);
    }
    this.stopBgm();
  }

  /**
   * Set master volume.
   * @param {number} vol - Volume level (0.0 to 1.0)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Enable or disable all audio.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stopAll();
  }
}
