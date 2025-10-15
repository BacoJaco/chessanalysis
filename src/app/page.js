'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chess } from '../lib/chess.js';

export default function Home() {
  const [pgn, setPgn] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAnalyze = () => {
    if (pgn.trim() === '') {
      setError('Please input a valid PGN to continue.');
      return;
    }

    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
      // Navigate to the analysis page with pgn
      router.push(`/analysis?pgn=${encodeURIComponent(pgn)}`);
    } catch (error) {
      setError('Invalid PGN. Please check your input and try again.');
    }
  };

  return (
    <div className="container">
      <h1>Chess Analysis</h1>
      <p>Please paste a PGN below to begin your analysis.</p>
      <textarea id="pgnInput" placeholder="Enter PGN here..." value={pgn} onChange={(e) => setPgn(e.target.value)}></textarea>
      <button onClick={handleAnalyze}>Analyze</button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}