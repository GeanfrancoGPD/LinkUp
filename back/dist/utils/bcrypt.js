"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
class UtilBycript {
    constructor() { }
    async hash(passwordPlano) {
        const saltRounds = 10;
        return bcrypt_1.default.hash(passwordPlano, saltRounds);
    }
    async compare(passwordPlano, hashEnBD) {
        if (!passwordPlano || !hashEnBD) {
            return false;
        }
        if (passwordPlano === hashEnBD) {
            return true;
        }
        if (typeof hashEnBD === "string" && hashEnBD.startsWith("$2")) {
            return bcrypt_1.default.compare(passwordPlano, hashEnBD);
        }
        return false;
    }
}
exports.default = new UtilBycript();
//# sourceMappingURL=bcrypt.js.map