import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = parseInt(params.itemId, 10);
    const body = await request.json();
    const { action } = body; // action: "decrease" | "increase" | "remove"

    if (isNaN(itemId) || !action) {
      return NextResponse.json(
        { error: "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Buscar o item e a venda relacionada com as informações do produto
      const item = await tx.saleItem.findUnique({
        where: { id: itemId },
        include: {
          product: true,
          sale: { include: { items: true } },
        },
      });

      if (!item) {
        throw new Error("Item da venda não encontrado.");
      }

      // CASO A: Aumentar 1 unidade
      if (action === "increase") {
        // Verifica se há estoque disponível para adicionar mais 1
        if (item.product.stock < 1) {
          throw new Error(`Estoque insuficiente de "${item.product.name}". (Estoque atual: 0)`);
        }

        // Subtrai 1 unidade do estoque do produto
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: 1 } },
        });

        // Incrementa a quantidade no item da venda
        await tx.saleItem.update({
          where: { id: itemId },
          data: { quantity: { increment: 1 } },
        });

        // Soma o preço unitário ao total da venda
        return await tx.sale.update({
          where: { id: item.saleId },
          data: { total: { increment: item.price } },
          include: { items: { include: { product: true } } },
        });
      }

      // CASO B: Diminuir 1 unidade
      if (action === "decrease") {
        // Devolve 1 unidade ao estoque do produto
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: 1 } },
        });

        if (item.quantity > 1) {
          // Diminui a quantidade do item e abate o valor no total da venda
          await tx.saleItem.update({
            where: { id: itemId },
            data: { quantity: { decrement: 1 } },
          });

          return await tx.sale.update({
            where: { id: item.saleId },
            data: { total: { decrement: item.price } },
            include: { items: { include: { product: true } } },
          });
        } else {
          // Se era quantidade 1, remove o item de vez
          await tx.saleItem.delete({ where: { id: itemId } });

          // Se era o último item da venda toda, exclui a venda inteira
          if (item.sale.items.length === 1) {
            await tx.sale.delete({ where: { id: item.saleId } });
            return null;
          }

          return await tx.sale.update({
            where: { id: item.saleId },
            data: { total: { decrement: item.price } },
            include: { items: { include: { product: true } } },
          });
        }
      }

      // CASO C: Remover o item inteiro
      if (action === "remove") {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.saleItem.delete({ where: { id: itemId } });

        if (item.sale.items.length === 1) {
          await tx.sale.delete({ where: { id: item.saleId } });
          return null;
        }

        const valueToRemove = item.price * item.quantity;
        return await tx.sale.update({
          where: { id: item.saleId },
          data: { total: { decrement: valueToRemove } },
          include: { items: { include: { product: true } } },
        });
      }

      throw new Error("Ação não suportada.");
    });

    return NextResponse.json(
      { message: "Item atualizado com sucesso!", sale: updatedSale },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao atualizar item da venda:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar alteração." },
      { status: 400 }
    );
  }
}