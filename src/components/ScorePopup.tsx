import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

export const SCORE_POPUP_MS = 1300;

export type ScorePopupData = {
  id: string;
  // Клетка, над которой появляется надпись; координаты могут быть дробными (центр группы).
  row: number;
  col: number;
  text: string;
  fontSize: number;
  color: string;
  // Сдвиг вверх в долях размера пузырька, чтобы надписи не накладывались.
  lift: number;
  delayMs: number;
  // Тёмная плашка с рамкой делает надпись читаемой на любом цвете шариков.
  badge: boolean;
};

type ScorePopupProps = Pick<ScorePopupData, "text" | "fontSize" | "color" | "delayMs" | "badge">;

export function ScorePopup({ text, fontSize, color, delayMs, badge }: ScorePopupProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: SCORE_POPUP_MS, delay: delayMs, easing: Easing.out(Easing.cubic), useNativeDriver: true });

    animation.start();

    return () => animation.stop();
  }, [delayMs, progress]);

  return (
    <Animated.View
      style={[
        badge ? styles.badge : null,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.001, 0.12, 0.7, 1], outputRange: [0, 1, 1, 1, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -fontSize * 1.6] }) },
            { scale: progress.interpolate({ inputRange: [0, 0.12, 0.25, 1], outputRange: [0.4, 1.25, 1, 1] }) },
          ],
        },
      ]}
    >
      <Text numberOfLines={1} style={[styles.text, { color, fontSize }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#153D4A",
  },
  text: {
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
    textShadowColor: "#153D4A",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
