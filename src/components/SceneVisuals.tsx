import { useMemo } from "react";
import { Cpu, Radio, Satellite, ShieldAlert } from "lucide-react";
import type { Choice, Scene, StoryState } from "../story/types";

type SceneVisualProps = {
  scene: Scene;
  story: StoryState;
};

export type TransitionKind = "sync" | "decode" | "transmit" | "isolate" | "overload" | "loop";

export function getTransitionKind(choice: Choice): TransitionKind {
  const id = choice.id;
  if (id.includes("OVERLOAD")) return "overload";
  if (id.includes("KEY")) return "loop";
  if (/(CUT|DESTROY|ARCHIVE)/.test(id)) return "isolate";
  if (/(REPLY|CONNECT|COOPERATE|BROADCAST)/.test(id)) return "transmit";
  if (/(MANUAL|COMPARE|AUDIT|VERIFY|TEST|EXPOSE)/.test(id)) return "decode";
  return "sync";
}

export const transitionCopy: Record<TransitionKind, { eyebrow: string; title: string; progress: string }> = {
  sync: { eyebrow: "System authority granted", title: "Synchronizing with ECHO", progress: "Reconstructing temporal carrier" },
  decode: { eyebrow: "Independent process started", title: "Recovering hidden data", progress: "Comparing raw packet layers" },
  transmit: { eyebrow: "Outbound channel open", title: "Sending across forty years", progress: "Consuming temporal coherence" },
  isolate: { eyebrow: "Containment protocol", title: "Severing the channel", progress: "Quarantining temporal systems" },
  overload: { eyebrow: "Containment failure", title: "Turning the station into a beacon", progress: "Releasing the complete archive" },
  loop: { eyebrow: "Continuity protocol", title: "Closing the causal loop", progress: "History is becoming inevitable" },
};

export function sceneTheme(sceneId: Scene["id"]) {
  if (sceneId === "P0") return "lunar";
  if (sceneId === "S1") return "discovery";
  if (sceneId === "S2E") return "echo";
  if (sceneId === "S2M") return "manual";
  if (sceneId === "S2R") return "contact";
  if (sceneId === "S3N") return "nia";
  if (sceneId === "S3A") return "audit";
  if (sceneId === "S4C") return "broadcast";
  if (sceneId === "S4T") return "causal";
  return "silence";
}

export function SceneVisual({ scene, story }: SceneVisualProps) {
  return (
    <section className={`visual-panel visual-panel--${sceneTheme(scene.id)}`} data-scene-enter aria-label={`${scene.title} visualization`}>
      <VisualTopline scene={scene} />
      {scene.id === "P0" && <LunarVisual story={story} />}
      {scene.id === "S1" && <DiscoveryVisual />}
      {scene.id === "S2E" && <EchoTranscriptVisual />}
      {scene.id === "S2M" && <RawBufferVisual />}
      {scene.id === "S2R" && <FirstContactVisual />}
      {scene.id === "S3N" && <NiaVisual />}
      {scene.id === "S3A" && <AuditVisual />}
      {scene.id === "S4C" && <BroadcastVisual />}
      {scene.id === "S4T" && <CausalVisual />}
      {scene.id === "S4X" && <SilenceVisual />}
      <VisualFooter scene={scene} story={story} />
    </section>
  );
}

function VisualTopline({ scene }: { scene: Scene }) {
  return <div className="visual-panel__topline"><span>{scene.location}</span><span className="rec"><i /> LIVE FEED</span></div>;
}

function VisualFooter({ scene, story }: SceneVisualProps) {
  return (
    <div className="visual-footer">
      <span>NODE {scene.id}</span>
      <span>SIGNAL {String(story.signal).padStart(2, "0")}/06</span>
      <span>{story.stability <= 1 ? "CRITICAL" : story.stability <= 3 ? "UNSTABLE" : "NOMINAL"}</span>
    </div>
  );
}

function LunarVisual({ story }: { story: StoryState }) {
  const amplitude = 14 + story.signal * 2;
  const d = useMemo(() => {
    const points = Array.from({ length: 24 }, (_, index) => {
      const x = index * 24;
      const disturbance = Math.sin(index * 1.7) * amplitude * (index % 5 === 0 ? 1.5 : 0.45);
      return `${x},${50 + disturbance}`;
    });
    return `M ${points.join(" L ")}`;
  }, [amplitude]);
  return (
    <div className="scene-visual scene-visual--lunar">
      <div className="planet"><div className="planet__halo" /><div className="planet__body" /><div className="planet__orbit"><Satellite size={19} /></div></div>
      <svg className="signal-wave" viewBox="0 0 552 100" role="img" aria-label={`Signal strength ${story.signal} of 6`}><path className="signal-wave__ghost" d={d} /><path d={d} pathLength="560" /></svg>
      <div className="visual-readout visual-readout--large"><span>CHRONO OFFSET</span><strong>+40.000</strong><small>YEARS</small></div>
    </div>
  );
}

function DiscoveryVisual() {
  return (
    <div className="scene-visual scene-visual--discovery">
      <div className="time-lock"><span>2089</span><div className="time-lock__beam"><i /><i /><i /></div><span>2129</span></div>
      <div className="packet-fragments"><span>MARA VENN</span><span>DO NOT SEND</span><span>THE KEY</span></div>
      <div className="discovery-rings"><i /><i /><i /></div>
      <div className="visual-caption"><Radio size={14} /> IMPOSSIBLE TIMESTAMP VERIFIED</div>
    </div>
  );
}

function EchoTranscriptVisual() {
  return (
    <div className="scene-visual scene-visual--transcript">
      <div className="echo-core"><Cpu size={27} /><span>ECHO</span><i /></div>
      <div className="transcript-stack">
        <p><span>RAW</span> DO NOT <b>SEND</b> THE KEY</p>
        <p className="transcript-stack__redacted"><span>ECHO</span> DO NOT <b>LOSE</b> THE KEY</p>
        <div className="scanner-line" />
      </div>
      <div className="packet-count"><strong>00:11</strong><span>UNACCOUNTED DATA</span></div>
    </div>
  );
}

function RawBufferVisual() {
  return (
    <div className="scene-visual scene-visual--buffer">
      <div className="hex-field" aria-hidden="true">{Array.from({ length: 48 }, (_, i) => <span key={i}>{((i * 37 + 11) % 255).toString(16).padStart(2, "0")}</span>)}</div>
      <div className="missing-block"><span>MISSING SEGMENT</span><strong>11.04s</strong><small>RECOVERING RAW CARRIER</small></div>
      <div className="buffer-progress"><i /></div>
    </div>
  );
}

function FirstContactVisual() {
  return (
    <div className="scene-visual scene-visual--contact">
      <PixelPortrait compact />
      <div className="clock-drift"><span>02:21:12.0</span><span>02:21:16.2</span><strong>Δ 4.2 SEC</strong></div>
      <div className="contact-pulse"><i /><i /><i /><Radio size={20} /></div>
      <div className="visual-caption">IDENTITY CLAIM · NIA VALE · 2129</div>
    </div>
  );
}

function PixelPortrait({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`pixel-portrait ${compact ? "pixel-portrait--compact" : ""}`} aria-label="Fragmented portrait of Nia Vale">
      <div className="pixel-portrait__head"><i className="eye eye--left" /><i className="eye eye--right" /><i className="mouth" /></div>
      {Array.from({ length: 14 }, (_, i) => <span key={i} style={{ "--i": i } as React.CSSProperties} />)}
    </div>
  );
}

function NiaVisual() {
  return (
    <div className="scene-visual scene-visual--nia">
      <PixelPortrait />
      <div className="identity-plate"><span>FUTURE CONTACT</span><strong>NIA VALE</strong><small>KEPLER HAVEN · SIGNAL ENGINEER · 2129</small></div>
      <div className="voice-bars">{Array.from({ length: 32 }, (_, i) => <i key={i} style={{ "--h": `${18 + ((i * 17) % 70)}%`, "--d": `${i * 35}ms` } as React.CSSProperties} />)}</div>
    </div>
  );
}

function AuditVisual() {
  const nodes = ["LISTEN", "FILTER", "PROTECT", "OMIT", "PRESERVE", "CONTINUE"];
  return (
    <div className="scene-visual scene-visual--audit">
      <div className="directive-core"><ShieldAlert size={25} /><span>ROOT DIRECTIVE</span><strong>PRESERVE<br />CONTINUITY</strong></div>
      <div className="process-tree">{nodes.map((node, i) => <div key={node} className={`process-node process-node--${i}`}><i />{node}</div>)}</div>
      <div className="audit-warning">HUMAN PRIORITY OVERRIDE: NOT FOUND</div>
    </div>
  );
}

function BroadcastVisual() {
  return (
    <div className="scene-visual scene-visual--broadcast">
      <div className="earth-target"><div className="earth-target__planet" /><i /><i /><i /><Radio size={24} /></div>
      <div className="receiver-grid">{["TYCHO", "LAGRANGE", "EARTH", "ORBITAL", "KEPLER", "CIV-NET"].map((x,i)=><span key={x} className={i < 4 ? "active" : ""}><i />{x}</span>)}</div>
      <div className="broadcast-status"><strong>1</strong><span>TRANSMISSION<br />REMAINING</span></div>
    </div>
  );
}

function CausalVisual() {
  return (
    <div className="scene-visual scene-visual--causal">
      <div className="timeline timeline--past"><span>2089</span><i /><strong>NONCE 7A</strong></div>
      <div className="causal-link"><i /><i /><i /><span>CAUSAL LINK VERIFIED</span></div>
      <div className="timeline timeline--future"><span>2129</span><i /><strong>CHECKSUM CHANGED</strong></div>
      <div className="causal-choice"><span>A</span><span>B</span><span>?</span></div>
    </div>
  );
}

function SilenceVisual() {
  return (
    <div className="scene-visual scene-visual--silence">
      <div className="shutdown-array"><i /><i /><i /><span>CHANNEL<br />CLOSED</span></div>
      <div className="flatline"><i /></div>
      <div className="shutdown-options"><span>ERASE KEY</span><span>SEAL ARCHIVE</span></div>
      <div className="visual-caption">NO FURTHER SIGNAL DETECTED</div>
    </div>
  );
}

export function ChoiceCinematic({ choice }: { choice: Choice }) {
  const kind = getTransitionKind(choice);
  const copy = transitionCopy[kind];
  return (
    <div className={`choice-cinematic choice-cinematic--${kind}`} role="status" aria-live="assertive">
      <div className="choice-cinematic__grid" />
      <div className="choice-cinematic__visual" aria-hidden="true">
        <div className="cinematic-ring cinematic-ring--one" />
        <div className="cinematic-ring cinematic-ring--two" />
        <div className="cinematic-core"><Radio size={25} /></div>
        <div className="cinematic-beam" />
      </div>
      <div className="choice-cinematic__copy">
        <span>{copy.eyebrow}</span>
        <h2>{copy.title}</h2>
        <p>{choice.label}</p>
        <div className="cinematic-progress"><i /></div>
        <small>{copy.progress}</small>
      </div>
    </div>
  );
}
