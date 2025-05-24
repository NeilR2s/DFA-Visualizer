# DFA Visualizer

This is the backend service for **[DFA Visualizer](https://nr2s.pythonanywhere.com/)**, a web-based tool for creating, simulating, and visualizing Deterministic Finite Automata (DFA). Built with Flask, it provides API endpoints DFA operations and serves the frontend application. Flask handles the DFA validation and simulation logic, while Node handles the visualization and parsing of data from Flask.

## Features

- **DFA Simulation**: Processes input strings to determine acceptance by the defined DFA.
- **Visualization Support**: Supplies data structures suitable for frontend visualization.
- **Modular Design**: Separates DFA logic `dfa_logic.py` from Flask application routes `app.py`, you can modify this to fit your own use case.

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node 20 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository:** (*make sure you are at the root folder when you proceed with the rest of the steps*)
   ```
   git clone https://github.com/NeilR2s/DFA-Visualizer.git
   ```
2. **Install the required packages:**
   ```
   pip install -r requirements.txt
   ```
## Running the app

1. **Run it Locally**
   ```
   cd backend (assuming you are still on the root directory)
   python app.py (python3 app.py on Linux)
   ```
   *if you encounter any issues running from the terminal, open your text editor of choice (e.g. VS Code)
     then run  `app.py` from the text editor. Then, visit localhost:8000 on your browser. If there are issues, you can troubleshoot by viewing the logs at `backend/logs/app.log`* :)
2. **[Easy way, no install needed] Visit the Website**
   ```
   https://nr2s.pythonanywhere.com/
   ```

   
