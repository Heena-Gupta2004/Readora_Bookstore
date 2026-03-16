import { useEffect, useMemo } from "react";

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

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, index) => ({
        id: `p-${index}`,
        x: `${Math.round(Math.random() * 100)}%`,
        y: `${Math.round(Math.random() * 100)}%`,
        size: `${Math.random() * 6 + 2}px`,
        delay: `${Math.random() * 2}s`,
        duration: `${Math.random() * 4 + 4}s`,
      })),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
        osc.onended = () => ctx.close();
      } catch {
        // ignore audio failures
      }
    }, 4200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="intro-overlay" aria-hidden="true">
      <div className="intro-particles">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="intro-particle"
            style={{
              "--px": particle.x,
              "--py": particle.y,
              "--ps": particle.size,
              "--pd": particle.delay,
              "--pt": particle.duration,
            }}
          />
        ))}
      </div>
      <div className="intro-scene">
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
    </div>
  );
}
