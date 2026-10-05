import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseRecords, type RecordEntry } from "./records";

const RECORDS_KEY = "ploop-native:records:v2";

export async function loadRecords(): Promise<RecordEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(RECORDS_KEY);

    return raw ? parseRecords(JSON.parse(raw) as unknown) : [];
  } catch {
    return [];
  }
}

export async function saveRecords(records: RecordEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn("Records save failed", error);
  }
}
