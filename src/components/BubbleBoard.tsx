import { useWindowDimensions, StyleSheet, View } from "react-native";
import type { Board, Cell } from "../game/types";
import { Bubble, type BubbleHighlight } from "./Bubble";
import { PopEffect, type PopEffectData } from "./PopEffect";
import { ScorePopup, type ScorePopupData } from "./ScorePopup";

const BOARD_GAP = 3;
const BOARD_PADDING = 9;
const BOARD_BORDER = 1;
const POPUP_WIDTH_BUBBLES = 9;
const NO_POP_EFFECTS: PopEffectData[] = [];
const NO_SCORE_POPUPS: ScorePopupData[] = [];
const NO_HIGHLIGHTS: Record<string, BubbleHighlight> = {};

type BubbleBoardProps = {
  board: Board;
  disabled: boolean;
  movementById: Record<string, { row: number; col: number }>;
  highlights?: Record<string, BubbleHighlight>;
  popEffects?: PopEffectData[];
  scorePopups?: ScorePopupData[];
  onPressStartCell?: (cell: Cell) => void;
  onPressCancel?: () => void;
  onHoldCell: (cell: Cell) => void;
};

function ignore() {}

export function BubbleBoard({
  board,
  disabled,
  movementById,
  highlights = NO_HIGHLIGHTS,
  popEffects = NO_POP_EFFECTS,
  scorePopups = NO_SCORE_POPUPS,
  onPressStartCell = ignore,
  onPressCancel = ignore,
  onHoldCell,
}: BubbleBoardProps) {
  const { width } = useWindowDimensions();
  const columns = board[0]?.length ?? 10;
  const maxWidth = Math.min(width - 28, 430);
  const maxInnerWidth = maxWidth - (BOARD_PADDING + BOARD_BORDER) * 2;
  const bubbleSize = Math.floor((maxInnerWidth - BOARD_GAP * (columns - 1)) / columns);
  const boardWidth = bubbleSize * columns + BOARD_GAP * (columns - 1) + (BOARD_PADDING + BOARD_BORDER) * 2;
  const step = bubbleSize + BOARD_GAP;
  const popupWidth = Math.min(bubbleSize * POPUP_WIDTH_BUBBLES, boardWidth - BOARD_BORDER * 2);

  return (
    <View style={[styles.board, { width: boardWidth, gap: BOARD_GAP }]}>
      {board.map((row) => (
        <View key={row[0]?.row ?? "empty"} style={[styles.row, { gap: BOARD_GAP }]}>
          {row.map((cell) => (
            <Bubble
              key={cell.id}
              cell={cell}
              size={bubbleSize}
              disabled={disabled}
              highlight={highlights[cell.id]}
              fallDistance={movementById[cell.id]?.row ?? 0}
              rollDistance={movementById[cell.id]?.col ?? 0}
              fallStep={step}
              onPressStart={onPressStartCell}
              onPressCancel={onPressCancel}
              onHold={onHoldCell}
            />
          ))}
        </View>
      ))}
      {popEffects.map((effect) => (
        <View
          key={effect.id}
          pointerEvents="none"
          style={{ position: "absolute", left: BOARD_PADDING + effect.col * step, top: BOARD_PADDING + effect.row * step, width: bubbleSize, height: bubbleSize }}
        >
          <PopEffect color={effect.color} size={bubbleSize} />
        </View>
      ))}
      {scorePopups.map((popup) => {
        const centerX = BOARD_PADDING + popup.col * step + bubbleSize / 2;
        // Надпись не должна выходить за края поля.
        const left = Math.min(Math.max(centerX - popupWidth / 2, 0), boardWidth - BOARD_BORDER * 2 - popupWidth);

        return (
          <View key={popup.id} pointerEvents="none" style={{ position: "absolute", left, top: Math.max(0, BOARD_PADDING + (popup.row - popup.lift) * step), width: popupWidth, alignItems: "center" }}>
            <ScorePopup text={popup.text} fontSize={popup.fontSize} color={popup.color} delayMs={popup.delayMs} badge={popup.badge} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: "relative",
    alignSelf: "center",
    padding: BOARD_PADDING,
    borderRadius: 18,
    backgroundColor: "#E8F9F7",
    borderWidth: BOARD_BORDER,
    borderColor: "rgba(21, 96, 108, 0.16)",
  },
  row: {
    flexDirection: "row",
  },
});
