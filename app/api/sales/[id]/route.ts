import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota de alteração de itens e alteração para status CANCELADA
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = Number(params.id);
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Formato de itens inválido." },
        { status: 400 }
      );
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venda não encontrada." },
        { status: 404 }
      );
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // Devolve o estoque de todos os itens anteriores com suporte a Float
      for (const oldItem of existingSale.items) {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { increment: parseFloat(oldItem.quantity.toString()) } },
        });
      }

      // Remove itens antigos associados
      await tx.saleItem.deleteMany({
        where: { saleId: saleId },
      });

      // Se a lista ficou vazia, marca a venda como CANCELADA no histórico
      if (items.length === 0) {
        return await tx.sale.update({
          where: { id: saleId },
          data: {
            status: "CANCELED",
            total: 0,
            changeAmount: 0,
          },
          include: {
            items: { include: { product: true } },
          },
        });
      }

      // Se possui novos itens, insere novamente e abate o novo estoque
      let newTotal = 0;
      const newItemsData = [];

      for (const item of items) {
        const qty = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.price);
        const itemTotal = qty * unitPrice;
        newTotal += itemTotal;

        newItemsData.push({
          productId: Number(item.productId),
          quantity: qty,
          price: unitPrice,
          subtotal: itemTotal,
        });

        await tx.product.update({
          where: { id: Number(item.productId) },
          data: { stock: { decrement: qty } },
        });
      }

      const paid = Number(existingSale.paidAmount) || 0;
      const newChange = paid > 0 ? Math.max(0, paid - newTotal) : 0;

      return await tx.sale.update({
        where: { id: saleId },
        data: {
          total: newTotal,
          subtotal: newTotal,
          changeAmount: newChange,
          status: "COMPLETED",
          items: {
            create: newItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });
    });

    return NextResponse.json(updatedSale, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar venda:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar a venda." },
      { status: 500 }
    );
  }
}

// Em vez de deletar fisicamente, o método DELETE altera o status para CANCELED
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = Number(params.id);

    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venda não encontrada." },
        { status: 404 }
      );
    }

    if (existingSale.status === "CANCELED") {
      return NextResponse.json(
        { error: "Venda já está cancelada." },
        { status: 400 }
      );
    }

    // Devolve o estoque fracionado e muda status da venda para CANCELADA
    const canceledSale = await prisma.$transaction(async (tx) => {
      for (const item of existingSale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: parseFloat(item.quantity.toString()) } },
        });
      }

      return await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "CANCELED",
          total: 0,
          changeAmount: 0,
        },
      });
    });

    return NextResponse.json(canceledSale, { status: 200 });
  } catch (error) {
    console.error("Erro ao cancelar venda:", error);
    return NextResponse.json(
      { error: "Erro interno ao cancelar a venda." },
      { status: 500 }
    );
  }
}
