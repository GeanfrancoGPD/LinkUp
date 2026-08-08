"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const { Pool } = pg_1.default;
class DB {
    // Propiedades de la clase declaradas con sus tipos
    pool;
    queries;
    constructor() {
        this.pool = null;
        this.queries = {};
        this.init();
    }
    async init() {
        try {
            const isProduction = process.env.NODE_ENV === "production";
            this.pool = new Pool({
                // Si hay DATABASE_URL usa esa, si no, cae en los parámetros sueltos (local)
                connectionString: process.env.DATABASE_URL,
                user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
                host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
                database: !process.env.DATABASE_URL
                    ? process.env.DB_DATABASE
                    : undefined,
                password: !process.env.DATABASE_URL
                    ? process.env.DB_PASSWORD
                    : undefined,
                port: !process.env.DATABASE_URL && process.env.DB_PORT
                    ? parseInt(process.env.DB_PORT, 10)
                    : undefined,
                max: process.env.DB_MAX ? parseInt(process.env.DB_MAX, 10) : 20,
                idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT
                    ? parseInt(process.env.DB_IDLE_TIMEOUT, 10)
                    : 30000,
                connectionTimeoutMillis: process.env.DB_CONN_TIMEOUT
                    ? parseInt(process.env.DB_CONN_TIMEOUT, 10)
                    : 2000,
                // CRUCIAL PARA PRODUCCIÓN:
                ssl: isProduction
                    ? { rejectUnauthorized: false } // Requerido por la mayoría de proveedores Cloud
                    : false,
            });
            const client = await this.pool.connect();
            console.log("Base de datos inicializada correctamente");
            console.log(`Conexión exitosa a PostgreSQL (${isProduction ? "Producción" : "Local"})`);
            client.release();
        }
        catch (error) {
            console.error("Error al inicializar la base de datos:", error);
        }
        await this.loadQueries();
    }
    async loadQueries() {
        try {
            const queryFilePath = path_1.default.resolve(process.cwd(), "src/data/query.json");
            const data = fs_1.default.readFileSync(queryFilePath, "utf8");
            this.queries = JSON.parse(data);
        }
        catch (error) {
            console.error("Error al cargar query.json:", error);
        }
    }
    async executeQuery(query, params = []) {
        if (!this.pool) {
            throw new Error("El pool de conexiones no está inicializado.");
        }
        const result = await this.pool.query(query, params);
        return result.rows;
    }
    async excecuteNameQuery(nameQuery, params = {}) {
        try {
            await this.loadQueries();
            const queryConfig = this.queries[nameQuery];
            // Validar si existía la query
            if (!queryConfig) {
                throw new Error(`La consulta "${nameQuery}" no existe en query.json`);
            }
            console.log("Query encontrada:", queryConfig);
            const query = queryConfig.query;
            const values = queryConfig.orderArray.map((key) => params[key]);
            console.log("VALUES:", values);
            if (!this.pool) {
                throw new Error("El pool de conexiones no está inicializado.");
            }
            const result = await this.pool.query(query, values);
            return result.rows;
        }
        catch (error) {
            console.error("Error detallado:", error);
            throw error; // Es recomendable relanzar el error para manejarlo en capas superiores
        }
    }
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log("Conexión a BD cerrada");
        }
    }
}
exports.default = DB;
//# sourceMappingURL=DBComponent.js.map