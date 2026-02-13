"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionModel = void 0;
class MissionModel {
    constructor(pool) {
        this.pool = pool;
    }
    async createMission(userId, missionType) {
        const result = await this.pool.query("INSERT INTO missions (user_id, mission_type) VALUES ($1, $2) RETURNING *", [
            userId,
            missionType,
        ]);
        return result.rows[0];
    }
    async getMissionsByUserId(userId) {
        const result = await this.pool.query("SELECT * FROM missions WHERE user_id = $1", [userId]);
        return result.rows;
    }
    async updateMissionProgress(id, progress) {
        // Проверяем, что миссия существует
        const missionCheck = await this.pool.query("SELECT * FROM missions WHERE id = $1", [id]);
        if (!missionCheck.rows[0]) {
            throw new Error("Mission not found");
        }
        const result = await this.pool.query("UPDATE missions SET progress = $1 WHERE id = $2 RETURNING *", [progress, id]);
        return result.rows[0];
    }
    async completeMission(id) {
        // Проверяем, что миссия существует
        const missionCheck = await this.pool.query("SELECT * FROM missions WHERE id = $1", [id]);
        if (!missionCheck.rows[0]) {
            throw new Error("Mission not found");
        }
        const result = await this.pool.query("UPDATE missions SET completed = TRUE WHERE id = $1 RETURNING *", [id]);
        return result.rows[0];
    }
}
exports.MissionModel = MissionModel;
