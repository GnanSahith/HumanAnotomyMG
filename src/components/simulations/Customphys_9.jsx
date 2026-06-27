import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import Matter from 'matter-js';
const Customphys_9Inner = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mass1, setMass1] = useState(1);
  const [vel1, setVel1] = useState(5);
  const [mass2, setMass2] = useState(1);
  const [vel2, setVel2] = useState(-5);
  const [elasticity, setElasticity] = useState(1);
  const [physicsData, setPhysicsData] = useState({
    v1: 5,
    v2: -5,
    p1: 5,
    p2: -5
  });
  const initSimulation = useCallback(() => {
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) {
          renderRef.current.canvas.remove();
        }
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
    }
    const engine = Matter.Engine.create();
    engine.world.gravity.y = 0;
    engineRef.current = engine;
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 400,
        wireframes: false,
        background: '#080816'
      }
    });
    renderRef.current = render;
    const ground = Matter.Bodies.rectangle(400, 390, 810, 20, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b'
      }
    });
    const top = Matter.Bodies.rectangle(400, 10, 810, 20, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b'
      }
    });
    const leftWall = Matter.Bodies.rectangle(10, 200, 20, 400, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b'
      }
    });
    const rightWall = Matter.Bodies.rectangle(790, 200, 20, 400, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b'
      }
    });
    const radius1 = 20 + mass1 * 5;
    const radius2 = 20 + mass2 * 5;
    const body1 = Matter.Bodies.circle(200, 200, radius1, {
      restitution: elasticity,
      friction: 0,
      frictionAir: 0,
      mass: mass1,
      render: {
        fillStyle: '#ff4444'
      },
      label: 'Body1'
    });
    const body2 = Matter.Bodies.circle(600, 200, radius2, {
      restitution: elasticity,
      friction: 0,
      frictionAir: 0,
      mass: mass2,
      render: {
        fillStyle: '#3b82f6'
      },
      label: 'Body2'
    });
    Matter.Body.setVelocity(body1, {
      x: vel1,
      y: 0
    });
    Matter.Body.setVelocity(body2, {
      x: vel2,
      y: 0
    });
    Matter.Composite.add(engine.world, [ground, top, leftWall, rightWall, body1, body2]);
    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Events.on(engine, 'beforeUpdate', () => {
      Matter.Body.setPosition(body1, {
        x: body1.position.x,
        y: 200
      });
      Matter.Body.setPosition(body2, {
        x: body2.position.x,
        y: 200
      });
      Matter.Body.setVelocity(body1, {
        x: body1.velocity.x,
        y: 0
      });
      Matter.Body.setVelocity(body2, {
        x: body2.velocity.x,
        y: 0
      });
      setPhysicsData({
        v1: body1.velocity.x,
        v2: body2.velocity.x,
        p1: body1.mass * body1.velocity.x,
        p2: body2.mass * body2.velocity.x
      });
    });
  }, [mass1, mass2, vel1, vel2, elasticity]);
  useEffect(() => {
    initSimulation();
    return () => {
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) {
          renderRef.current.canvas.remove();
        }
      }
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, [initSimulation]);
  useEffect(() => {
    if (!runnerRef.current || !engineRef.current) return;
    if (isPlaying) {
      Matter.Runner.run(runnerRef.current, engineRef.current);
    } else {
      Matter.Runner.stop(runnerRef.current);
    }
  }, [isPlaying]);
  const handleReset = () => {
    setIsPlaying(false);
    setPhysicsData({
      v1: vel1,
      v2: vel2,
      p1: mass1 * vel1,
      p2: mass2 * vel2
    });
    initSimulation();
  };

  // Compute display values
  const currentV1 = isPlaying ? physicsData.v1 : vel1;
  const currentV2 = isPlaying ? physicsData.v2 : vel2;
  const currentP1 = isPlaying ? physicsData.p1 : mass1 * vel1;
  const currentP2 = isPlaying ? physicsData.p2 : mass2 * vel2;
  const totalMomentum = currentP1 + currentP2;
  const totalKinetic = 0.5 * mass1 * currentV1 * currentV1 + 0.5 * mass2 * currentV2 * currentV2;
  return <div style={{
    width: '100%',
    height: '100%',
    position: 'absolute',
    inset: 0,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#f8fafc',
    pointerEvents: 'none'
  }}>
      {/* Centered Physics Scene Canvas */}
      <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
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
      </div>

      {/* Floating Left Panel: Live Physics Telemetry */}
      <div style={{
      position: 'absolute',
      top: '90px',
      left: '20px',
      width: '280px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '16px',
      zIndex: 10,
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      pointerEvents: 'auto'
    }}>
        <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px',
        margin: 0
      }}>
          Live Telemetry
        </h3>

        {/* Object 1 Stats */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
          <span style={{
          fontSize: '11px',
          color: '#ff4444',
          fontWeight: '600',
          letterSpacing: '0.05em'
        }}>OBJECT 1 (RED)</span>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span>Velocity:</span>
            <span style={{
            fontFamily: 'monospace'
          }}>{currentV1.toFixed(2)} m/s</span>
          </div>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span>Momentum:</span>
            <span style={{
            fontFamily: 'monospace'
          }}>{currentP1.toFixed(2)} kg·m/s</span>
          </div>
        </div>

        {/* Object 2 Stats */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '10px'
      }}>
          <span style={{
          fontSize: '11px',
          color: '#3b82f6',
          fontWeight: '600',
          letterSpacing: '0.05em'
        }}>OBJECT 2 (BLUE)</span>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span>Velocity:</span>
            <span style={{
            fontFamily: 'monospace'
          }}>{currentV2.toFixed(2)} m/s</span>
          </div>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span>Momentum:</span>
            <span style={{
            fontFamily: 'monospace'
          }}>{currentP2.toFixed(2)} kg·m/s</span>
          </div>
        </div>

        {/* System Totals */}
        <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '12px',
        marginTop: '6px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
          <span style={{
          fontSize: '11px',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>System Totals</span>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span>Momentum:</span>
            <span style={{
            fontFamily: 'monospace',
            fontWeight: '600',
            color: '#a855f7'
          }}>{totalMomentum.toFixed(2)} kg·m/s</span>
          </div>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span>Kinetic Energy:</span>
            <span style={{
            fontFamily: 'monospace',
            fontWeight: '600',
            color: '#10b981'
          }}>{totalKinetic.toFixed(2)} J</span>
          </div>
        </div>
      </div>

      {/* Floating Right Panel: Settings & Simulation Controls */}
      <div style={{
      position: 'absolute',
      top: '90px',
      right: '20px',
      width: '320px',
      maxHeight: 'calc(100% - 110px)',
      overflowY: 'auto',
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
        fontSize: '16px',
        fontWeight: '600',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px',
        margin: 0
      }}>
          Simulation Controls
        </h3>

        {/* Object 1 Config */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
          <span style={{
          fontSize: '11px',
          color: '#ff4444',
          fontWeight: '600',
          letterSpacing: '0.05em'
        }}>OBJECT 1 CONFIG</span>
          
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
              <span>Mass:</span>
              <span style={{
              fontWeight: '600'
            }}>{mass1} kg</span>
            </div>
            <input type="range" min="0.5" max="5" step="0.5" value={mass1} onChange={e => setMass1(Number(e.target.value))} disabled={isPlaying} style={{
            accentColor: '#ff4444',
            cursor: isPlaying ? 'not-allowed' : 'pointer'
          }} />
          </div>

          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
              <span>Velocity:</span>
              <span style={{
              fontWeight: '600'
            }}>{vel1} m/s</span>
            </div>
            <input type="range" min="-10" max="10" step="1" value={vel1} onChange={e => setVel1(Number(e.target.value))} disabled={isPlaying} style={{
            accentColor: '#ff4444',
            cursor: isPlaying ? 'not-allowed' : 'pointer'
          }} />
          </div>
        </div>

        {/* Object 2 Config */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '10px'
      }}>
          <span style={{
          fontSize: '11px',
          color: '#3b82f6',
          fontWeight: '600',
          letterSpacing: '0.05em'
        }}>OBJECT 2 CONFIG</span>
          
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
              <span>Mass:</span>
              <span style={{
              fontWeight: '600'
            }}>{mass2} kg</span>
            </div>
            <input type="range" min="0.5" max="5" step="0.5" value={mass2} onChange={e => setMass2(Number(e.target.value))} disabled={isPlaying} style={{
            accentColor: '#3b82f6',
            cursor: isPlaying ? 'not-allowed' : 'pointer'
          }} />
          </div>

          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
              <span>Velocity:</span>
              <span style={{
              fontWeight: '600'
            }}>{vel2} m/s</span>
            </div>
            <input type="range" min="-10" max="10" step="1" value={vel2} onChange={e => setVel2(Number(e.target.value))} disabled={isPlaying} style={{
            accentColor: '#3b82f6',
            cursor: isPlaying ? 'not-allowed' : 'pointer'
          }} />
          </div>
        </div>

        {/* Elasticity Config */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '10px'
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
            <span style={{
            color: '#cbd5e1'
          }}>Elasticity (Restitution):</span>
            <span style={{
            fontWeight: '600'
          }}>{elasticity}</span>
          </div>
          <input type="range" min="0" max="1" step="0.1" value={elasticity} onChange={e => setElasticity(Number(e.target.value))} disabled={isPlaying} style={{
          accentColor: '#a855f7',
          cursor: isPlaying ? 'not-allowed' : 'pointer'
        }} />
        </div>

        {/* Play/Pause/Reset Action Buttons */}
        <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '12px'
      }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{
          padding: '10px',
          background: isPlaying ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: isPlaying ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '8px',
          color: isPlaying ? '#fbbf24' : '#10b981',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
            {isPlaying ? 'Pause' : 'Start'}
          </button>
          <button onClick={handleReset} style={{
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
            Reset
          </button>
        </div>
      </div>
    </div>;
};
export default function Customphys_9({
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
                    {title || "1D Collision Lab"}
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
                 <Customphys_9Inner />
            </div>
        </div>;
}