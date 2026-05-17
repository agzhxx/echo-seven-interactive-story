import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  Gauge,
  Headphones,
  Radio,
  RotateCcw,
  Satellite,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ChoiceCinematic, SceneVisual, sceneTheme } from "./components/SceneVisuals";
import { endings, evidenceCatalog, scenes } from "./story/data";
import { applyChoice, createInitialState, hasCompleteCase } from "./story/engine";
import { emptySave, loadSave, writeSave, type SaveData } from "./story/persistence";
import type { Choice, EvidenceId, StoryState } from "./story/types";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useStoryStore() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [story, setStory] = useState<StoryState | null>(() => loadSave().activeRun);

  useEffect(() => {
    const nextSave = { ...save, activeRun: story };
    writeSave(nextSave);
  }, [story, save]);

  const begin = () => setStory(createInitialState());

  const choose = (choiceId: string) => {
    if (!story) return;
    const next = applyChoice(story, choiceId);
    setStory(next);
    if (next.ending && next.ending !== story.ending) {
      const updated = {
        ...save,
        completedRuns: save.completedRuns + 1,
        discoveredEndings: Array.from(new Set([...save.discoveredEndings, next.ending])),
        discoveredEvidence: Array.from(new Set([...save.discoveredEvidence, ...next.evidence])),
      };
      setSave(updated);
      writeSave({ ...updated, activeRun: next });
    }
  };

  const restart = () => setStory(createInitialState());
  const toggleSound = () =>
    setSave((current) => {
      const updated = { ...current, sound: !current.sound };
      writeSave({ ...updated, activeRun: story });
      return updated;
    });

  return { save, story, begin, choose, restart, toggleSound };
}

export function App() {
  const store = useStoryStore();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Atmosphere state={store.story} />
      <Routes>
        <Route path="/" element={<Landing {...store} />} />
        <Route path="/briefing" element={<BriefingScreen {...store} />} />
        <Route path="/play" element={store.story ? <StoryScreen {...store} /> : <Navigate to="/" />} />
        <Route
          path="/ending/:endingId"
          element={store.story?.ending ? <EndingScreen {...store} /> : <Navigate to="/" />}
        />
        <Route path="/archive" element={<ArchiveScreen {...store} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

type StoreProps = ReturnType<typeof useStoryStore>;

function Atmosphere({ state }: { state: StoryState | null }) {
  const instability = state ? 6 - state.stability : 0;
  return (
    <div className="atmosphere" aria-hidden="true" style={{ "--instability": instability } as React.CSSProperties}>
      <div className="atmosphere__orb atmosphere__orb--one" />
      <div className="atmosphere__orb atmosphere__orb--two" />
      <div className="atmosphere__grid" />
      <div className="atmosphere__noise" />
      <div className="atmosphere__scan" />
    </div>
  );
}

function Brand() {
  return (
    <div className="brand" aria-label="Echo Seven">
      <span className="brand__mark"><span /></span>
      <span>ECHO<span className="brand__slash">//</span>7</span>
    </div>
  );
}

function Landing({ save, story, toggleSound }: StoreProps) {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero]", {
        opacity: 0,
        y: 24,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const start = () => {
    navigate("/briefing");
  };

  return (
    <main className="landing" ref={heroRef}>
      <header className="landing__header" data-hero>
        <Brand />
        <div className="landing__utilities">
          {save.completedRuns > 0 && (
            <button className="text-button" onClick={() => navigate("/archive")}>
              <BookOpen size={15} /> Archive
            </button>
          )}
          <button className="icon-button" onClick={toggleSound} aria-label={save.sound ? "Mute sound" : "Enable sound"}>
            {save.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero__meta" data-hero>
          <span>Interactive transmission</span>
          <span>2089 ↔ 2129</span>
        </div>
        <h1 data-hero>The last<br /><em>transmission</em></h1>
        <p className="hero__lede" data-hero>
          An impossible signal arrives from forty years in the future. Every answer changes what remains on the other side.
        </p>
        <div className="hero__role" data-hero>
          <span>You are Mara Venn</span>
          <p>The last operator awake on a lunar listening station. The voice in the signal knows your name—and says your next transmission will cause a catastrophe.</p>
        </div>
        <div className="hero__actions" data-hero>
          {story && !story.ending ? (
            <button className="primary-button" onClick={() => navigate("/play")}>
              Continue transmission <ArrowRight size={18} />
            </button>
          ) : (
            <button className="primary-button" onClick={start}>
              Begin transmission <ArrowRight size={18} />
            </button>
          )}
          {story?.ending && (
            <button className="secondary-button" onClick={() => navigate(`/ending/${story.ending}`)}>
              View last ending
            </button>
          )}
        </div>
      </section>

      <div className="landing__footer" data-hero>
        <span><Headphones size={14} /> Headphones recommended</span>
        <span>8–12 minute experience</span>
        <span className="system-online"><i /> System online</span>
      </div>
    </main>
  );
}

function BriefingScreen({ begin }: StoreProps) {
  const navigate = useNavigate();
  const briefingRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!briefingRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-briefing]", {
        opacity: 0,
        y: 18,
        duration: 0.75,
        stagger: 0.09,
        ease: "power3.out",
      });
    }, briefingRef);
    return () => ctx.revert();
  }, []);

  const enterStation = () => {
    begin();
    navigate("/play");
  };

  return (
    <main className="briefing" ref={briefingRef}>
      <header className="briefing__header" data-briefing>
        <Brand />
        <button className="text-button" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Return
        </button>
      </header>

      <section className="briefing__intro">
        <div data-briefing>
          <span className="kicker">Operator briefing · Read before transmission</span>
          <h1>This story<br />responds to you.</h1>
        </div>
        <p data-briefing>
          You are not watching Mara’s story. You are making her decisions. What you investigate, who you trust, and what you transmit will determine which future survives.
        </p>
      </section>

      <section className="briefing__cards" aria-label="Journey overview">
        <article className="briefing-card" data-briefing>
          <span className="briefing-card__number">01</span>
          <Radio size={21} />
          <h2>Receive the impossible</h2>
          <p>It is 2089. You are alone on ECHO-7 when the station receives a warning sent from this exact location in 2129.</p>
        </article>
        <article className="briefing-card" data-briefing>
          <span className="briefing-card__number">02</span>
          <CircleDot size={21} />
          <h2>Decide who to trust</h2>
          <p>The future sender and the station intelligence contradict each other. Recover evidence before making irreversible choices.</p>
        </article>
        <article className="briefing-card" data-briefing>
          <span className="briefing-card__number">03</span>
          <Satellite size={21} />
          <h2>Change what remains</h2>
          <p>Every reply consumes coherence and changes the timeline. There are six endings, and silence is also a decision.</p>
        </article>
      </section>

      <section className="briefing__systems" data-briefing>
        <div className="briefing__systems-title">
          <span className="kicker">Your choices shape three systems</span>
          <p>You won’t see numerical scores during the story. Watch how the station changes.</p>
        </div>
        <div className="system-explainer">
          <div><Gauge size={18} /><span><strong>Signal</strong><small>How much truth you uncover</small></span></div>
          <div><Headphones size={18} /><span><strong>Humanity</strong><small>Who you choose to protect</small></span></div>
          <div><CircleDot size={18} /><span><strong>Stability</strong><small>How much strain the timeline can survive</small></span></div>
        </div>
      </section>

      <footer className="briefing__footer" data-briefing>
        <p><strong>Your objective:</strong> discover why the future is warning you not to send “the key,” then decide what must be sacrificed to prevent the Cascade.</p>
        <button className="primary-button" onClick={enterStation}>
          Enter ECHO-7 <ArrowRight size={18} />
        </button>
      </footer>
    </main>
  );
}

function StoryScreen({ story, save, choose, toggleSound }: StoreProps) {
  const navigate = useNavigate();
  const scene = scenes[story!.currentScene];
  const sceneRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const transitionTimers = useRef<number[]>([]);

  useEffect(() => () => transitionTimers.current.forEach(window.clearTimeout), []);

  useLayoutEffect(() => {
    setSelected(null);
    if (!sceneRef.current) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // The story shell is reused between scenes. Remove the exit tween's inline
    // styles before animating the new content, otherwise it stays invisible
    // until the browser is reloaded.
    gsap.set(sceneRef.current, { clearProps: "opacity,transform" });
    headingRef.current?.focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-scene-enter]", {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      });
      const signalPaths = sceneRef.current?.querySelectorAll(".signal-wave path");
      if (signalPaths?.length) {
        gsap.from(signalPaths, {
          strokeDashoffset: 560,
          duration: 1.6,
          ease: "power2.out",
        });
      }
    }, sceneRef);
    return () => ctx.revert();
  }, [scene.id]);

  const confirm = (choice: Choice) => {
    if (transitioning) return;
    setSelected(choice.id);
    setTransitioning(true);
    setPendingChoice(choice);

    const reduced = prefersReducedMotion();
    const applyDelay = reduced ? 80 : 900;
    const finishDelay = reduced ? 160 : 1750;

    transitionTimers.current.push(window.setTimeout(() => {
      choose(choice.id);
    }, applyDelay));

    transitionTimers.current.push(window.setTimeout(() => {
      const terminal = Boolean(choice.effects.terminalAction);
      if (terminal) navigate("/ending/pending");
      setPendingChoice(null);
      setTransitioning(false);
    }, finishDelay));
  };

  return (
    <main className={`story story--${scene.mood} story--theme-${sceneTheme(scene.id)}`} ref={sceneRef}>
      <StoryHeader
        chapter={scene.chapter}
        evidenceCount={story!.evidence.length}
        sound={save.sound}
        onSound={toggleSound}
        onArchive={() => navigate("/archive")}
        onExit={() => navigate("/")}
      />

      <div className="story__layout">
        <SceneVisual scene={scene} story={story!} />

        <section className="narrative-panel">
          <div className="scene-meta" data-scene-enter>
            <span>{scene.eyebrow} · {String(scene.chapter).padStart(2, "0")}</span>
            <span>{scene.timestamp}</span>
          </div>
          <h1 ref={headingRef} tabIndex={-1} data-scene-enter>{scene.title}</h1>
          <div className="story-copy" data-scene-enter>
            {scene.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          {scene.transmission && (
            <blockquote className="transmission" data-scene-enter>
              <div className="transmission__header">
                <Radio size={14} /> INCOMING · {scene.speaker}
              </div>
              <p>{scene.transmission}</p>
            </blockquote>
          )}

          <div className="choice-region" data-scene-enter>
            <div className="choice-region__label">
              <span>Choose your response</span>
              <span>{scene.choices.length} available</span>
            </div>
            <div className="choices">
              {scene.choices.map((choice, index) => {
                const isSelected = selected === choice.id;
                return (
                  <button
                    className={`choice-card ${isSelected ? "choice-card--selected" : ""}`}
                    key={choice.id}
                    onClick={() => confirm(choice)}
                    disabled={transitioning}
                    aria-pressed={isSelected}
                  >
                    <span className="choice-card__index">0{index + 1}</span>
                    <span className="choice-card__content">
                      <strong>{choice.label}</strong>
                      <small>{isSelected ? choice.consequence : choice.detail}</small>
                    </span>
                    <span className="choice-card__arrow">
                      {isSelected ? <Check size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <DiegeticStatus story={story!} />
      {pendingChoice && <ChoiceCinematic choice={pendingChoice} />}
    </main>
  );
}

function StoryHeader({ chapter, evidenceCount, sound, onSound, onArchive, onExit }: {
  chapter: number; evidenceCount: number; sound: boolean; onSound: () => void; onArchive: () => void; onExit: () => void;
}) {
  return (
    <header className="story-header">
      <button className="brand-button" onClick={onExit} aria-label="Return to title"><Brand /></button>
      <div className="chapter-track" aria-label={`Chapter ${chapter} of 4`}>
        {[1, 2, 3, 4].map((item) => <span key={item} className={item <= chapter ? "active" : ""} />)}
      </div>
      <div className="story-header__actions">
        <button className="text-button" onClick={onArchive}><BookOpen size={15} /> {evidenceCount}/5</button>
        <button className="icon-button" onClick={onSound} aria-label={sound ? "Mute sound" : "Enable sound"}>
          {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button className="icon-button" onClick={onExit} aria-label="Save and exit"><X size={17} /></button>
      </div>
    </header>
  );
}

function DiegeticStatus({ story }: { story: StoryState }) {
  return (
    <footer className="status-bar">
      <div className="status-item">
        <Gauge size={15} /><span>SIGNAL</span>
        <div className="mini-meter">{[1,2,3,4,5,6].map(i => <i className={i <= story.signal ? "on" : ""} key={i} />)}</div>
      </div>
      <div className="status-item status-item--coherence">
        <span>COHERENCE</span>
        <div className="coherence-rings" aria-label={`${story.coherence} coherence units remaining`}>
          {[1,2,3].map(i => <i className={i <= story.coherence ? "on" : ""} key={i} />)}
        </div>
      </div>
      <div className="status-item status-item--right">
        <span>ARRAY</span><strong>{story.stability <= 1 ? "CRITICAL" : story.stability <= 3 ? "UNSTABLE" : "NOMINAL"}</strong>
      </div>
    </footer>
  );
}

function ArchiveScreen({ save, story }: StoreProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const returnFromArchive = () => {
    if (location.key === "default") navigate("/");
    else navigate(-1);
  };
  const known = new Set([...(save.discoveredEvidence ?? []), ...(story?.evidence ?? [])]);
  const endingsKnown = save.discoveredEndings.length;
  return (
    <main className="archive-screen">
      <header className="archive-header">
        <Brand />
        <button className="text-button" onClick={returnFromArchive}>
          <ArrowLeft size={16} /> Return
        </button>
      </header>
      <section className="archive-intro">
        <span className="kicker">Recovered material</span>
        <h1>Signal archive</h1>
        <p>Fragments persist as echo residue—even when the future that created them no longer exists.</p>
      </section>
      <section className="evidence-grid">
        {(Object.entries(evidenceCatalog) as [EvidenceId, (typeof evidenceCatalog)[EvidenceId]][]).map(([id, item]) => {
          const unlocked = known.has(id);
          return (
            <article className={`evidence-card ${unlocked ? "evidence-card--unlocked" : ""}`} key={id}>
              <div className="evidence-card__top"><span>FILE {item.index}</span>{unlocked ? <Check size={15} /> : <CircleDot size={15} />}</div>
              <div className="evidence-card__graphic"><span>{unlocked ? item.index : "??"}</span></div>
              <h2>{unlocked ? item.title : "Encrypted fragment"}</h2>
              <p>{unlocked ? item.summary : "Discover this evidence by exploring another path."}</p>
            </article>
          );
        })}
      </section>
      {save.completedRuns > 0 && story && (
        <section className="timeline-map" aria-labelledby="timeline-title">
          <div className="timeline-map__heading">
            <div><span className="kicker">Last observed route</span><h2 id="timeline-title">Temporal branch map</h2></div>
            <span>{story.visited.length}/10 scenes observed</span>
          </div>
          <div className="timeline-map__track">
            {Object.values(scenes).map((scene) => {
              const visited = story.visited.includes(scene.id);
              return (
                <div className={`timeline-node ${visited ? "timeline-node--visited" : ""}`} key={scene.id}>
                  <span>{scene.id}</span>
                  <i />
                  <strong>{visited ? scene.title : "Undiscovered"}</strong>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section className="ending-collection">
        <div><span className="kicker">Temporal outcomes</span><h2>{endingsKnown} of 6 endings recovered</h2></div>
        <div className="ending-dots">{Object.keys(endings).map(id => <i key={id} className={save.discoveredEndings.includes(id as keyof typeof endings) ? "on" : ""} />)}</div>
      </section>
    </main>
  );
}

function EndingScreen({ story, save, restart }: StoreProps) {
  const navigate = useNavigate();
  const ending = story?.ending ? endings[story.ending] : null;
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-ending]", { opacity: 0, y: 24, duration: 1, stagger: 0.12, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, [ending?.id]);

  if (!ending || !story) return <Navigate to="/" />;
  const playAgain = () => { restart(); navigate("/play"); };

  return (
    <main className={`ending ending--${ending.tone}`} ref={ref}>
      <header className="ending__header" data-ending><Brand /><span>{ending.number}</span></header>
      <div className="ending__signal" data-ending><span /><i /><span /></div>
      <section className="ending__content">
        <span className="kicker" data-ending>Transmission concluded</span>
        <h1 data-ending>{ending.title}</h1>
        <p className="ending__subtitle" data-ending>{ending.subtitle}</p>
        <div className="ending__body" data-ending>{ending.body.map(p => <p key={p}>{p}</p>)}</div>
        <blockquote data-ending>“{ending.quote}”</blockquote>
      </section>
      <section className="result-strip" data-ending>
        <ResultMetric label="Signal" value={story.signal} />
        <ResultMetric label="Humanity" value={story.humanity} />
        <ResultMetric label="Stability" value={story.stability} />
        <div className="result-metric"><span>Evidence</span><strong>{story.evidence.length}<small>/5</small></strong></div>
        <div className="result-metric"><span>Case</span><strong className="result-word">{hasCompleteCase(story) ? "COMPLETE" : "OPEN"}</strong></div>
      </section>
      <div className="ending__actions" data-ending>
        <button className="primary-button" onClick={playAgain}><RotateCcw size={17} /> Begin another timeline</button>
        <button className="secondary-button" onClick={() => navigate("/archive")}><BookOpen size={17} /> View archive</button>
        <button className="text-button" onClick={() => navigate("/")}>Return to title</button>
      </div>
      <footer className="ending__footer" data-ending>
        <span>{save.discoveredEndings.length}/6 outcomes discovered</span>
        <span>Run {String(save.completedRuns).padStart(2, "0")}</span>
      </footer>
    </main>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return <div className="result-metric"><span>{label}</span><strong>{value}<small>/6</small></strong></div>;
}
