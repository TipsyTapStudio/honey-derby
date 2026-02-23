import {
  BATTER_Y, BAT_HITZONE_HEIGHT, BAT_HITZONE_WIDTH,
  SWEET_SPOT_RADIUS, MAX_DISTANCE,
  HR_DISTANCE_THRESHOLD, HIT_DISTANCE_THRESHOLD, FOUL_ANGLE_THRESHOLD
} from './constants.js';

/**
 * Evaluate hit result given ball and batter state.
 * Called each frame during Impact phase.
 * Returns HitResult or null (no contact).
 */
export function evaluate(ball, batter) {
  const batZoneTop = BATTER_Y - BAT_HITZONE_HEIGHT / 2;
  const batZoneBottom = BATTER_Y + BAT_HITZONE_HEIGHT / 2;

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

  // Step 4: Direction angle from Y timing
  const yDiff = ball.y - BATTER_Y;
  const halfZone = BAT_HITZONE_HEIGHT / 2;
  const normalizedTiming = Math.max(-1, Math.min(1, yDiff / halfZone));
  const directionAngle = normalizedTiming * 45;

  let timing;
  if (Math.abs(yDiff) <= 5) {
    timing = 'just';
  } else if (yDiff < 0) {
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
    judgment = 'OUT';
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
