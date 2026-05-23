import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main(){
  const pwd = await bcrypt.hash('password123',10);
  await prisma.user.createMany({
    data: [
      { name: 'Alice Student', email: 'alice@student.edu', passwordHash: pwd, role: 'STUDENT' },
      { name: 'Bob Incharge', email: 'bob@college.edu', passwordHash: pwd, role: 'CLASS_INCHARGE' },
      { name: 'Carol HOD', email: 'carol@college.edu', passwordHash: pwd, role: 'HOD' },
      { name: 'Admin', email: 'admin@college.edu', passwordHash: pwd, role: 'ADMIN' }
    ],
    skipDuplicates: true
  });
  console.log('Seeded users.')
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
