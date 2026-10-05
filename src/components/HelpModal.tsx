import { Modal, Pressable, StyleSheet, Text } from "react-native";
import type { Strings } from "../i18n/strings";

type HelpModalProps = {
  visible: boolean;
  strings: Strings;
  onClose: () => void;
};

export function HelpModal({ visible, strings, onClose }: HelpModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel={strings.close} onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>{strings.helpTitle}</Text>
          <Text style={styles.description}>{strings.helpDescription}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{strings.close}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(21, 61, 74, 0.45)",
  },
  card: {
    alignSelf: "stretch",
    gap: 12,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: "#153D4A",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    color: "#42666B",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  closeButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#438E90",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
