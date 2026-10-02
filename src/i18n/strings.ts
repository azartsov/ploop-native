export type Language = "ru" | "en";

export type Strings = {
  subtitle: string;
  time: string;
  taps: string;
  restart: string;
  undo: string;
  shuffle: string;
  won: string;
  again: string;
  tapToStart: string;
  startGame: string;
  soundOn: string;
  soundOff: string;
  switchLanguage: string;
  recordsTitle: string;
  openRecords: string;
  noRecords: string;
  newRecord: string;
  close: string;
  tapsCount: (count: number) => string;
};

function pluralizeRu(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return "нажатие";
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return "нажатия";
  }

  return "нажатий";
}

export const STRINGS: Record<Language, Strings> = {
  ru: {
    subtitle: "Пузырьковый дзен",
    time: "ВРЕМЯ",
    taps: "НАЖАТИЯ",
    restart: "Заново",
    undo: "Отмена",
    shuffle: "Перемешать",
    won: "Готово",
    again: "Ещё раз",
    tapToStart: "Нажмите, чтобы начать",
    startGame: "Начать игру",
    soundOn: "Включить звук",
    soundOff: "Выключить звук",
    switchLanguage: "Switch to English",
    recordsTitle: "Рекорды",
    openRecords: "Таблица рекордов",
    noRecords: "Пока нет результатов",
    newRecord: "Новый рекорд!",
    close: "Закрыть",
    tapsCount: (count) => `${count} ${pluralizeRu(count)}`,
  },
  en: {
    subtitle: "Bubble zen",
    time: "TIME",
    taps: "TAPS",
    restart: "Restart",
    undo: "Undo",
    shuffle: "Shuffle",
    won: "Cleared",
    again: "Play again",
    tapToStart: "Tap to start",
    startGame: "Start game",
    soundOn: "Turn sound on",
    soundOff: "Turn sound off",
    switchLanguage: "Переключить на русский",
    recordsTitle: "Records",
    openRecords: "Leaderboard",
    noRecords: "No results yet",
    newRecord: "New record!",
    close: "Close",
    tapsCount: (count) => `${count} ${count === 1 ? "tap" : "taps"}`,
  },
};
