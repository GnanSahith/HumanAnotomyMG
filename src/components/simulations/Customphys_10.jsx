import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const Customphys_10Inner = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite;

    const engine = Engine.create();
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#1a1a1a'
      }
    });

    // Create Pegs
    const pegs = [];
    const rows = 12;
    const spacingX = 40;
    const spacingY = 35;
    const startY = 100;
    
    for (let row = 0; row < rows; row++) {
      const numPegs = row + 1;
      const startX = 400 - (row * spacingX) / 2;
      for (let col = 0; col < numPegs; col++) {
        pegs.push(
          Bodies.circle(startX + col * spacingX, startY + row * spacingY, 4, {
            isStatic: true,
            render: { fillStyle: '#ffffff' },
            friction: 0.1,
            restitution: 0.5
          })
        );
      }
    }

    // Create Bins
    const bins = [];
    const binCount = rows + 1;
    const binWidth = spacingX;
    const binHeight = 150;
    const binStartY = startY + rows * spacingY + binHeight / 2;
    const binStartX = 400 - (rows * spacingX) / 2;

    for (let i = 0; i <= binCount; i++) {
      bins.push(
        Bodies.rectangle(binStartX + i * binWidth - binWidth / 2, binStartY, 4, binHeight, {
          isStatic: true,
          render: { fillStyle: '#888888' }
        })
      );
    }
    
    // Bottom wall
    const ground = Bodies.rectangle(400, binStartY + binHeight / 2, binCount * binWidth + 20, 20, {
      isStatic: true,
      render: { fillStyle: '#888888' }
    });

    // Left and Right funnel walls
    const leftFunnel = Bodies.rectangle(350, 40, 100, 10, {
      isStatic: true,
      angle: Math.PI / 4,
      render: { fillStyle: '#888888' }
    });
    const rightFunnel = Bodies.rectangle(450, 40, 100, 10, {
      isStatic: true,
      angle: -Math.PI / 4,
      render: { fillStyle: '#888888' }
    });

    Composite.add(engine.world, [...pegs, ...bins, ground, leftFunnel, rightFunnel]);

    // Drop balls periodically
    let ballCount = 0;
    const maxBalls = 350;
    const dropInterval = setInterval(() => {
      if (ballCount >= maxBalls) {
        clearInterval(dropInterval);
        return;
      }
      
      // Add slight random offset to prevent exact stacking
      const randomX = 400 + (Math.random() - 0.5) * 5;
      const ball = Bodies.circle(randomX, 0, 6, {
        restitution: 0.5,
        friction: 0.001,
        density: 0.05,
        render: { fillStyle: '#ff3366' }
      });
      
      Composite.add(engine.world, ball);
      ballCount++;
    }, 50);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      clearInterval(dropInterval);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Engine.clear(engine);
    };
  }, []);

  return (
    <div className="simulation-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2>Center and Variability</h2>
      <p style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '20px', color: '#555' }}>
        This Galton Board simulation demonstrates how random variability (balls bouncing left or right off pegs) 
        accumulates to form a predictable center and distribution (the bell curve).
      </p>
      <div ref={sceneRef} style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
    </div>
  );
};




export default function Customphys_10({ onBack, title }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a1a' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                {onBack ? (
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                        ← Back
                    </button>
                ) : <div />}
                <h1 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '600', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0 }}>
                    {title || 'Simulation'}
                </h1>
                <div style={{ width: '100px' }}></div>
            </div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }}>
                 <Customphys_10Inner onBack={null} title={""} />
            </div>
        </div>
    );
}
