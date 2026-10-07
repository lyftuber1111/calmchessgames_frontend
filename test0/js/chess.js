/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * HTML5 Chess + Stockfish Engine Integration & Local Minimax Fallback
 * Completely unobfuscated, clean, maintainable JavaScript
 */

(function () {
  'use strict';

  // --- Material & Piece-Square Evaluation Tables ---
  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  const PIECE_SQUARE_TABLES = {
    p: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5, 5, 10, 25, 25, 10, 5, 5],
      [0, 0, 0, 20, 20, 0, 0, 0],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    n: [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-30, 0, 10, 15, 15, 10, 0, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-30, 0, 15, 20, 20, 15, 0, -30],
      [-30, 5, 10, 15, 15, 10, 5, -30],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    b: [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 5, 10, 10, 5, 0, -10],
      [-10, 5, 5, 10, 10, 5, 5, -10],
      [-10, 0, 10, 10, 10, 10, 0, -10],
      [-10, 10, 10, 10, 10, 10, 10, -10],
      [-10, 5, 0, 0, 0, 0, 5, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    r: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 10, 10, 10, 10, 10, 10, 5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [0, 0, 0, 5, 5, 0, 0, 0]
    ],
    q: [
      [-20, -10, -10, -5, -5, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 5, 5, 5, 5, 0, -10],
      [-5, 0, 5, 5, 5, 5, 0, -5],
      [0, 0, 5, 5, 5, 5, 0, -5],
      [-10, 5, 5, 5, 5, 5, 0, -10],
      [-10, 0, 5, 0, 0, 0, 0, -10],
      [-20, -10, -10, -5, -5, -10, -10, -20]
    ],
    k: [
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-20, -30, -30, -40, -40, -30, -20, -20],
      [-10, -20, -20, -20, -20, -20, -20, -10],
      [20, 20, 0, 0, 0, 0, 20, 20],
      [20, 30, 10, 0, 0, 10, 30, 20]
    ]
  };

  /**
   * Evaluate board position for current game
   */
  function evaluateBoard(game) {
    let totalScore = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type];
          const pstTable = PIECE_SQUARE_TABLES[piece.type];
          let positionalBonus = 0;
          if (pstTable) {
            positionalBonus = (piece.color === 'w') ? pstTable[r][c] : pstTable[7 - r][c];
          }
          const pieceScore = val + positionalBonus;
          totalScore += (piece.color === 'w') ? pieceScore : -pieceScore;
        }
      }
    }
    return totalScore;
  }

  /**
   * Minimax with Alpha-Beta Pruning
   */
  function minimax(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.game_over()) {
      return evaluateBoard(game);
    }

    const legalMoves = game.moves({ verbose: true });
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of legalMoves) {
        game.move(m);
        const evalScore = minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of legalMoves) {
        game.move(m);
        const evalScore = minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  /**
   * Find Best Move using Local Minimax Engine
   */
  function getBestMoveMinimax(game, depth) {
    const legalMoves = game.moves({ verbose: true });
    if (legalMoves.length === 0) return null;

    let bestMove = null;
    const isWhite = (game.turn() === 'w');
    let bestScore = isWhite ? -Infinity : Infinity;

    for (const m of legalMoves) {
      game.move(m);
      const score = minimax(game, depth - 1, -Infinity, Infinity, !isWhite);
      game.undo();

      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = m;
        }
      }
    }

    return bestMove || legalMoves[0];
  }

  // Debug log helper
  window.log = function (msg) {
    const logEl = document.getElementById('debug-log');
    if (logEl) {
      logEl.innerHTML = '<span>[' + new Date().toLocaleTimeString() + '] ' + msg + '</span>';
    }
  };

  // Unicode Chess Symbols
  const UNICODE_PIECES = {
    p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
    P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔'
  };

  // Opening Book
  const OPENING_BOOK = [
    { san: 'e4', from: 'e2', to: 'e4', name: "King's Pawn (1. e4)" },
    { san: 'd4', from: 'd2', to: 'd4', name: "Queen's Pawn (1. d4)" },
    { san: 'c4', from: 'c2', to: 'c4', name: 'English Opening (1. c4)' },
    { san: 'Nf3', from: 'g1', to: 'f3', name: 'Zukertort / Réti (1. Nf3)' }
  ];

  const OPENING_RESPONSES = {
    'e4': ['c5', 'e5', 'e6', 'c6', 'Nf6'],
    'd4': ['Nf6', 'd5', 'e6', 'g6', 'c5'],
    'c4': ['e5', 'c5', 'Nf6', 'e6'],
    'Nf3': ['d5', 'Nf6', 'c5', 'g6']
  };

  const ECO_OPENINGS = {
    'e4': "B00: King's Pawn Opening",
    'e4 c5': "B20: Sicilian Defense",
    'e4 c5 Nf3 d6': "B50: Sicilian Defense, Modern",
    'e4 e5': "C20: King's Pawn Game (Open Game)",
    'e4 e5 Nf3 Nc6 Bc4': "C50: Italian Game",
    'e4 e5 Nf3 Nc6 Bb5': "C60: Ruy Lopez (Spanish Opening)",
    'e4 e6': "C00: French Defense",
    'e4 c6': "B10: Caro-Kann Defense",
    'd4': "A40: Queen's Pawn Opening",
    'd4 d5': "D00: Queen's Pawn Game",
    'd4 d5 c4': "D06: Queen's Gambit",
    'd4 d5 c4 c6': "D10: Slav Defense",
    'd4 Nf6': "A45: Indian Defense",
    'd4 Nf6 c4 g6': "E60: King's Indian Defense",
    'd4 Nf6 c4 e6': "E00: East Indian Defense",
    'c4': "A10: English Opening",
    'Nf3': "A04: Réti / Zukertort Opening"
  };

  // State Management
  const chess = new Chess();
  let selectedSquare = null;
  let possibleMoves = [];
  let isBoardFlipped = false;
  let gameMode = 'play'; // 'play' or 'analysis'
  let isArrowEnabled = true;
  let lastSuggestedMove = null;
  let isAiThinking = false;
  let engineFallbackTimer = null;
  let stockfishSocket = null;
  let isSocketConnected = false;

  // Gemini 3.8 Flash Grandmaster AI State
  let isGeminiAdvisorEnabled = (localStorage.getItem('cc_gemini_chess_advisor_enabled') !== 'false');
  let currentEvaluation = '0.00';
  let geminiCommentaryAbortId = 0;

  // DOM Elements
  const boardEl = document.getElementById('board');
  const arrowOverlayEl = document.getElementById('arrow-overlay');
  const statusDotEl = document.getElementById('status-dot');
  const statusLabelEl = document.getElementById('status-label');
  const retryBtn = document.getElementById('retryBtn');
  const gameOverBannerEl = document.getElementById('game-over-banner');
  const openingDisplayEl = document.getElementById('opening-display');
  const geminiBoxEl = document.getElementById('gemini-chess-box');
  const geminiCommentaryEl = document.getElementById('gemini-chess-commentary');
  const geminiHintEl = document.getElementById('gemini-chess-hint');
  const geminiHintBtn = document.getElementById('gemini-chess-hint-btn');
  const geminiAdvisorBtn = document.getElementById('geminiChessAdvisorBtn');

  // Web Audio SFX Engine for Chess Moves
  let isSoundEnabled = true;
  let chessAudioCtx = null;

  function getChessAudioContext() {
    if (!chessAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) chessAudioCtx = new AudioCtx();
    }
    if (chessAudioCtx && chessAudioCtx.state === 'suspended') {
      chessAudioCtx.resume();
    }
    return chessAudioCtx;
  }

  function playChessMoveSound(isCapture = false, isCheck = false) {
    if (!isSoundEnabled) return;
    try {
      const ctx = getChessAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (isCheck) {
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.2, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.22);
        });
      } else if (isCapture) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {}
  }

  function toggleChessSound() {
    isSoundEnabled = !isSoundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      if (isSoundEnabled) {
        btn.innerText = '🔊 Sound ON';
        btn.className = 'sound-btn active';
      } else {
        btn.innerText = '🔇 Sound OFF';
        btn.className = 'sound-btn muted';
      }
    }
    if (isSoundEnabled) {
      getChessAudioContext();
    }
  }
  window.toggleChessSound = toggleChessSound;

  /**
   * Update Opening Badge with Lichess Masters Lookup or Local ECO Dictionary
   */
  function updateOpeningDisplay() {
    const moveHistoryStr = chess.history().join(' ');
    if (!moveHistoryStr) {
      if (openingDisplayEl) openingDisplayEl.innerText = "Opening: Starting Position";
      return;
    }

    if (navigator.onLine) {
      fetch('https://explorer.lichess.ovh/masters?fen=' + encodeURIComponent(chess.fen()))
        .then(res => res.json())
        .then(data => {
          if (data.opening && data.opening.name && openingDisplayEl) {
            openingDisplayEl.innerText = 'Opening: ' + (data.opening.eco ? data.opening.eco + ' ' : '') + data.opening.name;
          }
        })
        .catch(() => {});
    }

    let detectedName = null;
    for (const [seq, title] of Object.entries(ECO_OPENINGS)) {
      if (moveHistoryStr.startsWith(seq)) {
        detectedName = title;
        break;
      }
    }

    if (openingDisplayEl) {
      openingDisplayEl.innerText = 'Opening: ' + (detectedName || (chess.history().length > 6 ? 'Out of Book' : 'Unclassified Opening'));
    }
  }

  /**
   * Connect to Stockfish WebSocket API
   */
  function connectStockfishWebSocket() {
    if (!navigator.onLine) {
      if (statusDotEl) statusDotEl.className = 'dot offline';
      if (statusLabelEl) statusLabelEl.innerText = 'Offline Mode (Local)';
      log('Offline: Local engine ready.');
      requestEngineMove();
      return;
    }

    if (statusDotEl) statusDotEl.className = 'dot';
    if (statusLabelEl) statusLabelEl.innerText = 'Connecting WebSocket...';

    try {
      stockfishSocket = new WebSocket('wss://chess-api.com/v1');

      stockfishSocket.onopen = () => {
        isSocketConnected = true;
        if (statusDotEl) statusDotEl.className = 'dot connected';
        if (statusLabelEl) statusLabelEl.innerText = 'Stockfish Connected (Fast)';
        log('Engine online.');
        requestEngineMove();
      };

      stockfishSocket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.error) {
            fetchHttpStockfish(chess.fen(), parseInt(document.getElementById('depthSelect').value, 10));
            return;
          }
          handleEngineResponse(payload);
        } catch (e) {}
      };

      stockfishSocket.onerror = () => {
        isSocketConnected = false;
      };

      stockfishSocket.onclose = () => {
        isSocketConnected = false;
        if (navigator.onLine) {
          setTimeout(connectStockfishWebSocket, 5000);
        } else {
          if (statusDotEl) statusDotEl.className = 'dot offline';
          if (statusLabelEl) statusLabelEl.innerText = 'Offline Mode (Local)';
          log('WiFi disconnected. Offline engine ready.');
        }
      };
    } catch (err) {
      isSocketConnected = false;
    }
  }

  /**
   * Request Next Engine Move or Book Opening Move
   */
  function requestEngineMove() {
    if (chess.game_over() || chess.in_threefold_repetition()) return;
    if (retryBtn) retryBtn.style.display = 'none';

    const historyMoves = chess.history();

    // 1. Initial Opening Move
    if (historyMoves.length === 0) {
      const bookMove = OPENING_BOOK[Math.floor(Math.random() * OPENING_BOOK.length)];
      lastSuggestedMove = bookMove;

      const depthLabel = document.getElementById('depth-label');
      if (depthLabel) depthLabel.innerText = 'Book: Varied';

      const bestMoveDisp = document.getElementById('best-move-display');
      if (bestMoveDisp) bestMoveDisp.innerText = 'Analysed Move: ' + bookMove.from.toUpperCase() + ' ➔ ' + bookMove.to.toUpperCase();

      const pvText = document.getElementById('pv-text');
      if (pvText) pvText.innerText = 'Suggestion: ' + bookMove.name;

      if (isArrowEnabled) {
        drawArrow(bookMove.from, bookMove.to);
      }

      if (gameMode === 'play' && isAiThinking && chess.turn() === 'w') {
        setTimeout(() => {
          log('AI opened with: ' + bookMove.san);
          makeMove(bookMove.san);
        }, 350);
      }
      return;
    }

    // 2. Opening Response for Black
    if (gameMode === 'play' && isAiThinking && chess.turn() === 'b' && historyMoves.length === 1) {
      const firstMove = historyMoves[0];
      const responses = OPENING_RESPONSES[firstMove];
      if (responses && responses.length > 0) {
        const reply = responses[Math.floor(Math.random() * responses.length)];
        setTimeout(() => {
          log('Opening response: ' + reply);
          makeMove(reply);
        }, 350);
        return;
      }
    }

    // 3. Offline Mode
    if (!navigator.onLine) {
      runLocalMinimax();
      return;
    }

    // 4. Online Engine Query
    const bestMoveDisp = document.getElementById('best-move-display');
    if (bestMoveDisp) {
      bestMoveDisp.innerText = isAiThinking ? 'Stockfish thinking...' : 'Analysing position...';
    }

    const depthVal = parseInt(document.getElementById('depthSelect').value, 10);
    const currentFen = chess.fen();

    if (isAiThinking) {
      clearTimeout(engineFallbackTimer);
      engineFallbackTimer = setTimeout(() => {
        if (isAiThinking) {
          fetchHttpStockfish(currentFen, depthVal);
        }
      }, 4000);
    }

    if (isSocketConnected && stockfishSocket && stockfishSocket.readyState === WebSocket.OPEN) {
      stockfishSocket.send(JSON.stringify({ fen: currentFen, depth: depthVal }));
    } else {
      fetchHttpChessApi(currentFen, depthVal);
    }
  }

  /**
   * Run Local Minimax (Offline Engine)
   */
  function runLocalMinimax() {
    if (statusDotEl) statusDotEl.className = 'dot offline';
    if (statusLabelEl) statusLabelEl.innerText = 'Offline Mode (Local)';

    const bestMoveDisp = document.getElementById('best-move-display');
    if (bestMoveDisp) bestMoveDisp.innerText = isAiThinking ? 'Local engine thinking...' : 'Analysing locally...';

    const depthLabel = document.getElementById('depth-label');
    if (depthLabel) depthLabel.innerText = 'Local: 3 Ply';

    setTimeout(() => {
      const move = getBestMoveMinimax(chess, 3);
      if (move) {
        lastSuggestedMove = { from: move.from, to: move.to };
        if (bestMoveDisp) {
          bestMoveDisp.innerText = 'Analysed Move: ' + move.from.toUpperCase() + ' ➔ ' + move.to.toUpperCase();
        }
        const pvText = document.getElementById('pv-text');
        if (pvText) pvText.innerText = 'Line: ' + move.san;

        if (isArrowEnabled) {
          drawArrow(move.from, move.to);
        }

        if (gameMode === 'play' && isAiThinking && chess.turn() === 'b') {
          isAiThinking = false;
          log('Local AI played: ' + move.from + '->' + move.to);
          makeMove(move);
        }
      }
    }, 150);
  }

  /**
   * Fallback: HTTP POST to chess-api.com
   */
  function fetchHttpChessApi(fen, depth) {
    fetch('https://chess-api.com/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: fen, depth: depth })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        handleEngineResponse(data);
      })
      .catch(() => {
        fetchHttpStockfish(fen, depth);
      });
  }

  /**
   * Fallback: HTTP GET to stockfish.online
   */
  function fetchHttpStockfish(fen, depth) {
    fetch('https://stockfish.online/api/s/v2.php?fen=' + encodeURIComponent(fen) + '&depth=' + depth)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.bestmove) {
          const parts = data.bestmove.split(' ');
          const moveUci = parts[1];
          handleEngineResponse({
            type: 'bestmove',
            move: moveUci,
            eval: data.evaluation,
            mate: data.mate,
            pv: data.continuation
          });
        }
      })
      .catch(() => {
        clearTimeout(engineFallbackTimer);
        runLocalMinimax();
      });
  }

  /**
   * Process Stockfish / Engine Analysis Response
   */
  function handleEngineResponse(data) {
    if (!data || data.type === 'info') return;

    if (data.eval !== undefined && data.eval !== null) {
      currentEvaluation = String(data.eval);
    } else if (data.mate !== undefined && data.mate !== null) {
      currentEvaluation = '#' + data.mate;
    }

    if (data.depth) {
      const depthLabel = document.getElementById('depth-label');
      if (depthLabel) depthLabel.innerText = 'Depth: ' + data.depth;
    }

    if (data.pv) {
      const pvText = document.getElementById('pv-text');
      if (pvText) {
        pvText.innerText = 'Line: ' + data.pv.split(' ').slice(0, 5).join(' ');
      }
    }

    let fromSq = null;
    let toSq = null;
    let promotion = undefined;

    if (data.from && data.to) {
      fromSq = String(data.from).toLowerCase();
      toSq = String(data.to).toLowerCase();
    } else if (typeof data.move === 'string' && data.move.length >= 4) {
      fromSq = data.move.slice(0, 2).toLowerCase();
      toSq = data.move.slice(2, 4).toLowerCase();
      if (data.move.length >= 5) {
        promotion = data.move[4].toLowerCase();
      }
    } else if (typeof data.text === 'string') {
      const match = data.text.match(/([a-h][1-8])\s*(?:→|->|to)\s*([a-h][1-8])/i);
      if (match) {
        fromSq = match[1].toLowerCase();
        toSq = match[2].toLowerCase();
      }
    }

    if (fromSq && toSq) {
      const piece = chess.get(fromSq);
      if (piece && piece.type === 'p' && (toSq[1] === '8' || toSq[1] === '1')) {
        promotion = (typeof promotion === 'string' && promotion.length === 1) ? promotion : 'q';
      } else {
        promotion = undefined;
      }

      const moveObj = { from: fromSq, to: toSq };
      if (promotion) moveObj.promotion = promotion;

      lastSuggestedMove = moveObj;

      const bestMoveDisp = document.getElementById('best-move-display');
      if (bestMoveDisp) {
        bestMoveDisp.innerText = 'Analysed Move: ' + fromSq.toUpperCase() + ' ➔ ' + toSq.toUpperCase();
      }

      if (isArrowEnabled) {
        drawArrow(fromSq, toSq);
      }

      if (gameMode === 'play' && isAiThinking && chess.turn() === 'b') {
        if (data.type === 'bestmove' || !isSocketConnected) {
          clearTimeout(engineFallbackTimer);
          isAiThinking = false;
          log('Stockfish executed: ' + fromSq + '->' + toSq);
          setTimeout(() => makeMove(moveObj), 100);
        }
      }
    } else if (data.san) {
      const bestMoveDisp = document.getElementById('best-move-display');
      if (bestMoveDisp) {
        bestMoveDisp.innerText = 'Analysed Move: ' + data.san;
      }

      if (gameMode === 'play' && isAiThinking && chess.turn() === 'b' && data.type === 'bestmove') {
        clearTimeout(engineFallbackTimer);
        isAiThinking = false;
        setTimeout(() => makeMove(data.san), 100);
      }
    }
  }

  /**
   * Execute Move in Game State
   */
  function makeMove(moveData) {
    const executed = chess.move(moveData);
    if (!executed) return false;

    playChessMoveSound(!!executed.captured, chess.in_check());

    selectedSquare = null;
    possibleMoves = [];
    clearArrow();
    renderBoard();
    updateOpeningDisplay();

    if (chess.in_threefold_repetition() || chess.game_over()) {
      updateTurnStatus();
      showGameOverModal();
      return true;
    }

    updateTurnStatus();

    if (gameMode === 'play' && chess.turn() === 'b') {
      isAiThinking = true;
    } else {
      isAiThinking = false;
    }

    triggerGeminiChessCommentary(executed);

    requestEngineMove();
    return true;
  }

  /**
   * Show Game Over Modal
   */
  function showGameOverModal() {
    clearArrow();
    const titleEl = document.getElementById('game-over-title');
    const subEl = document.getElementById('game-over-subtitle');

    if (!titleEl || !subEl) return;
    titleEl.className = '';

    if (chess.in_checkmate()) {
      const winner = (chess.turn() === 'w') ? 'Black' : 'White';
      titleEl.innerText = 'CHECKMATE!';
      titleEl.classList.add(winner === 'White' ? 'winner-white' : 'winner-black');
      subEl.innerText = winner + ' wins by checkmate!';
    } else if (chess.in_threefold_repetition()) {
      titleEl.innerText = 'DRAW!';
      titleEl.classList.add('winner-draw');
      subEl.innerText = 'Draw by threefold repetition of position';
    } else if (chess.in_stalemate()) {
      titleEl.innerText = 'STALEMATE!';
      titleEl.classList.add('winner-draw');
      subEl.innerText = 'Draw by stalemate (no legal moves left)';
    } else if (chess.insufficient_material()) {
      titleEl.innerText = 'DRAW!';
      titleEl.classList.add('winner-draw');
      subEl.innerText = 'Draw by insufficient material';
    } else {
      titleEl.innerText = 'GAME OVER';
      titleEl.classList.add('winner-draw');
      subEl.innerText = 'Game ended in a draw';
    }

    if (gameOverBannerEl) gameOverBannerEl.style.display = 'flex';
  }

  /**
   * Update Turn and Check/Checkmate Status Line
   */
  function updateTurnStatus() {
    let msg = '';
    if (chess.in_checkmate()) {
      msg = 'Checkmate! ' + (chess.turn() === 'w' ? 'Black' : 'White') + ' wins!';
    } else if (chess.in_threefold_repetition()) {
      msg = 'Game over: Draw by threefold repetition!';
    } else if (chess.in_draw()) {
      msg = 'Game over: Draw!';
    } else {
      const side = (chess.turn() === 'w') ? 'White' : 'Black';
      msg = side + ' to move ' + (chess.in_check() ? '(Check)' : '');
    }

    const turnEl = document.getElementById('turn-status');
    if (turnEl) turnEl.innerText = msg;
  }

  /**
   * Draw Directional SVG Arrow on Board Overlay
   */
  /**
   * Draw Directional SVG Arrow on Board Overlay
   * Measures rendered DOM square elements directly for 100% pixel-perfect alignment
   * completely immune to board flipping, borders, padding, and layout scaling.
   */
  function drawArrow(fromSquare, toSquare) {
    clearArrow();
    if (!fromSquare || !toSquare || !boardEl || !arrowOverlayEl) return;

    const fromEl = boardEl.querySelector('[data-square="' + fromSquare.toLowerCase() + '"]');
    const toEl = boardEl.querySelector('[data-square="' + toSquare.toLowerCase() + '"]');
    if (!fromEl || !toEl) return;

    const overlayRect = arrowOverlayEl.getBoundingClientRect();
    if (!overlayRect.width || !overlayRect.height) return;

    arrowOverlayEl.setAttribute('viewBox', '0 0 ' + overlayRect.width + ' ' + overlayRect.height);

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const x1 = (fromRect.left + fromRect.width / 2) - overlayRect.left;
    const y1 = (fromRect.top + fromRect.height / 2) - overlayRect.top;
    const x2 = (toRect.left + toRect.width / 2) - overlayRect.left;
    const y2 = (toRect.top + toRect.height / 2) - overlayRect.top;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 6) return;

    const ux = dx / len;
    const uy = dy / len;
    const vx = -uy;
    const vy = ux;

    const sqSize = fromRect.width;
    const shaftWidth = Math.max(7, sqSize * 0.16);
    const halfShaft = shaftWidth / 2;
    const headWidth = Math.max(18, sqSize * 0.44);
    const halfHead = headWidth / 2;
    const headLength = Math.max(16, sqSize * 0.38);

    const startOffset = sqSize * 0.18;
    const startX = x1 + ux * startOffset;
    const startY = y1 + uy * startOffset;

    const tipOffset = Math.min(5, sqSize * 0.08);
    const tipX = x2 - ux * tipOffset;
    const tipY = y2 - uy * tipOffset;

    const baseHeadX = tipX - ux * headLength;
    const baseHeadY = tipY - uy * headLength;

    const p1 = (startX - vx * halfShaft).toFixed(2) + ',' + (startY - vy * halfShaft).toFixed(2);
    const p2 = (baseHeadX - vx * halfShaft).toFixed(2) + ',' + (baseHeadY - vy * halfShaft).toFixed(2);
    const p3 = (baseHeadX - vx * halfHead).toFixed(2) + ',' + (baseHeadY - vy * halfHead).toFixed(2);
    const p4 = tipX.toFixed(2) + ',' + tipY.toFixed(2);
    const p5 = (baseHeadX + vx * halfHead).toFixed(2) + ',' + (baseHeadY + vy * halfHead).toFixed(2);
    const p6 = (baseHeadX + vx * halfShaft).toFixed(2) + ',' + (baseHeadY + vy * halfShaft).toFixed(2);
    const p7 = (startX + vx * halfShaft).toFixed(2) + ',' + (startY + vy * halfShaft).toFixed(2);

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('id', 'drawn-arrow');
    poly.setAttribute('points', p1 + ' ' + p2 + ' ' + p3 + ' ' + p4 + ' ' + p5 + ' ' + p6 + ' ' + p7);
    poly.setAttribute('fill', '#2ecc71');
    poly.setAttribute('stroke', '#196f3d');
    poly.setAttribute('stroke-width', '2');
    poly.setAttribute('stroke-linejoin', 'round');
    poly.setAttribute('opacity', '0.88');
    poly.style.filter = 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))';

    arrowOverlayEl.appendChild(poly);
  }

  /**
   * Clear SVG Arrow
   */
  function clearArrow() {
    if (!arrowOverlayEl) return;
    const arrows = arrowOverlayEl.querySelectorAll('#drawn-arrow');
    arrows.forEach(a => a.remove());
  }

  // =========================================================================
  // GEMINI 3.8 FLASH CHESS GRANDMASTER COMMENTARY & STRATEGY ENGINE
  // =========================================================================
  function updateGeminiChessUI() {
    const btn = document.getElementById('geminiChessAdvisorBtn');
    const box = document.getElementById('gemini-chess-box');
    if (btn) {
      if (isGeminiAdvisorEnabled) {
        btn.classList.add('active');
        btn.classList.remove('muted');
        btn.textContent = '✨ Gemini AI';
      } else {
        btn.classList.remove('active');
        btn.classList.add('muted');
        btn.textContent = '✨ AI OFF';
      }
    }
    if (box) {
      if (isGeminiAdvisorEnabled) {
        box.classList.remove('hidden');
        box.style.display = 'flex';
      } else {
        box.classList.add('hidden');
        box.style.display = 'none';
      }
    }
  }

  function toggleGeminiChessAdvisor() {
    isGeminiAdvisorEnabled = !isGeminiAdvisorEnabled;
    try {
      localStorage.setItem('cc_gemini_chess_advisor_enabled', isGeminiAdvisorEnabled ? 'true' : 'false');
    } catch (e) {}
    updateGeminiChessUI();
  }
  window.toggleGeminiChessAdvisor = toggleGeminiChessAdvisor;

  async function callGeminiChessApi(action, payload) {
    const candidateUrls = [
      './gemini_api.php?action=' + action,
      '/gemini_api.php?action=' + action,
      'https://api.calmchessgames.com/gemini_api.php?action=' + action
    ];
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
    }
    return null;
  }

  async function triggerGeminiChessCommentary(executedMove = null) {
    if (!isGeminiAdvisorEnabled) return;
    const currentId = ++geminiCommentaryAbortId;
    const commentaryEl = document.getElementById('gemini-chess-commentary');
    const openingEl = document.getElementById('opening-display');

    const openingText = openingEl ? openingEl.innerText.replace('Opening: ', '') : 'Standard Position';
    const lastSan = executedMove ? (executedMove.san || (executedMove.from + executedMove.to)) : '';
    const bestMoveStr = lastSuggestedMove ? (lastSuggestedMove.from + lastSuggestedMove.to) : '';

    const payload = {
      fen: chess.fen(),
      best_move: bestMoveStr,
      last_move: lastSan,
      eval: currentEvaluation,
      turn: chess.turn(),
      opening: openingText
    };

    try {
      const data = await callGeminiChessApi('chess_commentary', payload);
      if (currentId !== geminiCommentaryAbortId) return;
      if (data && data.success && data.advice) {
        if (commentaryEl) {
          commentaryEl.style.opacity = '0.3';
          setTimeout(() => {
            if (currentId === geminiCommentaryAbortId) {
              commentaryEl.textContent = '"' + data.advice + '"';
              commentaryEl.style.opacity = '1';
            }
          }, 150);
        }
      }
    } catch (e) {}
  }

  async function requestGeminiChessAdvice() {
    if (!isGeminiAdvisorEnabled) {
      isGeminiAdvisorEnabled = true;
      try {
        localStorage.setItem('cc_gemini_chess_advisor_enabled', 'true');
      } catch (e) {}
      updateGeminiChessUI();
    }

    const hintEl = document.getElementById('gemini-chess-hint');
    const hintBtn = document.getElementById('gemini-chess-hint-btn');
    const openingEl = document.getElementById('opening-display');

    if (hintBtn) hintBtn.textContent = 'Analyzing...';
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = '<em>Consulting Gemini 3.8 Flash Grandmaster Engine...</em>';
    }

    const openingText = openingEl ? openingEl.innerText.replace('Opening: ', '') : 'Standard Position';
    const bestMoveStr = lastSuggestedMove ? (lastSuggestedMove.from + lastSuggestedMove.to) : '';

    const payload = {
      fen: chess.fen(),
      best_move: bestMoveStr,
      eval: currentEvaluation,
      turn: chess.turn(),
      opening: openingText
    };

    try {
      const data = await callGeminiChessApi('chess_analysis', payload);
      if (hintEl) {
        if (data && data.success && data.advice) {
          hintEl.style.display = 'block';
          hintEl.innerHTML = '<strong>Gemini 3.8 Flash Grandmaster:</strong> ' + data.advice;
        } else {
          hintEl.innerHTML = '<em>Tactical equilibrium detected. Continue development and king safety.</em>';
        }
      }
      if (isArrowEnabled && lastSuggestedMove && lastSuggestedMove.from && lastSuggestedMove.to) {
        drawArrow(lastSuggestedMove.from, lastSuggestedMove.to);
      }
    } catch (e) {
      if (hintEl) hintEl.innerHTML = '<em>Grandmaster engine temporarily offline.</em>';
    } finally {
      if (hintBtn) hintBtn.textContent = '💡 GM Advice';
    }
  }
  window.requestGeminiChessAdvice = requestGeminiChessAdvice;

  /**
   * Render 8x8 Chessboard DOM
   */
  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const row = isBoardFlipped ? (r + 1) : (8 - r);
        const colIdx = isBoardFlipped ? (7 - c) : c;
        const squareName = '' + cols[colIdx] + row;

        const sqDiv = document.createElement('div');
        const isLight = (r + c) % 2 === 0;
        sqDiv.className = 'square ' + (isLight ? 'light' : 'dark');
        sqDiv.dataset.square = squareName;

        if (selectedSquare === squareName) {
          sqDiv.classList.add('selected');
        }

        const validMove = possibleMoves.find(m => m.to === squareName);
        if (validMove) {
          if (validMove.captured) {
            sqDiv.classList.add('valid-capture');
          } else {
            sqDiv.classList.add('valid-dest');
          }
        }

        const piece = chess.get(squareName);
        if (piece) {
          const symbol = (piece.color === 'w')
            ? UNICODE_PIECES[piece.type.toUpperCase()]
            : UNICODE_PIECES[piece.type];

          const pieceSpan = document.createElement('span');
          pieceSpan.className = 'piece-icon';
          pieceSpan.innerText = symbol;
          pieceSpan.style.color = (piece.color === 'w') ? '#fff' : '#000';
          pieceSpan.style.textShadow = (piece.color === 'w') ? '0 0 2px #000' : '0 0 2px #fff';
          sqDiv.appendChild(pieceSpan);
        }

        sqDiv.onclick = () => handleSquareClick(squareName);
        boardEl.appendChild(sqDiv);
      }
    }
  }

  /**
   * Handle Square Click / Piece Selection
   */
  function handleSquareClick(sqName) {
    if (chess.game_over() || chess.in_threefold_repetition()) return;
    if (gameMode === 'play' && (chess.turn() === 'b' || isAiThinking)) return;

    const pieceOnSquare = chess.get(sqName);

    if (selectedSquare) {
      const matchingMove = possibleMoves.some(m => m.to === sqName);
      if (matchingMove) {
        makeMove({ from: selectedSquare, to: sqName, promotion: 'q' });
        return;
      }

      if (pieceOnSquare && pieceOnSquare.color === chess.turn()) {
        selectedSquare = sqName;
        possibleMoves = chess.moves({ square: sqName, verbose: true });
        renderBoard();
        return;
      }

      selectedSquare = null;
      possibleMoves = [];
      renderBoard();
      return;
    }

    if (pieceOnSquare && pieceOnSquare.color === chess.turn()) {
      selectedSquare = sqName;
      possibleMoves = chess.moves({ square: sqName, verbose: true });
    } else {
      selectedSquare = null;
      possibleMoves = [];
    }

    renderBoard();
  }

  /**
   * Reset / Start New Game
   */
  function startNewGame() {
    clearTimeout(engineFallbackTimer);
    isAiThinking = false;
    if (retryBtn) retryBtn.style.display = 'none';
    if (gameOverBannerEl) gameOverBannerEl.style.display = 'none';

    chess.reset();
    selectedSquare = null;
    possibleMoves = [];
    currentEvaluation = '0.00';
    clearArrow();
    renderBoard();
    updateTurnStatus();
    updateOpeningDisplay();

    const hintEl = document.getElementById('gemini-chess-hint');
    if (hintEl) hintEl.style.display = 'none';
    const commentaryEl = document.getElementById('gemini-chess-commentary');
    if (commentaryEl) {
      commentaryEl.textContent = '"Welcome! Every move tells a story. Play your opening and let\'s explore deep Grandmaster strategy together."';
    }

    requestEngineMove();
  }

  // --- Attach Event Listeners ---
  window.addEventListener('online', connectStockfishWebSocket);
  window.addEventListener('offline', () => {
    if (statusDotEl) statusDotEl.className = 'dot offline';
    if (statusLabelEl) statusLabelEl.innerText = 'Offline Mode (Local)';
    log('Offline: Local engine engaged.');
  });

  const newBtn = document.getElementById('newBtn');
  if (newBtn) newBtn.onclick = startNewGame;

  const bannerNewGameBtn = document.getElementById('bannerNewGameBtn');
  if (bannerNewGameBtn) bannerNewGameBtn.onclick = startNewGame;

  const flipBtn = document.getElementById('flipBtn');
  if (flipBtn) {
    flipBtn.onclick = () => {
      isBoardFlipped = !isBoardFlipped;
      renderBoard();
      if (isArrowEnabled && lastSuggestedMove && lastSuggestedMove.from && lastSuggestedMove.to) {
        setTimeout(() => drawArrow(lastSuggestedMove.from, lastSuggestedMove.to), 20);
      }
    };
  }

  const modeBtn = document.getElementById('modeBtn');
  if (modeBtn) {
    modeBtn.onclick = function () {
      if (gameMode === 'play') {
        gameMode = 'analysis';
        this.innerText = 'Mode: Analysis';
        this.classList.add('active');
        isAiThinking = false;
        if (retryBtn) retryBtn.style.display = 'none';
      } else {
        gameMode = 'play';
        this.innerText = 'Mode: vs AI';
        this.classList.remove('active');
        if (chess.turn() === 'b') {
          isAiThinking = true;
          requestEngineMove();
        }
      }
    };
  }

  const arrowToggleBtn = document.getElementById('arrowToggleBtn');
  if (arrowToggleBtn) {
    arrowToggleBtn.onclick = function () {
      isArrowEnabled = !isArrowEnabled;
      if (isArrowEnabled) {
        this.innerText = 'Arrow: ON';
        this.classList.add('active');
        if (lastSuggestedMove && lastSuggestedMove.from && lastSuggestedMove.to) {
          drawArrow(lastSuggestedMove.from, lastSuggestedMove.to);
        }
      } else {
        this.innerText = 'Arrow: OFF';
        this.classList.remove('active');
        clearArrow();
      }
    };
  }

  if (retryBtn) {
    retryBtn.onclick = () => {
      if (chess.turn() === 'b') isAiThinking = true;
      requestEngineMove();
    };
  }

  const depthSelect = document.getElementById('depthSelect');
  if (depthSelect) {
    depthSelect.onchange = () => {
      requestEngineMove();
    };
  }

  // Resize handler for responsive arrow alignment across resolution changes
  window.addEventListener('resize', () => {
    if (isArrowEnabled && lastSuggestedMove && lastSuggestedMove.from && lastSuggestedMove.to) {
      drawArrow(lastSuggestedMove.from, lastSuggestedMove.to);
    }
  });

  // Initial Boot
  renderBoard();
  connectStockfishWebSocket();
  updateOpeningDisplay();
  updateGeminiChessUI();

})();