import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
const Customphys_8Inner = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  useEffect(() => {
    // Setup Matter.js
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Constraint = Matter.Constraint;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    const engine = Engine.create();
    engineRef.current = engine;
    const width = 800;
    const height = 600;
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#080816'
      }
    });
    renderRef.current = render;

    // Create bounds
    const ground = Bodies.rectangle(width / 2, height, width, 50, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b'
      }
    });
    const leftWall = Bodies.rectangle(0, height / 2, 50, height, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b'
      }
    });
    const rightWall = Bodies.rectangle(width, height / 2, 50, height, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b'
      }
    });

    // Create the fulcrum
    const fulcrum = Bodies.polygon(width / 2, height - 75, 3, 50, {
      isStatic: true,
      render: {
        fillStyle: '#ef4444'
      }
    });

    // Create the plank (seesaw)
    const plank = Bodies.rectangle(width / 2, height - 125, 600, 20, {
      render: {
        fillStyle: '#3b82f6'
      }
    });

    // Create a constraint to attach the plank to the fulcrum
    const pivot = Constraint.create({
      bodyA: plank,
      pointB: {
        x: width / 2,
        y: height - 125
      },
      stiffness: 1,
      length: 0,
      render: {
        visible: false
      }
    });

    // Create some objects to balance
    const box1 = Bodies.rectangle(width / 2 - 200, height - 300, 60, 60, {
      render: {
        fillStyle: '#f87171'
      },
      mass: 5
    });
    const box2 = Bodies.rectangle(width / 2 + 100, height - 400, 40, 40, {
      render: {
        fillStyle: '#67e8f9'
      },
      mass: 2
    });
    const box3 = Bodies.rectangle(width / 2 + 150, height - 500, 40, 40, {
      render: {
        fillStyle: '#facc15'
      },
      mass: 2
    });

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    });

    // Keep the mouse in sync with rendering
    render.mouse = mouse;
    Composite.add(engine.world, [ground, leftWall, rightWall, fulcrum, plank, pivot, box1, box2, box3, mouseConstraint]);
    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Cleanup on unmount
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Engine.clear(engine);
    };
  }, [resetTrigger]);
  return <div style={{
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  }}>
      {/* Centered Physics Scene Container */}
      <div style={{
      pointerEvents: 'auto',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '24px',
      padding: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    }}>
        <div ref={sceneRef} style={{
        borderRadius: '16px',
        overflow: 'hidden'
      }} />
      </div>

      {/* Floating Instructions and Controls Panel */}
      <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '320px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      pointerEvents: 'auto'
    }}>
        <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px',
        margin: 0
      }}>
          Seesaw Lab
        </h3>
        
        <p style={{
        fontSize: '13px',
        color: '#cbd5e1',
        margin: 0,
        lineHeight: '1.4'
      }}>
          Drag the blocks with your mouse/touch to place them on the seesaw and experiment with gravitational balance.
        </p>

        {/* Legend */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'rgba(0,0,0,0.2)',
        padding: '12px',
        borderRadius: '10px',
        fontSize: '12px'
      }}>
          <span style={{
          fontWeight: '600',
          color: '#94a3b8'
        }}>MASS LEGEND:</span>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <div style={{
            width: '12px',
            height: '12px',
            background: '#f87171',
            borderRadius: '2px'
          }} />
            <span>Large Block: 5 kg</span>
          </div>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <div style={{
            width: '12px',
            height: '12px',
            background: '#67e8f9',
            borderRadius: '2px'
          }} />
            <span>Cyan Block: 2 kg</span>
          </div>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <div style={{
            width: '12px',
            height: '12px',
            background: '#facc15',
            borderRadius: '2px'
          }} />
            <span>Yellow Block: 2 kg</span>
          </div>
        </div>

        {/* Reset Trigger Button */}
        <button onClick={() => setResetTrigger(prev => prev + 1)} style={{
        padding: '10px',
        background: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '8px',
        color: '#3b82f6',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }} onMouseEnter={e => {
        e.currentTarget.style.background = '#3b82f6';
        e.currentTarget.style.color = '#fff';
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
        e.currentTarget.style.color = '#3b82f6';
      }}>
          Reset Simulation
        </button>
      </div>
    </div>;
};
export default function Customphys_8({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden'
  }}>
            
            <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <Customphys_8Inner />
            </div>
        </div>;
}