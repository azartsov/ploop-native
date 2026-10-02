import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import type { Cell } from "../game/types";
import { BUBBLE_COLORS, RAINBOW_COLORS } from "../theme/colors";

const HOLD_DURATION_MS = 400;

type BubbleProps = {
  cell: Cell;
  size: number;
  disabled: boolean;
  fallDistance: number;
  rollDistance: number;
  fallStep: number;
  onHold: (cell: Cell) => void;
};

export function Bubble({ cell, size, disabled, fallDistance, rollDistance, fallStep, onHold }: BubbleProps) {
  const [isHolding, setIsHolding] = useState(false);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const fallTranslateY = useRef(new Animated.Value(0)).current;
  const rollTranslateX = useRef(new Animated.Value(0)).current;
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

  if (cell.color === null) {
    return <View style={[styles.empty, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  function clearHold() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    holdProgress.stopAnimation();
    holdProgress.setValue(0);
    setIsHolding(false);
  }

  function handlePressIn() {
    didHoldRef.current = false;
    setIsHolding(true);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    }).start();
    timeoutRef.current = setTimeout(() => {
      didHoldRef.current = true;
      onHold(cell);
      clearHold();
    }, HOLD_DURATION_MS);
  }

  function handlePressOut() {
    if (!didHoldRef.current) {
      clearHold();
    }
  }

  const bubbleStyle = [styles.bubble, { width: size, height: size, borderRadius: size / 2 }];
  const content = cell.color === "rainbow" ? (
    <LinearGradient colors={RAINBOW_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={bubbleStyle}>
      <View style={styles.highlight} />
    </LinearGradient>
  ) : (
    <View style={[bubbleStyle, { backgroundColor: BUBBLE_COLORS[cell.color] }]}>
      <View style={styles.highlight} />
    </View>
  );

  return (
    <Pressable disabled={disabled} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.pressable, { width: size, height: size }]} accessibilityRole="button" accessibilityLabel="Пузырь">
      <Animated.View style={{ transform: [{ translateX: rollTranslateX }, { translateY: fallTranslateY }] }}>
        {content}
        {isHolding ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.holdRing,
              {
                width: holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0, size] }),
                height: holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0, size] }),
                borderRadius: size / 2,
              },
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
  holdRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#153D4A",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
});