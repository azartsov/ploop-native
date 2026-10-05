import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import type { BubbleColor } from "../game/types";
import { BUBBLE_COLORS, RAINBOW_COLORS } from "../theme/colors";

export const POP_GROW_MS = 110;
export const POP_BURST_MS = 400;

const PARTICLE_COUNT = 9;
const GROW_SCALE = 1.3;

export type PopEffectParticle = {
  dxRatio: number;
  dyRatio: number;
  diameterRatio: number;
};

export type PopEffectData = {
  id: string;
  row: number;
  col: number;
  color: Exclude<BubbleColor, null | "stone">;
  particles: PopEffectParticle[];
};

type PopEffectProps = {
  color: Exclude<BubbleColor, null | "stone">;
  size: number;
  particles: PopEffectParticle[];
};

export function createPopEffectParticles(): PopEffectParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 0.8 + Math.random() * 0.7;

    return {
      dxRatio: Math.cos(angle) * distance,
      dyRatio: Math.sin(angle) * distance,
      diameterRatio: 0.18 + Math.random() * 0.14,
    };
  });
}

export function PopEffect({ color, size, particles }: PopEffectProps) {
  const grow = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(grow, { toValue: 1, duration: POP_GROW_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(burst, { toValue: 1, duration: POP_BURST_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [burst, grow]);

  const ghostStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: burst.interpolate({ inputRange: [0, 0.12], outputRange: [1, 0], extrapolate: "clamp" }),
    transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [1, GROW_SCALE] }) }],
  };

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Animated.View style={[styles.ghost, ghostStyle, color === "rainbow" ? null : { backgroundColor: BUBBLE_COLORS[color] }]}>
        {color === "rainbow" ? <LinearGradient colors={RAINBOW_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill} /> : null}
        <View style={styles.highlight} />
      </Animated.View>
      {particles.map((particle, index) => {
        const diameter = size * particle.diameterRatio;
        const particleColor = color === "rainbow" ? RAINBOW_COLORS[index % RAINBOW_COLORS.length] : BUBBLE_COLORS[color];

        return (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              left: (size - diameter) / 2,
              top: (size - diameter) / 2,
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor: particleColor,
              opacity: burst.interpolate({ inputRange: [0, 0.01, 0.65, 1], outputRange: [0, 1, 0.85, 0] }),
              transform: [
                { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, particle.dxRatio * size] }) },
                { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, particle.dyRatio * size] }) },
                { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ghost: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
  },
  fill: {
    flex: 1,
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
});
