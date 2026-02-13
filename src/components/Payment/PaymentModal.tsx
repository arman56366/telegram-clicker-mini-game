/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { useState, useCallback } from 'react';
import { usePaymentStars } from './usePaymentStars';
import { usePaymentTON } from './usePaymentTON';
import useGame from '../../stores/store';
import styles from './PaymentModal.module.scss';

interface PaymentOption {
  coins: number;
  stars: number;
  ton: number; // в TON
  popular?: boolean;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentOptions: PaymentOption[] = [
  { coins: 100, stars: 1, ton: 0.02 },
  { coins: 500, stars: 5, ton: 0.1 },
  { coins: 1000, stars: 10, ton: 0.2, popular: true },
  { coins: 5000, stars: 50, ton: 1 },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { updateCoins } = useGame((state: any) => state);
  const { handleTelegramStarsPayment, paymentTelegramStarsStatus } = usePaymentStars();
  const { handleTonPayment, paymentTONStatus } = usePaymentTON();
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStarsPayment = useCallback(async (option: PaymentOption) => {
    setError(null);
    setProcessingPayment(`stars-${option.coins}`);

    try {
      await handleTelegramStarsPayment(option.stars);
      
      // После успешного платежа добавляем монеты
      setTimeout(() => {
        updateCoins(option.coins);
        setProcessingPayment(null);
        // Закрываем модаль через 500ms для показа успеха
        setTimeout(onClose, 500);
      }, 1000);
    } catch (err) {
      setError('Payment failed. Please try again.');
      setProcessingPayment(null);
      console.error('Telegram Stars payment error:', err);
    }
  }, [handleTelegramStarsPayment, updateCoins, onClose]);

  const handleTonPaymentClick = useCallback(async (option: PaymentOption) => {
    setError(null);
    setProcessingPayment(`ton-${option.coins}`);

    try {
      // Конвертируем TON в nanoTON (1 TON = 1e9 nanoTON)
      const nanoTON = Math.floor(option.ton * 1_000_000_000);
      
      // TODO: Замените на актуальный адрес вашего кошелька
      const walletAddress = import.meta.env.VITE_WALLET_ADDRESS || 'UQBSJ1GYvxqVaroKzzW_4JpT4Z_TcWX_zpDMPF-_OhjLZ6e';
      
      await handleTonPayment(nanoTON, walletAddress);
      
      // После успешного платежа добавляем монеты
      setTimeout(() => {
        updateCoins(option.coins);
        setProcessingPayment(null);
        // Закрываем модаль через 500ms
        setTimeout(onClose, 500);
      }, 1000);
    } catch (err) {
      setError('Payment failed. Please try again.');
      setProcessingPayment(null);
      console.error('TON payment error:', err);
    }
  }, [handleTonPayment, updateCoins, onClose]);

  if (!isOpen) return null;

  const isProcessing = processingPayment !== null || paymentTelegramStarsStatus === 'pending' || paymentTONStatus === 'pending';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div className={styles.header}>
          <h2>Add Coins</h2>
          <p className={styles.subtitle}>Choose your payment method</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.optionsGrid}>
          {paymentOptions.map((option) => (
            <div 
              key={option.coins} 
              className={`${styles.option} ${option.popular ? styles.popular : ''}`}
            >
              {option.popular && <span className={styles.badge}>POPULAR</span>}
              
              <div className={styles.coinInfo}>
                <span className={styles.coinAmount}>{option.coins}</span>
                <span className={styles.coinLabel}>coins</span>
              </div>

              <div className={styles.paymentButtons}>
                <button
                  className={styles.starsBtn}
                  onClick={() => handleStarsPayment(option)}
                  disabled={isProcessing}
                  title={`Pay ${option.stars} Telegram Stars`}
                >
                  {processingPayment === `stars-${option.coins}` ? (
                    <span className={styles.spinner}>⟳</span>
                  ) : (
                    <>
                      <span className={styles.icon}>⭐</span>
                      <span className={styles.amount}>{option.stars}</span>
                    </>
                  )}
                </button>

                <button
                  className={styles.tonBtn}
                  onClick={() => handleTonPaymentClick(option)}
                  disabled={isProcessing}
                  title={`Pay ${option.ton} TON`}
                >
                  {processingPayment === `ton-${option.coins}` ? (
                    <span className={styles.spinner}>⟳</span>
                  ) : (
                    <>
                      <span className={styles.icon}>💎</span>
                      <span className={styles.amount}>{option.ton}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p className={styles.disclaimer}>
            Payments are processed securely through Telegram and TON blockchain
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
