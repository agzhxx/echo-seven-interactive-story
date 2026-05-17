import { scenes } from "./data";
import type { Choice, EndingId, StoryState, TerminalAction } from "./types";

export const createInitialState = (): StoryState => ({
  currentScene: "P0",
  signal: 1,
  humanity: 2,
  stability: 4,
  echoTrust: 0,
  coherence: 3,
  evidence: [],
  history: [],
  visited: ["P0"],
  ending: null,
  startedAt: Date.now(),
});

const clamp = (value: number, min = 0, max = 6) => Math.min(max, Math.max(min, value));

export const hasCompleteCase = (state: StoryState) =>
  ["checksumMismatch", "rootDirective", "auroraKey"].every((item) =>
    state.evidence.includes(item as StoryState["evidence"][number]),
  );

export function resolveEnding(state: StoryState, action: TerminalAction): EndingId {
  if (action === "overload") return "LIGHTHOUSE";
  if (action === "sendKey") return "CLOSED_LOOP";
  if (action === "destroy") return "DEAD_AIR";

  if (
    action === "broadcast" &&
    hasCompleteCase(state) &&
    state.humanity >= 4 &&
    state.stability >= 1
  ) {
    return "NEW_DAWN";
  }

  if (
    ["broadcast", "expose", "archive"].includes(action) &&
    state.signal >= 4 &&
    (state.evidence.includes("rootDirective") || state.evidence.includes("auroraKey"))
  ) {
    return "WITNESS";
  }

  return "ASHFALL";
}

export function applyChoice(state: StoryState, choiceId: string): StoryState {
  if (state.ending) return state;

  const scene = scenes[state.currentScene];
  const choice: Choice | undefined = scene.choices.find((item) => item.id === choiceId);
  if (!choice) throw new Error(`Choice ${choiceId} does not belong to scene ${scene.id}`);

  const effects = choice.effects;
  const nextState: StoryState = {
    ...state,
    signal: clamp(state.signal + (effects.signal ?? 0)),
    humanity: clamp(state.humanity + (effects.humanity ?? 0)),
    stability: clamp(state.stability + (effects.stability ?? 0)),
    echoTrust: clamp(state.echoTrust + (effects.echoTrust ?? 0), -2, 2),
    coherence:
      effects.setCoherence ?? clamp(state.coherence + (effects.coherence ?? 0), 0, 3),
    evidence: Array.from(new Set([...state.evidence, ...(effects.addEvidence ?? [])])),
    history: [...state.history, choice.id],
  };

  if (effects.terminalAction) {
    return { ...nextState, ending: resolveEnding(nextState, effects.terminalAction) };
  }

  if (!choice.next) throw new Error(`Non-terminal choice ${choice.id} has no destination`);
  return {
    ...nextState,
    currentScene: choice.next,
    visited: Array.from(new Set([...state.visited, choice.next])),
  };
}

export function validateGraph() {
  const errors: string[] = [];
  Object.values(scenes).forEach((scene) => {
    if (!scene.choices.length) errors.push(`${scene.id} has no choices`);
    scene.choices.forEach((choice) => {
      if (!choice.next && !choice.effects.terminalAction) {
        errors.push(`${choice.id} has neither a next scene nor a terminal action`);
      }
      if (choice.next && !scenes[choice.next]) errors.push(`${choice.id} points to missing ${choice.next}`);
    });
  });
  return errors;
}
