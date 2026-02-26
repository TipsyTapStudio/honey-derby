// ============================================
// HONEY-DERBY: 全定数
// ============================================

// --- Canvas ---
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

// --- Moai (Pitching Machine) ---
export const MOAI_X = 240;          // モアイ中心X
export const MOAI_Y = 175;          // モアイスプライト上端Y (※Preview で微調整)

// --- Pitcher (Ball Origin = Moai's Mouth) ---
export const PITCHER_X = 240;
export const PITCHER_Y = 285;       // モアイの口のY座標 (※Preview で微調整)

// --- Batter ---
export const BATTER_X = 200;        // 初期X座標（左バッターボックス中央）
export const BATTER_Y = 600;
export const BATTER_MOVE_SPEED = 300; // px/sec
export const BATTER_MIN_X = 180;
export const BATTER_MAX_X = 218;
export const BATTER_MIN_Y = 580;
export const BATTER_MAX_Y = 635;

// --- Batter Sprite ---
export const BATTER_SPRITE_W = 180;   // リサイズ後の幅
export const BATTER_SPRITE_H = 119;   // リサイズ後の高さ
export const BATTER_ANCHOR_X = 81;    // スプライト内キャラ中心X (※Preview で微調整)
export const BATTER_ANCHOR_Y = 100;   // スプライト内キャラ足元Y (※Preview で微調整)

// --- Ball ---
export const BALL_SPEED = 340;        // px/sec (旧450, 飛距離短縮に合わせて調整)
export const BALL_START_RADIUS = 4;
export const BALL_END_RADIUS = 14;

// --- Countdown ---
export const COUNTDOWN_STEP_MS = 1000; // 各カウントの表示時間(ms)

// --- Swing Phases ---
export const SWING_IMPACT_MS = 120;
export const SWING_FOLLOWTHROUGH_MS = 100;
export const SWING_RECOVERY_MS = 280;

// --- Bat (Hit Detection) ---
export const BAT_IDLE_ANGLE = -120 * (Math.PI / 180);      // -120° (11時方向)
export const BAT_IMPACT_END_ANGLE = -360 * (Math.PI / 180); // -360° (3時 = ミートポイント)
export const BAT_FOLLOW_END_ANGLE = -480 * (Math.PI / 180); // -480° (11時 = 振り抜き終点)

// --- Hit Detection ---
export const BAT_HITZONE_WIDTH = 60;  // バット判定幅(px)
export const BAT_HITZONE_HEIGHT = 40; // バット判定高さ(px)
export const SWEET_SPOT_RADIUS = 8;   // 芯の半径(px)
export const MAX_DISTANCE = 160;      // 最大飛距離(m)
export const HR_DISTANCE_THRESHOLD = 100; // HR基準(m)
export const HIT_DISTANCE_THRESHOLD = 30; // HIT基準(m)
export const FOUL_ANGLE_THRESHOLD = 35;   // ファール角度基準(°)

// --- Result Display ---
export const RESULT_DISPLAY_MS = 2000;

// --- Game Rules ---
export const TOTAL_PITCHES = 10;
export const HR_QUOTA = 3;

// --- Ball Colors ---
export const COLOR_BALL = '#ffffff';
export const COLOR_BALL_OUTLINE = '#333333';

// --- Scoreboard ---
export const SCOREBOARD_X = 10;
export const SCOREBOARD_Y = 10;
export const SCOREBOARD_WIDTH = 160;
export const SCOREBOARD_HEIGHT = 120;
export const SCOREBOARD_BG = '#D4B876';
export const SCOREBOARD_BORDER = '#8B6914';
