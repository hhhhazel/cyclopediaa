const FIELD_FORWARD_Y = 77;
const FIELD_BACKWARD_Y = 48;
const FIELD_DEPTH_STEP = 2.6;
const FIELD_MIN_SEPARATION = 10.5;
const FIELD_LEVEL_WIDTHS = [52, 82, 120, 160, 215];

function getFieldLevelWidth(level) {
  const safeLevel = Math.max(1, Math.min(5, Number(level) || 1));
  return FIELD_LEVEL_WIDTHS[safeLevel - 1];
}

function getMinimumFieldSeparation(levelA, levelB) {
  const widthA = getFieldLevelWidth(levelA);
  const widthB = getFieldLevelWidth(levelB);
  const sizeBonus = ((widthA + widthB) / 2 - 82) * 0.018;
  return FIELD_MIN_SEPARATION + Math.max(0, sizeBonus);
}

function fieldPositionOverlaps(candidate, records, newLevel) {
  return (records || []).some(function (record) {
    const dx = candidate.x - Number(record.x || 0);
    const dy = candidate.y - Number(record.y || 0);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minSep = getMinimumFieldSeparation(newLevel, record.level);
    return distance < minSep;
  });
}

function getVisitorDepthTargetY(visitorOrdinal) {
  return Math.max(
    FIELD_FORWARD_Y,
    Math.round((FIELD_FORWARD_Y - visitorOrdinal * FIELD_DEPTH_STEP) * 100) / 100
  );
}

function findFallbackFieldPosition(records, targetY, newLevel) {
  const centerX = 50;

  for (let ring = 0; ring < 14; ring++) {
    const radiusX = 6 + ring * 3.2;
    const radiusY = 3 + ring * 1.8;
    const steps = Math.max(8, 10 + ring * 2);

    for (let step = 0; step < steps; step++) {
      const angle = (Math.PI * 2 * step) / steps;
      const candidate = {
        x: Math.round((centerX + Math.cos(angle) * radiusX) * 100) / 100,
        y: Math.round((targetY + Math.sin(angle) * radiusY) * 100) / 100,
      };

      candidate.x = Math.max(12, Math.min(88, candidate.x));
      candidate.y = Math.max(FIELD_BACKWARD_Y, Math.min(80, candidate.y));

      if (!fieldPositionOverlaps(candidate, records, newLevel)) {
        return candidate;
      }
    }
  }

  return {
    x: centerX,
    y: Math.max(FIELD_BACKWARD_Y, Math.min(80, targetY)),
  };
}

export function getRandomFieldPosition(existingRecords, newLevel) {
  const records = existingRecords || [];
  const safeLevel = Math.max(1, Math.min(5, Number(newLevel) || 3));
  const visitorOrdinal = records.filter(function (record) {
    return record.source !== "seed";
  }).length;
  const targetY = getVisitorDepthTargetY(visitorOrdinal);
  const xMin = 14;
  const xMax = 86;
  const yJitter = 3.5;

  let bestPosition = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 90; attempt++) {
    const candidate = {
      x: Math.round((xMin + Math.random() * (xMax - xMin)) * 100) / 100,
      y:
        Math.round((targetY + (Math.random() - 0.5) * yJitter * 2) * 100) / 100,
    };

    candidate.y = Math.max(FIELD_BACKWARD_Y, Math.min(80, candidate.y));

    if (fieldPositionOverlaps(candidate, records, safeLevel)) {
      continue;
    }

    let nearestDistance = Infinity;

    records.forEach(function (record) {
      const dx = candidate.x - Number(record.x || 0);
      const dy = candidate.y - Number(record.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
      }
    });

    const depthScore = 12 - Math.abs(candidate.y - targetY) * 2.2;
    const centerBias = 6 - Math.abs(candidate.x - 50) * 0.08;
    const score = nearestDistance + depthScore + centerBias;

    if (score > bestScore) {
      bestScore = score;
      bestPosition = candidate;
    }
  }

  if (!bestPosition) {
    bestPosition = findFallbackFieldPosition(records, targetY, safeLevel);
  }

  return bestPosition;
}
