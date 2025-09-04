import { Chess } from './chess.js'

var board = null;
var currentMoveIndex;
var fenHistory = [];

const pgnInput = document.getElementById('pgn');
const pgnButton = document.getElementById('pgnBtn');

pgnButton.addEventListener('click', boardSetup);

const start = document.getElementById('start'); 
const prev = document.getElementById('prev'); 
const next = document.getElementById('next'); 
const end = document.getElementById('end'); 

start.addEventListener('click', () => goToMove(0));
next.addEventListener('click', () => goToMove(currentMoveIndex + 1));
prev.addEventListener('click', () => goToMove(currentMoveIndex - 1));
end.addEventListener('click', () => goToMove(fenHistory.length - 1));

function boardSetup() {
  currentMoveIndex = 0;

  // A chess instance for getting the move history
  const chessForPGN = new Chess();

  const pgn = pgnInput.value;
  chessForPGN.loadPgn(pgn);

  const moves = chessForPGN.history();

  // A second chess instance for replaying the game move by move
  const chessForReplay = new Chess();

  // An array to store the FEN at each step
  fenHistory = [];
  fenHistory.push(chessForReplay.fen());
  moves.forEach(move => {
    chessForReplay.move(move);
    // Add the FEN of the new position to our array
    fenHistory.push(chessForReplay.fen());
  });

  var config = {
    draggable: false,
    position: fenHistory[0]
  }

  board = Chessboard('board', config);

  updateButtonStates();
}

// Buttons disable if move is not available
function updateButtonStates() {
    start.disabled = currentMoveIndex <= 0;
    prev.disabled = currentMoveIndex <= 0;
    next.disabled = currentMoveIndex >= fenHistory.length - 1;
    end.disabled = currentMoveIndex >= fenHistory.length - 1;
}

// Buttons moves
function goToMove(moveNum) {
  board.position(fenHistory[moveNum]);
  getBestMove({ fen: fenHistory[moveNum], depth: 20, variants: 1 }).then((data) => {
    console.log(data);
    printBestMove(data);
    printMate(data);
  });
  currentMoveIndex = moveNum;
  updateButtonStates();
}

// Fetch response from API
async function getBestMove(data = {}) {
    const response = await fetch("https://chess-api.com/v1", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    });
    return response.json();
}

// Shows how many moves until mate, if possible
function printMate(data) {
  if(data.mate != null) {
    document.getElementById("mateIn").innerText = "Mate: In " + data.mate;
  } else {
    document.getElementById("mateIn").innerText = "Mate: Not Available";
  }
}

// Prints the best move
function printBestMove(data) {
  if(data.type == "error") {
    document.getElementById("bestMove").innerText = "Best Move: Not Available";
  } else {
    document.getElementById("bestMove").innerText = "Best Move: " + data.text;
  }
}
