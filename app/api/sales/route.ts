import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Lista o histórico de vendas com todos os dados
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Erro ao buscar histórico de vendas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendas." },
      { status: 500 }
    );
  }
}

// POST: Processa uma nova venda com dados do cliente e troco
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, paymentMethod, paidAmount, customerName, customerDocument } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "O carrinho não pode estar vazio." },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Forma de pagamento é obrigatória." },
        { status: 400 }
      );
    }

    // Processa a transação garantindo consistência fiscal e de estoque
    const newSale = await prisma.$transaction(async (tx) => {
      let subtotalSum = 0;
      let taxTotalSum = 0;

      // 1. Valida estoque e calcula totais
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Produto ID ${item.productId} não foi encontrado.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Estoque insuficiente para o produto "${product.name}". Restam apenas ${product.stock} unidades.`
          );
        }

        subtotalSum += product.price * item.quantity;
        
        // Estimativa do valor de impostos (Lei 12.741/2012)
        if (product.taxPercentage > 0) {
          taxTotalSum += (product.price * item.quantity) * (product.taxPercentage / 100);
        }
      }

      const total = subtotalSum; // Pode receber descontos futuros aqui
      const received = paidAmount ? parseFloat(paidAmount) : total;
      const change = received >= total ? received - total : 0.0;

      // 2. Abate do estoque e registra a movimentação
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
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

      // 3. Cria o registro completo da venda
      return await tx.sale.create({
        data: {
          subtotal: subtotalSum,
          total: total,
          paidAmount: received,
          changeAmount: change,
          paymentMethod: paymentMethod,
          customerName: customerName || null,
          customerDocument: customerDocument || null,
          taxTotal: taxTotalSum,
          items: {
            create: items.map((item: { productId: number; quantity: number; price: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.quantity * item.price,
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

    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao registrar a venda:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar a venda." },
      { status: 400 }
    );
  }
}