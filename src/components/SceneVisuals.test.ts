import { describe, expect, it } from "vitest";
import { scenes } from "../story/data";
import { getTransitionKind, sceneTheme } from "./SceneVisuals";

describe("scene presentation", () => {
  it("gives every story scene its own visual theme", () => {
    const themes = Object.values(scenes).map((scene) => sceneTheme(scene.id));
    expect(new Set(themes).size).toBe(Object.keys(scenes).length);
  });

  it("maps representative choices to meaningful cinematics", () => {
    expect(getTransitionKind(scenes.S1.choices[1])).toBe("decode");
    expect(getTransitionKind(scenes.S2R.choices[0])).toBe("transmit");
    expect(getTransitionKind(scenes.S3N.choices[2])).toBe("isolate");
    expect(getTransitionKind(scenes.S4C.choices[1])).toBe("overload");
    expect(getTransitionKind(scenes.S4T.choices[1])).toBe("loop");
  });
});
