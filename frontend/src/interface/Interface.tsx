/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { useState } from 'react';
import useGame from '../stores/store';
import HelpModal from './helpModal/HelpModal';
import HelpButton from './helpButton/HelpButton';
import PaymentModal from '../components/Payment/PaymentModal';
import PayLine from '../components/PayLine';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import './style.css';

const Interface = () => {
  const { modal, coins, win, bet, phase, updateBet, start } = useGame(
    (state: any) => state
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const animatedCoins = useAnimatedNumber(coins);

  return (
    <>
      <HelpButton />
      {modal && <HelpModal />}

      {/* Логотип теперь БЕЗ ссылки на гитхаб, чтобы не мешать кликам */}
      <div id="logo-section">
        <img className="logo" src="./images/logo.png" alt="Logo" />
        <div id="version">{"1.0.0"}</div>
      </div>

      <div className="interface">
      {/* Линия выигрыша */}
        <PayLine />

      {/* Баланс монет */}
        <div className="coins-section">
          <div className="coins-number">{animatedCoins}</div>
          <img className="coins-image" src="./images/coin.png" alt="coin" />
          
          {/* Кнопка добавления монет */}
          <button 
            className="add-coins-btn"
            onClick={() => setShowPaymentModal(true)}
            title="Add coins with Telegram Stars or TON"
          >
            +
          </button>
        </div>

        {/* Ставка и кнопки управления */}
        <div className="bet-section">
          <div className="bet-label">BET:</div>
          <div className="bet-amount">{bet}</div>
          <div id="bet-controls" className={phase === 'idle' ? '' : 'hidden'}>
            <div className="bet-control" onClick={() => updateBet(1)}>⏶</div>
            <div className="bet-control" onClick={() => updateBet(-1)}>⏷</div>
          </div>
        </div>

        {/* Кнопка SPIN — добавлена отдельно с защитой от случайных переходов */}
        <div className="spin-container">
          <button 
            className="spin-button"
            onClick={(e) => {
              e.stopPropagation();
              if (phase === 'idle' && coins >= bet) {
                start();
              }
            }}
            disabled={phase !== 'idle' || coins < bet}
          >
            {phase === 'spinning' ? '...' : 'SPIN'}
          </button>
        </div>

        {/* Выигрыш */}
        <div className="win-section">
          <div className="win-number">WIN: {win}</div>
        </div>
      </div>

      {/* Модальное окно платежа */}
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </>
  );
};

export default Interface;
