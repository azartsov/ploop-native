import { useAudioPlayer, type AudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BLOOP_IN_GAME_AUDIO, BUBBLE_POP_AUDIO, ROLL_RUSTLE_AUDIO } from "../assets/audio";
import { applyGravity, findBottomSinglesToAutoClear, findGroup, generateBoardForField, isWin, popCells } from "../game/engine";
import { addRecord, type RecordEntry } from "../game/records";
import { loadRecords, saveRecords } from "../game/save";
import { averageScore, popupFontSize, scoreMove, SERIES_FIELDS, summarizeComboHits, type ComboRuns, type ComboSummary, type MoveScore } from "../game/scoring";
import type { Board, Cell, GameStatus, GroupMember } from "../game/types";
import { BubbleBoard } from "../components/BubbleBoard";
import { HOLD_DURATION_MS, type BubbleHighlight } from "../components/Bubble";
import { FieldBackdrop } from "../components/FieldBackdrop";
import { HelpModal } from "../components/HelpModal";
import { MusicButton } from "../components/MusicButton";
import { POP_BURST_MS, POP_GROW_MS, type PopEffectData } from "../components/PopEffect";
import { PloopLogo } from "../components/PloopLogo";
import { RecordsButton } from "../components/RecordsButton";
import { RecordsModal } from "../components/RecordsModal";
import { RecordsTable } from "../components/RecordsTable";
import { ScoreCounter } from "../components/ScoreCounter";
import { SCORE_POPUP_MS, type ScorePopupData } from "../components/ScorePopup";
import { SoundButton } from "../components/SoundButton";
import { STRINGS, type Language } from "../i18n/strings";

const WAVE_DELAY_MS = 80;
const RAINBOW_DELAY_MS = 100;
const FALL_ANIMATION_MS = 700;
const POP_VIBRATION_MS = 14;
const ROLL_VIBRATION_PATTERN = [0, 16, 45, 16, 45, 16];
const POP_EFFECT_LIFETIME_MS = POP_GROW_MS + POP_BURST_MS + 60;
// Подсветка доходит до самых дальних шариков группы раньше, чем закончится удержание.
const HIGHLIGHT_SPREAD_MS = HOLD_DURATION_MS * 0.8;
const MAX_HIGHLIGHT_STEP_MS = 80;
const COMBO_POPUP_DELAY_MS = 180;
// Светлые цвета читаются на тёмной плашке комбо.
const COMBO_COLORS = ["#FFD54A", "#7CE7FF", "#FF9AA2", "#B8F28B"];
const COMBO_POPUP_FONT_SIZE = 20;

type Movements = Record<string, { row: number; col: number }>;

type UndoSnapshot = {
  board: Board;
  fieldScore: number;
  comboRuns: ComboRuns;
  lastMove: LastMoveBreakdown | null;
};

type LastMoveBreakdown = {
  groupSize: number;
  groupPoints: number;
  comboSummary: ComboSummary | null;
  totalPoints: number;
};

type SeriesResult = {
  total: number;
  average: number;
  record: RecordEntry;
  recordId: string | null;
  allTimeRank: number;
  monthRank: number | null;
  newBest: boolean;
};

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function getMovements(before: Board, after: Board): Movements {
  const originalPositions = new Map(before.flat().filter((cell) => cell.color !== null).map((cell) => [cell.id, { row: cell.row, col: cell.col }]));

  return after.flat().reduce<Movements>((movements, cell) => {
    const originalPosition = originalPositions.get(cell.id);

    if (cell.color !== null && originalPosition && (cell.row !== originalPosition.row || cell.col !== originalPosition.col)) {
      movements[cell.id] = { row: cell.row - originalPosition.row, col: cell.col - originalPosition.col };
    }

    return movements;
  }, {});
}

type PloopGameScreenProps = {
  popPlayer: AudioPlayer;
  language: Language;
  onToggleLanguage: () => void;
};

export function PloopGameScreen({ popPlayer, language, onToggleLanguage }: PloopGameScreenProps) {
  const strings = STRINGS[language];
  const [board, setBoard] = useState<Board>(() => generateBoardForField(1));
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [fieldScore, setFieldScore] = useState(0);
  const [comboRuns, setComboRuns] = useState<ComboRuns>({});
  const [lastMove, setLastMove] = useState<LastMoveBreakdown | null>(null);
  // Очки уже пройденных полей текущей серии; индекс текущего поля равен длине массива.
  const [previousScores, setPreviousScores] = useState<number[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [isResolving, setIsResolving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [recordsVisible, setRecordsVisible] = useState(false);
  const [seriesResult, setSeriesResult] = useState<SeriesResult | null>(null);
  const [movementById, setMovementById] = useState<Movements>({});
  const [popEffects, setPopEffects] = useState<PopEffectData[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopupData[]>([]);
  const [highlights, setHighlights] = useState<Record<string, BubbleHighlight>>({});
  const popEffectSequence = useRef(0);
  const scorePopupSequence = useRef(0);
  const highlightTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingPopSounds = useRef<number[]>([]);
  const isProcessingPopSounds = useRef(false);
  const popPlayerReset = useRef<Promise<void> | null>(null);
  const isWarmingPopPlayer = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);
  const rustlePlayer = useAudioPlayer(ROLL_RUSTLE_AUDIO, { keepAudioSessionActive: true });
  const musicPlayer = useAudioPlayer(BLOOP_IN_GAME_AUDIO, { keepAudioSessionActive: true });

  useEffect(() => {
    void loadRecords().then(setRecords);
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    popPlayer.volume = soundEnabled ? 0.6 : 0;
    popPlayer.shouldCorrectPitch = false;
    rustlePlayer.volume = soundEnabled ? 0.55 : 0;
  }, [popPlayer, rustlePlayer, soundEnabled]);

  useEffect(() => {
    musicPlayer.loop = true;
    musicPlayer.volume = 0.35;

    if (!musicEnabled) {
      musicPlayer.pause();
      return;
    }

    if (musicPlayer.isLoaded) {
      musicPlayer.play();
      return;
    }

    const subscription = musicPlayer.addListener("playbackStatusUpdate", (status) => {
      if (status.isLoaded) {
        subscription.remove();
        musicPlayer.play();
      }
    });

    return () => subscription.remove();
  }, [musicEnabled, musicPlayer]);

  useEffect(() => {
    const subscription = popPlayer.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        popPlayer.pause();
        const reset = popPlayer.seekTo(0).catch(() => undefined);
        popPlayerReset.current = reset;
        void reset.then(() => {
          if (popPlayerReset.current === reset) {
            popPlayerReset.current = null;
          }
        });
      }
    });

    return () => subscription.remove();
  }, [popPlayer]);

  useEffect(() => clearHighlightTimers, []);

  function clearHighlightTimers() {
    highlightTimers.current.forEach(clearTimeout);
    highlightTimers.current = [];
  }

  function playRollEffects(movements: Movements) {
    if (Object.values(movements).some((movement) => movement.col !== 0)) {
      Vibration.vibrate(ROLL_VIBRATION_PATTERN);
      void rustlePlayer.seekTo(0).catch(() => undefined).finally(() => rustlePlayer.play());
    }
  }

  function waitForPopPlayerReady(): Promise<boolean> {
    if (popPlayer.isLoaded) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const subscription = popPlayer.addListener("playbackStatusUpdate", (status) => {
        if (status.isLoaded || status.error) {
          subscription.remove();
          resolve(status.isLoaded);
        }
      });

      if (popPlayer.isLoaded) {
        subscription.remove();
        resolve(true);
      }
    });
  }

  async function playPendingPopSounds() {
    if (isProcessingPopSounds.current) {
      return;
    }

    isProcessingPopSounds.current = true;

    try {
      while (pendingPopSounds.current.length > 0) {
        const index = pendingPopSounds.current.shift();

        if (index === undefined) {
          continue;
        }

        if (!(await waitForPopPlayerReady())) {
          continue;
        }

        popPlayer.setPlaybackRate(0.94 + (index % 5) * 0.04);
        if (popPlayerReset.current) {
          await popPlayerReset.current;
        }
        if (popPlayer.currentTime > 0) {
          await popPlayer.seekTo(0).catch(() => undefined);
        }
        popPlayer.play();
      }
    } finally {
      isProcessingPopSounds.current = false;

      if (pendingPopSounds.current.length > 0) {
        void playPendingPopSounds();
      }
    }
  }

  // Подсветка начинается с нажатого шарика и волной расходится по всей группе.
  function handlePressStart(cell: Cell) {
    clearHighlightTimers();
    setHighlights({});
    warmPopPlayer();

    const group = findGroup(board, cell.row, cell.col);
    const maxDepth = group.at(-1)?.depth ?? 0;
    const stepMs = maxDepth > 0 ? Math.min(MAX_HIGHLIGHT_STEP_MS, HIGHLIGHT_SPREAD_MS / maxDepth) : 0;

    for (let depth = 0; depth <= maxDepth; depth += 1) {
      const level = group.filter((member) => member.depth === depth);
      const reveal = () =>
        setHighlights((current) => {
          const next = { ...current };

          for (const { cell: member } of level) {
            next[member.id] = member.color === "rainbow" ? "rainbow" : "group";
          }

          return next;
        });

      if (depth === 0) {
        reveal();
      } else {
        highlightTimers.current.push(setTimeout(reveal, depth * stepMs));
      }
    }
  }

  function handlePressCancel() {
    clearHighlightTimers();
    setHighlights({});
  }

  function warmPopPlayer() {
    if (!soundEnabled || !popPlayer.isLoaded || popPlayer.playing || isWarmingPopPlayer.current || popPlayerReset.current) {
      return;
    }

    isWarmingPopPlayer.current = true;
    const volume = popPlayer.volume;
    popPlayer.volume = 0;

    const subscription = popPlayer.addListener("playbackStatusUpdate", (status) => {
      if (!status.didJustFinish) {
        return;
      }

      subscription.remove();
      const restoreVolume = () => {
        isWarmingPopPlayer.current = false;
        popPlayer.volume = soundEnabledRef.current ? volume : 0;
      };

      if (popPlayerReset.current) {
        void popPlayerReset.current.finally(restoreVolume);
      } else {
        restoreVolume();
      }
    });

    popPlayer.play();
  }

  async function finishField(score: number) {
    if (previousScores.length + 1 < SERIES_FIELDS) {
      setStatus("fieldCleared");
      return;
    }

    const total = sum(previousScores) + score;
    const average = averageScore(total, SERIES_FIELDS);
    const now = Date.now();
    const stored = await loadRecords();
    const entry: RecordEntry = { id: String(now), average, playedAt: now };
    const result = addRecord(stored, entry, now);

    setRecords(result.records);
    setSeriesResult({
      total,
      average,
      record: entry,
      recordId: entry.id,
      allTimeRank: result.allTimeRank,
      monthRank: result.monthRank,
      newBest: result.allTimeRank === 0,
    });
    setStatus("seriesCleared");
    await saveRecords(result.records);
  }

  function spawnPopEffect(cell: Cell, index: number) {
    if (cell.color === null || cell.color === "stone") {
      return;
    }

    const effect: PopEffectData = { id: `pop-${popEffectSequence.current++}`, row: cell.row, col: cell.col, color: cell.color };

    setPopEffects((current) => [...current, effect]);
    setTimeout(() => setPopEffects((current) => current.filter((item) => item.id !== effect.id)), POP_EFFECT_LIFETIME_MS);

    // Звук и вибрация совпадают с моментом лопанья, после увеличения шарика.
    setTimeout(() => {
      Vibration.vibrate(POP_VIBRATION_MS);
      pendingPopSounds.current.push(index);
      void playPendingPopSounds();
    }, POP_GROW_MS);
  }

  function spawnScorePopups(cells: Cell[], move: MoveScore) {
    const row = sum(cells.map((cell) => cell.row)) / cells.length;
    const col = sum(cells.map((cell) => cell.col)) / cells.length;
    const id = `score-${scorePopupSequence.current++}`;
    const pointsFontSize = popupFontSize(move.points);
    const popups: ScorePopupData[] = [{ id, row, col, text: `+${move.points}`, fontSize: pointsFontSize, color: "#FFFFFF", lift: 0, delayMs: 0, badge: false }];

    const comboSummary = summarizeComboHits(move.comboHits);

    if (comboSummary) {
      popups.push({
        id: `${id}-combo`,
        row,
        col,
        text: `${strings.lastMoveCombo(comboSummary.maxLevel)}  +${comboSummary.totalBonus}`,
        fontSize: COMBO_POPUP_FONT_SIZE,
        color: COMBO_COLORS[(comboSummary.maxLevel - 3) % COMBO_COLORS.length],
        lift: 0.5 + pointsFontSize / 28,
        delayMs: COMBO_POPUP_DELAY_MS,
        badge: true,
      });
    }

    const lastDelayMs = Math.max(...popups.map((popup) => popup.delayMs));

    setScorePopups((current) => [...current, ...popups]);
    setTimeout(() => setScorePopups((current) => current.filter((popup) => !popup.id.startsWith(id))), SCORE_POPUP_MS + lastDelayMs + 100);
  }

  async function resolveBottomSingles(board: Board, cells: Cell[], startingScore: number) {
    let nextBoard = board;
    let nextScore = startingScore;

    setComboRuns({});

    for (const cell of cells) {
      nextBoard = popCells(nextBoard, [cell]);
      nextScore += 10;
      setBoard(nextBoard);
      setFieldScore(nextScore);
      spawnPopEffect(cell, 0);
      spawnScorePopups([cell], scoreMove(1, {}));
      await wait(WAVE_DELAY_MS);
    }

    await finishField(nextScore);
  }

  async function resolveCells(sourceBoard: Board, members: GroupMember[], delay: number, scoreAfterMove: number) {
    let nextBoard = sourceBoard;

    for (const [index, { cell }] of members.entries()) {
      nextBoard = popCells(nextBoard, [cell]);
      setBoard(nextBoard);
      spawnPopEffect(cell, index);
      await wait(delay);
    }

    setHighlights({});
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

    const bottomSingles = findBottomSinglesToAutoClear(fallenBoard);

    if (bottomSingles) {
      await resolveBottomSingles(fallenBoard, bottomSingles, scoreAfterMove);
      return;
    }

    if (isWin(fallenBoard)) {
      await finishField(scoreAfterMove);
    }
  }

  async function handleHold(cell: Cell) {
    if (isResolving || status !== "playing" || cell.color === null || cell.color === "stone") {
      return;
    }

    clearHighlightTimers();

    const group = findGroup(board, cell.row, cell.col);

    if (group.length === 0) {
      return;
    }

    const cells = group.map((member) => member.cell);
    const move = scoreMove(cells.length, comboRuns);
    const scoreAfterMove = fieldScore + move.points + move.comboBonus;

    setIsResolving(true);
    setUndoStack((current) => [...current, { board, fieldScore, comboRuns, lastMove }]);
    setFieldScore(scoreAfterMove);
    setComboRuns(move.comboRuns);
    setLastMove({ groupSize: cells.length, groupPoints: move.points, comboSummary: summarizeComboHits(move.comboHits), totalPoints: move.points + move.comboBonus });
    spawnScorePopups(cells, move);

    await resolveCells(board, group, cell.color === "rainbow" ? RAINBOW_DELAY_MS : WAVE_DELAY_MS, scoreAfterMove).finally(() => setIsResolving(false));
  }

  function resetField(nextFieldNumber: number) {
    clearHighlightTimers();
    setBoard(generateBoardForField(nextFieldNumber));
    setUndoStack([]);
    setFieldScore(0);
    setComboRuns({});
    setLastMove(null);
    setStatus("playing");
    setPopEffects([]);
    setScorePopups([]);
    setHighlights({});
    setMovementById({});
  }

  function startNextField() {
    setPreviousScores((current) => [...current, fieldScore]);
    resetField(fieldNumber + 1);
  }

  function restart() {
    setPreviousScores([]);
    setSeriesResult(null);
    resetField(1);
  }

  function undo() {
    const snapshot = undoStack.at(-1);

    if (!snapshot || isResolving) {
      return;
    }

    clearHighlightTimers();
    setHighlights({});
    setBoard(snapshot.board);
    setFieldScore(snapshot.fieldScore);
    setComboRuns(snapshot.comboRuns);
    setLastMove(snapshot.lastMove);
    setUndoStack((current) => current.slice(0, -1));
  }

  const fieldNumber = previousScores.length + 1;
  const seriesTotal = sum(previousScores) + fieldScore;
  const completedScores = status === "playing" ? previousScores : [...previousScores, fieldScore];
  const currentAverage = averageScore(sum(completedScores), completedScores.length);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <FieldBackdrop fieldNumber={fieldNumber} />
      <View style={styles.header}>
        <PloopLogo fontSize={38} />
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={strings.helpOpen} onPress={() => setHelpVisible(true)} style={styles.helpButton}>
            <Text style={styles.helpButtonText}>?</Text>
          </Pressable>
          <MusicButton enabled={musicEnabled} label={musicEnabled ? strings.musicOff : strings.musicOn} onToggle={() => setMusicEnabled((current) => !current)} />
          <SoundButton enabled={soundEnabled} label={soundEnabled ? strings.soundOff : strings.soundOn} onToggle={() => setSoundEnabled((current) => !current)} />
          <RecordsButton label={strings.openRecords} onPress={() => setRecordsVisible(true)} />
          <Pressable accessibilityRole="button" accessibilityLabel={strings.switchLanguage} onPress={onToggleLanguage} style={styles.languageButton}>
            <Text style={styles.languageText}>{language.toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.fieldStat}>
          <View style={styles.fieldValue}>
            <ScoreCounter value={fieldNumber} fontSize={32} />
            <Text style={styles.fieldTotal}>/ {SERIES_FIELDS}</Text>
          </View>
          <Text style={styles.statLabel}>{strings.field}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.stat, styles.averageStat]}>
          <View style={styles.averageAndHistory}>
            <ScoreCounter value={currentAverage} fontSize={30} />
            {previousScores.length > 0 ? (
              <View style={styles.previousScores}>
                {previousScores.map((score, index) => (
                  <Text key={index} style={styles.previousScore} numberOfLines={1}>
                    {score}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
          <Text style={styles.statLabel}>{strings.average}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.stat, styles.scoreStat]}>
          <ScoreCounter value={fieldScore} fontSize={30} />
          <Text style={styles.statLabel}>{strings.fieldScore.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.boardArea}>
        <BubbleBoard
          board={board}
          disabled={isResolving || status !== "playing"}
          movementById={movementById}
          highlights={highlights}
          popEffects={popEffects}
          scorePopups={scorePopups}
          onPressStartCell={handlePressStart}
          onPressCancel={handlePressCancel}
          onHoldCell={(cell) => void handleHold(cell)}
        />
      </View>

      <View style={styles.lastMovePanel}>
        <View style={styles.lastMoveCopy}>
          <Text style={styles.lastMoveLabel}>{strings.lastMove}</Text>
          {lastMove ? (
            <View style={styles.lastMoveDetails}>
              <Text style={styles.lastMoveGroup}>
                {strings.lastMoveGroup(lastMove.groupSize)} +{lastMove.groupPoints}
              </Text>
              {lastMove.comboSummary ? <Text style={styles.lastMoveCombo}>{strings.lastMoveCombo(lastMove.comboSummary.maxLevel)} +{lastMove.comboSummary.totalBonus}</Text> : null}
            </View>
          ) : (
            <Text style={styles.lastMoveEmpty}>{strings.lastMoveEmpty}</Text>
          )}
        </View>
        {lastMove ? <Text style={styles.lastMoveTotal}>+{lastMove.totalPoints}</Text> : null}
      </View>

      <View style={styles.controls}>
        <Pressable accessibilityRole="button" disabled={isResolving} onPress={restart} style={[styles.controlButton, styles.restartButton]}>
          <Text style={styles.controlText}>{strings.restart}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!undoStack.length || isResolving} onPress={undo} style={[styles.controlButton, !undoStack.length || isResolving ? styles.disabledButton : styles.undoButton]}>
          <Text style={styles.controlText}>{strings.undo}</Text>
        </Pressable>
      </View>

      {status === "fieldCleared" ? (
        <View style={styles.winBackdrop}>
          <View style={styles.winCard}>
            <Text style={styles.winTitle}>{strings.fieldCleared(fieldNumber)}</Text>
            <Text style={styles.winStats}>{strings.fieldScore}: {fieldScore}</Text>
            <Text style={styles.winStats}>{strings.seriesScore}: {seriesTotal}</Text>
            <Text style={styles.winStats}>{strings.averagePerField}: {currentAverage}</Text>
            <Pressable accessibilityRole="button" onPress={startNextField} style={[styles.controlButton, styles.winButton]}>
              <Text style={styles.controlText}>{strings.nextField}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {status === "seriesCleared" && seriesResult ? (
        <View style={styles.winBackdrop}>
          <View style={styles.winCard}>
            <Text style={styles.winTitle}>{seriesResult.newBest ? strings.newRecord : strings.seriesCleared}</Text>
            <Text style={styles.winStats}>{strings.seriesScore}: {seriesResult.total}</Text>
            <Text style={styles.winAverage}>{strings.averagePerField}: {seriesResult.average}</Text>
            <Text style={styles.recordsTitle}>{strings.recordsTitle}</Text>
            <RecordsTable
              records={records}
              highlightId={seriesResult.recordId}
              currentResult={{ record: seriesResult.record, allTimeRank: seriesResult.allTimeRank, monthRank: seriesResult.monthRank }}
              strings={strings}
            />
            <Pressable accessibilityRole="button" onPress={restart} style={[styles.controlButton, styles.winButton]}>
              <Text style={styles.controlText}>{strings.again}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <RecordsModal visible={recordsVisible} records={records} strings={strings} onClose={() => setRecordsVisible(false)} />
      <HelpModal visible={helpVisible} strings={strings} onClose={() => setHelpVisible(false)} />
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
  helpButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#DDF4ED",
  },
  helpButtonText: {
    color: "#246A63",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 24,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -14,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F6FBF8",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(21, 61, 74, 0.1)",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  scoreStat: {
    flex: 1.6,
  },
  averageStat: {
    flex: 2,
  },
  averageAndHistory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previousScores: {
    alignItems: "flex-start",
    justifyContent: "center",
    maxWidth: 72,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(21, 61, 74, 0.16)",
    gap: 1,
  },
  previousScore: {
    color: "#66868A",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
  },
  fieldStat: {
    width: "24%",
    alignItems: "center",
  },
  fieldValue: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldTotal: {
    marginLeft: 2,
    color: "#66868A",
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
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
    height: 38,
    backgroundColor: "rgba(21, 61, 74, 0.12)",
  },
  boardArea: {
    flex: 1,
    justifyContent: "center",
  },
  lastMovePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 64,
    marginHorizontal: -14,
    marginBottom: 8,
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D5EAE3",
    backgroundColor: "#E8F3F0",
  },
  lastMoveCopy: {
    flex: 1,
    gap: 4,
  },
  lastMoveLabel: {
    color: "#66868A",
    fontSize: 11,
    fontWeight: "900",
  },
  lastMoveDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
  },
  lastMoveGroup: {
    color: "#153D4A",
    fontSize: 15,
    fontWeight: "800",
  },
  lastMoveCombo: {
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#246A63",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  lastMoveEmpty: {
    color: "#66868A",
    fontSize: 14,
  },
  lastMoveTotal: {
    color: "#E06A4F",
    fontSize: 21,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
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
    gap: 8,
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
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  winStats: {
    color: "#4F7B80",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  winAverage: {
    color: "#153D4A",
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  winButton: {
    alignSelf: "stretch",
    marginTop: 4,
    backgroundColor: "#438E90",
  },
});
