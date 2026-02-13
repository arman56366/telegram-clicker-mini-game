# Примеры реализации функций проверки платежей

## Реализация проверки Telegram Stars

### Способ 1: Через Telegram Bot API (Recommended)

```typescript
// backend/src/models/PaymentModel.ts

import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = 'https://api.telegram.org';

// Проверка баланса Telegram Stars
async checkTelegramStarsBalance(userId: number): Promise<number> {
  try {
    // Telegram не предоставляет прямой метод для проверки баланса Stars
    // Вместо этого используем историю транзакций
    const url = `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}/getStarTransactions`;
    
    const response = await axios.post(url, {
      user_id: userId,
      limit: 100, // Получаем последние 100 транзакций
    });

    if (!response.data.ok) {
      throw new Error('Failed to get Telegram Star transactions');
    }

    // Считаем баланс на основе приходящих и уходящих транзакций
    const transactions = response.data.result?.transactions || [];
    let balance = 0;

    for (const tx of transactions) {
      if (tx.source === 'telegram') {
        // Пополнение звезд
        balance += tx.amount;
      } else {
        // Трата звезд
        balance -= tx.amount;
      }
    }

    return Math.max(0, balance); // Не может быть отрицательным
  } catch (error) {
    console.error('Error checking Telegram Stars balance:', error);
    return 0; // Если ошибка, возвращаем 0
  }
}

// Проверка статуса платежа Telegram Stars
async waitForTelegramStarsPayment(paymentId: number): Promise<boolean> {
  try {
    const maxRetries = 10;
    const retryDelay = 1000; // 1 сек

    for (let i = 0; i < maxRetries; i++) {
      const url = `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}/getPaymentStatus`;

      const response = await axios.post(url, {
        user_id: paymentId, // или используй invoice_payload
      });

      if (response.data.ok) {
        const status = response.data.result?.status;
        
        // Возможные статусы: 'paid', 'pending', 'failed'
        if (status === 'paid') {
          return true;
        } else if (status === 'failed') {
          return false;
        }
        // Если 'pending', ждем дальше
      }

      // Ждем перед следующей попыткой (кроме последней)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Истек timeout
    return false;
  } catch (error) {
    console.error('Error waiting for Telegram Stars payment:', error);
    return false;
  }
}
```

### Способ 2: Через Webhooks (Advanced)

```typescript
// backend/src/controllers/PaymentController.ts

// Обработка webhook от Telegram о статусе платежа
async handleTelegramWebhook(req: Request, res: Response) {
  const { user_id, invoice_payload, status } = req.body;

  try {
    // Находим платеж в БД
    const payment = await this.paymentModel.getPaymentByUserId(user_id);

    if (status === 'paid') {
      // Платеж успешен
      await this.paymentModel.updatePaymentStatus(payment.id, 'completed');
      
      // Добавляем монеты пользователю
      const user = await this.userModel.getUserById(user_id);
      await this.userModel.updateUserCoins(
        user_id,
        user.coins + payment.amount
      );

      res.status(200).json({ ok: true });
    } else if (status === 'failed') {
      // Платеж неудачен
      await this.paymentModel.updatePaymentStatus(payment.id, 'failed');
      res.status(200).json({ ok: true });
    }
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

---

## Реализация проверки TON платежей

### Способ 1: Через TON API (tonapi.io)

```typescript
// backend/src/models/PaymentModel.ts

import axios from 'axios';

const TONAPI_URL = 'https://tonapi.io/v2';
const TONAPI_KEY = process.env.TONAPI_KEY;

// Проверка баланса TON кошелька
async checkTONBalance(walletAddress: string): Promise<number> {
  try {
    const url = `${TONAPI_URL}/accounts/${walletAddress}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${TONAPI_KEY}`,
      },
    });

    if (!response.data) {
      return 0;
    }

    // Balance хранится в nanoTON, конвертируем в TON
    const balanceInNanoTON = BigInt(response.data.balance || 0);
    const balanceInTON = parseFloat((balanceInNanoTON / BigInt(1_000_000_000n)).toString());

    return balanceInTON;
  } catch (error) {
    console.error('Error checking TON balance:', error);
    return 0;
  }
}

// Проверка статуса платежа TON (поиск транзакции)
async waitForTONPayment(
  walletAddress: string,
  amount: number,
  timeout: number = 300000 // 5 минут
): Promise<boolean> {
  try {
    const amountInNanoTON = BigInt(Math.floor(amount * 1_000_000_000));
    const startTime = Date.now();
    const pollInterval = 3000; // Проверяем каждые 3 сек

    while (Date.now() - startTime < timeout) {
      const url = `${TONAPI_URL}/accounts/${walletAddress}/transactions`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${TONAPI_KEY}`,
        },
        params: {
          limit: 20, // Проверяем последние 20 транзакций
        },
      });

      const transactions = response.data.transactions || [];
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;

      // Ищем входящую транзакцию нужного размера
      for (const tx of transactions) {
        const txAmount = BigInt(tx.in_amount || 0);
        const txTime = tx.now || 0;

        // Проверяем сумму (с погрешностью ±0.001 TON) и время
        if (
          Math.abs(txAmount - amountInNanoTON) < BigInt(1_000_000) &&
          txTime > fiveMinutesAgo &&
          tx.in_msg // Входящее сообщение (платеж)
        ) {
          return true; // Платеж найден и подтвержден
        }
      }

      // Ждем перед следующей проверкой
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout истек
    console.warn(`Payment timeout for ${walletAddress}: ${amount} TON`);
    return false;
  } catch (error) {
    console.error('Error waiting for TON payment:', error);
    return false;
  }
}
```

### Способ 2: Через TonWeb (локально)

```typescript
// backend/src/models/PaymentModel.ts

import TonWeb from 'tonweb';

const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/'));

async checkTONBalanceWithTonWeb(walletAddress: string): Promise<number> {
  try {
    const wallet = new TonWeb.Wallet(tonweb.provider, {
      address: walletAddress,
    });

    const balance = await wallet.getBalance();
    const balanceInTON = TonWeb.utils.fromNano(balance);
    
    return parseFloat(balanceInTON);
  } catch (error) {
    console.error('Error checking TON balance with TonWeb:', error);
    return 0;
  }
}

async waitForTONPaymentWithTonWeb(
  walletAddress: string,
  amount: number
): Promise<boolean> {
  try {
    const wallet = new TonWeb.Wallet(tonweb.provider, {
      address: walletAddress,
    });

    const requiredAmount = TonWeb.utils.toNano(amount.toString());
    const maxRetries = 100;
    const retryDelay = 3000; // 3 сек

    for (let i = 0; i < maxRetries; i++) {
      const balance = await wallet.getBalance();

      if (BigInt(balance) >= BigInt(requiredAmount)) {
        return true; // Баланс достаточен
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return false;
  } catch (error) {
    console.error('Error waiting for TON payment with TonWeb:', error);
    return false;
  }
}
```

---

## Интеграция в PaymentController

```typescript
// backend/src/controllers/PaymentController.ts

async createPayment(req: Request, res: Response) {
  const { userId, paymentType, amount } = req.body;
  
  try {
    // 1. Валидация
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (!paymentType || !['stars', 'ton'].includes(paymentType)) {
      return res.status(400).json({ error: 'Invalid payment type' });
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // 2. Проверка баланса
    let balance: number;
    let walletAddress: string | null = null;

    if (paymentType === 'stars') {
      balance = await this.paymentModel.checkTelegramStarsBalance(userId);
    } else if (paymentType === 'ton') {
      walletAddress = req.body.walletAddress;
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }
      balance = await this.paymentModel.checkTONBalance(walletAddress);
    }

    if (balance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        required: amount,
        available: balance,
      });
    }

    // 3. Создаем запись платежа
    const payment = await this.paymentModel.createPayment(
      userId,
      paymentType,
      amount
    );

    // 4. Проверяем статус платежа
    let paymentSuccess = false;

    if (paymentType === 'stars') {
      paymentSuccess = await this.paymentModel.waitForTelegramStarsPayment(
        payment.id
      );
    } else if (paymentType === 'ton') {
      paymentSuccess = await this.paymentModel.waitForTONPayment(
        walletAddress!,
        amount
      );
    }

    // 5. Обновляем статус платежа
    if (paymentSuccess) {
      await this.paymentModel.updatePaymentStatus(payment.id, 'completed');

      // 6. Добавляем монеты пользователю
      const user = await this.userModel.getUserById(userId);
      const newCoins = user.coins + amount;
      await this.userModel.updateUserCoins(userId, newCoins);

      res.status(200).json({
        message: 'Payment successful',
        payment,
        newBalance: newCoins,
      });
    } else {
      await this.paymentModel.updatePaymentStatus(payment.id, 'failed');
      res.status(400).json({
        error: 'Payment timeout or failed',
        paymentId: payment.id,
      });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

---

## Environment Variables

```bash
# .env file

# Telegram
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
TELEGRAM_API_URL=https://api.telegram.org

# TON
TONAPI_KEY=YOUR_TONAPI_KEY_HERE
TONAPI_URL=https://tonapi.io/v2
TONCENTER_API_URL=https://toncenter.com/api/v2

# Payment settings
PAYMENT_TIMEOUT=300000 # 5 minutes in milliseconds
PAYMENT_POLL_INTERVAL=3000 # 3 seconds
PAYMENT_MAX_RETRIES=100

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clicker_game
```

---

## Обработка ошибок платежей

```typescript
// backend/src/services/PaymentErrorHandler.ts

export class PaymentError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const paymentErrors = {
  INVALID_USER: new PaymentError('INVALID_USER', 400, 'Invalid user ID'),
  INVALID_TYPE: new PaymentError('INVALID_TYPE', 400, 'Invalid payment type'),
  INVALID_AMOUNT: new PaymentError('INVALID_AMOUNT', 400, 'Invalid amount'),
  INSUFFICIENT_BALANCE: new PaymentError('INSUFFICIENT_BALANCE', 400, 'Insufficient balance'),
  PAYMENT_TIMEOUT: new PaymentError('PAYMENT_TIMEOUT', 504, 'Payment timeout'),
  API_ERROR: new PaymentError('API_ERROR', 502, 'Payment service error'),
  USER_NOT_FOUND: new PaymentError('USER_NOT_FOUND', 404, 'User not found'),
};
```

---

## Тестирование на Testnet

```bash
# Для TON - используйте testnet
# 1. Создайте кошелек на https://testnet.tonkeeper.com
# 2. Получите тестовые TON на https://testnet.toncoin.org
# 3. Используйте testnet RPC: https://testnet.toncenter.com/api/v2/

# Переменные окружения для тестирования:
TONAPI_URL=https://testnet.tonapi.io/v2
TONCENTER_API_URL=https://testnet.toncenter.com/api/v2
TELEGRAM_BOT_TOKEN=ваш_test_bot_токен
```

---

## Логирование платежей

```typescript
// backend/src/services/PaymentLogger.ts

export class PaymentLogger {
  static logPaymentInitiated(userId: number, amount: number, type: string) {
    console.log(`[PAYMENT] Initiated: User ${userId}, ${amount} ${type}`);
  }

  static logPaymentSuccess(paymentId: number, userId: number, amount: number) {
    console.log(`[PAYMENT] SUCCESS: ID ${paymentId}, User ${userId}, Amount ${amount}`);
  }

  static logPaymentFailed(paymentId: number, userId: number, reason: string) {
    console.log(`[PAYMENT] FAILED: ID ${paymentId}, User ${userId}, Reason: ${reason}`);
  }

  static logPaymentTimeout(paymentId: number, duration: number) {
    console.log(`[PAYMENT] TIMEOUT: ID ${paymentId}, Duration: ${duration}ms`);
  }
}
```

---

**Версия документации:** 1.0.0  
**Последнее обновление:** 13 февраля 2026
