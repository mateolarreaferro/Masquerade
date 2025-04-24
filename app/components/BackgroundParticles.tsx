// app/components/BackgroundParticles.tsx
'use client';

import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';

export default function BackgroundParticles() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);                // light preset
  }, []);

  return (
    /*  on–top layer, click-through  */
    <div className="fixed inset-0 z-[2147483647] pointer-events-none">
      <Particles
        id="bg-particles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          fpsLimit: 60,
          background: { color: { value: 'transparent' } },

          particles: {
            number: { value: 140, density: { enable: true, area: 700 } },

            shape: {
              type: 'char',
              character: {
                value: '?',
                font: 'Inter, sans-serif',
                style: '',
                weight: '900',           // ultra–bold
                fill: true,
              },
            },

            color: { value: ['#c084fc', '#818cf8', '#38bdf8'] }, // violet-indigo-cyan
            size: { value: { min: 14, max: 26 } },               // larger glyphs
            opacity: { value: 0.85 },

            move: {
              enable: true,
              speed: 0.25,
              random: true,
              straight: false,
              direction: 'none',
              outModes: { default: 'out' },
            },

            links: { enable: false },
          },

          interactivity: {
            events: {
              onHover: { enable: true, mode: 'repulse' },
              resize: true,
            },
            modes: { repulse: { distance: 140, speed: 0.7 } },
          },

          detectRetina: true,
        }}
      />
    </div>
  );
}
