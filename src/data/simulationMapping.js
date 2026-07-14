export const simulationMappings = [
    // PHYSICS
    {
        module: 'physics',
        simId: 'phys_1_mg',
        title: 'Projectile Motion',
        regex: /\b(projectile|trajectory|parabolic path)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_2_mg',
        title: 'Forces and Motion',
        regex: /\b(force|friction|inertia|newton's laws?|pushing|pulling)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_3_mg',
        title: 'Gravity and Orbits',
        regex: /\b(gravity|orbits?|solar system|planets? orbit)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_34_mg', // Charges and Fields
        title: 'Charges and Fields',
        regex: /\b(electric field|electric charge|point charge|electrostatic force)\b/i
    },
    {
        module: 'physics',
        simId: 'phys_36_mg', // Ohm's Law
        title: "Ohm's Law",
        regex: /\b(ohm's law|resistance and voltage|current and voltage)\b/i
    },

    // CHEMISTRY
    {
        module: 'chemistry',
        simId: 'acid-base-solutions_mg',
        title: 'Acid-Base Solutions',
        regex: /\b(acid|base|pH|alkali|acidic|basic solution)\b/i
    },
    {
        module: 'chemistry',
        simId: 'balancing-chemical-equations_mg',
        title: 'Balancing Chemical Equations',
        regex: /\b(balance chemical equation|balancing equation|stoichiometry)\b/i
    },
    {
        module: 'chemistry',
        simId: 'build-an-atom_mg',
        title: 'Build an Atom',
        regex: /\b(atomic structure|protons neutrons electrons|build an atom)\b/i
    },
    {
        module: 'chemistry',
        simId: 'states-of-matter_mg',
        title: 'States of Matter',
        regex: /\b(states of matter|solid liquid gas|phase change)\b/i
    },
    {
        module: 'chemistry',
        simId: 'isotopes-and-atomic-mass_mg',
        title: 'Isotopes and Atomic Mass',
        regex: /\b(isotope|atomic mass|mass number)\b/i
    },

    // MATHS
    {
        module: 'maths',
        simId: 'area-builder_mg',
        title: 'Area Builder',
        regex: /\b(area and perimeter|calculate area|calculate perimeter)\b/i
    },
    {
        module: 'maths',
        simId: 'fraction-matcher_mg',
        title: 'Fraction Matcher',
        regex: /\b(equivalent fractions|matching fractions)\b/i
    },
    {
        module: 'maths',
        simId: 'graphing-quadratics_mg',
        title: 'Graphing Quadratics',
        regex: /\b(quadratic equation|parabola|graphing quadratics)\b/i
    },
    {
        module: 'maths',
        simId: 'vector-addition_mg',
        title: 'Vector Addition',
        regex: /\b(vector addition|resultant vector|adding vectors)\b/i
    },

    // BIOLOGY (Anatomical Systems)
    {
        module: 'biology',
        systemId: 'digestive_combined', // Or digestive_interactive
        title: 'Digestive System',
        regex: /\b(digestive system|digestion|stomach|intestine|alimentary canal)\b/i
    },
    {
        module: 'biology',
        systemId: 'respiratory',
        title: 'Respiratory System',
        regex: /\b(respiratory system|lungs|alveoli|breathing)\b/i
    },
    {
        module: 'biology',
        systemId: 'circulatory',
        title: 'Circulatory System',
        regex: /\b(circulatory system|heart|blood vessels|capillaries|blood circulation)\b/i
    },
    {
        module: 'biology',
        systemId: 'nervous',
        title: 'Nervous System',
        regex: /\b(nervous system|brain|neurons|spinal cord)\b/i
    },
    {
        module: 'biology',
        systemId: 'excretory',
        title: 'Excretory System',
        regex: /\b(excretory system|kidneys|nephrons|excretion)\b/i
    }
];

export const findSimulationsForText = (text) => {
    if (!text) return [];
    
    const matches = [];
    for (const mapping of simulationMappings) {
        if (mapping.regex.test(text)) {
            matches.push({
                module: mapping.module,
                simId: mapping.simId,
                systemId: mapping.systemId,
                title: mapping.title
            });
        }
    }
    
    // Return only the first match to avoid cluttering the UI with multiple tags per question
    return matches.slice(0, 1);
};
