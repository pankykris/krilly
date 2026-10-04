import { useEffect, useRef, useState } from "react";
import { BrainCircuit, CalendarDays, CheckSquare2, Expand, History, Keyboard, Mic, MicOff, MonitorCog, PanelRight, Send, Sparkles } from "lucide-react";
import { ArtifactPanel } from "./components/ArtifactPanel";
import { KrillyFace } from "./components/RickyFace";
import { newEntry, KrillyRealtimeClient, type MouthShape, type KrillyConnectionState, type KrillyMood, type TranscriptEntry } from "./lib/realtime";
import type { KrillyArtifact } from "./vite-env";

type KrillyMode = "display" | "computer";

export default function App() {
  const [connectionState, setConnectionState] = useState<KrillyConnectionState>("idle");
  const [mood, setMood] = useState<KrillyMood>("idle");
  const [mode, setMode] = useState<KrillyMode>("display");
  const [artifact, setArtifact] = useState<KrillyArtifact | null>(null);
  const [artifactVisible, setArtifactVisible] = useState(true);
  const [artifactFullscreen, setArtifactFullscreen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [mouthShape, setMouthShape] = useState<MouthShape>({ open: 0, width: 0.18, round: 0, teeth: 0 });
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    newEntry("system", "Krilly is ready. Press Ctrl + Space to wake her, then talk naturally."),
  ]);
  const [status, setStatus] = useState("Idle");
  const [textPrompt, setTextPrompt] = useState("");
  const clientRef = useRef<KrillyRealtimeClient | null>(null);
  const connectingRef = useRef(false);

  const isConnected = connectionState === "connected";

  async function connect() {
    if (connectingRef.current || clientRef.current) return;
    connectingRef.current = true;
    await window.krilly.stopWakeWord();
    const client = new KrillyRealtimeClient({
      onConnectionState: setConnectionState,
      onMood: setMood,
      onMouthShape: setMouthShape,
      onTranscript: (entry) => setTranscript((items) => [entry, ...items].slice(0, 80)),
      onArtifact: (nextArtifact) => {
        setArtifact(nextArtifact);
        setArtifactVisible(true);
        if (nextArtifact.fullscreen) setArtifactFullscreen(true);
      },
      onMode: (nextMode) => {
        setMode(nextMode);
        if (nextMode === "computer") {
          setArtifactVisible(false);
          setArtifactFullscreen(false);
          setShowLog(false);
          setShowTypeInput(false);
        } else {
          setArtifactVisible(true);
        }
      },
      onStatus: (message) => {
        setStatus(message);
        setTranscript((items) => [newEntry("system", message), ...items].slice(0, 80));
      },
      onThumbnailReady: playThumbnailReadySound,
    });
    clientRef.current = client;
    await client.connect();
    connectingRef.current = false;
  }

  function disconnect() {
    clientRef.current?.disconnect();
    clientRef.current = null;
    connectingRef.current = false;
    setStatus("Standby. Press Ctrl + Space to wake Krilly.");
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === "Space") {
        event.preventDefault();
        if (!clientRef.current && !connectingRef.current) void connect();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function switchMode(nextMode: KrillyMode) {
    setMode(nextMode);
    const result = await window.krilly.executeTool({ name: "set_mode", arguments: { mode: nextMode } });
    if (result.artifact) setArtifact(result.artifact);
    if (nextMode === "computer") {
      setArtifactVisible(false);
      setArtifactFullscreen(false);
      setShowLog(false);
      setShowTypeInput(false);
    } else {
      setArtifactVisible(true);
    }
    setTranscript((items) => [newEntry("system", `Mode switched to ${nextMode}.`), ...items].slice(0, 80));
  }

  function sendTextPrompt() {
    const trimmed = textPrompt.trim();
    if (!trimmed) return;
    clientRef.current?.sendText(trimmed);
    setTextPrompt("");
    setShowTypeInput(false);
  }

  if (mode === "computer") {
    return (
      <main className="app-shell app-shell-mini">
        <section className="mini-companion" aria-label="Krilly computer use mini mode">
          <KrillyFace mood={mood} mouthShape={mouthShape} />
          <button
            className="mini-restore-button"
            onClick={() => void switchMode("display")}
            aria-label="Return to full Krilly window"
            title="Return to full Krilly window"
          >
            <Expand size={14} />
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="window-drag-strip" aria-hidden="true" />
      <div className="window-drag-left-zone" aria-hidden="true" />
      <section className="companion-window">
        <header className="krilly-topbar"><div className="brand-mark">KRILLY</div><div className={`presence-dot ${isConnected ? "online" : ""}`}><span />{isConnected ? "LIVE" : "STANDBY"}</div></header>
        <section className="face-stage">
          <div className="core-wrap"><div className="core-halo" /><KrillyFace mood={mood} mouthShape={mouthShape} /></div>
          <div className="krilly-state"><Sparkles size={14}/><strong>{isConnected ? (mood === "speaking" ? "Speaking" : mood === "thinking" ? "Thinking" : "Listening") : "Ready when you are"}</strong><span>{isConnected ? "Hands-free session active" : "Ctrl + Space to wake Krilly"}</span></div>
        </section>

        <section className="glance-row">
          <button className="glance-card"><CalendarDays size={16}/><span><small>NEXT UP</small><strong>Today</strong></span></button>
          <button className="glance-card"><CheckSquare2 size={16}/><span><small>TASKS</small><strong>Open command centre</strong></span></button>
          <button className="glance-card"><BrainCircuit size={16}/><span><small>KRILLY</small><strong>{status}</strong></span></button>
        </section>
        <footer className="bottom-console">
          {showTypeInput ? (
            <section className="prompt-box">
              <input
                value={textPrompt}
                onChange={(event) => setTextPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendTextPrompt();
                }}
                autoFocus
                placeholder="Type to Krilly..."
              />
              <button onClick={sendTextPrompt} aria-label="Send typed prompt" title="Send typed prompt">
                <Send size={15} />
              </button>
            </section>
          ) : null}

          <section className="control-strip">
            <button
              className={isConnected ? "simple-button active" : "simple-button"}
              onClick={isConnected ? disconnect : connect}
              disabled={connectionState === "connecting"}
              aria-label={isConnected ? "Disconnect voice" : "Connect voice"}
              title={isConnected ? "Disconnect voice" : "Connect voice"}
            >
              {isConnected ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              className={showTypeInput ? "simple-button active" : "simple-button"}
              onClick={() => setShowTypeInput((value) => !value)}
              aria-label="Type to Krilly"
              title="Type to Krilly"
            >
              <Keyboard size={16} />
            </button>
            <button
              className={mode === "display" ? "simple-button active" : "simple-button"}
              onClick={() => void switchMode("display")}
              aria-label="Display mode"
              title="Display mode"
            >
              <PanelRight size={16} />
            </button>
            <button
              className="simple-button danger"
              onClick={() => void switchMode("computer")}
              aria-label="Computer use mode"
              title="Computer use mode"
            >
              <MonitorCog size={16} />
            </button>
            <button
              className={artifactVisible ? "simple-button active" : "simple-button"}
              onClick={() => setArtifactVisible((value) => !value)}
              aria-label="Toggle artifacts"
              title="Toggle artifacts"
            >
              <BrainCircuit size={16} />
            </button>
            <button
              className={showLog ? "simple-button active" : "simple-button"}
              onClick={() => setShowLog((value) => !value)}
              aria-label="Toggle live log"
              title="Toggle live log"
            >
              <History size={16} />
            </button>
          </section>
        </footer>

        {showLog ? (
          <section className="transcript">
            <div className="section-title">
              <span>Live Log</span>
              <small>{transcript.length} events</small>
            </div>
            <div className="transcript-list">
              {transcript.map((entry) => (
                <article className={`entry entry-${entry.role}`} key={entry.id}>
                  <div>
                    <strong>{entry.role === "krilly" ? "Krilly" : entry.role}</strong>
                    <time>{entry.at}</time>
                  </div>
                  <p>{entry.text}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <ArtifactPanel
        artifact={artifact}
        visible={artifactVisible}
        fullscreen={artifactFullscreen}
        onToggleVisible={() => setArtifactVisible((value) => !value)}
        onToggleFullscreen={() => setArtifactFullscreen((value) => !value)}
      />
    </main>
  );
}

function playThumbnailReadySound() {
  try {
    const AudioContextClass = window.AudioContext;
    const audio = new AudioContextClass();
    const gain = audio.createGain();
    const osc = audio.createOscillator();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, audio.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, audio.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.13);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.14);
    window.setTimeout(() => void audio.close(), 220);
  } catch {
    // Audio cues are optional; ignore browsers that block short sounds.
  }
}
