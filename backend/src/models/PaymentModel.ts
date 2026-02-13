import { Pool } from "pg"
import { Payment } from "../types"
import axios from "axios"

// TON API configuration
const TON_API_KEY = process.env.TON_API_KEY || ''
const TON_API_URL = 'https://tonapi.io/v2'
const BOT_WALLET_ADDRESS = process.env.BOT_WALLET_ADDRESS || '' // твой адрес кошелька для получения платежей

export class PaymentModel {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  // Create Payment
  async createPayment(userId: number, paymentType: "stars" | "ton", amount: number): Promise<Payment> {
    const result = await this.pool.query(
      "INSERT INTO payments (user_id, payment_type, amount, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, paymentType, amount, 'pending']
    )
    return result.rows[0]
  }

  // Check Telegram Stars Balance
  async checkTelegramStarsBalance(userId: number): Promise<number> {
    try {
      // Проверка баланса звезд через Telegram API
      const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getBalance?user_id=${userId}`)
      return response.data.balance || 0
    } catch (error) {
      console.error('Error checking Telegram Stars balance:', error)
      return 0
    }
  }

  // Check TON Balance
  async checkTONBalance(walletAddress: string): Promise<number> {
    try {
      const response = await axios.get(`${TON_API_URL}/accounts/${walletAddress}`, {
        headers: {
          'Authorization': `Bearer ${TON_API_KEY}`
        }
      })
      // Balance in nanoTON, convert to TON
      return response.data.balance ? response.data.balance / 1e9 : 0
    } catch (error) {
      console.error('Error checking TON balance:', error)
      return 0
    }
  }

  // Wait for Telegram Stars Payment
  async waitForTelegramStarsPayment(paymentId: number): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getPaymentStatus?payment_id=${paymentId}`
      )
      return response.data.status === "success"
    } catch (error) {
      console.error('Error checking Telegram Stars payment:', error)
      return false
    }
  }

  // Wait for TON Payment - check blockchain for incoming transaction
  async waitForTONPayment(walletAddress: string, amount: number, userWallet: string): Promise<boolean> {
    try {
      // Проверяем последние транзакции кошелька пользователя
      const response = await axios.get(
        `${TON_API_URL}/accounts/${userWallet}/transactions?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${TON_API_KEY}`
          }
        }
      )

      if (!response.data.transactions) {
        return false
      }

      // Ищем исходящую транзакцию на адрес бота
      const paymentFound = response.data.transactions.some((tx: any) => {
        // Проверяем что это исходящая транзакция
        const outMessages = tx.out_messages || []
        return outMessages.some((msg: any) => {
          const destination = msg.destination?.address
          const txAmount = Math.abs(msg.value || 0) / 1e9 // convert to TON
          
          return (
            destination === BOT_WALLET_ADDRESS.toLowerCase() &&
            txAmount >= amount &&
            msg.is_success
          )
        })
      })

      return paymentFound
    } catch (error) {
      console.error('Error checking TON payment:', error)
      return false
    }
  }

  // Get all payments by user
  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    const result = await this.pool.query(
      "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    )
    return result.rows
  }

  // Update payment status
  async updatePaymentStatus(id: number, status: "pending" | "completed" | "failed"): Promise<Payment> {
    const result = await this.pool.query(
      "UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    )
    return result.rows[0]
  }

  // Add coins to user after successful payment
  async addCoinsToUser(userId: number, amount: number): Promise<void> {
    await this.pool.query(
      "UPDATE users SET coins = coins + $1 WHERE id = $2",
      [amount, userId]
    )
  }

  // Get payment by ID
  async getPaymentById(id: number): Promise<Payment | null> {
    const result = await this.pool.query(
      "SELECT * FROM payments WHERE id = $1",
      [id]
    )
    return result.rows[0] || null
  }
}
