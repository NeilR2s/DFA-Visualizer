from flask import Flask, request, jsonify
from dfa_logic import DFA
import pathlib
import logging.config
import logging.handlers
import json

# dunno if there is a better way to do this, but minimal setup should work for now
logger = logging.getLogger('app')
app = Flask(__name__)

def logger_setup():
    config_file = pathlib.Path('logs/config.json')
    with open(config_file) as config_write:
        config = json.load(config_write)
    logging.config.dictConfig(config)

logger_setup()

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
    logger.info(f'Bets DFA Compiled Successfully.')
except Exception as e:
    logger.error(f'Error Compiling Bets DFA. Please adhere to the formatting specified by the docstrings: {e}')

stars_states = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24}
stars_alphabet = {'0','1'}
stars_transitions = {
    0:{'0': 1, '1':2},
    1:{'0': 5, '1':3},
    2:{'0': 5, '1':5},
    3:{'0': 6, '1':4},
    4:{'0': 4, '1':4},
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
    logger.info('Stars DFA compiled successfully.')
except Exception as e:
    logger.error(f'Error Compiling Stars DFA. Please adhere to the formatting specified by the docstrings: {e}')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/simulate-dfa', methods = ['POST'])
def simulate_dfa():
    if not request.is_json:
        logger.warning('Request is not a JSON object.')
        return jsonify({'error': 'Invalid request format: must be a JSON object.'}), 415
    try:
        simulation_data = request.get_json()
        if not simulation_data:
            return jsonify({'error': 'No JSON object recieved.'}), 400
        
        dfa_type = simulation_data.get('dfa_type')
        dfa_input = simulation_data.get('dfa_input')

        if dfa_type == None or dfa_input == None:
            logger.error(f'Missing dfa_type or dfa_input in simulation data')
            return jsonify({'error': 'Missing DFA type or DFA input in JSON object'}), 400

        dfa_type_str = str(dfa_type)       
        dfa_input_str = str(dfa_input)

        logger.info(f'Recieved dfa input type {dfa_type_str}')
        logger.info(f'Recieved dfa input type {dfa_input_str}')

        if dfa_type_str == 'bets_dfa':
            response_data = bets_dfa.simulate(dfa_input_str)

        elif dfa_type_str == 'stars_dfa':
            response_data = stars_dfa.simulate(dfa_input_str)
        else: 
            logger.error('Invalid DFA type recieved')
            return jsonify({'error': f'Invalid DFA type {dfa_type_str}: must be bets_dfa or stars_dfa' }), 400
        
        logger.info(f'Response data for {dfa_type_str}: {response_data}')
        return jsonify(response_data), 200
    except Exception as e:
        logger.error(f'An unexpected error occured during simulation: {e}', exc_info=True)
        return jsonify({'error': f'Internal Server Error: An unexpected error occured during simulation: '}),500
        
if __name__ == '__main__':
    app.run(debug=True, port=5500)
