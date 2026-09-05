import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Buscar todos os produtos ordenados por ID decrescente
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "desc" },
      include: {
        category: true,
        supplier: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

// POST: Cadastrar novo produto completo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      barcode,
      price,
      costPrice,
      stock,
      minStock,
      unit,
      ncm,
      cest,
      taxPercentage,
      categoryId,
      supplierId,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Nome e preço de venda são obrigatórios." },
        { status: 400 }
      );
    }

    // Processa a criação e gera o primeiro histórico de estoque se houver saldo inicial
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          barcode: barcode || null,
          price: Number(price),
          costPrice: Number(costPrice || 0),
          stock: Number(stock || 0),
          minStock: Number(minStock || 5),
          unit: unit || "UN",
          ncm: ncm || null,
          cest: cest || null,
          taxPercentage: Number(taxPercentage || 0),
          categoryId: categoryId ? Number(categoryId) : null,
          supplierId: supplierId ? Number(supplierId) : null,
        },
      });

      if (Number(stock) > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "IN_ADJUSTMENT",
            quantity: Number(stock),
            unitCost: Number(costPrice || 0),
            notes: "Estoque inicial de cadastro",
          },
        });
      }

      return product;
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Código de barras já cadastrado em outro produto." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao cadastrar produto" }, { status: 500 });
  }
}

// PUT: Atualizar preço, estoque e registrar movimentação de inventário
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, stock, price, costPrice, minStock, barcode, name, unit } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do produto é obrigatório" }, { status: 400 });
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const currentProduct = await tx.product.findUnique({
        where: { id: Number(id) },
      });

      if (!currentProduct) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      // Converte o campo Decimal retornado do banco para Number antes de realizar cálculos
      const currentStockNum = Number(currentProduct.stock);
      const currentCostPriceNum = currentProduct.costPrice ? Number(currentProduct.costPrice) : 0;

      const newStock = stock !== undefined ? Number(stock) : currentStockNum;
      const stockDiff = newStock - currentStockNum;

      // Se o estoque mudou, gera um registro de auditoria em StockMovement
      if (stockDiff !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: Number(id),
            type: stockDiff > 0 ? "IN_ADJUSTMENT" : "OUT_ADJUSTMENT",
            quantity: Math.abs(stockDiff),
            unitCost: costPrice !== undefined ? Number(costPrice) : currentCostPriceNum,
            notes: "Ajuste manual de estoque via módulo de Inventário",
          },
        });
      }

      return await tx.product.update({
        where: { id: Number(id) },
        data: {
          ...(name && { name }),
          ...(barcode !== undefined && { barcode: barcode || null }),
          ...(unit && { unit }),
          ...(price !== undefined && { price: Number(price) }),
          ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
          ...(minStock !== undefined && { minStock: Number(minStock) }),
          stock: newStock,
        },
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}