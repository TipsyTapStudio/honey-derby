/**
 * AudioManager - Sound effect system for HONEY-DERBY.
 *
 * Milestone 3: Skeleton only (no-op methods).
 * Actual audio loading and playback will be implemented in a future milestone.
 *
 * Sound manifest (16 effects):
 *   se_game_start      - ゲーム開始（ホイッスル/チャイム）
 *   se_countdown_tick   - カウントダウン 3, 2, 1（短いビープ）
 *   se_countdown_go     - カウント完了（高めのビープ）
 *   se_pitch            - 投球（風切り音）
 *   se_swing_miss       - 空振り（ブンッ）
 *   se_hit_homerun      - 打撃：HR（カキーン）
 *   se_hit_normal       - 打撃：HIT（中打撃音）
 *   se_hit_foul         - 打撃：FOUL（カッ）
 *   se_hit_weak         - 打撃：弱STRIKE（ボテッ）
 *   se_strike           - 見逃しSTRIKE（ミットの音）
 *   se_flight_hr        - HR飛球中（歓声＋ヒュー）
 *   se_crowd_cheer      - 歓声：HR（大歓声）
 *   se_crowd_hit        - 歓声：HIT（拍手）
 *   se_crowd_groan      - 反応：STRIKE（残念なため息）
 *   se_stage_clear      - ステージクリア（ファンファーレ）
 *   se_game_over        - ゲームオーバー（短い失敗ジングル）
 */
export class AudioManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.7;
    this.loaded = false;
  }

  /**
   * Preload all sound effects.
   * @param {Function} onProgress - callback(loaded, total)
   * @returns {Promise<void>}
   */
  async loadAll(onProgress) {
    // TODO: Implement in next milestone
    // Load from assets/audio/ directory
    this.loaded = true;
    return Promise.resolve();
  }

  /**
   * Play a named sound effect.
   * @param {string} name - Sound identifier (e.g., 'se_hit_homerun')
   * @param {object} [options] - { volume?: number, loop?: boolean }
   */
  play(name, options = {}) {
    // TODO: Implement in next milestone
    // Use HTMLAudioElement + cloneNode() for simultaneous playback
  }

  /**
   * Stop a currently playing sound.
   * @param {string} name - Sound identifier
   */
  stop(name) {
    // TODO: Implement in next milestone
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
  }
}
