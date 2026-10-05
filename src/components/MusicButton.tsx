import { Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type MusicButtonProps = {
  enabled: boolean;
  label: string;
  onToggle: () => void;
};

export function MusicButton({ enabled, label, onToggle }: MusicButtonProps) {
  const color = enabled ? "#246A63" : "#A04A4A";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onToggle}
      style={[styles.button, enabled ? styles.buttonOn : styles.buttonOff]}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18V5l12-2v13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={6} cy={18} r={3} fill={color} />
        <Circle cx={18} cy={16} r={3} fill={color} />
        {!enabled ? <Path d="m4 4 16 16" stroke={color} strokeWidth={2} strokeLinecap="round" /> : null}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  buttonOn: {
    backgroundColor: "#DDF4ED",
  },
  buttonOff: {
    backgroundColor: "#F6E1E1",
  },
});
