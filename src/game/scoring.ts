export const SERIES_FIELDS = 5;

const SINGLE_POINTS = 10;
const GROUP_STEP_POINTS = 100;
const COMBO_MIN_LEVEL = 3;
const COMBO_HIT_POINTS = 100;
const POPUP_MIN_FONT_SIZE = 14;
const POPUP_FONT_RANGE = 30;
const POPUP_MAX_POINTS = 2000;

// Для уровня комбо x3, x4, … хранит, сколько групп подряд размером не меньше уровня уже собрано.
export type ComboRuns = Record<number, number>;

export type ComboHit = {
  level: number;
  bonus: number;
};

export type ComboSummary = {
  maxLevel: number;
  totalBonus: number;
};

export type MoveScore = {
  points: number;
  comboHits: ComboHit[];
  comboBonus: number;
  comboRuns: ComboRuns;
};

export function summarizeComboHits(hits: ComboHit[]): ComboSummary | null {
  if (hits.length === 0) {
    return null;
  }

  return {
    maxLevel: Math.max(...hits.map((hit) => hit.level)),
    totalBonus: hits.reduce((total, hit) => total + hit.bonus, 0),
  };
}

export function groupPoints(size: number): number {
  if (size < 1) {
    return 0;
  }

  return size === 1 ? SINGLE_POINTS : (size - 1) * GROUP_STEP_POINTS;
}

// Группа размером s продолжает или начинает все комбо уровней от x3 до xs и обрывает комбо выше s.
// Бонус даёт каждое продолжение, то есть вторая и следующие группы подряд на своём уровне.
export function scoreMove(groupSize: number, previousRuns: ComboRuns): MoveScore {
  const comboRuns: ComboRuns = {};
  const comboHits: ComboHit[] = [];

  for (let level = COMBO_MIN_LEVEL; level <= groupSize; level += 1) {
    const run = (previousRuns[level] ?? 0) + 1;

    comboRuns[level] = run;

    if (run >= 2) {
      comboHits.push({ level, bonus: COMBO_HIT_POINTS });
    }
  }

  return {
    points: groupPoints(groupSize),
    comboHits,
    comboBonus: comboHits.reduce((total, hit) => total + hit.bonus, 0),
    comboRuns,
  };
}

export function averageScore(total: number, fields: number): number {
  return fields > 0 ? Math.round(total / fields) : 0;
}

// Размер всплывающих очков растёт от минимального у одиночки к максимальному у больших групп.
export function popupFontSize(points: number): number {
  const ratio = Math.min(Math.max(points, 0), POPUP_MAX_POINTS) / POPUP_MAX_POINTS;

  return Math.round(POPUP_MIN_FONT_SIZE + POPUP_FONT_RANGE * Math.sqrt(ratio));
}
