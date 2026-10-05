import { SERIES_FIELDS } from "../game/scoring";

export type Language = "ru" | "en";

export type Strings = {
  score: string;
  field: string;
  average: string;
  combo: string;
  lastMove: string;
  lastMoveEmpty: string;
  lastMoveGroup: (size: number) => string;
  lastMoveCombo: (level: number) => string;
  restart: string;
  undo: string;
  again: string;
  nextField: string;
  fieldCleared: (field: number) => string;
  seriesCleared: string;
  fieldScore: string;
  seriesScore: string;
  averagePerField: string;
  tapToStart: string;
  startGame: string;
  soundOn: string;
  soundOff: string;
  musicOn: string;
  musicOff: string;
  helpOpen: string;
  helpTitle: string;
  helpDescription: string;
  switchLanguage: string;
  recordsTitle: string;
  recordsHint: string;
  openRecords: string;
  noRecords: string;
  allTime: string;
  thisMonth: string;
  newRecord: string;
  close: string;
};

export const STRINGS: Record<Language, Strings> = {
  ru: {
    score: "ОЧКИ",
    field: "ПОЛЕ",
    average: "СРЕДНЕЕ",
    combo: "КОМБО",
    lastMove: "ПОСЛЕДНИЙ ХОД",
    lastMoveEmpty: "Очки появятся после первого хода",
    lastMoveGroup: (size) => (size === 1 ? "Одиночный шар" : `Группа из ${size} шаров`),
    lastMoveCombo: (level) => `КОМБО x${level}`,
    restart: "Заново",
    undo: "Отмена",
    again: "Новая серия",
    nextField: "Следующее поле",
    fieldCleared: (field) => `Поле ${field} из ${SERIES_FIELDS} пройдено`,
    seriesCleared: "Серия пройдена",
    fieldScore: "Очки на поле",
    seriesScore: "Всего очков",
    averagePerField: "Среднее за поле",
    tapToStart: "Нажмите, чтобы начать",
    startGame: "Начать игру",
    soundOn: "Включить звук",
    soundOff: "Выключить звук",
    musicOn: "Включить музыку",
    musicOff: "Выключить музыку",
    helpOpen: "Помощь",
    helpTitle: "Как играть",
    helpDescription: "Удерживай шар, чтобы лопнуть группу одного цвета: чем больше группа, тем больше очков. Последовательное схлопывание нескольких групп от трёх шаров подряд даёт комбо и дополнительные очки. Радужный шар присоединяется к группе любого цвета; если удерживать его отдельно, лопается только он. Камни нельзя лопнуть: они падают только вниз и появляются на полях 3, 4 и 5. В зачёт идёт среднее количество очков за серию из пяти полей.",
    switchLanguage: "Switch to English",
    recordsTitle: "Рекорды",
    recordsHint: `Среднее за поле в серии из ${SERIES_FIELDS} полей`,
    openRecords: "Таблица рекордов",
    noRecords: "Пока нет результатов",
    allTime: "За всё время",
    thisMonth: "За этот месяц",
    newRecord: "Новый рекорд!",
    close: "Закрыть",
  },
  en: {
    score: "SCORE",
    field: "FIELD",
    average: "AVERAGE",
    combo: "COMBO",
    lastMove: "LAST MOVE",
    lastMoveEmpty: "Points appear after your first move",
    lastMoveGroup: (size) => (size === 1 ? "Single bubble" : `Group of ${size}`),
    lastMoveCombo: (level) => `COMBO x${level}`,
    restart: "Restart",
    undo: "Undo",
    again: "New series",
    nextField: "Next field",
    fieldCleared: (field) => `Field ${field} of ${SERIES_FIELDS} cleared`,
    seriesCleared: "Series cleared",
    fieldScore: "Field score",
    seriesScore: "Total score",
    averagePerField: "Average per field",
    tapToStart: "Tap to start",
    startGame: "Start game",
    soundOn: "Turn sound on",
    soundOff: "Turn sound off",
    musicOn: "Turn music on",
    musicOff: "Turn music off",
    helpOpen: "Help",
    helpTitle: "How to play",
    helpDescription: "Hold a bubble to pop a group of the same color; larger groups earn more points. Popping several groups of three or more bubbles in succession creates a combo and awards bonus points. A rainbow bubble joins a group of any color; if held by itself, only it pops. Stones cannot be popped: they only fall straight down and appear on fields 3, 4, and 5. Your result is the average score across all five fields.",
    switchLanguage: "Переключить на русский",
    recordsTitle: "Records",
    recordsHint: `Average per field in a ${SERIES_FIELDS}-field series`,
    openRecords: "Leaderboard",
    noRecords: "No results yet",
    allTime: "All time",
    thisMonth: "This month",
    newRecord: "New record!",
    close: "Close",
  },
};
