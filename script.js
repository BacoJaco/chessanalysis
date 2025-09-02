import { Chess } from './chess.js'

var board = Chessboard('board', 'start');
var game = new Chess();

function makeRandomMove () {
  var possibleMoves = game.moves();

  // Exit if the game is over
  if (game.isGameOver()) return;

  var randomIdx = Math.floor(Math.random() * possibleMoves.length);
  game.move(possibleMoves[randomIdx]);
  board.position(game.fen());

  window.setTimeout(makeRandomMove, 500);
}

window.setTimeout(makeRandomMove, 500);