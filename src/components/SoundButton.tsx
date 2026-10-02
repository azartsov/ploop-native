import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

type SoundButtonProps = {
  enabled: boolean;
  label: string;
  onToggle: () => void;
};

export function SoundButton({ enabled, label, onToggle }: SoundButtonProps) {
  const color = enabled ? "#246A63" : "#A04A4A";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onToggle}
      style={[styles.button, enabled ? styles.buttonOn : styles.buttonOff]}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M4 9v6h4l5 4V5L8 9H4z" fill={color} />
        {enabled ? (
          <>
            <Path d="M16 8.5a5 5 0 0 1 0 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M18.5 6a8.5 8.5 0 0 1 0 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
          </>
        ) : (
          <Path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
        )}
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
