import {
  BAT_HITZONE_HEIGHT, BAT_HITZONE_WIDTH,
  SWEET_SPOT_RADIUS, SWEET_SPOT_INSET, MAX_DISTANCE,
  HR_DISTANCE_THRESHOLD, HIT_DISTANCE_THRESHOLD, FOUL_ANGLE_THRESHOLD,
  BAT_IMPACT_END_ANGLE,
  DIRECTION_AMPLIFICATION_POWER, DIRECTION_NORMALIZATION_RANGE,
  JUST_TIMING_THRESHOLD_DEG,
  DIRECTION_TIMING_OFFSET_DEG
} from './constants.js';

/**
 * Evaluate hit result given ball and batter state.
 * Called each frame during Impact phase.
 * Returns HitResult or null (no contact).
 */
export function evaluate(ball, batter) {
  const batContactY = batter.getBatContactY();
  const batZoneTop = batContactY - BAT_HITZONE_HEIGHT / 2;
  const batZoneBottom = batContactY + BAT_HITZONE_HEIGHT / 2;

  // Step 1: Ball in Y zone?
  if (ball.y < batZoneTop || ball.y > batZoneBottom) {
    return null;
  }

  // Step 2: X gap
  const batCenterX = batter.getBatCenterX();
  const xGap = Math.abs(ball.x - batCenterX);

  if (xGap > BAT_HITZONE_WIDTH / 2) {
    return null; // Whiff
  }

  // Step 3: Distance from X gap (asymmetric sweet spot)
  // xGap=0 is bat tip. Sweet spot center is SWEET_SPOT_INSET px from tip (toward root).
  // Root side (rawDist > 0) has steep penalty (詰まり = jammed).
  // Tip side (rawDist < 0) has gentle penalty.
  const rawDist = xGap - SWEET_SPOT_INSET;
  const sweetSpotDist = Math.abs(rawDist);
  const isRootSide = rawDist > 0;

  let distance;
  if (sweetSpotDist <= SWEET_SPOT_RADIUS) {
    // Within sweet spot zone — mild penalty scaling
    const penalty = isRootSide ? 0.6 : 0.2;
    const bonus = 1.0 - (sweetSpotDist / SWEET_SPOT_RADIUS) * penalty;
    distance = MAX_DISTANCE * bonus;
  } else {
    // Outside sweet spot — rapid falloff
    const edgeDist = sweetSpotDist - SWEET_SPOT_RADIUS;
    const maxOuter = (BAT_HITZONE_WIDTH / 2) - SWEET_SPOT_INSET - SWEET_SPOT_RADIUS;
    const falloff = Math.min(edgeDist / Math.max(1, maxOuter), 1);
    const edgeValue = MAX_DISTANCE * (1 - (isRootSide ? 0.6 : 0.2));
    distance = edgeValue * (1 - falloff);
  }
  distance = Math.max(0, Math.round(distance));

  // Step 4: Direction angle from bat angle (sqrt amplification curve)
  // batAngle at horizontal (impact end) = BAT_IMPACT_END_ANGLE (-360° = -2π)
  // deviation > 0 → bat hasn't reached horizontal → player swung LATE → push right (+)
  // deviation = 0 → bat exactly horizontal → just → center (0°)
  // deviation < 0 → bat past horizontal → player swung EARLY → pull left (-)
  const deviationRad = batter.batAngle - BAT_IMPACT_END_ANGLE;
  // Timing offset: positive shifts "just" window later (allows later swing for center/left)
  const deviationDeg = deviationRad * (180 / Math.PI) + DIRECTION_TIMING_OFFSET_DEG;

  // Sqrt amplification: small deviations produce meaningful direction spread
  // Sign: player-perspective (early press → bat past horizontal → pull LEFT)
  const sign = deviationDeg >= 0 ? 1 : -1;
  const absDev = Math.abs(deviationDeg);
  const normalized = Math.min(absDev / DIRECTION_NORMALIZATION_RANGE, 1.0);
  const amplified = Math.pow(normalized, DIRECTION_AMPLIFICATION_POWER) * FOUL_ANGLE_THRESHOLD;
  const directionAngle = Math.max(-45, Math.min(45, sign * amplified));

  // Timing labels from the player's perspective:
  // deviation > 0 (bat early in arc) = player pressed Space LATE
  // deviation < 0 (bat past horizontal) = player pressed Space EARLY
  let timing;
  if (Math.abs(deviationDeg) <= JUST_TIMING_THRESHOLD_DEG) {
    timing = 'just';
  } else if (deviationDeg > 0) {
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
      deviationDeg: Math.round(deviationDeg * 10) / 10,
      batAngleDeg: Math.round(batter.batAngle * (180 / Math.PI) * 10) / 10,
    }
  };
}
