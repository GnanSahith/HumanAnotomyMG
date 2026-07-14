import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { 
    ArrowLeft, Combine, Shapes, Type, Gamepad2, Grid as GridIcon, Scaling, 
    Hexagon, FlipHorizontal, Triangle, Copy, Ruler, RefreshCw, Box, MoveDiagonal,
    Activity, Hash, Calculator, Dices, Layers, PlayCircle, Lock,
    ChevronRight, BookOpen, Zap, CheckCircle, XCircle, Trophy, Info, Sigma
} from 'lucide-react';
import { mathCurriculum } from '../data/mathCurriculum';
import mathSimulations from '../data/mathSimulations.json';

const GeoGebraPlayer = ({ ggbUrl, id }) => {
    const containerRef = React.useRef(null);
    const wrapperRef = React.useRef(null);

    React.useEffect(() => {
        let isMounted = true;
        let resizeObserver = null;
        const targetW = 800;
        const targetH = 500;

        function initApplet() {
            if (!containerRef.current || !isMounted) return;
            
            const parameters = {
                "id": `ggbApplet_${id}`,
                "width": targetW,
                "height": targetH,
                "showMenuBar": false,
                "showAlgebraInput": false,
                "showToolBar": false,
                "showToolBarHelp": false,
                "showResetIcon": true,
                "enableLabelDrags": false,
                "enableShiftDragZoom": true,
                "enableRightClick": false,
                "errorDialogsActive": false,
                "useBrowserForJS": false,
                "allowStyleBar": false,
                "preventFocus": false,
                "showZoomButtons": true,
                "showFullscreenButton": true,
                "scale": 1,
                "disableAutoScale": false,
                "allowUpscale": false,
                "clickToLoad": false,
                "appName": "classic",
                "buttonRounding": 0.7,
                "buttonShadows": false,
                "language": "en",
                "filename": ggbUrl
            };
            const applet = new window.GGBApplet(parameters, true);
            const containerId = `ggb-element-${id}`;
            containerRef.current.innerHTML = ''; // Prevent duplicates
            containerRef.current.id = containerId;
            applet.inject(containerId);
        }

        if (!window.GGBApplet) {
            let script = document.getElementById('ggb-script');
            if (!script) {
                script = document.createElement('script');
                script.id = 'ggb-script';
                script.src = 'https://cdn.geogebra.org/apps/deployggb.js';
                script.async = true;
                script.onload = () => { if (isMounted) initApplet(); };
                document.body.appendChild(script);
            } else {
                script.addEventListener('load', () => { if (isMounted) initApplet(); });
            }
        } else {
            // Give DOM a small layout window
            setTimeout(() => { if (isMounted) initApplet(); }, 50);
        }

        // Dynamically scale the applet using ResizeObserver
        if (window.ResizeObserver && wrapperRef.current) {
            const parent = wrapperRef.current.parentElement;
            if (parent) {
                resizeObserver = new ResizeObserver((entries) => {
                    if (!isMounted || !wrapperRef.current) return;
                    for (let entry of entries) {
                        const wrapperW = entry.contentRect.width || parent.clientWidth || 800;
                        const wrapperH = entry.contentRect.height || parent.clientHeight || 600;

                        // Calculate scale
                        const scale = Math.min(wrapperW / targetW, wrapperH / targetH);

                        // Apply scaling and transform
                        wrapperRef.current.style.width = `${targetW}px`;
                        wrapperRef.current.style.height = `${targetH}px`;
                        wrapperRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
                        wrapperRef.current.style.transformOrigin = 'center center';
                        wrapperRef.current.style.flexShrink = '0';
                    }
                });
                resizeObserver.observe(parent);
            }
        }

        return () => {
            isMounted = false;
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [ggbUrl, id]);

    return (
        <div 
            style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                background: '#fff',
                filter: 'invert(0.92) hue-rotate(180deg) brightness(1.1) contrast(0.9)',
                overflow: 'hidden'
            }}
        >
            <div 
                ref={wrapperRef}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center center',
                    flexShrink: '0'
                }}
            >
                <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>
        </div>
    );
};

const mathQuizDatabase = {
    algebra: [
        { questionText: "Solve for x: 3x + 7 = 22", options: ["5", "6", "7", "4"], answer: "5" },
        { questionText: "Find the next number in the pattern: 2, 5, 10, 17, ...", options: ["26", "25", "24", "28"], answer: "26" },
        { questionText: "If f(x) = 2x - 3, find f(5)", options: ["7", "10", "13", "5"], answer: "7" },
        { questionText: "What is the value of 5x - 2 when x = 3?", options: ["13", "15", "12", "17"], answer: "13" },
        { questionText: "Which equation represents the line passing through (0,0) with slope 3?", options: ["y = 3x", "y = x + 3", "y = 3", "y = x/3"], answer: "y = 3x" },
        { questionText: "Solve for y: 2(y - 4) = 12", options: ["10", "8", "6", "14"], answer: "10" },
        { questionText: "What is the slope of the line y = -2x + 5?", options: ["-2", "5", "2", "-5"], answer: "-2" },
        { questionText: "Simplify: 4a + 3b - 2a + b", options: ["2a + 4b", "6a + 4b", "2a + 2b", "6a + 2b"], answer: "2a + 4b" },
        { questionText: "What is the y-intercept of the line y = 3x - 7?", options: ["-7", "7", "3", "0"], answer: "-7" },
        { questionText: "Solve for x: x/4 + 5 = 9", options: ["16", "12", "20", "8"], answer: "16" }
    ],
    geometry: [
        { questionText: "What is the sum of angles in a triangle?", options: ["180°", "360°", "90°", "270°"], answer: "180°" },
        { questionText: "A polygon with 5 sides is called a:", options: ["Pentagon", "Hexagon", "Heptagon", "Octagon"], answer: "Pentagon" },
        { questionText: "What is the supplement of a 60° angle?", options: ["120°", "30°", "90°", "180°"], answer: "120°" },
        { questionText: "How many degrees is a right angle?", options: ["90°", "180°", "45°", "360°"], answer: "90°" },
        { questionText: "An angle greater than 90° but less than 180° is called:", options: ["Obtuse", "Acute", "Right", "Reflex"], answer: "Obtuse" },
        { questionText: "What is the perimeter of a rectangle with length 6 and width 4?", options: ["20", "24", "10", "12"], answer: "20" },
        { questionText: "An equilateral triangle has three angles of what measure?", options: ["60°", "45°", "90°", "30°"], answer: "60°" },
        { questionText: "If two angles are complementary, their sum is:", options: ["90°", "180°", "360°", "45°"], answer: "90°" },
        { questionText: "How many lines of symmetry does a square have?", options: ["4", "2", "8", "0"], answer: "4" },
        { questionText: "What is the hypotenuse of a right triangle with legs of length 3 and 4?", options: ["5", "7", "6", "8"], answer: "5" }
    ],
    measurement: [
        { questionText: "What is the area of a rectangle with length 8 cm and width 5 cm?", options: ["40 cm²", "26 cm²", "13 cm²", "35 cm²"], answer: "40 cm²" },
        { questionText: "Convert 2.5 liters to milliliters:", options: ["2500 mL", "250 mL", "25000 mL", "25 mL"], answer: "2500 mL" },
        { questionText: "What is the volume of a cube with side length 3 cm?", options: ["27 cm³", "9 cm³", "18 cm³", "54 cm³"], answer: "27 cm³" },
        { questionText: "How many feet are in a yard?", options: ["3", "12", "36", "6"], answer: "3" },
        { questionText: "What is the perimeter of a square with side length 7 cm?", options: ["28 cm", "49 cm", "14 cm", "21 cm"], answer: "28 cm" },
        { questionText: "What is the circumference of a circle with diameter 10 units? (Use π ≈ 3.14)", options: ["31.4 units", "62.8 units", "78.5 units", "15.7 units"], answer: "31.4 units" },
        { questionText: "Convert 120 minutes to hours:", options: ["2 hours", "1.5 hours", "3 hours", "12 hours"], answer: "2 hours" },
        { questionText: "What is the area of a triangle with base 6 cm and height 4 cm?", options: ["12 cm²", "24 cm²", "10 cm²", "8 cm²"], answer: "12 cm²" },
        { questionText: "Convert 5 kilograms to grams:", options: ["5000 g", "500 g", "50 g", "50000 g"], answer: "5000 g" },
        { questionText: "What is the area of a square with perimeter 24 cm?", options: ["36 cm²", "24 cm²", "48 cm²", "16 cm²"], answer: "36 cm²" }
    ],
    number_sense: [
        { questionText: "What is the place value of 5 in 3,524?", options: ["Hundreds", "Tens", "Thousands", "Ones"], answer: "Hundreds" },
        { questionText: "Which of the following is a prime number?", options: ["17", "15", "21", "9"], answer: "17" },
        { questionText: "What is the greatest common divisor (GCD) of 12 and 18?", options: ["6", "3", "12", "36"], answer: "6" },
        { questionText: "What is 25% of 80?", options: ["20", "25", "40", "15"], answer: "20" },
        { questionText: "Express 3/4 as a decimal:", options: ["0.75", "0.34", "0.60", "0.80"], answer: "0.75" },
        { questionText: "Which number is closest to √50?", options: ["7", "8", "6", "9"], answer: "7" },
        { questionText: "What is the least common multiple (LCM) of 4 and 6?", options: ["12", "24", "6", "18"], answer: "12" },
        { questionText: "What is the absolute value of -15?", options: ["15", "-15", "0", "5"], answer: "15" },
        { questionText: "Convert 0.6 to a fraction in simplest form:", options: ["3/5", "6/10", "2/3", "1/6"], answer: "3/5" },
        { questionText: "In the number 84.39, which digit is in the hundredths place?", options: ["9", "3", "4", "8"], answer: "9" }
    ],
    operations: [
        { questionText: "Solve: 15 - (3 × 4)", options: ["3", "48", "12", "6"], answer: "3" },
        { questionText: "What is 120 divided by 8?", options: ["15", "12", "14", "18"], answer: "15" },
        { questionText: "Evaluate: 4² - 3 × 2", options: ["10", "26", "8", "14"], answer: "10" },
        { questionText: "Find the sum of 4.5 and 3.25", options: ["7.75", "7.5", "7.25", "8.0"], answer: "7.75" },
        { questionText: "Solve: 3/8 + 1/4", options: ["5/8", "4/12", "1/2", "3/4"], answer: "5/8" },
        { questionText: "What is the product of 14 and 5?", options: ["70", "60", "80", "50"], answer: "70" },
        { questionText: "Evaluate: 24 ÷ (6 - 2) + 3", options: ["9", "7", "12", "5"], answer: "9" },
        { questionText: "Find the difference between 100 and 37.5", options: ["62.5", "63.5", "72.5", "52.5"], answer: "62.5" },
        { questionText: "What is the value of (-3) × (-4) + (-5)?", options: ["7", "17", "-17", "-7"], answer: "7" },
        { questionText: "Solve: 2/3 × 9/10", options: ["3/5", "11/13", "18/30", "4/5"], answer: "3/5" }
    ],
    probability: [
        { questionText: "A fair six-sided die is rolled. What is the probability of rolling a 4?", options: ["1/6", "1/2", "2/3", "1/4"], answer: "1/6" },
        { questionText: "If a coin is tossed twice, what is the probability of getting two heads?", options: ["1/4", "1/2", "3/4", "1/3"], answer: "1/4" },
        { questionText: "In a box of 5 red and 3 blue marbles, what is the probability of picking a blue marble?", options: ["3/8", "5/8", "1/2", "3/5"], answer: "3/8" },
        { questionText: "What is the mean of the data set: 2, 4, 6, 8, 10?", options: ["6", "5", "8", "4"], answer: "6" },
        { questionText: "What is the median of the numbers: 3, 10, 5, 8, 2?", options: ["5", "8", "3", "6"], answer: "5" },
        { questionText: "What is the mode of the dataset: 3, 4, 4, 5, 6, 6, 6?", options: ["6", "4", "5", "3"], answer: "6" },
        { questionText: "The probability of an impossible event is:", options: ["0", "1", "0.5", "-1"], answer: "0" },
        { questionText: "The sum of the probabilities of all possible outcomes in an experiment is:", options: ["1", "100", "0.5", "0"], answer: "1" },
        { questionText: "A card is drawn from a standard deck of 52 cards. What is the probability of drawing a Spade?", options: ["1/4", "1/13", "1/2", "1/52"], answer: "1/4" },
        { questionText: "What is the range of the data set: 12, 5, 18, 24, 7?", options: ["19", "12", "17", "24"], answer: "19" }
    ]
};

const categoryConcepts = {
    algebra: {
        title: "Algebraic Reasoning",
        description: "Algebra is the language of patterns, relationships, and functions. By generalizing arithmetic, algebra allows us to express mathematical models that capture real-world behaviors and solve for unknown variables.",
        tip: "Adjust the interactive sliders to vary coefficients and constant values. Observe how changing parameters transforms the graphs, intercepts, and slope of linear models.",
        formula: "Slope-Intercept Form: y = mx + c\nQuadratic Form: ax² + bx + c = 0",
        importance: "Critical for calculus, physics, engineering, and data science modeling."
    },
    geometry: {
        title: "Spatial Relations & Geometry",
        description: "Geometry bridges mathematics and visual art. It is the study of shapes, sizes, dimensions, angles, and their underlying symmetries, establishing rigorous proofs and spatial reasoning skills.",
        tip: "Click and drag the vertices of the geometric shapes on the canvas. Observe how angle sums and side-length relationships remain invariant under transformations.",
        formula: "Triangle Angle Sum: A + B + C = 180°\nPythagorean Theorem: a² + b² = c²",
        importance: "Essential for design, architecture, game development, and navigation."
    },
    measurement: {
        title: "Measurement & Dimensions",
        description: "Measurement is the quantitative description of physical attributes. From perimeter and area of 2D shapes to volume and surface area of 3D solids, it defines how we interact with space and size.",
        tip: "Experiment with varying dimensions. Look at how changing the base length of a shape alters its area exponentially compared to its perimeter.",
        formula: "Area of Triangle: A = ½ × base × height\nCircumference of Circle: C = 2πr",
        importance: "Used daily in construction, physics, manufacturing, and spatial planning."
    },
    number_sense: {
        title: "Numeric Foundations",
        description: "Number sense goes beyond simple counting. It encapsulates an intuitive understanding of numbers, their magnitude, place values, representations (fractions, decimals, percentages), and prime factors.",
        tip: "Slide along the number line or partition the grids to see how rational numbers map. Prime numbers highlight the fundamental building blocks of integers.",
        formula: "Fraction-to-Decimal: a/b = a ÷ b\nPlace Value: base-10 exponential weights",
        importance: "The bedrock of all arithmetic operations, computation, and financial literacy."
    },
    operations: {
        title: "Mathematical Operations",
        description: "Operations govern the interactions between numbers. Guided by strict order of operations (PEMDAS/BODMAS), we combine values using addition, multiplication, roots, and exponents.",
        tip: "Test different numeric values. Follow the order of operations step-by-step: handle parentheses first, then exponents, followed by division/multiplication.",
        formula: "Order: Parentheses ➜ Exponents ➜ MD ➜ AS\nAbsolute Value: |-x| = x",
        importance: "Forms the computational engine for every calculation and mathematical proof."
    },
    probability: {
        title: "Probability & Statistics",
        description: "Probability is the mathematics of uncertainty. By analyzing sample spaces and collecting data, statistics lets us find patterns in noise, make predictions, and measure the likelihood of events.",
        tip: "Activate the trial selectors to perform multiple random rolls or card selections. Compare experimental frequency against calculated theoretical probability.",
        formula: "Probability P(E) = Favored Outcomes ÷ Total\nMean: μ = ∑x / N",
        importance: "Central to machine learning, financial forecasting, weather forecasting, and actuarial sciences."
    }
};

const cleanMaterialTitle = (title) => {
    if (!title) return 'Standard Exploration';
    let clean = title.replace(/^(Practice|Exploration|Game)GR\.\s*\d+-\d+GRADES\s*\d+-\d+/i, '');
    clean = clean.replace(/^(Practice|Exploration|Game)GR\.\s*\d+/i, '');
    clean = clean.replace(/^(Practice|Exploration|Game)/i, '');
    return clean.trim() || 'Interactive Model';
};

const getBadgeInfo = (title) => {
    if (!title) return { text: 'Explore', color: '#0a84ff', bg: 'rgba(10,132,255,0.15)' };
    const lowercase = title.toLowerCase();
    if (lowercase.includes('practice')) {
        return { text: 'Practice', color: '#30d158', bg: 'rgba(48,209,88,0.15)' };
    } else if (lowercase.includes('game')) {
        return { text: 'Game', color: '#bf5af2', bg: 'rgba(191,90,242,0.15)' };
    } else {
        return { text: 'Concept', color: '#ff9f0a', bg: 'rgba(255,159,10,0.15)' };
    }
};

import SimulationLibraryLayout from './SimulationLibraryLayout';

export default function MathsSimulationView({ onBack, handleLockedItemClick, isSignedIn, initialSimulationId, initialCategory }) {
    const { t } = useLanguage();
    const [activeSimulation, setActiveSimulation] = useState(() => {
        if (initialSimulationId && mathSimulations[initialSimulationId]) {
            return { id: initialSimulationId, ...mathSimulations[initialSimulationId] };
        }
        return null;
    });
    const [isLoadingSim, setIsLoadingSim] = useState(false);

    const [quizState, setQuizState] = useState('idle'); 
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [userChoice, setUserChoice] = useState(null);

    const activeCategory = activeSimulation ? activeSimulation.category : null;
    const activeTopic = activeSimulation ? activeSimulation.parentTopic : null;

    const activeTopicLabel = React.useMemo(() => {
        if (!activeCategory || !activeTopic || !mathCurriculum[activeCategory]) return null;
        const grades = mathCurriculum[activeCategory].grades || [];
        for (const g of grades) {
            const topic = g.topics.find(t => t.id === activeTopic);
            if (topic) return topic.label;
        }
        return null;
    }, [activeCategory, activeTopic]);
    
    // Determine the material index within the topic
    const topicMaterials = React.useMemo(() => {
        if (!activeTopic) return [];
        return Object.entries(mathSimulations || {})
            .filter(([_, m]) => m.parentTopic === activeTopic)
            .map(([id, m]) => ({ ...m, id }));
    }, [activeTopic]);

    const activeMaterialIndex = React.useMemo(() => {
        if (!activeSimulation) return 0;
        return Math.max(0, topicMaterials.findIndex(m => m.id === activeSimulation.id));
    }, [activeSimulation, topicMaterials]);

    const handleStartQuiz = () => {
        const cat = activeCategory || 'algebra';
        const questionsList = mathQuizDatabase[cat] || mathQuizDatabase.algebra;
        
        const shuffled = [...questionsList]
            .map(q => ({
                ...q,
                options: [...q.options].sort(() => Math.random() - 0.5)
            }))
            .sort(() => Math.random() - 0.5);
            
        setQuizQuestions(shuffled);
        setCurrentQuestionIdx(0);
        setScore(0);
        setUserChoice(null);
        setQuizState('active');
    };

    const handleOptionSelect = (opt) => {
        if (quizState !== 'active') return;
        setUserChoice(opt);
        const correctAns = quizQuestions[currentQuestionIdx].answer;
        if (opt === correctAns) setScore(s => s + 1);
        setQuizState('answered');
    };

    const handleNextQuestion = () => {
        if (currentQuestionIdx < 9) {
            setCurrentQuestionIdx(i => i + 1);
            setUserChoice(null);
            setQuizState('active');
        } else {
            setQuizState('results');
        }
    };

    const renderActiveModule = () => {
        if (topicMaterials.length > 0) {
            const currentMaterial = topicMaterials[activeMaterialIndex] || topicMaterials[0];
            return (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <GeoGebraPlayer key={currentMaterial.url} ggbUrl={currentMaterial.url} id={currentMaterial.id || 'sim'} />
                </div>
            );
        }
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
                <PlayCircle size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Simulation Loading Engine</h3>
                <p>The interactive GeoGebra simulation for this topic will be available once the download finishes.</p>
            </div>
        );
    };

    const subjectOptions = React.useMemo(() => {
        return Object.entries(mathCurriculum).map(([key, data]) => ({
            id: key,
            label: data.label
        }));
    }, []);

    const filters = [
        {
            id: 'subject',
            label: 'Subject',
            options: subjectOptions
        },
        {
            id: 'grade',
            label: 'Grade Level',
            options: [
                { id: 'elementary', label: 'Upper Elementary (Grades 4-5)' },
                { id: 'middle', label: 'Middle School (Grades 6-8)' },
                { id: 'high', label: 'High School (Grades 9-12)' }
            ]
        }
    ];

    const matchFilter = (sim, filterId, activeOptions) => {
        if (filterId === 'subject') {
            return activeOptions.includes(sim.category);
        }
        if (filterId === 'grade') {
            if (activeOptions.includes('elementary') && sim.title.includes('4-5')) return true;
            if (activeOptions.includes('middle') && sim.title.includes('6-8')) return true;
            if (activeOptions.includes('high') && sim.title.includes('9-12')) return true;
            return false;
        }
        return true;
    };

    const loggedInUsername = localStorage.getItem('logged_in_username') || '';
    const [approvedSims, setApprovedSims] = useState(() => {
        try {
            const stored = localStorage.getItem('showcase_approved_maths_sims');
            const defaultApproved = [
                'hkpdxysv','dmvzqbqj','b5apx95m','pnrnkvrj','wcdguqjf','wmmt7xhr','rh4usghq','t4fkp845','zdthcuav','d9mmpebw','ccra2fmc','dncz2ppm','hfefkxwu','njttrs7f','peyfxhzs','yacyvtjn','wnhzbdam','vgp6zrta','pqmvhxzq','daqswvxv','fhqqu6w6','fusbjz9b','yabgjfmd','tjkyk2hj','nyhvjcaq','mnruf8bu','qcrgez64','e4wvxtvh','nkckjvyv','jjdh8gf3'
            ];
            if (stored) {
                const parsed = JSON.parse(stored);
                const merged = Array.from(new Set([...parsed, ...defaultApproved]));
                localStorage.setItem('showcase_approved_maths_sims', JSON.stringify(merged));
                return merged;
            }
            return defaultApproved;
        } catch (e) {
            console.error('Error reading showcase_approved_maths_sims from localStorage:', e);
            return [
                'hkpdxysv','dmvzqbqj','b5apx95m','pnrnkvrj','wcdguqjf','wmmt7xhr','rh4usghq','t4fkp845','zdthcuav','d9mmpebw','ccra2fmc','dncz2ppm','hfefkxwu','njttrs7f','peyfxhzs','yacyvtjn','wnhzbdam','vgp6zrta','pqmvhxzq','daqswvxv','fhqqu6w6','fusbjz9b','yabgjfmd','tjkyk2hj','nyhvjcaq','mnruf8bu','qcrgez64','e4wvxtvh','nkckjvyv','jjdh8gf3'
            ];
        }
    });

    const accessLevel = React.useMemo(() => {
        const rootUsers = ['GnanSahith@MG', 'MGRoot01', 'MyGnanAD'];
        const approvedUsers = ['CharanKumar@MG', 'SandhyaRekha@MG', 'VishnuKranthi@MG'];
        if (rootUsers.includes(loggedInUsername)) return 'ROOT';
        if (approvedUsers.includes(loggedInUsername)) return 'APPROVED_ONLY';
        return 'CLERK';
    }, [loggedInUsername]);

    const simArray = React.useMemo(() => {
        let arr = Object.entries(mathSimulations).map(([id, sim]) => ({ ...sim, id }));
        if (accessLevel === 'ROOT') {
            return arr;
        } else {
            return arr.filter(sim => approvedSims.includes(sim.id));
        }
    }, [accessLevel, approvedSims]);

    const handleSimClick = (sim) => {
        if (accessLevel === 'CLERK') {
            alert('Currently Locked');
            return;
        }
        setActiveSimulation(sim);
        setIsLoadingSim(true);
        setTimeout(() => setIsLoadingSim(false), 2000);
    };

    if (!activeSimulation) {
        return (
            <SimulationLibraryLayout
                title={t('nav.mathsSimulations', "Maths Simulations")}
                subtitle={t('maths.subtitle', "Interactive math concepts and visualizations")}
                simulations={simArray}
                filters={filters}
                initialFilters={initialCategory ? { subject: [initialCategory] } : {}}
                onSimulationClick={handleSimClick}
                onBack={onBack}
                matchFilter={matchFilter}
                icon={<Sigma size={36} color="#ffd60a" />}
            />
        );
    }

    const categoryData = mathCurriculum[activeCategory];
    const specificMaterialTitle = activeSimulation.title;

    return (
            <div className="maths-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="ios-header glass-panel" style={{ 
                    position: 'relative',
                    height: '46px', 
                    borderRadius: '12px', 
                    marginBottom: '8px', 
                    background: 'rgba(255,255,255,0.06)', 
                    backdropFilter: 'blur(12px)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '0 16px',
                    boxSizing: 'border-box'
                }}>
                    <button 
                        onClick={() => {
                            setActiveSimulation(null);
                            setViewState('curriculum_grid');
                            setQuizState('idle');
                        }} 
                        className="back-btn" 
                        style={{ 
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '6px 14px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '100px', 
                            border: 'none', 
                            color: '#fff', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '6px', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s', 
                            fontSize: '15px',
                            fontWeight: 600,
                            lineHeight: 'normal'
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <h2 style={{ 
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        margin: 0, 
                        fontSize: '18px', 
                        fontWeight: 700, 
                        color: '#fff',
                        whiteSpace: 'nowrap'
                    }}>
                        <Layers size={18} color="#0a84ff" />
                        {activeTopicLabel ? activeTopicLabel : (categoryData ? categoryData.label : 'Mathematics Simulator')}
                    </h2>
                </div>

                <div className="maths-grid">
                    
                    <aside className="glass-panel" style={{
                        display: 'flex', 
                        flexDirection: 'column', 
                        overflow: 'hidden',
                        borderRadius: '16px',
                        minHeight: 0
                    }}>
                        <div style={{
                            padding: '8px 8px 6px',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                        }}>
                            <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.55 }}>
                                Simulation Parts
                            </h3>
                        </div>
                        <ul style={{ margin: 0, padding: '2px', listStyle: 'none', overflowY: 'auto', flex: 1 }}>
                            {topicMaterials.length > 0 ? (
                                topicMaterials.map((material, idx) => {
                                    const isActive = idx === activeMaterialIndex;
                                    const isLocked = idx >= 3;
                                    const cleanedTitle = cleanMaterialTitle(material.title);
                                    const badge = getBadgeInfo(material.title);
                                    
                                    return (
                                        <li key={material.id || idx}>
                                            <button
                                                onClick={() => {
                                                    const openPart = () => {
                                                        setActiveSimulation(topicMaterials[idx]);
                                                        setQuizState('idle');
                                                    };
                                                    if (isLocked && handleLockedItemClick) {
                                                        handleLockedItemClick(openPart);
                                                    } else {
                                                        openPart();
                                                    }
                                                }}
                                                style={{
                                                    width: '100%', 
                                                    display: 'flex', 
                                                    flexDirection: 'column',
                                                    gap: '4px', 
                                                    padding: '6px 8px', 
                                                    borderRadius: '8px',
                                                    background: isActive
                                                        ? 'linear-gradient(135deg, rgba(10,132,255,0.22), rgba(10,132,255,0.08))'
                                                        : 'transparent',
                                                    border: isActive
                                                        ? '1px solid rgba(10,132,255,0.4)'
                                                        : '1px solid transparent',
                                                    color: '#fff', 
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease', 
                                                    textAlign: 'left',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        background: badge.bg,
                                                        color: badge.color
                                                    }}>
                                                        {isLocked ? <Lock size={10} /> : badge.text}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                                                        Part {idx + 1}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    fontSize: '13px', 
                                                    fontWeight: isActive ? 700 : 500,
                                                    color: isActive ? '#0a84ff' : 'rgba(255,255,255,0.85)', 
                                                    lineHeight: 1.4,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    width: '100%'
                                                }}>
                                                    <span>{cleanedTitle}</span>
                                                    {isActive && <ChevronRight size={14} color="#0a84ff" />}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })
                            ) : (
                                <li style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                                    No loaded modules found.
                                </li>
                            )}
                        </ul>
                    </aside>

                    <div className="glass-panel" style={{
                        position: 'relative', 
                        borderRadius: '16px', 
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0
                    }}>
                        <div style={{
                            padding: '16px 20px', 
                            borderBottom: '1px solid rgba(255,255,255,0.07)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            background: 'rgba(0,0,0,0.1)'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PlayCircle size={16} color="#0a84ff" />
                                {specificMaterialTitle ? cleanMaterialTitle(specificMaterialTitle) : 'Simulation Canvas'}
                            </h3>
                        </div>

                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            {renderActiveModule()}
                        </div>
                    </div>

                    <aside className="glass-panel" style={{
                        display: 'flex', 
                        flexDirection: 'column', 
                        overflow: 'hidden',
                        borderRadius: '16px', 
                        position: 'relative',
                        minHeight: 0
                    }}>
                        <div style={{
                            padding: '8px',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                        }}>
                            {quizState === 'idle' ? <Info size={15} color="#0a84ff" /> : <Zap size={15} color="#ff9f0a" />}
                            <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.55 }}>
                                {quizState !== 'idle' ? 'Math Challenge' : 'Concept Guide'}
                            </h3>
                        </div>

                        {quizState === 'idle' ? (
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '6px' }}>
                                {(() => {
                                    const concepts = categoryConcepts[activeCategory] || categoryConcepts.algebra;
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                                                {concepts.title}
                                            </h4>
                                            
                                            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px 0' }}>
                                                {concepts.description}
                                            </p>
                                            
                                            <div style={{ 
                                                background: 'rgba(255,159,10,0.1)', 
                                                border: '1px solid rgba(255,159,10,0.2)', 
                                                padding: '8px', 
                                                borderRadius: '8px', 
                                                marginBottom: '10px' 
                                            }}>
                                                <h5 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 700, color: '#ff9f0a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Zap size={12} /> Interactive Tip
                                                </h5>
                                                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.9)' }}>
                                                    {concepts.tip}
                                                </p>
                                            </div>
                                            
                                            <div style={{ 
                                                background: 'rgba(255,255,255,0.03)', 
                                                border: '1px solid rgba(255,255,255,0.06)', 
                                                padding: '8px', 
                                                borderRadius: '8px', 
                                                marginBottom: '10px' 
                                            }}>
                                                <h5 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <BookOpen size={12} /> Key Formulation
                                                </h5>
                                                <pre style={{ margin: 0, fontSize: '11.5px', fontFamily: 'monospace', color: '#30d158', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                                    {concepts.formula}
                                                </pre>
                                            </div>
                                            
                                            <div style={{ marginBottom: '16px' }}>
                                                <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Academic Value
                                                </h5>
                                                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.6)' }}>
                                                    {concepts.importance}
                                                </p>
                                            </div>

                                            <div style={{ padding: '8px 0 0 0', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                                <button onClick={handleStartQuiz} style={{
                                                    width: '100%',
                                                    background: 'linear-gradient(135deg, rgba(255,159,10,0.85), rgba(255,100,10,0.85))',
                                                    color: '#fff', 
                                                    border: '1px solid rgba(255,159,10,0.5)',
                                                    padding: '12px 20px', 
                                                    borderRadius: '12px', 
                                                    fontWeight: 600,
                                                    cursor: 'pointer', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    gap: '8px',
                                                    transition: 'opacity 0.2s',
                                                    boxShadow: '0 4px 12px rgba(255,159,10,0.2)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                                                >
                                                    <Zap size={16}/> Start Challenge
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="fade-in-scale" style={{ flex: 1, overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column' }}>
                                {quizState === 'results' ? (
                                    <div style={{ textAlign: 'center', padding: '10px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(10,132,255,0.2)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trophy size={32} color="#0a84ff" />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '20px', marginBottom: '8px', fontWeight: 700 }}>Challenge Completed!</h3>
                                        <p style={{ margin: '0 0 24px 0', opacity: 0.8, fontSize: '14px', lineHeight: 1.5 }}>
                                            You answered <strong style={{ color: '#30d158', fontSize: '18px' }}>{score}</strong> out of 10 questions correctly.
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <button onClick={handleStartQuiz} style={{ background: '#0a84ff', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <Zap size={16}/> Try Again
                                            </button>
                                            <button onClick={() => setQuizState('idle')} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                                View Concept Guide
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff9f0a', fontWeight: 800 }}>
                                                Question {currentQuestionIdx + 1} of 10
                                            </div>
                                            <button onClick={() => setQuizState('idle')} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', padding: 0 }}>
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', lineHeight: 1.4, color: '#fff' }}>
                                            {quizQuestions[currentQuestionIdx]?.questionText}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {quizQuestions[currentQuestionIdx]?.options.map((opt, i) => {
                                                const correctAns = quizQuestions[currentQuestionIdx].answer;
                                                const isCorrect = opt === correctAns;
                                                
                                                let bg = 'rgba(255,255,255,0.06)';
                                                let border = '1px solid rgba(255,255,255,0.05)';
                                                let opacity = 1;
                                                
                                                if (quizState === 'answered') {
                                                    if (isCorrect) {
                                                        bg = 'rgba(48,209,88,0.2)';
                                                        border = '1px solid rgba(48,209,88,0.5)';
                                                    } else if (userChoice === opt) {
                                                        bg = 'rgba(255,69,58,0.2)';
                                                        border = '1px solid rgba(255,69,58,0.5)';
                                                    } else {
                                                        opacity = 0.4;
                                                    }
                                                }
                                                
                                                return (
                                                    <button key={i} onClick={() => handleOptionSelect(opt)} disabled={quizState === 'answered'} style={{
                                                        background: bg, border: border, padding: '12px 14px', borderRadius: '12px',
                                                        color: '#fff', textAlign: 'left', fontSize: '13px', lineHeight: 1.4,
                                                        cursor: quizState === 'answered' ? 'default' : 'pointer',
                                                        opacity, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px'
                                                    }}>
                                                        {quizState === 'answered' && isCorrect && <CheckCircle size={18} color="#30d158" style={{flexShrink: 0}}/>}
                                                        {quizState === 'answered' && !isCorrect && userChoice === opt && <XCircle size={18} color="#ff453a" style={{flexShrink: 0}}/>}
                                                        <span style={{flex: 1}}>{opt}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                            {quizState === 'answered' && (
                                                <button onClick={handleNextQuestion} style={{
                                                    width: '100%', background: '#0a84ff', color: '#fff',
                                                    border: 'none', padding: '12px', borderRadius: '12px',
                                                    fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', fontSize: '15px'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#0970d9'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#0a84ff'}
                                                >
                                                    {currentQuestionIdx < 9 ? 'Next Question' : 'View Results'}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        );
}
