const dfaSelect = document.getElementById('dfa-select');
const inputString = document.getElementById('input-string');
const simulateButton = document.getElementById('simulate-button');
const resetButton = document.getElementById('reset-button');
const loadingIndicator = document.getElementById('loading-indicator');
const statusMessage = document.getElementById('status-message');
const resultDisplay = document.getElementById('result-display');
const sequenceDisplay = document.getElementById('state-sequence-display');
const errorMessage = document.getElementById('error-message');
const currentVisState = document.getElementById('current-vis-state');

const BACKEND_URL = 'http://localhost:5500';

simulateButton.addEventListener('click', handleSimulate);
resetButton.addEventListener('click', handleReset);
inputString.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSimulate();
    }
});

function handleReset() {
    inputString.value = '';
    statusMessage.textContent = 'Enter a string and click Simulate.';
    resultDisplay.textContent = '';
    sequenceDisplay.innerHTML = ''; 
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    loadingIndicator.classList.add('hidden');
    currentVisState.textContent = '-'; 
    clearHighlights();
    enableControls(true);
    console.log('Form reset.');
}

async function handleSimulate() {
    const selectedDfa = dfaSelect.value;
    const rawInput = inputString.value;
    const input = rawInput.trim();

    console.log(`Simulating DFA: ${selectedDfa}, Input: "${input}"`);

    // Reset UI state
    sequenceDisplay.innerHTML = '';
    resultDisplay.textContent = '-';
    statusMessage.textContent = `Simulating with '${input}'...`;
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    enableControls(false);
    highlightState(null); // Clear initial SVG highlight

    if (input === '') {
        statusMessage.textContent = 'Input string cannot be empty.';
        loadingIndicator.classList.add('hidden');
        enableControls(true);
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/simulate-dfa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dfa_type: selectedDfa, dfa_input: input }),
        });

        let data;
        try {
            data = await response.json();
            console.log('Received Backend Response:', JSON.stringify(data, null, 2)); // Log formatted JSON
        } catch (jsonError) {
            console.error("Failed to parse JSON response:", jsonError);
            const textResponse = await response.text(); // Try to get text if JSON fails
            console.error("Raw text response:", textResponse);
            throw new Error(`Received non-JSON response from server (status: ${response.status}). Check backend logs.`);
        }
        loadingIndicator.classList.add('hidden');


        if (!response.ok) {
            const errorMsg = data?.error || `HTTP error ${response.status}`;
            console.error(`Backend Error: ${errorMsg}`);
            throw new Error(errorMsg);
        }

        // --- Process successful response with data checks ---
        const isAccepted = typeof data.accepted === 'boolean' ? data.accepted : false;
        const finalState = data.final_state !== undefined ? data.final_state : 'N/A';
        const backendError = data.error || null;
        const stateSequence = Array.isArray(data.state_sequence) ? data.state_sequence : [];

        console.log(`Parsed - Accepted: ${isAccepted}, Final State: ${finalState}, Error: ${backendError}, Sequence Length: ${stateSequence.length}`);

        resultDisplay.textContent = isAccepted ? 'Accepted' : 'Rejected';

        if (backendError) {
            statusMessage.textContent = `Simulation finished with error. Final state: ${finalState}.`;
            showError(backendError);
        } else {
            statusMessage.textContent = `Simulation finished. Final state: ${finalState}.`;
        }

        // Animate the sequence if valid
        if (stateSequence.length > 0) {
            await animateSequence(stateSequence); // Use the validated sequence array
        } else {
            sequenceDisplay.textContent = "No valid state sequence received.";
            statusMessage.textContent = `Simulation complete. No sequence to display. Result: ${resultDisplay.textContent}`;
            highlightState(null); // Ensure no SVG highlight if no sequence
        }

    } catch (error) { // Catches fetch errors, JSON parsing errors, or thrown errors
        console.error('Handle Simulate Catch Block Error:', error);
        statusMessage.textContent = 'An error occurred during simulation.';
        showError(`${error.message}. Check console and backend logs.`);
        loadingIndicator.classList.add('hidden');
        resultDisplay.textContent = 'Error';
        highlightState(null); // Clear SVG highlight on fetch error
    } finally {
        enableControls(true); // Re-enable controls
    }
}

function enableControls(enable) {
    simulateButton.disabled = !enable;
    resetButton.disabled = !enable;
    inputString.disabled = !enable;
    dfaSelect.disabled = !enable;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function clearHighlights() {
    const highlighted = sequenceDisplay.querySelector('.highlight');
    if (highlighted) {
        highlighted.classList.remove('highlight');
    }
}

// Simple sleep function for async/await delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateSequence(sequence) {
    sequenceDisplay.innerHTML = ''; // Clear previous display
    const stepElements = []; // Store references to step elements

     // First, render all steps without highlight
    sequence.forEach((state, index) => {
        const stepSpan = document.createElement('span');
        stepSpan.classList.add('state-step');
        stepSpan.textContent = state;
        stepSpan.dataset.index = index; // Store index if needed
        sequenceDisplay.appendChild(stepSpan);
        if (index < sequence.length - 1) {
             sequenceDisplay.appendChild(document.createTextNode(' → ')); // Add arrows between steps
        }
        stepElements.push(stepSpan); // Store the element
    });


    // Now, animate the highlight
    for (let i = 0; i < stepElements.length; i++) {
        clearHighlights(); // Remove highlight from previous step

        const currentStateElement = stepElements[i];
        const stateValue = sequence[i];

        // Stop highlighting if we hit a rejection marker from backend
         if (typeof stateValue === 'string' && stateValue.startsWith('REJECT_STATE')) {
             currentStateElement.style.color = '#dc3545'; // Make rejection markers red
             currentStateElement.style.fontWeight = 'bold';
             statusMessage.textContent = `Simulation stopped: ${stateValue}`;
             break; // Stop animation
         }

        currentStateElement.classList.add('highlight');
        // currentVisState.textContent = stateValue; // Update simple visualization if used
        statusMessage.textContent = `Processing... Current state: ${stateValue}`; // Update status

        await sleep(10); // Adjust animation speed (milliseconds)
    }

     statusMessage.textContent = `Simulation complete. Final state shown. Result: ${resultDisplay.textContent}`;
}
const svgVisualization = document.getElementById('dfa-visualization');

// --- DFA Structure Definitions (Manual Layout) ---
const dfaLayouts = {
    bets_dfa: {
        states: [
            { id: 0, cx: 50, cy: 200, isStart: true }, { id: 1, cx: 150, cy: 100 },
            { id: 2, cx: 150, cy: 300 }, { id: 3, cx: 250, cy: 100 },
            { id: 4, cx: 250, cy: 300 }, { id: 5, cx: 350, cy: 50 },
            { id: 6, cx: 350, cy: 150 }, { id: 7, cx: 350, cy: 350, isTrap: true },
            { id: 8, cx: 450, cy: 50, isTrap: true },  { id: 9, cx: 450, cy: 150 },
            { id: 10, cx: 450, cy: 250 }, { id: 11, cx: 550, cy: 200 },
            { id: 12, cx: 550, cy: 300, isFinal: true },
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
        // --- Layout for stars_dfa (States 0-22) - VERIFY/ADJUST COORDINATES ---
        states: [
             // Row 0
             { id: 0, cx: 50,  cy: 50, isStart: true }, { id: 1, cx: 150, cy: 50 },
             { id: 2, cx: 250, cy: 50 }, { id: 3, cx: 350, cy: 50 },
             { id: 10, cx: 450, cy: 50, isFinal: true },
             // Row 1
             { id: 5, cx: 100, cy: 125 }, { id: 6, cx: 200, cy: 125 },
             { id: 7, cx: 300, cy: 125 }, { id: 8, cx: 400, cy: 125 },
             { id: 11, cx: 500, cy: 125, isFinal: true },
             // Row 2
             { id: 9,  cx: 50,  cy: 200 }, { id: 12, cx: 150, cy: 200 },
             { id: 13, cx: 250, cy: 200 }, { id: 14, cx: 350, cy: 200 },
             { id: 18, cx: 450, cy: 200, isFinal: true },
             // Row 3
             { id: 15, cx: 100, cy: 275 }, { id: 16, cx: 200, cy: 275 },
             { id: 17, cx: 300, cy: 275 }, { id: 19, cx: 400, cy: 275 },
             { id: 21, cx: 500, cy: 275, isFinal: true },
             // Row 4
             { id: 20, cx: 50,  cy: 350 }, { id: 4,  cx: 150, cy: 350, isTrap: true },
             { id: 22, cx: 250, cy: 350, isFinal: true },
             // State 23 removed
             // { id: 23, cx: 350, cy: 350, isFinal: true }, // Removed
        ],
        // Ensure this list matches your backend stars_dfa definition
        transitions: [
            { from: 0, to: 1, label: '0' }, { from: 0, to: 2, label: '1' },
            { from: 1, to: 5, label: '0' }, { from: 1, to: 3, label: '1' },
            { from: 2, to: 5, label: '0,1' }, { from: 3, to: 6, label: '0' },
            { from: 3, to: 4, label: '1' },   { from: 4, to: 4, label: '0,1' },
            { from: 5, to: 4, label: '0' }, { from: 5, to: 6, label: '1' },
            { from: 6, to: 7, label: '0,1' }, { from: 7, to: 9, label: '0' },
            { from: 7, to: 8, label: '1' },   { from: 8, to: 9, label: '0' },
            { from: 8, to: 12, label: '1' },  { from: 9, to: 12, label: '0' },
            { from: 9, to: 8, label: '1' },   { from: 10, to: 10, label: '0' },
            { from: 10, to: 11, label: '1' }, { from: 11, to: 22, label: '0' },
            { from: 11, to: 12, label: '1' }, { from: 12, to: 9, label: '0' },
            { from: 12, to: 17, label: '1' }, { from: 13, to: 15, label: '0' },
            { from: 13, to: 8, label: '1' },  { from: 14, to: 10, label: '0' },
            { from: 14, to: 11, label: '1' }, { from: 15, to: 14, label: '0' },
            { from: 15, to: 16, label: '1' }, { from: 16, to: 22, label: '0' },
            { from: 16, to: 12, label: '1' }, { from: 17, to: 20, label: '0' },
            { from: 17, to: 19, label: '1' }, { from: 18, to: 15, label: '0' },
            { from: 18, to: 8, label: '1' },  { from: 19, to: 19, label: '1' },
            { from: 20, to: 18, label: '0' },
            { from: 20, to: 21, label: '1' }, { from: 21, to: 9, label: '0' },
            { from: 21, to: 12, label: '1' }, { from: 22, to: 13, label: '0' },
            { from: 22, to: 8, label: '1' },
        ]
    }
};

const STATE_RADIUS = 15; // Radius of state circles

// --- SVG Namespace ---
const SVG_NS = "http://www.w3.org/2000/svg";

dfaSelect.addEventListener('change', handleDfaChange);

// --- Functions ---

function handleDfaChange() {
    const selectedDfa = dfaSelect.value;
    console.log(`DFA changed to: ${selectedDfa}`);
    drawDFA(selectedDfa); // Redraw SVG
    handleReset(); // Reset simulation state
}

function handleReset() {
    inputString.value = '';
    statusMessage.textContent = 'Enter a string and click Simulate.';
    resultDisplay.textContent = '-';
    sequenceDisplay.innerHTML = '';
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    loadingIndicator.classList.add('hidden');
    highlightState(null); // Remove highlight from SVG state
    enableControls(true);
    console.log('Form reset.');
}

function drawDFA(dfaType) {
    const layout = dfaLayouts[dfaType];
    if (!layout) {
        console.error("Invalid DFA type for layout:", dfaType);
        svgVisualization.innerHTML = '<text x="10" y="20" fill="red">Error: DFA layout not found.</text>';
        return;
    }

    svgVisualization.innerHTML = ''; // Clear previous SVG content

    // 1. Define Arrowhead Marker
    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('viewBox', '-0 -5 10 10');
    marker.setAttribute('refX', 10); // Adjust based on circle radius + desired gap
    marker.setAttribute('refY', 0);
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerWidth', 5); // Size of arrowhead
    marker.setAttribute('markerHeight', 5);
    marker.setAttribute('xoverflow', 'visible');
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', '0,-5 10,0 0,5');
    poly.setAttribute('fill', '#6c757d'); // Arrow color
    marker.appendChild(poly);
    defs.appendChild(marker);
    svgVisualization.appendChild(defs);

    // 2. Draw Transitions (draw lines first, so circles are on top)
    const stateCoords = {}; // Helper to quickly find state coords
    layout.states.forEach(s => { stateCoords[s.id] = { cx: s.cx, cy: s.cy }; });

    layout.transitions.forEach(t => {
        const fromState = stateCoords[t.from];
        const toState = stateCoords[t.to];
        if (!fromState || !toState) return; // Skip if state coords missing

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'transition-path');
        path.setAttribute('marker-end', 'url(#arrowhead)'); // Add arrowhead

        let pathD, labelX, labelY, labelRotate = 0;
        const midX = (fromState.cx + toState.cx) / 2;
        const midY = (fromState.cy + toState.cy) / 2;
        const dx = toState.cx - fromState.cx;
        const dy = toState.cy - fromState.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx); // Angle for label rotation/positioning

         // Offset for label perpendicular to line
        const labelOffset = 8; // How far the label is from the line
        labelX = midX + labelOffset * Math.sin(angle);
        labelY = midY - labelOffset * Math.cos(angle);


        if (t.from === t.to) { // Self Loop
            const loopRadius = 20;
            const loopStartX = fromState.cx;
            const loopStartY = fromState.cy - STATE_RADIUS; // Start top of circle
            pathD = `M ${loopStartX},${loopStartY} A ${loopRadius},${loopRadius} 0 1 1 ${fromState.cx + STATE_RADIUS * 0.1},${fromState.cy - STATE_RADIUS}`; // Approximate arc
             // Adjust marker refX for self-loops if needed, or place label carefully
             labelX = fromState.cx + loopRadius * 1.2;
             labelY = fromState.cy - loopRadius * 1.2;
             // Modify marker refX for self loops if the arrow looks bad
             marker.setAttribute('refX', 5); // Smaller refX for self-loop arrow
        } else {
            // Straight line - calculate start/end points on circle edge
            const startX = fromState.cx + STATE_RADIUS * Math.cos(angle);
            const startY = fromState.cy + STATE_RADIUS * Math.sin(angle);
             // Subtract radius * vector for end point to avoid overlap
             const endX = toState.cx - STATE_RADIUS * Math.cos(angle);
             const endY = toState.cy - STATE_RADIUS * Math.sin(angle);

            pathD = `M ${startX},${startY} L ${endX},${endY}`;
             marker.setAttribute('refX', 5); // Reset marker refX for straight lines
             // Check if there's a reverse path to add a curve
             const hasReverse = layout.transitions.some(rev => rev.from === t.to && rev.to === t.from);
             if(hasReverse && t.from < t.to) { // Only curve one way for pairs
                  pathD = `M ${startX},${startY} Q ${(midX + midY*0.2 - fromState.cy*0.2)},${(midY - midX*0.2 + fromState.cx*0.2)} ${endX},${endY}`; // Basic quadratic curve
             }
        }
        path.setAttribute('d', pathD);
        svgVisualization.appendChild(path);

         // Add Transition Label
         const label = document.createElementNS(SVG_NS, 'text');
         label.setAttribute('x', labelX);
         label.setAttribute('y', labelY);
         // label.setAttribute('transform', `rotate(${labelRotate}, ${labelX}, ${labelY})`); // Optional rotation
         label.setAttribute('class', 'transition-label');
         label.textContent = t.label;
         svgVisualization.appendChild(label);
    });


    // 3. Draw States and Labels (on top of lines)
    layout.states.forEach(state => {
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('id', `state-${state.id}`); // Assign ID for highlighting
        circle.setAttribute('cx', state.cx);
        circle.setAttribute('cy', state.cy);
        circle.setAttribute('r', STATE_RADIUS);
        circle.classList.add('state-circle');
        if (state.isStart) circle.classList.add('start-state');
        if (state.isFinal) circle.classList.add('final-state');
        if (state.isTrap) circle.classList.add('trap-state');
        svgVisualization.appendChild(circle);

        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('x', state.cx);
        label.setAttribute('y', state.cy);
        label.classList.add('state-label');
        if (state.isFinal) label.classList.add('final-state-label');
        if (state.isTrap) label.classList.add('trap-state-label');
        label.textContent = `q${state.id}`; // Or just state.id
        svgVisualization.appendChild(label);
    });
}

// --- NEW highlightState Function ---
function highlightState(stateId) {
    // Remove highlight from previously highlighted state
    const currentHighlighted = svgVisualization.querySelector('.state-circle.highlight');
    if (currentHighlighted) {
        currentHighlighted.classList.remove('highlight');
    }

    // Add highlight to the new state if stateId is valid
    if (stateId !== null && stateId !== undefined) {
        // Construct the ID used in drawDFA
        const elementId = `state-${stateId}`;
        const stateElement = svgVisualization.querySelector(`#${elementId}`);
        if (stateElement) {
            stateElement.classList.add('highlight');
        } else {
            console.warn(`SVG element not found for state ID: ${elementId}`);
        }
    }
}


// --- Modify animateSequence Function ---
async function animateSequence(sequence) {
    sequenceDisplay.innerHTML = ''; // Clear previous display
    const stepElements = [];

    // First, render all steps in the text sequence display
    sequence.forEach((state, index) => {
        const stepSpan = document.createElement('span');
        stepSpan.classList.add('state-step');
        stepSpan.textContent = state;
        stepSpan.dataset.index = index;
        sequenceDisplay.appendChild(stepSpan);
        if (index < sequence.length - 1) {
             sequenceDisplay.appendChild(document.createTextNode(' → '));
        }
        stepElements.push(stepSpan);
    });

    // Now, animate the SVG highlight and text highlight
    let lastValidState = null; // Keep track of the last non-marker state
    for (let i = 0; i < stepElements.length; i++) {
        const currentStateElement = stepElements[i]; // Text span element
        const stateValue = sequence[i];

        highlightState(null); // Clear SVG highlight explicitly

         // Stop highlighting if we hit a rejection marker from backend
         if (typeof stateValue === 'string' && stateValue.startsWith('REJECT_STATE')) {
             currentStateElement.style.color = '#dc3545';
             currentStateElement.style.fontWeight = 'bold';
             statusMessage.textContent = `Simulation stopped: ${stateValue}`;
             // Optionally re-highlight the last valid state in SVG
             if(lastValidState !== null) highlightState(lastValidState);
             break;
         }

        // If it's a valid state, update SVG highlight and store it
        highlightState(stateValue); // Highlight current state in SVG
        lastValidState = stateValue; // Remember this state

        // Highlight the text sequence step
        currentStateElement.classList.add('highlight');
        statusMessage.textContent = `Processing... Current state: ${stateValue}`;

        await sleep(400); // Animation speed

         // Remove highlight from text step before moving to next
         currentStateElement.classList.remove('highlight');
    }

     // After loop, ensure final state (or last valid state before rejection) remains highlighted in SVG
     highlightState(lastValidState);
     statusMessage.textContent = `Simulation complete. Final state shown. Result: ${resultDisplay.textContent}`;
}

// --- Initial setup on page load ---
handleReset(); // Reset form
drawDFA(dfaSelect.value); 
console.log('DFA Simulator script loaded.');

