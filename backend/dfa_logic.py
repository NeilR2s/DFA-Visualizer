class DFA:

    def __init__(self, states: set, alphabet: set, transitions: dict, start_state, final_states: set, trap_states: set):
        '''
        Logic for building a DFA.

        Parameters:
            states (set): The set of all states (e.g., {0, 1, 2, 3}).
            alphabet (set): The set of input symbols (e.g., {'0', '1'} or {'a', 'b'}).
            transitions (dict): The transition function represented as a nested dictionary:
                                {state_from: {symbol: state_to,...}, ...}
            start_state: The starting state (must be one of the states).
            final_states (set): A set of final states (must be a subset of states).
            trap_states (set):  A set of trap states (reject immediately).
        
        Returns:
            out: None
        '''
        if start_state not in states:
            raise ValueError(f'Start state "{start_state}" is not in the set of states.') # basic guards for fast validation, plz help write more tests  
        if not final_states.issubset(states):
            raise ValueError('Final states must be a subset of the states.')

        self.states = states
        self.alphabet = alphabet
        self.transitions = transitions 
        self.start_state = start_state
        self.final_states = final_states
        self.trap_states = trap_states

    def simulate(self, input_string: str) -> tuple[bool, list]:
        '''
        Simulates the DFA on the given input string.

        Paremeters:
            input_string (str): User input string to process.

        Returns:
            out: None
        '''
        current_state = self.start_state
        state_sequence = [current_state]

        # unsure if this covers all cases and edge cases, need more testing 

        for symbol in input_string:
            if symbol not in self.alphabet:
                print(f'Simulation Error: Symbol "{symbol}" not in alphabet {self.alphabet}.')
                state_sequence.append('REJECT_STATE_INVALID_SYMBOL')

            state_transitions = self.transitions.get(current_state)

            if state_transitions is None:
                print(f'Simulation Error: State "{current_state}" has no defined transitions.')
                state_sequence.append('REJECT_STATE_NO_TRANSITION')

            next_state = state_transitions.get(symbol)

            if next_state is None:
                print(f'Simulation Error: No transition defined for state "{current_state}" on symbol "{symbol}".')
                state_sequence.append('REJECT_STATE_MISSING_TRANSITION')

            if next_state in self.trap_states:
                print(f'Simulation Error: Transition leads to trap state {next_state}.')
                state_sequence.append('REJECT_STATE_TRAP_STATE')

            if next_state not in self.states:
                 print(f'Internal DFA Error: Transition leads to undefined state "{next_state}".')
                 state_sequence.append('REJECT_STATE_INVALID_TARGET')

            current_state = next_state
            state_sequence.append(current_state)

        is_accepted = current_state in self.final_states

        print(f'Input: "{input_string}", Final State: {current_state}, Accepted: {is_accepted}')
        print(f'State Sequence: {state_sequence}')


    def debug_info(self) -> dict:
        '''
        Packs all info about the DFA in a dictionary.

        Parameters: None
        Returns:
            dict: just print it out bro
        '''
        return {
            'states': sorted(list(self.states)), 
            'alphabet': sorted(list(self.alphabet)),
            'transitions': self.transitions,
            'start_state': self.start_state,
            'final_states': sorted(list(self.final_states))
        }


if __name__ == '__main__':

    # references/bets_dfa.png
    bets_dfa = {
        0: {'a': 2, 'b': 1},
        1: {'a': 3, 'b': 3},               
        2: {'a': 3, 'b': 4},               
        3: {'a': 5, 'b': 6},  
        4: {'a': 3, 'b': 7},  
        5: {'a': 8, 'b': 9},  
        6: {'a': 10, 'b': 10},  
        7: {'a': 7, 'b': 7},    # TRAP
        8: {'a': 8, 'b': 8},    # TRAP
        9: {'a': 11, 'b': 8},  
        10: {'a': 7, 'b': 11},  
        11: {'a': 12, 'b': 12},  
        12: {'a': 12, 'b': 12}
    }

    bets_states = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
    trap_states = {7, 8}

    try:
        my_dfa = DFA(
            states=bets_states,
            alphabet={'a', 'b'},
            transitions=bets_dfa,
            start_state=0,
            final_states={12},
            trap_states=trap_states
        )
        print('DFA Compiled Successfully.')
    except Exception as e:
        print(f'Error Compiling the DFA. Please adhere to the formatting specified by the docstrings: {e}')
    
    print('--- www.bestdfacompiler.netlify.app ---') 
    while True:
        word = str(input('Enter a word to validate : '))
        if word.lower() == 'exit':
            exit()
        accepted = my_dfa.simulate(word)
    



