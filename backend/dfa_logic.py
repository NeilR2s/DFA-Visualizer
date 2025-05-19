'''
Kindly follow the Google format for docstrings on this module.
Reference: S.P Eugene Xavier, "Theory of Automata, Formal Languages, and Computation"
'''

class DFA:
    '''Class for compiling, simulating, and validating the DFA'''
    def __init__(self, states: set[int], alphabet: set[str], transitions: dict[int,dict[str,int]], start_state:int, final_states: set[int], trap_states: set[int]):
        '''
        Class setter for passed parameters (WITH validation).   

        Args:
            states (set): The set of all states (e.g., {0, 1, 2, 3}).
            alphabet (set): The set of input symbols (e.g., {'0', '1'})
            transitions (dict): The transition function represented as a nested dictionary >> `{state_from: {symbol: state_to,...}, ...}`
            start_state(int): The starting state (must be one of the states).
            final_states (set): A set of final states (must be a subset of states).
            trap_states (set):  A set of trap states (reject immediately).
        
        Returns:
            out: Sets the parameters for the class

        Exceptions:
            Value Error: Error compiling the structure due failure to meet the definition of a DFA.  
        '''
        if start_state not in states or start_state is None:
            raise ValueError(f'Start state "{start_state}" is not in the set of states.')

        if not states:
            raise ValueError('The states of a valid DFA cannot be empty.')

        if not final_states.issubset(states) or final_states is None:
            raise ValueError('Final states must be a subset of the defined states.')

        if not trap_states.issubset(states):
            raise ValueError('Trap states must be a subset of the defined states.')

        if not alphabet:
            raise ValueError('The alphabet of a valid DFA cannot be null.')

        if not isinstance(start_state, int) and start_state>=0:
            raise ValueError('A valid DFA must specify a start state greater than 0.')

        if not isinstance(transitions, dict):
            raise TypeError(f"Transitions must be a dictionary, not {type(transitions)}.")

        for state, paths in transitions.items():
            if state not in states:
                raise ValueError(f"Transition defined for an unknown source state: '{state}'.")
            if state not in transitions:
                raise ValueError('State {state} is not defined as a transition.')
            if not isinstance(paths, dict):
                raise TypeError(f"Transitions for state '{state}' should be a dictionary, not {type(paths)}.")
            if state not in final_states:
                for symbol in alphabet:
                    if symbol not in transitions[state]:
                        raise ValueError(f'Missing transition for state "{state}" and symbol "{symbol}". A DFA must have a defined transition for every state-symbol pair (or use a trap state).')

            for symbol, state_pointer in paths.items():
                if symbol not in alphabet:
                    raise ValueError(f"Transition from state '{state}' uses symbol '{symbol}' not in alphabet {alphabet}.")
                if state_pointer not in states:
                    raise ValueError(f"Transition from state '{state}' on symbol '{symbol}' leads to an unknown destination state: '{state_pointer}'.")

        for trap in trap_states:
            if trap in transitions:
                for symbol in alphabet:
                    if symbol in transitions[trap]:
                        if transitions[trap][symbol] != trap: 
                           raise ValueError(f"Transitions not defined for trap state '{trap}'.")

        self.states:set = states
        self.alphabet:set = alphabet
        self.transitions:dict = transitions
        self.start_state:int = start_state
        self.final_states: set = final_states
        self.trap_states: set = trap_states

    def simulate(self, input_string: str) -> dict:
        '''
        Simulates the DFA on the given input string.

        Parameters:
            input_string (str): User input string to process.

        Returns:
            out: dict
        '''
        current_state = self.start_state
        state_sequence = []
        state_sequence.append(current_state)
        error_message = None
        is_accepted = False

        # unsure if this covers all cases and edge cases, need more testing 

        for symbol in input_string:

            if symbol not in self.alphabet:
                state_sequence.append('REJECT_STATE_INVALID_SYMBOL')
                error_message = str(f'Simulation Error: Symbol "{symbol}" not in alphabet {self.alphabet}.')
                break
            
            state_transitions = self.transitions.get(current_state)

            if state_transitions is None:
                state_sequence.append('REJECT_STATE_NO_TRANSITION')
                error_message = str(f'Simulation Error: State "{current_state}" has no defined transitions.')
                break

            next_state = state_transitions.get(symbol)

            if next_state is None or next_state not in self.states:
                state_sequence.append('REJECT_STATE_INVALID_TARGET')
                error_message = str(f'Simulation Error: "{next_state}" has no defined state transition. Set a valid state transition for all cases, and define all states.')
                break

            current_state = next_state
            state_sequence.append(current_state)

            if current_state in self.trap_states:
                state_sequence.append('REJECT_STATE_TRAP_STATE')
                error_message = str(f'Simulation Error: Transition leads to trap state {next_state}.')
                break    

        if error_message is None:
            is_accepted = current_state in self.final_states


        return {
            'input': input_string,
            'final_state': current_state,
            'accepted': is_accepted,
            'state_sequence': state_sequence,
            'error': error_message
        }


    def dfa_properties(self) -> dict:
        '''
        Packs all info about the DFA in a dictionary.

        Parameters: None
        Returns:
            A dictionary containing the compiled DFA metadata.
        '''
        return {
            'states': sorted(list(self.states)), 
            'alphabet': sorted(list(self.alphabet)),
            'transitions': self.transitions,
            'start_state': self.start_state,
            'final_states': sorted(list(self.final_states)),
            'trap_states': sorted(list(self.trap_states))
        }


if __name__ == '__main__':


    bets_states = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
    bets_alphabet = {'a', 'b'}
    bets_transitions = {
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
    bets_start = 0
    bets_final = {12}
    bets_trap = {7, 8}

    try:
        bets_dfa = DFA(
            states=bets_states,
            alphabet=bets_alphabet,
            transitions=bets_transitions,
            start_state=bets_start,
            final_states=bets_final,
            trap_states=bets_trap
            )
        print('Bets DFA Compiled Successfully.')
    except Exception as e:
        print(f'Error Compiling Bets DFA. Please adhere to the formatting specified by the docstrings: {e}')


    stars_states = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23}
    stars_alphabet = {'0','1'}
    stars_transitions = {
        0:{'0': 1, '1':2},
        1:{'0': 5, '1':3},
        2:{'0': 5, '1':5},
        3:{'0': 6, '1':4},
        4:{'0': 4, '1':4}, # TRAP
        5:{'0': 4, '1':6},
        6:{'0': 7, '1':7},
        7:{'0': 9, '1':8},
        8:{'0': 9, '1':12},
        9:{'0': 12, '1':8},
        10:{'0': 10, '1':11},
        11:{'0': 22, '1':12},
        12:{'0': 9, '1':17},
        13:{'0': 15, '1':8},
        14:{'0': 10, '1':11},
        15:{'0': 14, '1':16},
        16:{'0': 22, '1':12},
        17:{'0': 20, '1':19},
        18:{'0': 15, '1':8},
        19:{'0': 23, '1':19}, 
        20:{'0': 18, '1':21},
        21:{'0': 9, '1':12},
        22:{'0': 13, '1':8},
        23:{'0': 18, '1':21},
        }
    stars_start = 0
    stars_final = {10, 11, 18, 21, 22, 23}
    stars_trap = {4}

    try :
        stars_dfa = DFA(
            states = stars_states,
            alphabet = stars_alphabet,
            transitions= stars_transitions,
            start_state= stars_start,
            final_states= stars_final,
            trap_states= stars_trap 
        )
        print('Stars DFA compiled successfully.')
    except Exception as e:
        print(f'Error Compiling Stars DFA. Please adhere to the formatting specified by the docstrings: {e}')


    print('--- DFA Compiler CLI Mockup ---') 
    print('select a predifined automaton or type "exit" to exit program')
    while True:
        print('1. (111 + 101 + 001 + 010) (1 + 0 + 11)(1 + 0 + 11)* (111 + 000) (111 + 000)* (01 + 10 + 00)')
        print('2. (aa + bb + aba + ba) (aba + bab + bbb) (a + b)* (a + b + aa + abab) (aa + bb)*')
        choice = int(input('>> Choose a DFA to simulate: '))
        word = str(input('>> Enter a word to validate : '))
        if choice == 1:
            print(stars_dfa.simulate(word))
        if  choice == 2: 
            print(bets_dfa.simulate(word))
        if word.lower() == 'exit':
            exit()
        
    



