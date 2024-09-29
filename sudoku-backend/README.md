# sudoku-backend

`sudoku-backend` is a server-side application for generating and caching Sudoku puzzles of varying difficulty levels. It supports HTTP requests to fetch Sudoku puzzles, utilizing caching mechanisms to improve performance.

## Features

- Generate Sudoku puzzles with different difficulty levels.
- Cache puzzles to improve response times for repeated requests.

## Structure

- **cache.ts**: Handles caching of generated Sudoku puzzles to improve performance.
- **handler.ts**: Manages HTTP requests and responses, fetching cached puzzles, or generating new ones as needed.
- **sudokuGenerator.ts**: Logic for generating complete Sudoku grids and adjusting them based on specified difficulty.
- **dlxSolver.ts**: Uses `fast-sudoku-solver` to validate puzzles and ensure they can be solved uniquely.
- **types.ts**: Type definitions used across the backend, such as the `SudokuPuzzle` interface.

## Installation

Use the following steps to set up the project:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sudoku-backend
   ```
2. Install dependencies:
   ```bash
    yarn install
   ```
## Usage
Run the server using the command:
    ```bash
    yarn start
    ```
The server listens for HTTP requests to generate or fetch Sudoku puzzles. The difficulty level can be specified as a query parameter.

## API

- **GET `/sudoku?puzzle?difficulty=<level>`**: Fetch a Sudoku puzzle of the specified difficulty level (1 to 10).

  - **difficulty**: An integer from 1 to 10 indicating the puzzle's difficulty.
Returns a JSON object containing the generated Sudoku puzzle.

## Contributing
Contributions are welcome! Please ensure any pull requests are well-documented and adhere to the project's coding standards.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

