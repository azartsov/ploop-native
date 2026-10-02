import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { RecordEntry } from "../game/records";
import type { Strings } from "../i18n/strings";
import { RecordsTable } from "./RecordsTable";

type RecordsModalProps = {
  visible: boolean;
  records: RecordEntry[];
  strings: Strings;
  onClose: () => void;
};

export function RecordsModal({ visible, records, strings, onClose }: RecordsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel={strings.close} onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>{strings.recordsTitle}</Text>
          <RecordsTable records={records} highlightId={null} strings={strings} />
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
