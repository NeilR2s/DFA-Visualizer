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

1. **Clone the repository:**
   ```
   git clone https://github.com/NeilR2s/DFA-Visualizer.git
   cd DFA-Visualizer/backend
   ```
2. **Install the required packages:**
   ```
   pip install -r requirements.txt
   ```
## Running the app

1. **Running Locally**
   ```
   python app.py (python3 app.py on Linux) 
   ```
2. **or visit the website**
  ```
  https://nr2s.pythonanywhere.com/
  ```

   
