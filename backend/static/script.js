/**
 * @file script.js
 * This file contains the client-side JavaScript logic for the Formal Language Compiler application.
 * It handles user interactions, fetches data from the backend, and dynamically renders
 * visualizations for DFAs, PDAs, and CFGs using SVG.
 * REFERENCE: https://github.com/Randell-janus/DFA-Simulator/tree/master (this one uses REACT)
 */


// DOM Element Selections: Get references to various HTML elements for manipulation.
const dfaSelect = document.getElementById('dfa-select');
const inputString = document.getElementById('input-string');
const simulateButton = document.getElementById('simulate-button');
const resetButton = document.getElementById('reset-button');
const loadingIndicator = document.getElementById('loading-indicator');
const statusMessage = document.getElementById('status-message');
const resultDisplay = document.getElementById('result-display');
const sequenceDisplay = document.getElementById('state-sequence-display');
const errorMessage = document.getElementById('error-message');

// Visualization Content Holders
const dfaVisualizationContent = document.getElementById('dfa-visualization-content');
const cfgVisualizationContent = document.getElementById('cfg-visualization-content');
const pdaVisualizationContent = document.getElementById('pda-visualization-content');

// SVG Canvases and Display Areas
const svgDfaVisualization = document.getElementById('dfa-visualization'); // SVG for DFA
const cfgRulesDisplay = document.getElementById('cfg-rules-display'); // Area for CFG rules

const svgPdaVisualization = document.getElementById('pda-visualization-svg'); // SVG for PDA
const pdaStackDisplay = document.getElementById('stack-display'); // Area for PDA stack
const pdaCurrentConfigDisplay = document.getElementById('pda-current-config-display'); // Area for PDA current configuration

// CFG Specific Display Areas
const cfgDerivationSequenceDisplay = document.getElementById('cfg-derivation-sequence');
const cfgCurrentStringDisplay = document.getElementById('cfg-current-string');
const cfgStatusMessage = document.getElementById('cfg-status-message');
const cfgResultDisplay = document.getElementById('cfg-result-display');

// UI Controls
const viewModeRadios = document.querySelectorAll('input[name="view-mode"]');

// Backend URL Configuration - Comment out unused URLs.
const BACKEND_URL = 'https://mediseen.site'; 
// const BACKEND_URL = 'https://nr2s.pythonanywhere.com';

// for Localhost :))
// const BACKEND_URL = 'http://127.0.0.1:8000'; 

// SVG Namespace: Required for creating SVG elements dynamically.
const SVG_NS = "http://www.w3.org/2000/svg";

const dfaAnimationDelay = 350; /**Delay in ms for DFA animation steps*/
const CFG_ANIMATION_DELAY = 250; // Delay in ms for CFG derivation steps
const PDA_ANIMATION_DELAY = 700; // Delay in ms for PDA animation steps
const traceCfgMaxSteps = 150; // Maximum steps for CFG derivation tracing
const STATE_RADIUS = 15; // Radius of state circles in DFA visualization
const PDA_NODE_WIDTH = 70; // Default width for PDA nodes
const PDA_NODE_HEIGHT = 35; // Default height for PDA nodes
const PDA_INITIAL_STACK_SYMBOL = 'Z₀'; // Standard initial symbol for PDA stack

// Factors for scaling DFA state coordinates (cx, cy) for different DFA layouts.
// These allow fine-tuning the visual spacing of states.
const bets_dfa_cx_factor = 1.15;
const bets_dfa_cy_factor = 1.125;

const stars_dfa_cx_factor = 1.35;
const stars_dfa_cy_factor = 1.1;

/**
 * @typedef {Object} StateLayout
 * @property {number} id - The unique identifier for the state.
 * @property {number} cx - The x-coordinate of the state's center.
 * @property {number} cy - The y-coordinate of the state's center.
 * @property {boolean} [isStart] - True if this is the start state.
 * @property {boolean} [isFinal] - True if this is a final/accepting state.
 * @property {boolean} [isTrap] - True if this is a trap state.
 */

/**
 * @typedef {Object} TransitionLayout
 * @property {number} from - The ID of the source state.
 * @property {number} to - The ID of the target state.
 * @property {string} label - The label for the transition (input symbol(s)).
 */

/**
 * @typedef {Object} DFALayout
 * @property {StateLayout[]} states - An array of state layout objects.
 * @property {TransitionLayout[]} transitions - An array of transition layout objects.
 */

/**
 * @const {Object.<string, DFALayout>} dfaLayouts
 * Predefined layouts for different DFAs. Each key is a DFA identifier (e.g., 'bets_dfa'),
 * and the value is an object containing state coordinates and transition information.
 * Coordinates are calculated using base values multiplied by specific scaling factors.
 */
const dfaLayouts = {
    bets_dfa: {
        states: [
            { id: 0, cx: 50 * bets_dfa_cx_factor, cy: 200 * bets_dfa_cy_factor, isStart: true }, { id: 1, cx: 150 * bets_dfa_cx_factor, cy: 100 * bets_dfa_cy_factor },
            { id: 2, cx: 150 * bets_dfa_cx_factor, cy: 300 * bets_dfa_cy_factor }, { id: 3, cx: 250 * bets_dfa_cx_factor, cy: 100 * bets_dfa_cy_factor },
            { id: 4, cx: 250 * bets_dfa_cx_factor, cy: 300 * bets_dfa_cy_factor }, { id: 5, cx: 350 * bets_dfa_cx_factor, cy: 50 * bets_dfa_cy_factor },
            { id: 6, cx: 350 * bets_dfa_cx_factor, cy: 150 * bets_dfa_cy_factor }, { id: 7, cx: 350 * bets_dfa_cx_factor, cy: 350 * bets_dfa_cy_factor, isTrap: true },
            { id: 8, cx: 450 * bets_dfa_cx_factor, cy: 50 * bets_dfa_cy_factor, isTrap: true }, { id: 9, cx: 450 * bets_dfa_cx_factor, cy: 150 * bets_dfa_cy_factor },
            { id: 10, cx: 450 * bets_dfa_cx_factor, cy: 250 * bets_dfa_cy_factor }, { id: 11, cx: 550 * bets_dfa_cx_factor, cy: 200 * bets_dfa_cy_factor },
            { id: 12, cx: 550 * bets_dfa_cx_factor, cy: 300 * bets_dfa_cy_factor, isFinal: true },
        ],
        transitions: [
            { from: 0, to: 1, label: 'b' }, { from: 0, to: 2, label: 'a' },
            { from: 1, to: 3, label: 'a,b' }, { from: 2, to: 3, label: 'a' },
            { from: 2, to: 4, label: 'b' }, { from: 3, to: 5, label: 'a' },
            { from: 3, to: 6, label: 'b' }, { from: 4, to: 3, label: 'a' },
            { from: 4, to: 7, label: 'b' }, { from: 5, to: 8, label: 'a' },
            { from: 5, to: 9, label: 'b' }, { from: 6, to: 10, label: 'a,b' },
            { from: 7, to: 7, label: 'a,b' }, { from: 8, to: 8, label: 'a,b' },
            { from: 9, to: 11, label: 'a' }, { from: 9, to: 8, label: 'b' },
            { from: 10, to: 7, label: 'a' }, { from: 10, to: 11, label: 'b' },
            { from: 11, to: 12, label: 'a,b' }, { from: 12, to: 12, label: 'a,b' },
        ]
    },
    stars_dfa: {
        states: [
            { id: 0, cx: 50 * stars_dfa_cx_factor, cy: 50 * stars_dfa_cy_factor, isStart: true },
            { id: 1, cx: 150 * stars_dfa_cx_factor, cy: 50 * stars_dfa_cy_factor },
            { id: 2, cx: 250 * stars_dfa_cx_factor, cy: 50 * stars_dfa_cy_factor },
            { id: 3, cx: 350 * stars_dfa_cx_factor, cy: 50 * stars_dfa_cy_factor },
            { id: 10, cx: 450 * stars_dfa_cx_factor, cy: 50 * stars_dfa_cy_factor, isFinal: true },
            { id: 5, cx: 100 * stars_dfa_cx_factor, cy: 125 * stars_dfa_cy_factor },
            { id: 6, cx: 200 * stars_dfa_cx_factor, cy: 125 * stars_dfa_cy_factor },
            { id: 7, cx: 300 * stars_dfa_cx_factor, cy: 125 * stars_dfa_cy_factor },
            { id: 8, cx: 400 * stars_dfa_cx_factor, cy: 125 * stars_dfa_cy_factor },
            { id: 11, cx: 500 * stars_dfa_cx_factor, cy: 125 * stars_dfa_cy_factor, isFinal: true },
            { id: 9, cx: 50 * stars_dfa_cx_factor, cy: 200 * stars_dfa_cy_factor },
            { id: 12, cx: 150 * stars_dfa_cx_factor, cy: 200 * stars_dfa_cy_factor },
            { id: 13, cx: 250 * stars_dfa_cx_factor, cy: 200 * stars_dfa_cy_factor },
            { id: 14, cx: 350 * stars_dfa_cx_factor, cy: 200 * stars_dfa_cy_factor },
            { id: 18, cx: 450 * stars_dfa_cx_factor, cy: 200 * stars_dfa_cy_factor, isFinal: true },
            { id: 15, cx: 100 * stars_dfa_cx_factor, cy: 275 * stars_dfa_cy_factor },
            { id: 16, cx: 200 * stars_dfa_cx_factor, cy: 275 * stars_dfa_cy_factor },
            { id: 17, cx: 300 * stars_dfa_cx_factor, cy: 275 * stars_dfa_cy_factor },
            { id: 19, cx: 400 * stars_dfa_cx_factor, cy: 275 * stars_dfa_cy_factor },
            { id: 21, cx: 500 * stars_dfa_cx_factor, cy: 275 * stars_dfa_cy_factor, isFinal: true },
            { id: 20, cx: 50 * stars_dfa_cx_factor, cy: 350 * stars_dfa_cy_factor },
            { id: 4, cx: 150 * stars_dfa_cx_factor, cy: 350 * stars_dfa_cy_factor, isTrap: true },
            { id: 22, cx: 250 * stars_dfa_cx_factor, cy: 350 * stars_dfa_cy_factor, isFinal: true },
            { id: 23, cx: 350 * stars_dfa_cx_factor, cy: 350 * stars_dfa_cy_factor, isFinal: true },
        ],
        transitions: [
            { from: 0, to: 1, label: '0' }, { from: 0, to: 2, label: '1' },
            { from: 1, to: 5, label: '0' }, { from: 1, to: 3, label: '1' },
            { from: 2, to: 5, label: '0,1' }, { from: 3, to: 6, label: '0' },
            { from: 3, to: 4, label: '1' }, { from: 4, to: 4, label: '0,1' },
            { from: 5, to: 4, label: '0' }, { from: 5, to: 6, label: '1' },
            { from: 6, to: 7, label: '0,1' }, { from: 7, to: 9, label: '0' },
            { from: 7, to: 8, label: '1' }, { from: 8, to: 9, label: '0' },
            { from: 8, to: 12, label: '1' }, { from: 9, to: 13, label: '0' },
            { from: 9, to: 8, label: '1' }, { from: 10, to: 10, label: '0' },
            { from: 10, to: 11, label: '1' }, { from: 11, to: 22, label: '0' },
            { from: 11, to: 12, label: '1' }, { from: 12, to: 9, label: '0' },
            { from: 12, to: 17, label: '1' }, { from: 13, to: 15, label: '0' },
            { from: 13, to: 8, label: '1' }, { from: 14, to: 10, label: '0' },
            { from: 14, to: 11, label: '1' }, { from: 15, to: 14, label: '0' },
            { from: 15, to: 16, label: '1' }, { from: 16, to: 22, label: '0' },
            { from: 16, to: 12, label: '1' }, { from: 17, to: 20, label: '0' },
            { from: 17, to: 19, label: '1' }, { from: 18, to: 15, label: '0' },
            { from: 18, to: 8, label: '1' }, { from: 19, to: 23, label: '0' }, { from: 19, to: 19, label: '1' },
            { from: 20, to: 18, label: '0' },
            { from: 20, to: 21, label: '1' }, { from: 21, to: 9, label: '0' },
            { from: 21, to: 12, label: '1' }, { from: 22, to: 13, label: '0' },
            { from: 22, to: 8, label: '1' }, { from: 23, to: 18, label: '0' }, { from: 23, to: 21, label: '1' }
        ]
    }
};

/**
 * @typedef {Object} CFGRule
 * @property {string} from - The non-terminal symbol on the left-hand side of the rule.
 * @property {string[]} to - An array of terminal and/or non-terminal symbols on the right-hand side.
 */

/**
 * @typedef {Object} CFGRepresentation
 * @property {string} description - A human-readable description of the language generated by the CFG.
 * @property {string[]} variables - An array of non-terminal symbols (variables).
 * @property {string[]} terminals - An array of terminal symbols.
 * @property {string} startSymbol - The start symbol of the grammar.
 * @property {CFGRule[]} rules - An array of production rules.
 */

/**
 * @const {Object.<string, CFGRepresentation>} cfgRepresentations
 * Predefined Context-Free Grammar (CFG) representations corresponding to the DFAs.
 * These are used for the CFG visualization and derivation tracing.
 * The variables are derived from DFA state IDs, and rules are based on DFA transitions.
 * Final states in the DFA can transition to epsilon ('ε') in the CFG to signify acceptance.
 */
const cfgRepresentations = {
    bets_dfa: {
        description: "(aa + bb + aba + ba) (aba + bab + bbb) (a + b)* (a + b + aa + abab) (aa + bb)*",
        variables: dfaLayouts.bets_dfa.states.map(s => `Q${s.id}`),
        terminals: ['a', 'b', 'ε'],
        startSymbol: 'Q0',
        rules: [ // Rules are derived from DFA transitions: Q_i -> symbol Q_j
            { from: 'Q0', to: ['b', 'Q1'] }, { from: 'Q0', to: ['a', 'Q2'] },
            { from: 'Q1', to: ['a', 'Q3'] }, { from: 'Q1', to: ['b', 'Q3'] },
            { from: 'Q2', to: ['a', 'Q3'] }, { from: 'Q2', to: ['b', 'Q4'] },
            { from: 'Q3', to: ['a', 'Q5'] }, { from: 'Q3', to: ['b', 'Q6'] },
            { from: 'Q4', to: ['a', 'Q3'] }, { from: 'Q4', to: ['b', 'Q7'] }, // Q7 is trap
            { from: 'Q5', to: ['a', 'Q8'] }, { from: 'Q5', to: ['b', 'Q9'] }, // Q8 is trap
            { from: 'Q6', to: ['a', 'Q10'] }, { from: 'Q6', to: ['b', 'Q10'] },
            { from: 'Q7', to: ['a', 'Q7'] }, { from: 'Q7', to: ['b', 'Q7'] }, // Trap state rules
            { from: 'Q8', to: ['a', 'Q8'] }, { from: 'Q8', to: ['b', 'Q8'] }, // Trap state rules
            { from: 'Q9', to: ['a', 'Q11'] }, { from: 'Q9', to: ['b', 'Q8'] },
            { from: 'Q10', to: ['a', 'Q7'] }, { from: 'Q10', to: ['b', 'Q11'] },
            { from: 'Q11', to: ['a', 'Q12'] }, { from: 'Q11', to: ['b', 'Q12'] },
            { from: 'Q12', to: ['a', 'Q12'] }, { from: 'Q12', to: ['b', 'Q12'] }, // Loops in final state
            { from: 'Q12', to: ['ε'] } // Final state can derive epsilon
        ]
    },
    stars_dfa: {
        description: "(111 + 101 + 001 + 010) (1 + 0 + 11)(1 + 0 + 11)* (111 + 000) (111 + 000)* (01 + 10 + 00)",
        variables: dfaLayouts.stars_dfa.states.map(s => `Q${s.id}`),
        terminals: ['0', '1', 'ε'],
        startSymbol: 'Q0',
        rules: [
            { from: 'Q0', to: ['0', 'Q1'] }, { from: 'Q0', to: ['1', 'Q2'] },
            { from: 'Q1', to: ['0', 'Q5'] }, { from: 'Q1', to: ['1', 'Q3'] },
            { from: 'Q2', to: ['0', 'Q5'] }, { from: 'Q2', to: ['1', 'Q5'] },
            { from: 'Q3', to: ['0', 'Q6'] }, { from: 'Q3', to: ['1', 'Q4'] }, // Q4 is trap
            { from: 'Q4', to: ['0', 'Q4'] }, { from: 'Q4', to: ['1', 'Q4'] }, // Trap state rules
            { from: 'Q5', to: ['0', 'Q4'] }, { from: 'Q5', to: ['1', 'Q6'] },
            { from: 'Q6', to: ['0', 'Q7'] }, { from: 'Q6', to: ['1', 'Q7'] },
            { from: 'Q7', to: ['0', 'Q9'] }, { from: 'Q7', to: ['1', 'Q8'] },
            { from: 'Q8', to: ['0', 'Q9'] }, { from: 'Q8', to: ['1', 'Q12'] },
            { from: 'Q9', to: ['0', 'Q13'] }, { from: 'Q9', to: ['1', 'Q8'] },
            { from: 'Q10', to: ['0', 'Q10'] }, { from: 'Q10', to: ['1', 'Q11'] },
            { from: 'Q11', to: ['0', 'Q22'] }, { from: 'Q11', to: ['1', 'Q12'] },
            { from: 'Q12', to: ['0', 'Q9'] }, { from: 'Q12', to: ['1', 'Q17'] },
            { from: 'Q13', to: ['0', 'Q15'] }, { from: 'Q13', to: ['1', 'Q8'] },
            { from: 'Q14', to: ['0', 'Q10'] }, { from: 'Q14', to: ['1', 'Q11'] },
            { from: 'Q15', to: ['0', 'Q14'] }, { from: 'Q15', to: ['1', 'Q16'] },
            { from: 'Q16', to: ['0', 'Q22'] }, { from: 'Q16', to: ['1', 'Q12'] },
            { from: 'Q17', to: ['0', 'Q20'] }, { from: 'Q17', to: ['1', 'Q19'] },
            { from: 'Q18', to: ['0', 'Q15'] }, { from: 'Q18', to: ['1', 'Q8'] },
            { from: 'Q19', to: ['0', 'Q23'] }, { from: 'Q19', to: ['1', 'Q19'] },
            { from: 'Q20', to: ['0', 'Q18'] }, { from: 'Q20', to: ['1', 'Q21'] },
            { from: 'Q21', to: ['0', 'Q9'] }, { from: 'Q21', to: ['1', 'Q12'] },
            { from: 'Q22', to: ['0', 'Q13'] }, { from: 'Q22', to: ['1', 'Q8'] },
            { from: 'Q23', to: ['0', 'Q18'] }, { from: 'Q23', to: ['1', 'Q21'] },
            { from: 'Q10', to: ['ε'] }, { from: 'Q11', to: ['ε'] }, // Epsilon for final states
            { from: 'Q18', to: ['ε'] }, { from: 'Q21', to: ['ε'] },
            { from: 'Q22', to: ['ε'] }, { from: 'Q23', to: ['ε'] }
        ]
    }
};

/**
 * Transforms DFA state definitions into PDA state/node definitions for visualization.
 * This function maps DFA state types (start, final, trap) to corresponding PDA node types
 * and labels, preserving coordinates.
 * @param {StateLayout[]} dfaStates - An array of DFA state layout objects.
 * @returns {PdaNodeLayout[]} An array of PDA node layout objects.
 * @typedef {Object} PdaNodeLayout
 * @property {number} id - The unique identifier for the node.
 * @property {number} cx - The x-coordinate of the node's center.
 * @property {number} cy - The y-coordinate of the node's center.
 * @property {string} type - The type of PDA node (e.g., 'start', 'accept', 'reject', 'read').
 * @property {string} label - The label for the PDA node.
 */
function transformDfaStatesToPdaStates(dfaStates) {
    return dfaStates.map(state => {
        const pdaState = { id: state.id, cx: state.cx, cy: state.cy };
        if (state.isStart) {
            pdaState.type = 'start';
            pdaState.label = 'START';
        } else if (state.isFinal) {
            pdaState.type = 'accept';
            pdaState.label = 'ACCEPT';
        } else if (state.isTrap) {
            pdaState.type = 'reject';
            pdaState.label = 'REJECT';
        } else {
            // Default PDA node type for intermediate DFA states
            pdaState.type = 'read';
            pdaState.label = `q${state.id}`;
        }
        return pdaState;
    });
}

/**
 * @const {Object.<string, PDALayout>} pdaLayouts
 * Predefined layouts for Pushdown Automata (PDAs), derived from DFA layouts.
 * The PDA visualization reuses the DFA's state structure and transitions,
 * but state objects are transformed by `transformDfaStatesToPdaStates` to assign PDA-specific types and labels.
 * @typedef {Object} PDALayout
 * @property {PdaNodeLayout[]} states - An array of PDA node layout objects.
 * @property {TransitionLayout[]} transitions - An array of transition layout objects (same as DFA).
 */
const pdaLayouts = {
    bets_dfa: {
        states: transformDfaStatesToPdaStates(dfaLayouts.bets_dfa.states),
        transitions: dfaLayouts.bets_dfa.transitions
    },
    stars_dfa: {
        states: transformDfaStatesToPdaStates(dfaLayouts.stars_dfa.states),
        transitions: dfaLayouts.stars_dfa.transitions
    }
};


// Press enter to simulate :)
simulateButton.addEventListener('click', handleSimulate);
resetButton.addEventListener('click', mainHandleReset);
inputString.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') { 
        handleSimulate();
    }
});

// Listener for DFA selection change, redraw visualization for the new DFA
dfaSelect.addEventListener('change', () => {
    updateActiveVisualization(); 
    // Reset result displays
    resultDisplay.textContent = '';
    sequenceDisplay.innerHTML = '';
    statusMessage.textContent = 'Select an automaton and view mode. For DFA, enter a string and simulate.';
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
    // Clear highlights from both DFA and PDA visualizations
    highlightStateSVG(null, 'dfa-visualization');
    highlightStateSVG(null, 'pda-visualization-svg');
});

// Listeners for view mode (DFA, CFG, PDA) radio button changes
viewModeRadios.forEach(radio => {
    radio.addEventListener('change', updateActiveVisualization);
});


/**
 * Resets the application state to its initial view.
 * Clears input fields, simulation results, visualizations, and error messages.
 * Re-enables UI controls and updates the visualization to the default state.
 * This function is called on page load and when the reset button is clicked.
 */
function mainHandleReset() {
    inputString.value = ''; // Clear input string field
    statusMessage.textContent = 'Select an automaton and view mode. For DFA, enter a string and simulate.';
    resultDisplay.textContent = ''; 
    sequenceDisplay.innerHTML = ''; 
    errorMessage.textContent = ''; 
    errorMessage.classList.add('hidden'); 
    loadingIndicator.classList.add('hidden'); 

    // Remove any highlighting from DFA and PDA visualizations
    highlightStateSVG(null, 'dfa-visualization');
    highlightStateSVG(null, 'pda-visualization-svg');

    // Reset CFG specific displays
    if (cfgDerivationSequenceDisplay) cfgDerivationSequenceDisplay.innerHTML = 'Derivation will appear here.';
    if (cfgCurrentStringDisplay) cfgCurrentStringDisplay.innerHTML = 'S'; // Default to start symbol 'S'
    if (cfgStatusMessage) cfgStatusMessage.textContent = 'CFG view. Simulation traces a derivation.';
    if (cfgResultDisplay) cfgResultDisplay.textContent = 'Result: -';

    enableControls(true); // Re-enable UI controls
    console.log('Form reset.');
    updateActiveVisualization(); // Refresh the view to its default
}

/**
 * Handles the simulation process when the "Simulate" button is clicked.
 * It determines the selected automaton type (DFA, PDA, CFG) and input string,
 * then initiates the corresponding simulation or derivation process.
 * For DFA and PDA, it makes an asynchronous request to the backend.
 * For CFG, it performs client-side derivation tracing.
 * @async
 */
async function handleSimulate() {
    const selectedAutomatonKey = dfaSelect.value; // Get selected DFA ('bets_dfa' or 'stars_dfa')
    const currentViewMode = document.querySelector('input[name="view-mode"]:checked').value; // Get view mode ('dfa', 'cfg', 'pda')
    const rawInput = inputString.value;
    const input = rawInput.trim(); // Get and trim the input string

    console.log(`Simulating Automaton: ${selectedAutomatonKey}, Input: "${input}", Mode: ${currentViewMode}`);

    // Reset UI elements before simulation
    sequenceDisplay.innerHTML = '';
    resultDisplay.textContent = '-';
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    loadingIndicator.classList.remove('hidden'); // Show loading indicator
    enableControls(false); // Disable controls during simulation

    // Clear previous highlights
    highlightStateSVG(null, 'dfa-visualization');
    highlightStateSVG(null, 'pda-visualization-svg');

    // Input validation for DFA/PDA modes
    if (input === '' && (currentViewMode === 'dfa' || currentViewMode === 'pda')) {
        statusMessage.textContent = 'Input string cannot be empty for DFA/PDA simulation.';
        loadingIndicator.classList.add('hidden');
        enableControls(true);
        return;
    }

    // --- DFA Simulation ---
    if (currentViewMode === 'dfa') {
        statusMessage.textContent = `Simulating DFA with '${input}'...`;
        try {
            // Fetch simulation results from the backend
            const response = await fetch(`${BACKEND_URL}/simulate-dfa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dfa_type: selectedAutomatonKey, dfa_input: input }),
            });
            let data;
            try { // Try to parse JSON response
                data = await response.json();
            } catch (jsonError) { // Handle cases where response is not valid JSON (HTTP ERROR 500)
                const textResponse = await response.text();
                throw new Error(`Received non-JSON response from server (status: ${response.status}). Raw: ${textResponse}`);
            }
            loadingIndicator.classList.add('hidden'); // Hide loading indicator
            if (!response.ok) throw new Error(data?.error || `HTTP error ${response.status}`); // Handle HTTP errors

            // Update UI with results
            resultDisplay.textContent = data.accepted ? 'Accepted' : 'Rejected';
            statusMessage.textContent = `DFA Simulation finished. Final state: q${data.final_state}.`;
            if (data.error) showError(data.error); // Display any error from backend

            // Animate the DFA state sequence if available
            if (data.state_sequence && data.state_sequence.length > 0) {
                await animateDfaSequence(data.state_sequence, selectedAutomatonKey);
            } else {
                sequenceDisplay.textContent = "No valid state sequence received.";
                // Highlight final state even if no sequence (e.g., empty string on start=final state)
                if (typeof data.final_state === 'number') highlightStateSVG(data.final_state, 'dfa-visualization');
            }
        } catch (error) { // Catch any errors during fetch or processing
            statusMessage.textContent = 'An error occurred during DFA simulation.';
            showError(`${error.message}. Check console and backend logs.`);
            loadingIndicator.classList.add('hidden');
            resultDisplay.textContent = 'Error';
        } finally {
            enableControls(true); // Re-enable controls
        }
    // --- PDA Simulation ---
    } else if (currentViewMode === 'pda') {
        statusMessage.textContent = `Simulating PDA (based on DFA: ${selectedAutomatonKey}) for '${input}'...`;
        pdaCurrentConfigDisplay.textContent = 'Fetching DFA results to drive PDA...';
        if (pdaStackDisplay) pdaStackDisplay.innerHTML = ''; // Clear previous stack display

        try {
            // PDA simulation is driven by the corresponding DFA's behavior.
            // First, fetch the DFA simulation results.
            const dfaResponse = await fetch(`${BACKEND_URL}/simulate-dfa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dfa_type: selectedAutomatonKey, dfa_input: input }),
            });
            let dfaData;
            try {
                dfaData = await dfaResponse.json();
            } catch (jsonError) {
                const textResponse = await dfaResponse.text();
                throw new Error(`Received non-JSON response for DFA data (status: ${dfaResponse.status}). Raw: ${textResponse}`);
            }
            loadingIndicator.classList.add('hidden');
            if (!dfaResponse.ok) throw new Error(dfaData?.error || `DFA simulation HTTP error ${dfaResponse.status}`);

            if (dfaData.error) { // If DFA simulation had an error, PDA cannot proceed meaningfully
                showError(`DFA simulation error for PDA: ${dfaData.error}`);
                statusMessage.textContent = `PDA animation cannot proceed due to DFA error.`;
                resultDisplay.textContent = 'Error (from DFA)';
                pdaCurrentConfigDisplay.textContent = `Error: ${dfaData.error}`;
            } else if (!dfaData.state_sequence || dfaData.state_sequence.length === 0) {
                // Handle cases with no state sequence (e.g., empty string processing)
                resultDisplay.textContent = dfaData.accepted ? 'Accepted' : 'Rejected';
                statusMessage.textContent = `PDA animation: DFA had no steps. Result: ${resultDisplay.textContent}`;
                pdaCurrentConfigDisplay.textContent = `Configuration: No steps from DFA. Result: ${resultDisplay.textContent}`;
                const pdaLayout = pdaLayouts[selectedAutomatonKey];
                if (pdaLayout) { // Highlight start state and initialize stack
                    const startState = pdaLayout.states.find(s => s.type === 'start');
                    if (startState) highlightStateSVG(startState.id, 'pda-visualization-svg');
                    initializePdaStack(selectedAutomatonKey);
                }
            } else { // If DFA simulation was successful, animate PDA flow
                statusMessage.textContent = `DFA results received. Animating PDA...`;
                await animatePdaAsDfaFlow(selectedAutomatonKey, dfaData.state_sequence, dfaData.accepted, input);
            }
        } catch (error) {
            statusMessage.textContent = 'An error occurred during PDA simulation.';
            showError(String(error.message));
            resultDisplay.textContent = 'Error';
            pdaCurrentConfigDisplay.textContent = `Error: ${error.message}`;
            loadingIndicator.classList.add('hidden');
        } finally {
            enableControls(true);
        }
    // --- CFG Derivation ---
    } else if (currentViewMode === 'cfg') {
        statusMessage.textContent = `Preparing CFG derivation ...`;
        if (cfgStatusMessage) cfgStatusMessage.textContent = `Preparing CFG derivation...`;
        if (cfgResultDisplay) cfgResultDisplay.textContent = "Result: -";

        const cfgData = cfgRepresentations[selectedAutomatonKey]; // Get CFG rules for selected automaton 
        if (!cfgData) { // Should not happen if dfaSelect values match cfgRepresentations keys (cant be too sure :))
            showError(`CFG data for ${selectedAutomatonKey} not found.`);
            loadingIndicator.classList.add('hidden');
            enableControls(true);
            return;
        }
        let targetString = "";
        // If input is empty, use a default short string for demonstration
        if (input.trim() === "") {
            if (selectedAutomatonKey === 'bets_dfa') targetString = "ab";
            else if (selectedAutomatonKey === 'stars_dfa') targetString = "01";
            else targetString = null; // No default for other potential DFAs
            if (cfgStatusMessage && targetString) cfgStatusMessage.textContent = `Showing derivation for default string "${targetString}"...`;
            else if (cfgStatusMessage) cfgStatusMessage.textContent = `Showing a few derivation steps...`;
        } else {
            targetString = input.trim();
            if (cfgStatusMessage) cfgStatusMessage.textContent = `Attempting to derive "${targetString}"...`;
        }
        await traceCfgDerivation(cfgData, targetString); // Perform client-side derivation tracing
        loadingIndicator.classList.add('hidden');
        enableControls(true);
    }
}

/**
 * Enables or disables UI controls like buttons and input fields.
 * This is used to prevent BAD STUFF FROM THE USER during simulation or processing.
 * @param {boolean} enable - True to enable controls, false to disable.
 */
function enableControls(enable) {
    simulateButton.disabled = !enable;
    resetButton.disabled = !enable;
    inputString.disabled = !enable;
    dfaSelect.disabled = !enable;
    viewModeRadios.forEach(radio => radio.disabled = !enable);
}

/**
 * Displays an error message in the designated error message area.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden'); 
}

/**
 * A utility function to introduce a delay using Promises.
 * Used for controlling animation speeds.
 * @param {number} ms - The delay duration in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Updates the active visualization panel (DFA, CFG, or PDA) based on the
 * selected view mode radio button. Hides inactive panels and shows the active one.
 * Calls the appropriate drawing or display function for the selected automaton and view.
 */
function updateActiveVisualization() {
    const selectedAutomatonKey = dfaSelect.value;
    const selectedViewMode = document.querySelector('input[name="view-mode"]:checked').value;

    console.log(`Updating view: Automaton=${selectedAutomatonKey}, Mode=${selectedViewMode}`);

    // Hide all visualization content panels initially
    dfaVisualizationContent.classList.add('hidden');
    cfgVisualizationContent.classList.add('hidden');
    pdaVisualizationContent.classList.add('hidden');

    // Reset PDA specific displays if PDA view is not active or being switched
    if (pdaStackDisplay) pdaStackDisplay.innerHTML = '';
    if (pdaCurrentConfigDisplay) pdaCurrentConfigDisplay.textContent = 'Current Configuration: (State, Remaining Input, Stack Top)';
    if (svgPdaVisualization) svgPdaVisualization.innerHTML = ''; // Clear PDA SVG

    // Show the selected panel and draw/display content
    if (selectedViewMode === 'dfa') {
        dfaVisualizationContent.classList.remove('hidden');
        drawDFAVisualization(selectedAutomatonKey); // Draw the DFA
    } else if (selectedViewMode === 'cfg') {
        cfgVisualizationContent.classList.remove('hidden');
        displayCFG(selectedAutomatonKey); // Display CFG rules
        // Reset CFG derivation displays
        if (cfgDerivationSequenceDisplay) cfgDerivationSequenceDisplay.innerHTML = 'Derivation will appear here.';
        if (cfgCurrentStringDisplay) cfgCurrentStringDisplay.innerHTML = cfgRepresentations[selectedAutomatonKey] ? cfgRepresentations[selectedAutomatonKey].startSymbol : 'S';
        if (cfgStatusMessage) cfgStatusMessage.textContent = 'CFG view. Input a string to derive or simulate for a default derivation.';
        if (cfgResultDisplay) cfgResultDisplay.textContent = 'Result: -';
    } else if (selectedViewMode === 'pda') {
        pdaVisualizationContent.classList.remove('hidden');
        drawPDAVisualization(selectedAutomatonKey); // Draw the PDA
        initializePdaStack(selectedAutomatonKey); // Initialize the PDA stack display
    }
}


/**
 * Displays the rules of a Context-Free Grammar (CFG) in a formatted way.
 * The CFG data is retrieved from the `cfgRepresentations` object.
 * @param {string} dfaIdentifier - The identifier of the DFA (e.g., 'bets_dfa') whose corresponding CFG is to be displayed.
 */
function displayCFG(dfaIdentifier) {
    const data = cfgRepresentations[dfaIdentifier];
    if (!cfgRulesDisplay) return; // Exit if the display element doesn't exist
    cfgRulesDisplay.innerHTML = ''; // Clear previous content

    if (data) { // If CFG data found
        let html = `<strong>Description:</strong> ${data.description}<br><br>`;
        html += `<strong>Variables (V):</strong> { ${data.variables.join(', ')} }<br>`;
        html += `<strong>Terminals (T):</strong> { ${data.terminals.join(', ')} }<br>`;
        html += `<strong>Start Symbol (S):</strong> ${data.startSymbol}<br><br>`;
        html += '<strong>Production Rules (P):</strong><br>';
        data.rules.forEach(rule => {
            // Format rule: From -> To1 To2 ... | ε
            html += `${rule.from} &rarr; ${rule.to.join(' ') || 'ε'}<br>`;
        });
        cfgRulesDisplay.innerHTML = html;
    } else {
        cfgRulesDisplay.textContent = `CFG definition for L(${dfaIdentifier}) not found.`;
    }
}

/**
 * Draws the visual representation of a DFA on an SVG canvas.
 * @param {string} dfaKey - The identifier for the DFA layout to draw (e.g., 'bets_dfa').
 * This function dynamically creates SVG elements for states (circles) and transitions (paths with arrowheads).
 * Mathematical formulas are used for positioning:
 * - `Math.atan2` for calculating angles between states.
 * - Trigonometry (`Math.cos`, `Math.sin`) for placing transition line endpoints on the circumference of state circles.
 * - SVG path commands (`M`, `L`, `A` for arcs/self-loops, `Q` for curved bidirectional transitions).
 */
function drawDFAVisualization(dfaKey) {
    const layout = dfaLayouts[dfaKey]; // Get layout data (states, transitions, coordinates)
    if (!svgDfaVisualization) return; // Ensure SVG canvas element exists
    svgDfaVisualization.innerHTML = ''; // Clear any previous drawing

    if (!layout) {
        console.error("Invalid DFA key for layout:", dfaKey);
        svgDfaVisualization.innerHTML = `<text x="10" y="20" fill="red">Error: DFA layout for ${dfaKey} not found.</text>`;
        return;
    }

    // Define SVG arrowhead marker
    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'dfa-arrowhead');
    marker.setAttribute('viewBox', '0 -5 10 10'); // Coordinate system for the marker
    // refX positions the marker's reference point (tip of arrow) relative to the path end.
    // Calculation: 8 (base offset for arrow length) + STATE_RADIUS / 2 (adjustment for circle edge)
    marker.setAttribute('refX', 8 + STATE_RADIUS / 2);
    marker.setAttribute('refY', 0);
    marker.setAttribute('orient', 'auto'); // Arrowhead orients along the path
    marker.setAttribute('markerWidth', 4); // Size of the marker viewport
    marker.setAttribute('markerHeight', 4);
    const poly = document.createElementNS(SVG_NS, 'polyline'); // Shape of the arrowhead
    poly.setAttribute('points', '0,-5 10,0 0,5'); // Triangle points
    poly.setAttribute('fill', 'var(--pda-transition-path-stroke, #5f7e97)'); // Arrowhead color
    marker.appendChild(poly);
    defs.appendChild(marker);
    svgDfaVisualization.appendChild(defs);

    // Create a map for quick lookup of state coordinates by ID
    const stateCoords = {};
    layout.states.forEach(s => { stateCoords[s.id] = { cx: s.cx, cy: s.cy }; });

    // Draw transitions
    layout.transitions.forEach(t => {
        const fromStatePos = stateCoords[t.from];
        const toStatePos = stateCoords[t.to];
        if (!fromStatePos || !toStatePos) return; // Skip if state coords not found

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'transition-path');
        path.setAttribute('marker-end', 'url(#dfa-arrowhead)'); // Attach arrowhead
        let pathD, labelX, labelY; // SVG path data string and label coordinates

        // Calculate angle between source and target state centers
        // Math.atan2(y_diff, x_diff) gives the angle in radians
        const angle = Math.atan2(toStatePos.cy - fromStatePos.cy, toStatePos.cx - fromStatePos.cx);

        if (t.from === t.to) { // --- Self-loop transition ---
            const loopRadius = 18; // Radius of the loop arc
            const loopCenterX = fromStatePos.cx;
            // Position loop arc above the state circle
            const loopCenterY = fromStatePos.cy - STATE_RADIUS - loopRadius + 5;
            // SVG Arc Path: M (move to) start_x,start_y A (arc) rx,ry x-axis-rot large-arc sweep end_x,end_y
            // This creates a semi-circular arc.
            pathD = `M ${fromStatePos.cx - loopRadius * 0.5}, ${fromStatePos.cy - STATE_RADIUS + 3} A ${loopRadius},${loopRadius} 0 1,1 ${fromStatePos.cx + loopRadius * 0.5}, ${fromStatePos.cy - STATE_RADIUS + 3}`;
            labelX = loopCenterX; // Label centered with loop
            labelY = loopCenterY - loopRadius - 5; // Label above loop
        } else { // --- Transition between different states ---
            // Calculate start/end points on the circumference of state circles using trigonometry
            // startX = centerX + radius * cos(angle)
            // startY = centerY + radius * sin(angle)
            const startX = fromStatePos.cx + STATE_RADIUS * Math.cos(angle);
            const startY = fromStatePos.cy + STATE_RADIUS * Math.sin(angle);
            const endX = toStatePos.cx - STATE_RADIUS * Math.cos(angle); // Subtract for target state
            const endY = toStatePos.cy - STATE_RADIUS * Math.sin(angle);
            pathD = `M ${startX},${startY} L ${endX},${endY}`; // Default to a straight line

            // Check for bidirectional transitions to draw a curved path to avoid overlap
            if (layout.transitions.some(rev => rev.from === t.to && rev.to === t.from) && t.from < t.to) {
                const controlOffsetY = 30; // How much the curve bows out
                // Midpoint of the straight line segment
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                // Calculate control point for Quadratic Bezier curve (Q command)
                // The control point is offset perpendicularly from the midpoint.
                // Perpendicular vector components: (-sin(angle), cos(angle)) or (sin(angle), -cos(angle))
                const controlX = midX - controlOffsetY * Math.sin(angle);
                const controlY = midY + controlOffsetY * Math.cos(angle);
                pathD = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`; // Quadratic Bezier path
                labelX = controlX; // Position label near control point
                labelY = controlY - 5;
            } else { // For single straight lines
                const labelOffset = 10; // Offset label from the line
                // Position label at midpoint, offset perpendicularly
                // Angle for perpendicular offset: angle + PI/2 (90 degrees)
                // x_offset = offset * sin(perp_angle), y_offset = offset * -cos(perp_angle)
                labelX = (startX + endX) / 2 + labelOffset * Math.sin(angle + Math.PI / 2);
                labelY = (startY + endY) / 2 - labelOffset * Math.cos(angle + Math.PI / 2);
            }
        }
        path.setAttribute('d', pathD); // Set the calculated path data
        svgDfaVisualization.appendChild(path);

        // Add transition label
        const transitionLabel = document.createElementNS(SVG_NS, 'text');
        transitionLabel.setAttribute('x', labelX);
        transitionLabel.setAttribute('y', labelY);
        transitionLabel.setAttribute('class', 'transition-label');
        transitionLabel.textContent = t.label;
        svgDfaVisualization.appendChild(transitionLabel);
    });

    // Draw states
    layout.states.forEach(state => {
        const group = document.createElementNS(SVG_NS, 'g'); // Group circle and label
        group.setAttribute('id', `dfa-group-${state.id}`); // Unique ID for the group
        // Position the group using translate transform
        const originalTransformValue = `translate(${state.cx}, ${state.cy})`;
        group.setAttribute('transform', originalTransformValue);
        group.dataset.originalTransform = originalTransformValue; // Store for reset

        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', 0); // Relative to group's (0,0)
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', STATE_RADIUS);
        circle.classList.add('state-circle');
        if (state.isStart) circle.classList.add('start-state');
        if (state.isFinal) circle.classList.add('final-state');
        if (state.isTrap) circle.classList.add('trap-state');
        group.appendChild(circle);

        const stateLabel = document.createElementNS(SVG_NS, 'text');
        stateLabel.setAttribute('x', 0); // Centered in group
        stateLabel.setAttribute('y', 0);
        stateLabel.classList.add('state-label');
        if (state.isFinal) stateLabel.classList.add('final-state-label');
        if (state.isTrap) stateLabel.classList.add('trap-state-label');
        stateLabel.textContent = `q${state.id}`;
        group.appendChild(stateLabel);
        svgDfaVisualization.appendChild(group);
    });
    console.log("DFA Visualization Updated:", dfaKey);
}


/**
 * Draws the visual representation of a PDA on an SVG canvas.
 * Similar to `drawDFAVisualization` but supports different node shapes for PDA states.
 * @param {string} pdaKey - The identifier for the PDA layout to draw.
 * Mathematical concepts are similar to DFA drawing:
 * - `Math.atan2` for angles.
 * - Trigonometry for path endpoints, adjusted for PDA node dimensions (`PDA_NODE_WIDTH`, `PDA_NODE_HEIGHT`).
 * - SVG path commands (`M`, `L`, `C` for cubic Bezier self-loops, `Q` for curved bidirectional).
 * - Logic for path endpoints to connect to edges of various shapes (ellipses, rectangles, diamonds).
 */
function drawPDAVisualization(pdaKey) {
    const layout = pdaLayouts[pdaKey];
    if (!svgPdaVisualization) return;
    svgPdaVisualization.innerHTML = ''; // Clear previous drawing

    if (!layout) {
        console.error("Invalid PDA key for layout:", pdaKey);
        svgPdaVisualization.innerHTML = `<text x="10" y="20" fill="red">Error: PDA layout for ${pdaKey} not found.</text>`;
        return;
    }

    // Define SVG arrowhead marker for PDA transitions
    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'pda-arrowhead');
    marker.setAttribute('viewBox', '0 -5 10 10');
    marker.setAttribute('refX', 3); // Adjusted refX for PDA node shapes/sizes
    marker.setAttribute('refY', 0);
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerWidth', 5);
    marker.setAttribute('markerHeight', 5);
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', '0,-5 10,0 0,5');
    poly.setAttribute('fill', 'var(--pda-arrowhead-fill, #5f7e97)');
    marker.appendChild(poly);
    defs.appendChild(marker);
    svgPdaVisualization.appendChild(defs);

    const stateCoords = {}; // Map for state coordinates and types
    layout.states.forEach(s => { stateCoords[s.id] = { cx: s.cx, cy: s.cy, type: s.type }; });

    // Draw transitions
    layout.transitions.forEach(t => {
        const fromNodeInfo = stateCoords[t.from];
        const toNodeInfo = stateCoords[t.to];
        if (!fromNodeInfo || !toNodeInfo) return;

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'transition-path');
        path.setAttribute('marker-end', 'url(#pda-arrowhead)');

        const angle = Math.atan2(toNodeInfo.cy - fromNodeInfo.cy, toNodeInfo.cx - fromNodeInfo.cx);
        const dx = Math.cos(angle); // x-component of direction vector
        const dy = Math.sin(angle); // y-component of direction vector
        let pathD, labelX, labelY;

        // --- Self-loop for PDA nodes (using Cubic Bezier for more control) ---
        if (t.from === t.to) {
            const nodeWidth = PDA_NODE_WIDTH;
            const nodeHeight = PDA_NODE_HEIGHT;
            // Offsets for control points to shape the loop
            const loopOffsetX = nodeWidth * 0.5;
            const loopOffsetY = nodeHeight * 0.8;
            // Start and end points of the loop, slightly offset from node center
            const startLoopX = fromNodeInfo.cx + nodeWidth / 2.2;
            const startLoopY = fromNodeInfo.cy - nodeHeight / 4;
            const endLoopX = fromNodeInfo.cx + nodeWidth / 2.2;
            const endLoopY = fromNodeInfo.cy + nodeHeight / 4;
            // Control points for cubic Bezier (C command) to create a nice loop shape
            const control1X = fromNodeInfo.cx + nodeWidth / 2 + loopOffsetX;
            const control1Y = fromNodeInfo.cy - loopOffsetY;
            const control2X = fromNodeInfo.cx + nodeWidth / 2 + loopOffsetX;
            const control2Y = fromNodeInfo.cy + loopOffsetY;
            pathD = `M ${startLoopX},${startLoopY} C ${control1X},${control1Y} ${control2X},${control2Y} ${endLoopX},${endLoopY}`;
            labelX = fromNodeInfo.cx + nodeWidth / 2 + loopOffsetX + 10; // Position label outside the loop
            labelY = fromNodeInfo.cy;
        } else { // --- Transition between different PDA nodes ---
            // Initial start/end points (center of nodes)
            let startX = fromNodeInfo.cx;
            let startY = fromNodeInfo.cy;
            let endX = toNodeInfo.cx;
            let endY = toNodeInfo.cy;

            // Adjust start/end points to connect to the boundary of the shapes
            // This is more complex than circles as shapes (rect, ellipse, diamond path) vary.
            // Effective radius approximation:
            const startRadiusX = PDA_NODE_WIDTH / 2.2; // Approximate horizontal radius for connection
            const startRadiusY = PDA_NODE_HEIGHT / 2.2; // Approximate vertical radius for connection
            startX = fromNodeInfo.cx + dx * startRadiusX;
            startY = fromNodeInfo.cy + dy * startRadiusY;

            // Calculate intersection with target node's boundary (simplified for common shapes)
            const targetWidthRadius = PDA_NODE_WIDTH / 2;
            const targetHeightRadius = PDA_NODE_HEIGHT / 2;

            // Determine if intersection is with horizontal or vertical edge (for rectangular/diamond shapes)
            // This is a common way to find an intersection point of a line with an axis-aligned bounding box.
            // It compares the slope component scaled by the shape's half-dimensions.
            if (Math.abs(dx * targetHeightRadius) > Math.abs(dy * targetWidthRadius)) {
                // Intersection with vertical edge
                endX = toNodeInfo.cx - Math.sign(dx) * targetWidthRadius;
                endY = toNodeInfo.cy - Math.sign(dx) * targetWidthRadius * dy / dx; // y = m*x_offset
            } else {
                // Intersection with horizontal edge
                endY = toNodeInfo.cy - Math.sign(dy) * targetHeightRadius;
                endX = toNodeInfo.cx - Math.sign(dy) * targetHeightRadius * dx / dy; // x = y_offset / m
            }

            pathD = `M ${startX},${startY} L ${endX},${endY}`; // Default to straight line

            // Curve for bidirectional transitions (similar to DFA)
            if (layout.transitions.some(rev => rev.from === t.to && rev.to === t.from) && t.from < t.to) {
                const controlOffsetY = 35;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlX = midX - controlOffsetY * Math.sin(angle);
                const controlY = midY + controlOffsetY * Math.cos(angle);
                pathD = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
                labelX = controlX;
                labelY = controlY - 9; // Adjusted offset for PDA labels
            } else { // Label for straight line
                const labelOffset = 12;
                labelX = (startX + endX) / 2 + labelOffset * Math.sin(angle + Math.PI / 2);
                labelY = (startY + endY) / 2 - labelOffset * Math.cos(angle + Math.PI / 2);
            }
        }
        path.setAttribute('d', pathD);
        svgPdaVisualization.appendChild(path);

        // Add transition label, handling multi-line labels if present (e.g., "a,b/c")
        const transitionLabel = document.createElementNS(SVG_NS, 'text');
        transitionLabel.setAttribute('x', labelX);
        transitionLabel.setAttribute('y', labelY);
        transitionLabel.setAttribute('class', 'transition-label');
        let pdaActionLabel = t.label;
        if (pdaActionLabel.includes(',')) { // If label has parts separated by comma (e.g. for PDA: input,pop/push)
            const parts = pdaActionLabel.split(',');
            transitionLabel.textContent = ''; // Clear default content
            parts.forEach((part, index) => { // Create a tspan for each part for multi-line display
                const tspan = document.createElementNS(SVG_NS, 'tspan');
                tspan.setAttribute('x', labelX); // Align each line to the same x
                tspan.setAttribute('dy', index === 0 ? '0' : '1em'); // Offset subsequent lines vertically
                tspan.textContent = part.trim();
                transitionLabel.appendChild(tspan);
            });
        } else {
            transitionLabel.textContent = pdaActionLabel;
        }
        svgPdaVisualization.appendChild(transitionLabel);
    });

    // Draw PDA states/nodes
    layout.states.forEach(state => {
        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('id', `pda-group-${state.id}`);
        let nodeElement, nodeClass = 'pda-node ', labelClass = 'pda-node-label ';
        let nodeLabelText = state.label || `q${state.id}`;
        group.dataset.originalLabel = nodeLabelText; // Store original label for reset

        // Determine node shape based on state.type
        switch (state.type) {
            case 'start':
                nodeElement = document.createElementNS(SVG_NS, 'ellipse');
                nodeElement.setAttribute('cx', state.cx); nodeElement.setAttribute('cy', state.cy);
                nodeElement.setAttribute('rx', PDA_NODE_WIDTH / 1.8); nodeElement.setAttribute('ry', PDA_NODE_HEIGHT / 1.8);
                nodeClass += 'pda-start-node'; labelClass += 'pda-start-node-label';
                break;
            case 'accept':
                nodeElement = document.createElementNS(SVG_NS, 'ellipse'); // Outer ellipse for accept state
                nodeElement.setAttribute('cx', state.cx); nodeElement.setAttribute('cy', state.cy);
                nodeElement.setAttribute('rx', PDA_NODE_WIDTH / 1.8); nodeElement.setAttribute('ry', PDA_NODE_HEIGHT / 1.8);
                nodeClass += 'pda-accept-node'; labelClass += 'pda-accept-node-label';
                const innerEllipse = document.createElementNS(SVG_NS, 'ellipse'); // Inner ellipse for double-ring
                innerEllipse.setAttribute('cx', state.cx); innerEllipse.setAttribute('cy', state.cy);
                innerEllipse.setAttribute('rx', (PDA_NODE_WIDTH / 1.8) - 5); // Slightly smaller radius
                innerEllipse.setAttribute('ry', (PDA_NODE_HEIGHT / 1.8) - 5);
                innerEllipse.setAttribute('fill', 'none');
                innerEllipse.setAttribute('stroke', 'var(--pda-accept-inner-stroke, #D1A0EA)');
                innerEllipse.setAttribute('stroke-width', '1.5px');
                group.appendChild(innerEllipse); // Add inner ellipse to group first (drawn underneath)
                break;
            case 'reject':
                nodeElement = document.createElementNS(SVG_NS, 'ellipse');
                nodeElement.setAttribute('cx', state.cx); nodeElement.setAttribute('cy', state.cy);
                nodeElement.setAttribute('rx', PDA_NODE_WIDTH / 1.8); nodeElement.setAttribute('ry', PDA_NODE_HEIGHT / 1.8);
                nodeClass += 'pda-reject-node'; labelClass += 'pda-reject-node-label';
                break;
            case 'read': case 'pop': // Diamond shape for read/pop operations
                nodeElement = document.createElementNS(SVG_NS, 'path');
                const w = PDA_NODE_WIDTH / 1.3, h = PDA_NODE_HEIGHT / 1.1; // Dimensions for diamond
                // SVG Path: M (moveto) left-corner L (lineto) top-corner L right-corner L bottom-corner Z (close path)
                nodeElement.setAttribute('d', `M ${state.cx - w / 2},${state.cy} L ${state.cx},${state.cy - h / 2} L ${state.cx + w / 2},${state.cy} L ${state.cx},${state.cy + h / 2} Z`);
                nodeClass += (state.type === 'read') ? 'pda-read-node' : 'pda-pop-node';
                break;
            case 'push': // Rectangle shape for push operations
                nodeElement = document.createElementNS(SVG_NS, 'rect');
                nodeElement.setAttribute('x', state.cx - PDA_NODE_WIDTH / 2); nodeElement.setAttribute('y', state.cy - PDA_NODE_HEIGHT / 2);
                nodeElement.setAttribute('width', PDA_NODE_WIDTH); nodeElement.setAttribute('height', PDA_NODE_HEIGHT);
                nodeElement.setAttribute('rx', 5); nodeElement.setAttribute('ry', 5); // Rounded corners
                nodeClass += 'pda-push-node';
                break;
            default: // Default to rectangle for other/generic processing states
                nodeElement = document.createElementNS(SVG_NS, 'rect');
                nodeElement.setAttribute('x', state.cx - PDA_NODE_WIDTH / 2); nodeElement.setAttribute('y', state.cy - PDA_NODE_HEIGHT / 2);
                nodeElement.setAttribute('width', PDA_NODE_WIDTH); nodeElement.setAttribute('height', PDA_NODE_HEIGHT);
                nodeElement.setAttribute('rx', 5); nodeElement.setAttribute('ry', 5);
                nodeClass += 'pda-processing-node';
                break;
        }
        if (!nodeElement) return; // Should not happen
        nodeElement.setAttribute('id', `pda-node-${state.id}`);
        nodeElement.setAttribute('class', nodeClass);
        group.appendChild(nodeElement);

        const stateLabelElement = document.createElementNS(SVG_NS, 'text');
        stateLabelElement.setAttribute('x', state.cx);
        stateLabelElement.setAttribute('y', state.cy);
        stateLabelElement.setAttribute('class', labelClass);
        setSvgText(stateLabelElement, nodeLabelText); // Use helper for potentially multi-line text
        group.appendChild(stateLabelElement);
        svgPdaVisualization.appendChild(group);
    });
    console.log("PDA Visualization Updated:", pdaKey);
}

/**
 * Initializes the PDA stack display with the initial stack symbol.
 * @param {string} pdaKey - The identifier of the current PDA.
 * @returns {string[]} The initial PDA stack array.
 */
function initializePdaStack(pdaKey) {
    let currentPdaStack = [PDA_INITIAL_STACK_SYMBOL];
    updatePdaStackDisplay(currentPdaStack); // Update the visual stack
    const pdaLayout = pdaLayouts[pdaKey];
    if (pdaLayout) { // Set initial configuration display text
        const startState = pdaLayout.states.find(s => s.type === 'start');
        const startStateLabel = startState ? startState.label : 'Start';
        if (pdaCurrentConfigDisplay) pdaCurrentConfigDisplay.textContent = `Initial: (${startStateLabel}, input_string, ${PDA_INITIAL_STACK_SYMBOL})`;
    } else {
        if (pdaCurrentConfigDisplay) pdaCurrentConfigDisplay.textContent = `Initial: (Start, input_string, ${PDA_INITIAL_STACK_SYMBOL})`;
    }
    return currentPdaStack;
}

/**
 * Updates the visual representation of the PDA stack in the UI.
 * Creates `div` elements for each stack item.
 * @param {string[]} stackArray - An array of strings representing the current PDA stack content (bottom to top).
 */
function updatePdaStackDisplay(stackArray) {
    if (!pdaStackDisplay) return;
    pdaStackDisplay.innerHTML = ''; // Clear previous stack items
    if (!stackArray || stackArray.length === 0) { // If stack is empty
        const item = document.createElement('div');
        item.classList.add('stack-item', 'empty');
        item.textContent = '(empty)';
        pdaStackDisplay.appendChild(item);
        return;
    }
    // Create a div for each item, top of stack is last element in array but first visually (bottom of div)
    for (let i = 0; i < stackArray.length; i++) {
        const item = document.createElement('div');
        item.classList.add('stack-item');
        item.textContent = stackArray[i];
        if (i === stackArray.length - 1) item.classList.add('stack-top'); // Style top of stack
        pdaStackDisplay.appendChild(item);
    }
}

/**
 * Highlights or unhighlights a state/node in an SVG visualization (DFA or PDA).
 * When highlighting, it scales the state's group element and applies highlight CSS classes.
 * When unhighlighting (stateId is null), it reverts transformations and removes classes.
 * @param {number | string | null} stateId - The ID of the state/node to highlight, or null to unhighlight.
 * @param {string} [svgElementId='dfa-visualization'] - The ID of the SVG element ('dfa-visualization' or 'pda-visualization-svg').
 */
function highlightStateSVG(stateId, svgElementId = 'dfa-visualization') {
    const svgElement = document.getElementById(svgElementId);
    if (!svgElement) return;

    const isPdaViz = svgElementId === 'pda-visualization-svg';
    const groupPrefix = isPdaViz ? 'pda-group-' : 'dfa-group-';
    const nodeQuery = isPdaViz ? '.pda-node' : '.state-circle'; // Selector for the main shape
    const labelQuery = isPdaViz ? '.pda-node-label' : '.state-label'; // Selector for the text label
    const transformedGroupClass = isPdaViz ? 'pda-group-transformed' : 'dfa-group-transformed'; // CSS class for transformed group
    const highlightStyleClass = 'highlight-style'; // General highlight style for DFA
    const pdaNodeHighlightClass = 'highlight'; // Specific highlight class for PDA nodes (used in style.css)

    // --- Unhighlight previously highlighted state/node ---
    const currentTransformedGroup = svgElement.querySelector(`g.${transformedGroupClass}`);
    if (currentTransformedGroup) {
        // Revert transform: Retrieve original transform from dataset or default
        const originalTransform = currentTransformedGroup.dataset.originalTransform || (isPdaViz ? '' : 'translate(0,0)');
        currentTransformedGroup.setAttribute('transform', originalTransform);
        currentTransformedGroup.classList.remove(transformedGroupClass);
        const node = currentTransformedGroup.querySelector(nodeQuery);
        if (node) { // Remove highlight classes from node shape
            if (isPdaViz) node.classList.remove(pdaNodeHighlightClass);
            else node.classList.remove(highlightStyleClass);
        }
        const label = currentTransformedGroup.querySelector(labelQuery);
        if (label && !isPdaViz) label.classList.remove(highlightStyleClass); // Remove label highlight for DFA
    }
    // Additional cleanup for PDA nodes if a general .highlight class was applied directly
    if (isPdaViz) {
        const currentStyledNodePDA = svgElement.querySelector(`${nodeQuery}.${pdaNodeHighlightClass}`);
        if (currentStyledNodePDA) currentStyledNodePDA.classList.remove(pdaNodeHighlightClass);
    }

    // --- Highlight the new state/node ---
    if (stateId !== null && (typeof stateId === 'number' || typeof stateId === 'string')) {
        const groupElement = svgElement.querySelector(`#${groupPrefix}${stateId}`);
        if (groupElement) {
            const nodeElement = groupElement.querySelector(nodeQuery);
            if (isPdaViz && nodeElement) { // PDA highlighting: scale around its own center
                let centerX, centerY;
                // Get center of the PDA node (can be ellipse, rect, or path for diamond)
                if (nodeElement.tagName.toLowerCase() === 'ellipse' || nodeElement.tagName.toLowerCase() === 'circle') {
                    centerX = parseFloat(nodeElement.getAttribute('cx'));
                    centerY = parseFloat(nodeElement.getAttribute('cy'));
                } else if (nodeElement.tagName.toLowerCase() === 'rect') {
                    centerX = parseFloat(nodeElement.getAttribute('x')) + parseFloat(nodeElement.getAttribute('width')) / 2;
                    centerY = parseFloat(nodeElement.getAttribute('y')) + parseFloat(nodeElement.getAttribute('height')) / 2;
                } else if (nodeElement.tagName.toLowerCase() === 'path') { // For diamond shapes
                    const bbox = nodeElement.getBBox(); // Bounding box gives geometric center
                    centerX = bbox.x + bbox.width / 2;
                    centerY = bbox.y + bbox.height / 2;
                } else { // Fallback using bounding box
                    const bbox = nodeElement.getBBox();
                    centerX = bbox.x + bbox.width / 2;
                    centerY = bbox.y + bbox.height / 2;
                }
                // SVG Transform: Translate to origin, scale, then translate back.
                // This ensures scaling happens around the node's local center.
                groupElement.setAttribute('transform', `translate(${centerX}, ${centerY}) scale(1.3) translate(${-centerX}, ${-centerY})`);
                groupElement.classList.add(transformedGroupClass);
                nodeElement.classList.add(pdaNodeHighlightClass); // Apply CSS highlight to the node
            } else if (!isPdaViz && nodeElement) { // DFA highlighting: simpler scale from group's origin (0,0)
                if (!groupElement.dataset.originalTransform) groupElement.dataset.originalTransform = groupElement.getAttribute('transform') || '';
                // Append scale to the original translate transform
                groupElement.setAttribute('transform', `${groupElement.dataset.originalTransform} scale(1.3)`);
                groupElement.classList.add(transformedGroupClass);
                nodeElement.classList.add(highlightStyleClass); // Apply highlight to circle
                const label = groupElement.querySelector(labelQuery);
                if (label) label.classList.add(highlightStyleClass); // Apply highlight to label
            }
        }
    }
}

/**
 * Animates the sequence of states for a DFA simulation.
 * Highlights each state in the sequence on the SVG visualization.
 * @param {Array<number|string>} sequence - The array of state IDs (or error strings) from the simulation.
 * @param {string} dfaKey - The key of the DFA being animated (not used in this version of the function body but could be useful for context).
 * @async
 */
async function animateDfaSequence(sequence /*, dfaKey */) {
    if (sequenceDisplay) sequenceDisplay.innerHTML = ''; // Clear previous sequence text
    const stepElements = []; // To store span elements for each step

    // Create text representation of the sequence
    sequence.forEach((stateId, index) => {
        const stepSpan = document.createElement('span');
        stepSpan.classList.add('state-step');
        // Display "REJECT_STATE..." for error states, or "q{ID}" for valid states
        stepSpan.textContent = (typeof stateId === 'string' && stateId.startsWith('REJECT_STATE')) ? stateId : `q${stateId}`;
        stepElements.push(stepSpan);
        if (sequenceDisplay) {
            sequenceDisplay.appendChild(stepSpan);
            if (index < sequence.length - 1) sequenceDisplay.appendChild(document.createTextNode(' → ')); // Add arrow
        }
    });

    let lastValidStateForHighlight = null; // Keep track of the last valid state for final highlight
    for (let i = 0; i < stepElements.length; i++) {
        const currentStateElement = stepElements[i];
        const stateValue = sequence[i];

        highlightStateSVG(null, 'dfa-visualization'); // Unhighlight previous state

        if (typeof stateValue === 'string' && stateValue.startsWith('REJECT_STATE')) { // If it's an error/reject marker
            if (currentStateElement) currentStateElement.classList.add('error'); // Style error text
            if (statusMessage) statusMessage.textContent = `DFA Simulation stopped: ${stateValue}`;
            // Re-highlight the last valid state before the error
            if (lastValidStateForHighlight !== null) highlightStateSVG(lastValidStateForHighlight, 'dfa-visualization');
            break; // Stop animation on error
        }

        highlightStateSVG(stateValue, 'dfa-visualization'); // Highlight current valid state on SVG
        lastValidStateForHighlight = stateValue;
        if (currentStateElement) currentStateElement.classList.add('highlight'); // Highlight current step text
        if (statusMessage) statusMessage.textContent = `Processing DFA... Current state: q${stateValue}`;

        await sleep(dfaAnimationDelay); // Pause for animation visibility
        if (currentStateElement) currentStateElement.classList.remove('highlight'); // Unhighlight step text
    }

    // After loop, ensure the final valid state (or last state before error) remains highlighted on SVG
    if (lastValidStateForHighlight !== null && !(typeof lastValidStateForHighlight === 'string' && lastValidStateForHighlight.startsWith('REJECT_STATE'))) {
        highlightStateSVG(lastValidStateForHighlight, 'dfa-visualization');
    }
    // Update status message with final result
    if (statusMessage && resultDisplay) {
        statusMessage.textContent = `DFA Simulation complete. Final state ${lastValidStateForHighlight !== null ? 'q' + lastValidStateForHighlight : 'N/A'} shown. Result: ${resultDisplay.textContent}`;
    }
}

/**
 * Animates a PDA simulation, driven by a DFA's state sequence.
 * This function simulates PDA behavior by:
 * - Highlighting corresponding PDA nodes.
 * - Simulating stack operations (pushing consumed characters).
 * - Updating the PDA stack display and current configuration text.
 * @param {string} pdaKey - The identifier of the PDA.
 * @param {Array<number|string>} dfaStateSequence - The state sequence from the corresponding DFA simulation.
 * @param {boolean} dfaAccepted - Whether the DFA accepted the input.
 * @param {string} inputString - The original input string.
 * @async
 */
async function animatePdaAsDfaFlow(pdaKey, dfaStateSequence, dfaAccepted, inputString) {
    if (statusMessage) statusMessage.textContent = `Animating PDA for input "${inputString}"...`;
    if (sequenceDisplay) sequenceDisplay.innerHTML = ''; // Clear previous sequence text

    let currentPdaStack = initializePdaStack(pdaKey); // Initialize stack with Z₀
    let remainingInput = inputString;
    const pdaLayoutToUse = pdaLayouts[pdaKey];
    if (!pdaLayoutToUse) { showError(`PDA layout for ${pdaKey} not found.`); enableControls(true); return; }

    for (let i = 0; i < dfaStateSequence.length; i++) {
        const currentStateId = dfaStateSequence[i]; // Current DFA state ID
        const pdaStateToHighlight = currentStateId; // Use same ID for corresponding PDA node

        if (typeof pdaStateToHighlight === 'string' && pdaStateToHighlight.startsWith('REJECT_STATE')) {
            if (pdaCurrentConfigDisplay) pdaCurrentConfigDisplay.textContent = `REJECTED: ${pdaStateToHighlight}`;
            const lastValidStateId = i > 0 ? dfaStateSequence[i - 1] : (pdaLayoutToUse.states.find(s => s.type === 'start')?.id);
            highlightStateSVG(lastValidStateId, 'pda-visualization-svg'); // Highlight last valid PDA node
            if (resultDisplay) resultDisplay.textContent = 'Rejected';
            const errorStepSpan = document.createElement('span');
            errorStepSpan.classList.add('state-step', 'error'); errorStepSpan.textContent = pdaStateToHighlight;
            if (sequenceDisplay) sequenceDisplay.appendChild(errorStepSpan);
            enableControls(true); return; // Stop on error
        }

        highlightStateSVG(pdaStateToHighlight, 'pda-visualization-svg'); // Highlight current PDA node

        // Logic for temporarily changing node label to show operation
        const currentPdaNodeGroup = svgPdaVisualization.querySelector(`#pda-group-${pdaStateToHighlight}`);
        const currentPdaNodeLabelElement = currentPdaNodeGroup ? currentPdaNodeGroup.querySelector('.pda-node-label') : null;
        let originalLabelOfCurrentNode = currentPdaNodeGroup ? currentPdaNodeGroup.dataset.originalLabel : `q${pdaStateToHighlight}`;

        // Reset dynamic labels on other nodes
        svgPdaVisualization.querySelectorAll('g[id^="pda-group-"]').forEach(group => {
            if (group.id !== `pda-group-${pdaStateToHighlight}` && group.dataset.dynamicLabel === 'true') {
                const labelEl = group.querySelector('.pda-node-label');
                const originalLabel = group.dataset.originalLabel;
                if (labelEl && originalLabel) setSvgText(labelEl, originalLabel); // Restore original label
                group.dataset.dynamicLabel = 'false';
            }
        });

        let operationCue = "", dynamicNodeLabelText = originalLabelOfCurrentNode;
        // Simulate read and push operation if input character is available
        if (i < inputString.length) {
            const consumedChar = inputString[i];
            operationCue = `Read '${consumedChar}'`;
            currentPdaStack.push(consumedChar); // Push consumed char onto stack (simplified PDA logic)
            updatePdaStackDisplay(currentPdaStack);
            operationCue += `, Push '${consumedChar}'`;
            // Update node label to show Read/Push, unless it's a special START/ACCEPT/REJECT node
            if (currentPdaNodeLabelElement && !['START', 'ACCEPT', 'REJECT'].includes(originalLabelOfCurrentNode)) {
                dynamicNodeLabelText = `${originalLabelOfCurrentNode}\n(R:${consumedChar}, P:${consumedChar})`;
                if (currentPdaNodeGroup) currentPdaNodeGroup.dataset.dynamicLabel = 'true'; // Mark as dynamically labeled
            }
        } else if (i === 0 && dfaStateSequence.length === 1 && inputString === "") { // Empty string on start state
            operationCue = "Initial state, empty input";
        } else if (i >= inputString.length && i > 0) { // No more input, can be considered epsilon transition
            operationCue = "ε transition (simulated)";
        } else { // Initial state with non-empty input, before first char consumed
            operationCue = "Initial state";
        }

        if (currentPdaNodeLabelElement) setSvgText(currentPdaNodeLabelElement, dynamicNodeLabelText); // Update visual label

        remainingInput = inputString.substring(i + 1); // Update remaining input string
        const stackTop = currentPdaStack.length > 0 ? currentPdaStack[currentPdaStack.length - 1] : 'ε';
        const pdaStateLabel = pdaLayoutToUse.states.find(s => s.id === pdaStateToHighlight)?.label || `q${pdaStateToHighlight}`;

        // Update configuration display: (State, RemainingInput, StackTop) - Operation
        if (pdaCurrentConfigDisplay) pdaCurrentConfigDisplay.textContent = `(${pdaStateLabel}, ${remainingInput || 'ε'}, ${stackTop}) - ${operationCue}`;
        if (statusMessage) statusMessage.textContent = `PDA at ${pdaStateLabel}. ${operationCue}. Stack top: ${stackTop}`;

        // Update textual sequence display
        const stepSpan = document.createElement('span');
        stepSpan.classList.add('state-step'); stepSpan.textContent = pdaStateLabel;
        if (sequenceDisplay) {
            sequenceDisplay.appendChild(stepSpan);
            if (i < dfaStateSequence.length - 1 && !(typeof dfaStateSequence[i + 1] === 'string' && dfaStateSequence[i + 1].startsWith('REJECT_STATE'))) {
                sequenceDisplay.appendChild(document.createTextNode(' → '));
            }
            sequenceDisplay.querySelectorAll('.state-step.highlight').forEach(s => s.classList.remove('highlight'));
            stepSpan.classList.add('highlight');
        }

        await sleep(PDA_ANIMATION_DELAY); // Pause for animation

        // Restore original label if it was dynamically changed
        if (currentPdaNodeGroup && currentPdaNodeGroup.dataset.dynamicLabel === 'true') {
            if (currentPdaNodeLabelElement && originalLabelOfCurrentNode) setSvgText(currentPdaNodeLabelElement, originalLabelOfCurrentNode);
            currentPdaNodeGroup.dataset.dynamicLabel = 'false';
        }
    }

    // Post-animation: Highlight final PDA node and set final configuration text
    const finalDfaStateId = dfaStateSequence[dfaStateSequence.length - 1];
    if (finalDfaStateId !== undefined && !(typeof finalDfaStateId === 'string' && finalDfaStateId.startsWith('REJECT_STATE'))) {
        highlightStateSVG(finalDfaStateId, 'pda-visualization-svg');
        // Ensure final node label is restored if it was dynamic
        const finalNodeGroup = svgPdaVisualization.querySelector(`#pda-group-${finalDfaStateId}`);
        if (finalNodeGroup) {
            const finalNodeLabelElement = finalNodeGroup.querySelector('.pda-node-label');
            const originalLabel = finalNodeGroup.dataset.originalLabel;
            if (finalNodeLabelElement && originalLabel) setSvgText(finalNodeLabelElement, originalLabel);
        }
        const stackTopFinal = currentPdaStack.length > 0 ? currentPdaStack[currentPdaStack.length - 1] : 'ε';
        const finalPdaStateLabel = pdaLayoutToUse.states.find(s => s.id === finalDfaStateId)?.label || `q${finalDfaStateId}`;
        if (pdaCurrentConfigDisplay) pdaCurrentConfigDisplay.textContent = `Final: (${finalPdaStateLabel}, ε, ${stackTopFinal}). Result: ${dfaAccepted ? 'Accepted' : 'Rejected'}`;
    } else if (dfaStateSequence.length === 0 && inputString === "") { // Handle empty string on start state for PDA
        const startState = pdaLayoutToUse.states.find(s => s.type === 'start');
        if (startState) {
            highlightStateSVG(startState.id, 'pda-visualization-svg');
            const stackTopFinal = currentPdaStack.length > 0 ? currentPdaStack[currentPdaStack.length - 1] : 'ε';
            if (pdaCurrentConfigDisplay) pdaCurrentConfigDisplay.textContent = `Final: (${startState.label}, ε, ${stackTopFinal}). Result: ${dfaAccepted ? 'Accepted' : 'Rejected'}`;
        }
    }
    if (statusMessage) statusMessage.textContent = `PDA animation complete. Result: ${dfaAccepted ? 'Accepted' : 'Rejected'}.`;
    if (resultDisplay) resultDisplay.textContent = dfaAccepted ? 'Accepted' : 'Rejected';
    enableControls(true);
}

/**
 * Sets the text content of an SVG <text> element, handling multi-line text using <tspan> elements.
 * Each line (separated by '\n' in the content string) becomes a <tspan>.
 * Lines are vertically centered within the text element.
 * @param {SVGTextElement} textElement - The SVG <text> element to modify.
 * @param {string} content - The string content, which may include newline characters.
 */
function setSvgText(textElement, content) {
    if (!textElement) return;
    const x = textElement.getAttribute('x'); // Get original x for all tspans
    textElement.textContent = ''; // Clear existing content (tspans)
    const lines = String(content).split('\n'); // Split content by newline
    const approxLineHeight = 1.1; // Approximate line height in 'em' units for dy offset
    let initialDyOffset = 0; // Initial vertical offset for the first tspan

    // Calculate initial offset to vertically center multi-line text
    // Move the first line up by half the total height of the subsequent lines
    if (lines.length > 1) initialDyOffset = -((lines.length - 1) * approxLineHeight / 2);
    initialDyOffset += 0.35; // Fine-tuning adjustment for better single-line vertical centering (dominant-baseline like)

    lines.forEach((line, index) => {
        const tspan = document.createElementNS(SVG_NS, 'tspan');
        tspan.setAttribute('x', x); // All tspans share the same x attribute from parent text
        // 'dy' attribute specifies relative vertical offset from the previous tspan (or initial for first)
        tspan.setAttribute('dy', index === 0 ? `${initialDyOffset}em` : `${approxLineHeight}em`);
        tspan.textContent = line;
        textElement.appendChild(tspan);
    });
}

/**
 * Traces the derivation of a string using a Context-Free Grammar (CFG).
 * Implements a leftmost derivation strategy. If a targetString is provided,
 * it attempts to heuristically choose production rules that might lead to the target.
 * @param {CFGRepresentation} cfg - The CFG object containing variables, terminals, start symbol, and rules.
 * @param {string|null} [targetString=null] - The string to attempt to derive. If null, shows a general derivation.
 * @param {number} [maxSteps=traceCfgMaxSteps] - Maximum number of derivation steps to perform.
 * @async
 */
async function traceCfgDerivation(cfg, targetString = null, maxSteps = traceCfgMaxSteps) {
    if (!cfgDerivationSequenceDisplay || !cfgCurrentStringDisplay || !cfgStatusMessage || !cfgResultDisplay) return;

    cfgDerivationSequenceDisplay.innerHTML = ''; // Clear previous derivation
    let currentSententialForm = [cfg.startSymbol]; // Start with the grammar's start symbol
    cfgCurrentStringDisplay.innerHTML = formatSententialForm(currentSententialForm); // Display initial form
    cfgStatusMessage.textContent = `Starting derivation with: ${cfg.startSymbol}`;
    let stepCount = 0, derivedSuccessfully = false;

    // Derivation loop
    for (stepCount = 0; stepCount < maxSteps; stepCount++) {
        // Find the index of the leftmost non-terminal symbol in the current form
        const leftmostNonTerminalIndex = currentSententialForm.findIndex(symbol => cfg.variables.includes(symbol));

        // If no non-terminals are left, derivation is complete (or stuck if target not matched)
        if (leftmostNonTerminalIndex === -1) {
            const currentString = currentSententialForm.join('');
            if (targetString && currentString === targetString) { // Successfully derived target
                cfgResultDisplay.textContent = "Result: Successfully derived target string!";
                cfgStatusMessage.textContent = `Derived: "${currentString}"`;
                derivedSuccessfully = true;
            } else if (targetString) { // Halted, but target not matched
                cfgResultDisplay.textContent = "Result: Derivation halted, target not matched.";
                cfgStatusMessage.textContent = `Halted. Derived: "${currentString}" (Target: "${targetString}")`;
            } else { // Halted, no target string was specified
                cfgResultDisplay.textContent = "Result: Derivation halted (no non-terminals).";
                cfgStatusMessage.textContent = `Derived: "${currentString}"`;
            }
            addDerivationStep(currentSententialForm, "Derivation complete.");
            break; // Exit loop
        }

        const nonTerminalToReplace = currentSententialForm[leftmostNonTerminalIndex];
        // Find all rules applicable to the leftmost non-terminal
        const applicableRules = cfg.rules.filter(rule => rule.from === nonTerminalToReplace);

        if (applicableRules.length === 0) { // No rules for the current non-terminal
            cfgResultDisplay.textContent = "Result: Stuck! No rule for non-terminal.";
            cfgStatusMessage.textContent = `Stuck at: ${nonTerminalToReplace}. No applicable rules.`;
            addDerivationStep(currentSententialForm, `No rule for ${nonTerminalToReplace}`);
            break; // Exit loop
        }

        // --- Rule Selection Heuristic ---
        let chosenRule = null;
        if (targetString) { // If deriving a specific target string, try to choose rules intelligently
            const prefixOfCurrentForm = currentSententialForm.slice(0, leftmostNonTerminalIndex).join('');
            // The part of the target string we still need to match after the current prefix
            const remainingTarget = targetString.substring(prefixOfCurrentForm.length);
            let bestRule = null;
            let canMatchExactlyAndTerminate = false; // Flag if a rule perfectly matches rest of target and ends derivation

            for (const rule of applicableRules) {
                // Terminals produced directly by this rule
                const ruleProducesTerminals = rule.to.filter(s => cfg.terminals.includes(s) && s !== 'ε').join('');
                // Non-terminals produced by this rule
                const ruleProducesNonTerminals = rule.to.filter(s => cfg.variables.includes(s));

                // If the terminals produced by the rule match the start of the remaining target
                if (remainingTarget.startsWith(ruleProducesTerminals)) {
                    const afterRuleTarget = remainingTarget.substring(ruleProducesTerminals.length);
                    // If rule matches perfectly and remaining non-terminals can all derive epsilon
                    if (afterRuleTarget.length === 0 && ruleProducesNonTerminals.every(nt => canDeriveEpsilon(cfg, nt, new Set()))) {
                        bestRule = rule;
                        canMatchExactlyAndTerminate = true;
                        break; // Found a perfect rule
                    }
                    // Prefer rules that don't reintroduce the same non-terminal (avoid immediate left-recursion loops if possible)
                    // and match more terminals, or are shorter. This is a basic heuristic.
                    if (!rule.to.includes(nonTerminalToReplace) && (!bestRule || bestRule.to.includes(nonTerminalToReplace))) {
                        if (!bestRule || ruleProducesTerminals.length > bestRule.to.filter(s => cfg.terminals.includes(s) && s !== 'ε').join('').length) {
                            bestRule = rule;
                        }
                    }
                    // Fallback: if a recursive rule matches some terminals, consider it.
                    if (rule.to.includes(nonTerminalToReplace) && !bestRule && ruleProducesTerminals.length > 0) {
                        bestRule = rule;
                    }
                }
            }

            if (canMatchExactlyAndTerminate) {
                chosenRule = bestRule;
            } else {
                // If remaining target is empty, prefer an epsilon rule if available for the non-terminal
                if (remainingTarget.length === 0) {
                    const epsilonRule = applicableRules.find(r => r.to.length === 1 && r.to[0] === 'ε');
                    if (epsilonRule) chosenRule = epsilonRule;
                }
                if (!chosenRule && bestRule) chosenRule = bestRule; // Use the best heuristic match
                // Fallback rule selection if no clear "best" rule
                if (!chosenRule) {
                    chosenRule = applicableRules.find(r => !r.to.includes(nonTerminalToReplace) && !r.to.includes('ε')) || // Non-recursive, non-epsilon
                        applicableRules.find(r => !r.to.includes('ε')) || // Any non-epsilon
                        applicableRules.find(r => r.to.includes('ε') && r.to.length === 1) || // Epsilon rule
                        applicableRules[0]; // Absolute fallback: first applicable rule
                }
            }
        } else { // If no target string, choose simpler rules (non-epsilon first)
            chosenRule = applicableRules.find(r => !r.to.includes('ε')) || applicableRules[0];
        }
        if (!chosenRule && applicableRules.length > 0) chosenRule = applicableRules[0]; // Final fallback

        // Apply the chosen rule
        const ruleDisplay = `${chosenRule.from} → ${chosenRule.to.join(' ') || 'ε'}`;
        addDerivationStep(currentSententialForm, `Applying: ${ruleDisplay}`); // Log step

        // Construct the new sentential form
        const before = currentSententialForm.slice(0, leftmostNonTerminalIndex);
        const after = currentSententialForm.slice(leftmostNonTerminalIndex + 1);
        const replacement = (chosenRule.to.length === 1 && chosenRule.to[0] === 'ε') ? [] : chosenRule.to; // Handle epsilon
        currentSententialForm = [...before, ...replacement, ...after];

        // Update UI
        cfgCurrentStringDisplay.innerHTML = formatSententialForm(currentSententialForm, leftmostNonTerminalIndex, replacement.length);
        cfgStatusMessage.textContent = `Applied: ${ruleDisplay}. Current: ${currentSententialForm.join(' ')}`;

        // Check if target string is fully derived (all terminals)
        if (targetString && currentSententialForm.join('') === targetString && !currentSententialForm.some(s => cfg.variables.includes(s))) {
            cfgResultDisplay.textContent = "Result: Successfully derived target string!";
            cfgStatusMessage.textContent = `Derived: "${targetString}"`;
            addDerivationStep(currentSententialForm, "Target derived!");
            derivedSuccessfully = true;
            break;
        }
        await sleep(CFG_ANIMATION_DELAY); // Pause for animation
    }

    // After loop, check for max steps reached or other conditions
    if (stepCount >= maxSteps && !derivedSuccessfully) {
        cfgResultDisplay.textContent = "Result: Max steps reached.";
        cfgStatusMessage.textContent = `Max steps (${maxSteps}) reached. Current: ${currentSententialForm.join(' ')}`;
        addDerivationStep(currentSententialForm, "Max steps.");
    }
    // If no target and derivation finished before max steps
    if (!derivedSuccessfully && !targetString && stepCount < maxSteps && currentSententialForm.findIndex(symbol => cfg.variables.includes(symbol)) === -1) {
        cfgResultDisplay.textContent = "Result: Derivation shown.";
    }
}

/**
 * Adds a step to the CFG derivation sequence display.
 * @param {string[]} sententialFormArray - The current sentential form as an array of symbols.
 * @param {string} ruleAppliedText - Text describing the rule applied in this step.
 */
function addDerivationStep(sententialFormArray, ruleAppliedText) {
    if (!cfgDerivationSequenceDisplay) return;
    const stepDiv = document.createElement('div');
    stepDiv.classList.add('derivation-step');

    const formSpan = document.createElement('span');
    formSpan.innerHTML = formatSententialForm(sententialFormArray); // Formatted sentential form

    const ruleSpan = document.createElement('span');
    ruleSpan.classList.add('rule-applied');
    ruleSpan.textContent = `(${ruleAppliedText})`; // Rule description

    stepDiv.appendChild(formSpan);
    stepDiv.appendChild(document.createTextNode(' ⇒ ')); // Derivation arrow
    stepDiv.appendChild(ruleSpan);

    cfgDerivationSequenceDisplay.appendChild(stepDiv);
    // Scroll to bottom to show the latest step
    cfgDerivationSequenceDisplay.scrollTop = cfgDerivationSequenceDisplay.scrollHeight;
}

/**
 * Formats a sentential form (array of symbols) as an HTML string with styling
 * for terminals, non-terminals, and highlighted symbols.
 * @param {string[]} formArray - The array of symbols representing the sentential form.
 * @param {number} [highlightStartIndex=-1] - The start index of symbols to highlight.
 * @param {number} [highlightLength=0] - The number of symbols to highlight from the start index.
 * @returns {string} An HTML string representing the formatted sentential form.
 */
function formatSententialForm(formArray, highlightStartIndex = -1, highlightLength = 0) {
    const currentCfg = cfgRepresentations[dfaSelect.value]; // Get current CFG for symbol types
    if (!currentCfg) return formArray.join(' '); // Fallback if CFG not found

    return formArray.map((symbol, index) => {
        let classes = [];
        if (currentCfg.variables.includes(symbol)) {
            classes.push('non-terminal');
        } else if (currentCfg.terminals.includes(symbol) && symbol !== 'ε') {
            classes.push('terminal');
        } else if (symbol === 'ε') {
            classes.push('epsilon-terminal'); // Special class for epsilon
        }
        // Add highlight class if within the specified range
        if (highlightStartIndex !== -1 && index >= highlightStartIndex && index < highlightStartIndex + highlightLength) {
            classes.push('highlight');
        }
        return `<span class="${classes.join(' ')}">${symbol}</span>`;
    }).join(' '); // Join styled symbols with spaces
}

/**
 * Checks if a given non-terminal variable in a CFG can derive the empty string (epsilon).
 * Uses a recursive approach with a visited set to prevent infinite loops in cyclic grammars.
 * @param {CFGRepresentation} cfg - The CFG object.
 * @param {string} variable - The non-terminal variable to check.
 * @param {Set<string>} [visited=new Set()] - A set to keep track of visited variables in the current recursion path.
 * @returns {boolean} True if the variable can derive epsilon, false otherwise.
 */
function canDeriveEpsilon(cfg, variable, visited = new Set()) {
    if (visited.has(variable)) return false; // Cycle detected, cannot derive epsilon through this path
    visited.add(variable);

    const rulesForVar = cfg.rules.filter(r => r.from === variable); // Get rules for the current variable
    for (const rule of rulesForVar) {
        // If rule directly produces epsilon (e.g., A -> ε)
        if (rule.to.length === 1 && rule.to[0] === 'ε') return true;
        // If all symbols on the right-hand side of the rule can derive epsilon
        // (and are non-terminals, terminals cannot derive epsilon unless they are epsilon)
        if (rule.to.every(symbol =>
            cfg.variables.includes(symbol) ? canDeriveEpsilon(cfg, symbol, new Set(visited)) : false
        )) {
            return true;
        }
    }
    return false; // No rule found that allows derivation of epsilon
}

// --- Mouse Follower Circle Effect ---
// This effect creates a trail of circles that follow the mouse cursor.
const circles = document.querySelectorAll(".circle"); // Get all elements with class 'circle'
const coords = { x: 0, y: 0 }; // Object to store current mouse coordinates
const numCircles = circles.length;

// Initialize each circle's properties (position, color, size)
circles.forEach(function (circle, index) {
    circle.x = 0; // Custom property to store target x
    circle.y = 0; // Custom property to store target y
    // Calculate intensity for color transparency and size, making trailing circles smaller/fainter
    const intensity = (numCircles - index) / numCircles;
    circle.style.backgroundColor = `rgba(174, 143, 247, ${0.1 + intensity * 0.3})`; // Fading purple
    circle.style.width = `${8 + index * 1.5}px`; // Increasingly larger circles towards the cursor
    circle.style.height = `${8 + index * 1.5}px`;
});

// Update mouse coordinates when the mouse moves
window.addEventListener("mousemove", function (e) {
    coords.x = e.clientX;
    coords.y = e.clientY;
});

let animationFrameId = null; // To store the ID of the animation frame request

/**
 * Animates the trailing circles to follow the mouse.
 * Each circle smoothly interpolates towards the position of the next circle in the trail,
 * with the first circle interpolating towards the actual mouse cursor.
 */
function animateCircles() {
    let x = coords.x; // Start with current mouse x
    let y = coords.y; // Start with current mouse y

    circles.forEach(function (circle, index) {
        const circleSize = parseFloat(circle.style.width);
        // Position the circle, centering it on its target (x,y)
        circle.style.left = x - circleSize / 2 + "px";
        circle.style.top = y - circleSize / 2 + "px";

        // The target for the *next* iteration of (x,y) is the current position of the *next* circle in the array.
        // This creates the "lagging" or "trailing" effect.
        const nextCircle = circles[index + 1] || circles[0]; // Loop back to the first circle for the last one

        // Interpolation: move current (x,y) part of the way towards nextCircle's stored target position.
        // factor 0.2 means it moves 20% of the distance in each frame, creating a smooth follow.
        x += (nextCircle.x - x) * 0.2;
        y += (nextCircle.y - y) * 0.2;

        // Store the new target position for this circle (which the *previous* circle will aim for)
        circle.x = x;
        circle.y = y;
    });

    animationFrameId = requestAnimationFrame(animateCircles); // Request the next frame
}

// Pause/resume animation when tab visibility changes to save resources
document.addEventListener("visibilitychange", () => {
    if (document.hidden) { // If tab is hidden, cancel animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    } else { // If tab becomes visible, restart animation if not already running
        if (!animationFrameId) animateCircles();
    }
});

// Initial call to start the animation if the page is not hidden
if (!document.hidden) animateCircles();

// Initialize the application state on load
mainHandleReset();