import { applyGravity, applyRainbowRules, findBottomSinglesToAutoClear, findChain, findGroup, findRollTarget, generateBoard, generateBoardForField, isWin, popCells } from "../engine";
import { DEFAULT_COLOR_COUNT, type Board } from "../types";

function createBoard(colors: (number | "rainbow" | "stone" | null)[][]): Board {
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
  const offsets: (readonly [number, number])[] = [
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

  it("использует только пять обычных цветов и радужные пузыри", () => {
    const board = generateBoard();

    for (const cell of board.flat()) {
      expect(typeof cell.color === "number" ? cell.color >= 0 && cell.color < DEFAULT_COLOR_COUNT : cell.color === "rainbow").toBeTruthy();
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

  it("при прямом удержании лопает только радужный пузырь", () => {
    const board = createBoard([
      [1, "rainbow", 2],
      [3, 4, 5],
    ]);

    expect(findGroup(board, 0, 1)).toEqual([{ cell: board[0][1], depth: 0 }]);
  });

  it("не даёт выбрать или скатить камень вбок, но пропускает его вниз по колонке", () => {
    const board = createBoard([
      [null, null],
      ["stone", null],
      [null, 2],
      [null, null],
    ]);

    expect(findGroup(board, 1, 0)).toEqual([]);
    expect(findRollTarget(board, 1, 0)).toBeNull();

    const fallenBoard = applyGravity(board);

    expect(fallenBoard[3][0].color).toBe("stone");
    expect(fallenBoard[3][1].color).toBe(2);
  });

  it("считает поле пройденным, когда на нём остались только камни", () => {
    expect(isWin(createBoard([["stone", null]]))).toBe(true);
  });

  it("создаёт по одному камню на третьем поле и добавляет по одному до пятого", () => {
    for (const [fieldNumber, expectedStoneCount] of [[1, 0], [2, 0], [3, 1], [4, 2], [5, 3]]) {
      const board = generateBoardForField(fieldNumber);

      expect(board.flat().filter((cell) => cell.color === "stone")).toHaveLength(expectedStoneCount);
    }
  });

  it("автоматически выделяет одиночные шары в нижней строке, игнорируя камни", () => {
    const board = createBoard([
      ["stone", null, null],
      [null, 1, 2],
    ]);

    expect(findBottomSinglesToAutoClear(board)?.map((cell) => cell.color)).toEqual([1, 2]);
  });

  it("не включает автоматическое завершение, если остались верхние шары или группа", () => {
    const upperBall = createBoard([
      [1, null],
      [null, 2],
    ]);
    const groupedBalls = createBoard([[1, 1]]);

    expect(findBottomSinglesToAutoClear(upperBall)).toBeNull();
    expect(findBottomSinglesToAutoClear(groupedBalls)).toBeNull();
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
  });

  it("засчитывает победу только когда поле полностью пустое", () => {
    expect(isWin(createBoard([[null, null], [null, null]]))).toBe(true);
    expect(isWin(createBoard([[null, null, null], [null, null, null], [1, 2, 3]]))).toBe(false);
    expect(isWin(createBoard([[null, null], [null, 1]]))).toBe(false);
  });

  it("находит одиночный шарик как группу из одной клетки", () => {
    const board = createBoard([
      [1, 2],
      [3, 4],
    ]);

    expect(findGroup(board, 0, 0)).toEqual([{ cell: board[0][0], depth: 0 }]);
    expect(findGroup(createBoard([[null]]), 0, 0)).toEqual([]);
  });

  it("упорядочивает группу по расстоянию от нажатой клетки", () => {
    const board = createBoard([[1, 1, 1, 1, 2]]);
    const group = findGroup(board, 0, 1);

    expect(group.map((member) => [member.cell.id, member.depth])).toEqual([
      ["bubble-0-1", 0],
      ["bubble-0-0", 1],
      ["bubble-0-2", 1],
      ["bubble-0-3", 2],
    ]);
  });

  it("включает радужный мост в группу и одиночку рядом с радугой", () => {
    const board = createBoard([[1, "rainbow", 1, 2]]);

    expect(findGroup(board, 0, 0).map((member) => member.cell.id)).toEqual(["bubble-0-0", "bubble-0-1", "bubble-0-2"]);
    expect(findGroup(board, 0, 3).map((member) => member.cell.id)).toEqual(["bubble-0-3"]);
  });

  it("отделяет радужный шар от соседей при прямом нажатии", () => {
    const board = createBoard([[1, "rainbow", 2]]);
    const group = findGroup(board, 0, 1);

    expect(group.map((member) => [member.cell.id, member.depth])).toEqual([["bubble-0-1", 0]]);
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
});
