import { useEffect, useMemo, useRef, useState } from 'react';

type CellValue = '' | 'X' | 'O';
type GameResult = 'X' | 'O' | 'draw' | null;
type ThemeMode = 'light' | 'pink' | 'dark';
type PlayerSymbol = 'X' | 'O' | '△' | '○' | '★' | '♥';
type WinningEffect = 'confetti' | 'symbol-rain' | 'pulse';
type Scoreboard = {
  playerX: number;
  draws: number;
  playerO: number;
};
type PlayerNames = {
  playerX: string;
  playerO: string;
};
type PlayerSymbols = {
  playerX: PlayerSymbol;
  playerO: PlayerSymbol;
};
type PlayerWinningEffects = {
  playerX: WinningEffect;
  playerO: WinningEffect;
};
type GameHistoryEntry = {
  id: string;
  result: Exclude<GameResult, null>;
  summary: string;
  finishedAt: string;
  winnerSymbol: PlayerSymbol | null;
};

type ConfettiPiece = {
  backgroundColor: string;
  left: string;
  top: string;
  width: string;
  height: string;
  animationDelay: string;
  animationDuration: string;
  transform: string;
};

function getPlayerName(player: 'X' | 'O', names: PlayerNames) {
  return player === 'X' ? names.playerX : names.playerO;
}

function getPlayerSymbol(player: 'X' | 'O', symbols: PlayerSymbols) {
  return player === 'X' ? symbols.playerX : symbols.playerO;
}

function getPlayerWinningEffect(player: 'X' | 'O', effects: PlayerWinningEffects) {
  return player === 'X' ? effects.playerX : effects.playerO;
}

const symbolOptions: PlayerSymbol[] = ['X', 'O', '△', '○', '★', '♥'];
const winningEffectOptions: Array<{ value: WinningEffect; label: string }> = [
  { value: 'confetti', label: 'Confetti' },
  { value: 'symbol-rain', label: 'Symbol Rain' },
  { value: 'pulse', label: 'Pulse Ring' },
];

function createConfettiPieces(): ConfettiPiece[] {
  const colors = ['#fb7185', '#f97316', '#facc15', '#34d399', '#60a5fa', '#c084fc', '#f9a8d4'];

  return Array.from({ length: 36 }, (_, index) => {
    const size = 8 + (index % 4) * 3;
    const left = (index * 11 + 7) % 100;
    const top = (index * 17 + 13) % 100;

    return {
      backgroundColor: colors[index % colors.length],
      left: `${left}%`,
      top: `${top}%`,
      width: `${size}px`,
      height: `${size * 0.45}px`,
      animationDelay: `${(index % 6) * 0.08}s`,
      animationDuration: `${1.8 + (index % 5) * 0.18}s`,
      transform: `rotate(${(index * 23) % 180}deg)`,
    };
  });
}

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function getGameResult(board: CellValue[]): GameResult {
  for (const [a, b, c] of winningCombinations) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (!board.includes('')) {
    return 'draw';
  }

  return null;
}

function getWinningCombination(board: CellValue[]): readonly [number, number, number] | null {
  for (const [a, b, c] of winningCombinations) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c] as const;
    }
  }

  return null;
}

export default function App() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill('') as CellValue[]);
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [roundStarter, setRoundStarter] = useState<'X' | 'O'>('X');
  const [nextStarter, setNextStarter] = useState<'X' | 'O' | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [gameStarted, setGameStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [playerNames, setPlayerNames] = useState<PlayerNames>({
    playerX: 'Player 1',
    playerO: 'Player 2',
  });
  const [playerSymbols, setPlayerSymbols] = useState<PlayerSymbols>({
    playerX: 'X',
    playerO: 'O',
  });
  const [playerWinningEffects, setPlayerWinningEffects] = useState<PlayerWinningEffects>({
    playerX: 'confetti',
    playerO: 'symbol-rain',
  });
  const [scoreboard, setScoreboard] = useState<Scoreboard>({ playerX: 0, draws: 0, playerO: 0 });
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [winLineStyle, setWinLineStyle] = useState<React.CSSProperties | null>(null);

  const result = useMemo(() => getGameResult(board), [board]);
  const winningCombination = useMemo(() => getWinningCombination(board), [board]);
  const winnerEffect = result && result !== 'draw' ? getPlayerWinningEffect(result, playerWinningEffects) : null;
  const confettiPieces = useMemo(
    () => (winnerEffect === 'confetti' ? createConfettiPieces() : []),
    [winnerEffect],
  );
  const gameActive = result === null;

  const statusText =
    result === 'draw'
      ? "It's a draw!"
      : result
        ? `${getPlayerName(result, playerNames)} wins!`
        : `${getPlayerName(currentPlayer, playerNames)}'s turn`;
  const winningSymbol = result && result !== 'draw' ? getPlayerSymbol(result, playerSymbols) : null;
  const winningPlayerName = result && result !== 'draw' ? getPlayerName(result, playerNames) : null;
  const winnerSymbolRain =
    result && result !== 'draw' && winnerEffect === 'symbol-rain'
      ? Array.from({ length: 28 }, (_, index) => ({
          id: index,
          left: `${(index * 13 + 9) % 100}%`,
          delay: `${(index % 7) * 0.07}s`,
          duration: `${1.5 + (index % 5) * 0.2}s`,
          rotate: `${(index * 19) % 180 - 90}deg`,
        }))
      : [];

  useEffect(() => {
    if (!winningCombination || !boardRef.current) {
      setWinLineStyle(null);
      return;
    }

    const [startIndex, , endIndex] = winningCombination;

    const updateLine = () => {
      const boardElement = boardRef.current;
      if (!boardElement) {
        return;
      }

      const startElement = boardElement.querySelector<HTMLButtonElement>(`button[data-index="${startIndex}"]`);
      const endElement = boardElement.querySelector<HTMLButtonElement>(`button[data-index="${endIndex}"]`);

      if (!startElement || !endElement) {
        setWinLineStyle(null);
        return;
      }

      const boardRect = boardElement.getBoundingClientRect();
      const startRect = startElement.getBoundingClientRect();
      const endRect = endElement.getBoundingClientRect();

      const startX = startRect.left + startRect.width / 2 - boardRect.left;
      const startY = startRect.top + startRect.height / 2 - boardRect.top;
      const endX = endRect.left + endRect.width / 2 - boardRect.left;
      const endY = endRect.top + endRect.height / 2 - boardRect.top;

      const dx = endX - startX;
      const dy = endY - startY;
      const lineLength = Math.hypot(dx, dy);
      const lineAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      setWinLineStyle({
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${lineLength}px`,
        transform: `translateY(-50%) rotate(${lineAngle}deg)`,
      });
    };

    updateLine();

    const resizeObserver = new ResizeObserver(updateLine);
    resizeObserver.observe(boardRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [winningCombination]);

  function startGameRound(starter: 'X' | 'O') {
    setRoundStarter(starter);
    setCurrentPlayer(starter);
    setBoard(Array(9).fill('') as CellValue[]);
  }

  function handleStartGame() {
    const starter = nextStarter ?? (Math.random() < 0.5 ? 'X' : 'O');
    startGameRound(starter);
    setGameStarted(true);
  }

  function handleCellClick(index: number) {
    if (!gameActive || board[index]) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    const nextResult = getGameResult(nextBoard);

    if (nextResult) {
      const summary =
        nextResult === 'draw'
          ? `Draw (${playerSymbols.playerX} vs ${playerSymbols.playerO})`
          : `${getPlayerName(nextResult, playerNames)} Won!`;

      setGameHistory((history) => [
        {
          id: `${Date.now()}-${history.length}`,
          result: nextResult,
          summary,
          finishedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          winnerSymbol: nextResult === 'draw' ? null : getPlayerSymbol(nextResult, playerSymbols),
        },
        ...history,
      ]);

      if (nextResult === 'X') {
        setNextStarter('O');
      } else if (nextResult === 'O') {
        setNextStarter('X');
      } else {
        setNextStarter(roundStarter);
      }
    }

    if (nextResult === 'X') {
      setScoreboard((currentScore) => ({
        ...currentScore,
        playerX: currentScore.playerX + 1,
      }));
    } else if (nextResult === 'draw') {
      setScoreboard((currentScore) => ({
        ...currentScore,
        draws: currentScore.draws + 1,
      }));
    } else if (nextResult === 'O') {
      setScoreboard((currentScore) => ({
        ...currentScore,
        playerO: currentScore.playerO + 1,
      }));
    }

    setBoard(nextBoard);

    if (nextResult === null) {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }

  function resetGame() {
    const starter = nextStarter ?? roundStarter;
    startGameRound(starter);
  }

  function handleReturnToSetup() {
    setBoard(Array(9).fill('') as CellValue[]);
    setCurrentPlayer('X');
    setRoundStarter('X');
    setNextStarter(null);
    setShowMenu(false);
    setShowHistory(false);
    setGameStarted(false);
  }

  if (!gameStarted) {
    return (
      <main className={`app-shell theme-${theme}`}>
        <section className="game-card setup-card">
          <p className="setup-kicker">Game setup</p>
          <h1>Tic-Tac-Toe</h1>
          <p className="setup-preview">
            {playerNames.playerX} {playerSymbols.playerX} vs {playerNames.playerO} {playerSymbols.playerO}
          </p>

          <div className="setup-stack">
            <label className="theme-control setup-theme-control" htmlFor="theme-select">
              Mode
              <select
                id="theme-select"
                value={theme}
                onChange={(event) => setTheme(event.target.value as ThemeMode)}
              >
                <option value="light">Light mode</option>
                <option value="pink">Pink mode</option>
                <option value="dark">Dark mode</option>
              </select>
            </label>

            <div className="name-controls setup-name-controls" aria-label="Player name settings">
              <label className="name-field" htmlFor="player-x-name">
                Player 1 name
                <input
                  id="player-x-name"
                  type="text"
                  placeholder="Player 1"
                  value={playerNames.playerX}
                  onChange={(event) =>
                    setPlayerNames((currentNames) => ({
                      ...currentNames,
                      playerX: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="name-field" htmlFor="player-x-symbol">
                Player 1 symbol
                <select
                  id="player-x-symbol"
                  value={playerSymbols.playerX}
                  onChange={(event) =>
                    setPlayerSymbols((currentSymbols) => ({
                      ...currentSymbols,
                      playerX: event.target.value as PlayerSymbol,
                    }))
                  }
                >
                  {symbolOptions.map((symbol) => (
                    <option key={symbol} value={symbol} disabled={symbol === playerSymbols.playerO}>
                      {symbol}
                    </option>
                  ))}
                </select>
              </label>
              <label className="name-field" htmlFor="player-x-effect">
                Winning Effect
                <select
                  id="player-x-effect"
                  value={playerWinningEffects.playerX}
                  onChange={(event) =>
                    setPlayerWinningEffects((currentEffects) => ({
                      ...currentEffects,
                      playerX: event.target.value as WinningEffect,
                    }))
                  }
                >
                  {winningEffectOptions.map((effect) => (
                    <option key={effect.value} value={effect.value}>
                      {effect.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="name-field" htmlFor="player-o-name">
                Player 2 name
                <input
                  id="player-o-name"
                  type="text"
                  placeholder="Player 2"
                  value={playerNames.playerO}
                  onChange={(event) =>
                    setPlayerNames((currentNames) => ({
                      ...currentNames,
                      playerO: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="name-field" htmlFor="player-o-symbol">
                Player 2 symbol
                <select
                  id="player-o-symbol"
                  value={playerSymbols.playerO}
                  onChange={(event) =>
                    setPlayerSymbols((currentSymbols) => ({
                      ...currentSymbols,
                      playerO: event.target.value as PlayerSymbol,
                    }))
                  }
                >
                  {symbolOptions.map((symbol) => (
                    <option key={symbol} value={symbol} disabled={symbol === playerSymbols.playerX}>
                      {symbol}
                    </option>
                  ))}
                </select>
              </label>
              <label className="name-field" htmlFor="player-o-effect">
                Winning Effect
                <select
                  id="player-o-effect"
                  value={playerWinningEffects.playerO}
                  onChange={(event) =>
                    setPlayerWinningEffects((currentEffects) => ({
                      ...currentEffects,
                      playerO: event.target.value as WinningEffect,
                    }))
                  }
                >
                  {winningEffectOptions.map((effect) => (
                    <option key={effect.value} value={effect.value}>
                      {effect.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <button type="button" className="reset-button setup-start-button" onClick={handleStartGame}>
            Start Game
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell theme-${theme}`}>
      {confettiPieces.length > 0 ? (
        <div className="confetti-layer" aria-hidden="true">
          {confettiPieces.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                backgroundColor: piece.backgroundColor,
                left: piece.left,
                top: piece.top,
                width: piece.width,
                height: piece.height,
                animationDelay: piece.animationDelay,
                animationDuration: piece.animationDuration,
                transform: piece.transform,
              }}
            />
          ))}
        </div>
      ) : null}

      {winnerSymbolRain.length > 0 ? (
        <div className="win-effect-symbol-rain" aria-hidden="true">
          {winnerSymbolRain.map((drop) => (
            <span
              key={drop.id}
              className="win-effect-symbol-rain-piece"
              style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration, transform: `rotate(${drop.rotate})` }}
            >
              {winningSymbol}
            </span>
          ))}
        </div>
      ) : null}

      <section className="game-card play-card">
        <button
          type="button"
          className="past-button"
          aria-label="View game history"
          aria-expanded={showHistory}
          onClick={() => {
            setShowMenu(false);
            setShowHistory((isOpen) => !isOpen);
          }}
        >
          <span className="clock-icon" aria-hidden="true" />
        </button>

        {showHistory ? (
          <div className="history-backdrop" role="presentation" onClick={() => setShowHistory(false)}>
            <aside className="history-panel" aria-label="Past games" onClick={(event) => event.stopPropagation()}>
              <div className="history-header">
                <h2>Past Games</h2>
                <button type="button" className="history-clear" onClick={() => setGameHistory([])}>
                  Clear
                </button>
              </div>

              {gameHistory.length === 0 ? (
                <p className="history-empty">No finished games yet.</p>
              ) : (
                <ul className="history-list">
                  {gameHistory.map((entry) => (
                    <li key={entry.id} className={`history-item history-${entry.result}`}>
                      <div className="history-item-copy">
                        <p>{entry.summary}</p>
                        <span>{entry.finishedAt}</span>
                      </div>
                      {entry.result === 'draw' ? (
                        <div className="history-item-draw-tag">DRAW</div>
                      ) : entry.winnerSymbol ? (
                        <div className="history-item-symbol">{entry.winnerSymbol}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        ) : null}

        <button
          type="button"
          className="menu-button"
          aria-label="Open player options"
          aria-expanded={showMenu}
          onClick={() => {
            setShowHistory(false);
            setShowMenu((isOpen) => !isOpen);
          }}
        >
          <span />
          <span />
          <span />
        </button>

        {showMenu ? (
          <div className="menu-backdrop" role="presentation" onClick={() => setShowMenu(false)}>
            <div className="menu-panel" role="dialog" aria-label="Player options" onClick={(event) => event.stopPropagation()}>
              <label className="theme-control menu-theme-control" htmlFor="game-theme-select">
                Mode
                <select
                  id="game-theme-select"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as ThemeMode)}
                >
                  <option value="light">Light mode</option>
                  <option value="pink">Pink mode</option>
                  <option value="dark">Dark mode</option>
                </select>
              </label>

              <div className="name-controls menu-name-controls" aria-label="Player name settings">
                <label className="name-field" htmlFor="game-player-x-name">
                  Player 1 name
                  <input
                    id="game-player-x-name"
                    type="text"
                    placeholder="Player 1"
                    value={playerNames.playerX}
                    onChange={(event) =>
                      setPlayerNames((currentNames) => ({
                        ...currentNames,
                        playerX: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="name-field" htmlFor="game-player-o-name">
                  Player 2 name
                  <input
                    id="game-player-o-name"
                    type="text"
                    placeholder="Player 2"
                    value={playerNames.playerO}
                    onChange={(event) =>
                      setPlayerNames((currentNames) => ({
                        ...currentNames,
                        playerO: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <button type="button" className="menu-link-button" onClick={handleReturnToSetup}>
                Back To Setup
              </button>
            </div>
          </div>
        ) : null}

        <h1>Tic-Tac-Toe</h1>
        <p className="status" aria-live="polite">{statusText}</p>

        <div className="scoreboard" aria-label="Scoreboard">
          <div className="scoreboard-item">
            <span className="scoreboard-label">{playerNames.playerX}</span>
            <strong className="scoreboard-value">{scoreboard.playerX}</strong>
          </div>
          <div className="scoreboard-item scoreboard-item-draw">
            <span className="scoreboard-label">Draws</span>
            <strong className="scoreboard-value">{scoreboard.draws}</strong>
          </div>
          <div className="scoreboard-item">
            <span className="scoreboard-label">{playerNames.playerO}</span>
            <strong className="scoreboard-value">{scoreboard.playerO}</strong>
          </div>
        </div>

        <div className="board-shell">
          <div
            ref={boardRef}
            className={`board${result === 'draw' ? ' board-draw' : ''}`}
            role="grid"
            aria-label="Tic tac toe board"
          >
            {board.map((value, index) => (
              <button
                key={index}
                data-index={index}
                type="button"
                className={`cell${value ? ` cell-${value.toLowerCase()}` : ''}`}
                onClick={() => handleCellClick(index)}
                aria-label={`Cell ${index + 1}${value ? `, ${getPlayerSymbol(value, playerSymbols)}` : ''}`}
                disabled={!gameActive || Boolean(value)}
              >
                {value ? getPlayerSymbol(value, playerSymbols) : ''}
              </button>
            ))}

            {winLineStyle ? <span className="win-line" style={winLineStyle} aria-hidden="true" /> : null}
          </div>

          {result === 'draw' ? (
            <div className="draw-pop">
              <p>It's A Draw!</p>
            </div>
          ) : null}

          {winnerEffect === 'pulse' ? <div className="win-effect-pulse" aria-hidden="true" /> : null}

          {winningSymbol && winningPlayerName ? (
            <div className="winner-symbol-pop">
              <p className="winner-label">{winningPlayerName} wins!</p>
              <span>{winningSymbol}</span>
            </div>
          ) : null}
        </div>

        <button type="button" className="reset-button" onClick={resetGame}>
          Reset Game
        </button>
      </section>
    </main>
  );
}