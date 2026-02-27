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
export const HOME_PLATE_Y = 450;    // ホームベースのY座標 (レガシー、直接参照しない)

// --- Strike Zone (バッターデフォルト位置基準) ---
export const STRIKE_ZONE_CENTER_X = 240;  // = PITCHER_X (ストレート時)
export const STRIKE_ZONE_CENTER_Y = 480;  // = BATTER_Y(545) - BAT_CONTACT_Y_OFFSET(65)

// --- Batter ---
export const BATTER_X = 150;        // 初期X座標（左寄り、バッターボックス線を踏まない位置）
export const BATTER_Y = 545;        // 初期Y座標（バッターボックス中央やや下）
export const BATTER_MOVE_SPEED = 300; // px/sec
export const BATTER_MIN_X = 110;    // 左移動限界（内角対応）
export const BATTER_MAX_X = 190;    // 右移動限界（外角対応）
export const BATTER_MIN_Y = 520;    // 前進限界（前に出て打つ）
export const BATTER_MAX_Y = 590;

// --- Batter Sprite ---
export const BATTER_SPRITE_W = 360;   // リサイズ後の幅 (旧180, 2倍拡大)
export const BATTER_SPRITE_H = 238;   // リサイズ後の高さ (旧119, 2倍拡大)
export const BATTER_ANCHOR_X = 162;   // スプライト内キャラ中心X (旧81, 2倍)
export const BATTER_ANCHOR_Y = 200;   // スプライト内キャラ足元Y (旧100, 2倍)

// --- Bat Offset (Hit Detection) ---
export const BAT_TIP_OFFSET = 80;     // バット先端オフセット(px) (旧ハードコード40, 2倍)
export const BAT_CONTACT_Y_OFFSET = 65; // バットの打点Y = batter.y - この値 (打点をさらに下げる)

// --- Ball ---
export const BALL_SPEED = 350;        // px/sec (急カーブ pow2.5 に合わせて速度アップ)
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
export const BAT_HITZONE_WIDTH = 90;  // バット判定幅(px) (カジュアル向けに拡大)
export const BAT_HITZONE_HEIGHT = 70; // バット判定高さ(px) (タイミング許容を大幅拡大)
export const SWEET_SPOT_RADIUS = 20;  // 芯の半径(px) (HR出しやすく拡大)
export const SWEET_SPOT_INSET = 20;   // 芯中心をバット先端から+20px右に (遠心力: TIP側にパワーゾーン)
export const MAX_DISTANCE = 200;      // 最大飛距離(m) (パワー50%でもHR圏に届くよう拡大)
export const HR_DISTANCE_THRESHOLD = 100; // HR基準(m)
export const HIT_DISTANCE_THRESHOLD = 30; // HIT基準(m)
export const FOUL_ANGLE_THRESHOLD = 35;   // ファウル判定角度(°) |direction|≧これならファウル
export const DIRECTION_MAX_ANGLE = 45;     // 方向角最大値(°) 増幅カーブの最大出力

// --- Direction Mapping (Ball Y-Offset Based) ---
// Direction is determined by WHERE in the Y-zone the ball is hit:
//   ball above center → early swing → pull left
//   ball at center → just timing → center
//   ball below center → late swing → push right
export const DIRECTION_AMPLIFICATION_POWER = 0.7; // 増幅カーブ指数
export const DIRECTION_NORMALIZATION_RANGE = 40;   // 正規化範囲(px) このY距離で最大方向角 (40: late方向のフェアゾーン確保)
export const JUST_TIMING_THRESHOLD_PX = 10;        // "just"判定幅(px) 打点中心±この距離
export const DIRECTION_TIMING_OFFSET_PX = 0;       // タイミングオフセット(px) 0=just中心=バット打点Y(左右対称)

// --- Course Direction Bias ---
// 内角ほど左(引っ張り)、外角ほど右(流し打ち)にバイアス
export const COURSE_DIRECTION_FACTOR = 0.5;  // °/px: コース中心からの距離×この値が方向に加算

// --- Bat Contact Direction Bias (TIP/ROOT) ---
// バットの先端(TIP)に当てると右方向、根元(ROOT)だと左方向にバイアス
// 遠心力パワー × 打点位置 = 流し打ち/引っ張りの方向感
export const TIP_DIRECTION_FACTOR = 0.3;     // °/px: signedGap(+右=TIP, -左=ROOT) × この値が方向に加算

// --- Ball Flight (Post-Hit Trajectory) ---
export const BALL_FLIGHT_HR_DURATION = 2500;   // ms (ゆっくり飛んでいく演出)
export const BALL_FLIGHT_HIT_DURATION = 1650;  // ms (5フェーズ合計: 飛翔+バウンス3回+転がり)
export const BALL_FLIGHT_FOUL_DURATION = 800;  // ms

// --- Result Display ---
export const RESULT_DISPLAY_MS = 2000;

// --- Game Rules ---
export const TOTAL_PITCHES = 10;
export const HR_QUOTA = 3;

// --- Pitch Courses ---
export const COURSE_INSIDE_X = 220;   // 内角 (/ 方向, 20px左)
export const COURSE_MIDDLE_X = 240;   // 真ん中 (垂直)
export const COURSE_OUTSIDE_X = 260;  // 外角 (\ 方向, 20px右)

// --- Ball Shadow (Perspective Depth) ---
export const BALL_SHADOW_OFFSET_MIN = 10;  // 影オフセット最小(px) ボール遠方時
export const BALL_SHADOW_OFFSET_MAX = 45;  // 影オフセット最大(px) ボール手前時

// --- Timing Hint (Ball Glow) ---
export const TIMING_HINT_ENABLED = true;   // タイミングヒントON/OFF
export const TIMING_HINT_Y_RANGE = 60;     // ヒントゾーン縦幅(px) (打点Y から上方向)

// --- Ball Colors ---
export const COLOR_BALL = '#ffffff';
export const COLOR_BALL_OUTLINE = '#333333';

// --- Heartbeat Power Gauge ---
// サイン波の鼓動。BPM(速さ)とsharpness(ピーク鋭さ)で難易度制御。
// ステージ制で BPM↑ + sharpness↑ → 難しくなる。
export const HEARTBEAT_BPM = 72;             // 心拍数 (安静時)
export const HEARTBEAT_SHARPNESS = 1;        // ピーク鋭さ (1=正弦波, 2+=鋭い)
export const HEARTBEAT_MIN_POWER = 0.3;      // 谷のパワー倍率 (ピーク=1.0)

// --- Heartbeat Visual ---
export const HEARTBEAT_ICON_X = 90;          // ハートアイコンX (スコアボード中央)
export const HEARTBEAT_ICON_Y = 155;         // ハートアイコンY (スコアボード下)
export const HEARTBEAT_ICON_MIN_SIZE = 12;   // 最小ハートサイズ(px)
export const HEARTBEAT_ICON_MAX_SIZE = 28;   // 最大ハートサイズ(px)
export const HEARTBEAT_COLOR = '#E74C3C';    // ハートの色(赤)

// --- Scoreboard ---
export const SCOREBOARD_X = 10;
export const SCOREBOARD_Y = 10;
export const SCOREBOARD_WIDTH = 160;
export const SCOREBOARD_HEIGHT = 120;
export const SCOREBOARD_BG = '#D4B876';
export const SCOREBOARD_BORDER = '#8B6914';
