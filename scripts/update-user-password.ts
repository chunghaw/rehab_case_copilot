import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.UPDATE_USERNAME || 'shuyi';
  const newPassword = process.env.NEW_PASSWORD || 'chunghaw96';

  // Find the user
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.log(`❌ User "${username}" not found.`);
    return;
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password
  await prisma.user.update({
    where: { username },
    data: {
      password: hashedPassword,
    },
  });

  console.log(`✅ Updated password for user: ${username}`);
}

main()
  .catch((e) => {
    console.error('Error updating password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

