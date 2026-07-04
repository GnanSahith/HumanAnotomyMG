import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
const Customphys_11Inner = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const skaterRef = useRef(null);
  const [energy, setEnergy] = useState({
    kinetic: 0,
    potential: 0,
    total: 0
  });
  useEffect(() => {
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Vector = Matter.Vector,
      Body = Matter.Body;
    const engine = Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 1;
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 500,
        wireframes: false,
        background: '#87CEEB'
      }
    });
    renderRef.current = render;
    const trackParts = [];
    const numParts = 100;
    let prevX = 0,
      prevY = 0;
    const a = 0.002;
    const h = 400;
    const k = 450;
    for (let i = 0; i <= numParts; i++) {
      const x = 50 + 700 / numParts * i;
      const y = a * Math.pow(x - h, 2) + 150;
      if (i > 0) {
        const dx = x - prevX;
        const dy = y - prevY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        const midX = prevX + dx / 2;
        const midY = prevY + dy / 2;
        trackParts.push(Bodies.rectangle(midX, midY, length + 2, 15, {
          isStatic: true,
          angle: angle,
          friction: 0.0,
          restitution: 0,
          render: {
            fillStyle: '#8B4513'
          }
        }));
      }
      prevX = x;
      prevY = y;
    }
    const ground = Bodies.rectangle(400, 520, 810, 60, {
      isStatic: true,
      render: {
        fillStyle: '#2E8B57'
      }
    });
    const skater = Bodies.circle(100, 100, 15, {
      restitution: 0.0,
      friction: 0.0,
      frictionAir: 0.0,
      density: 0.05,
      render: {
        fillStyle: '#FF0000'
      }
    });
    skaterRef.current = skater;
    Composite.add(engine.world, [...trackParts, ground, skater]);
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);
    Events.on(engine, 'afterUpdate', () => {
      if (!skater) return;
      const speed = skater.speed;
      const heightInMeters = (500 - skater.position.y) / 50;
      const mass = skater.mass;
      const kinetic = 0.5 * mass * (speed / 10) * (speed / 10);
      const potential = mass * 9.81 * heightInMeters * 0.005;
      setEnergy({
        kinetic,
        potential,
        total: kinetic + potential
      });
    });
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (engineRef.current) Engine.clear(engineRef.current);
      if (render.canvas) render.canvas.remove();
    };
  }, []);
  const resetSkater = () => {
    if (skaterRef.current) {
      Matter.Body.setPosition(skaterRef.current, {
        x: 100,
        y: 100
      });
      Matter.Body.setVelocity(skaterRef.current, {
        x: 0,
        y: 0
      });
      Matter.Body.setAngularVelocity(skaterRef.current, 0);
    }
  };
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
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
      }}>
                    <div ref={sceneRef} style={{
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }} />
                    <button onClick={resetSkater} style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          padding: '8px 16px',
          borderRadius: '10px',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          transition: 'all 0.3s ease'
        }}>
                        Reset Skater
                    </button>
                </div>
            </div>
            <div style={{
      position: 'absolute',
      top: '20px',
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
      gap: '15px'
    }}>
                <h3 style={{
        textAlign: 'center',
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: '#f8fafc'
      }}>Energy Bar Graph</h3>
                <div style={{
        height: '320px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        padding: '10px'
      }}>
                    <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '60px'
        }}>
                        <div style={{
            width: '32px',
            height: `${Math.min(260, energy.kinetic * 5000)}px`,
            backgroundColor: '#2ecc71',
            transition: 'height 0.05s linear',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 0 10px rgba(46, 204, 113, 0.3)'
          }} />
                        <span style={{
            marginTop: '10px',
            fontSize: '11px',
            fontWeight: '500',
            color: '#94a3b8'
          }}>Kinetic</span>
                    </div>
                    <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '60px'
        }}>
                        <div style={{
            width: '32px',
            height: `${Math.min(260, energy.potential * 5000)}px`,
            backgroundColor: '#3498db',
            transition: 'height 0.05s linear',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 0 10px rgba(52, 152, 219, 0.3)'
          }} />
                        <span style={{
            marginTop: '10px',
            fontSize: '11px',
            fontWeight: '500',
            color: '#94a3b8'
          }}>Potential</span>
                    </div>
                    <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '60px'
        }}>
                        <div style={{
            width: '32px',
            height: `${Math.min(260, energy.total * 5000)}px`,
            backgroundColor: '#e67e22',
            transition: 'height 0.05s linear',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 0 10px rgba(230, 126, 34, 0.3)'
          }} />
                        <span style={{
            marginTop: '10px',
            fontSize: '11px',
            fontWeight: '500',
            color: '#94a3b8'
          }}>Total</span>
                    </div>
                </div>
            </div>
        </div>;
};
export default function Customphys_11({
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
      inset: 0,
      zIndex: 1,
      pointerEvents: 'auto'
    }}>
                 <Customphys_11Inner onBack={null} title={""} />
            </div>
        </div>;
}