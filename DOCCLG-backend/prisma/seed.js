"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const pwd = await bcrypt_1.default.hash('password123', 10);
    await prisma.user.createMany({
        data: [
            { name: 'Alice Student', email: 'alice@student.edu', passwordHash: pwd, role: 'STUDENT' },
            { name: 'Bob Incharge', email: 'bob@college.edu', passwordHash: pwd, role: 'CLASS_INCHARGE' },
            { name: 'Carol HOD', email: 'carol@college.edu', passwordHash: pwd, role: 'HOD' },
            { name: 'Admin', email: 'admin@college.edu', passwordHash: pwd, role: 'ADMIN' }
        ],
        skipDuplicates: true
    });
    console.log('Seeded users.');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map