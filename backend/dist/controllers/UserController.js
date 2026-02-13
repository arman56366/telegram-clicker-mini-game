"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserModel_1 = require("../models/UserModel");
class UserController {
    constructor(pool) {
        this.userModel = new UserModel_1.UserModel(pool);
    }
    async createUser(req, res) {
        const { username, email } = req.body;
        try {
            const user = await this.userModel.createUser(username, email);
            res.status(201).json(user);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    async getUser(req, res) {
        const { id } = req.params;
        try {
            const user = await this.userModel.getUserById(Number(id));
            if (user) {
                res.status(200).json(user);
            }
            else {
                res.status(404).json({ error: "User not found" });
            }
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    async updateUserStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        try {
            const user = await this.userModel.updateUserStatus(Number(id), status);
            res.status(200).json(user);
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    async updateUserCoins(req, res) {
        const { id } = req.params;
        const { coins } = req.body;
        try {
            // Валидация: id из params всегда строка
            const userId = Number(id);
            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({ error: "Invalid user ID" });
            }
            if (typeof coins !== "number" || !Number.isInteger(coins)) {
                return res.status(400).json({ error: "Invalid coins value" });
            }
            const user = await this.userModel.updateUserCoins(userId, coins);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            // Return new coins count
            res.status(200).json({ coins: user.coins });
        }
        catch (error) {
            console.error("Error:", error);
            // logger.error(`Error updating coins: ${error.message}`)
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
exports.UserController = UserController;
