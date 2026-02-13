"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionController = void 0;
const PromotionModel_1 = require("../models/PromotionModel");
class PromotionController {
    constructor(pool) {
        this.promotionModel = new PromotionModel_1.PromotionModel(pool);
    }
    async createPromotion(req, res) {
        const { title, description, startDate, endDate, rewardCoins, rewardCrystals } = req.body;
        try {
            const promotion = await this.promotionModel.createPromotion({
                title,
                description,
                start_date: new Date(startDate),
                end_date: new Date(endDate),
                reward_coins: rewardCoins,
                reward_crystals: rewardCrystals,
                is_active: false,
            });
            res.status(201).json(promotion);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    async getActivePromotions(req, res) {
        try {
            const promotions = await this.promotionModel.getAllPromotions();
            res.status(200).json(promotions);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
exports.PromotionController = PromotionController;
