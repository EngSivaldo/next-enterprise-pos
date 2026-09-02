import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Buscar todos os produtos
export async function GET() {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

// PUT: Atualizar estoque/preços de um produto existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, stock, price, costPrice } = body;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        stock: Number(stock),
        price: Number(price),
        costPrice: Number(costPrice || 0),
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}