import { StyleSheet, Text, View } from "react-native";
import { getRecordLists, type RecordEntry } from "../game/records";
import type { Strings } from "../i18n/strings";
import { ScoreCounter } from "./ScoreCounter";

type RecordsTableProps = {
  records: RecordEntry[];
  highlightId: string | null;
  currentResult?: {
    record: RecordEntry;
    allTimeRank: number;
    monthRank: number | null;
  };
  strings: Strings;
};

type RecordsListProps = {
  title: string;
  records: RecordEntry[];
  highlightId: string | null;
  currentRecord?: RecordEntry;
  currentRank?: number;
  emptyText: string;
};

const MEDAL_COLORS = ["#F4D35E", "#C9D3D6", "#E9A56B"];

function RecordsList({ title, records, highlightId, currentRecord, currentRank, emptyText }: RecordsListProps) {
  const rows = records.map((record, rank) => ({ record, rank }));

  if (currentRecord && currentRank !== undefined && !records.some((record) => record.id === currentRecord.id)) {
    rows.push({ record: currentRecord, rank: currentRank });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        rows.map(({ record, rank }) => (
          <View key={record.id} style={[styles.row, record.id === highlightId ? styles.highlightRow : null]}>
            <View style={[styles.place, rank < 3 ? { backgroundColor: MEDAL_COLORS[rank] } : styles.otherPlace]}>
              <Text style={styles.placeText}>{rank + 1}</Text>
            </View>
            <View style={styles.value}>
              <ScoreCounter value={record.average} fontSize={19} color="#246A63" />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export function RecordsTable({ records, highlightId, currentResult, strings }: RecordsTableProps) {
  const lists = getRecordLists(records, Date.now());

  return (
    <View style={styles.table}>
      <RecordsList
        title={strings.allTime}
        records={lists.allTime}
        highlightId={highlightId}
        currentRecord={currentResult?.record}
        currentRank={currentResult?.allTimeRank}
        emptyText={strings.noRecords}
      />
      <RecordsList
        title={strings.thisMonth}
        records={lists.month}
        highlightId={highlightId}
        currentRecord={currentResult?.record}
        currentRank={currentResult?.monthRank ?? undefined}
        emptyText={strings.noRecords}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    alignSelf: "stretch",
    gap: 10,
  },
  section: {
    gap: 2,
  },
  sectionTitle: {
    paddingBottom: 5,
    color: "#246A63",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  highlightRow: {
    backgroundColor: "#DDF4ED",
  },
  place: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  placeText: {
    color: "#153D4A",
    fontSize: 13,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  otherPlace: {
    backgroundColor: "#E8F3F0",
  },
  value: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    paddingVertical: 6,
    color: "#66868A",
    fontSize: 13,
    textAlign: "center",
  },
});
