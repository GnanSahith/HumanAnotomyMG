export const simulationMappings = [
    // PHYSICS
    {
        module: 'physics',
        simId: 'phys_1_mg',
        title: 'Projectile Motion',
        regex: /\b(projectile|trajectory|parabolic path|kinematics|motion in a plane)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_2_mg',
        title: 'Forces and Motion',
        regex: /\b(force|friction|inertia|newton's laws?|laws of motion|pushing|pulling|momentum|impulse|tension)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_3_mg',
        title: 'Gravity and Orbits',
        regex: /\b(gravity|orbits?|solar system|planets? orbit|gravitation|kepler's law|escape velocity)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_34_mg', // Charges and Fields
        title: 'Charges and Fields',
        regex: /\b(electric field|electric charge|point charge|electrostatic force|coulomb's law|electric flux)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_36_mg', // Ohm's Law
        title: "Ohm's Law",
        regex: /\b(ohm's law|resistance and voltage|current and voltage|resistors|electric current)\b/i
    },

    // CHEMISTRY
    {
        module: 'chemistry',
        simId: 'acid-base-solutions_mg',
        title: 'Acid-Base Solutions',
        regex: /\b(acid|base|pH|alkali|acidic|basic solution|neutralization)\b/i
    },
    {
        module: 'chemistry',
        simId: 'balancing-chemical-equations_mg',
        title: 'Balancing Chemical Equations',
        regex: /\b(balance chemical equation|balancing equation|stoichiometry|chemical reaction|reactants)\b/i
    },
    {
        module: 'chemistry',
        simId: 'build-an-atom_mg',
        title: 'Build an Atom',
        regex: /\b(atomic structure|protons neutrons electrons|build an atom|nucleus|bohr model)\b/i
    },
    {
        module: 'chemistry',
        simId: 'states-of-matter_mg',
        title: 'States of Matter',
        regex: /\b(states of matter|solid liquid gas|phase change|melting|boiling|evaporation)\b/i
    },
    {
        module: 'chemistry',
        simId: 'isotopes-and-atomic-mass_mg',
        title: 'Isotopes and Atomic Mass',
        regex: /\b(isotope|atomic mass|mass number|radioactive decay)\b/i
    },

    // MATHS
    {
        module: 'maths',
        simId: 'area-builder_mg',
        title: 'Area Builder',
        regex: /\b(area and perimeter|calculate area|calculate perimeter|surface area|square units)\b/i
    },
    {
        module: 'maths',
        simId: 'fraction-matcher_mg',
        title: 'Fraction Matcher',
        regex: /\b(equivalent fractions|matching fractions|numerator|denominator|ratio)\b/i
    },
    {
        module: 'maths',
        simId: 'graphing-quadratics_mg',
        title: 'Graphing Quadratics',
        regex: /\b(quadratic equation|parabola|graphing quadratics|roots of quadratic)\b/i
    },
    {
        module: 'maths',
        simId: 'vector-addition_mg',
        title: 'Vector Addition',
        regex: /\b(vector addition|resultant vector|adding vectors|dot product|cross product)\b/i
    },

    // BIOLOGY (Anatomical Systems)
    {
        module: 'biology',
        systemId: 'digestive_combined', // Or digestive_interactive
        title: 'Digestive System',
        regex: /\b(digestive system|digestion|stomach|intestine|alimentary canal|pancreas|liver|enzyme|gastric)\b/i
    },
    {
        module: 'biology',
        systemId: 'respiratory',
        title: 'Respiratory System',
        regex: /\b(respiratory system|lungs|alveoli|breathing|respiration|trachea|bronchi)\b/i
    },
    {
        module: 'biology',
        systemId: 'circulatory',
        title: 'Circulatory System',
        regex: /\b(circulatory system|heart|blood vessels|capillaries|blood circulation|arteries|veins|cardiac)\b/i
    },
    {
        module: 'biology',
        systemId: 'nervous',
        title: 'Nervous System',
        regex: /\b(nervous system|brain|neurons|spinal cord|synapse|reflex action|nerve impulse)\b/i
    },
    {
        module: 'biology',
        systemId: 'excretory',
        title: 'Excretory System',
        regex: /\b(excretory system|kidneys|nephrons|excretion|urine|renal|bladder)\b/i
    }
];

export const findSimulationsForText = (text, chapterTitle = '') => {
    if (!text && !chapterTitle) return [];
    
    const matches = [];
    const combinedText = `${text} ${chapterTitle}`.toLowerCase();
    
    for (const mapping of simulationMappings) {
        if (mapping.regex.test(combinedText)) {
            matches.push({
                module: mapping.module,
                simId: mapping.simId,
                systemId: mapping.systemId,
                title: mapping.title
            });
        }
    }
    
    return matches.slice(0, 1);
};
