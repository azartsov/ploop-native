import { useWindowDimensions, StyleSheet, View } from "react-native";
import type { Board, Cell } from "../game/types";
import { Bubble } from "./Bubble";
import { PopEffect, type PopEffectData } from "./PopEffect";

const BOARD_GAP = 3;
const BOARD_PADDING = 9;
const BOARD_BORDER = 1;
const NO_POP_EFFECTS: PopEffectData[] = [];

type BubbleBoardProps = {
  board: Board;
  disabled: boolean;
  movementById: Record<string, { row: number; col: number }>;
  popEffects?: PopEffectData[];
  onHoldCell: (cell: Cell) => void;
};

export function BubbleBoard({ board, disabled, movementById, popEffects = NO_POP_EFFECTS, onHoldCell }: BubbleBoardProps) {
  const { width } = useWindowDimensions();
  const columns = board[0]?.length ?? 10;
  const maxWidth = Math.min(width - 28, 430);
  const maxInnerWidth = maxWidth - (BOARD_PADDING + BOARD_BORDER) * 2;
  const bubbleSize = Math.floor((maxInnerWidth - BOARD_GAP * (columns - 1)) / columns);
  const boardWidth = bubbleSize * columns + BOARD_GAP * (columns - 1) + (BOARD_PADDING + BOARD_BORDER) * 2;

  return (
    <View style={[styles.board, { width: boardWidth, gap: BOARD_GAP }]}>
      {board.map((row) => (
        <View key={row[0]?.row ?? "empty"} style={[styles.row, { gap: BOARD_GAP }]}>
          {row.map((cell) => (
            <Bubble key={cell.id} cell={cell} size={bubbleSize} disabled={disabled} fallDistance={movementById[cell.id]?.row ?? 0} rollDistance={movementById[cell.id]?.col ?? 0} fallStep={bubbleSize + BOARD_GAP} onHold={onHoldCell} />
          ))}
        </View>
      ))}
      {popEffects.map((effect) => (
        <View
          key={effect.id}
          pointerEvents="none"
          style={{ position: "absolute", left: BOARD_PADDING + effect.col * (bubbleSize + BOARD_GAP), top: BOARD_PADDING + effect.row * (bubbleSize + BOARD_GAP), width: bubbleSize, height: bubbleSize }}
        >
          <PopEffect color={effect.color} size={bubbleSize} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: "center",
    padding: BOARD_PADDING,
    borderRadius: 18,
    backgroundColor: "rgba(229, 249, 247, 0.84)",
    borderWidth: BOARD_BORDER,
    borderColor: "rgba(21, 96, 108, 0.16)",
  },
  row: {
    flexDirection: "row",
  },
});