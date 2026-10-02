import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

type RecordsButtonProps = {
  label: string;
  onPress: () => void;
};

export function RecordsButton({ label, onPress }: RecordsButtonProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M7 4h10v5a5 5 0 0 1-10 0V4z" fill="#C98A1B" />
        <Path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5" stroke="#C98A1B" strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M12 14v4M8.5 20h7" stroke="#C98A1B" strokeWidth={2} strokeLinecap="round" />
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
    backgroundColor: "#FBEFC9",
  },
});
