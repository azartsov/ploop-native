import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { BUBBLE_COLORS, RAINBOW_COLORS } from "../theme/colors";

type PloopLogoProps = {
  fontSize: number;
};

type LogoBubbleProps = {
  size: number;
  color?: string;
};

function LogoBubble({ size, color }: LogoBubbleProps) {
  const bubbleStyle = [styles.bubble, { width: size, height: size, borderRadius: size / 2, marginTop: size * 0.2, marginHorizontal: size * 0.04 }];
  const highlight = <View style={styles.highlight} />;

  if (!color) {
    return (
      <LinearGradient colors={RAINBOW_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={bubbleStyle}>
        {highlight}
      </LinearGradient>
    );
  }

  return <View style={[bubbleStyle, { backgroundColor: color }]}>{highlight}</View>;
}

export function PloopLogo({ fontSize }: PloopLogoProps) {
  const letterStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * 1.2),
    textShadowOffset: { width: 0, height: fontSize * 0.05 },
    textShadowRadius: fontSize * 0.05,
  };
  const bubbleSize = Math.round(fontSize * 0.66);

  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="BLOOP">
      <Text style={[styles.letter, letterStyle, { color: BUBBLE_COLORS[0] }]}>B</Text>
      <Text style={[styles.letter, letterStyle, { color: BUBBLE_COLORS[1] }]}>L</Text>
      <LogoBubble size={bubbleSize} color={BUBBLE_COLORS[4]} />
      <LogoBubble size={bubbleSize} />
      <Text style={[styles.letter, letterStyle, { color: BUBBLE_COLORS[6] }]}>P</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  letter: {
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "rgba(21, 61, 74, 0.28)",
  },
  bubble: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
    shadowColor: "#16455A",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  highlight: {
    position: "absolute",
    top: "15%",
    left: "20%",
    width: "35%",
    height: "22%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    transform: [{ rotate: "-24deg" }],
  },
});
