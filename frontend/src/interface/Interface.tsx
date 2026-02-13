/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import useGame from '../stores/store';
import HelpModal from './helpModal/HelpModal';
import HelpButton from './helpButton/HelpButton';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import './style.css';

const Interface = () => {
  // Добавляем 'start' в деструктуризацию, чтобы кнопка могла запускать игру
  const { modal, coins, win, bet, phase, updateBet, start } = useGame(
    (state: any) => state
  );
  
  const animatedCoins = useAnimatedNumber(coins);

  return (
    <>
      {/* Help Button */}
      <HelpButton />

      {/* Modal */}
      {modal && <HelpModal />}

      {/* Logo */}
      <div id="logo-section">
        <a
          href="https://github.com/michaelkolesidis/cherry-charm"
          target="_blank"
          rel="noreferrer"
        >
          <img className="logo" src="./images/logo.png" alt="Logo" />
        </a>

        <div id="version">{"1.0.0"}</div>
      </div>

      <div className="interface">
        {/* Coins */}
        <div className="coins-section">
          <div className="coins-number">{animatedCoins}</div>
          <img className="coins-image" src="./images/coin.png" alt="coin" />
        </div>

        {/* Bet */}
        <div className="bet-section">
          <div className="bet-label">BET:</div>
          <div className="bet-amount">{bet}</div>
          <div id="bet-controls" className={phase === 'idle' ? '' : 'hidden'}>
            <div
              id="increase-bet"
              className="bet-control"
              onClick={() => updateBet(1)}
            >
              ⏶
            </div>
            <div
              id="decrease-bet"
              className="bet-control"
              onClick={() => updateBet(-1)}
            >
              ⏷
            </div>
          </div>
        </div>

        {/* КНОПКА SPIN — Добавлена сюда */}
        <div className="spin-section">
          <button 
            className={`spin-button ${phase !== 'idle' ? 'disabled' : ''}`}
            onClick={start}
            disabled={phase !== 'idle' || coins < bet}
          >
            {phase === 'spinning' ? '...' : 'SPIN'}
          </button>
        </div>

        {/* Win */}
        <div className="win-section">
          <div className="win-number">WIN: {win}</div>
        </div>
      </div>
    </>
  );
};

export default Interface;
