import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = parseInt(params.id, 10);

    if (isNaN(saleId)) {
      return NextResponse.json(
        { error: "ID de venda inválido." },
        { status: 400 }
      );
    }

    // Transação atômica para devolver o estoque e deletar a venda
    await prisma.$transaction(async (tx) => {
      // 1. Buscar a venda e seus itens
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!sale) {
        throw new Error("Venda não encontrada.");
      }

      // 2. Incrementar o estoque dos produtos devolvidos
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // 3. Remover os itens e a venda
      await tx.saleItem.deleteMany({
        where: { saleId: saleId },
      });

      await tx.sale.delete({
        where: { id: saleId },
      });
    });

    return NextResponse.json(
      { message: "Venda estornada e estoque devolvido com sucesso!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao estornar venda:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar estorno." },
      { status: 500 }
    );
  }
}