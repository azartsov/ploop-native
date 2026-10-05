export const DEFAULT_BOARD_ROWS = 10;
export const DEFAULT_BOARD_COLS = 10;
export const DEFAULT_COLOR_COUNT = 5;
export const DEFAULT_RAINBOW_CHANCE = 0.03;

export type BubbleColor = number | "rainbow" | "stone" | null;

export type Cell = {
  id: string;
  color: BubbleColor;
  row: number;
  col: number;
};

export type Board = Cell[][];

export type GameStatus = "playing" | "fieldCleared" | "seriesCleared";

export type GroupMember = {
  cell: Cell;
  // Расстояние от нажатой клетки по группе: задаёт порядок подсветки и лопанья.
  depth: number;
};