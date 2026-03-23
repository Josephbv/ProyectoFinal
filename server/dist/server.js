"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3001;
app_1.default.listen(PORT, () => {
    console.log(`\n🚀 KaiVet API corriendo en http://localhost:${PORT}`);
    console.log(`📖 Swagger UI:    http://localhost:${PORT}/api-docs`);
    console.log(`📊 Health check:  http://localhost:${PORT}/api/health\n`);
});
