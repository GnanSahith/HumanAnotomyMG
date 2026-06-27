import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles, Info, Lightbulb, Flame, Eye, Zap, HelpCircle, TrendingUp, Atom, Settings2 } from 'lucide-react';

/**
 * CustomMoleculesandLight Physics & Chemistry Simulation Component
 * 
 * --------------------------------------------------------------------------
 * PHYSICAL & CHEMICAL MECHANICS AND MATH DOCUMENTATION
 * --------------------------------------------------------------------------
 * 
 * 1. Molecular Representation:
 *    Molecules are represented as a particle system of N atoms.
 *    Each atom i has a position p_i = (x_i, y_i), velocity v_i = (vx_i, vy_i), mass m_i,
 *    radius r_i, chemical symbol, and color.
 * 
 * 2. Spring-Damper Bond Physics:
 *    Bonds are modeled as linear springs governed by Hooke's Law with damping.
 *    For a bond between atom A and atom B with rest length L:
 *      r = p_B - p_A
 *      dist = ||r||
 *      u = r / dist  (unit vector along bond)
 *      v_rel = (v_B - v_A) · u  (relative velocity along bond direction)
 *      F_spring = -k_spring * (dist - L) - c_damping * v_rel
 *    Force vectors:
 *      F_A = -F_spring * u
 *      F_B = F_spring * u
 * 
 * 3. Angular Stabilization (Bent vs Linear structures):
 *    To maintain angular geometries (104.5° for H2O, 117° for O3, 180° for CO2)
 *    without complex torque equations, we introduce a virtual spring between the
 *    outer atoms. The rest length of this virtual spring is pre-calculated using the
 *    Law of Cosines:
 *      L_virtual = sqrt(L_A^2 + L_B^2 - 2 * L_A * L_B * cos(theta_equilibrium))
 *    This acts as a restoring force resisting bending, stabilizing the molecular geometry.
 * 
 * 4. Rotational Motion (Microwave Interaction):
 *    Microwave photons excite rotational states in polar molecules (CO, H2O, O3).
 *    When a microwave photon is absorbed, a torque is simulated by applying a rotational
 *    angular velocity omega around the molecule's Center of Mass (COM).
 *    Let COM = sum(m_i * p_i) / sum(m_i).
 *    For each atom i, relative position dx_i = x_i - x_COM, dy_i = y_i - y_COM.
 *    To rotate coordinates by d_theta = omega * dt:
 *      x_new = x_COM + dx_i * cos(d_theta) - dy_i * sin(d_theta)
 *      y_new = y_COM + dx_i * sin(d_theta) + dy_i * cos(d_theta)
 *    And rotate velocity vectors to maintain consistency:
 *      vx_new = vx_i * cos(d_theta) - vy_i * sin(d_theta)
 *      vy_new = vx_i * sin(d_theta) + vy_i * cos(d_theta)
 * 
 * 5. Vibrational Motion (Infrared & Ultraviolet Interaction):
 *    IR photons excite vibrational states in greenhouse/polar molecules (CO2, H2O, O3, CO).
 *    UV photons carry higher energy, causing electronic excitation (vibrating and glowing)
 *    in non-ozone molecules, or photodissociation in Ozone.
 *    Vibration is simulated by setting a vibration timer and applying a series of
 *    random velocity kicks to atoms to initiate stretching and bending.
 *    During vibration, internal damping is reduced to allow sustained oscillations.
 * 
 * 6. Greenhouse Gas Re-emission (Radiative Forcing):
 *    When the vibrational state (timer) expires, the greenhouse molecule relaxes back
 *    to ground state by re-emitting a photon of the same frequency (IR or UV) in a
 *    completely random direction (angle phi in [0, 2*pi]), simulating greenhouse scattering.
 * 
 * 7. Photodissociation (Ozone UV-B/C Shielding):
 *    UV light carries enough energy to break the O-O bond in Ozone (O3).
 *    Upon UV collision with O3:
 *      - The bond between O1 (apex) and O3 (bottom-right) is flagged as broken.
 *      - The virtual stabilizing bond between O2 and O3 is also broken.
 *      - The dissociated Oxygen atom (O3) is given an outward velocity.
 *      - The remaining O2 molecule gains a recoil velocity in the opposite direction
 *        to conserve momentum: m_O2 * v_O2 + m_O * v_O = 0.
 *      - A recombine timer is set. In the dissociated state, a weak attractive force pulls
 *        the free O atom back towards the O2 center of mass if it drifts too far.
 *      - When the timer expires, the bonds are restored, and spring forces pull the
 *        atoms back into a stable Ozone bent shape.
 * 
 * 8. Global Restoring Potential:
 *    To prevent the molecule from drifting off canvas due to photon collisions, re-emission recoil,
 *    or user dragging, a soft global restoring force pulls the molecule's Center of Mass
 *    back to the canvas center (500, 230).
 */

const MOLECULES = [{
  name: 'Water',
  formula: 'H₂O',
  type: 'Polar / Greenhouse Gas',
  dipole: 'Highly Polar (permanent dipole from bent shape)',
  greenhouse: 'Yes (natural heat-trapping gas)',
  description: 'Water has a bent geometry with a 104.5° angle. Its highly polar nature makes it highly responsive to microwaves (causing rapid rotation) and infrared radiation (causing intense bond stretching/bending, trapping atmospheric heat).',
  details: 'Water vapor is the most abundant greenhouse gas. In this simulation, observe how it absorbs microwaves to spin, and absorbs infrared to vibrate, later scattering the IR photon in a random direction.'
}, {
  name: 'Carbon Dioxide',
  formula: 'CO₂',
  type: 'Non-polar / Greenhouse Gas',
  dipole: 'Non-polar at rest (symmetric, dipoles cancel out)',
  greenhouse: 'Yes (primary driver of anthropogenic warming)',
  description: 'Carbon dioxide is linear. Although symmetric and non-polar at rest, its asymmetric stretching and bending vibrations create transient dipole moments. This makes it highly active in the infrared range, trapping heat.',
  details: 'Because CO₂ is symmetric, it does not rotate under microwave radiation. However, IR photons match its vibrational frequencies, causing bonds to bend/stretch. The subsequent random re-emission is the core physics of the Greenhouse Effect.'
}, {
  name: 'Carbon Monoxide',
  formula: 'CO',
  type: 'Polar Diatomic / Indirect Greenhouse',
  dipole: 'Polar (permanent dipole due to electronegativity)',
  greenhouse: 'Indirect (scavenges OH radicals, raising CH₄)',
  description: 'Carbon monoxide consists of one carbon and one oxygen atom. Because of the difference in electronegativity, it is polar. It absorbs microwave radiation (causing rotation) and infrared radiation (causing bond stretching).',
  details: 'CO has a triple bond, modeled here as three parallel springs. It is highly polar, so it spins vigorously when hit by microwaves, and vibrates when hit by infrared.'
}, {
  name: 'Ozone',
  formula: 'O₃',
  type: 'Polar Triatomic / UV Shield',
  dipole: 'Polar (bent shape with formal charges)',
  greenhouse: 'Yes (acts as greenhouse gas in troposphere)',
  description: 'Ozone is a bent molecule with a 117° angle. It is polar and acts as a greenhouse gas. Most importantly, it absorbs high-energy Ultraviolet (UV) radiation, which breaks one of its bonds (photodissociation), shielding Earth.',
  details: 'When Ozone absorbs UV light, the bond splits, producing O₂ and a free O radical. They drift apart, absorbing the photon\'s energy, and later recombine to release heat. This cycle in the stratosphere blocks 98% of harmful UV rays.'
}, {
  name: 'Nitrogen',
  formula: 'N₂',
  type: 'Homonuclear Diatomic',
  dipole: 'Non-polar (no dipole moment)',
  greenhouse: 'No (transparent to IR)',
  description: 'Nitrogen consists of two nitrogen atoms joined by a strong triple bond. Being homonuclear, it has no permanent dipole, nor can it develop a transient dipole during vibration. It is completely transparent to microwave and infrared.',
  details: 'Nitrogen makes up 78% of Earth\'s atmosphere. Because it is diatomic and homonuclear, it does not interact with IR, meaning it does not contribute to the greenhouse effect.'
}, {
  name: 'Oxygen',
  formula: 'O₂',
  type: 'Homonuclear Diatomic',
  dipole: 'Non-polar (no dipole moment)',
  greenhouse: 'No (transparent to IR)',
  description: 'Oxygen consists of two oxygen atoms joined by a double bond. Like Nitrogen, it is homonuclear and has no dipole. It does not interact with microwave or infrared photons. It only interacts with high-energy UV light.',
  details: 'Oxygen makes up 21% of the atmosphere. It does not trap heat (IR-inactive) but absorbs extremely short, high-energy UV light in the upper atmosphere. In this simulation, UV causes it to vibrate/excite.'
}];
const LIGHT_TYPES = [{
  id: 'microwave',
  name: 'Microwave',
  energy: 'Low Energy',
  effect: 'Rotates Polar Molecules',
  color: '#D97706',
  // amber
  wavelengthInfo: 'Wavelength: ~1 mm to 30 cm | Frequency: ~1 to 300 GHz',
  explainer: 'Microwave photons have low energy. They match the energy differences between molecular rotational states. Polar molecules (H₂O, CO, O₃) have dipoles that couple with the microwave electric field, absorbing the photon and rotating. Non-polar molecules (N₂, O₂, CO₂) ignore them.',
  icon: Zap
}, {
  id: 'infrared',
  name: 'Infrared',
  energy: 'Medium-Low Energy',
  effect: 'Vibrates Greenhouse Gases',
  color: '#EF4444',
  // red
  wavelengthInfo: 'Wavelength: ~700 nm to 1 mm | Frequency: ~300 GHz to 430 THz',
  explainer: 'Infrared radiation matches the vibrational transitions of chemical bonds. When greenhouse gases (CO₂, H₂O, O₃, CO) absorb IR, their bonds stretch and bend. They stay excited for a short duration, then re-emit the IR photon in a random direction (the greenhouse effect). Non-polar gases (N₂, O₂) are IR-inactive.',
  icon: Flame
}, {
  id: 'visible',
  name: 'Visible Light',
  energy: 'Medium Energy',
  effect: 'Passes Through (Transparent)',
  color: '#10B981',
  // emerald
  wavelengthInfo: 'Wavelength: ~400 to 700 nm | Frequency: ~430 to 750 THz',
  explainer: 'Visible light is in the middle of the spectrum. These common atmospheric gases have no electronic transitions that match visible light, and they have no vibrational/rotational coupling at these frequencies. Visible photons pass straight through them, which is why the atmosphere is transparent to sunlight.',
  icon: Eye
}, {
  id: 'ultraviolet',
  name: 'Ultraviolet',
  energy: 'High Energy',
  effect: 'Dissociates or Excites Molecules',
  color: '#A855F7',
  // purple
  wavelengthInfo: 'Wavelength: ~10 to 400 nm | Frequency: ~750 THz to 30 PHz',
  explainer: 'Ultraviolet photons carry high energy, capable of exciting electrons or breaking chemical bonds. UV light breaks Ozone (O₃) into O₂ and O (photodissociation). For other molecules, it causes intense electronic excitation (drawn as rapid vibration and a violet glow) before relaxation.',
  icon: Sparkles
}];

// ---------------------------------------------------------
// STATIC PHYSICS ENGINE UTILITIES (DEFINED OUTSIDE COMPONENT)
// ---------------------------------------------------------

const getCenterOfMass = atoms => {
  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;
  atoms.forEach(a => {
    sumX += a.x * a.mass;
    sumY += a.y * a.mass;
    totalMass += a.mass;
  });
  return {
    x: sumX / totalMass,
    y: sumY / totalMass
  };
};
const getInitialMoleculeState = name => {
  const cx = 500;
  const cy = 230; // slightly higher than middle

  let atoms = [];
  let bonds = [];
  switch (name) {
    case 'Carbon Monoxide':
      atoms = [{
        x: cx - 35,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 12,
        symbol: 'C',
        color: '#64748B',
        radius: 21
      }, {
        x: cx + 35,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 16,
        symbol: 'O',
        color: '#EF4444',
        radius: 23
      }];
      bonds = [{
        atomA: 0,
        atomB: 1,
        restLength: 70,
        type: 'triple',
        broken: false
      }];
      break;
    case 'Carbon Dioxide':
      atoms = [{
        x: cx - 75,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 16,
        symbol: 'O',
        color: '#EF4444',
        radius: 23
      }, {
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 12,
        symbol: 'C',
        color: '#64748B',
        radius: 21
      }, {
        x: cx + 75,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 16,
        symbol: 'O',
        color: '#EF4444',
        radius: 23
      }];
      bonds = [{
        atomA: 0,
        atomB: 1,
        restLength: 75,
        type: 'double',
        broken: false
      }, {
        atomA: 1,
        atomB: 2,
        restLength: 75,
        type: 'double',
        broken: false
      }, {
        atomA: 0,
        atomB: 2,
        restLength: 150,
        type: 'virtual',
        broken: false
      }];
      break;
    case 'Water':
      {
        const angleRad = 104.5 * Math.PI / 180;
        const halfAngle = angleRad / 2;
        const len = 65;
        const ox = cx;
        const oy = cy - 20;
        const h1x = ox - len * Math.sin(halfAngle);
        const h1y = oy + len * Math.cos(halfAngle);
        const h2x = ox + len * Math.sin(halfAngle);
        const h2y = oy + len * Math.cos(halfAngle);
        atoms = [{
          x: ox,
          y: oy,
          vx: 0,
          vy: 0,
          mass: 16,
          symbol: 'O',
          color: '#EF4444',
          radius: 23
        }, {
          x: h1x,
          y: h1y,
          vx: 0,
          vy: 0,
          mass: 1,
          symbol: 'H',
          color: '#F8FAFC',
          radius: 14
        }, {
          x: h2x,
          y: h2y,
          vx: 0,
          vy: 0,
          mass: 1,
          symbol: 'H',
          color: '#F8FAFC',
          radius: 14
        }];
        const distH1H2 = Math.sqrt(Math.pow(h1x - h2x, 2) + Math.pow(h1y - h2y, 2));
        bonds = [{
          atomA: 0,
          atomB: 1,
          restLength: len,
          type: 'single',
          broken: false
        }, {
          atomA: 0,
          atomB: 2,
          restLength: len,
          type: 'single',
          broken: false
        }, {
          atomA: 1,
          atomB: 2,
          restLength: distH1H2,
          type: 'virtual',
          broken: false
        }];
        break;
      }
    case 'Nitrogen':
      atoms = [{
        x: cx - 35,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 14,
        symbol: 'N',
        color: '#3B82F6',
        radius: 21
      }, {
        x: cx + 35,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 14,
        symbol: 'N',
        color: '#3B82F6',
        radius: 21
      }];
      bonds = [{
        atomA: 0,
        atomB: 1,
        restLength: 70,
        type: 'triple',
        broken: false
      }];
      break;
    case 'Oxygen':
      atoms = [{
        x: cx - 35,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 16,
        symbol: 'O',
        color: '#EF4444',
        radius: 23
      }, {
        x: cx + 35,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 16,
        symbol: 'O',
        color: '#EF4444',
        radius: 23
      }];
      bonds = [{
        atomA: 0,
        atomB: 1,
        restLength: 70,
        type: 'double',
        broken: false
      }];
      break;
    case 'Ozone':
      {
        const angleRad = 117 * Math.PI / 180;
        const halfAngle = angleRad / 2;
        const len = 70;
        const o1x = cx;
        const o1y = cy - 25;
        const o2x = o1x - len * Math.sin(halfAngle);
        const o2y = o1y + len * Math.cos(halfAngle);
        const o3x = o1x + len * Math.sin(halfAngle);
        const o3y = o1y + len * Math.cos(halfAngle);
        atoms = [{
          x: o1x,
          y: o1y,
          vx: 0,
          vy: 0,
          mass: 16,
          symbol: 'O',
          color: '#EF4444',
          radius: 23
        }, {
          x: o2x,
          y: o2y,
          vx: 0,
          vy: 0,
          mass: 16,
          symbol: 'O',
          color: '#EF4444',
          radius: 23
        }, {
          x: o3x,
          y: o3y,
          vx: 0,
          vy: 0,
          mass: 16,
          symbol: 'O',
          color: '#EF4444',
          radius: 23
        }];
        const distO2O3 = Math.sqrt(Math.pow(o2x - o3x, 2) + Math.pow(o2y - o3y, 2));
        bonds = [{
          atomA: 0,
          atomB: 1,
          restLength: len,
          type: 'single',
          broken: false
        }, {
          atomA: 0,
          atomB: 2,
          restLength: len,
          type: 'single',
          broken: false
        }, {
          atomA: 1,
          atomB: 2,
          restLength: distO2O3,
          type: 'virtual',
          broken: false
        }];
        break;
      }
    default:
      break;
  }
  return {
    atoms,
    bonds
  };
};
const addAbsorptionEffect = (state, x, y, color, maxRadius = 75, label = 'ABSORBED') => {
  state.absorptionEffects.push({
    x,
    y,
    color,
    radius: 10,
    maxRadius,
    alpha: 1.0,
    label
  });
};
const emitPhoton = state => {
  const jitterY = (Math.random() - 0.5) * 30;
  const newPhoton = {
    x: 100,
    y: 230 + jitterY,
    vx: 4.5,
    vy: 0,
    type: state.lightType,
    phase: Math.random() * Math.PI * 2,
    active: true,
    amplitude: 14,
    wavelength: state.lightType === 'microwave' ? 60 : state.lightType === 'infrared' ? 32 : state.lightType === 'visible' ? 18 : 10
  };
  state.photons.push(newPhoton);
};
const reEmitPhoton = (state, type) => {
  const cm = getCenterOfMass(state.molecule.atoms);
  const angle = Math.random() * Math.PI * 2;
  const speed = 4.5;
  const wavelength = type === 'microwave' ? 60 : type === 'infrared' ? 32 : type === 'visible' ? 18 : 10;
  const emitted = {
    x: cm.x + Math.cos(angle) * 55,
    y: cm.y + Math.sin(angle) * 55,
    vx: speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    type: type,
    phase: Math.random() * Math.PI * 2,
    active: true,
    amplitude: 14,
    wavelength: wavelength
  };
  state.photons.push(emitted);
  addAbsorptionEffect(state, cm.x, cm.y, type === 'infrared' ? '#EF4444' : '#A855F7', 60, 'RE-EMIT');
};
const handleCollision = (state, photon) => {
  const cm = getCenterOfMass(state.molecule.atoms);
  const idx = state.photons.indexOf(photon);
  if (photon.type === 'microwave') {
    const isPolar = ['Water', 'Carbon Monoxide', 'Ozone'].includes(state.activeMolecule);
    if (isPolar) {
      if (idx > -1) state.photons.splice(idx, 1);
      const dir = Math.random() < 0.5 ? -1 : 1;
      state.rotationSpeed = dir * (0.04 + Math.random() * 0.04);
      addAbsorptionEffect(state, cm.x, cm.y, '#D97706', 70, 'ABSORBED (ROTATES)');
    }
  } else if (photon.type === 'infrared') {
    const isIRActive = ['Carbon Dioxide', 'Water', 'Ozone', 'Carbon Monoxide'].includes(state.activeMolecule);
    if (isIRActive) {
      if (idx > -1) state.photons.splice(idx, 1);
      state.vibrationTimer = 140;
      state.excitationLevel = 1.0;
      state.molecule.atoms.forEach(atom => {
        atom.vx += (Math.random() - 0.5) * 3.8;
        atom.vy += (Math.random() - 0.5) * 3.8;
      });
      addAbsorptionEffect(state, cm.x, cm.y, '#EF4444', 80, 'ABSORBED (VIBRATES)');
    }
  } else if (photon.type === 'visible') {
    // Passes through
  } else if (photon.type === 'ultraviolet') {
    if (state.activeMolecule === 'Ozone') {
      if (idx > -1) state.photons.splice(idx, 1);
      state.recombineTimer = 180;
      state.molecule.bonds.forEach(b => {
        if (b.atomA === 2 || b.atomB === 2) {
          b.broken = true;
        }
      });
      const atoms = state.molecule.atoms;
      const angle = (Math.random() - 0.5) * 0.4;
      const speed = 4.2;
      atoms[2].vx = speed * Math.cos(angle);
      atoms[2].vy = speed * Math.sin(angle);
      atoms[0].vx = -0.5 * atoms[2].vx;
      atoms[0].vy = -0.5 * atoms[2].vy;
      atoms[1].vx = -0.5 * atoms[2].vx;
      atoms[1].vy = -0.5 * atoms[2].vy;
      addAbsorptionEffect(state, cm.x, cm.y, '#A855F7', 95, 'DISSOCIATED!');
    } else {
      if (idx > -1) state.photons.splice(idx, 1);
      state.vibrationTimer = 90;
      state.excitationLevel = 1.0;
      state.molecule.atoms.forEach(atom => {
        atom.vx += (Math.random() - 0.5) * 6.5;
        atom.vy += (Math.random() - 0.5) * 6.5;
      });
      addAbsorptionEffect(state, cm.x, cm.y, '#A855F7', 85, 'EXCITED (GLOW)');
    }
  }
};
const tick = (state, dt = 1, draggedIndex = null) => {
  state.frame += dt;

  // Continuous emission
  if (state.lightOn && state.emissionStyle === 'continuous') {
    const interval = Math.max(15, Math.round(160 / state.emissionRate));
    if (state.frame - state.lastEmitTime >= interval) {
      emitPhoton(state);
      state.lastEmitTime = state.frame;
    }
  }

  // Photons movement
  for (let i = state.photons.length - 1; i >= 0; i--) {
    const p = state.photons[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.phase += 0.22 * dt;
    if (p.x < -80 || p.x > 880 || p.y < -80 || p.y > 530) {
      state.photons.splice(i, 1);
      continue;
    }
    const cm = getCenterOfMass(state.molecule.atoms);
    const dx = p.x - cm.x;
    const dy = p.y - cm.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 55 && p.vx * dx + p.vy * dy < 0) {
      handleCollision(state, p);
    }
  }

  // Absorption ripples
  for (let i = state.absorptionEffects.length - 1; i >= 0; i--) {
    const fx = state.absorptionEffects[i];
    fx.radius += 2.2 * dt;
    fx.alpha -= 0.02 * dt;
    if (fx.alpha <= 0) {
      state.absorptionEffects.splice(i, 1);
    }
  }

  // Rotation
  if (Math.abs(state.rotationSpeed) > 0.0005) {
    state.rotationAngle += state.rotationSpeed * dt;
    state.rotationSpeed *= Math.pow(0.993, dt);
    const cm = getCenterOfMass(state.molecule.atoms);
    const dTheta = state.rotationSpeed * dt;
    state.molecule.atoms.forEach((atom, idx) => {
      if (draggedIndex === idx) return;
      const dx = atom.x - cm.x;
      const dy = atom.y - cm.y;
      const cos = Math.cos(dTheta);
      const sin = Math.sin(dTheta);
      atom.x = cm.x + dx * cos - dy * sin;
      atom.y = cm.y + dx * sin + dy * cos;
      const vx = atom.vx;
      const vy = atom.vy;
      atom.vx = vx * cos - vy * sin;
      atom.vy = vx * sin + vy * cos;
    });
  }

  // Recombination timer
  if (state.activeMolecule === 'Ozone' && state.recombineTimer > 0) {
    state.recombineTimer -= dt;
    if (state.recombineTimer <= 0) {
      state.recombineTimer = 0;
      state.molecule.bonds.forEach(b => {
        b.broken = false;
      });
      const cm = getCenterOfMass(state.molecule.atoms);
      addAbsorptionEffect(state, cm.x, cm.y, '#10B981', 80, 'RECOMBINED');
    }
  }

  // Vibration timer & relaxing emission
  if (state.vibrationTimer > 0) {
    state.vibrationTimer -= dt;
    state.excitationLevel = Math.max(0, state.vibrationTimer / 140);
    if (state.vibrationTimer <= 0) {
      state.vibrationTimer = 0;
      state.excitationLevel = 0;
      if (state.lightType === 'infrared' || state.lightType === 'ultraviolet') {
        reEmitPhoton(state, state.lightType);
      }
    }
  }

  // Spring Forces
  const atoms = state.molecule.atoms;
  const bonds = state.molecule.bonds;
  const fx = new Array(atoms.length).fill(0);
  const fy = new Array(atoms.length).fill(0);
  bonds.forEach(bond => {
    if (bond.broken) return;
    const a = atoms[bond.atomA];
    const b = atoms[bond.atomB];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) return;
    const ux = dx / dist;
    const uy = dy / dist;
    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const vrel = rvx * ux + rvy * uy;
    const isVibrating = state.vibrationTimer > 0;
    const springK = bond.type === 'virtual' ? 0.08 : bond.type === 'triple' ? 0.28 : bond.type === 'double' ? 0.22 : 0.16;
    const dampingC = isVibrating ? 0.012 : 0.15;
    const springForce = -springK * (dist - bond.restLength) - dampingC * vrel;
    fx[bond.atomA] -= springForce * ux;
    fy[bond.atomA] -= springForce * uy;
    fx[bond.atomB] += springForce * ux;
    fy[bond.atomB] += springForce * uy;
  });

  // Dissociation attraction for O3
  if (state.activeMolecule === 'Ozone' && state.recombineTimer > 0) {
    const o2x = (atoms[0].x + atoms[1].x) / 2;
    const o2y = (atoms[0].y + atoms[1].y) / 2;
    const dx = atoms[2].x - o2x;
    const dy = atoms[2].y - o2y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 100) {
      const attractionK = 0.05;
      const ux = dx / dist;
      const uy = dy / dist;
      fx[2] -= attractionK * (dist - 100) * ux;
      fy[2] -= attractionK * (dist - 100) * uy;
      fx[0] += attractionK * (dist - 100) * ux / 2;
      fy[0] += attractionK * (dist - 100) * uy / 2;
      fx[1] += attractionK * (dist - 100) * ux / 2;
      fy[1] += attractionK * (dist - 100) * uy / 2;
    }
  }

  // Restoration potential to Center of Canvas
  const cm = getCenterOfMass(atoms);
  const cdx = 500 - cm.x;
  const cdy = 230 - cm.y;
  for (let i = 0; i < atoms.length; i++) {
    if (draggedIndex === i) continue;
    fx[i] += cdx * 0.012 * atoms[i].mass;
    fy[i] += cdy * 0.012 * atoms[i].mass;
  }

  // Integration step
  for (let i = 0; i < atoms.length; i++) {
    if (draggedIndex === i) continue;
    const a = atoms[i];
    const ax = fx[i] / a.mass;
    const ay = fy[i] / a.mass;
    a.vx += ax * dt;
    a.vy += ay * dt;
    let globDamp = 0.94;
    if (state.vibrationTimer > 0) {
      globDamp = 0.995;
    } else if (Math.abs(state.rotationSpeed) > 0.0005) {
      globDamp = 0.997;
    } else {
      globDamp = 0.84;
    }
    a.vx *= Math.pow(globDamp, dt);
    a.vy *= Math.pow(globDamp, dt);
    a.x += a.vx * dt;
    a.y += a.vy * dt;
  }
};
const calculateEnergies = (atoms, omega) => {
  let totalKE = 0;
  atoms.forEach(a => {
    totalKE += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy);
  });
  let I = 0;
  const cm = getCenterOfMass(atoms);
  atoms.forEach(a => {
    const dx = a.x - cm.x;
    const dy = a.y - cm.y;
    I += a.mass * (dx * dx + dy * dy);
  });
  const rotKE = 0.5 * I * omega * omega;
  return {
    totalKE,
    rotKE
  };
};
const getPhotonColor = type => {
  switch (type) {
    case 'microwave':
      return '#D97706';
    case 'infrared':
      return '#EF4444';
    case 'visible':
      return '#10B981';
    case 'ultraviolet':
      return '#A855F7';
    default:
      return '#ffffff';
  }
};
const getPhotonAbbreviation = type => {
  switch (type) {
    case 'microwave':
      return 'MW Photon';
    case 'infrared':
      return 'IR Photon';
    case 'visible':
      return 'Visible Photon';
    case 'ultraviolet':
      return 'UV Photon';
    default:
      return 'Photon';
  }
};
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const lightenColor = (color, pct) => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const nr = Math.min(255, Math.round(r + (255 - r) * pct));
    const ng = Math.min(255, Math.round(g + (255 - g) * pct));
    const nb = Math.min(255, Math.round(b + (255 - b) * pct));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  }
  return color;
};
const darkenColor = (color, pct) => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const nr = Math.max(0, Math.round(r * (1 - pct)));
    const ng = Math.max(0, Math.round(g * (1 - pct)));
    const nb = Math.max(0, Math.round(b * (1 - pct)));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  }
  return color;
};
const draw = (state, canvas, ctx, draggedIndex = null) => {
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, w, h);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 50; x < w; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 50; y < h; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Active Light Details
  const activeColor = getPhotonColor(state.lightType);

  // Draw emission beam cone if light is ON
  if (state.lightOn) {
    const beamGrad = ctx.createLinearGradient(100, 230, 800, 230);
    beamGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    beamGrad.addColorStop(0.1, hexToRgba(activeColor, 0.22));
    beamGrad.addColorStop(0.6, hexToRgba(activeColor, 0.08));
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.moveTo(100, 220);
    ctx.lineTo(800, 70);
    ctx.lineTo(800, 390);
    ctx.lineTo(100, 240);
    ctx.closePath();
    ctx.fillStyle = beamGrad;
    ctx.fill();
  }

  // Draw flashlight emitter base/holder
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(0, 190, 45, 80);
  ctx.fill();
  ctx.stroke();

  // Flashlight cylinder barrel
  const cylGrad = ctx.createLinearGradient(45, 185, 100, 185);
  cylGrad.addColorStop(0, '#334155');
  cylGrad.addColorStop(0.5, '#64748B');
  cylGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = cylGrad;
  ctx.beginPath();
  ctx.rect(45, 195, 55, 70);
  ctx.fill();
  ctx.stroke();

  // Glowing lens cap
  ctx.fillStyle = state.lightOn ? activeColor : '#475569';
  ctx.beginPath();
  ctx.ellipse(100, 230, 6, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.stroke();
  if (state.lightOn) {
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(101, 230, 3, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }

  // Draw bonds
  const atoms = state.molecule.atoms;
  const bonds = state.molecule.bonds;
  bonds.forEach(bond => {
    if (bond.broken || bond.type === 'virtual') return;
    const a = atoms[bond.atomA];
    const b = atoms[bond.atomB];
    const springColor = state.vibrationTimer > 0 ? activeColor : '#94A3B8';
    if (bond.type === 'triple') {
      drawTripleBondSpring(ctx, a.x, a.y, b.x, b.y, springColor);
    } else if (bond.type === 'double') {
      drawDoubleBondSpring(ctx, a.x, a.y, b.x, b.y, springColor);
    } else {
      drawSpring(ctx, a.x, a.y, b.x, b.y, 9, 6, springColor);
    }
  });

  // Draw atoms
  atoms.forEach((atom, index) => {
    const isExcited = state.vibrationTimer > 0;

    // Glowing aura if excited
    if (isExcited || state.excitationLevel > 0) {
      const pulse = 1 + Math.sin(state.frame * 0.12) * 0.15;
      const glowRad = atom.radius * 2.2 * pulse * state.excitationLevel;
      const glowGrad = ctx.createRadialGradient(atom.x, atom.y, atom.radius, atom.x, atom.y, glowRad);
      glowGrad.addColorStop(0, hexToRgba(activeColor, 0.45));
      glowGrad.addColorStop(0.4, hexToRgba(activeColor, 0.15));
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, glowRad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3D sphere style
    const radGrad = ctx.createRadialGradient(atom.x - atom.radius * 0.25, atom.y - atom.radius * 0.25, atom.radius * 0.08, atom.x, atom.y, atom.radius);
    radGrad.addColorStop(0, '#ffffff');
    radGrad.addColorStop(0.2, lightenColor(atom.color, 0.4));
    radGrad.addColorStop(0.85, atom.color);
    radGrad.addColorStop(1, darkenColor(atom.color, 0.35));
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = draggedIndex === index ? '#F59E0B' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = draggedIndex === index ? 3.0 : 1.5;
    ctx.stroke();

    // Chemical Symbol
    ctx.fillStyle = atom.symbol === 'H' ? '#1E293B' : '#ffffff';
    ctx.font = `bold ${atom.radius * 0.85}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(atom.symbol, atom.x, atom.y + 0.5);
  });

  // Draw photons
  state.photons.forEach(photon => {
    const color = getPhotonColor(photon.type);
    ctx.beginPath();
    const waveLength = photon.wavelength;
    const startDx = -60;
    const endDx = 60;
    let first = true;
    const travelAngle = Math.atan2(photon.vy, photon.vx);
    for (let dx = startDx; dx <= endDx; dx += 1.5) {
      const envelope = Math.exp(-(dx * dx) / (2 * 22 * 22));
      const waveValue = photon.amplitude * envelope * Math.sin(dx / waveLength * 2 * Math.PI - photon.phase);
      const rx = photon.x + dx * Math.cos(travelAngle) - waveValue * Math.sin(travelAngle);
      const ry = photon.y + dx * Math.sin(travelAngle) + waveValue * Math.cos(travelAngle);
      if (first) {
        ctx.moveTo(rx, ry);
        first = false;
      } else {
        ctx.lineTo(rx, ry);
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.0;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(photon.x, photon.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = hexToRgba(color, 0.85);
    ctx.font = '10px sans-serif';
    ctx.fillText(getPhotonAbbreviation(photon.type), photon.x, photon.y - 18);
  });

  // Draw absorption ripples
  state.absorptionEffects.forEach(fx => {
    ctx.strokeStyle = hexToRgba(fx.color, fx.alpha);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
    ctx.stroke();
    if (fx.radius > 20) {
      ctx.strokeStyle = hexToRgba(fx.color, fx.alpha * 0.5);
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius - 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = hexToRgba('#ffffff', fx.alpha);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(fx.label, fx.x, fx.y - fx.radius - 5);
  });

  // Draw HUD (top-left)
  const hudX = 20;
  const hudY = 25;
  const {
    totalKE,
    rotKE
  } = calculateEnergies(state.molecule.atoms, state.rotationSpeed);
  const vibKE = Math.max(0, totalKE - rotKE);
  const maxVibVal = 200;
  const vibPct = Math.min(100, vibKE / maxVibVal * 100);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, 180, 48, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VIB. KINETIC ENERGY (HEAT)', hudX + 10, hudY + 16);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(hudX + 10, hudY + 24, 160, 10, 4);
  ctx.fill();
  const vibGrad = ctx.createLinearGradient(hudX + 10, 0, hudX + 170, 0);
  vibGrad.addColorStop(0, '#f87171');
  vibGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = vibGrad;
  ctx.beginPath();
  ctx.roundRect(hudX + 10, hudY + 24, vibPct / 100 * 160, 10, 4);
  ctx.fill();
  const maxRotVal = 60;
  const rotPct = Math.min(100, rotKE / maxRotVal * 100);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.beginPath();
  ctx.roundRect(hudX, hudY + 58, 180, 48, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px sans-serif';
  ctx.fillText('ROTATIONAL ENERGY', hudX + 10, hudY + 74);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(hudX + 10, hudY + 82, 160, 10, 4);
  ctx.fill();
  const rotGrad = ctx.createLinearGradient(hudX + 10, 0, hudX + 170, 0);
  rotGrad.addColorStop(0, '#fcd34d');
  rotGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = rotGrad;
  ctx.beginPath();
  ctx.roundRect(hudX + 10, hudY + 82, rotPct / 100 * 160, 10, 4);
  ctx.fill();

  // Draw Status info (top-right)
  ctx.textAlign = 'right';
  ctx.font = 'bold 12px sans-serif';
  let stateText = 'STATE: STABLE';
  let statColor = '#10B981';
  if (state.activeMolecule === 'Ozone' && state.recombineTimer > 0) {
    stateText = `DISSOCIATED (${Math.ceil(state.recombineTimer / 60)}s to recombine)`;
    statColor = '#bf5af2';

    // Circular timer countdown
    const arcX = w - 40;
    const arcY = 40;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(arcX, arcY, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(arcX, arcY, 14, -Math.PI / 2, -Math.PI / 2 + state.recombineTimer / 180 * Math.PI * 2);
    ctx.stroke();
  } else if (state.vibrationTimer > 0) {
    stateText = 'STATE: VIBRATING (EXCITED)';
    statColor = '#EF4444';
  } else if (Math.abs(state.rotationSpeed) > 0.001) {
    stateText = 'STATE: ROTATING';
    statColor = '#F59E0B';
  }
  ctx.fillStyle = statColor;
  ctx.fillText(stateText, w - 20, 25);

  // Legend (bottom-left)
  const legX = 20;
  const legY = h - 35;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.beginPath();
  ctx.roundRect(legX, legY, 320, 24, 4);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Legend:', legX + 8, legY + 15);

  // Carbon
  ctx.fillStyle = '#64748B';
  ctx.beginPath();
  ctx.arc(legX + 65, legY + 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Carbon (C)', legX + 76, legY + 15);

  // Oxygen
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(legX + 145, legY + 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Oxygen (O)', legX + 156, legY + 15);

  // Hydrogen
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(legX + 220, legY + 12, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Hydrogen (H)', legX + 229, legY + 15);

  // Nitrogen
  ctx.fillStyle = '#3B82F6';
  ctx.beginPath();
  ctx.arc(legX + 295, legY + 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('N', legX + 304, legY + 15);
  return {
    stateText,
    vibrationalEnergy: Math.round(vibKE),
    rotationalEnergy: Math.round(rotKE),
    statusColor: statColor === '#EF4444' ? 'text-red-400' : statColor === '#F59E0B' ? 'text-amber-400' : statColor === '#bf5af2' ? 'text-purple-400' : 'text-emerald-400'
  };
};
function CustomMoleculesandLightInner({
  onBack,
  title
}) {
  const [activeMoleculeName, setActiveMoleculeName] = useState('Water');
  const [lightType, setLightType] = useState('infrared');
  const [isPlaying, setIsPlaying] = useState(true);
  const [lightOn, setLightOn] = useState(false);
  const [emissionRate, setEmissionRate] = useState(5);
  const [emissionStyle, setEmissionStyle] = useState('continuous');
  const [infoTab, setInfoTab] = useState('interaction');
  const [moleculeStats, setMoleculeStats] = useState({
    stateText: 'Stable',
    rotationalEnergy: 0,
    vibrationalEnergy: 0,
    statusColor: 'text-emerald-400'
  });
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const draggedAtomRef = useRef(null);
  if (!stateRef.current) {
    const initialMolecule = getInitialMoleculeState('Water');
    stateRef.current = {
      isPlaying: true,
      lightType: 'infrared',
      emissionRate: 5,
      emissionStyle: 'continuous',
      lightOn: false,
      activeMolecule: 'Water',
      molecule: initialMolecule,
      photons: [],
      absorptionEffects: [],
      vibrationTimer: 0,
      recombineTimer: 0,
      excitationLevel: 0,
      rotationSpeed: 0,
      rotationAngle: 0,
      lastEmitTime: 0,
      frame: 0
    };
  }
  const activeLight = LIGHT_TYPES.find(l => l.id === lightType);
  const activeMoleculeData = MOLECULES.find(m => m.name === activeMoleculeName);
  useEffect(() => {
    const state = stateRef.current;
    if (state) {
      state.isPlaying = isPlaying;
      state.lightType = lightType;
      state.emissionRate = emissionRate;
      state.emissionStyle = emissionStyle;
      state.lightOn = lightOn;
    }
  }, [isPlaying, lightType, emissionRate, emissionStyle, lightOn]);
  const handleMoleculeSelect = name => {
    const state = stateRef.current;
    if (!state) return;
    state.activeMolecule = name;
    state.molecule = getInitialMoleculeState(name);
    state.rotationSpeed = 0;
    state.rotationAngle = 0;
    state.vibrationTimer = 0;
    state.recombineTimer = 0;
    state.excitationLevel = 0;
    state.photons = [];
    state.absorptionEffects = [];
    setActiveMoleculeName(name);
  };
  const handleReset = () => {
    const state = stateRef.current;
    if (!state) return;
    state.molecule = getInitialMoleculeState(state.activeMolecule);
    state.rotationSpeed = 0;
    state.rotationAngle = 0;
    state.vibrationTimer = 0;
    state.recombineTimer = 0;
    state.excitationLevel = 0;
    state.photons = [];
    state.absorptionEffects = [];
    state.frame = 0;
    state.lastEmitTime = 0;
    setLightOn(false);
    setIsPlaying(true);
  };
  const handleStep = () => {
    setIsPlaying(false);
    const state = stateRef.current;
    if (state) {
      state.isPlaying = false;
      tick(state, 1, draggedAtomRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const stats = draw(state, canvas, ctx, draggedAtomRef.current);
          setMoleculeStats(stats);
        }
      }
    }
  };
  const handleFirePhoton = () => {
    const state = stateRef.current;
    if (!state) return;
    emitPhoton(state);
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animId;
    const runLoop = () => {
      const state = stateRef.current;
      if (state) {
        if (state.isPlaying) {
          tick(state, 1, draggedAtomRef.current);
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const stats = draw(state, canvas, ctx, draggedAtomRef.current);
          if (state.frame % 8 === 0) {
            setMoleculeStats(stats);
          }
        }
      }
      animId = requestAnimationFrame(runLoop);
    };
    animId = requestAnimationFrame(runLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Update canvas on selection edits even if paused
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(stateRef.current, canvas, ctx, draggedAtomRef.current);
      }
    }
  }, [activeMoleculeName, lightType]);

  // Mouse drag-and-drop interaction events
  const getMousePos = e => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * canvas.width;
    const y = (e.clientY - rect.top) / rect.height * canvas.height;
    return {
      x,
      y
    };
  };
  const handleMouseDown = e => {
    const pos = getMousePos(e);
    const state = stateRef.current;
    if (!state) return;
    const index = state.molecule.atoms.findIndex(atom => {
      const dx = atom.x - pos.x;
      const dy = atom.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < atom.radius + 8;
    });
    if (index > -1) {
      draggedAtomRef.current = index;
    }
  };
  const handleMouseMove = e => {
    if (draggedAtomRef.current === null) return;
    const pos = getMousePos(e);
    const state = stateRef.current;
    if (!state) return;
    const atom = state.molecule.atoms[draggedAtomRef.current];
    if (atom) {
      atom.x = pos.x;
      atom.y = pos.y;
      atom.vx = 0;
      atom.vy = 0;
      if (!isPlaying) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            draw(state, canvas, ctx, draggedAtomRef.current);
          }
        }
      }
    }
  };
  const handleMouseUp = () => {
    draggedAtomRef.current = null;
  };
  const handleTouchStart = e => {
    if (e.touches && e.touches[0]) {
      handleMouseDown(e.touches[0]);
    }
  };
  const handleTouchMove = e => {
    if (e.touches && e.touches[0]) {
      handleMouseMove(e.touches[0]);
    }
  };
  return <div className="flex flex-col h-full text-white select-none overflow-hidden font-sans">
      {/* Simulation Header */}
      

      {/* Main Content Layout */}
      <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'none'
    }}>
        {/* Left Section: Controls */}
        <div className="w-full xl:w-80 flex flex-col gap-5 shrink-0 xl:overflow-y-auto xl:pr-1">
          
          {/* Playback Controls Card */}
          <div className="border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-4" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" />
              Playback Engine
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${isPlaying ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/35'}`}>
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button onClick={handleStep} className="px-4 py-3 rounded-xl border border-slate-700/40 text-slate-200 hover: font-semibold text-sm transition-all" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }} title="Single Frame Step">
                Step
              </button>
              
              <button onClick={handleReset} className="px-4 py-3 rounded-xl border border-slate-700/40 text-slate-300 hover: transition-all" style={{
              background: 'rgba(20, 20, 30, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              color: 'white'
            }} title="Reset Simulation">
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* Light Wavelength Selector */}
          <div className="border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-4" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Lightbulb size={16} className="text-purple-400" />
              Light Spectrum
            </h2>
            <div className="flex flex-col gap-2">
              {LIGHT_TYPES.map(light => {
              const isSelected = lightType === light.id;
              return <button key={light.id} onClick={() => {
                setLightType(light.id);
                setLightOn(false);
              }} className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? ` border-slate-700/80 shadow-md` : 'bg-transparent border-transparent hover: text-slate-400 hover:text-white'}`}>
                    <div className={`p-2 rounded-lg /60 border ${isSelected ? `border-slate-600` : 'border-slate-800'}`} style={{
                  color: light.color
                }}>
                      <light.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-200">{light.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{light.energy}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{light.effect}</p>
                    </div>
                  </button>;
            })}
            </div>
          </div>

          {/* Emitter Controls */}
          <div className="border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-4" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              Photon Generator
            </h2>
            
            {/* Emission Toggle */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-300">Beam Emitter</span>
              <button onClick={() => setLightOn(!lightOn)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${lightOn ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30' : ' text-slate-400 border-slate-700/50 hover:'}`}>
                {lightOn ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
              </button>
            </div>

            {/* Light Style Selector */}
            <div className="flex gap-1.5 p-1 /60 rounded-lg border border-slate-800">
              <button onClick={() => setEmissionStyle('continuous')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${emissionStyle === 'continuous' ? ' text-purple-400 border border-slate-800 shadow' : 'text-slate-500 hover:text-slate-350'}`}>
                Stream
              </button>
              <button onClick={() => {
              setEmissionStyle('single');
              setLightOn(false);
            }} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${emissionStyle === 'single' ? ' text-purple-400 border border-slate-800 shadow' : 'text-slate-500 hover:text-slate-350'}`}>
                Pulse
              </button>
            </div>

            {/* Stream Intensity Slider */}
            {emissionStyle === 'continuous' ? <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Emission Rate</span>
                  <span className="text-purple-400">{emissionRate} / 10</span>
                </div>
                <input type="range" min="1" max="10" value={emissionRate} onChange={e => setEmissionRate(Number(e.target.value))} className="w-full accent-purple-500 h-1.5 rounded-lg appearance-none cursor-pointer" />
              </div> : (/* Single Photon Pulse Button */
          <button onClick={handleFirePhoton} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-purple-500/20 shadow-md flex justify-center items-center gap-1.5">
                <Zap size={16} />
                Fire Single Photon
              </button>)}
          </div>
        </div>

        {/* Center Section: Canvas Simulation Viewport */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <div className="border border-slate-800/80 backdrop-blur-md rounded-3xl p-4 shadow-xl flex-1 flex flex-col min-h-0 relative" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            
            {/* Canvas Header */}
            <div className="flex justify-between items-center px-2 pb-3 border-b border-slate-800/50 mb-2 shrink-0">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Info size={14} className="text-purple-400" />
                Drag atoms to test spring tension. Collide photons to excite bonds.
              </span>
              <span className="text-[10px] text-slate-500 font-semibold /60 px-2.5 py-1 rounded border border-slate-850">
                1px = ~0.02 Å | dt = 16.7ms (60FPS)
              </span>
            </div>

            {/* The HTML5 Interactive Canvas Container */}
            <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'auto'
          }}>
              <canvas ref={canvasRef} width={800} height={420} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp} className="absolute inset-0 w-full h-full block object-contain cursor-grab active:cursor-grabbing" />
            </div>

            {/* Science Interactive Info Ribbon */}
            <div className="mt-4 p-4 rounded-xl /60 border border-slate-850 flex items-start gap-3 shrink-0">
              <div className="p-2.5 rounded-lg border shrink-0 mt-0.5" style={{
              borderColor: activeLight.color + '40',
              color: activeLight.color,
              backgroundColor: activeLight.color + '15'
            }}>
                <HelpCircle size={18} />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-200">{activeLight.name} Interaction:</span>
                  <span className="text-[10px] text-slate-400 font-medium">{activeLight.wavelengthInfo}</span>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed font-light">{activeLight.explainer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Molecule Selectors & Chemical Details */}
        <div className="w-full xl:w-96 flex flex-col gap-5 shrink-0 xl:overflow-y-auto xl:pl-1">
          
          {/* Molecule Selector Card Grid */}
          <div className="border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-4" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Atom size={16} className="text-purple-400" />
              Gas Molecules
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {MOLECULES.map(mol => {
              const isSelected = activeMoleculeName === mol.name;
              return <button key={mol.name} onClick={() => handleMoleculeSelect(mol.name)} className={`flex flex-col items-center p-3 rounded-xl border transition-all ${isSelected ? ' border-slate-700/80 shadow' : 'bg-transparent border-transparent hover: text-slate-400 hover:text-white'}`}>
                    {/* SVG Miniature Structure Preview */}
                    <div className="h-9 flex items-center justify-center shrink-0 mb-1.5">
                      {mol.name === 'Carbon Monoxide' && <svg className="w-12 h-6" viewBox="0 0 60 30">
                          <line x1="20" y1="15" x2="40" y2="15" stroke="#94A3B8" strokeWidth="4" />
                          <circle cx="20" cy="15" r="7" fill="#64748B" />
                          <circle cx="40" cy="15" r="8.5" fill="#EF4444" />
                        </svg>}
                      {mol.name === 'Carbon Dioxide' && <svg className="w-16 h-6" viewBox="0 0 80 30">
                          <line x1="20" y1="15" x2="60" y2="15" stroke="#94A3B8" strokeWidth="4" />
                          <circle cx="20" cy="15" r="8" fill="#EF4444" />
                          <circle cx="40" cy="15" r="7" fill="#64748B" />
                          <circle cx="60" cy="15" r="8" fill="#EF4444" />
                        </svg>}
                      {mol.name === 'Water' && <svg className="w-12 h-6" viewBox="0 0 60 30">
                          <line x1="30" y1="10" x2="18" y2="22" stroke="#94A3B8" strokeWidth="2.5" />
                          <line x1="30" y1="10" x2="42" y2="22" stroke="#94A3B8" strokeWidth="2.5" />
                          <circle cx="30" cy="10" r="8" fill="#EF4444" />
                          <circle cx="18" cy="22" r="5.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
                          <circle cx="42" cy="22" r="5.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
                        </svg>}
                      {mol.name === 'Nitrogen' && <svg className="w-12 h-6" viewBox="0 0 60 30">
                          <line x1="20" y1="15" x2="40" y2="15" stroke="#94A3B8" strokeWidth="5" />
                          <circle cx="20" cy="15" r="7.5" fill="#3B82F6" />
                          <circle cx="40" cy="15" r="7.5" fill="#3B82F6" />
                        </svg>}
                      {mol.name === 'Oxygen' && <svg className="w-12 h-6" viewBox="0 0 60 30">
                          <line x1="20" y1="15" x2="40" y2="15" stroke="#94A3B8" strokeWidth="4" />
                          <circle cx="20" cy="15" r="8" fill="#EF4444" />
                          <circle cx="40" cy="15" r="8" fill="#EF4444" />
                        </svg>}
                      {mol.name === 'Ozone' && <svg className="w-12 h-6" viewBox="0 0 60 30">
                          <line x1="30" y1="8" x2="18" y2="20" stroke="#94A3B8" strokeWidth="3" />
                          <line x1="30" y1="8" x2="42" y2="20" stroke="#94A3B8" strokeWidth="3" />
                          <circle cx="30" cy="8" r="8" fill="#EF4444" />
                          <circle cx="18" cy="20" r="8" fill="#EF4444" />
                          <circle cx="42" cy="20" r="8" fill="#EF4444" />
                        </svg>}
                    </div>
                    <span className="font-bold text-xs text-slate-200">{mol.formula}</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5 max-w-full">{mol.name}</span>
                  </button>;
            })}
            </div>
          </div>

          {/* Molecule Information Tabs Card */}
          <div className="border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-4 flex-1 min-h-[300px]" style={{
          background: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: 'white'
        }}>
            {/* Tabs Selector */}
            <div className="flex gap-2 border-b border-slate-800 pb-2.5">
              <button onClick={() => setInfoTab('interaction')} className={`text-xs font-semibold pb-1 relative transition-all ${infoTab === 'interaction' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-350'}`}>
                Active Description
                {infoTab === 'interaction' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
              </button>
              <button onClick={() => setInfoTab('details')} className={`text-xs font-semibold pb-1 relative transition-all ${infoTab === 'details' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-350'}`}>
                Chemical Details
                {infoTab === 'details' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 flex flex-col gap-3 font-light text-slate-300 text-xs overflow-y-auto leading-relaxed">
              {infoTab === 'interaction' ? <>
                  <div className="flex flex-col gap-1 border-b border-slate-850 pb-2.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Molecular Properties</span>
                    <div className="flex flex-col gap-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Class:</span>
                        <span className="font-medium text-slate-200">{activeMoleculeData.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Polarity:</span>
                        <span className="font-medium text-slate-200">{activeMoleculeData.dipole}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Greenhouse Gas:</span>
                        <span className="font-medium text-slate-200">{activeMoleculeData.greenhouse}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Description</span>
                    <p className="text-slate-300 font-light mt-1">{activeMoleculeData.description}</p>
                  </div>
                </> : <>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Atmospheric & Climatic Context</span>
                    <p className="text-slate-300 font-light">{activeMoleculeData.details}</p>
                  </div>
                  <div className="mt-2 p-3 /50 rounded-lg border border-slate-850 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Kinetic Stats</span>
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] mt-1 font-mono text-slate-300">
                      <div>Vib. KE: <span className="text-red-400 font-bold">{moleculeStats.vibrationalEnergy} J</span></div>
                      <div>Rot. KE: <span className="text-amber-400 font-bold">{moleculeStats.rotationalEnergy} J</span></div>
                      <div className="col-span-2 text-[9px] text-slate-500 font-sans italic mt-1 border-t border-slate-850/50 pt-1">
                        Kinetic energies are calculated directly from atom particle mass and velocities.
                      </div>
                    </div>
                  </div>
                </>}
            </div>
          </div>
        </div>
      </div>
    </div>;
}
export default function CustomMoleculesandLight({
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
                 <CustomMoleculesandLightInner onBack={null} title={""} />
            </div>
        </div>;
}