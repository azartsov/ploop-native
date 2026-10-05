import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BUBBLE_POP_AUDIO } from "./src/assets/audio";
import { PloopGameScreen } from "./src/screens/PloopGameScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import type { Language } from "./src/i18n/strings";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [language, setLanguage] = useState<Language>("ru");
  const popPlayer = useAudioPlayer(BUBBLE_POP_AUDIO, { keepAudioSessionActive: true });

  useEffect(() => {
    let audioModeReady = false;
    let isPriming = false;
    let isPrimed = false;
    let isCancelled = false;

    const startPriming = () => {
      if (!audioModeReady || !popPlayer.isLoaded || isPriming || isPrimed) {
        return;
      }

      isPriming = true;
      popPlayer.volume = 0;
      popPlayer.play();
    };

    const subscription = popPlayer.addListener("playbackStatusUpdate", (status) => {
      if (status.isLoaded) {
        startPriming();
      }

      if (isPriming && status.didJustFinish) {
        popPlayer.pause();
        void popPlayer.seekTo(0).catch(() => undefined).finally(() => {
          if (!isCancelled) {
            isPriming = false;
            isPrimed = true;
            popPlayer.volume = 0.6;
          }
        });
      }
    });

    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      interruptionMode: "mixWithOthers",
    }).then(() => {
      audioModeReady = true;
      startPriming();
    });

    return () => {
      isCancelled = true;
      subscription.remove();
    };
  }, [popPlayer]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {showSplash ? (
        <SplashScreen language={language} onFinish={() => setShowSplash(false)} />
      ) : (
        <PloopGameScreen popPlayer={popPlayer} language={language} onToggleLanguage={() => setLanguage((current) => (current === "ru" ? "en" : "ru"))} />
      )}
    </SafeAreaProvider>
  );
}
