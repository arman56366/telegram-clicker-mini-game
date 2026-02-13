"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const axios_1 = __importDefault(require("axios"));
class PaymentModel {
    constructor(pool) {
        this.pool = pool;
    }
    // Create Payment
    async createPayment(userId, paymentType, amount) {
        const result = await this.pool.query("INSERT INTO payments (user_id, payment_type, amount) VALUES ($1, $2, $3) RETURNING *", [
            userId,
            paymentType,
            amount,
        ]);
        return result.rows[0];
    }
    // Check Telegram Stars Balance
    async checkTelegramStarsBalance(userId) {
        // Here is call API Telegram for balance checking
        // Like:
        const response = await axios_1.default.get(`https://api.telegram.org/botYOUR_BOT_TOKEN/getBalance?user_id=${userId}`);
        return response.data.balance; // TODO
    }
    // Check TON Balance
    async checkTONBalance(walletAddress) {
        // Here is call API TON for balance checking
        // Like:
        const response = await axios_1.default.get(`https://tonapi.io/v1/account/getBalance?address=${walletAddress}`);
        return response.data.balance; // TODO
    }
    // TODO: Wait for payment in Telegram Stars
    async waitForTelegramStarsPayment(paymentId) {
        const response = await axios_1.default.get(`https://api.telegram.org/botYOUR_BOT_TOKEN/getPaymentStatus?payment_id=${paymentId}`);
        return response.data.status === "success";
    }
    // TODO: Wait for TON Payment
    async waitForTONPayment(walletAddress, amount) {
        // Here is call API TON for transaction checking
        // Like:
        const response = await axios_1.default.get(`https://tonapi.io/v1/account/getTransactions?address=${walletAddress}`);
        const transactions = response.data.transactions;
        const paymentReceived = transactions.some((tx) => tx.amount >= amount);
        return paymentReceived;
    }
    async getPaymentsByUserId(userId) {
        const result = await this.pool.query("SELECT * FROM payments WHERE user_id = $1", [userId]);
        return result.rows;
    }
    async updatePaymentStatus(id, status) {
        const result = await this.pool.query("UPDATE payments SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
        return result.rows[0];
    }
}
exports.PaymentModel = PaymentModel;
