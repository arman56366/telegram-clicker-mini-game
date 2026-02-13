"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionController = void 0;
const MissionModel_1 = require("../models/MissionModel");
class MissionController {
    constructor(pool) {
        this.missionModel = new MissionModel_1.MissionModel(pool);
    }
    async createMission(req, res) {
        const { userId, missionType } = req.body;
        try {
            // Валидация входных данных
            if (!userId || typeof userId !== 'number' || userId <= 0) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }
            if (!missionType || typeof missionType !== 'string') {
                return res.status(400).json({ error: 'Invalid mission type' });
            }
            const mission = await this.missionModel.createMission(userId, missionType);
            res.status(201).json(mission);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    async getMissions(req, res) {
        const { userId } = req.params;
        try {
            const numUserId = Number(userId);
            if (!Number.isInteger(numUserId) || numUserId <= 0) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }
            const missions = await this.missionModel.getMissionsByUserId(numUserId);
            res.status(200).json(missions);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    async updateMissionProgress(req, res) {
        const { id } = req.params;
        const { progress } = req.body;
        try {
            // Валидация
            const missionId = Number(id);
            if (!Number.isInteger(missionId) || missionId <= 0) {
                return res.status(400).json({ error: 'Invalid mission ID' });
            }
            if (typeof progress !== 'number' || progress < 0) {
                return res.status(400).json({ error: 'Invalid progress value' });
            }
            const mission = await this.missionModel.updateMissionProgress(missionId, progress);
            res.status(200).json(mission);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    async completeMission(req, res) {
        const { id } = req.params;
        try {
            const missionId = Number(id);
            if (!Number.isInteger(missionId) || missionId <= 0) {
                return res.status(400).json({ error: 'Invalid mission ID' });
            }
            const mission = await this.missionModel.completeMission(missionId);
            res.status(200).json(mission);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
exports.MissionController = MissionController;
