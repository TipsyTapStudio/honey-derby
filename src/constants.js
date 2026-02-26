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

// --- Home Plate ---
export const HOME_PLATE_Y = 510;    // ホームベースのY座標 (打点を前方に移動)

// --- Batter ---
export const BATTER_X = 160;        // 初期X座標（バット水平時にball.x=240と一致）
export const BATTER_Y = 545;        // 初期Y座標（バッターボックス中央やや下）
export const BATTER_MOVE_SPEED = 300; // px/sec
export const BATTER_MIN_X = 140;
export const BATTER_MAX_X = 178;
export const BATTER_MIN_Y = 525;
export const BATTER_MAX_Y = 575;

// --- Batter Sprite ---
export const BATTER_SPRITE_W = 360;   // リサイズ後の幅 (旧180, 2倍拡大)
export const BATTER_SPRITE_H = 238;   // リサイズ後の高さ (旧119, 2倍拡大)
export const BATTER_ANCHOR_X = 162;   // スプライト内キャラ中心X (旧81, 2倍)
export const BATTER_ANCHOR_Y = 200;   // スプライト内キャラ足元Y (旧100, 2倍)

// --- Bat Offset (Hit Detection) ---
export const BAT_TIP_OFFSET = 80;     // バット先端オフセット(px) (旧ハードコード40, 2倍)

// --- Ball ---
export const BALL_SPEED = 250;        // px/sec (少し遅くして反応しやすく)
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
export const BAT_HITZONE_WIDTH = 80;  // バット判定幅(px) (コンタクト範囲を広げる)
export const BAT_HITZONE_HEIGHT = 55; // バット判定高さ(px) (タイミング許容幅を広げる)
export const SWEET_SPOT_RADIUS = 14;  // 芯の半径(px) (HRを出しやすく)
export const MAX_DISTANCE = 160;      // 最大飛距離(m)
export const HR_DISTANCE_THRESHOLD = 100; // HR基準(m)
export const HIT_DISTANCE_THRESHOLD = 30; // HIT基準(m)
export const FOUL_ANGLE_THRESHOLD = 20;   // ファール角度基準(°) (バット角度ベースに合わせて調整)

// --- Ball Flight (Post-Hit Trajectory) ---
export const BALL_FLIGHT_HR_DURATION = 1200;   // ms
export const BALL_FLIGHT_HIT_DURATION = 1000;  // ms
export const BALL_FLIGHT_FOUL_DURATION = 800;  // ms

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
