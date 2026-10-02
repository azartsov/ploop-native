export const MAX_RECORDS = 10;

export type RecordEntry = {
  id: string;
  taps: number;
  timeMs: number;
};

export type AddRecordResult = {
  records: RecordEntry[];
  // Место нового результата в таблице (с нуля) или null, если он не попал в топ.
  rank: number | null;
};

// Меньше нажатий — выше; при равенстве выше тот, кто быстрее.
function compareRecords(a: RecordEntry, b: RecordEntry): number {
  return a.taps - b.taps || a.timeMs - b.timeMs;
}

export function addRecord(records: RecordEntry[], entry: RecordEntry): AddRecordResult {
  // Сортировка устойчива: при полном равенстве раньше стоит более старый результат.
  const sorted = [...records, entry].sort(compareRecords);
  const index = sorted.indexOf(entry);

  return {
    records: sorted.slice(0, MAX_RECORDS),
    rank: index < MAX_RECORDS ? index : null,
  };
}

function isRecordEntry(value: unknown): value is RecordEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RecordEntry>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.taps === "number" &&
    Number.isFinite(candidate.taps) &&
    typeof candidate.timeMs === "number" &&
    Number.isFinite(candidate.timeMs)
  );
}

export function parseRecords(value: unknown): RecordEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecordEntry).sort(compareRecords).slice(0, MAX_RECORDS);
}
