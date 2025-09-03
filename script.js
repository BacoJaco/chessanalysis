import { Chess } from './chess.js'

var board = null;
var currentMoveIndex = 0;
var fenHistory = [];

const pgnInput = document.getElementById('pgn');
const pgnButton = document.getElementById('pgnBtn');

pgnButton.addEventListener('click', boardSetup);

const start = document.getElementById('start'); 
const prev = document.getElementById('prev'); 
const next = document.getElementById('next'); 
const end = document.getElementById('end'); 

start.addEventListener('click', goToStartMove);
next.addEventListener('click', goToNextMove);
prev.addEventListener('click', goToPrevMove);
end.addEventListener('click', goToEndMove);


// Buttons disable if move is not available
function updateButtonStates() {
    start.disabled = currentMoveIndex <= 0;
    prev.disabled = currentMoveIndex <= 0;
    next.disabled = currentMoveIndex >= fenHistory.length - 1;
    end.disabled = currentMoveIndex >= fenHistory.length - 1;
}

function goToNextMove() {
  board.position(fenHistory[currentMoveIndex + 1]);
  currentMoveIndex++;
  updateButtonStates();
}

function goToPrevMove() {
  board.position(fenHistory[currentMoveIndex - 1]);
  currentMoveIndex--;
  updateButtonStates();
}

function goToStartMove() {
  board.position(fenHistory[0]);
  currentMoveIndex = 0;
  updateButtonStates();
}

function goToEndMove() {
  board.position(fenHistory[fenHistory.length - 1]);
  currentMoveIndex = fenHistory.length - 1;
  updateButtonStates();
}

function boardSetup() {
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
