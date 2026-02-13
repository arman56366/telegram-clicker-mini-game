import { Request, Response } from 'express';
import { PaymentModel } from '../models/PaymentModel';
import { UserModel } from '../models/UserModel';
import { Pool } from 'pg';

export class PaymentController {
    private paymentModel: PaymentModel;
    private userModel: UserModel;

    constructor(pool: Pool) {
        this.paymentModel = new PaymentModel(pool);
        this.userModel = new UserModel(pool);
    }

    // Create Payment (фронтенд отправляет запрос на создание платежа)
    async createPayment(req: Request, res: Response) {
        const { userId, paymentType, amount, walletAddress, userWallet } = req.body;
        try {
            // Валидация входных данных
            if (!userId || typeof userId !== 'number' || userId <= 0) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }
            if (!paymentType || !['stars', 'ton'].includes(paymentType)) {
                return res.status(400).json({ error: 'Invalid payment type' });
            }
            if (!amount || typeof amount !== 'number' || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }
            if (paymentType === 'ton' && !userWallet) {
                return res.status(400).json({ error: 'User wallet address required for TON payment' });
            }

            // Create Payment
            const payment = await this.paymentModel.createPayment(userId, paymentType, amount);

            // Start verification in background
            this.verifyPaymentInBackground(payment.id, userId, paymentType, amount, walletAddress, userWallet);

            res.status(200).json({ 
                message: 'Payment created, verification in progress', 
                paymentId: payment.id,
                payment: payment
            });
        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Background payment verification
    private async verifyPaymentInBackground(
        paymentId: number,
        userId: number,
        paymentType: string,
        amount: number,
        walletAddress?: string,
        userWallet?: string
    ) {
        const maxAttempts = 60; // Check for 60 * 2 = 120 seconds (2 minutes)
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;

            try {
                let paymentSuccess = false;

                if (paymentType === 'stars') {
                    // For Telegram Stars
                    paymentSuccess = await this.paymentModel.waitForTelegramStarsPayment(paymentId);
                } else if (paymentType === 'ton' && userWallet) {
                    // For TON blockchain
                    paymentSuccess = await this.paymentModel.waitForTONPayment(userWallet, amount, walletAddress || '');
                }

                if (paymentSuccess) {
                    // Payment confirmed - update status and add coins
                    await this.paymentModel.updatePaymentStatus(paymentId, 'completed');
                    
                    // Convert payment amount to coins
                    // 1 TON = 1000 coins, 1 Star = 10 coins (adjust as needed)
                    const coinsToAdd = paymentType === 'ton' 
                        ? amount * 1000 
                        : Math.floor(amount * 10);
                    
                    await this.paymentModel.addCoinsToUser(userId, coinsToAdd);

                    console.log(`Payment ${paymentId} verified successfully. Added ${coinsToAdd} coins to user ${userId}`);
                    clearInterval(interval);
                    return;
                }

                // If max attempts reached, mark as failed
                if (attempts >= maxAttempts) {
                    await this.paymentModel.updatePaymentStatus(paymentId, 'failed');
                    console.log(`Payment ${paymentId} verification timeout`);
                    clearInterval(interval);
                }
            } catch (error) {
                console.error(`Error verifying payment ${paymentId}:`, error);
                
                if (attempts >= maxAttempts) {
                    await this.paymentModel.updatePaymentStatus(paymentId, 'failed');
                    clearInterval(interval);
                }
            }
        }, 2000); // Check every 2 seconds
    }

    // Get user payments
    async getPayments(req: Request, res: Response) {
        const { userId } = req.params;
        try {
            const payments = await this.paymentModel.getPaymentsByUserId(Number(userId));
            res.status(200).json(payments);
        } catch (error) {
            console.error('Error getting payments:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Update user payment status (for admin operations)
    async updatePaymentStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;
        try {
            if (!['pending', 'completed', 'failed'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const payment = await this.paymentModel.updatePaymentStatus(Number(id), status);
            res.status(200).json(payment);
        } catch (error) {
            console.error('Error updating payment status:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
