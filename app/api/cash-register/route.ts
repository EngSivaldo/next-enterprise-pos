import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Consulta status do caixa ativo e histórico recente
export async function GET() {
  try {
    const activeRegister = await prisma.cashRegister.findFirst({
      where: { status: "OPEN" },
      include: {
        user: { select: { id: true, name: true, role: true } },
        transactions: true,
        sales: { select: { total: true } },
      },
      orderBy: { openedAt: "desc" },
    });

    if (!activeRegister) {
      return NextResponse.json({ isOpen: false, register: null });
    }

    // Conversão explícita de Decimal para Number durante a agregação
    const totalSales = activeRegister.sales.reduce(
      (acc, sale) => acc + Number(sale.total),
      0
    );

    const totalTransactions = activeRegister.transactions.reduce((acc, tx) => {
      const amount = Number(tx.amount);
      return tx.type === "CASH_IN" ? acc + amount : acc - amount;
    }, 0);

    const initialBalance = Number(activeRegister.initialBalance);
    const calculatedBalance = initialBalance + totalSales + totalTransactions;

    return NextResponse.json({
      isOpen: true,
      register: {
        ...activeRegister,
        calculatedBalance,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar status do caixa" }, { status: 500 });
  }
}

// POST: Abertura / Fechamento / Sangria / Suprimento com PIN
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, pin, initialBalance, finalBalance, amount, reason, notes } = body;

    // 1. Validar PIN
    const user = await prisma.user.findFirst({
      where: { pin, active: true },
    });

    if (!user) {
      return NextResponse.json({ error: "PIN de acesso inválido ou usuário inativo!" }, { status: 401 });
    }

    // 2. Abertura (Exige perfil ADMIN ou MANAGER)
    if (action === "OPEN") {
      if (user.role !== "ADMIN" && user.role !== "MANAGER") {
        return NextResponse.json({ error: "Apenas Gerentes ou Admins podem abrir o caixa!" }, { status: 403 });
      }

      const currentOpen = await prisma.cashRegister.findFirst({ where: { status: "OPEN" } });
      if (currentOpen) {
        return NextResponse.json({ error: "Já existe um caixa aberto no sistema!" }, { status: 400 });
      }

      const newRegister = await prisma.cashRegister.create({
        data: {
          userId: user.id,
          initialBalance: parseFloat(initialBalance) || 0,
          status: "OPEN",
          openingNotes: notes,
        },
      });

      return NextResponse.json({ success: true, register: newRegister });
    }

    const activeRegister = await prisma.cashRegister.findFirst({
      where: { status: "OPEN" },
      include: {
        sales: { select: { total: true } },
        transactions: true,
      },
    });

    if (!activeRegister) {
      return NextResponse.json({ error: "Não há nenhum caixa aberto para realizar esta operação!" }, { status: 400 });
    }

    // 3. Fechamento
    if (action === "CLOSE") {
      if (user.role !== "ADMIN" && user.role !== "MANAGER") {
        return NextResponse.json({ error: "Apenas Gerentes ou Admins podem fechar o caixa!" }, { status: 403 });
      }

      const totalSales = activeRegister.sales.reduce(
        (acc, sale) => acc + Number(sale.total),
        0
      );

      const totalTransactions = activeRegister.transactions.reduce((acc, tx) => {
        const amt = Number(tx.amount);
        return tx.type === "CASH_IN" ? acc + amt : acc - amt;
      }, 0);

      const initial = Number(activeRegister.initialBalance);
      const expectedBalance = initial + totalSales + totalTransactions;
      const reportedBalance = parseFloat(finalBalance) || 0;
      const difference = reportedBalance - expectedBalance;

      let auditNote = `Esperado: R$ ${expectedBalance.toFixed(2)} | Informado: R$ ${reportedBalance.toFixed(2)}`;
      if (difference < 0) {
        auditNote += ` | QUEBRA DE CAIXA: -R$ ${Math.abs(difference).toFixed(2)}`;
      } else if (difference > 0) {
        auditNote += ` | SOBRA DE CAIXA: +R$ ${difference.toFixed(2)}`;
      } else {
        auditNote += ` | CAIXA ZERADO (SEM DIFERENÇA)`;
      }

      if (notes) {
        auditNote += ` - Obs: ${notes}`;
      }

      const updatedRegister = await prisma.cashRegister.update({
        where: { id: activeRegister.id },
        data: {
          status: "CLOSED",
          closedById: user.id,
          closedAt: new Date(),
          finalBalance: reportedBalance,
          closingNotes: auditNote,
        },
      });

      return NextResponse.json({
        success: true,
        register: updatedRegister,
        summary: {
          expectedBalance,
          reportedBalance,
          difference,
        },
      });
    }

    // 4. Movimentações (Sangria / Suprimento)
    if (action === "TRANSACTION") {
      const transactionType = body.type;

      const newTransaction = await prisma.cashTransaction.create({
        data: {
          cashRegisterId: activeRegister.id,
          type: transactionType,
          amount: parseFloat(amount) || 0,
          reason: reason || (transactionType === "CASH_OUT" ? "Sangria" : "Suprimento"),
        },
      });

      return NextResponse.json({ success: true, transaction: newTransaction });
    }

    return NextResponse.json({ error: "Ação não reconhecida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar movimentação de caixa" }, { status: 500 });
  }
}