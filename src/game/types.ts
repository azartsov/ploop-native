export const DEFAULT_BOARD_ROWS = 10;
export const DEFAULT_BOARD_COLS = 10;
export const DEFAULT_COLOR_COUNT = 7;
export const DEFAULT_RAINBOW_CHANCE = 0.03;

export type BubbleColor = number | "rainbow" | null;

export type Cell = {
  id: string;
  color: BubbleColor;
  row: number;
  col: number;
};

export type Board = Cell[][];

export type GameStatus = "playing" | "won";

export type GameState = {
  board: Board;
  status: GameStatus;
  startedAt: number | null;
  elapsedMs: number;
  tapCount: number;
  undoStack: Board[];
};