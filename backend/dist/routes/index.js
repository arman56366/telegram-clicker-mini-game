"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = void 0;
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controllers/UserController");
const UpgradeController_1 = require("../controllers/UpgradeController");
const MissionController_1 = require("../controllers/MissionController");
const PromotionController_1 = require("../controllers/PromotionController");
const PaymentController_1 = require("../controllers/PaymentController");
const createRouter = (pool) => {
    const router = express_1.default.Router();
    const userController = new UserController_1.UserController(pool);
    const upgradeController = new UpgradeController_1.UpgradeController(pool);
    const missionController = new MissionController_1.MissionController(pool);
    const promotionController = new PromotionController_1.PromotionController(pool);
    const paymentController = new PaymentController_1.PaymentController(pool);
    // User routes
    router.post("/users", userController.createUser.bind(userController));
    router.get("/users/:id", userController.getUser.bind(userController));
    router.put("/users/:id/status", userController.updateUserStatus.bind(userController));
    router.put("/users/:id/coins", userController.updateUserCoins.bind(userController));
    // Upgrade routes
    router.post("/upgrades", upgradeController.createUpgrade.bind(upgradeController));
    router.get("/upgrades/:userId", upgradeController.getUpgrades.bind(upgradeController));
    router.put("/upgrades/:id/level", upgradeController.upgradeLevel.bind(upgradeController));
    // Mission routes
    router.post("/missions", missionController.createMission.bind(missionController));
    router.get("/missions/:userId", missionController.getMissions.bind(missionController));
    router.put("/missions/:id/progress", missionController.updateMissionProgress.bind(missionController));
    router.put("/missions/:id/complete", missionController.completeMission.bind(missionController));
    // Promotion routes
    router.post("/promotions", promotionController.createPromotion.bind(promotionController));
    router.get("/promotions/active", promotionController.getActivePromotions.bind(promotionController));
    // Payment routes
    router.post("/payments", paymentController.createPayment.bind(paymentController));
    router.get("/payments/:userId", paymentController.getPayments.bind(paymentController));
    router.put("/payments/:id/status", paymentController.updatePaymentStatus.bind(paymentController));
    return router;
};
exports.createRouter = createRouter;
