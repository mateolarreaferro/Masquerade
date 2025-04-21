"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    p5: any;
  }
}

const P5Background = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("🎨 P5Background mounted");

    const sketch = (p: any) => {
      let particles: any[] = [];
      const numParticles = 500;
      let globalRotation = 0;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        p.angleMode(p.DEGREES);
        for (let i = 0; i < numParticles; i++) {
          particles.push(new Particle());
        }
      };

      p.draw = () => {
        p.background(0);
        globalRotation += 0.05;
        p.rotateX(globalRotation * 0.5);
        p.rotateY(globalRotation);
        particles.forEach((q) => {
          q.update();
          q.display();
        });
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };

      class Particle {
        angle: number;
        radius: number;
        z: number;
        noiseAngle: number;
        noiseRadius: number;
        noiseZ: number;
        size: number;
        x = 0;
        y = 0;
        constructor() {
          this.angle = p.random(360);
          this.radius = p.random(50, p.width * 0.4);
          this.z = p.random(-500, 500);
          this.noiseAngle = p.random(1000);
          this.noiseRadius = p.random(1000);
          this.noiseZ = p.random(1000);
          this.size = p.random(2, 5);
        }
        update() {
          this.angle += p.map(p.noise(this.noiseAngle), 0, 1, -1, 1);
          this.radius += p.map(p.noise(this.noiseRadius), 0, 1, -0.5, 0.5);
          this.radius = p.constrain(this.radius, 20, p.width * 0.4);
          this.z += p.map(p.noise(this.noiseZ), 0, 1, -2, 2);
          if (this.z > 500) this.z = -500;
          if (this.z < -500) this.z = 500;
          this.x = this.radius * p.cos(this.angle);
          this.y = this.radius * p.sin(this.angle);
          this.noiseAngle += 0.01;
          this.noiseRadius += 0.01;
          this.noiseZ += 0.01;
        }
        display() {
          p.push();
          p.translate(this.x, this.y, this.z);
          p.noStroke();
          p.fill(255);
          p.sphere(this.size);
          p.pop();
        }
      }
    };

    const waitForP5 = () => {
      if (typeof window !== "undefined" && typeof window.p5 === "function") {
        console.log("✅ p5 loaded");
        const myp5 = new window.p5(sketch, container.current!);
        return () => myp5.remove();
      } else {
        console.log("⏳ Waiting for p5...");
        setTimeout(waitForP5, 50);
      }
    };

    waitForP5();
  }, []);

  return (
    <div
      ref={container}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
};

export default P5Background;
