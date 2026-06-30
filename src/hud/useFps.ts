import { useEffect, useRef, useState } from 'react';

/**
 * Frames-per-second of the JS thread, measured via requestAnimationFrame.
 * Note: this reflects JS-thread responsiveness (capped at the display refresh
 * rate), not native GPU render rate. It's a good proxy for jank caused by JS /
 * bridge pressure; for true render FPS use Xcode Instruments.
 */
export function useFps(sampleMs = 500): number {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      if (last.current === 0) last.current = t;
      frames.current += 1;
      const dt = t - last.current;
      if (dt >= sampleMs) {
        setFps(Math.round((frames.current * 1000) / dt));
        frames.current = 0;
        last.current = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sampleMs]);

  return fps;
}
