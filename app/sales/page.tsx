import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Vendas</h1>
          <Link
            href="/"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Voltar ao PDV
          </Link>
        </div>

        {sales.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            Nenhuma venda registrada até o momento.
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-400">Venda #{sale.id}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(sale.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs uppercase bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-medium">
                      {sale.paymentMethod}
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      R$ {sale.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-800/60">
                      <tr>
                        <th className="py-2 px-3">Produto</th>
                        <th className="py-2 px-3 text-center">Qtd</th>
                        <th className="py-2 px-3 text-right">Preço Unitário</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {sale.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-medium text-slate-200">
                            {item.product.name}
                          </td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-400">
                            R$ {item.price.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-400">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
