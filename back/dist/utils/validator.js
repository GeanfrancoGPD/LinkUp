"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
class Validator {
    constructor() { }
    async validateEmail(email) {
        const emailSchema = zod_1.default.string().email();
        return emailSchema.safeParse(email);
    }
    async validatePassword(password) {
        const passwordSchema = zod_1.default
            .string()
            .min(4, "La contraseña debe tener al menos 4 caracteres")
            .max(64, "La contraseña no puede exceder los 64 caracteres")
            .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
            .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
            .regex(/[0-9]/, "Debe contener al menos un número")
            .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial");
        return passwordSchema.safeParse(password);
    }
    async validateUsername(username) {
        const usernameSchema = zod_1.default
            .string()
            .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
            .max(30, "El nombre de usuario no puede exceder los 30 caracteres")
            .regex(/^[a-zA-Z0-9_]+$/, "El nombre de usuario solo puede contener letras, números y guiones bajos");
        return usernameSchema.safeParse(username);
    }
    async validateToken(token) {
        const tokenSchema = zod_1.default
            .string()
            .length(6, "El token debe tener exactamente 6 caracteres")
            .regex(/^[A-Z0-9]+$/, "El token solo puede contener letras mayúsculas y números");
        return tokenSchema.safeParse(token);
    }
}
exports.default = new Validator();
//# sourceMappingURL=validator.js.map