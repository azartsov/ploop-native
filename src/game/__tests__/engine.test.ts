import { applyGravity, applyRainbowRules, findChain, findRainbowBurst, findRollTarget, generateBoard, isStuck, isWin, popCells, shuffleBoard } from "../engine";
import type { Board } from "../types";

function createBoard(colors: Array<Array<number | "rainbow" | null>>): Board {
  return colors.map((row, rowIndex) =>
    row.map((color, col) => ({
      id: `bubble-${rowIndex}-${col}`,
      color,
      row: rowIndex,
      col,
    })),
  );
}

function countConnectedGroups(board: ReturnType<typeof generateBoard>): number {
  const visited = new Set<string>();
  let groups = 0;
  const offsets: ReadonlyArray<readonly [number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const row of board) {
    for (const cell of row) {
      if (typeof cell.color !== "number" || visited.has(cell.id)) {
        continue;
      }

      const queue = [cell];
      const chain = [];
      visited.add(cell.id);

      while (queue.length > 0) {
        const current = queue.shift();

        if (!current) {
          continue;
        }

        chain.push(current);

        for (const [rowOffset, colOffset] of offsets) {
          const next = board[current.row + rowOffset]?.[current.col + colOffset];

          if (next && next.color === cell.color && !visited.has(next.id)) {
            visited.add(next.id);
            queue.push(next);
          }
        }
      }

      if (chain.length >= 2) {
        groups += 1;
      }
    }
  }

  return groups;
}

describe("generateBoard", () => {
  it("создаёт поле 10 на 10 с корректными координатами и идентификаторами", () => {
    const board = generateBoard();

    expect(board).toHaveLength(10);
    expect(board.every((row) => row.length === 10)).toBe(true);
    expect(board.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "bubble-0-0", row: 0, col: 0 }),
        expect.objectContaining({ id: "bubble-9-9", row: 9, col: 9 }),
      ]),
    );
  });

  it("использует только допустимые цвета", () => {
    const board = generateBoard();

    for (const cell of board.flat()) {
      expect(typeof cell.color === "number" ? cell.color >= 0 && cell.color < 7 : cell.color).toBeTruthy();
    }
  });

  it("гарантирует не меньше пятнадцати связных групп", () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(countConnectedGroups(generateBoard())).toBeGreaterThanOrEqual(15);
    }
  });
});

describe("игровые правила", () => {
  it("находит цепь только по четырём сторонам", () => {
    const board = createBoard([
      [1, 1, 2],
      [2, 1, 2],
      [2, 2, 1],
    ]);

    expect(findChain(board, 0, 0).map((cell) => cell.id)).toEqual(["bubble-0-0", "bubble-0-1", "bubble-1-1"]);
  });

  it("проводит цепь через радужный пузырь", () => {
    const board = createBoard([[1, "rainbow", 1]]);
    const chain = findChain(board, 0, 0);

    expect(applyRainbowRules(board, chain).map((cell) => cell.id)).toEqual(["bubble-0-0", "bubble-0-1", "bubble-0-2"]);
  });

  it("лопает радужный пузырь и его соседей при прямом удержании", () => {
    const board = createBoard([
      [1, "rainbow", 2],
      [3, 4, 5],
    ]);

    expect(findRainbowBurst(board, 0, 1).map((cell) => cell.id)).toEqual(["bubble-0-1", "bubble-1-1", "bubble-0-0", "bubble-0-2"]);
  });

  it("лопает клетки, опускает оставшиеся и определяет завершение", () => {
    const board = createBoard([
      [1, null],
      [1, 2],
      [3, 4],
    ]);
    const poppedBoard = popCells(board, findChain(board, 0, 0));
    const fallenBoard = applyGravity(poppedBoard);

    expect(fallenBoard.map((row) => row[0].color)).toEqual([null, null, 3]);
    expect(isWin(poppedBoard)).toBe(false);
    expect(isStuck(createBoard([[1, null], [null, 2]]))).toBe(true);
  });

  it("засчитывает победу, когда шарики остались только на нижней линии", () => {
    expect(isWin(createBoard([[null, null, null], [null, null, null], [1, 2, 3]]))).toBe(true);
    expect(isWin(createBoard([[null, null, null], [null, 1, null], [1, 2, 3]]))).toBe(false);
    expect(isWin(createBoard([[null, null], [null, null]]))).toBe(true);
  });

  it("направляет пузырь в более глубокую боковую ямку", () => {
    const board = createBoard([
      [null, 1, null],
      [null, 2, null],
      [null, 3, null],
      [7, 4, null],
      [8, 5, 6],
    ]);

    expect(findRollTarget(board, 1, 1)).toEqual({ row: 2, col: 2 });
  });

  it("случайно выбирает одну из одинаковых боковых ямок", () => {
    const board = createBoard([
      [null, 1, null],
      [null, 2, null],
      [3, 4, 5],
    ]);
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.9);

    expect(findRollTarget(board, 0, 1)).toEqual({ row: 1, col: 2 });

    randomSpy.mockRestore();
  });

  it("перемешивание не создаёт повторяющихся id клеток", () => {
    const generated = generateBoard();
    const board = applyGravity(popCells(generated, generated.flat().filter((_, index) => index % 3 === 0)));

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const ids = shuffleBoard(board).flat().map((cell) => cell.id);

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("перемешивает цвета, сохраняя набор пузырей и опуская их вниз", () => {
    const board = createBoard([
      [1, 2],
      ["rainbow", null],
    ]);

    const shuffledBoard = shuffleBoard(board);

    expect(shuffledBoard.flat().map((cell) => cell.color).sort()).toEqual([1, 2, "rainbow", null].sort());

    for (let col = 0; col < shuffledBoard[0].length; col += 1) {
      let foundBubble = false;

      for (const row of shuffledBoard) {
        if (row[col].color !== null) {
          foundBubble = true;
        } else {
          expect(foundBubble).toBe(false);
        }
      }
    }
  });
});