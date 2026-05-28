const fs = require('fs');

const classes = {
    "Class 12": {
        "Physics": ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics", "Communication Systems"],
        "Maths": ["Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"],
        "Chemistry": ["The Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "General Principles and Processes of Isolation of Elements", "The p-Block Elements", "The d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
        "Biology": ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Biotechnology: Principles and Processes", "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"],
        "English": ["The Last Lesson", "Lost Spring", "Deep Water", "The Rattrap", "Indigo", "Poets and Pancakes", "The Interview", "Going Places", "My Mother at Sixty-six", "An Elementary School Classroom in a Slum", "Keeping Quiet", "A Thing of Beauty"],
        "Business Studies": ["Nature and Significance of Management", "Principles of Management", "Business Environment", "Planning", "Organising", "Staffing", "Directing", "Controlling", "Financial Management", "Financial Markets", "Marketing", "Consumer Protection"],
        "Economics": ["Introduction to Microeconomics", "Theory of Consumer Behaviour", "Production and Costs", "The Theory of the Firm under Perfect Competition", "Market Equilibrium", "Non-Competitive Markets", "Introduction to Macroeconomics", "National Income Accounting", "Money and Banking", "Income Determination", "The Government Budget and the Economy", "Open Economy Macroeconomics"]
    },
    "Class 11": {
        "Physics": ["Physical World", "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy and Power", "System of Particles and Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"],
        "Maths": ["Sets", "Relations and Functions", "Trigonometric Functions", "Principle of Mathematical Induction", "Complex Numbers and Quadratic Equations", "Linear Inequalities", "Permutations and Combinations", "Binomial Theorem", "Sequences and Series", "Straight Lines", "Conic Sections", "Introduction to Three Dimensional Geometry", "Limits and Derivatives", "Mathematical Reasoning", "Statistics", "Probability"],
        "Chemistry": ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity in Properties", "Chemical Bonding and Molecular Structure", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "The s-Block Elements", "The p-Block Elements", "Organic Chemistry - Some Basic Principles and Techniques", "Hydrocarbons", "Environmental Chemistry"],
        "Biology": ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell: The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis in Higher Plants", "Respiration in Plants", "Plant Growth and Development", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation"]
    },
    "Class 10": {
        "Maths": ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Constructions", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"],
        "Science": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and Its Compounds", "Periodic Classification of Elements", "Life Processes", "Control and Coordination", "How do Organisms Reproduce?", "Heredity and Evolution", "Light – Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Sources of Energy", "Our Environment", "Sustainable Management of Natural Resources"]
    },
    "Class 9": {
        "Maths": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Areas of Parallelograms and Triangles", "Circles", "Constructions", "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Probability"],
        "Science": ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Diversity in Living Organisms", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Why Do We Fall Ill", "Natural Resources", "Improvement in Food Resources"]
    },
    "Class 8": {
        "Maths": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs", "Playing with Numbers"],
        "Science": ["Crop Production and Management", "Microorganisms: Friend and Foe", "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell - Structure and Functions", "Reproduction in Animals", "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light", "Stars and the Solar System", "Pollution of Air and Water"]
    },
    "Class 7": {
        "Maths": ["Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "The Triangle and its Properties", "Congruence of Triangles", "Comparing Quantities", "Rational Numbers", "Practical Geometry", "Perimeter and Area", "Algebraic Expressions", "Exponents and Powers", "Symmetry", "Visualising Solid Shapes"],
        "Science": ["Nutrition in Plants", "Nutrition in Animals", "Fibre to Fabric", "Heat", "Acids, Bases and Salts", "Physical and Chemical Changes", "Weather, Climate and Adaptations of Animals to Climate", "Winds, Storms and Cyclones", "Soil", "Respiration in Organisms", "Transportation in Animals and Plants", "Reproduction in Plants", "Motion and Time", "Electric Current and its Effects", "Light", "Water: A Precious Resource", "Forests: Our Lifeline", "Wastewater Story"]
    },
    "Class 6": {
        "Maths": ["Knowing Our Numbers", "Whole Numbers", "Playing with Numbers", "Basic Geometrical Ideas", "Understanding Elementary Shapes", "Integers", "Fractions", "Decimals", "Data Handling", "Mensuration", "Algebra", "Ratio and Proportion", "Symmetry", "Practical Geometry"],
        "Science": ["Food: Where Does It Come From?", "Components of Food", "Fibre to Fabric", "Sorting Materials Into Groups", "Separation of Substances", "Changes Around Us", "Getting to Know Plants", "Body Movements", "The Living Organisms and Their Surroundings", "Motion and Measurement of Distances", "Light, Shadows and Reflections", "Electricity and Circuits", "Fun with Magnets", "Water", "Air Around Us", "Garbage In, Garbage Out"]
    },
    "Class 5": {
        "Maths": ["The Fish Tale", "Shapes and Angles", "How Many Squares?", "Parts and Wholes", "Does it Look the Same?", "Be My Multiple, I'll be Your Factor", "Can You See the Pattern?", "Mapping Your Way", "Boxes and Sketches", "Tenths and Hundredths", "Area and its Boundary", "Smart Charts", "Ways to Multiply and Divide", "How Big? How Heavy?"],
        "EVS": ["Super Senses", "A Snake Charmer's Story", "From Tasting to Digesting", "Mangoes Round the Year", "Seeds and Seeds", "Every Drop Counts", "Experiments with Water", "A Treat for Mosquitoes", "Up You Go!", "Walls Tell Stories", "Sunita in Space", "What if it Finishes...?", "A Shelter so High!", "When the Earth Shook!", "Blow Hot, Blow Cold", "Who will do this Work?", "Across the Wall", "No Place for Us?", "A Seed tells a Farmer's Story", "Whose Forests?", "Like Father, Like Daughter", "On the Move Again"]
    },
    "Class 4": {
        "Maths": ["Building with Bricks", "Long and Short", "A Trip to Bhopal", "Tick-Tick-Tick", "The Way The World Looks", "The Junk Seller", "Jugs and Mugs", "Carts and Wheels", "Halves and Quarters", "Play with Patterns", "Tables and Shares", "How Heavy? How Light?", "A Field and Fences", "Smart Charts"],
        "EVS": ["Going to School", "Ear to Ear", "A Day with Nandu", "The Story of Amrita", "Anita and the Honeybees", "Omana's Journey", "From the Window", "Reaching Grandmother's House", "Changing Families", "Hu Tu Tu, Hu Tu Tu", "The Valley of Flowers", "Changing Times", "A River's Tale", "Basva's Farm", "From Market to Home", "A Busy Month", "Nandita in Mumbai", "Too Much Water, Too Little Water", "Abdul in the Garden", "Eating Together", "Food and Fun", "The World in my Home", "Pochampalli", "Home and Abroad", "Spicy Riddles", "Defence Officer: Wahida", "Chuskit Goes to School"]
    },
    "Class 3": {
        "Maths": ["Where to Look From", "Fun with Numbers", "Give and Take", "Long and Short", "Shapes and Designs", "Fun with Give and Take", "Time Goes On", "Who is Heavier?", "How Many Times?", "Play with Patterns", "Jugs and Mugs", "Can We Share?", "Smart Charts!", "Rupees and Paise"],
        "EVS": ["Poonam's Day Out", "The Plant Fairy", "Water O' Water!", "Our First School", "Chhotu's House", "Foods We Eat", "Saying without Speaking", "Flying High", "It's Raining", "What is Cooking", "From Here to There", "Work We Do", "Sharing Our Feelings", "The Story of Food", "Making Pots", "Games We Play", "Here comes a Letter", "A House Like This", "Our Friends - Animals", "Drop by Drop", "Families can be Different", "Left-Right", "A Beautiful Cloth", "Web of Life"]
    },
    "Class 2": {
        "Maths": ["What is Long, What is Round?", "Counting in Groups", "How Much Can You Carry?", "Counting in Tens", "Patterns", "Footprints", "Jugs and Mugs", "Tens and Ones", "My Funday", "Add Our Points", "Lines and Lines", "Give and Take", "The Longest Step", "Birds Come, Birds Go", "How Many Ponytails?"],
        "English": ["First Day at School", "Haldi's Adventure", "I am Lucky!", "I Want", "A Smile", "The Wind and the Sun", "Rain", "Storm in the Garden", "Zoo Manners", "Funny Bunny", "Mr. Nobody", "Curlylocks and the Three Bears", "On My Blackboard I can Draw", "Make it Shorter", "I am the Music Man", "The Mumbai Musicians", "Granny Granny Please Comb my Hair", "The Magic Porridge Pot", "Strange Talk", "The Grasshopper and the Ant"]
    },
    "Class 1": {
        "Maths": ["Shapes and Space", "Numbers from One to Nine", "Addition", "Subtraction", "Numbers from Ten to Twenty", "Time", "Measurement", "Numbers from Twenty-one to Fifty", "Data Handling", "Patterns", "Numbers", "Money", "How Many"],
        "English": ["A Happy Child", "Three Little Pigs", "After a Bath", "The Bubble, the Straw and the Shoe", "One Little Kitten", "Lalu and Peelu", "Once I Saw a Little Bird", "Mittu and the Yellow Mango", "Merry-Go-Round", "Circle", "If I Were an Apple", "Our Tree", "A Kite", "Sundari", "A Little Turtle", "The Tiger and the Mosquito", "Clouds", "Anandi's Rainbow", "Flying-Man", "The Tailor and his Friend"]
    },
    "NCERT Books": {
        "All Books PDF": ["Class 12 Books", "Class 11 Books", "Class 10 Books", "Class 9 Books", "Class 8 Books", "Class 7 Books", "Class 6 Books", "Class 5 Books", "Class 4 Books", "Class 3 Books", "Class 2 Books", "Class 1 Books"]
    },
    "NCERT Exempler": {
        "Maths Exemplar": ["Class 12 Maths Exemplar", "Class 11 Maths Exemplar", "Class 10 Maths Exemplar", "Class 9 Maths Exemplar"],
        "Science Exemplar": ["Class 12 Physics Exemplar", "Class 12 Chemistry Exemplar", "Class 12 Biology Exemplar", "Class 10 Science Exemplar", "Class 9 Science Exemplar"]
    }
};

let output = 'export const chaptersData = {\\n';

for (const [className, subjects] of Object.entries(classes)) {
    output += \`  "\${className}": {\\n\`;
    for (const [subjectName, chapterList] of Object.entries(subjects)) {
        output += \`    "\${subjectName}": [\\n\`;
        chapterList.forEach((ch, idx) => {
            output += \`      { id: 'c\${idx+1}', title: 'Chapter \${idx+1}: \${ch.replace(/'/g, "\\\\'")}' }\${idx < chapterList.length - 1 ? ',' : ''}\\n\`;
        });
        output += \`    ]\${Object.keys(subjects).indexOf(subjectName) < Object.keys(subjects).length - 1 ? ',' : ''}\\n\`;
    }
    output += \`  }\${Object.keys(classes).indexOf(className) < Object.keys(classes).length - 1 ? ',' : ''}\\n\`;
}

output += '};\\n';

fs.writeFileSync('src/chaptersData.js', output);
console.log('Done generating chaptersData.js!');
