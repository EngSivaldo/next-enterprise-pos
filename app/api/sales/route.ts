import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Validações matemáticas de CPF e CNPJ
function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

// GET: Traz histórico e injeta o paymentMethod no retorno para a tabela ler
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { id: "desc" },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const formattedSales = sales.map((sale: any) => ({
      ...sale,
      paymentMethod: sale.fiscalKey || "MONEY",
    }));

    return NextResponse.json(formattedSales);
  } catch (error) {
    console.error("Erro ao buscar histórico de vendas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendas." },
      { status: 500 }
    );
  }
}

// POST: Registra a venda salvando a forma de pagamento sem violar o schema
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      paymentMethod,
      paidAmount,
      customerName,
      customerDocument
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "O carrinho não pode estar vazio." },
        { status: 400 }
      );
    }

    const activeRegister = await prisma.cashRegister.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    if (!activeRegister) {
      return NextResponse.json(
        { error: "Não há caixa aberto. Abra o caixa antes de realizar vendas." },
        { status: 400 }
      );
    }

    const cleanDocument = customerDocument ? String(customerDocument).replace(/\D/g, "").trim() : "";

    if (cleanDocument.length > 0) {
      if (cleanDocument.length === 11 && !isValidCPF(cleanDocument)) {
        return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
      } else if (cleanDocument.length === 14 && !isValidCNPJ(cleanDocument)) {
        return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
      } else if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
        return NextResponse.json({ error: "Tamanho de documento inválido." }, { status: 400 });
      }
    }

    const newSale = await prisma.$transaction(async (tx) => {
      let subtotalSum = 0;
      let taxTotalSum = 0;

      const normalizedItems = items.map((item: any) => ({
        productId: Number(item.productId || item.id),
        quantity: parseFloat(item.quantity) || 1,
        price: parseFloat(item.price || item.unitPrice) || 0,
      }));

      for (const item of normalizedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Produto ID ${item.productId} não foi encontrado.`);
        }

        const productStock = Number(product.stock);
        const productPrice = Number(product.price);
        const productTaxPercentage = product.taxPercentage ? Number(product.taxPercentage) : 0;

        if (productStock < item.quantity) {
          throw new Error(`Estoque insuficiente para "${product.name}". Restam ${productStock}.`);
        }

        const itemTotal = productPrice * item.quantity;
        subtotalSum += itemTotal;

        if (productTaxPercentage > 0) {
          taxTotalSum += itemTotal * (productTaxPercentage / 100);
        }
      }

      const total = subtotalSum;
      const received = paidAmount ? parseFloat(paidAmount) : total;
      const change = received >= total ? received - total : 0.0;

      for (const item of normalizedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "OUT_SALE",
            quantity: item.quantity,
            notes: "Venda realizada no PDV",
          },
        });
      }

      return await tx.sale.create({
        data: {
          subtotal: subtotalSum,
          discount: 0.0,
          total: total,
          paidAmount: received,
          changeAmount: change,
          status: "COMPLETED",
          fiscalKey: paymentMethod || "MONEY",
          customerName: customerName || null,
          customerDocument: cleanDocument.length > 0 ? cleanDocument : null,
          taxTotal: taxTotalSum,
          cashRegisterId: activeRegister.id,
          userId: activeRegister.userId,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              costPrice: 0.0,
              discount: 0.0,
              subtotal: item.quantity * item.price,
              taxAmount: 0.0,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      ...newSale,
      paymentMethod: newSale.fiscalKey || "MONEY"
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao criar a venda no Prisma:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar a venda." },
      { status: 400 }
    );
  }
}