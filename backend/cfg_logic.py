from collections import deque
import logging

logger = logging.getLogger(__name__)

class CFG:
    """Class for simulating a Context-Free Grammar derivation via Leftmost Breadth-First-Search."""
    
    def __init__(self, variables: set[str], terminals: set[str], rules: list[dict], start_symbol: str):
        self.variables = variables
        self.terminals = terminals
        self.rules = rules
        self.start_symbol = start_symbol

    def simulate(self, target_string: str, max_depth: int = 150) -> dict:
        """
        Simulate the CFG and find the leftmost derivation sequence for the target string.
        """
        queue = deque([([self.start_symbol], [])])
        
        while queue:
            current_form, history = queue.popleft()
            
            # Check if all elements are terminals or epsilon
            if not any(symbol in self.variables for symbol in current_form):
                current_str = "".join(s for s in current_form if s != 'ε')
                if current_str == target_string:
                    return {
                        'input': target_string,
                        'accepted': True,
                        'sequence': history + [current_form],
                        'error': None
                    }
                continue 

            if len(history) >= max_depth:
                continue

            # Prefix constraint: Check if the string derived so far matches the start of target
            # Epsilon transitions are filtered out of the prefix.
            derived_prefix = ""
            valid_prefix = True
            for sym in current_form:
                if sym in self.terminals and sym != 'ε':
                    derived_prefix += sym
                elif sym in self.variables:
                    break
            
            # Only prune if the derived string is strictly NOT a prefix of the target
            # e.g. target='ab', derived='ac' -> prune.
            if not target_string.startswith(derived_prefix):
                continue
            
            # Leftmost derivation: find the first non-terminal
            for i, symbol in enumerate(current_form):
                if symbol in self.variables:
                    applicable_rules = [r for r in self.rules if r['from'] == symbol]
                    for rule in applicable_rules:
                        replacement = rule['to'] if rule['to'] != ['ε'] else ['ε']
                        new_form = current_form[:i] + replacement + current_form[i+1:]
                        new_history = history + [current_form]
                        # append to queue
                        queue.append((new_form, new_history))
                    break # Expand leftmost variable only

        # If loop exhausts queue without returning
        return {
            'input': target_string,
            'accepted': False,
            'sequence': [],
            'error': f'Could not derive "{target_string}" or reached max depth limitations.'
        }
