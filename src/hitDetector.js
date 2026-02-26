import {
  BAT_HITZONE_HEIGHT, BAT_HITZONE_WIDTH,
  SWEET_SPOT_RADIUS, MAX_DISTANCE,
  HR_DISTANCE_THRESHOLD, HIT_DISTANCE_THRESHOLD, FOUL_ANGLE_THRESHOLD,
  BAT_IMPACT_END_ANGLE, HIT_ZONE_CENTER_Y
} from './constants.js';

/**
 * Evaluate hit result given ball and batter state.
 * Called each frame during Impact phase.
 * Returns HitResult or null (no contact).
 */
export function evaluate(ball, batter) {
  const batZoneTop = HIT_ZONE_CENTER_Y - BAT_HITZONE_HEIGHT / 2;
  const batZoneBottom = HIT_ZONE_CENTER_Y + BAT_HITZONE_HEIGHT / 2;

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

  // Step 3: Distance from X gap
  let distance;
  if (xGap <= SWEET_SPOT_RADIUS) {
    const sweetSpotBonus = 1.0 - (xGap / SWEET_SPOT_RADIUS) * 0.1;
    distance = MAX_DISTANCE * sweetSpotBonus;
  } else {
    const falloffRange = (BAT_HITZONE_WIDTH / 2) - SWEET_SPOT_RADIUS;
    const falloffProgress = (xGap - SWEET_SPOT_RADIUS) / falloffRange;
    distance = MAX_DISTANCE * 0.9 * (1 - falloffProgress);
  }
  distance = Math.max(0, Math.round(distance));

  // Step 4: Direction angle from bat angle (physical consistency)
  // batAngle at horizontal (impact end) = BAT_IMPACT_END_ANGLE (-360° = -2π)
  // deviation > 0 → bat hasn't reached horizontal → pull (left, negative angle)
  // deviation = 0 → bat exactly horizontal → center (0°)
  // deviation < 0 → bat past horizontal → push (right, positive angle)
  const deviationRad = batter.batAngle - BAT_IMPACT_END_ANGLE;
  const deviationDeg = deviationRad * (180 / Math.PI);
  const directionAngle = Math.max(-45, Math.min(45, -deviationDeg * 0.6));

  let timing;
  if (Math.abs(deviationDeg) <= 5) {
    timing = 'just';
  } else if (deviationDeg > 0) {
    timing = 'early';
  } else {
    timing = 'late';
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
    judgment
  };
}
