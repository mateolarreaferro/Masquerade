// app/components/BackgroundParticles.tsx
'use client';

import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, Container } from '@tsparticles/engine';

export default function BackgroundParticles() {
  const [init, setInit] = useState(false);

  // This effect should run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      // initialize the tsParticles engine
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      console.log('Particles container loaded', container);
    }
  };

  return (
    /*  on–top layer, click-through  */
    <div className="fixed inset-0 z-[2147483647] pointer-events-none">
      {init && (
        <Particles
          id="bg-particles"
          particlesLoaded={particlesLoaded}
          options={{
            fullScreen: { enable: false },
            fpsLimit: 60,
            background: { color: { value: 'transparent' } },

            particles: {
              number: { value: 140, density: { enable: true, height: 10, width: 10 } },

              shape: {
                type: 'char',
                options: {
                  char: [
                    {
                      character: '?',
                      font: 'Inter, sans-serif',
                      style: '',
                      weight: '900',           // ultra–bold
                      fill: true,
                    }
                  ],
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
                resize: { enable: true },
              },
              modes: { repulse: { distance: 140, speed: 0.7 } },
            },

            detectRetina: true,
          }}
        />
      )}
    </div>
  );
}
