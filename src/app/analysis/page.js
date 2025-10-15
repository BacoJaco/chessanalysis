'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Chess } from '../../lib/chess.js';
import dynamic from 'next/dynamic';

function ChessAnalysisPage() {
    const searchParams = useSearchParams();
    const [moves, setMoves] = useState([]);
    const [fenHistory, setFenHistory] = useState([]);
    const [contFenHistory, setContFenHistory] = useState([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [contMoveIndex, setContMoveIndex] = useState(0);

    const [isJQueryReady, setIsJQueryReady] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    const boardRef = useRef(null);
    const contBoardRef = useRef(null);

    const [bestMove, setBestMove] = useState('Not Available');
    const [mateIn, setMateIn] = useState('Not Available');
    const [moveType, setMoveType] = useState('Not Available');

    const boardSetup = useCallback((pgn) => {
        const chessForPGN = new Chess();
        try {
            chessForPGN.loadPgn(pgn);
        } catch (error) {
            alert("Invalid PGN provided in URL.");
            return;
        }

        const loadedMoves = chessForPGN.history();
        setMoves(loadedMoves);

        const chessForReplay = new Chess();
        const fens = [chessForReplay.fen()];
        loadedMoves.forEach(move => {
            chessForReplay.move(move);
            fens.push(chessForReplay.fen());
        });
        setFenHistory(fens);
    }, []);

    const getBestMove = useCallback(async (data = {}) => {
        try {
            const response = await fetch("https://chess-api.com/v1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return response.json();
        } catch (error) {
            console.error("Error fetching best move:", error);
            return { type: "error", text: "API Error" };
        }
    }, []);

    const showMoveType = useCallback((currEval, prevEval, moveNum) => {
        const evalChange = Math.abs(currEval - prevEval);
        const movePlayed = moves[moveNum - 1] || '';
        let classification = "was Best";

        if (evalChange > 5) classification = "was a Blunder";
        else if (evalChange > 2) classification = "was a Mistake";
        else if (evalChange > 0.5) classification = "was an Inaccuracy";
        else if (evalChange > 0.2) classification = "was Good";
        else if (evalChange > 0) classification = "was Excellent";

        setMoveType(`${movePlayed} ${classification}`);
    }, [moves]);

    const printBestMove = useCallback((data) => {
        setBestMove(data.type === "error" ? "Not Available" : data.text);
    }, []);

    const printMate = useCallback((data) => {
        setMateIn(data.mate != null ? `In ${data.mate}` : "Not Available");
    }, []);

    useEffect(() => {
        const pgn = searchParams.get('pgn');
        // Check if the chessboard library is loaded on the window object
        if (pgn && window.Chessboard) {
            boardSetup(pgn);
        }
    }, [searchParams, scriptsLoaded, boardSetup]);

    const goToMove = useCallback(async (moveNum) => {
        if (!boardRef.current || moveNum < 0 || moveNum >= fenHistory.length) return;

        boardRef.current.position(fenHistory[moveNum]);
        setCurrentMoveIndex(moveNum);

        let prevEval = 0;
        if (moveNum > 0) {
            const prevData = await getBestMove({ fen: fenHistory[moveNum - 1], depth: 20, variants: 1 });
            prevEval = prevData.eval || 0;
        }

        const data = await getBestMove({ fen: fenHistory[moveNum], depth: 20, variants: 1 });

        if (moveNum > 0) {
            showMoveType(data.eval || 0, prevEval, moveNum);
        } else {
            setMoveType('Starting Position');
        }
        printBestMove(data);
        printMate(data);
    }, [fenHistory, getBestMove, printBestMove, printMate, showMoveType]);


    useEffect(() => {
        if (fenHistory.length > 0 && window.Chessboard && !boardRef.current) {
            const boardConfig = {
                draggable: false,
                position: fenHistory[0],
                pieceTheme: '/img/chesspieces/wikipedia/{piece}.png'
            };
            boardRef.current = window.Chessboard('board', boardConfig);
            goToMove(0);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fenHistory, scriptsLoaded]);

    const continuationBoardSetup = useCallback((bestMove, posArr) => {
        setContMoveIndex(0);
        const chessForCont = new Chess(fenHistory[currentMoveIndex]);

        const contFens = [];
        chessForCont.move(bestMove);
        contFens.push(chessForCont.fen());
        posArr.forEach(pos => {
            chessForCont.move(pos);
            contFens.push(chessForCont.fen());
        });
        setContFenHistory(contFens);

        if (contBoardRef.current) {
            contBoardRef.current.position(contFens[0]);
        } else if (window.Chessboard) {
            const config = {
                draggable: false,
                position: contFens[0],
                pieceTheme: '/img/chesspieces/wikipedia/{piece}.png'
            };
            contBoardRef.current = window.Chessboard('contBoard', config);
        }
    }, [fenHistory, currentMoveIndex]);

    const handleContinuation = useCallback(async () => {
        const data = await getBestMove({ fen: fenHistory[currentMoveIndex], depth: 20, variants: 1 });
        if (data && data.lan && data.continuationArr) {
            continuationBoardSetup(data.lan, data.continuationArr);
        }
    }, [fenHistory, currentMoveIndex, getBestMove, continuationBoardSetup]);


    const goToContMove = useCallback((moveNum) => {
        if (!contBoardRef.current || moveNum < 0 || moveNum >= contFenHistory.length) return;
        contBoardRef.current.position(contFenHistory[moveNum]);
        setContMoveIndex(moveNum);
    }, [contFenHistory]);

    return (
        <>
            <Script src="https://code.jquery.com/jquery-1.12.4.min.js" strategy="lazyOnload" onLoad={() => { setIsJQueryReady(true); }} />
            {isJQueryReady && <Script src="/js/chessboard-1.0.0.js" strategy="lazyOnload" onLoad={() => { setScriptsLoaded(true); }} />}
;
            <div className="boards-container">
                <div className="board-wrapper">
                    <div id="board" style={{ width: '400px', height: '400px' }}></div>
                    <div className="controls-grid">
                        <button onClick={() => goToMove(0)} disabled={currentMoveIndex <= 0}>|&lt;</button>
                        <button onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex <= 0}>&lt; Prev</button>
                        <button onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= fenHistory.length - 1}>Next &gt;</button>
                        <button onClick={() => goToMove(fenHistory.length - 1)} disabled={currentMoveIndex >= fenHistory.length - 1}>&gt;|</button>
                        <h3>Move EVAL: {moveType}</h3>
                    </div>
                </div>

                <div className="board-wrapper">
                    <div id="contBoard" style={{ width: '400px', height: '400px' }}></div>
                    <div className="controls-grid">
                        <button onClick={() => goToContMove(0)} disabled={contMoveIndex <= 0}>|&lt;</button>
                        <button onClick={() => goToContMove(contMoveIndex - 1)} disabled={contMoveIndex <= 0}>&lt; Prev</button>
                        <button onClick={() => goToContMove(contMoveIndex + 1)} disabled={contMoveIndex >= contFenHistory.length - 1}>Next &gt;</button>
                        <button onClick={() => goToContMove(contFenHistory.length - 1)} disabled={contMoveIndex >= contFenHistory.length - 1}>&gt;|</button>
                    </div>
                </div>
            </div>

            <div className="info-controls">
                <h2>Best Move: {bestMove}</h2>
                <h2>Mate: {mateIn}</h2>
                <button onClick={handleContinuation}>Show Continuation</button>
            </div>
        </>
    );
}

// --- Dynamic Import with SSR disabled ---
const Analysis = dynamic(() => Promise.resolve(ChessAnalysisPage), {
  ssr: false
});

export default Analysis;