import type { CSSProperties } from "react";
import type { MouthShape, KrillyMood } from "../lib/realtime";

type KrillyFaceProps = {
  mood: KrillyMood;
  mouthShape: MouthShape;
};

const sariByDay = ["cream", "red", "green", "gold", "blue", "pink", "black"] as const;

export function KrillyFace({ mood, mouthShape }: KrillyFaceProps) {
  const day = new Date().getDay();
  const sari = sariByDay[day] ?? "cream";

  return (
    <div
      className={`face face-${mood} krilly-portrait sari-${sari}`}
      style={
        {
          "--mouth-open": mouthShape.open.toFixed(3),
          "--mouth-width": mouthShape.width.toFixed(3),
          "--mouth-round": mouthShape.round.toFixed(3),
          "--mouth-teeth": mouthShape.teeth.toFixed(3),
        } as CSSProperties
      }
      aria-label={`Krilly is ${mood}. Today's sari is ${sari}.`}
    >
      <div className="portrait-placeholder" aria-hidden="true">
        <div className="portrait-glow" />
        <div className="portrait-bindi" />
        <div className="portrait-copy">
          <strong>KRILLY</strong>
          <span>{mood}</span>
        </div>
      </div>
      <div className="voice-aura" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>
    </div>
  );
}
