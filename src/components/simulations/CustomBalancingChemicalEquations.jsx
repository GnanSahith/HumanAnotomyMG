import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useState, useMemo } from 'react';
const ATOM_COLORS = {
  N: '#3498db',
  // Blue
  H: '#ffffff',
  // White
  O: '#e74c3c',
  // Red
  C: '#95a5a6' // Grey
};
const REACTIONS = [{
  id: 'ammonia',
  name: 'Make Ammonia',
  reactants: [{
    id: 'r1',
    label: 'N₂',
    atoms: {
      N: 2
    },
    layout: 'pair'
  }, {
    id: 'r2',
    label: 'H₂',
    atoms: {
      H: 2
    },
    layout: 'pair'
  }],
  products: [{
    id: 'p1',
    label: 'NH₃',
    atoms: {
      N: 1,
      H: 3
    },
    layout: 'center-surround'
  }],
  elements: ['N', 'H']
}, {
  id: 'water',
  name: 'Separate Water',
  reactants: [{
    id: 'r1',
    label: 'H₂O',
    atoms: {
      H: 2,
      O: 1
    },
    layout: 'bent'
  }],
  products: [{
    id: 'p1',
    label: 'H₂',
    atoms: {
      H: 2
    },
    layout: 'pair'
  }, {
    id: 'p2',
    label: 'O₂',
    atoms: {
      O: 2
    },
    layout: 'pair'
  }],
  elements: ['H', 'O']
}, {
  id: 'methane',
  name: 'Combust Methane',
  reactants: [{
    id: 'r1',
    label: 'CH₄',
    atoms: {
      C: 1,
      H: 4
    },
    layout: 'tetrahedral'
  }, {
    id: 'r2',
    label: 'O₂',
    atoms: {
      O: 2
    },
    layout: 'pair'
  }],
  products: [{
    id: 'p1',
    label: 'CO₂',
    atoms: {
      C: 1,
      O: 2
    },
    layout: 'linear'
  }, {
    id: 'p2',
    label: 'H₂O',
    atoms: {
      H: 2,
      O: 1
    },
    layout: 'bent'
  }],
  elements: ['C', 'H', 'O']
}];
const Atom = ({
  element,
  size = 20
}) => <div style={{
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: '50%',
  backgroundColor: ATOM_COLORS[element] || '#000',
  border: element === 'H' ? '1px solid #dcdde1' : 'none',
  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  display: 'inline-block',
  flexShrink: 0
}} />;
const MoleculeCluster = ({
  type,
  config
}) => {
  if (config.layout === 'pair') {
    const el = Object.keys(config.atoms)[0];
    return <div style={{
      display: 'flex',
      alignItems: 'center'
    }}>
        <Atom element={el} size={24} />
        <div style={{
        marginLeft: '-6px',
        zIndex: 1
      }}>
          <Atom element={el} size={24} />
        </div>
      </div>;
  }
  if (config.layout === 'center-surround') {
    return <div style={{
      position: 'relative',
      width: '50px',
      height: '45px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
        <div style={{
        position: 'absolute',
        top: 0,
        zIndex: 2
      }}>
          <Atom element="N" size={28} />
        </div>
        <div style={{
        position: 'absolute',
        bottom: 0,
        left: '-5px',
        zIndex: 1
      }}>
          <Atom element="H" size={20} />
        </div>
        <div style={{
        position: 'absolute',
        bottom: '-5px',
        left: '15px',
        zIndex: 3
      }}>
          <Atom element="H" size={20} />
        </div>
        <div style={{
        position: 'absolute',
        bottom: 0,
        left: '35px',
        zIndex: 1
      }}>
          <Atom element="H" size={20} />
        </div>
      </div>;
  }
  if (config.layout === 'bent') {
    return <div style={{
      position: 'relative',
      width: '40px',
      height: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
        <div style={{
        zIndex: 2
      }}>
          <Atom element="O" size={28} />
        </div>
        <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '-6px',
        zIndex: 1
      }}>
          <Atom element="H" size={20} />
        </div>
        <div style={{
        position: 'absolute',
        bottom: '-8px',
        right: '-6px',
        zIndex: 1
      }}>
          <Atom element="H" size={20} />
        </div>
      </div>;
  }
  if (config.layout === 'tetrahedral') {
    return <div style={{
      position: 'relative',
      width: '50px',
      height: '50px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
        <div style={{
        zIndex: 2
      }}>
          <Atom element="C" size={30} />
        </div>
        <div style={{
        position: 'absolute',
        top: '-12px',
        left: '5px',
        zIndex: 1
      }}>
          <Atom element="H" size={20} />
        </div>
        <div style={{
        position: 'absolute',
        bottom: '-12px',
        left: '5px',
        zIndex: 3
      }}>
          <Atom element="H" size={20} />
        </div>
        <div style={{
        position: 'absolute',
        top: '5px',
        left: '-12px',
        zIndex: 1
      }}>
          <Atom element="H" size={20} />
        </div>
        <div style={{
        position: 'absolute',
        top: '5px',
        right: '-12px',
        zIndex: 1
      }}>
          <Atom element="H" size={20} />
        </div>
      </div>;
  }
  if (config.layout === 'linear') {
    return <div style={{
      display: 'flex',
      alignItems: 'center'
    }}>
        <Atom element="O" size={26} />
        <div style={{
        margin: '0 -4px',
        zIndex: 2
      }}>
          <Atom element="C" size={28} />
        </div>
        <Atom element="O" size={26} />
      </div>;
  }
  return null;
};
const CoefficientControl = ({
  value,
  onChange,
  label
}) => {
  return <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '10px'
  }}>
      <span style={{
      color: '#f8fafc',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>{label}</span>
      <div style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#334155',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
        <button style={{
        padding: '8px 15px',
        backgroundColor: '#475569',
        border: 'none',
        color: '#f8fafc',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }} onClick={() => onChange(Math.max(0, value - 1))}>
          -
        </button>
        <span style={{
        color: '#f8fafc',
        fontSize: '16px',
        fontWeight: 'bold',
        width: '30px',
        textAlign: 'center',
        display: 'inline-block'
      }}>{value}</span>
        <button style={{
        padding: '8px 15px',
        backgroundColor: '#475569',
        border: 'none',
        color: '#f8fafc',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }} onClick={() => onChange(Math.min(9, value + 1))}>
          +
        </button>
      </div>
    </div>;
};
export default function CustomBalancingChemicalEquations({
  onBack,
  title, isPlaying: globalIsPlaying, syncPlayState
}) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const isPlaying = typeof globalIsPlaying !== 'undefined' ? globalIsPlaying : localIsPlaying;
  const setIsPlaying = typeof syncPlayState === 'function' ? syncPlayState : setLocalIsPlaying;
  const [activeReactionIdx, setActiveReactionIdx] = useState(0);
  const reaction = REACTIONS[activeReactionIdx];
  const [coeffs, setCoeffs] = useState({
    r1: 0,
    r2: 0,
    p1: 0,
    p2: 0
  });
  const handleSetReaction = idx => {
    setActiveReactionIdx(idx);
    setCoeffs({
      r1: 0,
      r2: 0,
      p1: 0,
      p2: 0
    });
  };
  const getElementCounts = () => {
    let reactantsCount = {};
    let productsCount = {};
    reaction.elements.forEach(el => {
      reactantsCount[el] = 0;
      productsCount[el] = 0;
    });
    reaction.reactants.forEach(r => {
      const coeff = coeffs[r.id] || 0;
      Object.keys(r.atoms).forEach(el => {
        reactantsCount[el] += r.atoms[el] * coeff;
      });
    });
    reaction.products.forEach(p => {
      const coeff = coeffs[p.id] || 0;
      Object.keys(p.atoms).forEach(el => {
        productsCount[el] += p.atoms[el] * coeff;
      });
    });
    return {
      reactantsCount,
      productsCount
    };
  };
  const {
    reactantsCount,
    productsCount
  } = getElementCounts();
  const isBalanced = useMemo(() => {
    let hasNonZero = false;
    for (let c of Object.values(coeffs)) {
      if (c > 0) hasNonZero = true;
    }
    if (!hasNonZero) return false;
    for (let el of reaction.elements) {
      if (reactantsCount[el] !== productsCount[el]) return false;
    }
    return true;
  }, [coeffs, reactantsCount, productsCount, reaction.elements]);
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: "rgba(255,255,255,0.05)",
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)"
  }}>
      {/* Top Bar */}
      <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '15px 20px',
      backgroundColor: "transparent",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)"
    }}>
        
        
        <div style={{
        width: '60px'
      }} />
      </div>

      <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    }}>
        {/* Left Side: Canvas Area */}
        <div style={{
        flex: 2.5,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto'
      }}>
          {/* Balancing Scales */}
          <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px',
          gap: '30px',
          flexWrap: 'wrap'
        }}>
            {reaction.elements.map(el => {
            const leftCount = reactantsCount[el];
            const rightCount = productsCount[el];
            let tilt = 0;
            if (leftCount > rightCount) tilt = -15; // tilt left
            if (rightCount > leftCount) tilt = 15; // tilt right

            return <div key={el} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '150px'
            }}>
                  <span style={{
                color: '#cbd5e1',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '15px'
              }}>
                    {el} Atoms
                  </span>
                  <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '80px'
              }}>
                    <div style={{
                  marginRight: '10px'
                }}>
                      <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>{leftCount}</span>
                    </div>
                    <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  width: '60px',
                  height: '50px',
                  position: 'relative'
                }}>
                      <div style={{
                    width: '80px',
                    height: '6px',
                    backgroundColor: '#64748b',
                    borderRadius: '3px',
                    position: 'absolute',
                    top: '10px',
                    transform: `rotate(${tilt}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease',
                    zIndex: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                        {leftCount === rightCount && leftCount > 0 && <div style={{
                      position: 'absolute',
                      top: '-30px',
                      backgroundColor: '#22c55e',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                            &check;
                          </div>}
                      </div>
                      <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: '15px solid transparent',
                    borderRight: '15px solid transparent',
                    borderBottom: '25px solid #94a3b8'
                  }} />
                    </div>
                    <div style={{
                  marginLeft: '10px'
                }}>
                      <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>{rightCount}</span>
                    </div>
                  </div>
                </div>;
          })}
          </div>

          {/* Molecule Visualization */}
          <div style={{
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '20px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          width: '100%',
          maxWidth: '900px'
        }}>
            <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
              <h2 style={{
              color: '#94a3b8',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textTransform: 'uppercase'
            }}>
                Reactants
              </h2>
              <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '15px'
            }}>
                {reaction.reactants.map(r => <div key={r.id} style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px',
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: '12px',
                minWidth: '80px',
                minHeight: '80px',
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                    {Array.from({
                  length: coeffs[r.id] || 0
                }).map((_, i) => <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '60px',
                  height: '60px'
                }}>
                        <MoleculeCluster config={r} />
                      </div>)}
                  </div>)}
              </div>
            </div>

            <div style={{
            width: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
              <span style={{
              color: '#cbd5e1',
              fontSize: '40px',
              fontWeight: 'bold'
            }}>&rarr;</span>
            </div>

            <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
              <h2 style={{
              color: '#94a3b8',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textTransform: 'uppercase'
            }}>
                Products
              </h2>
              <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '15px'
            }}>
                {reaction.products.map(p => <div key={p.id} style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px',
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: '12px',
                minWidth: '80px',
                minHeight: '80px',
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                    {Array.from({
                  length: coeffs[p.id] || 0
                }).map((_, i) => <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '60px',
                  height: '60px'
                }}>
                        <MoleculeCluster config={p} />
                      </div>)}
                  </div>)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderLeft: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
          <div style={{
          padding: '20px'
        }}>
            {/* Reaction Selector */}
            <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
              <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#f8fafc',
              marginBottom: '15px',
              textAlign: 'center',
              marginTop: 0
            }}>
                Select Reaction
              </h3>
              {REACTIONS.map((r, idx) => {
              const isActive = activeReactionIdx === idx;
              return <button key={r.id} onClick={() => handleSetReaction(idx)} style={{
                width: '100%',
                backgroundColor: isActive ? '#3b82f6' : 'rgba(51, 65, 85, 0.5)',
                padding: '12px 15px',
                borderRadius: '10px',
                marginBottom: '10px',
                border: `1px solid ${isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)'}`,
                color: isActive ? '#ffffff' : '#cbd5e1',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                    {r.name}
                  </button>;
            })}
            </div>

            {/* Coefficient Controls */}
            <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
              <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#f8fafc',
              marginBottom: '15px',
              textAlign: 'center',
              marginTop: 0
            }}>
                Adjust Coefficients
              </h3>
              
              <div style={{
              fontSize: '14px',
              color: '#94a3b8',
              textTransform: 'uppercase',
              margin: '10px 0',
              fontWeight: 'bold'
            }}>
                Reactants
              </div>
              {reaction.reactants.map(r => <CoefficientControl key={r.id} label={r.label} value={coeffs[r.id]} onChange={val => setCoeffs({
              ...coeffs,
              [r.id]: val
            })} />)}

              <div style={{
              fontSize: '14px',
              color: '#94a3b8',
              textTransform: 'uppercase',
              margin: '10px 0',
              fontWeight: 'bold'
            }}>
                Products
              </div>
              {reaction.products.map(p => <CoefficientControl key={p.id} label={p.label} value={coeffs[p.id]} onChange={val => setCoeffs({
              ...coeffs,
              [p.id]: val
            })} />)}
            </div>

            {isBalanced && <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid #22c55e',
            padding: '15px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
                <span style={{
              color: '#4ade80',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
                  🎉 Equation Balanced!
                </span>
              </div>}
          </div>
        </div>
      </div>
    </div>;
}