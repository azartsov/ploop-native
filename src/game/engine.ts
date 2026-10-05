import {
  DEFAULT_BOARD_COLS,
  DEFAULT_BOARD_ROWS,
  DEFAULT_COLOR_COUNT,
  DEFAULT_RAINBOW_CHANCE,
  type Board,
  type Cell,
  type GroupMember,
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
  const offsets: (readonly [number, number])[] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  return offsets
    .map(([rowOffset, colOffset]) => ({ row: position.row + rowOffset, col: position.col + colOffset }))
    .filter((neighbor) => isInsideBoard(board, neighbor.row, neighbor.col));
}

function createBoard(rows: number, cols: number, colorCount: number, rainbowChance: number, stoneCount: number): Board {
  const board: Board = Array.from({ length: rows }, (_, row) =>
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

  const stonePositions = new Set<number>();

  while (stonePositions.size < stoneCount) {
    stonePositions.add(Math.floor(Math.random() * rows * cols));
  }

  for (const position of stonePositions) {
    const row = Math.floor(position / cols);
    const col = position % cols;
    board[row][col].color = "stone";
  }

  return board;
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

// Группа, которая лопается одним нажатием, в порядке волны от нажатой клетки.
export function findGroup(board: Board, row: number, col: number): GroupMember[] {
  const start = board[row]?.[col];

  if (!start || start.color === null || start.color === "stone") {
    return [];
  }

  const group = start.color === "rainbow" ? [start] : applyRainbowRules(board, findChain(board, row, col));
  const groupById = new Map(group.map((cell) => [cell.id, cell]));
  const ordered: GroupMember[] = [{ cell: start, depth: 0 }];
  const visited = new Set([start.id]);

  // ordered служит очередью обхода в ширину.
  for (let index = 0; index < ordered.length; index += 1) {
    const { cell, depth } = ordered[index];

    for (const neighbor of getNeighbors(board, cell)) {
      const next = board[neighbor.row][neighbor.col];

      if (groupById.has(next.id) && !visited.has(next.id)) {
        visited.add(next.id);
        ordered.push({ cell: next, depth: depth + 1 });
      }
    }
  }

  return ordered;
}

export function findBottomSinglesToAutoClear(board: Board): Cell[] | null {
  const remainingBalls = board.flat().filter((cell) => typeof cell.color === "number" || cell.color === "rainbow");

  if (remainingBalls.length === 0 || remainingBalls.some((cell) => cell.row !== board.length - 1)) {
    return null;
  }

  if (remainingBalls.some((cell) => findGroup(board, cell.row, cell.col).length > 1)) {
    return null;
  }

  return remainingBalls;
}

export function popCells(board: Board, cells: Cell[]): Board {
  const poppedIds = new Set(cells.map((cell) => cell.id));

  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      color: poppedIds.has(cell.id) && cell.color !== "stone" ? null : cell.color,
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

  if (!cell || cell.color === null || cell.color === "stone" || targetRow >= board.length) {
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

// Поле пройдено, когда лопнули все шарики: одиночки тоже можно лопать.
export function isWin(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell.color === null || cell.color === "stone"));
}

export function generateBoard(
  rows = DEFAULT_BOARD_ROWS,
  cols = DEFAULT_BOARD_COLS,
  colorCount = DEFAULT_COLOR_COUNT,
  rainbowChance = DEFAULT_RAINBOW_CHANCE,
  stoneCount = 0,
): Board {
  if (!isPositiveInteger(rows) || !isPositiveInteger(cols) || !isPositiveInteger(colorCount)) {
    throw new Error("Размер поля и количество цветов должны быть положительными целыми числами.");
  }

  if (rainbowChance < 0 || rainbowChance > 1) {
    throw new Error("Вероятность радужного пузыря должна быть в диапазоне от 0 до 1.");
  }

  if (!Number.isInteger(stoneCount) || stoneCount < 0 || stoneCount >= rows * cols) {
    throw new Error("Количество камней должно быть неотрицательным целым числом меньше размера поля.");
  }

  if (rows * cols < MIN_CONNECTED_GROUPS * 2) {
    throw new Error("На поле недостаточно клеток для гарантии минимального количества групп.");
  }

  // Поле принимается только после выполнения условия стартового уровня.
  while (true) {
    const board = createBoard(rows, cols, colorCount, rainbowChance, stoneCount);

    if (countConnectedGroups(board) >= MIN_CONNECTED_GROUPS) {
      return board;
    }
  }
}

export function generateBoardForField(fieldNumber: number): Board {
  const stoneCount = Math.max(0, Math.min(3, Math.floor(fieldNumber) - 2));

  return generateBoard(DEFAULT_BOARD_ROWS, DEFAULT_BOARD_COLS, DEFAULT_COLOR_COUNT, DEFAULT_RAINBOW_CHANCE, stoneCount);
}