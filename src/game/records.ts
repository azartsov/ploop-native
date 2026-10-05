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
  // Хранятся только записи, которые попадают хотя бы в один из двух списков.
  records: RecordEntry[];
  // Места нового результата (с нуля) или null, если он не попал в список.
  allTimeRank: number | null;
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

function rankOf(list: RecordEntry[], entry: RecordEntry): number | null {
  const index = list.indexOf(entry);

  return index === -1 ? null : index;
}

export function addRecord(records: RecordEntry[], entry: RecordEntry, now: number = entry.playedAt): AddRecordResult {
  const all = [...records, entry];
  const lists = getRecordLists(all, now);

  return {
    records: all.filter((record) => lists.allTime.includes(record) || lists.month.includes(record)).sort(compareRecords),
    allTimeRank: rankOf(lists.allTime, entry),
    monthRank: rankOf(lists.month, entry),
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
