import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Listar todos os clientes
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}

// POST: Criar um novo cliente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, document, phone, email, address } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        document: document || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao cadastrar cliente ou CPF/CNPJ duplicado" }, { status: 500 });
  }
}