"use client";

import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

export default function BackgroundParticles() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div className="fixed inset-0 z-[2147483647] pointer-events-none">
      <Particles
        id="bg-particles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          fpsLimit: 60,
          background: { color: { value: "transparent" } },
          particles: {
            number: { value: 120, density: { enable: true, area: 900 } },
            color: { value: ["#6366f1", "#8b5cf6", "#06b6d4"] },
            shape: { type: ["circle", "triangle"] },
            opacity: { value: 0.35 },
            size: { value: { min: 3, max: 7 } },
            move: {
              enable: true,
              speed: 0.25,
              random: true,
              straight: false,
              direction: "none",
              outModes: { default: "out" },
            },
            links: { enable: false },
            rotate: { animation: { enable: false } },
            wobble: { enable: false },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              resize: true,
            },
            modes: { repulse: { distance: 120, speed: 0.6 } },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}
