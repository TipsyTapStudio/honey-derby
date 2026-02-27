import {
  HEARTBEAT_BPM, HEARTBEAT_SHARPNESS, HEARTBEAT_MIN_POWER,
  HEARTBEAT_ICON_MIN_SIZE, HEARTBEAT_ICON_MAX_SIZE
} from './constants.js';

/**
 * 鼓動パワーシステム
 *
 * サイン波が常に振動し、スイング時のビート位相でパワー倍率が決まる。
 * BPM(心拍数)とsharpness(ピーク鋭さ)の2軸で難易度を制御。
 *
 * パワー倍率: MIN_POWER(谷) 〜 1.0(ピーク)
 * 最終飛距離 = 芯の距離(X) × パワー倍率(beat)
 */
export class HeartBeat {
  constructor() {
    this.bpm = HEARTBEAT_BPM;
    this.sharpness = HEARTBEAT_SHARPNESS;
    this.elapsed = 0; // ms
  }

  update(dt) {
    this.elapsed += dt * 1000;
  }

  /**
   * 生のパワー値 0.0〜1.0
   * sin波を [0,1] に正規化し、sharpness で指数変換。
   * sharpness=1: 通常のサイン波（ピーク幅広い）
   * sharpness=2+: ピークが鋭くなる（HR圏が狭い）
   */
  getPower() {
    const period = 60000 / this.bpm; // ms per beat
    const phase = (this.elapsed % period) / period; // 0.0 〜 1.0
    const sine = Math.sin(phase * Math.PI * 2);
    const normalized = (sine + 1) / 2; // 0.0 〜 1.0
    return Math.pow(normalized, this.sharpness);
  }

  /**
   * 最終パワー倍率: HEARTBEAT_MIN_POWER 〜 1.0
   * getPower()=0 → MIN_POWER (谷)
   * getPower()=1 → 1.0 (ピーク)
   */
  getMultiplier() {
    const power = this.getPower();
    return HEARTBEAT_MIN_POWER + power * (1 - HEARTBEAT_MIN_POWER);
  }

  /**
   * ハートアイコンのサイズ (描画用)
   * パワーに応じて MIN_SIZE 〜 MAX_SIZE
   */
  getIconSize() {
    const power = this.getPower();
    return HEARTBEAT_ICON_MIN_SIZE + power * (HEARTBEAT_ICON_MAX_SIZE - HEARTBEAT_ICON_MIN_SIZE);
  }

  reset() {
    this.elapsed = 0;
  }
}
