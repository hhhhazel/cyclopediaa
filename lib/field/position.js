const FIELD_MIN_SEPARATION = 10.5;
const FIELD_LEVEL_WIDTHS = [52, 82, 120, 160, 215];
const FIELD_X_MIN = 12;
const FIELD_X_MAX = 88;
const FIELD_Y_MIN = 30;
const FIELD_Y_MAX = 78;

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

function randomFieldCandidate() {
  return {
    x: Math.round((FIELD_X_MIN + Math.random() * (FIELD_X_MAX - FIELD_X_MIN)) * 100) / 100,
    y: Math.round((FIELD_Y_MIN + Math.random() * (FIELD_Y_MAX - FIELD_Y_MIN)) * 100) / 100,
  };
}

function scoreFieldCandidate(candidate, records) {
  let nearestDistance = Infinity;

  records.forEach(function (record) {
    const dx = candidate.x - Number(record.x || 0);
    const dy = candidate.y - Number(record.y || 0);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < nearestDistance) {
      nearestDistance = distance;
    }
  });

  const edgePenalty =
    Math.abs(candidate.x - 50) * 0.05 + Math.abs(candidate.y - 54) * 0.03;

  return nearestDistance - edgePenalty;
}

export function getRandomFieldPosition(existingRecords, newLevel) {
  const records = existingRecords || [];
  const safeLevel = Math.max(1, Math.min(5, Number(newLevel) || 3));

  let bestPosition = randomFieldCandidate();
  let bestScore = scoreFieldCandidate(bestPosition, records);

  for (let attempt = 0; attempt < 90; attempt++) {
    const candidate = randomFieldCandidate();

    if (fieldPositionOverlaps(candidate, records, safeLevel)) {
      continue;
    }

    const score = scoreFieldCandidate(candidate, records);

    if (score > bestScore) {
      bestScore = score;
      bestPosition = candidate;
    }
  }

  if (fieldPositionOverlaps(bestPosition, records, safeLevel)) {
    for (let attempt = 0; attempt < 120; attempt++) {
      const candidate = randomFieldCandidate();

      if (!fieldPositionOverlaps(candidate, records, safeLevel)) {
        return candidate;
      }
    }
  }

  return bestPosition;
}
