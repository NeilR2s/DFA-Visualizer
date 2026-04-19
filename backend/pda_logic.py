from collections import deque
import logging

logger = logging.getLogger(__name__)

class PDA:
    """Class for simulating a Pushdown Automaton using Breadth-First-Search."""
    
    def __init__(self, states: set[int], input_alphabet: set[str], stack_alphabet: set[str], 
                 transitions: dict, start_state: int, initial_stack: str, final_states: set[int]):
        """
        transitions structure:
        {
           state: {
               input_symbol_or_epsilon: {
                   stack_top_symbol: [ (next_state, [symbols_to_push]) ]
               }
           }
        }
        """
        self.states = states
        self.input_alphabet = input_alphabet
        self.stack_alphabet = stack_alphabet
        self.transitions = transitions
        self.start_state = start_state
        self.initial_stack = initial_stack
        self.final_states = final_states

    def simulate(self, input_string: str) -> dict:
        """
        Simulate the PDA on the input string.
        Since PDAs can be non-deterministic, we use BFS to explore paths.
        Each configuration is: (current_state, consumed_length, stack_list)
        History tracks the progression of states and stack for visualization.
        """
        # initial queue element: (state, index_of_input, stack, history_sequence)
        queue = deque([(self.start_state, 0, [self.initial_stack], [])])
        visited_states = set()  # To avoid infinite epsilon loops without stack growth
        max_steps = 1000
        steps = 0
        
        longest_error_path = []
        longest_index = 0

        while queue and steps < max_steps:
            steps += 1
            current_state, input_idx, current_stack, history = queue.popleft()
            
            # Format configuration for frontend animation or logging
            stack_view = current_stack.copy()
            # The frontend script.js animatePDA will want the "state_sequence" 
            # and potentially stack states. To simplify and align with DFA visualization, 
            # we'll record the state visited at each step.
            new_history = history + [{
                'state': current_state,
                'stack': stack_view,
                'consumed': input_string[:input_idx],
                'remaining': input_string[input_idx:]
            }]

            # Check acceptance (by final state and end of input)
            if input_idx == len(input_string) and current_state in self.final_states:
                return {
                    'input': input_string,
                    'accepted': True,
                    'sequence': new_history,
                    'error': None
                }

            if input_idx > longest_index:
                longest_index = input_idx
                longest_error_path = new_history

            # Determine available transitions
            state_trans = self.transitions.get(current_state, {})
            # Look at transitions for current input symbol
            available_transitions = []
            
            stack_top = current_stack[-1] if current_stack else 'ε'
            
            if input_idx < len(input_string):
                current_char = input_string[input_idx]
                # Match symbol and stack
                for next_st, pushes in state_trans.get(current_char, {}).get(stack_top, []):
                    available_transitions.append(('match', current_char, next_st, pushes))
                # Match symbol and epsilon stack (ignore stack)
                for next_st, pushes in state_trans.get(current_char, {}).get('ε', []):
                    available_transitions.append(('match_eps_stack', current_char, next_st, pushes))
                    
            # Match epsilon input and top stack
            for next_st, pushes in state_trans.get('ε', {}).get(stack_top, []):
                available_transitions.append(('eps_input', 'ε', next_st, pushes))
            # Match epsilon input and epsilon stack
            for next_st, pushes in state_trans.get('ε', {}).get('ε', []):
                available_transitions.append(('eps_both', 'ε', next_st, pushes))

            # Apply transitions
            for trans_type, consumed_char, next_st, pushes in available_transitions:
                next_stack = current_stack.copy()
                
                # Pop logic
                if trans_type in ('match', 'eps_input') and stack_top != 'ε':
                    if next_stack:
                        next_stack.pop()
                
                # Push logic
                if pushes and pushes != ['ε']:
                    # Usually multiple pushed symbols are pushed right-to-left
                    # So the first element in list is top of stack
                    for push_sym in reversed(pushes):
                        next_stack.append(push_sym)

                next_idx = input_idx + 1 if consumed_char != 'ε' else input_idx
                
                # Cycle check for epsilon transitions
                state_sig = (next_st, next_idx, tuple(next_stack))
                if consumed_char == 'ε' and state_sig in visited_states:
                    continue
                visited_states.add(state_sig)
                
                queue.append((next_st, next_idx, next_stack, new_history))

        # Failed
        return {
            'input': input_string,
            'accepted': False,
            'sequence': longest_error_path or new_history,
            'error': 'Input rejected: no valid path reached an accepting state.'
        }
