"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const routes_1 = require("./routes");
const logger_1 = __importDefault(require("./logger"));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
});
const app = (0, express_1.default)();
const pool = new pg_1.Pool({
    user: "postgres",
    host: "localhost",
    database: "clicker_game",
    password: "password",
    port: 5432,
});
app.use(limiter);
app.use(express_1.default.json());
app.use("/api", (0, routes_1.createRouter)(pool));
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    logger_1.default.info(`Server is running on port ${PORT}`);
});
