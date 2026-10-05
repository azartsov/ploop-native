export const RECORDS_PER_LIST = 5;

export type RecordEntry = {
  id: string;
  // Среднее количество очков за поле в завершённой серии.
  average: number;
  playedAt: number;
};

export type RecordLists = {
  allTime: RecordEntry[];
  month: RecordEntry[];
};

export type AddRecordResult = {
  // Полная история нужна для вычисления точного места ниже топ-5.
  records: RecordEntry[];
  // Места нового результата (с нуля).
  allTimeRank: number;
  monthRank: number | null;
};

// Больше очков — выше; при равенстве выше более старый результат.
function compareRecords(a: RecordEntry, b: RecordEntry): number {
  return b.average - a.average || a.playedAt - b.playedAt;
}

function isSameMonth(timestamp: number, now: number): boolean {
  const date = new Date(timestamp);
  const current = new Date(now);

  return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
}

export function getRecordLists(records: RecordEntry[], now: number): RecordLists {
  const sorted = [...records].sort(compareRecords);

  return {
    allTime: sorted.slice(0, RECORDS_PER_LIST),
    month: sorted.filter((record) => isSameMonth(record.playedAt, now)).slice(0, RECORDS_PER_LIST),
  };
}

export function addRecord(records: RecordEntry[], entry: RecordEntry, now: number = entry.playedAt): AddRecordResult {
  const all = [...records, entry].sort(compareRecords);
  const month = all.filter((record) => isSameMonth(record.playedAt, now));

  return {
    records: all,
    allTimeRank: all.indexOf(entry),
    monthRank: month.indexOf(entry) === -1 ? null : month.indexOf(entry),
  };
}

function isRecordEntry(value: unknown): value is RecordEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RecordEntry>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.average === "number" &&
    Number.isFinite(candidate.average) &&
    typeof candidate.playedAt === "number" &&
    Number.isFinite(candidate.playedAt)
  );
}

export function parseRecords(value: unknown): RecordEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecordEntry).sort(compareRecords);
}
