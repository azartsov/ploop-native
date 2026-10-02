import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PloopGameScreen } from "./src/screens/PloopGameScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import type { Language } from "./src/i18n/strings";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [language, setLanguage] = useState<Language>("ru");

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {showSplash ? (
        <SplashScreen language={language} onFinish={() => setShowSplash(false)} />
      ) : (
        <PloopGameScreen language={language} onToggleLanguage={() => setLanguage((current) => (current === "ru" ? "en" : "ru"))} />
      )}
    </SafeAreaProvider>
  );
}
