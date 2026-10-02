import { addRecord, MAX_RECORDS, parseRecords, type RecordEntry } from "../records";

function entry(id: string, taps: number, timeMs: number): RecordEntry {
  return { id, taps, timeMs };
}

describe("таблица рекордов", () => {
  it("сортирует сначала по нажатиям, затем по времени", () => {
    const records = [entry("a", 20, 30_000), entry("b", 15, 90_000)];
    const result = addRecord(records, entry("c", 15, 60_000));

    expect(result.records.map((item) => item.id)).toEqual(["c", "b", "a"]);
    expect(result.rank).toBe(0);
  });

  it("при полном равенстве оставляет более старый результат выше", () => {
    const result = addRecord([entry("old", 10, 40_000)], entry("new", 10, 40_000));

    expect(result.records.map((item) => item.id)).toEqual(["old", "new"]);
    expect(result.rank).toBe(1);
  });

  it("хранит не больше десяти результатов", () => {
    const full = Array.from({ length: MAX_RECORDS }, (_, index) => entry(`r${index}`, index + 5, 10_000));
    const worse = addRecord(full, entry("worse", 99, 10_000));
    const better = addRecord(full, entry("better", 1, 10_000));

    expect(worse.records).toHaveLength(MAX_RECORDS);
    expect(worse.rank).toBeNull();
    expect(better.records).toHaveLength(MAX_RECORDS);
    expect(better.records[0].id).toBe("better");
    expect(better.records.some((item) => item.id === "r9")).toBe(false);
  });

  it("отбрасывает повреждённые данные при чтении", () => {
    const parsed = parseRecords([entry("ok", 12, 5_000), { id: 1, taps: 3, timeMs: 1 }, null, { id: "x", taps: "3", timeMs: 1 }]);

    expect(parsed).toEqual([entry("ok", 12, 5_000)]);
    expect(parseRecords("not an array")).toEqual([]);
  });
});
