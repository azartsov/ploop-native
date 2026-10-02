import {
  DEFAULT_BOARD_COLS,
  DEFAULT_BOARD_ROWS,
  DEFAULT_COLOR_COUNT,
  DEFAULT_RAINBOW_CHANCE,
  type Board,
  type Cell,
} from "./types";

const MIN_CONNECTED_GROUPS = 15;

type Position = {
  row: number;
  col: number;
};

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isInsideBoard(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

function getNeighbors(board: Board, position: Position): Position[] {
  const offsets: ReadonlyArray<readonly [number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  return offsets
    .map(([rowOffset, colOffset]) => ({ row: position.row + rowOffset, col: position.col + colOffset }))
    .filter((neighbor) => isInsideBoard(board, neighbor.row, neighbor.col));
}

function createBoard(rows: number, cols: number, colorCount: number, rainbowChance: number): Board {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const color = Math.random() < rainbowChance ? "rainbow" : Math.floor(Math.random() * colorCount);

      return {
        id: `bubble-${row}-${col}`,
        color,
        row,
        col,
      };
    }),
  );
}

function countConnectedGroups(board: Board): number {
  const visited = new Set<string>();
  let groupCount = 0;

  for (const row of board) {
    for (const cell of row) {
      if (typeof cell.color !== "number" || visited.has(cell.id)) {
        continue;
      }

      const chain: Cell[] = [];
      const queue: Position[] = [{ row: cell.row, col: cell.col }];
      visited.add(cell.id);

      while (queue.length > 0) {
        const position = queue.shift();

        if (!position) {
          continue;
        }

        const current = board[position.row][position.col];
        chain.push(current);

        for (const neighbor of getNeighbors(board, position)) {
          const nextCell = board[neighbor.row][neighbor.col];

          if (nextCell.color === cell.color && !visited.has(nextCell.id)) {
            visited.add(nextCell.id);
            queue.push(neighbor);
          }
        }
      }

      if (chain.length >= 2) {
        groupCount += 1;
      }
    }
  }

  return groupCount;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function findChain(board: Board, row: number, col: number): Cell[] {
  const startingCell = board[row]?.[col];

  if (!startingCell || typeof startingCell.color !== "number") {
    return [];
  }

  const chain: Cell[] = [];
  const queue: Position[] = [{ row, col }];
  const visited = new Set([startingCell.id]);

  while (queue.length > 0) {
    const position = queue.shift();

    if (!position) {
      continue;
    }

    const current = board[position.row][position.col];
    chain.push(current);

    for (const neighbor of getNeighbors(board, position)) {
      const nextCell = board[neighbor.row][neighbor.col];

      if (nextCell.color === startingCell.color && !visited.has(nextCell.id)) {
        visited.add(nextCell.id);
        queue.push(neighbor);
      }
    }
  }

  return chain;
}

export function applyRainbowRules(board: Board, chain: Cell[]): Cell[] {
  const sourceColor = chain[0]?.color;

  if (typeof sourceColor !== "number") {
    return chain;
  }

  const resolved = [...chain];
  const includedIds = new Set(chain.map((cell) => cell.id));
  const queue = chain.filter((cell) => cell.color === sourceColor).map((cell) => ({ row: cell.row, col: cell.col }));

  while (queue.length > 0) {
    const position = queue.shift();

    if (!position) {
      continue;
    }

    for (const neighbor of getNeighbors(board, position)) {
      const candidate = board[neighbor.row][neighbor.col];

      if (includedIds.has(candidate.id)) {
        continue;
      }

      if (candidate.color === sourceColor) {
        includedIds.add(candidate.id);
        resolved.push(candidate);
        queue.push(neighbor);
      }

      if (candidate.color === "rainbow") {
        includedIds.add(candidate.id);
        resolved.push(candidate);
        queue.push(neighbor);
      }
    }
  }

  return resolved;
}

export function findRainbowBurst(board: Board, row: number, col: number): Cell[] {
  const rainbow = board[row]?.[col];

  if (!rainbow || rainbow.color !== "rainbow") {
    return [];
  }

  return [rainbow, ...getNeighbors(board, { row, col }).map((position) => board[position.row][position.col]).filter((cell) => cell.color !== null)];
}

export function popCells(board: Board, cells: Cell[]): Board {
  const poppedIds = new Set(cells.map((cell) => cell.id));

  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      color: poppedIds.has(cell.id) ? null : cell.color,
    })),
  );
}

function createEmptyCell(row: number, col: number): Cell {
  return {
    id: `empty-${row}-${col}`,
    color: null,
    row,
    col,
  };
}

function applyVerticalGravity(board: Board): Board {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const nextBoard: Board = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => createEmptyCell(row, col)),
  );

  for (let col = 0; col < cols; col += 1) {
    const remainingCells = board.map((row) => row[col]).filter((cell) => cell.color !== null);
    const firstTargetRow = rows - remainingCells.length;

    remainingCells.forEach((cell, index) => {
      const row = firstTargetRow + index;
      nextBoard[row][col] = { ...cell, row, col };
    });
  }

  return nextBoard;
}

function getPitDepth(board: Board, row: number, col: number): number {
  let depth = 0;

  for (let currentRow = row; currentRow < board.length && board[currentRow][col].color === null; currentRow += 1) {
    depth += 1;
  }

  return depth;
}

export function findRollTarget(board: Board, row: number, col: number): Position | null {
  const cell = board[row]?.[col];
  const targetRow = row + 1;

  if (!cell || cell.color === null || targetRow >= board.length) {
    return null;
  }

  const candidates = [col - 1, col + 1]
    .filter((targetCol) => targetCol >= 0 && targetCol < board[0].length && board[targetRow][targetCol].color === null)
    .map((targetCol) => ({ row: targetRow, col: targetCol, depth: getPitDepth(board, targetRow, targetCol) }));

  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length === 1 || candidates[0].depth !== candidates[1].depth) {
    const [deepest] = candidates.sort((a, b) => b.depth - a.depth);
    return { row: deepest.row, col: deepest.col };
  }

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  return { row: target.row, col: target.col };
}

function rollIntoPits(board: Board): Board {
  let nextBoard = board;
  let didRoll = true;

  while (didRoll) {
    didRoll = false;
    const rollingBoard = cloneBoard(nextBoard);

    for (let row = rollingBoard.length - 2; row >= 0; row -= 1) {
      for (let col = 0; col < rollingBoard[row].length; col += 1) {
        const target = findRollTarget(rollingBoard, row, col);

        if (!target) {
          continue;
        }

        const cell = rollingBoard[row][col];
        rollingBoard[target.row][target.col] = { ...cell, row: target.row, col: target.col };
        rollingBoard[row][col] = createEmptyCell(row, col);
        didRoll = true;
      }
    }

    nextBoard = didRoll ? applyVerticalGravity(rollingBoard) : nextBoard;
  }

  return nextBoard;
}

export function applyGravity(board: Board): Board {
  return rollIntoPits(applyVerticalGravity(board));
}

let shuffleSequence = 0;

export function shuffleBoard(board: Board): Board {
  const colors = board.flat().map((cell) => cell.color);

  for (let index = colors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const color = colors[index];
    colors[index] = colors[swapIndex];
    colors[swapIndex] = color;
  }

  const shuffledBoard = board.map((row, rowIndex) =>
    row.map((cell, col) => {
      const color = colors[rowIndex * row.length + col];
      // Id «empty-…» принадлежит пустым клеткам, которые гравитация создаёт заново.
      const id = color !== null && cell.id.startsWith("empty-") ? `bubble-shuffled-${shuffleSequence++}` : cell.id;

      return { ...cell, id, color };
    }),
  );

  return applyGravity(shuffledBoard);
}

// Уровень пройден, когда все оставшиеся шарики лежат только на нижней линии.
export function isWin(board: Board): boolean {
  return board.slice(0, -1).every((row) => row.every((cell) => cell.color === null));
}

export function isStuck(board: Board): boolean {
  return board.every((row) => row.every((cell) => typeof cell.color !== "number" || findChain(board, cell.row, cell.col).length < 2));
}

export function generateBoard(
  rows = DEFAULT_BOARD_ROWS,
  cols = DEFAULT_BOARD_COLS,
  colorCount = DEFAULT_COLOR_COUNT,
  rainbowChance = DEFAULT_RAINBOW_CHANCE,
): Board {
  if (!isPositiveInteger(rows) || !isPositiveInteger(cols) || !isPositiveInteger(colorCount)) {
    throw new Error("Размер поля и количество цветов должны быть положительными целыми числами.");
  }

  if (rainbowChance < 0 || rainbowChance > 1) {
    throw new Error("Вероятность радужного пузыря должна быть в диапазоне от 0 до 1.");
  }

  if (rows * cols < MIN_CONNECTED_GROUPS * 2) {
    throw new Error("На поле недостаточно клеток для гарантии минимального количества групп.");
  }

  // Поле принимается только после выполнения условия стартового уровня.
  while (true) {
    const board = createBoard(rows, cols, colorCount, rainbowChance);

    if (countConnectedGroups(board) >= MIN_CONNECTED_GROUPS) {
      return board;
    }
  }
}