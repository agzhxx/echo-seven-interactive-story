import { describe, expect, it } from "vitest";
import { scenes } from "./data";
import { applyChoice, createInitialState, validateGraph } from "./engine";
import type { EndingId, SceneId, StoryState } from "./types";

function play(choiceIds: string[]) {
  return choiceIds.reduce((state, choiceId) => applyChoice(state, choiceId), createInitialState());
}

describe("story graph", () => {
  it("contains no dangling choices", () => {
    expect(validateGraph()).toEqual([]);
  });

  it("has exactly 36 complete decision paths", () => {
    const completed: StoryState[] = [];
    const walk = (state: StoryState) => {
      const scene = scenes[state.currentScene];
      scene.choices.forEach((choice) => {
        const next = applyChoice(state, choice.id);
        if (next.ending) completed.push(next);
        else walk(next);
      });
    };
    walk(createInitialState());
    expect(completed).toHaveLength(36);
    expect(new Set(completed.map((state) => state.ending))).toEqual(
      new Set<EndingId>(["NEW_DAWN", "WITNESS", "LIGHTHOUSE", "CLOSED_LOOP", "ASHFALL", "DEAD_AIR"]),
    );
  });

  it("reaches A New Dawn through the complete-case route", () => {
    const state = play(["P0_LOCK", "S1_MANUAL", "S2M_AUDIT", "S3A_COOPERATE", "S4C_BROADCAST"]);
    expect(state.ending).toBe("NEW_DAWN");
  });

  it("reaches Closed Loop when the key is sent", () => {
    const state = play(["P0_LOCK", "S1_TRUST_ECHO", "S2E_ACCEPT", "S3N_TEST", "S4T_KEY"]);
    expect(state.ending).toBe("CLOSED_LOOP");
  });

  it("rejects a choice from another scene", () => {
    expect(() => applyChoice(createInitialState(), "S1_MANUAL")).toThrow();
  });

  it("references every scene from a reachable route", () => {
    const reached = new Set<SceneId>();
    const visit = (state: StoryState) => {
      if (reached.has(state.currentScene)) return;
      reached.add(state.currentScene);
      scenes[state.currentScene].choices.forEach((choice) => {
        const next = applyChoice(state, choice.id);
        if (!next.ending) visit(next);
      });
    };
    visit(createInitialState());
    expect(reached).toEqual(new Set(Object.keys(scenes) as SceneId[]));
  });
});
