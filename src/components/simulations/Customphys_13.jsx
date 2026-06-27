import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
const Customphys_13Inner = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);

  // Physics constants
  const [mass, setMass] = useState(100);
  const [stiffness, setStiffness] = useState(0.02);
  const [damping, setDamping] = useState(0.01);
  const [gravity, setGravity] = useState(1);
  const [massBody, setMassBody] = useState(null);
  const [springConstraint, setSpringConstraint] = useState(null);
  useEffect(() => {
    const {
      Engine,
      Render,
      Runner,
      World,
      Bodies,
      Constraint,
      Mouse,
      MouseConstraint
    } = Matter;
    const engine = Engine.create();
    engineRef.current = engine;
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#e0f7fa'
      }
    });
    renderRef.current = render;

    // Ceiling
    const ceiling = Bodies.rectangle(400, 20, 800, 40, {
      isStatic: true,
      render: {
        fillStyle: '#37474f'
      }
    });

    // Mass Block
    const mBody = Bodies.rectangle(400, 300, 60, 60, {
      frictionAir: damping,
      mass: mass / 100,
      render: {
        fillStyle: '#ff7043',
        strokeStyle: '#d84315',
        lineWidth: 3
      }
    });
    setMassBody(mBody);

    // Spring
    const spring = Constraint.create({
      pointA: {
        x: 400,
        y: 40
      },
      bodyB: mBody,
      pointB: {
        x: 0,
        y: -30
      },
      stiffness: stiffness,
      damping: 0.05,
      length: 200,
      render: {
        visible: true,
        lineWidth: 6,
        strokeStyle: '#78909c',
        type: 'spring'
      }
    });
    setSpringConstraint(spring);
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

    // Floor to prevent it from falling indefinitely if gravity is too high or spring breaks
    const floor = Bodies.rectangle(400, 610, 800, 40, {
      isStatic: true,
      render: {
        fillStyle: '#8d6e63'
      }
    });
    World.add(engine.world, [ceiling, mBody, spring, mouseConstraint, floor]);
    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, []);
  useEffect(() => {
    if (massBody) {
      Matter.Body.setMass(massBody, mass / 100);
      massBody.frictionAir = damping;
    }
  }, [mass, damping, massBody]);
  useEffect(() => {
    if (springConstraint) {
      springConstraint.stiffness = stiffness;
    }
  }, [stiffness, springConstraint]);
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gravity.y = gravity;
    }
  }, [gravity]);
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: 'transparent',
    color: 'white',
    fontFamily: "'Inter', sans-serif",
    paddingTop: '80px',
    overflow: 'hidden'
  }}>
            <div style={{
      position: 'absolute',
      inset: 0,
      padding: '20px',
      paddingRight: '340px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1
    }}>
                <div style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
      }}>
                    <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: '500',
          opacity: 0.8,
          pointerEvents: 'none',
          zIndex: 10
        }}>
                        Drag the mass block to interact
                    </div>
                    <div ref={sceneRef} style={{
          width: '800px',
          height: '600px'
        }}></div>
                </div>
            </div>

            <aside style={{
      position: 'absolute',
      top: '90px',
      right: '20px',
      width: '300px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
                <h3 style={{
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: '#f8fafc',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '10px'
      }}>Spring Parameters</h3>
                
                <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
                    <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px'
        }}>
                        <span style={{
            color: '#94a3b8'
          }}>Mass</span>
                        <span style={{
            color: '#3498db',
            fontWeight: 'bold'
          }}>{mass}g</span>
                    </div>
                    <input type="range" min="50" max="300" step="10" value={mass} onChange={e => setMass(Number(e.target.value))} style={{
          cursor: 'pointer',
          width: '100%',
          accentColor: '#3498db'
        }} />
                </div>
                
                <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
                    <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px'
        }}>
                        <span style={{
            color: '#94a3b8'
          }}>Spring Stiffness</span>
                        <span style={{
            color: '#2ecc71',
            fontWeight: 'bold'
          }}>{(stiffness * 1000).toFixed(0)}</span>
                    </div>
                    <input type="range" min="0.001" max="0.1" step="0.001" value={stiffness} onChange={e => setStiffness(Number(e.target.value))} style={{
          cursor: 'pointer',
          width: '100%',
          accentColor: '#2ecc71'
        }} />
                </div>
                
                <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
                    <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px'
        }}>
                        <span style={{
            color: '#94a3b8'
          }}>Damping (Friction)</span>
                        <span style={{
            color: '#ef4444',
            fontWeight: 'bold'
          }}>{(damping * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="0" max="0.1" step="0.01" value={damping} onChange={e => setDamping(Number(e.target.value))} style={{
          cursor: 'pointer',
          width: '100%',
          accentColor: '#ef4444'
        }} />
                </div>
                
                <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
                    <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px'
        }}>
                        <span style={{
            color: '#94a3b8'
          }}>Gravity</span>
                        <span style={{
            color: '#e67e22',
            fontWeight: 'bold'
          }}>{gravity.toFixed(1)}g</span>
                    </div>
                    <input type="range" min="0.1" max="3" step="0.1" value={gravity} onChange={e => setGravity(Number(e.target.value))} style={{
          cursor: 'pointer',
          width: '100%',
          accentColor: '#e67e22'
        }} />
                </div>
            </aside>
        </div>;
};
export default function Customphys_13({
  onBack,
  title
}) {
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden'
  }}>
            <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      right: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100
    }}>
                {onBack ? <button onClick={onBack} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        padding: '10px 20px',
        borderRadius: '12px',
        color: '#fff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif"
      }}>
                        ← Back
                    </button> : <div />}
                <h1 style={{
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        fontSize: '24px',
        fontWeight: '600',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        margin: 0
      }}>
                    {title || 'Simulation'}
                </h1>
                <div style={{
        width: '100px'
      }}></div>
            </div>
            <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <Customphys_13Inner onBack={null} title={""} />
            </div>
        </div>;
}