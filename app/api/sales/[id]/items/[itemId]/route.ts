import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const saleId = parseInt(params.id, 10);
    const itemId = parseInt(params.itemId, 10);

    if (isNaN(saleId) || isNaN(itemId)) {
      return NextResponse.json(
        { error: "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Buscar o item com o produto e a venda associada
      const item = await tx.saleItem.findUnique({
        where: { id: itemId },
        include: {
          product: true,
          sale: { include: { items: true } },
        },
      });

      if (!item || item.saleId !== saleId) {
        throw new Error("Item da venda não encontrado.");
      }

      // 2. Devolve a quantidade do item para o estoque
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });

      // 3. Remove o item da venda
      await tx.saleItem.delete({ where: { id: itemId } });

      // 4. Se era o único item, cancela a venda inteira
      if (item.sale.items.length === 1) {
        await tx.sale.update({
          where: { id: saleId },
          data: {
            subtotal: 0,
            total: 0,
            changeAmount: 0,
            status: "CANCELED",
          },
        });
        return null;
      }

      // 5. Recalcula o novo total e o novo troco (convertendo Decimal para Number)
      const valueToRemove = Number(item.price) * Number(item.quantity);
      const newTotal = Number(item.sale.total) - valueToRemove;
      const newSubtotal = Number(item.sale.subtotal) - valueToRemove;
      
      const paidAmount = Number(item.sale.paidAmount || 0);
      const newChange = paidAmount > 0 ? Math.max(0, paidAmount - newTotal) : 0;

      return await tx.sale.update({
        where: { id: saleId },
        data: {
          total: newTotal,
          subtotal: newSubtotal,
          changeAmount: newChange,
        },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json(
      { message: "Item removido com sucesso!", sale: updatedSale },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao remover item da venda:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar alteração." },
      { status: 400 }
    );
  }
}