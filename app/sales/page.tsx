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
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Pagamento</th>
                    <th className="py-3 px-4">Itens</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-emerald-400">#{sale.id}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(sale.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full font-medium">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {sale.items.map((item) => (
                            <div key={item.id} className="text-xs text-slate-300">
                              <span className="font-medium text-slate-200">{item.product.name}</span>
                              <span className="text-slate-400"> (x{item.quantity}) - R$ {item.price.toFixed(2)} un</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        R$ {sale.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
