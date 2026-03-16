import { useMemo } from "react";

const BRAND = "READORA";

export default function IntroOverlay() {
  const letters = useMemo(
    () =>
      BRAND.split("").map((char, index) => ({
        id: `${char}-${index}`,
        char,
        x: `${Math.round((Math.random() - 0.5) * 140)}vw`,
        y: `${Math.round((Math.random() - 0.5) * 140)}vh`,
        delay: `${index * 0.2}s`,
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
            style={{ "--x": letter.x, "--y": letter.y, "--delay": letter.delay }}
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
