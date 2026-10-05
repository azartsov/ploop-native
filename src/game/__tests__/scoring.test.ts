import { averageScore, groupPoints, popupFontSize, scoreMove, summarizeComboHits, type ComboRuns } from "../scoring";

function play(sizes: number[]): ReturnType<typeof scoreMove>[] {
  let runs: ComboRuns = {};

  return sizes.map((size) => {
    const move = scoreMove(size, runs);

    runs = move.comboRuns;

    return move;
  });
}

describe("очки за группы", () => {
  it("даёт 10 за одиночку и +100 за каждый следующий шарик группы", () => {
    expect([1, 2, 3, 4, 5, 8].map(groupPoints)).toEqual([10, 100, 200, 300, 400, 700]);
  });
});

describe("комбо", () => {
  it("группы из двух шаров и одиночки не образуют комбо", () => {
    const moves = play([2, 2, 2, 1, 1]);

    expect(moves.map((move) => move.comboBonus)).toEqual([0, 0, 0, 0, 0]);
    expect(moves.every((move) => Object.keys(move.comboRuns).length === 0)).toBe(true);
  });

  it("несколько групп из трёх шаров подряд дают комбо x3 со второй группы", () => {
    const moves = play([3, 3, 3]);

    expect(moves.map((move) => move.comboBonus)).toEqual([0, 100, 100]);
    expect(moves[1].comboHits).toEqual([{ level: 3, bonus: 100 }]);
  });

  it("группы из четырёх шаров подряд дают комбо x3 и x4 одновременно", () => {
    const moves = play([4, 4, 4]);

    expect(moves.map((move) => move.comboBonus)).toEqual([0, 200, 200]);
    expect(moves[1].comboHits.map((hit) => hit.level)).toEqual([3, 4]);
    expect(summarizeComboHits(moves[1].comboHits)).toEqual({ maxLevel: 4, totalBonus: 200 });
  });

  it("возвращает пустую сводку, если бонусных комбо нет", () => {
    expect(summarizeComboHits([])).toBeNull();
  });

  it("группа из четырёх после комбо x3 продолжает его и лишь начинает параллельное x4", () => {
    const moves = play([3, 4, 4]);

    expect(moves[1].comboHits.map((hit) => hit.level)).toEqual([3]);
    expect(moves[1].comboBonus).toBe(100);
    expect(moves[2].comboHits.map((hit) => hit.level)).toEqual([3, 4]);
    expect(moves[2].comboBonus).toBe(200);
  });

  it("группа меньше текущего уровня обрывает только более высокие комбо", () => {
    const moves = play([4, 4, 3, 4]);

    expect(moves[2].comboHits.map((hit) => hit.level)).toEqual([3]);
    expect(moves[2].comboRuns).toEqual({ 3: 3 });
    // x4 был оборван группой из трёх и начинается заново.
    expect(moves[3].comboHits.map((hit) => hit.level)).toEqual([3]);
    expect(moves[3].comboRuns).toEqual({ 3: 4, 4: 1 });
  });

  it("группа из двух шаров прерывает все комбо", () => {
    const moves = play([5, 5, 2, 5, 5]);

    expect(moves[1].comboBonus).toBe(300);
    expect(moves[2]).toMatchObject({ comboBonus: 0, comboRuns: {} });
    expect(moves[3].comboBonus).toBe(0);
    expect(moves[4].comboBonus).toBe(300);
  });
});

describe("среднее и размер всплывающих очков", () => {
  it("округляет среднее и не делит на ноль", () => {
    expect(averageScore(1000, 3)).toBe(333);
    expect(averageScore(500, 0)).toBe(0);
  });

  it("увеличивает шрифт вместе с очками и ограничивает сверху", () => {
    const sizes = [10, 100, 400, 1000, 2000, 99999].map(popupFontSize);

    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(sizes[0]).toBeLessThan(sizes[2]);
    expect(sizes[4]).toBe(sizes[5]);
  });
});
