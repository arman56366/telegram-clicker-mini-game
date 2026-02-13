"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpgradeModel = void 0;
class UpgradeModel {
    constructor(pool) {
        this.pool = pool;
    }
    async createUpgrade(userId, upgradeType, cost) {
        const result = await this.pool.query("INSERT INTO upgrades (user_id, upgrade_type, cost) VALUES ($1, $2, $3) RETURNING *", [
            userId,
            upgradeType,
            cost,
        ]);
        return result.rows[0];
    }
    async getUpgradesByUserId(userId) {
        const result = await this.pool.query("SELECT * FROM upgrades WHERE user_id = $1", [userId]);
        return result.rows;
    }
    async getUpgradeById(id) {
        const result = await this.pool.query("SELECT * FROM upgrades WHERE id = $1", [id]);
        return result.rows[0] || null;
    }
    async upgradeLevel(id) {
        // Получаем текущее улучшение
        const getResult = await this.pool.query("SELECT * FROM upgrades WHERE id = $1", [id]);
        if (!getResult.rows[0]) {
            throw new Error("Upgrade not found");
        }
        const upgrade = getResult.rows[0];
        // Вычисляем стоимость следующего уровня (экспоненциальный рост: cost * 1.2^level)
        const nextLevelCost = Math.ceil(upgrade.cost * Math.pow(1.2, upgrade.level));
        // Обновляем уровень
        const result = await this.pool.query("UPDATE upgrades SET level = level + 1, cost = $1 WHERE id = $2 RETURNING *", [nextLevelCost, id]);
        return result.rows[0];
    }
}
exports.UpgradeModel = UpgradeModel;
