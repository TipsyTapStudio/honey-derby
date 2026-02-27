// ============================================
// HONEY-DERBY: 打撃シミュレーション
// ============================================
//
// 使い方:
//   node sim/simulate.js                        # デフォルト: 3コース全部のタイミングスイープ
//   node sim/simulate.js --course=middle         # 真ん中コースのみ
//   node sim/simulate.js --mode=position         # バッターX位置スイープ
//   node sim/simulate.js --mode=single --course=middle --bally=480
//   node sim/simulate.js --help
//
// evaluate() を直接呼び出すことで、プレビュー不要で打撃判定を検証。
// ball.y を変えること = スイングタイミングの早い/遅いを表現。

import { evaluate } from '../src/hitDetector.js';
import {
  PITCHER_X, PITCHER_Y, BALL_SPEED,
  STRIKE_ZONE_CENTER_X, STRIKE_ZONE_CENTER_Y,
  COURSE_INSIDE_X, COURSE_MIDDLE_X, COURSE_OUTSIDE_X,
  BAT_TIP_OFFSET, BAT_CONTACT_Y_OFFSET,
  BAT_HITZONE_HEIGHT, BAT_HITZONE_WIDTH,
  BATTER_X, BATTER_Y,
  BATTER_MIN_X, BATTER_MAX_X,
  BAT_IMPACT_END_ANGLE,
  SWEET_SPOT_INSET,
} from '../src/constants.js';

// ============================================
// ANSI カラー
// ============================================
let useColor = true;

const C = {
  HR:      '\x1b[1;33m',  // bold yellow
  HIT:     '\x1b[32m',    // green
  FOUL:    '\x1b[36m',    // cyan
  STRIKE:  '\x1b[31m',    // red
  MISS:    '\x1b[2m',     // dim
  RESET:   '\x1b[0m',
  BOLD:    '\x1b[1m',
  DIM:     '\x1b[2m',
  HEADER:  '\x1b[1;37m',  // bold white
  JUST:    '\x1b[1;35m',  // bold magenta (just timing marker)
};

function c(code, text) {
  return useColor ? `${code}${text}${C.RESET}` : text;
}

function colorJudgment(judgment) {
  const map = { HOME_RUN: C.HR, HIT: C.HIT, FOUL: C.FOUL, STRIKE: C.STRIKE };
  const padded = judgment.padEnd(8);
  return c(map[judgment] || C.MISS, padded);
}

// ============================================
// コース定義
// ============================================
const COURSES = {
  inside:  { name: '内角', x: COURSE_INSIDE_X,  label: `内角(${COURSE_INSIDE_X})` },
  middle:  { name: '真ん中', x: COURSE_MIDDLE_X, label: `真ん中(${COURSE_MIDDLE_X})` },
  outside: { name: '外角', x: COURSE_OUTSIDE_X,  label: `外角(${COURSE_OUTSIDE_X})` },
};

// ============================================
// コア: シミュレーション関数
// ============================================

/**
 * 1シナリオの打撃をシミュレーション。
 * evaluate() を直接呼び出す（フレームシミュレーション不要）。
 *
 * @param {number} courseX  ボールのX座標(=コース値)
 * @param {number} ballY   ボールのY座標(=スイングタイミング)
 * @param {number} batterX バッターX位置
 * @param {number} batterY バッターY位置
 * @returns {object} 判定結果 or null(空振り)
 */
function simulateHit(courseX, ballY, batterX, batterY) {
  const ball = { x: courseX, y: ballY };
  const batter = {
    x: batterX,
    y: batterY,
    batAngle: BAT_IMPACT_END_ANGLE, // _debug出力用のみ
    getBatCenterX() { return this.x + BAT_TIP_OFFSET; },
    getBatContactY() { return this.y - BAT_CONTACT_Y_OFFSET; },
  };
  return evaluate(ball, batter);
}

/**
 * batContactY を計算
 */
function getBatContactY(batterY) {
  return batterY - BAT_CONTACT_Y_OFFSET;
}

// ============================================
// Mode 1: タイミングスイープ (ballY を変えて判定分布を見る)
// ============================================

function runTimingMode(options) {
  const courseKeys = options.course === 'all'
    ? ['inside', 'middle', 'outside']
    : [options.course];

  const batterX = options.bx;
  const batterY = options.by;
  const batContactY = getBatContactY(batterY);
  const step = options.step || 5;

  // ballY の範囲: batContactY ± BAT_HITZONE_HEIGHT/2 + マージン
  const margin = 10;
  const yMin = batContactY - BAT_HITZONE_HEIGHT / 2 - margin;
  const yMax = batContactY + BAT_HITZONE_HEIGHT / 2 + margin;

  for (const courseKey of courseKeys) {
    const course = COURSES[courseKey];
    const batCenterX = batterX + BAT_TIP_OFFSET;
    const sweetCenterX = batCenterX + SWEET_SPOT_INSET;

    console.log('');
    console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));
    console.log(c(C.BOLD, ` コース: ${course.label}  |  バッター: x=${batterX}, y=${batterY}`));
    console.log(c(C.DIM, ` batContactY=${batContactY}  batCenterX=${batCenterX}  sweetCenterX=${sweetCenterX}`));
    console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));
    console.log(c(C.HEADER, ` ballY | judgment | dist  | dir   | timing | sweet | side   | xGap`));
    console.log(c(C.DIM,    ` ------+----------+-------+-------+--------+-------+--------+-----`));

    const counts = { HOME_RUN: 0, HIT: 0, FOUL: 0, STRIKE: 0 };

    for (let ballY = yMin; ballY <= yMax; ballY += step) {
      const result = simulateHit(course.x, ballY, batterX, batterY);
      const isJust = Math.round(ballY) === Math.round(batContactY);

      if (result) {
        counts[result.judgment]++;
        const marker = isJust ? c(C.JUST, ' ◀ just') : '';
        const side = result._debug ? (result._debug.isRootSide ? 'root' : 'tip ') : ' -  ';
        const sweet = result._debug ? String(result._debug.sweetSpotDist).padStart(3) : '  -';
        console.log(
          `  ${String(Math.round(ballY)).padStart(4)} | ` +
          `${colorJudgment(result.judgment)} | ` +
          `${String(result.distance).padStart(4)}m | ` +
          `${(result.direction >= 0 ? '+' : '') + String(result.direction) + '°'}`.padStart(6) + ` | ` +
          `${result.timing.padEnd(6)} | ` +
          `${sweet} | ` +
          `${side}  | ` +
          `${String(result.xGap).padStart(3)}` +
          marker
        );
      } else {
        counts.STRIKE++;
        const marker = isJust ? c(C.JUST, ' ◀ just') : '';
        console.log(
          `  ${String(Math.round(ballY)).padStart(4)} | ` +
          `${c(C.MISS, 'MISS    ')} | ` +
          `   - | ` +
          `    - | ` +
          `-      | ` +
          `  - | ` +
          `-     | ` +
          `  -` +
          marker
        );
      }
    }

    // サマリー
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const hrRate = ((counts.HOME_RUN / total) * 100).toFixed(1);
    const hitRate = (((counts.HOME_RUN + counts.HIT) / total) * 100).toFixed(1);
    console.log(c(C.DIM, ` ------+----------+-------+-------+--------+-------+--------+-----`));
    console.log(c(C.BOLD, ` 合計: `) +
      c(C.HR, `HR:${counts.HOME_RUN}`) + ` | ` +
      c(C.HIT, `HIT:${counts.HIT}`) + ` | ` +
      c(C.FOUL, `FOUL:${counts.FOUL}`) + ` | ` +
      c(C.STRIKE, `STRIKE/MISS:${counts.STRIKE}`) +
      `  (全${total}パターン)`
    );
    console.log(
      c(C.BOLD, ` HR率: `) + c(C.HR, `${hrRate}%`) +
      `  |  ` +
      c(C.BOLD, `安打率: `) + c(C.HIT, `${hitRate}%`) +
      `  ← ${course.label} の難易度指標`
    );
  }

  // 3コース比較サマリー
  if (courseKeys.length > 1) {
    console.log('');
    console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));
    console.log(c(C.BOLD, ` 難易度比較サマリー (バッター: x=${batterX}, y=${batterY}, step=${step}px)`));
    console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));
    console.log(c(C.HEADER, `          | HR  | HIT | FOUL| K/M | HR率   | 安打率  | 難易度`));
    console.log(c(C.DIM,    ` ---------+-----+-----+-----+-----+--------+---------+-------`));

    for (const courseKey of courseKeys) {
      const course = COURSES[courseKey];
      const counts = { HOME_RUN: 0, HIT: 0, FOUL: 0, STRIKE: 0 };
      for (let ballY = yMin; ballY <= yMax; ballY += step) {
        const result = simulateHit(course.x, ballY, batterX, batterY);
        if (result) counts[result.judgment]++;
        else counts.STRIKE++;
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const hrRate = ((counts.HOME_RUN / total) * 100).toFixed(1);
      const hitRate = (((counts.HOME_RUN + counts.HIT) / total) * 100).toFixed(1);
      const difficulty = counts.HOME_RUN >= 5 ? '★☆☆ 易' :
                         counts.HOME_RUN >= 3 ? '★★☆ 中' : '★★★ 難';
      console.log(
        ` ${course.label.padEnd(9)}| ` +
        `${String(counts.HOME_RUN).padStart(3)} | ` +
        `${String(counts.HIT).padStart(3)} | ` +
        `${String(counts.FOUL).padStart(3)} | ` +
        `${String(counts.STRIKE).padStart(3)} | ` +
        `${hrRate.padStart(5)}% | ` +
        `${hitRate.padStart(6)}% | ` +
        `${difficulty}`
      );
    }
  }
}

// ============================================
// Mode 2: バッター位置スイープ
// ============================================

function runPositionMode(options) {
  const batterY = options.by;
  const batContactY = getBatContactY(batterY);
  const step = options.step || 10;

  // ballY = batContactY (ジャストタイミング)
  const ballY = batContactY;

  console.log('');
  console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));
  console.log(c(C.BOLD, ` Mode: バッターX位置スイープ  |  ballY=${ballY}(just)  batterY=${batterY}`));
  console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));
  console.log(c(C.HEADER, ` BatterX | batCX | 内角(${COURSE_INSIDE_X})           | 真ん中(${COURSE_MIDDLE_X})          | 外角(${COURSE_OUTSIDE_X})`));
  console.log(c(C.DIM,    ` --------+-------+------------------------+-----------------------+------------------------`));

  for (let bx = BATTER_MIN_X; bx <= BATTER_MAX_X; bx += step) {
    const batCenterX = bx + BAT_TIP_OFFSET;
    let row = `  ${String(bx).padStart(4)}   |  ${String(batCenterX).padStart(3)}  |`;

    for (const courseKey of ['inside', 'middle', 'outside']) {
      const course = COURSES[courseKey];
      const result = simulateHit(course.x, ballY, bx, batterY);

      if (result) {
        const dir = (result.direction >= 0 ? '+' : '') + result.direction + '°';
        row += ` ${colorJudgment(result.judgment)} ${String(result.distance).padStart(3)}m ${dir.padStart(5)} |`;
      } else {
        row += ` ${c(C.MISS, 'MISS')}                   |`;
      }
    }

    const isDefault = bx === BATTER_X;
    if (isDefault) row += c(C.JUST, ' ◀ default');
    console.log(row);
  }

  // バッター位置ごとの難易度サマリー
  console.log('');
  console.log(c(C.BOLD, ` バッター位置別 HR数 (ballY=${ballY} ジャストタイミング):`));
  for (let bx = BATTER_MIN_X; bx <= BATTER_MAX_X; bx += step) {
    let hrCount = 0;
    for (const courseKey of ['inside', 'middle', 'outside']) {
      const result = simulateHit(COURSES[courseKey].x, ballY, bx, batterY);
      if (result && result.judgment === 'HOME_RUN') hrCount++;
    }
    const bar = '█'.repeat(hrCount) + '░'.repeat(3 - hrCount);
    const isDefault = bx === BATTER_X;
    console.log(`  x=${String(bx).padStart(3)}: ${c(C.HR, bar)} ${hrCount}/3 HR${isDefault ? c(C.JUST, ' ◀ default') : ''}`);
  }
}

// ============================================
// Mode 3: 単一シナリオ詳細
// ============================================

function runSingleMode(options) {
  const course = COURSES[options.course] || COURSES.middle;
  const batterX = options.bx;
  const batterY = options.by;
  const batContactY = getBatContactY(batterY);
  const ballY = options.bally != null ? options.bally : batContactY;

  console.log('');
  console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));
  console.log(c(C.BOLD, ` Mode: 単一シナリオ詳細`));
  console.log(c(C.BOLD, `═══════════════════════════════════════════════════════════════════════`));

  console.log(c(C.HEADER, ` 入力:`));
  console.log(`   コース:    ${course.label} (x=${course.x})`);
  console.log(`   バッター:  x=${batterX}, y=${batterY}`);
  console.log(`   batCenterX:  ${batterX + BAT_TIP_OFFSET}`);
  console.log(`   batContactY: ${batContactY}`);
  console.log(`   ballY:       ${ballY}`);
  console.log(`   ballY - batContactY: ${ballY - batContactY} (+ = late, - = early)`);

  const result = simulateHit(course.x, ballY, batterX, batterY);

  console.log('');
  if (result) {
    console.log(c(C.HEADER, ` 結果:`));
    console.log(`   judgment:  ${colorJudgment(result.judgment)}`);
    console.log(`   timing:    ${result.timing}`);
    console.log(`   distance:  ${result.distance}m`);
    console.log(`   direction: ${result.direction}°`);
    console.log(`   xGap:      ${result.xGap}px`);

    if (result._debug) {
      console.log('');
      console.log(c(C.HEADER, ` デバッグ:`));
      console.log(`   sweetSpotDist:  ${result._debug.sweetSpotDist}px`);
      console.log(`   isRootSide:     ${result._debug.isRootSide} (${result._debug.isRootSide ? '詰まり' : 'バット先端'})`);
      console.log(`   courseBias:     ${result._debug.courseBias}°`);
      console.log(`   ballOffsetY:    ${result._debug.ballOffsetY}px`);
      console.log(`   adjustedOffset: ${result._debug.adjustedOffset}px`);
      console.log(`   batAngleDeg:    ${result._debug.batAngleDeg}°`);
    }
  } else {
    console.log(`   結果: ${c(C.MISS, 'MISS (空振り — ボールがヒットゾーン外)')}`);
    console.log(`   Y範囲: ${batContactY - BAT_HITZONE_HEIGHT / 2} ~ ${batContactY + BAT_HITZONE_HEIGHT / 2}`);
    console.log(`   X範囲: ${batterX + BAT_TIP_OFFSET - BAT_HITZONE_WIDTH / 2} ~ ${batterX + BAT_TIP_OFFSET + BAT_HITZONE_WIDTH / 2}`);
  }
}

// ============================================
// 引数パーサー
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    mode: 'timing',
    course: 'all',
    bx: BATTER_X,
    by: BATTER_Y,
    bally: null,
    step: null,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--no-color') {
      useColor = false;
    } else if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      if (key === 'mode') opts.mode = val;
      else if (key === 'course') opts.course = val;
      else if (key === 'bx') opts.bx = Number(val);
      else if (key === 'by') opts.by = Number(val);
      else if (key === 'bally') opts.bally = Number(val);
      else if (key === 'step') opts.step = Number(val);
    }
  }

  return opts;
}

// ============================================
// ヘルプ
// ============================================

function printHelp() {
  console.log(`
${c(C.BOLD, 'HONEY-DERBY 打撃シミュレーション')}

${c(C.HEADER, '使い方:')}
  node sim/simulate.js [options]

${c(C.HEADER, 'モード:')}
  --mode=timing     (デフォルト) ballYスイープ → タイミング別の判定分布
  --mode=position   バッターX位置スイープ → ポジション別の判定
  --mode=single     1シナリオの詳細出力

${c(C.HEADER, 'オプション:')}
  --course=COURSE   コース指定: inside, middle, outside, all (デフォルト: all)
  --bx=NUMBER       バッターX位置 (デフォルト: ${BATTER_X}, 範囲: ${BATTER_MIN_X}-${BATTER_MAX_X})
  --by=NUMBER       バッターY位置 (デフォルト: ${BATTER_Y})
  --bally=NUMBER    ボールY位置 (singleモード用)
  --step=NUMBER     スイープ刻み幅 (デフォルト: timing=5, position=10)
  --no-color        カラー出力を無効化
  --help            このヘルプを表示

${c(C.HEADER, '使用例:')}
  node sim/simulate.js                              # 3コース全部のタイミング分布
  node sim/simulate.js --course=middle              # 真ん中コースのみ
  node sim/simulate.js --course=middle --step=2     # 2px刻みで細かく
  node sim/simulate.js --mode=position              # バッター位置別の判定
  node sim/simulate.js --mode=single --course=inside --bally=475
  node sim/simulate.js --bx=130                     # バッター位置をずらして確認

${c(C.HEADER, '概念:')}
  ballY はスイングタイミングを表す:
    ballY < batContactY → ボールが高い位置 = 早振り (early)
    ballY = batContactY → ジャストミート (just)
    ballY > batContactY → ボールが低い位置 = 振り遅れ (late)

  HR面積(HR率) = そのコースの打ちやすさ = 難易度指標
`);
}

// ============================================
// メイン
// ============================================

function main() {
  const opts = parseArgs();

  if (opts.help) {
    printHelp();
    return;
  }

  // コース名のバリデーション
  if (opts.course !== 'all' && !COURSES[opts.course]) {
    console.error(`不明なコース: ${opts.course} (inside, middle, outside, all のいずれかを指定)`);
    process.exit(1);
  }

  switch (opts.mode) {
    case 'timing':
      runTimingMode(opts);
      break;
    case 'position':
      runPositionMode(opts);
      break;
    case 'single':
      runSingleMode(opts);
      break;
    default:
      console.error(`不明なモード: ${opts.mode} (timing, position, single のいずれかを指定)`);
      process.exit(1);
  }

  console.log('');
}

main();
