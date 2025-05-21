const dfaSelect = document.getElementById('dfa-select');
const inputString = document.getElementById('input-string');
const simulateButton = document.getElementById('simulate-button');
const resetButton = document.getElementById('reset-button');
const loadingIndicator = document.getElementById('loading-indicator');
const statusMessage = document.getElementById('status-message');
const resultDisplay = document.getElementById('result-display');
const sequenceDisplay = document.getElementById('state-sequence-display');
const errorMessage = document.getElementById('error-message');

const dfaVisualizationContent = document.getElementById('dfa-visualization-content');
const cfgVisualizationContent = document.getElementById('cfg-visualization-content');
const pdaVisualizationContent = document.getElementById('pda-visualization-content');

const svgDfaVisualization = document.getElementById('dfa-visualization');
const cfgRulesDisplay = document.getElementById('cfg-rules-display');
const pdaDefinitionDisplay = document.getElementById('pda-definition-display');

const svgPdaVisualization = document.getElementById('pda-visualization-svg');
const pdaStackDisplay = document.getElementById('stack-display');
const pdaCurrentConfigDisplay = document.getElementById('pda-current-config-display');

const cfgDerivationSequenceDisplay = document.getElementById('cfg-derivation-sequence');
const cfgCurrentStringDisplay = document.getElementById('cfg-current-string');
const cfgStatusMessage = document.getElementById('cfg-status-message');
const cfgResultDisplay = document.getElementById('cfg-result-display');
const viewModeRadios = document.querySelectorAll('input[name="view-mode"]');

// const BACKEND_URL = 'https://mediseen.site';
const BACKEND_URL = 'http://127.0.0.1:8000';
const SVG_NS = "http://www.w3.org/2000/svg";

const dfaAnimationDelay = 350;
const CFG_ANIMATION_DELAY = 250;
const PDA_ANIMATION_DELAY = 700;
const traceCfgMaxSteps = 150;
const STATE_RADIUS = 15;
const PDA_NODE_WIDTH = 60;
const PDA_NODE_HEIGHT = 30;
const PDA_DIAMOND_OFFSET = 25;
const PDA_INITIAL_STACK_SYMBOL = 'Z₀';
let currentPdaSimState = null;
let currentPdaStack = [];
let currentPdaInput = [];
let currentPdaPath = [];


// resize factors for eazy layout :)

const bets_dfa_cx = 1.15
const bets_dfa_cy =  1.125

const stars_dfa_cx = 1.35
const stars_dfa_cy = 1.1

const dfaLayouts = {
    bets_dfa: {
        states: [
            { id: 0, cx: 50 * bets_dfa_cx, cy: 200 * bets_dfa_cy, isStart: true }, { id: 1, cx: 150 * bets_dfa_cx, cy: 100 * bets_dfa_cy },
            { id: 2, cx: 150 * bets_dfa_cx, cy: 300 * bets_dfa_cy }, { id: 3, cx: 250 * bets_dfa_cx, cy: 100 * bets_dfa_cy },
            { id: 4, cx: 250 * bets_dfa_cx, cy: 300 * bets_dfa_cy }, { id: 5, cx: 350 * bets_dfa_cx, cy: 50 * bets_dfa_cy },
            { id: 6, cx: 350 * bets_dfa_cx, cy: 150 * bets_dfa_cy }, { id: 7, cx: 350 * bets_dfa_cx, cy: 350 * bets_dfa_cy, isTrap: true },
            { id: 8, cx: 450 * bets_dfa_cx, cy: 50 * bets_dfa_cy, isTrap: true },  { id: 9, cx: 450 * bets_dfa_cx, cy: 150 * bets_dfa_cy },
            { id: 10, cx: 450 * bets_dfa_cx, cy: 250 * bets_dfa_cy }, { id: 11, cx: 550 * bets_dfa_cx, cy: 200 * bets_dfa_cy },
            { id: 12, cx: 550 * bets_dfa_cx, cy: 300 * bets_dfa_cy, isFinal: true },
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
             { id: 0, cx: 50 * stars_dfa_cx,  cy: 50 * stars_dfa_cy, isStart: true }, 
             { id: 1, cx: 150 * stars_dfa_cx, cy: 50 * stars_dfa_cy }, 
             { id: 2, cx: 250 * stars_dfa_cx, cy: 50 * stars_dfa_cy }, 
             { id: 3, cx: 350 * stars_dfa_cx, cy: 50 * stars_dfa_cy }, 
             { id: 10, cx: 450 * stars_dfa_cx, cy: 50 * stars_dfa_cy, isFinal: true },
             { id: 5, cx: 100 * stars_dfa_cx, cy: 125 * stars_dfa_cy }, 
             { id: 6, cx: 200 * stars_dfa_cx, cy: 125 * stars_dfa_cy }, 
             { id: 7, cx: 300 * stars_dfa_cx, cy: 125 * stars_dfa_cy },
             { id: 8, cx: 400 * stars_dfa_cx, cy: 125 * stars_dfa_cy },
             { id: 11, cx: 500 * stars_dfa_cx, cy: 125 * stars_dfa_cy, isFinal: true },
             { id: 9,  cx: 50 * stars_dfa_cx,  cy: 200 * stars_dfa_cy }, 
             { id: 12, cx: 150 * stars_dfa_cx, cy: 200 * stars_dfa_cy }, 
             { id: 13, cx: 250 * stars_dfa_cx, cy: 200 * stars_dfa_cy }, 
             { id: 14, cx: 350 * stars_dfa_cx, cy: 200 * stars_dfa_cy },
             { id: 18, cx: 450 * stars_dfa_cx, cy: 200 * stars_dfa_cy, isFinal: true }, 
             { id: 15, cx: 100 * stars_dfa_cx, cy: 275 * stars_dfa_cy }, 
             { id: 16, cx: 200 * stars_dfa_cx, cy: 275 * stars_dfa_cy }, 
             { id: 17, cx: 300 * stars_dfa_cx, cy: 275 * stars_dfa_cy }, 
             { id: 19, cx: 400 * stars_dfa_cx, cy: 275 * stars_dfa_cy }, 
             { id: 21, cx: 500 * stars_dfa_cx, cy: 275 * stars_dfa_cy, isFinal: true }, 
             { id: 20, cx: 50 * stars_dfa_cx,  cy: 350 * stars_dfa_cy }, 
             { id: 4,  cx: 150 * stars_dfa_cx, cy: 350 * stars_dfa_cy, isTrap: true }, 
             { id: 22, cx: 250 * stars_dfa_cx, cy: 350 * stars_dfa_cy, isFinal: true },
             { id: 23, cx: 350 * stars_dfa_cx, cy: 350 * stars_dfa_cy, isFinal: true },
        ],
        transitions: [
            { from: 0, to: 1, label: '0' }, { from: 0, to: 2, label: '1' },
            { from: 1, to: 5, label: '0' }, { from: 1, to: 3, label: '1' },
            { from: 2, to: 5, label: '0,1' }, { from: 3, to: 6, label: '0' },
            { from: 3, to: 4, label: '1' },   { from: 4, to: 4, label: '0,1' },
            { from: 5, to: 4, label: '0' }, { from: 5, to: 6, label: '1' },
            { from: 6, to: 7, label: '0,1' }, { from: 7, to: 9, label: '0' },
            { from: 7, to: 8, label: '1' },   { from: 8, to: 9, label: '0' },
            { from: 8, to: 12, label: '1' },  { from: 9, to: 13, label: '0' },
            { from: 9, to: 8, label: '1' },   { from: 10, to: 10, label: '0' },
            { from: 10, to: 11, label: '1' }, { from: 11, to: 22, label: '0' },
            { from: 11, to: 12, label: '1' }, { from: 12, to: 9, label: '0' },
            { from: 12, to: 17, label: '1' }, { from: 13, to: 15, label: '0' },
            { from: 13, to: 8, label: '1' },  { from: 14, to: 10, label: '0' },
            { from: 14, to: 11, label: '1' }, { from: 15, to: 14, label: '0' },
            { from: 15, to: 16, label: '1' }, { from: 16, to: 22, label: '0' },
            { from: 16, to: 12, label: '1' }, { from: 17, to: 20, label: '0' },
            { from: 17, to: 19, label: '1' }, { from: 18, to: 15, label: '0' },
            { from: 18, to: 8, label: '1' },  { from: 19, to: 23, label: '0' }, {from: 19, to: 19, label: '1'},
            { from: 20, to: 18, label: '0' },
            { from: 20, to: 21, label: '1' }, { from: 21, to: 9, label: '0' },
            { from: 21, to: 12, label: '1' }, { from: 22, to: 13, label: '0' },
            { from: 22, to: 8, label: '1' }, { from: 23, to: 18, label: '0'}, {from: 23, to: 21, label: '1'}
        ]
    }
};

const cfgRepresentations = {
    bets_dfa: {
        description: "(aa + bb + aba + ba) (aba + bab + bbb) (a + b)* (a + b + aa + abab) (aa + bb)*",
        variables: dfaLayouts.bets_dfa.states.map(s => `Q${s.id}`),
        terminals: ['a', 'b', 'ε'],
        startSymbol: 'Q0',
        rules: [
            { from: 'Q0', to: ['b', 'Q1'] }, { from: 'Q0', to: ['a', 'Q2'] },
            { from: 'Q1', to: ['a', 'Q3'] }, { from: 'Q1', to: ['b', 'Q3'] },
            { from: 'Q2', to: ['a', 'Q3'] }, { from: 'Q2', to: ['b', 'Q4'] },
            { from: 'Q3', to: ['a', 'Q5'] }, { from: 'Q3', to: ['b', 'Q6'] },
            { from: 'Q4', to: ['a', 'Q3'] }, { from: 'Q4', to: ['b', 'Q7'] },
            { from: 'Q5', to: ['a', 'Q8'] }, { from: 'Q5', to: ['b', 'Q9'] },
            { from: 'Q6', to: ['a', 'Q10'] }, { from: 'Q6', to: ['b', 'Q10'] },
            { from: 'Q7', to: ['a', 'Q7'] }, { from: 'Q7', to: ['b', 'Q7'] },
            { from: 'Q8', to: ['a', 'Q8'] }, { from: 'Q8', to: ['b', 'Q8'] },
            { from: 'Q9', to: ['a', 'Q11'] }, { from: 'Q9', to: ['b', 'Q8'] },
            { from: 'Q10', to: ['a', 'Q7'] }, { from: 'Q10', to: ['b', 'Q11'] },
            { from: 'Q11', to: ['a', 'Q12'] }, { from: 'Q11', to: ['b', 'Q12'] },
            { from: 'Q12', to: ['a', 'Q12'] }, { from: 'Q12', to: ['b', 'Q12'] },
            { from: 'Q12', to: ['ε'] }
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
            { from: 'Q3', to: ['0', 'Q6'] }, { from: 'Q3', to: ['1', 'Q4'] },
            { from: 'Q4', to: ['0', 'Q4'] }, { from: 'Q4', to: ['1', 'Q4'] },
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
            { from: 'Q10', to: ['ε'] },
            { from: 'Q11', to: ['ε'] },
            { from: 'Q18', to: ['ε'] },
            { from: 'Q21', to: ['ε'] },
            { from: 'Q22', to: ['ε'] },
            { from: 'Q23', to: ['ε'] }
        ]
    }
};

const pdaLayouts = {
    my_pda: {
        states: [
            { id: 'start', type: 'start', cx: 50, cy: 200, label: 'START' },
            { id: 'read1', type: 'read', cx: 150, cy: 200, label: 'READ A' },
            { id: 'pushX', type: 'push', cx: 250, cy: 200, label: 'PUSH X' },
            { id: 'popA',  type: 'pop',  cx: 350, cy: 200, label: 'POP A' },
            { id: 'accept',type: 'accept',cx: 450, cy: 200, label: 'ACCEPT' },
            { id: 'reject',type: 'reject',cx: 450, cy: 300, label: 'REJECT' }
        ],
        transitions: [ ] 
    }
};

simulateButton.addEventListener('click', handleSimulate);
resetButton.addEventListener('click', mainHandleReset);
inputString.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSimulate();
    }
});

dfaSelect.addEventListener('change', () => {
    updateActiveVisualization();
    resultDisplay.textContent = '';
    sequenceDisplay.innerHTML = '';
    statusMessage.textContent = 'Select an automaton and view mode. For DFA, enter a string and simulate.';
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
    highlightStateSVG(null);
});

viewModeRadios.forEach(radio => {
    radio.addEventListener('change', updateActiveVisualization);
});

/**
 * Resets the main application state to its initial view.
 * Clears input fields, status messages, results, sequence displays,
 * error messages, and loading indicators. It also re-enables controls
 * and updates the active visualization.
 */

function mainHandleReset() {
    inputString.value = '';
    statusMessage.textContent = 'Select an automaton and view mode. For DFA, enter a string and simulate.';
    resultDisplay.textContent = '';
    sequenceDisplay.innerHTML = '';
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    loadingIndicator.classList.add('hidden');
    clearHighlightsText();
    highlightStateSVG(null);
    enableControls(true);
    console.log('Form reset.');
    updateActiveVisualization();
}

/**
 * Handles the simulation process based on the selected automaton type (DFA, PDA, CFG)
 * and the current view mode. It fetches data from the backend for DFA simulation,
 * animates PDA based on DFA results, or traces CFG derivations.
 *
 * @async
 */
async function handleSimulate() {
    const selectedDfa = dfaSelect.value;
    const selectedAutomatonType = dfaSelect.value;
    const currentViewMode = document.querySelector('input[name="view-mode"]:checked').value;
    const rawInput = inputString.value;
    const processingInput = rawInput.trim();
    const input = rawInput.trim();

    console.log(`Simulating DFA: ${selectedDfa}, Input: "${input}"`);

    sequenceDisplay.innerHTML = '';
    resultDisplay.textContent = '-';
    statusMessage.textContent = `Simulating DFA with '${input}'...`;
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    enableControls(false);
    highlightStateSVG(null);

    if (input === '') {
        statusMessage.textContent = 'Input string cannot be empty for DFA simulation.';
        loadingIndicator.classList.add('hidden');
        enableControls(true);
        return;
    }
    if (currentViewMode === 'dfa') {
        try {
            const response = await fetch(`${BACKEND_URL}/simulate-dfa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dfa_type: selectedDfa, dfa_input: input }),
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error("Failed to parse JSON response:", jsonError);
                const textResponse = await response.text();
                throw new Error(`Received non-JSON response from server (status: ${response.status}). Raw: ${textResponse}`);
            }
            loadingIndicator.classList.add('hidden');

            if (!response.ok) {
                const errorMsg = data?.error || `HTTP error ${response.status}`;
                throw new Error(errorMsg);
            }

            const isAccepted = typeof data.accepted === 'boolean' ? data.accepted : false;
            const finalState = data.final_state !== undefined ? data.final_state : 'N/A';
            const backendError = data.error || null;
            const stateSequence = Array.isArray(data.state_sequence) ? data.state_sequence : [];

            resultDisplay.textContent = isAccepted ? 'Accepted' : 'Rejected';

            if (backendError) {
                statusMessage.textContent = `DFA Simulation finished with error. Final state: ${finalState}.`;
                showError(backendError);
            } else {
                statusMessage.textContent = `DFA Simulation finished. Final state: ${finalState}.`;
            }

            if (stateSequence.length > 0) {
                await animateDfaSequence(stateSequence);
            } else {
                sequenceDisplay.textContent = "No valid state sequence received for DFA.";
                statusMessage.textContent = `DFA Simulation complete. No sequence to display. Result: ${resultDisplay.textContent}`;
                highlightStateSVG(null);
            }

        } catch (error) {
            console.error('DFA Simulation Error:', error);
            statusMessage.textContent = 'An error occurred during DFA simulation.';
            showError(`${error.message}. Check console and backend logs.`);
            loadingIndicator.classList.add('hidden');
            resultDisplay.textContent = 'Error';
            highlightStateSVG(null);
        } finally {
            enableControls(true);
        }
    } else if (currentViewMode === 'pda') {
        statusMessage.textContent = `Simulating PDA based on DFA for '${input}'...`;
        highlightStateSVG(null, 'pda-visualization-svg');
        pdaCurrentConfigDisplay.textContent = 'Fetching DFA results to drive PDA...';


        if (input === '') {
            statusMessage.textContent = 'Input string cannot be empty for PDA simulation.';
            pdaCurrentConfigDisplay.textContent = 'Input required.';
            loadingIndicator.classList.add('hidden');
            enableControls(true);
            return;
        }

        try {
            const dfaResponse = await fetch(`${BACKEND_URL}/simulate-dfa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dfa_type: selectedDfa, dfa_input: input }),
            });

            let dfaData;
            try {
                dfaData = await dfaResponse.json();
            } catch (jsonError) {
                const textResponse = await dfaResponse.text();
                throw new Error(`Received non-JSON response from server for DFA data (status: ${dfaResponse.status}). Raw: ${textResponse}`);
            }

            if (!dfaResponse.ok) {
                const errorMsg = dfaData?.error || `DFA simulation HTTP error ${dfaResponse.status}`;
                throw new Error(errorMsg);
            }

            loadingIndicator.classList.add('hidden');

            if (dfaData.error) {
                showError(`DFA simulation error for PDA: ${dfaData.error}`);
                statusMessage.textContent = `PDA animation cannot proceed due to DFA error.`;
                resultDisplay.textContent = 'Error (from DFA)';
                pdaCurrentConfigDisplay.textContent = `Error: ${dfaData.error}`;
                enableControls(true);
            } else if (!dfaData.state_sequence || dfaData.state_sequence.length === 0) {
                showError(`DFA simulation returned no state sequence.`);
                statusMessage.textContent = `PDA animation cannot proceed.`;
                resultDisplay.textContent = dfaData.accepted ? 'Accepted (No Steps)' : 'Rejected (No Steps)';
                 pdaCurrentConfigDisplay.textContent = `Configuration: No steps from DFA. Result: ${resultDisplay.textContent}`;
                enableControls(true);
            }
            else {
                statusMessage.textContent = `DFA results received. Animating PDA...`;
                await animatePdaAsDfaFlow(selectedDfa, dfaData.state_sequence, dfaData.accepted, input);
            }

        } catch (error) {
            console.error('Error during PDA (DFA-driven) simulation:', error);
            statusMessage.textContent = 'An error occurred during PDA simulation.';
            showError(String(error.message));
            resultDisplay.textContent = 'Error';
            pdaCurrentConfigDisplay.textContent = `Error: ${error.message}`;
            loadingIndicator.classList.add('hidden');
            enableControls(true);
        }

    } else if (currentViewMode === 'cfg') {
        loadingIndicator.classList.remove('hidden');
        enableControls(false);
        statusMessage.textContent = `Preparing CFG derivation for L(${selectedDfa})...`;
        cfgStatusMessage.textContent = `Preparing CFG derivation...`;
        cfgResultDisplay.textContent = "Result: -";

        const cfgData = cfgRepresentations[selectedDfa];
        if (!cfgData) {
            showError(`CFG data for ${selectedDfa} not found.`);
            loadingIndicator.classList.add('hidden');
            enableControls(true);
            return;
        }

        let targetString = "";
        if (selectedDfa === 'bets_dfa') {
            targetString = "ab";
        } else if (selectedDfa === 'stars_dfa') {
            targetString = "01";
        } else {
            targetString = "a";
        }

        if (input.trim() !== "") {
            targetString = input.trim();
            cfgStatusMessage.textContent = `Attempting to derive "${targetString}"... (This is a simplified demo)`;
        } else {
            cfgStatusMessage.textContent = `Showing a few derivation steps...`;
            targetString = null;
        }

        await traceCfgDerivation(cfgData, targetString);

        loadingIndicator.classList.add('hidden');
        enableControls(true);
    }
}

/**
 * Enables or disables user interface controls.
 *
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
 *
 * @param {string} message - The error message to display.
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Clears any text highlighting within the sequence display area.
 */
function clearHighlightsText() {
    const highlightedText = sequenceDisplay.querySelector('.highlight');
    if (highlightedText) {
        highlightedText.classList.remove('highlight');
    }
}

/**
 * Pauses execution for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Updates the active visualization display based on the selected automaton
 * and view mode. It hides inactive visualization containers and shows the
 * relevant one, drawing or displaying its content.
 */
function updateActiveVisualization() {
    const selectedAutomaton = dfaSelect.value;
    const selectedViewMode = document.querySelector('input[name="view-mode"]:checked').value;

    console.log(`Updating view: Automaton Language Ref=${selectedAutomaton}, Mode=${selectedViewMode}`);

    dfaVisualizationContent.classList.add('hidden');
    cfgVisualizationContent.classList.add('hidden');
    pdaVisualizationContent.classList.add('hidden');

    pdaStackDisplay.innerHTML = '';
    pdaCurrentConfigDisplay.textContent = 'Current Configuration: (State, Remaining Input, Stack Top)';
    svgPdaVisualization.innerHTML = '';

    if (selectedViewMode === 'dfa') {
        dfaVisualizationContent.classList.remove('hidden');
        drawDFAVisualization(selectedAutomaton);
    } else if (selectedViewMode === 'cfg') {
        cfgVisualizationContent.classList.remove('hidden');
        displayCFG(selectedAutomaton);
        cfgDerivationSequenceDisplay.innerHTML = 'Derivation will appear here.';
        cfgCurrentStringDisplay.innerHTML = 'S';
        cfgStatusMessage.textContent = 'CFG view. Simulation traces a derivation.';
        cfgResultDisplay.textContent = 'Result: -';
    } else if (selectedViewMode === 'pda') {
        pdaVisualizationContent.classList.remove('hidden');
        drawPDAVisualization(selectedAutomaton);
        initializePdaStack();
    }
}

/**
 * Displays the definition of a Context-Free Grammar (CFG) in the
 * CFG rules display area.
 *
 * @param {string} dfaIdentifier - The identifier for the DFA whose
 * language the CFG represents.
 */
function displayCFG(dfaIdentifier) {
    const data = cfgRepresentations[dfaIdentifier];
    cfgRulesDisplay.innerHTML = '';
    if (data) {
        let html = `<strong>Description:</strong> ${data.description}<br><br>`;
        html += `<strong>Variables (V):</strong> { ${data.variables.join(', ')} }<br>`;
        html += `<strong>Terminals (T):</strong> { ${data.terminals.join(', ')} }<br>`;
        html += `<strong>Start Symbol (S):</strong> ${data.startSymbol}<br><br>`;
        html += '<strong>Production Rules (P):</strong><br>';
        data.rules.forEach(rule => {
            html += `${rule.from} &rarr; ${rule.to.join(' ') || 'ε'}<br>`;
        });
        cfgRulesDisplay.innerHTML = html;
    } else {
        cfgRulesDisplay.textContent = `CFG definition for L(${dfaIdentifier}) not found.`;
    }
}

/**
 * Placeholder function for displaying PDA information. Currently does nothing.
 *
 * @param {string} dfaIdentifier - The identifier for the related DFA.
 */
function displayPDA(dfaIdentifier) {
    // This function is currently a placeholder.
}

/**
 * Draws the DFA visualization in the SVG container.
 * States are circles, transitions are paths. States and their labels are grouped.
 *
 * @param {string} dfaType - The type of DFA to draw (e.g., 'bets_dfa', 'stars_dfa').
 */
function drawDFAVisualization(dfaType) {
    const layout = dfaLayouts[dfaType];
    if (!layout) {
        console.error("Invalid DFA type for layout:", dfaType);
        svgDfaVisualization.innerHTML = `<text x="10" y="20" fill="red">Error: DFA layout for ${dfaType} not found.</text>`;
        return;
    }

    svgDfaVisualization.innerHTML = ''; // Clear previous drawing

    // Define arrowhead marker
    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('viewBox', '0 -5 10 10');
    marker.setAttribute('refX', 8); // Adjusted for circle radius offset
    marker.setAttribute('refY', 0);
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerWidth', 4);
    marker.setAttribute('markerHeight', 4);
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', '0,-5 10,0 0,5');
    poly.setAttribute('fill', '#5f7e97'); // Consistent with path stroke
    marker.appendChild(poly);
    defs.appendChild(marker);
    svgDfaVisualization.appendChild(defs);

    // Create a map of state coordinates for easy lookup
    const stateCoords = {};
    layout.states.forEach(s => { stateCoords[s.id] = { cx: s.cx, cy: s.cy }; });

    // Draw transitions first (so they are layered below states)
    layout.transitions.forEach(t => {
        const fromStatePos = stateCoords[t.from];
        const toStatePos = stateCoords[t.to];
        if (!fromStatePos || !toStatePos) {
            console.warn(`Coordinates missing for transition from ${t.from} to ${t.to}`);
            return;
        }

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'transition-path');
        path.setAttribute('marker-end', 'url(#arrowhead)');

        let pathD, labelX, labelY;
        const angle = Math.atan2(toStatePos.cy - fromStatePos.cy, toStatePos.cx - fromStatePos.cx);

        if (t.from === t.to) { // Self-loop
            const loopRadius = 18;
            // Position loop slightly above the state
            const loopCenterX = fromStatePos.cx;
            const loopCenterY = fromStatePos.cy - STATE_RADIUS - loopRadius + 5; // Adjusted to be clear of state

            // Path for a C-shaped loop starting and ending near the top of the state circle
            pathD = `M ${fromStatePos.cx - loopRadius * 0.5}, ${fromStatePos.cy - STATE_RADIUS + 3}
                       A ${loopRadius},${loopRadius} 0 1,1 ${fromStatePos.cx + loopRadius * 0.5}, ${fromStatePos.cy - STATE_RADIUS + 3}`;

            labelX = loopCenterX;
            labelY = loopCenterY - loopRadius - 5; // Label above the loop
        } else { // Transition between different states
            // Adjust start/end points to touch the edge of the state circles
            const startX = fromStatePos.cx + STATE_RADIUS * Math.cos(angle);
            const startY = fromStatePos.cy + STATE_RADIUS * Math.sin(angle);
            const endX = toStatePos.cx - STATE_RADIUS * Math.cos(angle);
            const endY = toStatePos.cy - STATE_RADIUS * Math.sin(angle);

            pathD = `M ${startX},${startY} L ${endX},${endY}`;

            // Check for reverse path to curve paths if they overlap
            const hasReverse = layout.transitions.some(rev => rev.from === t.to && rev.to === t.from);
            if (hasReverse && t.from < t.to) { // Only apply curve for one direction to avoid double curving
                const controlOffsetY = 30; // How much to curve
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlX = midX - controlOffsetY * Math.sin(angle); // Perpendicular offset
                const controlY = midY + controlOffsetY * Math.cos(angle);
                pathD = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
                labelX = controlX; // Position label near control point
                labelY = controlY - 5;
            } else {
                // Position label slightly offset from the midpoint of the line
                const labelOffset = 10;
                labelX = (startX + endX) / 2 + labelOffset * Math.sin(angle + Math.PI / 2); // Offset perpendicular to path
                labelY = (startY + endY) / 2 - labelOffset * Math.cos(angle + Math.PI / 2);
            }
        }
        path.setAttribute('d', pathD);
        svgDfaVisualization.appendChild(path);

        // Add transition label
        const transitionLabel = document.createElementNS(SVG_NS, 'text');
        transitionLabel.setAttribute('x', labelX);
        transitionLabel.setAttribute('y', labelY);
        transitionLabel.setAttribute('class', 'transition-label');
        transitionLabel.textContent = t.label;
        svgDfaVisualization.appendChild(transitionLabel);
    });

    // Draw states (groups of circle and label)
    layout.states.forEach(state => {
        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('id', `dfa-group-${state.id}`);
        const originalTransformValue = `translate(${state.cx}, ${state.cy})`;
        group.setAttribute('transform', originalTransformValue);
        group.dataset.originalTransform = originalTransformValue; // Store for resetting highlight

        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0); 
        circle.setAttribute('r', STATE_RADIUS);
        circle.classList.add('state-circle');
        if (state.isStart) circle.classList.add('start-state');
        if (state.isFinal) circle.classList.add('final-state');
        if (state.isTrap) circle.classList.add('trap-state');
        group.appendChild(circle);

        const stateLabel = document.createElementNS(SVG_NS, 'text');
        stateLabel.setAttribute('x', 0);
        stateLabel.setAttribute('y', 0); 
        stateLabel.classList.add('state-label');
        if (state.isFinal) stateLabel.classList.add('final-state-label');
        if (state.isTrap) stateLabel.classList.add('trap-state-label');
        stateLabel.textContent = `q${state.id}`;
        group.appendChild(stateLabel);

        svgDfaVisualization.appendChild(group);
    });
    console.log("DFA Visualization Updated (with groups):", dfaType);
}

/**
 * Draws the PDA (Pushdown Automaton) visualization in the SVG container.
 * It uses DFA layouts for state positions and renders PDA-specific node shapes
 * (ellipses for start/accept/reject, rectangles for processing) and transitions.
 *
 * @param {string} dfaIdentifier - The identifier of the DFA layout to use for
 * the PDA's state positioning.
 */
function drawPDAVisualization(dfaIdentifier) {
    const layout = dfaLayouts[dfaIdentifier];
    if (!layout) {
        console.error("Invalid DFA type for PDA layout:", dfaIdentifier);
        svgPdaVisualization.innerHTML = `<text x="10" y="20" fill="red">Error: PDA layout for ${dfaIdentifier} not found.</text>`;
        return;
    }

    svgPdaVisualization.innerHTML = '';

    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'pda-arrowhead');
    marker.setAttribute('viewBox', '0 -5 10 10');
    marker.setAttribute('refX', 6);
    marker.setAttribute('refY', 0);
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerWidth', 5);
    marker.setAttribute('markerHeight', 5);
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', '0,-5 10,0 0,5');
    poly.setAttribute('fill', '#5f7e97');
    marker.appendChild(poly);
    defs.appendChild(marker);
    svgPdaVisualization.appendChild(defs);

    const stateCoords = {};
    layout.states.forEach(s => {
        stateCoords[s.id] = {
            cx: s.cx,
            cy: s.cy
        };
    });

    layout.transitions.forEach(t => {
        const fromNodeInfo = stateCoords[t.from];
        const toNodeInfo = stateCoords[t.to];
        if (!fromNodeInfo || !toNodeInfo) {
            console.warn(`Coordinates missing for transition from ${t.from} to ${t.to}`);
            return;
        }

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'transition-path');
        path.setAttribute('marker-end', 'url(#pda-arrowhead)');

        let fromX = fromNodeInfo.cx;
        let fromY = fromNodeInfo.cy;
        let toX = toNodeInfo.cx;
        let toY = toNodeInfo.cy;

        const angle = Math.atan2(toY - fromY, toX - fromX);
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        let pathD, labelX, labelY;

        if (t.from === t.to) {
            const nodeWidth = PDA_NODE_WIDTH;
            const nodeHeight = PDA_NODE_HEIGHT;
            const loopOffsetX = nodeWidth * 0.4;
            const loopOffsetY = nodeHeight * 0.7;
            const startLoopX = fromNodeInfo.cx + nodeWidth / 2;
            const startLoopY = fromNodeInfo.cy - nodeHeight / 4;
            const endLoopX = fromNodeInfo.cx + nodeWidth / 2;
            const endLoopY = fromNodeInfo.cy + nodeHeight / 4;
            const control1X = fromNodeInfo.cx + nodeWidth / 2 + loopOffsetX;
            const control1Y = fromNodeInfo.cy - loopOffsetY;
            const control2X = fromNodeInfo.cx + nodeWidth / 2 + loopOffsetX;
            const control2Y = fromNodeInfo.cy + loopOffsetY;
            pathD = `M ${startLoopX},${startLoopY} C ${control1X},${control1Y} ${control2X},${control2Y} ${endLoopX},${endLoopY}`;
            labelX = fromNodeInfo.cx + nodeWidth / 2 + loopOffsetX + 7;
            labelY = fromNodeInfo.cy;
        } else {
            const toShapeLeft = toNodeInfo.cx - PDA_NODE_WIDTH / 2;
            const toShapeRight = toNodeInfo.cx + PDA_NODE_WIDTH / 2;
            const toShapeTop = toNodeInfo.cy - PDA_NODE_HEIGHT / 2;
            const toShapeBottom = toNodeInfo.cy + PDA_NODE_HEIGHT / 2;
            let intersectX = toNodeInfo.cx;
            let intersectY = toNodeInfo.cy;

            const lineFromCenterX = fromNodeInfo.cx;
            const lineFromCenterY = fromNodeInfo.cy;

            if (Math.abs(dx) * PDA_NODE_HEIGHT > Math.abs(dy) * PDA_NODE_WIDTH) {
                if (dx > 0) { intersectX = toShapeLeft; } else { intersectX = toShapeRight; }
                intersectY = toNodeInfo.cy - (toNodeInfo.cx - intersectX) * dy / dx;
            } else {
                if (dy > 0) { intersectY = toShapeTop; } else { intersectY = toShapeBottom; }
                intersectX = toNodeInfo.cx - (toNodeInfo.cy - intersectY) * dx / dy;
            }

            const finalToX = intersectX - dx * 2;
            const finalToY = intersectY - dy * 2;

            let startX = fromNodeInfo.cx + dx * (PDA_NODE_WIDTH / 2.2);
            let startY = fromNodeInfo.cy + dy * (PDA_NODE_HEIGHT / 2.2);

            pathD = `M ${startX},${startY} L ${finalToX},${finalToY}`;
            const hasReverse = layout.transitions.some(rev => rev.from === t.to && rev.to === t.from);
            if (hasReverse && t.from < t.to) {
                const controlOffsetY = 30;
                const midX = (startX + finalToX) / 2;
                const midY = (startY + finalToY) / 2;
                const controlX = midX - controlOffsetY * Math.sin(angle);
                const controlY = midY + controlOffsetY * Math.cos(angle);
                pathD = `M ${startX},${startY} Q ${controlX},${controlY} ${finalToX},${finalToY}`;
                labelX = controlX;
                labelY = controlY - 9;
            } else {
                const labelOffset = 12;
                labelX = (startX + finalToX) / 2 + labelOffset * Math.sin(angle + Math.PI / 2);
                labelY = (startY + finalToY) / 2 - labelOffset * Math.cos(angle + Math.PI / 2);
            }
        }
        path.setAttribute('d', pathD);
        svgPdaVisualization.appendChild(path);

        const transitionLabel = document.createElementNS(SVG_NS, 'text');
        transitionLabel.setAttribute('x', labelX);
        transitionLabel.setAttribute('y', labelY);
        transitionLabel.setAttribute('class', 'transition-label');

        let pdaActionLabel = "";
        const inputSymbols = t.label.split(',');
        const firstInputSymbol = inputSymbols[0].trim();

        if (firstInputSymbol) {
            pdaActionLabel = `${firstInputSymbol}, ε / ${firstInputSymbol}`;
        } else {
            pdaActionLabel = `ε, ε / ε`;
        }
        if (inputSymbols.length > 1) {
            pdaActionLabel = inputSymbols.map(sym => `${sym.trim()}, ε / ${sym.trim()}`).join('\n');
        }

        if (pdaActionLabel.includes('\n')) {
            const parts = pdaActionLabel.split('\n');
            transitionLabel.textContent = '';
            parts.forEach((part, index) => {
                const tspan = document.createElementNS(SVG_NS, 'tspan');
                tspan.setAttribute('x', labelX);
                tspan.setAttribute('dy', index === 0 ? '0' : '1em');
                tspan.textContent = part;
                transitionLabel.appendChild(tspan);
            });
        } else {
            transitionLabel.textContent = pdaActionLabel;
        }
        svgPdaVisualization.appendChild(transitionLabel);
    });

    layout.states.forEach(state => {

        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('id', `pda-group-${state.id}`);

        let nodeElement;
        let nodeClass = 'pda-node ';
        let labelClass = 'pda-node-label ';
        let nodeLabelText = state.label || `q${state.id}`;
        group.dataset.originalLabel = nodeLabelText;

        if (state.isStart) {
            nodeElement = document.createElementNS(SVG_NS, 'ellipse');
            nodeElement.setAttribute('cx', state.cx);
            nodeElement.setAttribute('cy', state.cy);
            nodeElement.setAttribute('rx', PDA_NODE_WIDTH / 2);
            nodeElement.setAttribute('ry', PDA_NODE_HEIGHT / 2);
            nodeClass += 'pda-start-node';
            labelClass += 'pda-start-node-label';
            nodeLabelText = 'START';
            group.dataset.originalLabel = 'START';
        } else if (state.isFinal) {
            nodeElement = document.createElementNS(SVG_NS, 'ellipse');
            nodeElement.setAttribute('cx', state.cx);
            nodeElement.setAttribute('cy', state.cy);
            nodeElement.setAttribute('rx', PDA_NODE_WIDTH / 2);
            nodeElement.setAttribute('ry', PDA_NODE_HEIGHT / 2);
            nodeClass += 'pda-accept-node';
            labelClass += 'pda-accept-node-label';
            nodeLabelText = 'ACCEPT';
            group.dataset.originalLabel = 'ACCEPT';

            const innerEllipse = document.createElementNS(SVG_NS, 'ellipse');
            innerEllipse.setAttribute('cx', state.cx);
            innerEllipse.setAttribute('cy', state.cy);
            innerEllipse.setAttribute('rx', (PDA_NODE_WIDTH / 2) - 4);
            innerEllipse.setAttribute('ry', (PDA_NODE_HEIGHT / 2) - 4);
            innerEllipse.setAttribute('fill', 'none');
            innerEllipse.setAttribute('stroke', '#c792ea');
            innerEllipse.setAttribute('stroke-width', '1.5px');
            group.appendChild(innerEllipse);
        } else if (state.isTrap) {
            nodeElement = document.createElementNS(SVG_NS, 'ellipse');
            nodeElement.setAttribute('cx', state.cx);
            nodeElement.setAttribute('cy', state.cy);
            nodeElement.setAttribute('rx', PDA_NODE_WIDTH / 2);
            nodeElement.setAttribute('ry', PDA_NODE_HEIGHT / 2);
            nodeClass += 'pda-reject-node';
            labelClass += 'pda-reject-node-label';
            nodeLabelText = 'REJECT';
            group.dataset.originalLabel = 'REJECT';
        } else {
            nodeElement = document.createElementNS(SVG_NS, 'rect');
            nodeElement.setAttribute('x', state.cx - PDA_NODE_WIDTH / 2);
            nodeElement.setAttribute('y', state.cy - PDA_NODE_HEIGHT / 2);
            nodeElement.setAttribute('width', PDA_NODE_WIDTH);
            nodeElement.setAttribute('height', PDA_NODE_HEIGHT);
            nodeElement.setAttribute('rx', 5);
            nodeElement.setAttribute('ry', 5);
            nodeClass += 'pda-processing-node';
            labelClass += 'pda-processing-node-label';
            nodeLabelText = `q${state.id}`;
            group.dataset.originalLabel = `q${state.id}`;
        }

        if (!nodeElement) {
            console.error("Node element was not created for state:", state);
            return;
        }

        nodeElement.setAttribute('id', `pda-state-${state.id}`);
        nodeElement.setAttribute('class', nodeClass);
        group.appendChild(nodeElement);
        const stateLabelElement = document.createElementNS(SVG_NS, 'text');
        stateLabelElement.setAttribute('x', state.cx);
        stateLabelElement.setAttribute('y', state.cy);
        stateLabelElement.setAttribute('class', labelClass);
        setSvgText(stateLabelElement, nodeLabelText);

    group.appendChild(stateLabelElement);
    svgPdaVisualization.appendChild(group);
        const parts = nodeLabelText.split('\n');
        parts.forEach((part, index) => {
            const tspan = document.createElementNS(SVG_NS, 'tspan');
            tspan.setAttribute('x', state.cx);
            tspan.setAttribute('dy', index === 0 ? '0' : '1.1em');
            if (parts.length > 1 && index === 0) {
                 tspan.setAttribute('dy', `-${(parts.length -1) * 0.4}em`);
            }
            tspan.textContent = part;
            stateLabelElement.appendChild(tspan);
        });

        group.appendChild(stateLabelElement);
        svgPdaVisualization.appendChild(group);
    });

    console.log("PDA Flowchart Visualization Updated:", dfaIdentifier);
}

/**
 * Initializes the PDA stack with the initial stack symbol (Z₀).
 * Updates the PDA stack display and the current configuration display.
 */
function initializePdaStack() {
    currentPdaStack = [PDA_INITIAL_STACK_SYMBOL];
    updatePdaStackDisplay(currentPdaStack);
    const selectedDfaLayout = dfaLayouts[dfaSelect.value];
    if (selectedDfaLayout) {
         const startState = selectedDfaLayout.states.find(s => s.isStart)?.id ?? 'S';
         pdaCurrentConfigDisplay.textContent = `Initial: (q${startState}, input_string, ${PDA_INITIAL_STACK_SYMBOL})`;
    } else {
         pdaCurrentConfigDisplay.textContent = `Initial: (Start, input_string, ${PDA_INITIAL_STACK_SYMBOL})`;
    }
}

/**
 * Updates the visual display of the PDA stack.
 *
 * @param {string[]} stackArray - An array representing the current PDA stack,
 * with the top of the stack at the last index.
 */
function updatePdaStackDisplay(stackArray) {
    pdaStackDisplay.innerHTML = '';
    if (!stackArray || stackArray.length === 0) {
        const item = document.createElement('div');
        item.classList.add('stack-item', 'empty');
        item.textContent = '(empty)';
        pdaStackDisplay.appendChild(item);
        return;
    }

    for (let i = 0; i < stackArray.length; i++) {
        const item = document.createElement('div');
        item.classList.add('stack-item');
        item.textContent = stackArray[i];
        if (i === stackArray.length - 1) {
            item.classList.add('stack-top');
        }
        pdaStackDisplay.appendChild(item);
    }
}

/**
 * Highlights a specific state in an SVG visualization (DFA or PDA).
 * Removes highlighting from any previously highlighted state.
 * Applies scaling transforms to the group element for proper visual effect.
 *
 * @param {string|number|null} stateId - The ID of the state to highlight.
 * If null or undefined, clears current highlighting.
 * @param {string} [svgElementId='dfa-visualization'] - The ID of the SVG
 * element containing the visualization.
 */
function highlightStateSVG(stateId, svgElementId = 'dfa-visualization') {
    const svgElement = document.getElementById(svgElementId);
    if (!svgElement) {
        console.warn(`SVG element with ID '${svgElementId}' not found for highlighting.`);
        return;
    }

    if (svgElementId === 'dfa-visualization') {
        // Clear previous DFA transform and style
        const currentTransformedGroupDFA = svgElement.querySelector('g.dfa-group-transformed');
        if (currentTransformedGroupDFA) {
            const originalTransform = currentTransformedGroupDFA.dataset.originalTransform || '';
            currentTransformedGroupDFA.setAttribute('transform', originalTransform);
            currentTransformedGroupDFA.classList.remove('dfa-group-transformed');
            const circle = currentTransformedGroupDFA.querySelector('.state-circle');
            if (circle) circle.classList.remove('highlight-style');
            const label = currentTransformedGroupDFA.querySelector('.state-label');
            if (label) label.classList.remove('highlight-style');
        }

        if (stateId !== null && typeof stateId === 'number' && !isNaN(stateId)) {
            const groupElement = svgElement.querySelector(`#dfa-group-${stateId}`);
            if (groupElement) {
                if (!groupElement.dataset.originalTransform) { // Ensure original transform is stored
                    groupElement.dataset.originalTransform = groupElement.getAttribute('transform') || '';
                }
                const baseTransform = groupElement.dataset.originalTransform;
                // Apply scale on top of the base translation
                groupElement.setAttribute('transform', `${baseTransform} scale(1.1)`);
                groupElement.classList.add('dfa-group-transformed');

                const circle = groupElement.querySelector('.state-circle');
                if (circle) circle.classList.add('highlight-style');
                const label = groupElement.querySelector('.state-label');
                if (label) label.classList.add('highlight-style');
            } else {
                // console.warn(`DFA group element for state ID 'dfa-group-${stateId}' not found.`);
            }
        }
    } else if (svgElementId === 'pda-visualization-svg') {
        // Clear previous PDA transform
        const currentTransformedGroupPDA = svgElement.querySelector('g.pda-group-transformed');
        if (currentTransformedGroupPDA) {
            currentTransformedGroupPDA.removeAttribute('transform'); 
            currentTransformedGroupPDA.classList.remove('pda-group-transformed');
        }
        // Clear previous PDA style (highlight class from the node itself)
        const currentStyledNodePDA = svgElement.querySelector('.pda-node.highlight');
        if (currentStyledNodePDA) {
            currentStyledNodePDA.classList.remove('highlight');
        }

        if (stateId !== null && (typeof stateId === 'number' || (typeof stateId === 'string' && !stateId.startsWith('REJECT_STATE')))) {
            const groupElement = svgElement.querySelector(`#pda-group-${stateId}`);
            if (groupElement) {
                const nodeElement = groupElement.querySelector('.pda-node');
                if (nodeElement) {
                    let centerX, centerY;
                    //PDA nodes are drawn with their main point at (cx,cy) for ellipses/circles, or x,y for rects, *within* the group.
                    //The group itself is not translated by default in drawPDAVisualization.
                    //So, to scale around the node's drawn center *within the group's coordinate system*:
                    if (nodeElement.tagName.toLowerCase() === 'ellipse' || nodeElement.tagName.toLowerCase() === 'circle') {
                        centerX = parseFloat(nodeElement.getAttribute('cx'));
                        centerY = parseFloat(nodeElement.getAttribute('cy'));
                    } else if (nodeElement.tagName.toLowerCase() === 'rect') {
                        centerX = parseFloat(nodeElement.getAttribute('x')) + parseFloat(nodeElement.getAttribute('width')) / 2;
                        centerY = parseFloat(nodeElement.getAttribute('y')) + parseFloat(nodeElement.getAttribute('height')) / 2;
                    } else { // Fallback for other shapes, though not expected here
                        const bbox = nodeElement.getBBox(); // getBBox is relative to current element's coordinate system
                        centerX = bbox.x + bbox.width / 2;
                        centerY = bbox.y + bbox.height / 2;
                    }
                    
                    // Apply scaling transform around this calculated center
                    groupElement.setAttribute('transform', `translate(${centerX}, ${centerY}) scale(1.05) translate(${-centerX}, ${-centerY})`);
                    groupElement.classList.add('pda-group-transformed');
                    
                    // Add .highlight class to the node for fill/stroke styling via CSS
                    nodeElement.classList.add('highlight');
                }
            } else {
                 // console.warn(`PDA group element for state ID 'pda-group-${stateId}' not found.`);
            }
        }
    }
}

/**
 * Animates the sequence of states for a DFA simulation.
 * Highlights each state in the SVG and text display sequentially.
 *
 * @async
 * @param {Array<string|number>} sequence - An array of state IDs representing
 * the path taken by the DFA.
 */
async function animateDfaSequence(sequence) {
    sequenceDisplay.innerHTML = '';
    const stepElements = [];

    sequence.forEach((state, index) => {
        const stepSpan = document.createElement('span');
        stepSpan.classList.add('state-step');
        stepSpan.textContent = (typeof state === 'string' && state.startsWith('REJECT_STATE')) ? state : `q${state}`;
        stepElements.push(stepSpan);
        sequenceDisplay.appendChild(stepSpan);
        if (index < sequence.length - 1) {
            sequenceDisplay.appendChild(document.createTextNode(' → '));
        }
    });

    let lastValidStateForHighlight = null;
    for (let i = 0; i < stepElements.length; i++) {
        clearHighlightsText();

        const currentStateElement = stepElements[i];
        const stateValue = sequence[i];

        highlightStateSVG(null);

        if (typeof stateValue === 'string' && stateValue.startsWith('REJECT_STATE')) {
            currentStateElement.style.color = '#dc3545';
            currentStateElement.style.fontWeight = 'bold';
            statusMessage.textContent = `DFA Simulation stopped: ${stateValue}`;
            if (lastValidStateForHighlight !== null) highlightStateSVG(lastValidStateForHighlight);
            break;
        }

        highlightStateSVG(stateValue);
        lastValidStateForHighlight = stateValue;

        currentStateElement.classList.add('highlight');
        statusMessage.textContent = `Processing DFA... Current state: q${stateValue}`;

        await sleep(dfaAnimationDelay);
        if (currentStateElement) currentStateElement.classList.remove('highlight');
    }
    highlightStateSVG(lastValidStateForHighlight);
    const finalMessage = resultDisplay.textContent;
    statusMessage.textContent = `DFA Simulation complete. Final state ${lastValidStateForHighlight !== null ? 'q' + lastValidStateForHighlight : 'N/A'} shown. Result: ${finalMessage}`;
}

/**
 * Animates a PDA simulation by visually representing the flow of a DFA.
 * It highlights states, updates the PDA stack, and displays the current configuration.
 *
 * @async
 * @param {string} selectedDfaType - The type of DFA layout being used.
 * @param {Array<string|number>} dfaStateSequence - The sequence of states from the DFA simulation.
 * @param {boolean} dfaAccepted - Whether the DFA accepted the input string.
 * @param {string} inputString - The input string being processed.
 */
async function animatePdaAsDfaFlow(selectedDfaType, dfaStateSequence, dfaAccepted, inputString) {
    statusMessage.textContent = `Animating PDA for input "${inputString}"...`;
    sequenceDisplay.innerHTML = '';

    initializePdaStack();
    let processedInput = "";
    let remainingInput = inputString;

    const dfaLayout = dfaLayouts[selectedDfaType];
    const initialDfaState = dfaLayout?.states.find(s => s.isStart)?.id ?? (dfaStateSequence.length > 0 ? dfaStateSequence[0] : 'S');


    for (let i = 0; i < dfaStateSequence.length; i++) {
        const currentStateId = dfaStateSequence[i];

        if (typeof currentStateId === 'string' && currentStateId.startsWith('REJECT_STATE')) {
            pdaCurrentConfigDisplay.textContent = `REJECTED: ${currentStateId}`;
            const lastValidStateId = i > 0 ? dfaStateSequence[i - 1] : (dfaLayout?.states.find(s => s.isStart)?.id);
            if (lastValidStateId !== undefined && typeof lastValidStateId !== 'string') {
                highlightStateSVG(lastValidStateId, 'pda-visualization-svg');
            } else {
                highlightStateSVG(null, 'pda-visualization-svg');
            }
            resultDisplay.textContent = 'Rejected';
            const errorStepSpan = document.createElement('span');
            errorStepSpan.classList.add('state-step', 'error');
            errorStepSpan.textContent = currentStateId;
            sequenceDisplay.appendChild(errorStepSpan);

            enableControls(true);
            return;
        }

        highlightStateSVG(currentStateId, 'pda-visualization-svg');

        const currentPdaNodeGroup = svgPdaVisualization.querySelector(`#pda-group-${currentStateId}`);
        const currentPdaNodeLabelElement = currentPdaNodeGroup ? currentPdaNodeGroup.querySelector('.pda-node-label') : null;
        let originalLabelOfCurrentNode = currentPdaNodeGroup ? currentPdaNodeGroup.dataset.originalLabel : `q${currentStateId}`;

        svgPdaVisualization.querySelectorAll('g[id^="pda-group-"]').forEach(group => {
            if (group.id !== `pda-group-${currentStateId}` && group.dataset.dynamicLabel === 'true') {
                const labelEl = group.querySelector('.pda-node-label');
                const originalLabel = group.dataset.originalLabel;
                if (labelEl && originalLabel) {
                    setSvgText(labelEl, originalLabel);
                }
                group.dataset.dynamicLabel = 'false';
            }
        });

        let operationCue = "";
        let dynamicNodeLabelText = originalLabelOfCurrentNode;

        if (i > 0) {
            const consumedChar = inputString[i - 1];
            processedInput += consumedChar;
            operationCue = `READ '${consumedChar}'`;
            currentPdaStack.push(consumedChar);
            updatePdaStackDisplay(currentPdaStack);
            operationCue += `, PUSH '${consumedChar}'`;

            if (currentPdaNodeLabelElement && !['START', 'ACCEPT', 'REJECT'].includes(originalLabelOfCurrentNode)) {
                dynamicNodeLabelText = `${originalLabelOfCurrentNode} (R:${consumedChar} P:${consumedChar})`;
                if (currentPdaNodeGroup) currentPdaNodeGroup.dataset.dynamicLabel = 'true';
            }
        } else {
            operationCue = "Initial state";
        }

        if (currentPdaNodeLabelElement) {
            setSvgText(currentPdaNodeLabelElement, dynamicNodeLabelText);
        }

        remainingInput = inputString.substring(i);
        const stackTop = currentPdaStack.length > 0 ? currentPdaStack[currentPdaStack.length - 1] : 'ε';
        pdaCurrentConfigDisplay.textContent = `(q${currentStateId}, ${remainingInput || 'ε'}, ${stackTop}) - ${operationCue}`;
        statusMessage.textContent = `PDA at q${currentStateId}. ${operationCue}. Stack top: ${stackTop}`;

        const stepSpan = document.createElement('span');
        stepSpan.classList.add('state-step');
        stepSpan.textContent = `q${currentStateId}`;
        sequenceDisplay.appendChild(stepSpan);
        if (i < dfaStateSequence.length - 1 && !(typeof dfaStateSequence[i+1] === 'string' && dfaStateSequence[i+1].startsWith('REJECT_STATE'))) {
            sequenceDisplay.appendChild(document.createTextNode(' → '));
        }

        const allStepSpans = sequenceDisplay.querySelectorAll('.state-step.highlight');
        allStepSpans.forEach(s => s.classList.remove('highlight'));
        stepSpan.classList.add('highlight');

        await sleep(PDA_ANIMATION_DELAY);

        if (currentPdaNodeGroup && currentPdaNodeGroup.dataset.dynamicLabel === 'true') {
             if (currentPdaNodeLabelElement && originalLabelOfCurrentNode) {
                setSvgText(currentPdaNodeLabelElement, originalLabelOfCurrentNode);
             }
             currentPdaNodeGroup.dataset.dynamicLabel = 'false';
        }
    }
    if (dfaStateSequence && dfaStateSequence.length > 0) {
        const finalAnimatedStateId = dfaStateSequence[dfaStateSequence.length - 1];
        if (!(typeof finalAnimatedStateId === 'string' && finalAnimatedStateId.startsWith('REJECT_STATE'))) {
            highlightStateSVG(finalAnimatedStateId, 'pda-visualization-svg');

            const finalNodeGroup = svgPdaVisualization.querySelector(`#pda-group-${finalAnimatedStateId}`);
            if (finalNodeGroup) {
                const finalNodeLabelElement = finalNodeGroup.querySelector('.pda-node-label');
                const originalLabel = finalNodeGroup.dataset.originalLabel;
                if (finalNodeLabelElement && originalLabel) {
                    setSvgText(finalNodeLabelElement, originalLabel);
                }
            }
            const stackTopFinal = currentPdaStack.length > 0 ? currentPdaStack[currentPdaStack.length - 1] : 'ε';
            pdaCurrentConfigDisplay.textContent = `Final: (q${finalAnimatedStateId}, ε, ${stackTopFinal}). Result: ${dfaAccepted ? 'Accepted' : 'Rejected'}`;
        }
    } else {
        const stackTopFinal = currentPdaStack.length > 0 ? currentPdaStack[currentPdaStack.length - 1] : 'ε';
        pdaCurrentConfigDisplay.textContent = `Final: (N/A, ${inputString || 'ε'}, ${stackTopFinal}). Result: ${dfaAccepted ? 'Accepted' : 'Rejected'}`;
    }


    statusMessage.textContent = `PDA animation complete. Result: ${dfaAccepted ? 'Accepted' : 'Rejected'}.`;
    resultDisplay.textContent = dfaAccepted ? 'Accepted' : 'Rejected';
    enableControls(true);
}

/**
 * Sets the text content of an SVG text element, handling multi-line text
 * by creating tspan elements and centering them vertically.
 *
 * @param {SVGTextElement} textElement - The SVG text element to modify.
 * @param {string} content - The text content, which can include newline
 * characters for multi-line display.
 */
function setSvgText(textElement, content) {
    const x = textElement.getAttribute('x');
    textElement.textContent = '';
    const lines = String(content).split('\n');
    const approxLineHeight = 1.1;
    const totalTextHeight = lines.length * approxLineHeight;
    const initialDyOffset = -(totalTextHeight / 2) + (approxLineHeight / 2) ;


    lines.forEach((line, index) => {
        const tspan = document.createElementNS(SVG_NS, 'tspan');
        tspan.setAttribute('x', x);
        let dy;
        if (index === 0) {
            dy = `${initialDyOffset}em`;
        } else {
            dy = `${approxLineHeight}em`;
        }
        tspan.setAttribute('dy', dy);
        tspan.textContent = line;
        textElement.appendChild(tspan);
    });
}

/**
 * Traces a derivation for a given Context-Free Grammar (CFG).
 * It attempts to derive a target string or performs a limited number of
 * derivation steps if no target is provided. Updates UI elements to show
 * the derivation sequence, current sentential form, and status.
 *
 * @async
 * @param {object} cfg - The CFG object, containing variables, terminals,
 * start symbol, and production rules.
 * @param {string|null} [targetString=null] - The target string to derive.
 * If null, a few derivation steps are shown.
 * @param {number} [maxSteps=traceCfgMaxSteps] - The maximum number of
 * derivation steps to perform.
 */
async function traceCfgDerivation(cfg, targetString = null, maxSteps = traceCfgMaxSteps) {
    cfgDerivationSequenceDisplay.innerHTML = '';
    let currentSententialForm = [cfg.startSymbol];
    cfgCurrentStringDisplay.innerHTML = formatSententialForm(currentSententialForm);
    cfgStatusMessage.textContent = `Starting derivation with: ${cfg.startSymbol}`;

    let stepCount = 0;
    let derivedSuccessfully = false;

    for (stepCount = 0; stepCount < maxSteps; stepCount++) {
        const leftmostNonTerminalIndex = currentSententialForm.findIndex(symbol => cfg.variables.includes(symbol));

        if (leftmostNonTerminalIndex === -1) {
            const currentString = currentSententialForm.join('');
            if (targetString && currentString === targetString) {
                cfgResultDisplay.textContent = "Result: Successfully derived target string!";
                cfgStatusMessage.textContent = `Derived: "${currentString}"`;
                derivedSuccessfully = true;
            } else if (targetString) {
                cfgResultDisplay.textContent = "Result: Derivation halted, target not matched.";
                cfgStatusMessage.textContent = `Halted. Derived: "${currentString}" (Target: "${targetString}")`;
            } else {
                cfgResultDisplay.textContent = "Result: Derivation halted (no non-terminals).";
                cfgStatusMessage.textContent = `Derived: "${currentString}"`;
            }
            addDerivationStep(currentSententialForm, "Derivation complete.");
            break;
        }

        const nonTerminalToReplace = currentSententialForm[leftmostNonTerminalIndex];
        const applicableRules = cfg.rules.filter(rule => rule.from === nonTerminalToReplace);

        if (applicableRules.length === 0) {
            cfgResultDisplay.textContent = "Result: Stuck! No rule for non-terminal.";
            cfgStatusMessage.textContent = `Stuck at: ${nonTerminalToReplace}. No applicable rules.`;
            addDerivationStep(currentSententialForm, `No rule for ${nonTerminalToReplace}`);
            break;
        }


        let chosenRule = null;

        if (targetString) {
            const prefixOfCurrentForm = currentSententialForm.slice(0, leftmostNonTerminalIndex).join('');
            const remainingTarget = targetString.substring(prefixOfCurrentForm.length);

            let bestRule = null;
            let canMatchExactlyAndTerminate = false;

            for (const rule of applicableRules) {
                const ruleProduces = rule.to.filter(s => cfg.terminals.includes(s)).join('');
                const ruleNonTerminals = rule.to.filter(s => cfg.variables.includes(s));

                if (remainingTarget.startsWith(ruleProduces)) {
                    const afterRuleTarget = remainingTarget.substring(ruleProduces.length);
                    if (afterRuleTarget.length === 0 && ruleNonTerminals.every(nt => canDeriveEpsilon(cfg, nt, new Set()))) {
                        bestRule = rule;
                        canMatchExactlyAndTerminate = true;
                        break;
                    }
                    if (!rule.to.includes(nonTerminalToReplace) && (!bestRule || bestRule.to.includes(nonTerminalToReplace))) {
                        if(!bestRule || ruleProduces.length > bestRule.to.filter(s => cfg.terminals.includes(s)).join('').length) {
                            bestRule = rule;
                        }
                    }
                    if (rule.to.includes(nonTerminalToReplace) && !bestRule && ruleProduces.length > 0) {
                        bestRule = rule;
                    }
                }
            }
            if (canMatchExactlyAndTerminate) {
                chosenRule = bestRule;
            } else {
                if (remainingTarget.length === 0) {
                    const epsilonRule = applicableRules.find(r => r.to.length === 1 && r.to[0] === 'ε');
                    if (epsilonRule) {
                        chosenRule = epsilonRule;
                    }
                }

                if (!chosenRule && bestRule) {
                    chosenRule = bestRule;
                }

                if (!chosenRule) {
                    chosenRule = applicableRules.find(r => !r.to.includes(nonTerminalToReplace) && !r.to.includes('ε')) ||
                                applicableRules.find(r => !r.to.includes('ε')) ||
                                applicableRules.find(r => r.to.includes('ε') && r.to.length === 1 ) ||
                                applicableRules[0];
                }
            }
        } else {
            chosenRule = applicableRules.find(r => !r.to.includes('ε')) || applicableRules[0];
        }

        if (!chosenRule && applicableRules.length > 0) {
            chosenRule = applicableRules[0];
        }

        const ruleDisplay = `${chosenRule.from} → ${chosenRule.to.join(' ') || 'ε'}`;
        addDerivationStep(currentSententialForm, `Applying: ${ruleDisplay}`);

        const before = currentSententialForm.slice(0, leftmostNonTerminalIndex);
        const after = currentSententialForm.slice(leftmostNonTerminalIndex + 1);
        const replacement = (chosenRule.to[0] === 'ε' || chosenRule.to.length === 0) ? [] : chosenRule.to;

        currentSententialForm = [...before, ...replacement, ...after];

        cfgCurrentStringDisplay.innerHTML = formatSententialForm(currentSententialForm, leftmostNonTerminalIndex, replacement.length);
        cfgStatusMessage.textContent = `Applied: ${ruleDisplay}. Current: ${currentSententialForm.join(' ')}`;

        if (targetString && currentSententialForm.join('') === targetString && !currentSententialForm.some(s => cfg.variables.includes(s))) {
            cfgResultDisplay.textContent = "Result: Successfully derived target string!";
            cfgStatusMessage.textContent = `Derived: "${targetString}"`;
            addDerivationStep(currentSententialForm, "Target derived!");
            derivedSuccessfully = true;
            break;
        }

        await sleep(CFG_ANIMATION_DELAY);
    }

    if (stepCount >= maxSteps && !derivedSuccessfully) {
        cfgResultDisplay.textContent = "Result: Max steps reached.";
        cfgStatusMessage.textContent = `Max steps (${maxSteps}) reached. Current: ${currentSententialForm.join(' ')}`;
        addDerivationStep(currentSententialForm, "Max steps.");
    }
    if (!derivedSuccessfully && !targetString && stepCount < maxSteps) {
         cfgResultDisplay.textContent = "Result: Derivation shown.";
    }
}

/**
 * Adds a step to the CFG derivation sequence display.
 *
 * @param {string[]} sententialFormArray - The current sentential form as an array of symbols.
 * @param {string} ruleAppliedText - Text describing the rule applied in this step.
 */
function addDerivationStep(sententialFormArray, ruleAppliedText) {
    const stepDiv = document.createElement('div');
    stepDiv.classList.add('derivation-step');

    const formSpan = document.createElement('span');
    formSpan.innerHTML = formatSententialForm(sententialFormArray);

    const ruleSpan = document.createElement('span');
    ruleSpan.classList.add('rule-applied');
    ruleSpan.textContent = `(${ruleAppliedText})`;

    stepDiv.appendChild(formSpan);
    stepDiv.appendChild(document.createTextNode(' ⇒ '));
    stepDiv.appendChild(ruleSpan);

    cfgDerivationSequenceDisplay.appendChild(stepDiv);
    cfgDerivationSequenceDisplay.scrollTop = cfgDerivationSequenceDisplay.scrollHeight;
}

/**
 * Formats a sentential form (array of symbols) into an HTML string with
 * styling for terminals and non-terminals, and optional highlighting.
 *
 * @param {string[]} formArray - The sentential form as an array of symbols.
 * @param {number} [highlightStartIndex=-1] - The starting index for highlighting.
 * @param {number} [highlightLength=0] - The number of symbols to highlight.
 * @returns {string} An HTML string representing the formatted sentential form.
 */
function formatSententialForm(formArray, highlightStartIndex = -1, highlightLength = 0) {
    return formArray.map((symbol, index) => {
        let classes = [];
        if (cfgRepresentations[dfaSelect.value]?.variables.includes(symbol)) {
            classes.push('non-terminal');
        } else if (cfgRepresentations[dfaSelect.value]?.terminals.includes(symbol)) {
            classes.push('terminal');
        }
        if (highlightStartIndex !== -1 && index >= highlightStartIndex && index < highlightStartIndex + highlightLength) {
            classes.push('highlight');
        }
        return `<span class="${classes.join(' ')}">${symbol || 'ε'}</span>`;
    }).join(' ');
}

/**
 * Checks if a given variable in a CFG can derive the empty string (epsilon).
 * Uses a visited set to prevent infinite loops in recursive grammars.
 *
 * @param {object} cfg - The CFG object.
 * @param {string} variable - The variable to check.
 * @param {Set<string>} [visited=new Set()] - A set of already visited variables
 * in the current derivation path to detect cycles.
 * @returns {boolean} True if the variable can derive epsilon, false otherwise.
 */
function canDeriveEpsilon(cfg, variable, visited = new Set()) {
    if (visited.has(variable)) return false;
    visited.add(variable);

    const rulesForVar = cfg.rules.filter(r => r.from === variable);
    for (const rule of rulesForVar) {
        if (rule.to.length === 1 && rule.to[0] === 'ε') {
            return true;
        }
        if (rule.to.every(symbol => cfg.variables.includes(symbol) ? canDeriveEpsilon(cfg, symbol, new Set(visited)) : false)) {
             return true;
        }
    }
    return false;
}
const circles = document.querySelectorAll(".circle");
const colors = [

  "linear-gradient(90deg, #067DD9, #9A76D0)"
];
const coords = { x: 0, y: 0 };
circles.forEach(function (circle, index) {
  circle.x = 0;
  circle.y = 0;
  circle.style.background = colors[index % colors.length];
});

window.addEventListener("mousemove", function(e){
  coords.x = e.clientX;
  coords.y = e.clientY;
  
});

function animateCircles() {
  
  let x = coords.x;
  let y = coords.y;
  
  circles.forEach(function (circle, index) {
    circle.style.left = x - 12 + "px";
    circle.style.top = y - 12 + "px";
    
    circle.style.scale = (circles.length - index) / circles.length;
    
    circle.x = x;
    circle.y = y;

    const nextCircle = circles[index + 1] || circles[0];
    x += (nextCircle.x - x) * 0.3;
    y += (nextCircle.y - y) * 0.3;
  });
 
  requestAnimationFrame(animateCircles);
}

animateCircles();
mainHandleReset();