import type { EndingId, EvidenceId, StoryState } from "./types";

const SAVE_KEY = "echo7.save.v1";

export type SaveData = {
  activeRun: StoryState | null;
  discoveredEndings: EndingId[];
  discoveredEvidence: EvidenceId[];
  completedRuns: number;
  sound: boolean;
};

export const emptySave: SaveData = {
  activeRun: null,
  discoveredEndings: [],
  discoveredEvidence: [],
  completedRuns: 0,
  sound: false,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave;
    return { ...emptySave, ...JSON.parse(raw) };
  } catch {
    return emptySave;
  }
}

export function writeSave(save: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // The story remains playable in memory when storage is unavailable.
  }
}
