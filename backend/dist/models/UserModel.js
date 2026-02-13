"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
class UserModel {
    constructor(pool) {
        this.pool = pool;
    }
    async createUser(username, email) {
        const result = await this.pool.query("INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *", [username, email]);
        return result.rows[0];
    }
    async getUserById(id) {
        const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return result.rows[0] || null;
    }
    async updateUserStatus(id, status) {
        const result = await this.pool.query("UPDATE users SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
        return result.rows[0];
    }
    async updateUserCoins(id, coins) {
        // Проверяем, что пользователь существует
        const userCheck = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (!userCheck.rows[0]) {
            throw new Error("User not found");
        }
        // Не позволяем отрицательное количество монет
        const finalCoins = Math.max(0, coins);
        const result = await this.pool.query("UPDATE users SET coins = $1 WHERE id = $2 RETURNING *", [finalCoins, id]);
        return result.rows[0];
    }
}
exports.UserModel = UserModel;
