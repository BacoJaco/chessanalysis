import { Chess } from './chess.js'

var board = null;
var contBoard = null;
var currentMoveIndex;
var contMoveIndex;
var fenHistory = [];
var contFenHistory = [];
var moves = [];

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
  try {
    chessForPGN.loadPgn(pgn);
  } catch (error) {
    alert("Invalid PGN");
    return;
  }

  moves = chessForPGN.history();

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
  contStart.disabled = true;
  contPrev.disabled = true;
  contNext.disabled = true;
  contEnd.disabled = true;
}

// Buttons disable if move is not available
function updateButtonStates() {
    start.disabled = currentMoveIndex <= 0;
    prev.disabled = currentMoveIndex <= 0;
    next.disabled = currentMoveIndex >= fenHistory.length - 1;
    end.disabled = currentMoveIndex >= fenHistory.length - 1;
}

// Buttons moves
async function goToMove(moveNum) {
  console.log(moveNum);
  var prevEval;
  board.position(fenHistory[moveNum]);
  if(moveNum > 1) {
    const data = await getBestMove({ fen: fenHistory[moveNum - 1], depth: 20, variants: 1 })
    console.log(data);
    prevEval = data.eval;
  }
  console.log(prevEval);
  const data = await getBestMove({ fen: fenHistory[moveNum], depth: 20, variants: 1 })
  console.log(data);
  if(moveNum > 1) showMoveType(data.eval, prevEval, moveNum);
  printBestMove(data);
  printMate(data);

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
  if(data.mate != null) document.getElementById("mateIn").innerText = "Mate: In " + data.mate;
  else document.getElementById("mateIn").innerText = "Mate: Not Available";
}

function showMoveType(currEval, prevEval, moveNum) {
  var evalChange = Math.abs(currEval - prevEval);
  var movePlayed
  console.log(moveNum);
  movePlayed = moves[moveNum - 1];

  if(evalChange == 0) document.getElementById("moveType").innerText = "Move EVAL: " + movePlayed + " was Best";
  if(evalChange > 0 && evalChange <= 0.2) document.getElementById("moveType").innerText = "Move EVAL: " + movePlayed + " was Excellent";
  if(evalChange > 0.2 && evalChange <= 0.5) document.getElementById("moveType").innerText = "Move EVAL: " + movePlayed + " was Good";
  if(evalChange > 0.5 && evalChange <= 2) document.getElementById("moveType").innerText = "Move EVAL: " + movePlayed + " was an Inaccuracy";
  if(evalChange > 2 && evalChange <= 5) document.getElementById("moveType").innerText = "Move EVAL: " + movePlayed + " was a Mistake";
  if(evalChange > 5) document.getElementById("moveType").innerText = "Move EVAL: " + movePlayed + " was a Blunder";

}

// Prints the best move
function printBestMove(data) {
  if(data.type == "error") document.getElementById("bestMove").innerText = "Best Move: Not Available";
  else document.getElementById("bestMove").innerText = "Best Move: " + data.text;
}

const continuation = document.getElementById('continuationBtn');

continuation.addEventListener('click', () => getBestMove( { fen: fenHistory[currentMoveIndex], depth: 20, variants: 1} ).then((data) => {
  continuationBoardSetup(data.lan, data.continuationArr);
}));

const contStart = document.getElementById('contStart');
const contPrev = document.getElementById('contPrev');
const contNext = document.getElementById('contNext');
const contEnd = document.getElementById('contEnd');

contStart.addEventListener('click', () => goToContMove(0));
contNext.addEventListener('click', () => goToContMove(contMoveIndex + 1));
contPrev.addEventListener('click', () => goToContMove(contMoveIndex - 1));
contEnd.addEventListener('click', () => goToContMove(contFenHistory.length - 1));

function continuationBoardSetup(bestMove, posArr) {
  contMoveIndex = 0;
  const chessForCont = new Chess();

  for(var i = 0; i < currentMoveIndex; i++) {
    chessForCont.move(moves[i]);
  }

  contFenHistory = [];
  chessForCont.move(bestMove);
  contFenHistory.push(chessForCont.fen());
  posArr.forEach(pos => {
    chessForCont.move(pos);
    contFenHistory.push(chessForCont.fen());
  });

  var config = {
    draggable: false,
    position: contFenHistory[0]
  }

  contBoard = Chessboard('contBoard', config);
  updateContButtonStates();
}

function goToContMove(moveNum) {
  contBoard.position(contFenHistory[moveNum]);
  contMoveIndex = moveNum;
  updateContButtonStates();
}

// Buttons disable if move is not available
function updateContButtonStates() {
    contStart.disabled = contMoveIndex <= 0;
    contPrev.disabled = contMoveIndex <= 0;
    contNext.disabled = contMoveIndex >= contFenHistory.length - 1;
    contEnd.disabled = contMoveIndex >= contFenHistory.length - 1;
}
