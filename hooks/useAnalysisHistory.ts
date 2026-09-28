"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ANALYSIS_HISTORY_SCHEMA_VERSION,
  ANALYSIS_HISTORY_STORAGE_KEY,
  addAnalysisHistoryEntry,
  createEmptyAnalysisHistory,
  deleteAnalysisHistory,
  loadAnalysisHistory,
  parseAnalysisHistory,
  removeAnalysisHistoryEntry,
  saveAnalysisHistory,
  type AnalysisHistoryEnvelope,
  type AnalysisHistoryEntry,
  type AnalysisHistoryError,
  type SuccessfulUserAnalysisHistoryInput,
} from "@/lib/analysis-history";

export interface UseAnalysisHistoryResult {
  readonly enabled: boolean;
  readonly items: AnalysisHistoryEntry[];
  readonly error: AnalysisHistoryError | null;
  readonly isHydrated: boolean;
  readonly enable: () => void;
  readonly add: (input: SuccessfulUserAnalysisHistoryInput) => void;
  readonly remove: (id: string) => void;
  readonly clear: () => void;
  readonly disable: () => void;
}

interface HistorySnapshot {
  readonly enabled: boolean;
  readonly items: AnalysisHistoryEntry[];
  readonly error: AnalysisHistoryError | null;
  readonly isHydrated: boolean;
}

const SERVER_SNAPSHOT: HistorySnapshot = {
  enabled: false,
  items: [],
  error: null,
  isHydrated: false,
};

let snapshot = SERVER_SNAPSHOT;
let hasHydrated = false;
const listeners = new Set<() => void>();

function emit(nextSnapshot: HistorySnapshot) {
  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function envelopeFromSnapshot(): AnalysisHistoryEnvelope {
  return {
    version: ANALYSIS_HISTORY_SCHEMA_VERSION,
    enabled: snapshot.enabled,
    items: snapshot.items,
  };
}

function emitEnvelope(
  envelope: AnalysisHistoryEnvelope,
  historyError: AnalysisHistoryError | null = null,
) {
  emit({
    enabled: envelope.enabled,
    items: [...envelope.items],
    error: historyError,
    isHydrated: true,
  });
}

function commit(envelope: AnalysisHistoryEnvelope) {
  const saved = saveAnalysisHistory(envelope);

  if (!saved.ok) {
    emit({ ...snapshot, error: saved.error, isHydrated: true });
    return false;
  }

  emitEnvelope(saved.value);
  return true;
}

function hydrateHistory() {
  if (hasHydrated) {
    return;
  }

  hasHydrated = true;
  const loaded = loadAnalysisHistory();

  if (!loaded.ok) {
    emit({ ...SERVER_SNAPSHOT, error: loaded.error, isHydrated: true });
    return;
  }

  if (loaded.changed) {
    const cleaned = saveAnalysisHistory(loaded.value);

    if (!cleaned.ok) {
      emitEnvelope(loaded.value, cleaned.error);
      return;
    }

    emitEnvelope(cleaned.value);
    return;
  }

  emitEnvelope(loaded.value);
}

function ensureHydrated() {
  if (!hasHydrated) {
    hydrateHistory();
  }
}

function handleStorage(event: StorageEvent) {
  if (event.key !== ANALYSIS_HISTORY_STORAGE_KEY) {
    return;
  }

  try {
    if (event.storageArea && event.storageArea !== window.localStorage) {
      return;
    }
  } catch {
    return;
  }

  hasHydrated = true;
  const parsed = parseAnalysisHistory(event.newValue);

  if (!parsed.ok) {
    emit({ ...snapshot, error: parsed.error, isHydrated: true });
    return;
  }

  if (parsed.changed) {
    const cleaned = saveAnalysisHistory(parsed.value);
    emitEnvelope(parsed.value, cleaned.ok ? null : cleaned.error);
    return;
  }

  emitEnvelope(parsed.value);
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function enable() {
  ensureHydrated();
  commit({
    version: ANALYSIS_HISTORY_SCHEMA_VERSION,
    enabled: true,
    items: snapshot.enabled ? snapshot.items : [],
  });
}

function add(input: SuccessfulUserAnalysisHistoryInput) {
  ensureHydrated();
  const next = addAnalysisHistoryEntry(envelopeFromSnapshot(), input);

  if (!next.ok) {
    emit({ ...snapshot, error: next.error, isHydrated: true });
    return;
  }

  if (next.changed) {
    commit(next.value);
  }
}

function remove(id: string) {
  ensureHydrated();
  const current = envelopeFromSnapshot();
  const next = removeAnalysisHistoryEntry(current, id);

  if (next !== current) {
    commit(next);
  }
}

function clear() {
  ensureHydrated();

  if (snapshot.items.length === 0) {
    return;
  }

  commit({
    version: ANALYSIS_HISTORY_SCHEMA_VERSION,
    enabled: snapshot.enabled,
    items: [],
  });
}

function disable() {
  ensureHydrated();
  const deleted = deleteAnalysisHistory();

  if (!deleted.ok) {
    emit({ ...snapshot, error: deleted.error, isHydrated: true });
    return;
  }

  emitEnvelope(createEmptyAnalysisHistory());
}

export function useAnalysisHistory(): UseAnalysisHistoryResult {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateHistory();
  }, []);

  return {
    ...current,
    enable,
    add,
    remove,
    clear,
    disable,
  };
}
