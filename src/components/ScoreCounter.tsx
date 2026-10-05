import { Platform, StyleSheet, Text, View } from "react-native";
import { BUBBLE_COLORS } from "../theme/colors";

type ScoreCounterProps = {
  value: number;
  fontSize?: number;
  color?: string;
};

const GAME_FONT = Platform.select({ ios: "AvenirNext-Heavy", android: "sans-serif-black", default: undefined });

export function ScoreCounter({ value, fontSize = 44, color }: ScoreCounterProps) {
  const textStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * 1.2),
    textShadowOffset: { width: 0, height: fontSize * 0.05 },
    textShadowRadius: fontSize * 0.05,
  };

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={String(value)}>
      {String(value).split("").map((digit, index) => {
        const digitColor = color ?? BUBBLE_COLORS[index % BUBBLE_COLORS.length];

        return (
          <Text key={index} style={[styles.digit, textStyle, { color: digitColor }]}>
            {digit}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    fontFamily: GAME_FONT,
    fontWeight: "900",
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(21, 61, 74, 0.32)",
  },
});
