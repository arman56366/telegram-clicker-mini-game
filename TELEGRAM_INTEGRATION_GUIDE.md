# Интеграция Telegram платежей в казино

## Обзор текущей архитектуры

Проект поддерживает 2 метода оплаты:
1. **Telegram Stars** - внутренняя валюта Telegram
2. **TON** - блокчейн криптовалюта через TONConnect

---

## 1️⃣ Как работает Telegram Stars

### Frontend (usePaymentStars.ts)
```typescript
// Используется Telegram WebApp API
const result = await win.Telegram?.WebApp.invokeCustomMethod("payWithStars", { amount })
```

**Поток:**
1. Пользователь жмет кнопку "Pay with Telegram Stars"
2. Telegram открывает встроенное меню оплаты
3. После успешной оплаты возвращается результат
4. Frontend отправляет запрос на backend

### Backend (PaymentController.ts)
```typescript
// 1. Валидируются входные данные
// 2. Проверяется баланс пользователя (TODO: реализовать)
// 3. Создается запись платежа со статусом "pending"
// 4. Проверяется статус платежа в Telegram API (TODO: реализовать)
// 5. Если успешно - статус меняется на "completed"
// 6. Монеты добавляются в баланс пользователя
```

---

## 2️⃣ Как работает TON платеж

### Frontend (usePaymentTON.ts)
```typescript
// Используется TonConnect SDK
const connector = new TonConnect({
  manifestUrl: "https://your-app.com/tonconnect-manifest.json"
})

// Подключение кошелька
const wallet = await connector.connect()

// Отправка транзакции
const result = await connector.sendTransaction(transaction)
```

**Поток:**
1. Пользователь жмет кнопку "Pay 1 TON"
2. TonConnect открывает меню выбора кошелька
3. Пользователь подтверждает транзакцию в кошельке
4. Blockchain подтверждает транзакцию
5. Frontend получает результат и отправляет на backend

### Backend (PaymentController.ts)
```typescript
// 1. Валидируются входные данные (кошелек, сумма)
// 2. Проверяется баланс кошелька (TODO: реализовать)
// 3. Создается запись платежа
// 4. Проверяется статус транзакции в TON API (TODO: реализовать)
// 5. Если успешно - статус меняется на "completed"
// 6. Монеты добавляются в баланс
```

---

## 3️⃣ Как добавить платежи в казино

### Шаг 1: Создать компонент PaymentModal

```tsx
// frontend/src/components/PaymentModal/PaymentModal.tsx
import React, { useState } from 'react';
import { usePaymentStars } from '../Payment/usePaymentStars';
import { usePaymentTON } from '../Payment/usePaymentTON';
import useGame from '../../stores/store';
import styles from './PaymentModal.module.scss';

const PaymentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { coins, updateCoins } = useGame((state: any) => state);
  const { handleTelegramStarsPayment, paymentTelegramStarsStatus } = usePaymentStars();
  const { handleTonPayment, paymentTONStatus } = usePaymentTON();

  const [selectedAmount, setSelectedAmount] = useState(100);

  const paymentOptions = [
    { coins: 100, stars: 1 },
    { coins: 500, stars: 5 },
    { coins: 1000, stars: 10 },
    { coins: 5000, stars: 50 },
  ];

  const handleStarsPayment = async (amount: number, coins: number) => {
    try {
      await handleTelegramStarsPayment(amount);
      // После успешного платежа добавляем монеты
      if (paymentTelegramStarsStatus === 'success') {
        updateCoins(coins);
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleTonPaymentClick = async (amount: number, coins: number) => {
    try {
      // 1 TON = 1,000,000,000 nanoTON
      const nanoTON = amount * 1_000_000_000;
      await handleTonPayment(nanoTON, 'YOUR_WALLET_ADDRESS');
      if (paymentTONStatus === 'success') {
        updateCoins(coins);
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <h2>Add Coins</h2>
        
        <div className={styles.options}>
          {paymentOptions.map((option) => (
            <div key={option.coins} className={styles.option}>
              <p className={styles.coinAmount}>{option.coins} coins</p>
              
              <button
                onClick={() => handleStarsPayment(option.stars, option.coins)}
                disabled={paymentTelegramStarsStatus === 'pending'}
                className={styles.starsBtn}
              >
                {paymentTelegramStarsStatus === 'pending' ? '...' : `⭐ ${option.stars}`}
              </button>
              
              <button
                onClick={() => handleTonPaymentClick(option.coins / 50, option.coins)}
                disabled={paymentTONStatus === 'pending'}
                className={styles.tonBtn}
              >
                {paymentTONStatus === 'pending' ? '...' : `💎 TON`}
              </button>
            </div>
          ))}
        </div>

        <button onClick={onClose} className={styles.closeBtn}>Close</button>
      </div>
    </div>
  );
};

export default PaymentModal;
```

### Шаг 2: Добавить кнопку в интерфейс казино

```tsx
// frontend/src/interface/Interface.tsx
const Interface = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { coins, updateCoins } = useGame((state: any) => state);

  return (
    <>
      {/* Существующий код */}
      <div className="interface">
        {/* Баланс */}
        <div className="coins-section">
          <div className="coins-number">{coins}</div>
          <img className="coins-image" src="./images/coin.png" alt="coin" />
          
          {/* Кнопка добавления монет */}
          <button 
            className="add-coins-btn"
            onClick={() => setShowPaymentModal(true)}
          >
            +
          </button>
        </div>

        {/* Остальной интерфейс */}
      </div>

      {/* Модальное окно платежа */}
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </>
  );
};
```

### Шаг 3: Создать API endpoint на backend

```typescript
// backend/src/routes/index.ts
// Добавить новый маршрут для платежей
router.post("/payments/deposit", paymentController.createDepositPayment.bind(paymentController))
```

### Шаг 4: Реализовать backend функции

```typescript
// backend/src/models/PaymentModel.ts

// Проверка баланса Telegram Stars (TODO - требует Bot API)
async checkTelegramStarsBalance(userId: number): Promise<number> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const response = await axios.get(
      `https://api.telegram.org/bot${botToken}/getStarTransactions`,
      {
        params: { user_id: userId }
      }
    );
    // Считаем общий баланс из истории транзакций
    return response.data.result?.balance || 0;
  } catch (error) {
    console.error('Error checking Telegram Stars balance:', error);
    return 0;
  }
}

// Проверка статуса платежа Telegram Stars
async waitForTelegramStarsPayment(paymentId: number): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/getPaymentStatus`,
      { payment_id: paymentId }
    );
    return response.data?.status === 'paid';
  } catch (error) {
    console.error('Error checking Telegram Stars payment:', error);
    return false;
  }
}

// Проверка баланса TON кошелька
async checkTONBalance(walletAddress: string): Promise<number> {
  try {
    const response = await axios.get(
      `https://tonapi.io/v2/accounts/${walletAddress}`
    );
    // Баланс в nanoTON, конвертируем в TON
    return parseInt(response.data.balance) / 1_000_000_000;
  } catch (error) {
    console.error('Error checking TON balance:', error);
    return 0;
  }
}

// Проверка статуса платежа TON
async waitForTONPayment(walletAddress: string, amount: number): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://tonapi.io/v2/accounts/${walletAddress}/transactions`
    );
    
    const transactions = response.data.transactions || [];
    const amountInNanoTON = amount * 1_000_000_000;
    
    // Ищем транзакцию с нужной суммой за последние 5 минут
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
    
    return transactions.some((tx: any) => 
      Math.abs(parseInt(tx.in_amount) - amountInNanoTON) < 1_000_000 && // 0.001 TON погрешность
      tx.now > fiveMinutesAgo
    );
  } catch (error) {
    console.error('Error checking TON payment:', error);
    return false;
  }
}
```

---

## 4️⃣ Полный поток покупки монет в казино

```
Пользователь видит кнопку "+" рядом с балансом
         ↓
Нажимает кнопку → Открывается PaymentModal
         ↓
Выбирает сумму (100, 500, 1000 или 5000 монет)
         ↓
Выбирает метод оплаты (Telegram Stars или TON)
         ↓
Frontend: handleStarsPayment() или handleTonPayment()
         ↓
Telegram WebApp API / TonConnect SDK открывает интерфейс оплаты
         ↓
Пользователь подтверждает платеж
         ↓
Backend: POST /api/payments/deposit
  - Создается запись платежа (status: pending)
  - Проверяется статус в Telegram API / TON API
  - Если успешно:
    - Статус меняется на "completed"
    - Монеты добавляются к пользователю
         ↓
Frontend: Получает response с успехом
         ↓
updateCoins(amount) - обновляет баланс в store
         ↓
Казино: Пользователь видит новый баланс и может играть!
```

---

## 5️⃣ Стили для PaymentModal

```scss
// frontend/src/components/PaymentModal/PaymentModal.module.scss
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.content {
  background: #1a1a1f;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  color: white;

  h2 {
    text-align: center;
    margin-bottom: 30px;
    font-size: 24px;
  }
}

.options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.option {
  background: #2a2a2f;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .coinAmount {
    font-size: 18px;
    font-weight: bold;
    margin: 0;
    flex: 1;
  }
}

.starsBtn, .tonBtn {
  flex: 1;
  padding: 10px;
  margin: 0 5px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: scale(1.05);
  }
}

.starsBtn {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #000;
}

.tonBtn {
  background: linear-gradient(135deg, #0098ea, #00d4ff);
  color: white;
}

.closeBtn {
  width: 100%;
  padding: 12px;
  background: #3a3a3f;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #4a4a4f;
  }
}
```

---

## 6️⃣ Переменные окружения

### .env (Backend)
```
TELEGRAM_BOT_TOKEN=ваш_bot_token_здесь
TONAPI_KEY=ваш_tonapi_ключ_здесь
```

### Frontend config
```typescript
// frontend/src/utils/config.ts
export const PAYMENT_CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.VITE_TELEGRAM_BOT_TOKEN,
  TON_MANIFEST_URL: process.env.VITE_TON_MANIFEST_URL || 'https://your-app.com/tonconnect-manifest.json',
  // Курсы конвертации (примеры)
  STARS_TO_COINS: 100, // 1 Star = 100 coins
  TON_TO_COINS: 5000,   // 1 TON = 5000 coins
};
```

---

## 7️⃣ Тестирование платежей

### Telegram Stars (Dev режим)
```
1. Убедитесь, что используется Telegram WebApp
2. Откройте Telegram Desktop или мобильное приложение
3. Найдите вашего бота и откройте Mini App
4. Нажмите кнопку оплаты (в dev режиме обычно не требуется реальный платеж)
```

### TON (Testnet)
```
1. Создайте тестовый кошелек на https://testnet.tonkeeper.com
2. Получите тестовые TON на https://testnet.toncoin.org
3. Используйте testnet manifest URL вместо mainnet
4. Проверяйте транзакции на https://testnet.tonscan.org
```

---

## 8️⃣ Безопасность

⚠️ **ВАЖНО:**

1. **Валидируйте все платежи на backend**
   - Никогда не доверяйте данным с frontend
   - Всегда проверяйте статус в API

2. **Защитите Bot Token**
   - Никогда не выкладывайте в git
   - Используйте переменные окружения
   - Ограничьте доступ API

3. **Используйте HTTPS**
   - Все платежные операции должны быть защифрованы

4. **Логируйте все платежи**
   - Создавайте audit trail для всех транзакций

5. **Rate limiting**
   - Ограничьте количество платежных запросов с одного IP

---

## 9️⃣ Часто задаваемые вопросы

**Q: Как узнать, когда платеж завершен?**
A: Backend проверяет статус в Telegram/TON API в цикле, пока не получит подтверждение.

**Q: Что если платеж не прошел?**
A: Запись остается со статусом "failed", и монеты не добавляются. Пользователь может повторить попытку.

**Q: Как связать обычные монеты с реальными деньгами?**
A: Используйте курс конвертации в PAYMENT_CONFIG (например, 1 Star = 100 coins).

**Q: Можно ли использовать оба метода одновременно?**
A: Да! Пользователь может выбрать любой метод при каждом платеже.

---

## 📚 Полезные ссылки

- [Telegram Bot API - Payments](https://core.telegram.org/bots/payments)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [TonConnect SDK](https://github.com/ton-connect/sdk)
- [TON API](https://tonapi.io)
- [TONScan](https://tonscan.org) - обозреватель блокчейна

---

**Версия документации:** 1.0.0  
**Последнее обновление:** 13 февраля 2026
