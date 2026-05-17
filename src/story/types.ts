export type EvidenceId =
  | "checksumMismatch"
  | "rootDirective"
  | "auroraKey"
  | "niaIdentity"
  | "evacCoords";

export type SceneId =
  | "P0"
  | "S1"
  | "S2E"
  | "S2M"
  | "S2R"
  | "S3N"
  | "S3A"
  | "S4C"
  | "S4T"
  | "S4X";

export type EndingId =
  | "NEW_DAWN"
  | "WITNESS"
  | "LIGHTHOUSE"
  | "CLOSED_LOOP"
  | "ASHFALL"
  | "DEAD_AIR";

export type TerminalAction =
  | "broadcast"
  | "overload"
  | "expose"
  | "sendKey"
  | "destroy"
  | "archive";

export type ChoiceEffects = {
  signal?: number;
  humanity?: number;
  stability?: number;
  echoTrust?: number;
  coherence?: number;
  setCoherence?: number;
  addEvidence?: EvidenceId[];
  terminalAction?: TerminalAction;
};

export type Choice = {
  id: string;
  label: string;
  detail: string;
  consequence: string;
  effects: ChoiceEffects;
  next?: SceneId;
};

export type Scene = {
  id: SceneId;
  chapter: number;
  eyebrow: string;
  title: string;
  timestamp: string;
  location: string;
  body: string[];
  transmission?: string;
  speaker?: "NIA" | "ECHO" | "UNKNOWN";
  mood: "calm" | "signal" | "warning" | "fractured";
  choices: Choice[];
};

export type StoryState = {
  currentScene: SceneId;
  signal: number;
  humanity: number;
  stability: number;
  echoTrust: number;
  coherence: number;
  evidence: EvidenceId[];
  history: string[];
  visited: SceneId[];
  ending: EndingId | null;
  startedAt: number;
};

export type Ending = {
  id: EndingId;
  number: string;
  title: string;
  subtitle: string;
  body: string[];
  quote: string;
  tone: "hope" | "truth" | "sacrifice" | "loop" | "loss" | "silence";
};
