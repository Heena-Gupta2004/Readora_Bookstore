import { useMemo } from "react";

const BRAND = "READORA";
const LETTERS = BRAND.split("");

export default function IntroOverlay() {
  const letters = useMemo(
    () =>
      LETTERS.map((char, index) => ({
        id: `${char}-${index}`,
        char,
        x: `${Math.round((Math.random() - 0.5) * 120)}vw`,
        y: `${Math.round((Math.random() - 0.5) * 120)}vh`,
        z: `${Math.round((Math.random() - 0.5) * 900)}px`,
        rot: `${Math.round(Math.random() * 360)}deg`,
        delay: `${index * 0.18}s`,
      })),
    []
  );

  return (
    <div className="intro-overlay" aria-hidden="true">
      <div className="intro-letters">
        {letters.map((letter) => (
          <span
            key={letter.id}
            className="intro-letter"
            style={{
              "--x": letter.x,
              "--y": letter.y,
              "--z": letter.z,
              "--r": letter.rot,
              "--delay": letter.delay,
            }}
          >
            {letter.char}
          </span>
        ))}
      </div>
      <div className="intro-logo">
        <div className="intro-logo-circle">R</div>
        <div className="intro-logo-text">Readora</div>
      </div>
    </div>
  );
}
