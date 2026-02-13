"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionModel = void 0;
class PromotionModel {
    constructor(pool) {
        this.pool = pool;
    }
    async getAllPromotions() {
        const result = await this.pool.query("SELECT * FROM promotions");
        return result.rows;
    }
    async createPromotion(promotion) {
        const { title, description, reward_coins, reward_crystals, start_date, end_date, is_active } = promotion;
        const result = await this.pool.query("INSERT INTO promotions (title, description, reward_coins, reward_crystals, start_date, end_date, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", [title, description, reward_coins, reward_crystals, start_date, end_date, is_active]);
        return result.rows[0];
    }
    async updatePromotion(promotionId, promotion) {
        const fields = Object.keys(promotion)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(", ");
        const values = Object.values(promotion);
        const result = await this.pool.query(`UPDATE promotions SET ${fields} WHERE promotion_id = $${values.length + 1} RETURNING *`, [...values, promotionId]);
        return result.rows[0];
    }
    async deletePromotion(promotionId) {
        await this.pool.query("DELETE FROM promotions WHERE promotion_id = $1", [promotionId]);
    }
}
exports.PromotionModel = PromotionModel;
