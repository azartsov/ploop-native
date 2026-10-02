import { StyleSheet, Text, View } from "react-native";
import { formatDuration } from "../game/format";
import { MAX_RECORDS, type RecordEntry } from "../game/records";
import type { Strings } from "../i18n/strings";

type RecordsTableProps = {
  records: RecordEntry[];
  highlightId: string | null;
  strings: Strings;
};

const MEDAL_COLORS = ["#F4D35E", "#C9D3D6", "#E9A56B"];

export function RecordsTable({ records, highlightId, strings }: RecordsTableProps) {
  if (records.length === 0) {
    return <Text style={styles.empty}>{strings.noRecords}</Text>;
  }

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.headerText, styles.placeColumn]}>#</Text>
        <Text style={[styles.headerText, styles.valueColumn]}>{strings.taps}</Text>
        <Text style={[styles.headerText, styles.valueColumn]}>{strings.time}</Text>
      </View>
      {records.slice(0, MAX_RECORDS).map((record, index) => (
        <View key={record.id} style={[styles.row, styles.bodyRow, record.id === highlightId ? styles.highlightRow : null]}>
          <View style={styles.placeColumn}>
            <View style={[styles.place, index < 3 ? { backgroundColor: MEDAL_COLORS[index] } : null]}>
              <Text style={styles.placeText}>{index + 1}</Text>
            </View>
          </View>
          <Text style={[styles.valueText, styles.valueColumn]}>{record.taps}</Text>
          <Text style={[styles.valueText, styles.valueColumn]}>{formatDuration(record.timeMs)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    alignSelf: "stretch",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  bodyRow: {
    minHeight: 34,
    borderRadius: 8,
  },
  highlightRow: {
    backgroundColor: "#DDF4ED",
  },
  placeColumn: {
    width: 40,
    alignItems: "flex-start",
  },
  valueColumn: {
    flex: 1,
    textAlign: "center",
  },
  headerText: {
    paddingBottom: 6,
    color: "#66868A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  place: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  placeText: {
    color: "#153D4A",
    fontSize: 12,
    fontWeight: "800",
  },
  valueText: {
    color: "#153D4A",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  empty: {
    paddingVertical: 16,
    color: "#66868A",
    fontSize: 14,
    textAlign: "center",
  },
});
