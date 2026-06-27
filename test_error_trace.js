var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/components/simulations/CustomBalancingChemicalEquations.jsx
var CustomBalancingChemicalEquations_exports = {};
__export(CustomBalancingChemicalEquations_exports, {
  default: () => CustomBalancingChemicalEquations
});
module.exports = __toCommonJS(CustomBalancingChemicalEquations_exports);
var import_lucide_react = require("lucide-react");
var import_react = __toESM(require("react"), 1);
var ATOM_COLORS = {
  N: "#3498db",
  // Blue
  H: "#ffffff",
  // White
  O: "#e74c3c",
  // Red
  C: "#95a5a6"
  // Grey
};
var REACTIONS = [{
  id: "ammonia",
  name: "Make Ammonia",
  reactants: [{
    id: "r1",
    label: "N\u2082",
    atoms: {
      N: 2
    },
    layout: "pair"
  }, {
    id: "r2",
    label: "H\u2082",
    atoms: {
      H: 2
    },
    layout: "pair"
  }],
  products: [{
    id: "p1",
    label: "NH\u2083",
    atoms: {
      N: 1,
      H: 3
    },
    layout: "center-surround"
  }],
  elements: ["N", "H"]
}, {
  id: "water",
  name: "Separate Water",
  reactants: [{
    id: "r1",
    label: "H\u2082O",
    atoms: {
      H: 2,
      O: 1
    },
    layout: "bent"
  }],
  products: [{
    id: "p1",
    label: "H\u2082",
    atoms: {
      H: 2
    },
    layout: "pair"
  }, {
    id: "p2",
    label: "O\u2082",
    atoms: {
      O: 2
    },
    layout: "pair"
  }],
  elements: ["H", "O"]
}, {
  id: "methane",
  name: "Combust Methane",
  reactants: [{
    id: "r1",
    label: "CH\u2084",
    atoms: {
      C: 1,
      H: 4
    },
    layout: "tetrahedral"
  }, {
    id: "r2",
    label: "O\u2082",
    atoms: {
      O: 2
    },
    layout: "pair"
  }],
  products: [{
    id: "p1",
    label: "CO\u2082",
    atoms: {
      C: 1,
      O: 2
    },
    layout: "linear"
  }, {
    id: "p2",
    label: "H\u2082O",
    atoms: {
      H: 2,
      O: 1
    },
    layout: "bent"
  }],
  elements: ["C", "H", "O"]
}];
var Atom = ({
  element,
  size = 20
}) => /* @__PURE__ */ import_react.default.createElement("div", { style: {
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: "50%",
  backgroundColor: ATOM_COLORS[element] || "#000",
  border: element === "H" ? "1px solid #dcdde1" : "none",
  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  display: "inline-block",
  flexShrink: 0
} });
var MoleculeCluster = ({
  type,
  config
}) => {
  if (config.layout === "pair") {
    const el = Object.keys(config.atoms)[0];
    return /* @__PURE__ */ import_react.default.createElement("div", { style: {
      display: "flex",
      alignItems: "center"
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: el, size: 24 }), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      marginLeft: "-6px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: el, size: 24 })));
  }
  if (config.layout === "center-surround") {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "relative",
      width: "50px",
      height: "45px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      top: 0,
      zIndex: 2
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "N", size: 28 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      bottom: 0,
      left: "-5px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      bottom: "-5px",
      left: "15px",
      zIndex: 3
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      bottom: 0,
      left: "35px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })));
  }
  if (config.layout === "bent") {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "relative",
      width: "40px",
      height: "40px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
      zIndex: 2
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "O", size: 28 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      bottom: "-8px",
      left: "-6px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      bottom: "-8px",
      right: "-6px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })));
  }
  if (config.layout === "tetrahedral") {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "relative",
      width: "50px",
      height: "50px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
      zIndex: 2
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "C", size: 30 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      top: "-12px",
      left: "5px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      bottom: "-12px",
      left: "5px",
      zIndex: 3
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      top: "5px",
      left: "-12px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      top: "5px",
      right: "-12px",
      zIndex: 1
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "H", size: 20 })));
  }
  if (config.layout === "linear") {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: {
      display: "flex",
      alignItems: "center"
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "O", size: 26 }), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      margin: "0 -4px",
      zIndex: 2
    } }, /* @__PURE__ */ import_react.default.createElement(Atom, { element: "C", size: 28 })), /* @__PURE__ */ import_react.default.createElement(Atom, { element: "O", size: 26 }));
  }
  return null;
};
var CoefficientControl = ({
  value,
  onChange,
  label
}) => {
  return /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "10px"
  } }, /* @__PURE__ */ import_react.default.createElement("span", { style: {
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: "bold"
  } }, label), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#334155",
    borderRadius: "8px",
    overflow: "hidden"
  } }, /* @__PURE__ */ import_react.default.createElement("button", { style: {
    padding: "8px 15px",
    backgroundColor: "#475569",
    border: "none",
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer"
  }, onClick: () => onChange(Math.max(0, value - 1)) }, "-"), /* @__PURE__ */ import_react.default.createElement("span", { style: {
    color: "#f8fafc",
    fontSize: "16px",
    fontWeight: "bold",
    width: "30px",
    textAlign: "center",
    display: "inline-block"
  } }, value), /* @__PURE__ */ import_react.default.createElement("button", { style: {
    padding: "8px 15px",
    backgroundColor: "#475569",
    border: "none",
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer"
  }, onClick: () => onChange(Math.min(9, value + 1)) }, "+")));
};
function CustomBalancingChemicalEquations({
  onBack,
  title
}) {
  const [activeReactionIdx, setActiveReactionIdx] = (0, import_react.useState)(0);
  const reaction = REACTIONS[activeReactionIdx];
  const [coeffs, setCoeffs] = (0, import_react.useState)({
    r1: 0,
    r2: 0,
    p1: 0,
    p2: 0
  });
  const handleSetReaction = (idx) => {
    setActiveReactionIdx(idx);
    setCoeffs({
      r1: 0,
      r2: 0,
      p1: 0,
      p2: 0
    });
  };
  const getElementCounts = () => {
    let reactantsCount2 = {};
    let productsCount2 = {};
    reaction.elements.forEach((el) => {
      reactantsCount2[el] = 0;
      productsCount2[el] = 0;
    });
    reaction.reactants.forEach((r) => {
      const coeff = coeffs[r.id] || 0;
      Object.keys(r.atoms).forEach((el) => {
        reactantsCount2[el] += r.atoms[el] * coeff;
      });
    });
    reaction.products.forEach((p) => {
      const coeff = coeffs[p.id] || 0;
      Object.keys(p.atoms).forEach((el) => {
        productsCount2[el] += p.atoms[el] * coeff;
      });
    });
    return {
      reactantsCount: reactantsCount2,
      productsCount: productsCount2
    };
  };
  const {
    reactantsCount,
    productsCount
  } = getElementCounts();
  const isBalanced = (0, import_react.useMemo)(() => {
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
  return /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#f8fafc",
    fontFamily: "system-ui, -apple-system, sans-serif",
    margin: 0,
    padding: 0,
    overflow: "hidden",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)"
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "15px 20px",
    backgroundColor: "transparent",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)"
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
    width: "60px"
  } })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    flex: 1,
    overflow: "hidden"
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
    flex: 2.5,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflowY: "auto"
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "40px",
    gap: "30px",
    flexWrap: "wrap"
  } }, reaction.elements.map((el) => {
    const leftCount = reactantsCount[el];
    const rightCount = productsCount[el];
    let tilt = 0;
    if (leftCount > rightCount) tilt = -15;
    if (rightCount > leftCount) tilt = 15;
    return /* @__PURE__ */ import_react.default.createElement("div", { key: el, style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "150px"
    } }, /* @__PURE__ */ import_react.default.createElement("span", { style: {
      color: "#cbd5e1",
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "15px"
    } }, el, " Atoms"), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "80px"
    } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
      marginRight: "10px"
    } }, /* @__PURE__ */ import_react.default.createElement("span", { style: {
      fontSize: "24px",
      fontWeight: "bold"
    } }, leftCount)), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-end",
      width: "60px",
      height: "50px",
      position: "relative"
    } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
      width: "80px",
      height: "6px",
      backgroundColor: "#64748b",
      borderRadius: "3px",
      position: "absolute",
      top: "10px",
      transform: `rotate(${tilt}deg)`,
      transformOrigin: "center",
      transition: "transform 0.3s ease",
      zIndex: 2,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    } }, leftCount === rightCount && leftCount > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: {
      position: "absolute",
      top: "-30px",
      backgroundColor: "#22c55e",
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#fff",
      fontWeight: "bold",
      fontSize: "14px"
    } }, "&check;")), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      width: 0,
      height: 0,
      borderLeft: "15px solid transparent",
      borderRight: "15px solid transparent",
      borderBottom: "25px solid #94a3b8"
    } })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
      marginLeft: "10px"
    } }, /* @__PURE__ */ import_react.default.createElement("span", { style: {
      fontSize: "24px",
      fontWeight: "bold"
    } }, rightCount))));
  })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    width: "100%",
    maxWidth: "900px"
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  } }, /* @__PURE__ */ import_react.default.createElement("h2", { style: {
    color: "#94a3b8",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "20px",
    textTransform: "uppercase"
  } }, "Reactants"), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "15px"
  } }, reaction.reactants.map((r) => /* @__PURE__ */ import_react.default.createElement("div", { key: r.id, style: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    padding: "10px",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    minWidth: "80px",
    minHeight: "80px",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)"
  } }, Array.from({
    length: coeffs[r.id] || 0
  }).map((_, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "60px",
    height: "60px"
  } }, /* @__PURE__ */ import_react.default.createElement(MoleculeCluster, { config: r }))))))), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    width: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  } }, /* @__PURE__ */ import_react.default.createElement("span", { style: {
    color: "#cbd5e1",
    fontSize: "40px",
    fontWeight: "bold"
  } }, "\u2192")), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  } }, /* @__PURE__ */ import_react.default.createElement("h2", { style: {
    color: "#94a3b8",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "20px",
    textTransform: "uppercase"
  } }, "Products"), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "15px"
  } }, reaction.products.map((p) => /* @__PURE__ */ import_react.default.createElement("div", { key: p.id, style: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    padding: "10px",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    minWidth: "80px",
    minHeight: "80px",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)"
  } }, Array.from({
    length: coeffs[p.id] || 0
  }).map((_, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "60px",
    height: "60px"
  } }, /* @__PURE__ */ import_react.default.createElement(MoleculeCluster, { config: p }))))))))), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderLeft: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)"
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
    padding: "20px"
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  } }, /* @__PURE__ */ import_react.default.createElement("h3", { style: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: "15px",
    textAlign: "center",
    marginTop: 0
  } }, "Select Reaction"), REACTIONS.map((r, idx) => {
    const isActive = activeReactionIdx === idx;
    return /* @__PURE__ */ import_react.default.createElement("button", { key: r.id, onClick: () => handleSetReaction(idx), style: {
      width: "100%",
      backgroundColor: isActive ? "#3b82f6" : "rgba(51, 65, 85, 0.5)",
      padding: "12px 15px",
      borderRadius: "10px",
      marginBottom: "10px",
      border: `1px solid ${isActive ? "#60a5fa" : "rgba(255, 255, 255, 0.05)"}`,
      color: isActive ? "#ffffff" : "#cbd5e1",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease"
    } }, r.name);
  })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  } }, /* @__PURE__ */ import_react.default.createElement("h3", { style: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: "15px",
    textAlign: "center",
    marginTop: 0
  } }, "Adjust Coefficients"), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    fontSize: "14px",
    color: "#94a3b8",
    textTransform: "uppercase",
    margin: "10px 0",
    fontWeight: "bold"
  } }, "Reactants"), reaction.reactants.map((r) => /* @__PURE__ */ import_react.default.createElement(CoefficientControl, { key: r.id, label: r.label, value: coeffs[r.id], onChange: (val) => setCoeffs({
    ...coeffs,
    [r.id]: val
  }) })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    fontSize: "14px",
    color: "#94a3b8",
    textTransform: "uppercase",
    margin: "10px 0",
    fontWeight: "bold"
  } }, "Products"), reaction.products.map((p) => /* @__PURE__ */ import_react.default.createElement(CoefficientControl, { key: p.id, label: p.label, value: coeffs[p.id], onChange: (val) => setCoeffs({
    ...coeffs,
    [p.id]: val
  }) }))), isBalanced && /* @__PURE__ */ import_react.default.createElement("div", { style: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    border: "1px solid #22c55e",
    padding: "15px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  } }, /* @__PURE__ */ import_react.default.createElement("span", { style: {
    color: "#4ade80",
    fontSize: "18px",
    fontWeight: "bold"
  } }, "\u{1F389} Equation Balanced!"))))));
}
