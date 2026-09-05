import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const manager = await prisma.user.upsert({
    where: { email: "gerente@pdv.com" },
    update: {
      pin: "1234",
      role: "ADMIN",
      active: true,
    },
    create: {
      name: "Gerente Principal",
      email: "gerente@pdv.com",
      pin: "1234",
      role: "ADMIN",
      active: true,
    },
  });

  console.log("✅ Usuário Gerente configurado com sucesso!");
  console.log(`E-mail: ${manager.email} | PIN: 1234 | Role: ${manager.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });