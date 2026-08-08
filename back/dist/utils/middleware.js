"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = __importDefault(require("pg"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const isProduction = process.env.NODE_ENV === "production";
// --- CORS global ---
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:4200",
        "https://localhost", // Agregado para Capacitor Android
        "capacitor://localhost", // Agregado para Capacitor IOS
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// JSON
app.use(express_1.default.json());
// ==========================================
// SESIÓN: store PostgreSQL (connect-pg-simple)
// Duración: 2 horas
// ==========================================
const PgStore = (0, connect_pg_simple_1.default)(express_session_1.default);
const sessionPool = new pg_1.default.Pool({
    connectionString: process.env.DATABASE_URL,
    user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
    host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
    database: !process.env.DATABASE_URL ? process.env.DB_DATABASE : undefined,
    password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
    port: !process.env.DATABASE_URL && process.env.DB_PORT
        ? parseInt(process.env.DB_PORT, 10)
        : undefined,
});
const TWO_HOURS_MS = 1000 * 60 * 60 * 2;
app.use((0, express_session_1.default)({
    store: new PgStore({
        pool: sessionPool,
        tableName: "session",
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "mi-clave-secreta",
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "none",
        maxAge: TWO_HOURS_MS,
    },
}));
exports.default = app;
//# sourceMappingURL=middleware.js.map