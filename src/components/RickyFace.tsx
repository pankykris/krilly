import type { CSSProperties } from "react";
import type { MouthShape, KrillyMood } from "../lib/realtime";

type KrillyFaceProps = {
  mood: KrillyMood;
  mouthShape: MouthShape;
};

export function KrillyFace({ mood, mouthShape }: KrillyFaceProps) {
  return (
    <div
      className={`face face-${mood}`}
      style={
        {
          "--mouth-open": mouthShape.open.toFixed(3),
          "--mouth-width": mouthShape.width.toFixed(3),
          "--mouth-round": mouthShape.round.toFixed(3),
          "--mouth-teeth": mouthShape.teeth.toFixed(3),
        } as CSSProperties
      }
      aria-label={`Krilly mood: ${mood}`}
    >
      <div className="eye-row">
        <div className="eye">
          <span />
        </div>
        <div className="eye">
          <span />
        </div>
      </div>
      <div className="mouth-wrap">
        <div className="mouth">
          <div className="mouth-teeth" />
          <div className="mouth-line" />
        </div>
      </div>
    </div>
  );
}
