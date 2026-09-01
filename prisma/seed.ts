import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();

  const products = [
    { name: "Refrigerante 350ml", price: 5.50, category: "Bebidas", stock: 50 },
    { name: "Salgadinho Batata", price: 3.00, category: "Snacks", stock: 30 },
    { name: "Chocolate Barra", price: 4.25, category: "Doces", stock: 40 },
    { name: "Água Mineral 500ml", price: 2.00, category: "Bebidas", stock: 100 },
    { name: "Energético 473ml", price: 9.00, category: "Bebidas", stock: 25 },
    { name: "Sanduíche Natural", price: 8.50, category: "Lanches", stock: 15 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: p,
    });
  }

  console.log("Seed executado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
