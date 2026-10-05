import { addRecord, getRecordLists, parseRecords, RECORDS_PER_LIST, type RecordEntry } from "../records";

const NOW = new Date(2026, 9, 15, 12).getTime();
const THIS_MONTH = new Date(2026, 9, 3).getTime();
const LAST_MONTH = new Date(2026, 8, 20).getTime();

function entry(id: string, average: number, playedAt: number = THIS_MONTH): RecordEntry {
  return { id, average, playedAt };
}

describe("таблица рекордов", () => {
  it("сортирует по среднему за поле, больше — выше", () => {
    const result = addRecord([entry("a", 800), entry("b", 1500)], entry("c", 1200), NOW);

    expect(getRecordLists(result.records, NOW).allTime.map((item) => item.id)).toEqual(["b", "c", "a"]);
    expect(result.allTimeRank).toBe(1);
    expect(result.monthRank).toBe(1);
  });

  it("при равенстве оставляет более старый результат выше", () => {
    const result = addRecord([entry("old", 900, THIS_MONTH)], entry("new", 900, NOW), NOW);

    expect(result.records.map((item) => item.id)).toEqual(["old", "new"]);
    expect(result.allTimeRank).toBe(1);
  });

  it("показывает пять лучших за всё время и пять лучших за месяц", () => {
    const old = Array.from({ length: 5 }, (_, index) => entry(`old${index}`, 5000 - index, LAST_MONTH));
    const current = Array.from({ length: 6 }, (_, index) => entry(`new${index}`, 1000 + index, THIS_MONTH));
    const lists = getRecordLists([...old, ...current], NOW);

    expect(lists.allTime.map((item) => item.id)).toEqual(["old0", "old1", "old2", "old3", "old4"]);
    expect(lists.month).toHaveLength(RECORDS_PER_LIST);
    expect(lists.month.map((item) => item.id)).toEqual(["new5", "new4", "new3", "new2", "new1"]);
  });

  it("результат прошлого месяца не попадает в список месяца", () => {
    const result = addRecord([], entry("last", 3000, LAST_MONTH), NOW);

    expect(result.allTimeRank).toBe(0);
    expect(result.monthRank).toBeNull();
    expect(getRecordLists(result.records, NOW).month).toEqual([]);
  });

  it("не хранит записи, которые не нужны ни одному списку", () => {
    const stored = Array.from({ length: 8 }, (_, index) => entry(`r${index}`, 100 + index * 100));
    const result = addRecord(stored, entry("weak", 50), NOW);

    expect(result.records).toHaveLength(RECORDS_PER_LIST);
    expect(result.allTimeRank).toBeNull();
    expect(result.monthRank).toBeNull();
    expect(result.records.some((item) => item.id === "weak")).toBe(false);
  });

  it("отбрасывает повреждённые данные при чтении", () => {
    const parsed = parseRecords([entry("ok", 1200), { id: 1, average: 3, playedAt: 1 }, null, { id: "x", average: "3", playedAt: 1 }]);

    expect(parsed).toEqual([entry("ok", 1200)]);
    expect(parseRecords("not an array")).toEqual([]);
  });
});
