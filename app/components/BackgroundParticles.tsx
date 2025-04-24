// app/components/BackgroundParticles.tsx
'use client';

import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';

export default function BackgroundParticles() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);                  // lightweight preset
  }, []);

  return (
    /*  z-50 keeps the canvas above every UI element, pointer-events-none
        makes it completely “click-through”                                    */
    <div className="fixed inset-0 z-50 pointer-events-none">
      <Particles
        id="bg-particles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },      // we position via the wrapper
          fpsLimit: 60,
          background: { color: { value: 'transparent' } },

          /* ---------- particle appearance ---------- */
          particles: {
            number: {
              value: 120,
              density: { enable: true, area: 1000 },
            },

            color: { value: ['#6366f1', '#8b5cf6', '#06b6d4'] }, // indigo → cyan
            shape: { type: ['circle', 'triangle'] },             // circles + triangles

            opacity: {
              value: 0.45,
              animation: { enable: false },
            },

            size: {
              value: { min: 2, max: 5 },
              animation: { enable: false },
            },

            move: {
              enable: true,
              speed: 0.35,                 // smooth, slow drift
              random: true,
              straight: false,
              direction: 'none',
              outModes: { default: 'out' }, // fade out when leaving viewport
            },

            links: { enable: false },       // no connecting lines
            rotate: { animation: { enable: false } }, // static orientation
            wobble: { enable: false },      // no wobble
          },

          /* ---------- subtle interactivity ---------- */
          interactivity: {
            events: {
              onHover: { enable: true, mode: 'repulse' }, // gentle push
              resize: true,
            },
            modes: {
              repulse: { distance: 110, speed: 0.6 },
            },
          },

          detectRetina: true,
        }}
      />
    </div>
  );
}
