import { Chess } from '../chess.js';

document.getElementById('startAnalysis').addEventListener('click', () => {
    const pgn = document.getElementById('pgnInput').value;
    const errorElement = document.getElementById('error');

    if (pgn.trim() === "") {
        errorElement.textContent = "Please paste a PGN to continue.";
        return;
    }

    const chess = new Chess();
    try {
        chess.loadPgn(pgn);
        window.location.href = `index.html?pgn=${encodeURIComponent(pgn)}`;
    } catch (error) {
        errorElement.textContent = "Invalid PGN. Please check your input and try again.";
    }
});