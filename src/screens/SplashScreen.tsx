import { useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SPLASH_MUSIC_AUDIO } from "../assets/audio";
import { BubbleBoard } from "../components/BubbleBoard";
import { PloopLogo } from "../components/PloopLogo";
import { applyGravity, generateBoard, popCells } from "../game/engine";
import type { Board } from "../game/types";
import { STRINGS, type Language } from "../i18n/strings";

const EMPTY_MOVEMENTS = {};

type SplashScreenProps = {
  language: Language;
  onFinish: () => void;
};

// Поле «в процессе игры»: часть шариков уже лопнула и осела.
function createBackdropBoard(): Board {
  const board = generateBoard();
  const poppedCells = board.flat().filter(() => Math.random() < 0.35);

  return applyGravity(popCells(board, poppedCells));
}

export function SplashScreen({ language, onFinish }: SplashScreenProps) {
  const strings = STRINGS[language];
  const [backdropBoard] = useState(createBackdropBoard);
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const musicPlayer = useAudioPlayer(SPLASH_MUSIC_AUDIO);

  useEffect(() => {
    musicPlayer.loop = true;
    musicPlayer.volume = 0.5;
    musicPlayer.play();
  }, [musicPlayer]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [contentOpacity, logoScale]);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={strings.startGame} onPress={onFinish} style={styles.container}>
      <View pointerEvents="none" style={styles.backdrop}>
        <BubbleBoard board={backdropBoard} disabled movementById={EMPTY_MOVEMENTS} onHoldCell={() => undefined} />
      </View>
      <View pointerEvents="none" style={styles.veil} />

      <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
        <View style={styles.logoArea}>
          <Animated.View style={{ opacity: contentOpacity, transform: [{ scale: logoScale }] }}>
            <PloopLogo fontSize={92} />
          </Animated.View>
        </View>
        <Animated.Text style={[styles.hint, { opacity: contentOpacity }]}>{strings.tapToStart}</Animated.Text>
        <Animated.Text style={[styles.slogan, { opacity: contentOpacity }]}>Don't panic! Pop and keep calm</Animated.Text>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#F6FBF8",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transform: [{ scale: 1.35 }],
    filter: [{ blur: 6 }],
  },
  veil: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(246, 251, 248, 0.35)",
  },
  content: {
    flex: 1,
    alignItems: "center",
  },
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    paddingBottom: 14,
    color: "#4F7B80",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  slogan: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    color: "#246A63",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
