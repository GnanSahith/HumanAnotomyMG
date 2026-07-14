export const simulationMappings = [
    // PHYSICS
    {
        module: 'physics',
        categoryId: 'Motion & Mechanics',
        title: 'Motion & Mechanics Simulations',
        regex: /\b(projectile|trajectory|parabolic path|kinematics|motion in a plane)\b/i
    },
    {
        module: 'physics',
        categoryId: 'Motion & Mechanics',
        title: 'Forces and Motion Simulations',
        regex: /\b(force|friction|inertia|newton's laws?|laws of motion|pushing|pulling|momentum|impulse|tension)\b/i
    },
    {
        module: 'physics',
        categoryId: 'Motion & Mechanics',
        title: 'Gravity and Orbits Simulations',
        regex: /\b(gravity|orbits?|solar system|planets? orbit|gravitation|kepler's law|escape velocity)\b/i
    },
    {
        module: 'physics',
        categoryId: 'Electricity & Magnets',
        title: 'Electricity & Magnets Simulations',
        regex: /\b(electric field|electric charge|point charge|electrostatic force|coulomb's law|electric flux|ohm's law|resistance and voltage|current and voltage|resistors|electric current)\b/i
    },

    // CHEMISTRY
    {
        module: 'chemistry',
        categoryId: 'Solutions, Acids & Bases',
        title: 'Solutions, Acids & Bases Simulations',
        regex: /\b(acid|base|pH|alkali|acidic|basic solution|neutralization)\b/i
    },
    {
        module: 'chemistry',
        categoryId: 'Reactions & Stoichiometry',
        title: 'Reactions & Stoichiometry Simulations',
        regex: /\b(balance chemical equation|balancing equation|stoichiometry|chemical reaction|reactants)\b/i
    },
    {
        module: 'chemistry',
        categoryId: 'Atoms & Molecules',
        title: 'Atoms & Molecules Simulations',
        regex: /\b(atomic structure|protons neutrons electrons|build an atom|nucleus|bohr model|isotope|atomic mass|mass number|radioactive decay)\b/i
    },
    {
        module: 'chemistry',
        categoryId: 'Thermodynamics & Gases',
        title: 'Thermodynamics & Gases Simulations',
        regex: /\b(states of matter|solid liquid gas|phase change|melting|boiling|evaporation)\b/i
    },

    // MATHS
    {
        module: 'maths',
        categoryId: 'Geometry & Measurement',
        title: 'Geometry & Measurement Simulations',
        regex: /\b(area and perimeter|calculate area|calculate perimeter|surface area|square units)\b/i
    },
    {
        module: 'maths',
        categoryId: 'Fractions & Proportions',
        title: 'Fractions & Proportions Simulations',
        regex: /\b(equivalent fractions|matching fractions|numerator|denominator|ratio)\b/i
    },
    {
        module: 'maths',
        categoryId: 'Algebra & Graphing',
        title: 'Algebra & Graphing Simulations',
        regex: /\b(quadratic equation|parabola|graphing quadratics|roots of quadratic)\b/i
    },
    {
        module: 'maths',
        categoryId: 'Vectors & Advanced',
        title: 'Vectors & Advanced Simulations',
        regex: /\b(vector addition|resultant vector|adding vectors|dot product|cross product)\b/i
    },

    // BIOLOGY (Anatomical Systems - kept direct to system as bio doesn't use the grid layout)
    {
        module: 'biology',
        systemId: 'digestive_combined',
        title: 'Digestive System Simulation',
        regex: /\b(digestive system|digestion|stomach|intestine|alimentary canal|pancreas|liver|enzyme|gastric)\b/i
    },
    {
        module: 'biology',
        systemId: 'respiratory',
        title: 'Respiratory System Simulation',
        regex: /\b(respiratory system|lungs|alveoli|breathing|respiration|trachea|bronchi)\b/i
    },
    {
        module: 'biology',
        systemId: 'circulatory',
        title: 'Circulatory System Simulation',
        regex: /\b(circulatory system|heart|blood vessels|capillaries|blood circulation|arteries|veins|cardiac)\b/i
    },
    {
        module: 'biology',
        systemId: 'nervous',
        title: 'Nervous System Simulation',
        regex: /\b(nervous system|brain|neurons|spinal cord|synapse|reflex action|nerve impulse)\b/i
    },
    {
        module: 'biology',
        systemId: 'excretory',
        title: 'Excretory System Simulation',
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
                simId: mapping.simId || null,
                categoryId: mapping.categoryId || null,
                systemId: mapping.systemId || null,
                title: mapping.title
            });
        }
    }
    
    return matches.slice(0, 1);
};
