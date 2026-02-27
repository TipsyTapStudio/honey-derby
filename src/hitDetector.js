import {
  BAT_HITZONE_HEIGHT, BAT_HITZONE_WIDTH,
  SWEET_SPOT_RADIUS, SWEET_SPOT_INSET, MAX_DISTANCE,
  HR_DISTANCE_THRESHOLD, HIT_DISTANCE_THRESHOLD, FOUL_ANGLE_THRESHOLD,
  DIRECTION_MAX_ANGLE,
  DIRECTION_AMPLIFICATION_POWER, DIRECTION_NORMALIZATION_RANGE,
  JUST_TIMING_THRESHOLD_PX,
  DIRECTION_TIMING_OFFSET_PX,
  COURSE_DIRECTION_FACTOR,
  TIP_DIRECTION_FACTOR,
  STRIKE_ZONE_CENTER_X
} from './constants.js';

/**
 * Evaluate hit result given ball and batter state.
 * Called each frame during Impact phase.
 * Returns HitResult or null (no contact).
 */
export function evaluate(ball, batter, powerMultiplier = 1.0) {
  const batContactY = batter.getBatContactY();
  const batZoneTop = batContactY - BAT_HITZONE_HEIGHT / 2;
  const batZoneBottom = batContactY + BAT_HITZONE_HEIGHT / 2;

  // Step 1: Ball in Y zone?
  if (ball.y < batZoneTop || ball.y > batZoneBottom) {
    return null;
  }

  // Step 2: X gap (signed for root/tip detection)
  // getBatCenterX() returns fixed position (batter.x + BAT_TIP_OFFSET)
  const batCenterX = batter.getBatCenterX();
  const signedGap = ball.x - batCenterX;  // + = 先端の右側(tip), - = 根元側(root/詰まり)
  const xGap = Math.abs(signedGap);

  if (xGap > BAT_HITZONE_WIDTH / 2) {
    return null; // Whiff
  }

  // Step 3: Distance from X gap (asymmetric sweet spot)
  // Sweet spot center is at bat tip (SWEET_SPOT_INSET px from tip toward root).
  // Root side has steep penalty (詰まり = jammed).
  // Tip side has gentle penalty.
  const rawDist = signedGap - SWEET_SPOT_INSET;
  const sweetSpotDist = Math.abs(rawDist);
  const isRootSide = rawDist < 0;  // 芯の左側(根元方向) = 詰まり

  let distance;
  if (sweetSpotDist <= SWEET_SPOT_RADIUS) {
    // Within sweet spot zone — mild penalty scaling
    const penalty = isRootSide ? 0.6 : 0.2;
    const bonus = 1.0 - (sweetSpotDist / SWEET_SPOT_RADIUS) * penalty;
    distance = MAX_DISTANCE * bonus;
  } else {
    // Outside sweet spot — rapid falloff
    const edgeDist = sweetSpotDist - SWEET_SPOT_RADIUS;
    const maxOuter = (BAT_HITZONE_WIDTH / 2) - SWEET_SPOT_RADIUS;
    const falloff = Math.min(edgeDist / Math.max(1, maxOuter), 1);
    const edgeValue = MAX_DISTANCE * (1 - (isRootSide ? 0.6 : 0.2));
    distance = edgeValue * (1 - falloff);
  }
  distance = Math.max(0, Math.round(distance));

  // Step 3.5: Apply heartbeat power multiplier
  // パワー倍率を飛距離に掛ける（鼓動のピーク=1.0, 谷=MIN_POWER）
  distance = Math.max(0, Math.round(distance * powerMultiplier));

  // Step 4: Direction angle from ball Y-offset (where in the zone the ball was hit)
  // Ball Y-offset from bat contact center determines direction:
  //   ballY < batContactY → ball above center → player swung EARLY → pull left (-)
  //   ballY = batContactY → ball at center → JUST timing → center (0°)
  //   ballY > batContactY → ball below center → player swung LATE → push right (+)
  const ballOffsetY = ball.y - batContactY;
  // Timing offset: positive shifts "just" center downward (later swing = just)
  const adjustedOffset = ballOffsetY + DIRECTION_TIMING_OFFSET_PX;

  // Amplification curve: small offsets produce meaningful direction spread
  const sign = adjustedOffset >= 0 ? 1 : -1;
  const absOffset = Math.abs(adjustedOffset);
  const normalized = Math.min(absOffset / DIRECTION_NORMALIZATION_RANGE, 1.0);
  const amplified = Math.pow(normalized, DIRECTION_AMPLIFICATION_POWER) * DIRECTION_MAX_ANGLE;
  const timingDirection = sign * amplified;

  // Course direction bias: inside → pull left, outside → push right
  // Based on ball X distance from strike zone center (240)
  const courseBias = (ball.x - STRIKE_ZONE_CENTER_X) * COURSE_DIRECTION_FACTOR;

  // Bat contact direction bias: TIP → push right, ROOT → pull left
  // 遠心力: バットの先(TIP)で捉えると流し打ち、根元(ROOT)だと引っ張り
  const tipBias = signedGap * TIP_DIRECTION_FACTOR;

  const directionAngle = Math.max(-45, Math.min(45, timingDirection + courseBias + tipBias));

  // Timing labels:
  //   ball above center (negative offset) = early swing
  //   ball at center = just
  //   ball below center (positive offset) = late swing
  let timing;
  if (Math.abs(adjustedOffset) <= JUST_TIMING_THRESHOLD_PX) {
    timing = 'just';
  } else if (adjustedOffset > 0) {
    timing = 'late';
  } else {
    timing = 'early';
  }

  // Step 5: Classify result (foul check first — extreme angle always = foul)
  let judgment;
  if (Math.abs(directionAngle) >= FOUL_ANGLE_THRESHOLD) {
    judgment = 'FOUL';
  } else if (distance >= HR_DISTANCE_THRESHOLD) {
    judgment = 'HOME_RUN';
  } else if (distance >= HIT_DISTANCE_THRESHOLD) {
    judgment = 'HIT';
  } else {
    judgment = 'STRIKE';
  }

  return {
    hit: true,
    timing,
    xGap: Math.round(xGap),
    direction: Math.round(directionAngle),
    distance,
    judgment,
    _debug: {
      sweetSpotDist: Math.round(sweetSpotDist),
      isRootSide,
      courseBias: Math.round(courseBias),
      tipBias: Math.round(tipBias),
      ballOffsetY: Math.round(ballOffsetY),
      adjustedOffset: Math.round(adjustedOffset),
      batAngleDeg: Math.round(batter.batAngle * (180 / Math.PI) * 10) / 10,
    }
  };
}
