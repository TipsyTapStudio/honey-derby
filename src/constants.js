// ============================================
// HONEY-DERBY: 全定数
// ============================================

// --- Canvas ---
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

// --- Field ---
export const FIELD_DIRT_Y = 450; // 芝と砂の境界Y座標

// --- Pitcher ---
export const PITCHER_X = 240;
export const PITCHER_Y = 120;
export const PITCHER_MOUND_RADIUS = 30;

// --- Batter ---
export const BATTER_X = 240; // 初期X座標
export const BATTER_Y = 600;
export const BATTER_MOVE_SPEED = 300; // px/sec
export const BATTER_MIN_X = 100;
export const BATTER_MAX_X = 380;

// --- Ball ---
export const BALL_SPEED = 450; // px/sec
export const BALL_START_RADIUS = 4;
export const BALL_END_RADIUS = 14;

// --- Countdown ---
export const COUNTDOWN_STEP_MS = 1000; // 各カウントの表示時間(ms)

// --- Swing Phases ---
export const SWING_IMPACT_MS = 80;
export const SWING_FOLLOWTHROUGH_MS = 100;
export const SWING_RECOVERY_MS = 300;

// --- Bat ---
export const BAT_LENGTH = 50;
export const BAT_WIDTH = 4;
export const BAT_IDLE_ANGLE = -30 * (Math.PI / 180);      // -30°
export const BAT_IMPACT_END_ANGLE = 90 * (Math.PI / 180);  // +90°
export const BAT_FOLLOW_END_ANGLE = 120 * (Math.PI / 180); // +120°

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

// --- Colors ---
export const COLOR_GRASS = '#2d8a4e';
export const COLOR_DIRT = '#c4a060';
export const COLOR_MOUND = '#a08040';
export const COLOR_HOME_PLATE = '#e0e0e0';
export const COLOR_PITCHER_BODY = '#d4524d';
export const COLOR_PITCHER_HEAD = '#f5c6a0';
export const COLOR_BATTER_BODY = '#4a7ec4';
export const COLOR_BATTER_HEAD = '#f5c6a0';
export const COLOR_BAT = '#8B6914';
export const COLOR_BALL = '#ffffff';
export const COLOR_BALL_OUTLINE = '#333333';

// --- Scoreboard ---
export const SCOREBOARD_X = 10;
export const SCOREBOARD_Y = 10;
export const SCOREBOARD_WIDTH = 160;
export const SCOREBOARD_HEIGHT = 120;
export const SCOREBOARD_BG = '#D4B876';
export const SCOREBOARD_BORDER = '#8B6914';
