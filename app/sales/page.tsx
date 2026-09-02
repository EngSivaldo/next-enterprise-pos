"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface SaleItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Sale {
  id: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  customerName?: string | null;
  customerDocument?: string | null;
  taxTotal: number;
  createdAt: string;
  items: SaleItem[];
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchSales = () => {
    setLoading(true);
    fetch("/api/sales")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSales(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar histórico de vendas:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const translatePaymentMethod = (method: string) => {
    const map: Record<string, string> = {
      MONEY: "Dinheiro",
      PIX: "PIX",
      CREDIT_CARD: "Cartão de Crédito",
      DEBIT_CARD: "Cartão de Débito",
    };
    return map[method] || method;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans select-none">
      <Header />

      <main className="max-w-6xl mx-auto w-full space-y-6 p-6 flex-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Histórico de Vendas
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Consulte transações passadas e reimprima comprovantes
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-inner)] rounded-xl border border-[var(--border-color)] transition-colors"
          >
            Menu Principal
          </Link>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
              Carregando histórico...
            </div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
              Nenhuma venda registrada até o momento.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-inner)] text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="p-4">Venda</th>
                  <th className="p-4">Data/Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Pagamento</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-[var(--bg-inner)]/50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-[var(--accent-color)] font-mono">
                      #{String(sale.id).padStart(4, "0")}
                    </td>
                    <td className="p-4 text-xs text-[var(--text-secondary)]">
                      {new Date(sale.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4 font-medium text-[var(--text-primary)]">
                      {sale.customerName || "Consumidor Não Identificado"}
                    </td>
                    <td className="p-4 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-[var(--bg-inner)] border border-[var(--border-color)] font-semibold text-[var(--text-primary)]">
                        {translatePaymentMethod(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-extrabold font-mono text-[var(--accent-color)]">
                      R$ {Number(sale.total).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="px-3 py-1.5 bg-[var(--bg-inner)] text-[var(--text-primary)] hover:bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-semibold rounded-lg transition-colors"
                      >
                        Ver Cupom
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal de Detalhes / Comprovante */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Comprovante da Venda #{selectedSale.id}
              </h2>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
              >
                ✕
              </button>
            </div>

            <div
              ref={printRef}
              className="bg-white text-black p-6 rounded-lg font-mono text-xs space-y-3 leading-tight shadow-inner"
            >
              <div className="text-center border-b border-black pb-2 space-y-1">
                <p className="font-bold text-sm uppercase">COMPROVANTE DE VENDA</p>
                <p>PDV SISTEMA COMERCIAL</p>
                <p>CNPJ: 00.000.000/0001-00</p>
                <p className="text-[10px]">
                  {new Date(selectedSale.createdAt).toLocaleString("pt-BR")}
                </p>
                <p className="font-bold">VENDA Nº #{selectedSale.id}</p>
              </div>

              {(selectedSale.customerName || selectedSale.customerDocument) && (
                <div className="border-b border-black pb-2">
                  <p className="font-bold">CONSUMIDOR:</p>
                  {selectedSale.customerName && (
                    <p>NOME: {selectedSale.customerName}</p>
                  )}
                  {selectedSale.customerDocument && (
                    <p>CPF/CNPJ: {selectedSale.customerDocument}</p>
                  )}
                </div>
              )}

              <div className="border-b border-black pb-2 space-y-1">
                <div className="flex justify-between font-bold border-b border-gray-300 pb-1">
                  <span>ITEM / QTD x UN</span>
                  <span>TOTAL</span>
                </div>
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.product.name} ({item.quantity}x)
                    </span>
                    <span>R$ {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>R$ {Number(selectedSale.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>FORMA PAGTO:</span>
                  <span className="uppercase">
                    {translatePaymentMethod(selectedSale.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VALOR PAGO:</span>
                  <span>R$ {Number(selectedSale.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TROCO:</span>
                  <span>R$ {Number(selectedSale.changeAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black pt-2 text-[10px] text-center">
                <p>
                  Trib. Aprox.: R$ {Number(selectedSale.taxTotal).toFixed(2)} (Lei 12.741/2012)
                </p>
                <p className="mt-1 font-bold">Obrigado pela preferência!</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] font-bold rounded-xl text-xs uppercase tracking-wider transition-opacity"
              >
                Imprimir Cupom
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="flex-1 py-3 bg-[var(--bg-inner)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}