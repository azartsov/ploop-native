import { StyleSheet, View, useWindowDimensions } from "react-native";

const FIELD_THEMES = [
  { background: "#E8F5F0", accent: "#278C61", pattern: "sprinkles" },
  { background: "#FFF3E5", accent: "#C56A1A", pattern: "ribbons" },
  { background: "#EAF4FC", accent: "#356EAF", pattern: "orbit" },
  { background: "#FCEEF3", accent: "#B84873", pattern: "sparks" },
  { background: "#F3F0FB", accent: "#7048B1", pattern: "bubbles" },
] as const;

type FieldTheme = (typeof FIELD_THEMES)[number];

function Pattern({ theme, width, height }: { theme: FieldTheme; width: number; height: number }) {
  if (theme.pattern === "ribbons") {
    return (
      <View style={styles.patternLayer}>
        <View style={{ position: "absolute", top: height * 0.245, left: -width * 0.12, width: width * 0.62, height: 15, borderRadius: 40, backgroundColor: theme.accent, opacity: 0.26, transform: [{ rotate: "-12deg" }] }} />
        <View style={{ position: "absolute", top: height * 0.27, right: -width * 0.18, width: width * 0.48, height: 8, borderRadius: 40, backgroundColor: theme.accent, opacity: 0.22, transform: [{ rotate: "-12deg" }] }} />
        <View style={{ position: "absolute", top: height * 0.705, right: -width * 0.08, width: width * 0.72, height: 17, borderRadius: 40, backgroundColor: theme.accent, opacity: 0.25, transform: [{ rotate: "-15deg" }] }} />
        <View style={{ position: "absolute", top: height * 0.745, left: width * 0.14, width: width * 0.24, height: 7, borderRadius: 40, backgroundColor: theme.accent, opacity: 0.22, transform: [{ rotate: "-15deg" }] }} />
      </View>
    );
  }

  if (theme.pattern === "orbit") {
    return (
      <View style={styles.patternLayer}>
        <View style={{ position: "absolute", left: -width * 0.27, top: height * 0.21, width: width * 0.56, height: width * 0.56, borderRadius: width, borderWidth: 4, borderColor: theme.accent, opacity: 0.28 }} />
        <View style={{ position: "absolute", left: -width * 0.17, top: height * 0.235, width: width * 0.36, height: width * 0.36, borderRadius: width, borderWidth: 3, borderColor: theme.accent, opacity: 0.3 }} />
        <View style={{ position: "absolute", right: -width * 0.3, top: height * 0.69, width: width * 0.58, height: width * 0.58, borderRadius: width, borderWidth: 4, borderColor: theme.accent, opacity: 0.28 }} />
        <View style={{ position: "absolute", right: -width * 0.15, top: height * 0.72, width: width * 0.28, height: width * 0.28, borderRadius: width, borderWidth: 3, borderColor: theme.accent, opacity: 0.3 }} />
      </View>
    );
  }

  if (theme.pattern === "sparks") {
    return (
      <View style={styles.patternLayer}>
        {[[0.06, 0.25, 1.2], [0.24, 0.28, 0.7], [0.84, 0.26, 1.1], [0.11, 0.72, 0.8], [0.7, 0.745, 0.7], [0.94, 0.71, 1.25], [0.52, 0.29, 0.6]].map(([x, y, scale], index) => {
          const size = 24 * scale;
          return (
            <View key={index} style={{ position: "absolute", left: width * x, top: height * y, width: size, height: size, alignItems: "center", justifyContent: "center", opacity: 0.25 }}>
              <View style={{ position: "absolute", width: size, height: 3, backgroundColor: theme.accent, transform: [{ rotate: "45deg" }] }} />
              <View style={{ position: "absolute", width: size, height: 3, backgroundColor: theme.accent, transform: [{ rotate: "-45deg" }] }} />
            </View>
          );
        })}
      </View>
    );
  }

  if (theme.pattern === "bubbles") {
    return (
      <View style={styles.patternLayer}>
        {[[0.02, 0.22, 54], [0.19, 0.265, 26], [0.87, 0.24, 42], [0.91, 0.29, 18], [0.08, 0.69, 24], [0.76, 0.73, 58], [0.96, 0.76, 28]].map(([x, y, size], index) => {
          const left = width * x;
          const top = height * y;

          return <View key={index} style={{ position: "absolute", left, top, width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: theme.accent, backgroundColor: `${theme.accent}16`, opacity: 0.38 }} />;
        })}
      </View>
    );
  }

  const sprinkles: Array<[number, number, number, number, number]> = [
    [0.04, 0.245, 30, 7, -25], [0.16, 0.28, 17, 6, 30], [0.78, 0.25, 34, 7, 18],
    [0.91, 0.285, 23, 6, -38], [0.06, 0.71, 25, 6, 45], [0.84, 0.735, 32, 7, -15],
    [0.28, 0.76, 21, 6, 20], [0.68, 0.24, 28, 6, -32], [0.48, 0.29, 15, 5, 55],
    [0.54, 0.73, 24, 6, -48], [0.14, 0.74, 34, 7, 12], [0.96, 0.69, 20, 6, 38],
  ];

  return (
    <View style={styles.patternLayer}>
      {sprinkles.map(([x, y, markWidth, markHeight, rotation], index) => (
        <View key={index} style={{ position: "absolute", left: width * x, top: height * y, width: markWidth, height: markHeight, borderRadius: markHeight, backgroundColor: theme.accent, opacity: 0.32, transform: [{ rotate: `${rotation}deg` }] }} />
      ))}
    </View>
  );
}

export function FieldBackdrop({ fieldNumber }: { fieldNumber: number }) {
  const { width, height } = useWindowDimensions();
  const theme = FIELD_THEMES[(fieldNumber - 1) % FIELD_THEMES.length];

  return (
    <View pointerEvents="none" style={[styles.backdrop, { backgroundColor: theme.background }]}>
      <Pattern theme={theme} width={width} height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  patternLayer: {
    ...StyleSheet.absoluteFill,
  },
});