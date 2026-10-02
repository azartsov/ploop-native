import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BUBBLE_POP_AUDIO, ROLL_RUSTLE_AUDIO } from "../assets/audio";
import { applyGravity, applyRainbowRules, findChain, findRainbowBurst, generateBoard, isStuck, isWin, popCells, shuffleBoard } from "../game/engine";
import type { Board, Cell, GameStatus } from "../game/types";
import { formatDuration } from "../game/format";
import { addRecord, type RecordEntry } from "../game/records";
import { loadRecords, saveRecords } from "../game/save";
import { BubbleBoard } from "../components/BubbleBoard";
import { POP_BURST_MS, POP_GROW_MS, type PopEffectData } from "../components/PopEffect";
import { PloopLogo } from "../components/PloopLogo";
import { RecordsButton } from "../components/RecordsButton";
import { RecordsModal } from "../components/RecordsModal";
import { RecordsTable } from "../components/RecordsTable";
import { SoundButton } from "../components/SoundButton";
import { STRINGS, type Language } from "../i18n/strings";

const WAVE_DELAY_MS = 80;
const RAINBOW_DELAY_MS = 100;
const FALL_ANIMATION_MS = 700;
const POP_VIBRATION_MS = 14;
const ROLL_VIBRATION_PATTERN = [0, 16, 45, 16, 45, 16];
const POP_EFFECT_LIFETIME_MS = POP_GROW_MS + POP_BURST_MS + 60;

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function getMovements(before: Board, after: Board): Record<string, { row: number; col: number }> {
  const originalPositions = new Map(before.flat().filter((cell) => cell.color !== null).map((cell) => [cell.id, { row: cell.row, col: cell.col }]));

  return after.flat().reduce<Record<string, { row: number; col: number }>>((movements, cell) => {
    const originalPosition = originalPositions.get(cell.id);

    if (cell.color !== null && originalPosition && (cell.row !== originalPosition.row || cell.col !== originalPosition.col)) {
      movements[cell.id] = { row: cell.row - originalPosition.row, col: cell.col - originalPosition.col };
    }

    return movements;
  }, {});
}

type PloopGameScreenProps = {
  language: Language;
  onToggleLanguage: () => void;
};

export function PloopGameScreen({ language, onToggleLanguage }: PloopGameScreenProps) {
  const strings = STRINGS[language];
  const [board, setBoard] = useState<Board>(() => generateBoard());
  const [undoStack, setUndoStack] = useState<Board[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<GameStatus>("playing");
  const [isResolving, setIsResolving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [recordsVisible, setRecordsVisible] = useState(false);
  const [lastResult, setLastResult] = useState<{ taps: number; timeMs: number; recordId: string | null; rank: number | null } | null>(null);
  const [movementById, setMovementById] = useState<Record<string, { row: number; col: number }>>({});
  const [popEffects, setPopEffects] = useState<PopEffectData[]>([]);
  const popEffectSequence = useRef(0);
  const popPlayer = useAudioPlayer(BUBBLE_POP_AUDIO, { keepAudioSessionActive: true });
  const rustlePlayer = useAudioPlayer(ROLL_RUSTLE_AUDIO, { keepAudioSessionActive: true });

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      interruptionMode: "mixWithOthers",
    });
  }, []);

  useEffect(() => {
    void loadRecords().then(setRecords);
  }, []);

  useEffect(() => {
    popPlayer.volume = soundEnabled ? 0.6 : 0;
    popPlayer.shouldCorrectPitch = false;
    rustlePlayer.volume = soundEnabled ? 0.55 : 0;
  }, [popPlayer, rustlePlayer, soundEnabled]);

  useEffect(() => {
    if (status !== "playing") {
      return;
    }

    const interval = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);

    return () => clearInterval(interval);
  }, [startedAt, status]);

  function playRollEffects(movements: Record<string, { row: number; col: number }>) {
    if (Object.values(movements).some((movement) => movement.col !== 0)) {
      Vibration.vibrate(ROLL_VIBRATION_PATTERN);
      void rustlePlayer.seekTo(0).catch(() => undefined).finally(() => rustlePlayer.play());
    }
  }

  async function finishLevel(taps: number, timeMs: number) {
    const stored = await loadRecords();
    const entry: RecordEntry = { id: String(Date.now()), taps, timeMs };
    const result = addRecord(stored, entry);

    setRecords(result.records);
    setLastResult({ taps, timeMs, recordId: result.rank === null ? null : entry.id, rank: result.rank });
    setElapsedMs(timeMs);
    setStatus("won");
    await saveRecords(result.records);
  }

  function spawnPopEffect(cell: Cell, index: number) {
    if (cell.color === null) {
      return;
    }

    const effect: PopEffectData = { id: `pop-${popEffectSequence.current++}`, row: cell.row, col: cell.col, color: cell.color };

    setPopEffects((current) => [...current, effect]);
    setTimeout(() => setPopEffects((current) => current.filter((item) => item.id !== effect.id)), POP_EFFECT_LIFETIME_MS);

    // Звук и вибрация совпадают с моментом лопанья, после увеличения шарика.
    setTimeout(() => {
      Vibration.vibrate(POP_VIBRATION_MS);
      popPlayer.setPlaybackRate(0.94 + (index % 5) * 0.04);
      void popPlayer.seekTo(0).catch(() => undefined).finally(() => popPlayer.play());
    }, POP_GROW_MS);
  }

  async function resolveCells(sourceBoard: Board, cells: Cell[], delay: number, tapsAfterMove: number) {
    let nextBoard = sourceBoard;

    for (const [index, cell] of cells.entries()) {
      nextBoard = popCells(nextBoard, [cell]);
      setBoard(nextBoard);
      spawnPopEffect(cell, index);
      await wait(delay);
    }

    // Даём последнему шарику закончить увеличение до начала падения остальных.
    await wait(Math.max(0, POP_GROW_MS - delay));

    const fallenBoard = applyGravity(nextBoard);
    const movements = getMovements(nextBoard, fallenBoard);
    setMovementById(movements);
    setBoard(fallenBoard);

    if (Object.keys(movements).length > 0) {
      playRollEffects(movements);
      await wait(FALL_ANIMATION_MS);
      setMovementById({});
    }

    if (isWin(fallenBoard)) {
      await finishLevel(tapsAfterMove, Date.now() - startedAt);
    }
  }

  async function handleHold(cell: Cell) {
    if (isResolving || status !== "playing" || cell.color === null) {
      return;
    }

    const chain = cell.color === "rainbow" ? findRainbowBurst(board, cell.row, cell.col) : applyRainbowRules(board, findChain(board, cell.row, cell.col));

    if (chain.length < 2) {
      return;
    }

    setIsResolving(true);
    setUndoStack((current) => [...current, board]);
    setTapCount((current) => current + 1);

    await resolveCells(board, chain, cell.color === "rainbow" ? RAINBOW_DELAY_MS : WAVE_DELAY_MS, tapCount + 1).finally(() => setIsResolving(false));
  }

  function restart() {
    setBoard(generateBoard());
    setUndoStack([]);
    setTapCount(0);
    setElapsedMs(0);
    setStartedAt(Date.now());
    setStatus("playing");
    setLastResult(null);
    setPopEffects([]);
    setMovementById({});
  }

  function undo() {
    const previousBoard = undoStack.at(-1);

    if (!previousBoard || isResolving) {
      return;
    }

    setBoard(previousBoard);
    setUndoStack((current) => current.slice(0, -1));
    setTapCount((current) => Math.max(0, current - 1));
    setStatus("playing");
  }

  async function shuffle() {
    if (!isStuck(board) || isResolving) {
      return;
    }

    setIsResolving(true);
    setUndoStack((current) => [...current, board]);
    const shuffledBoard = shuffleBoard(board);
    const movements = getMovements(board, shuffledBoard);

    setMovementById(movements);
    setBoard(shuffledBoard);

    if (Object.keys(movements).length > 0) {
      playRollEffects(movements);
      await wait(FALL_ANIMATION_MS);
      setMovementById({});
    }

    setIsResolving(false);
  }

  const stuck = isStuck(board);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <PloopLogo fontSize={38} />
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <SoundButton enabled={soundEnabled} label={soundEnabled ? strings.soundOff : strings.soundOn} onToggle={() => setSoundEnabled((current) => !current)} />
          <RecordsButton label={strings.openRecords} onPress={() => setRecordsVisible(true)} />
          <Pressable accessibilityRole="button" accessibilityLabel={strings.switchLanguage} onPress={onToggleLanguage} style={styles.languageButton}>
            <Text style={styles.languageText}>{language.toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(elapsedMs)}</Text>
          <Text style={styles.statLabel}>{strings.time}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{tapCount}</Text>
          <Text style={styles.statLabel}>{strings.taps}</Text>
        </View>
      </View>

      <View style={styles.boardArea}>
        <BubbleBoard board={board} disabled={isResolving || status !== "playing"} movementById={movementById} popEffects={popEffects} onHoldCell={(cell) => void handleHold(cell)} />
      </View>

      <View style={styles.controls}>
        <Pressable accessibilityRole="button" disabled={isResolving} onPress={restart} style={[styles.controlButton, styles.restartButton]}>
          <Text style={styles.controlText}>{strings.restart}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!undoStack.length || isResolving} onPress={undo} style={[styles.controlButton, !undoStack.length || isResolving ? styles.disabledButton : styles.undoButton]}>
          <Text style={styles.controlText}>{strings.undo}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!stuck || isResolving} onPress={() => void shuffle()} style={[styles.controlButton, !stuck || isResolving ? styles.disabledButton : styles.shuffleButton]}>
          <Text style={styles.controlText}>{strings.shuffle}</Text>
        </Pressable>
      </View>

      {status === "won" && lastResult ? (
        <View style={styles.winBackdrop}>
          <View style={styles.winCard}>
            <Text style={styles.winTitle}>{lastResult.rank === 0 ? strings.newRecord : strings.won}</Text>
            <Text style={styles.winStats}>{formatDuration(lastResult.timeMs)} · {strings.tapsCount(lastResult.taps)}</Text>
            <Text style={styles.recordsTitle}>{strings.recordsTitle}</Text>
            <RecordsTable records={records} highlightId={lastResult.recordId} strings={strings} />
            <Pressable accessibilityRole="button" onPress={restart} style={[styles.controlButton, styles.winButton]}>
              <Text style={styles.controlText}>{strings.again}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <RecordsModal visible={recordsVisible} records={records} strings={strings} onClose={() => setRecordsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6FBF8",
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtitle: {
    color: "#4F7B80",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  languageButton: {
    minWidth: 58,
    height: 36,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#DDF4ED",
  },
  languageText: {
    color: "#246A63",
    fontSize: 15,
    fontWeight: "800",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(21, 61, 74, 0.1)",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#153D4A",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 3,
    color: "#66868A",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(21, 61, 74, 0.12)",
  },
  boardArea: {
    flex: 1,
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
  },
  controlButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  restartButton: {
    backgroundColor: "#E88A54",
  },
  undoButton: {
    backgroundColor: "#438E90",
  },
  shuffleButton: {
    backgroundColor: "#D8B647",
  },
  disabledButton: {
    backgroundColor: "#C7D6D4",
  },
  controlText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  winBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(246, 251, 248, 0.82)",
  },
  winCard: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6ECE7",
    shadowColor: "#153D4A",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  recordsTitle: {
    marginTop: 6,
    color: "#66868A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  winTitle: {
    color: "#153D4A",
    fontSize: 28,
    fontWeight: "800",
  },
  winStats: {
    color: "#4F7B80",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  winButton: {
    alignSelf: "stretch",
    backgroundColor: "#438E90",
  },
});