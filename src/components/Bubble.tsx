import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Cell } from "../game/types";
import { BUBBLE_COLORS, RAINBOW_COLORS } from "../theme/colors";

export const HOLD_DURATION_MS = 400;

const HIGHLIGHT_SCALE = 1.08;

// Радужный шарик внутри группы подсвечивается отдельным золотым пульсирующим кольцом.
export type BubbleHighlight = "group" | "rainbow";

type BubbleProps = {
  cell: Cell;
  size: number;
  disabled: boolean;
  highlight?: BubbleHighlight;
  fallDistance: number;
  rollDistance: number;
  fallStep: number;
  onPressStart: (cell: Cell) => void;
  onPressCancel: () => void;
  onHold: (cell: Cell) => void;
};

export function Bubble({ cell, size, disabled, highlight, fallDistance, rollDistance, fallStep, onPressStart, onPressCancel, onHold }: BubbleProps) {
  const fallTranslateY = useRef(new Animated.Value(0)).current;
  const rollTranslateX = useRef(new Animated.Value(0)).current;
  const rainbowPulse = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHoldRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (fallDistance === 0 && rollDistance === 0) {
      fallTranslateY.setValue(0);
      rollTranslateX.setValue(0);
      return;
    }

    fallTranslateY.setValue(-fallDistance * fallStep);
    rollTranslateX.setValue(-rollDistance * fallStep);
    const animation = Animated.parallel([
      Animated.timing(fallTranslateY, {
        toValue: 0,
        duration: Math.min(700, 180 + Math.max(fallDistance, Math.abs(rollDistance)) * 85),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rollTranslateX, {
        toValue: 0,
        duration: Math.min(700, 180 + Math.max(fallDistance, Math.abs(rollDistance)) * 85),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [fallDistance, fallStep, rollDistance, fallTranslateY, rollTranslateX]);

  useEffect(() => {
    if (highlight !== "rainbow") {
      return;
    }

    rainbowPulse.setValue(1);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(rainbowPulse, { toValue: 0.45, duration: 260, useNativeDriver: true }),
        Animated.timing(rainbowPulse, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [highlight, rainbowPulse]);

  if (cell.color === null) {
    return <View style={[styles.empty, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  function handlePressIn() {
    didHoldRef.current = false;
    onPressStart(cell);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      didHoldRef.current = true;
      onHold(cell);
    }, HOLD_DURATION_MS);
  }

  function handlePressOut() {
    if (didHoldRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    onPressCancel();
  }

  const bubbleStyle = [styles.bubble, { width: size, height: size, borderRadius: size / 2 }];
  const isStone = cell.color === "stone";
  const content = cell.color === "stone" ? (
    <View style={[styles.stone, { width: size, height: size, borderRadius: Math.max(4, size * 0.14) }]}>
      <LinearGradient colors={["#292D31", "#090B0D", "#202428"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stoneFill} />
      <Svg width={size} height={size} viewBox="0 0 100 100" style={styles.stoneVeins}>
        <Path d="M8 1 C24 15 10 24 27 35 S35 52 22 63 S24 82 39 99" fill="none" stroke="#070809" strokeWidth={8} />
        <Path d="M8 1 C24 15 10 24 27 35 S35 52 22 63 S24 82 39 99" fill="none" stroke="#B8C0C5" strokeOpacity={0.78} strokeWidth={3.2} />
        <Path d="M73 0 C61 14 83 22 69 36 S75 55 59 64 S60 84 76 100" fill="none" stroke="#080A0C" strokeWidth={6} />
        <Path d="M73 0 C61 14 83 22 69 36 S75 55 59 64 S60 84 76 100" fill="none" stroke="#858D93" strokeOpacity={0.82} strokeWidth={2.4} />
        <Path d="M1 77 C18 70 23 84 37 80" fill="none" stroke="#D4D9DC" strokeOpacity={0.72} strokeWidth={1.8} />
      </Svg>
    </View>
  ) : cell.color === "rainbow" ? (
    <LinearGradient colors={RAINBOW_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={bubbleStyle}>
      <View style={styles.highlight} />
    </LinearGradient>
  ) : (
    <View style={[bubbleStyle, { backgroundColor: BUBBLE_COLORS[cell.color] }]}>
      <View style={styles.highlight} />
    </View>
  );

  return (
    <Pressable disabled={disabled || isStone} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.pressable, { width: size, height: size }]} accessibilityRole="button" accessibilityLabel={isStone ? "Камень" : "Пузырь"}>
      <Animated.View style={{ transform: [{ translateX: rollTranslateX }, { translateY: fallTranslateY }, { scale: highlight ? HIGHLIGHT_SCALE : 1 }] }}>
        {content}
        {highlight && !isStone ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              highlight === "rainbow" ? styles.rainbowGlow : styles.groupGlow,
              { borderRadius: size / 2 },
              highlight === "rainbow" ? { opacity: rainbowPulse } : null,
            ]}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
    shadowColor: "#16455A",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  empty: {
    backgroundColor: "rgba(35, 107, 126, 0.08)",
  },
  stone: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#60676D",
    backgroundColor: "#101214",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  stoneFill: {
    ...StyleSheet.absoluteFill,
  },
  stoneVeins: {
    ...StyleSheet.absoluteFill,
  },
  highlight: {
    position: "absolute",
    top: "15%",
    left: "20%",
    width: "35%",
    height: "22%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.42)",
    transform: [{ rotate: "-24deg" }],
  },
  glow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 3,
  },
  groupGlow: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.38)",
  },
  rainbowGlow: {
    borderColor: "#FFB300",
    backgroundColor: "rgba(255, 244, 179, 0.6)",
  },
});
