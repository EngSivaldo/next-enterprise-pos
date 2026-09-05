"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface SaleItem {
  id: number;
  productId: number;
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
  status: string;
  customerName?: string | null;
  customerDocument?: string | null;
  taxTotal: number;
  createdAt: string;
  items: SaleItem[];
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [editedItems, setEditedItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Wrapped in useCallback to prevent stale state references
  const fetchSales = useCallback(() => {
    setLoading(true);
    fetch("/api/sales")
      .then((res) => res.json())
      .then((data: Sale[]) => {
        if (Array.isArray(data)) {
          setSales(data);
          setSelectedSale((prevSelected) => {
            if (prevSelected) {
              const updated = data.find((s) => s.id === prevSelected.id);
              if (updated) {
                setEditedItems(updated.items.map((i: SaleItem) => ({ ...i, price: Number(i.price) })));
                return updated;
              }
            }
            return prevSelected;
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar histórico de vendas:", err);
        setLoading(false);
      });
  }, []);

  const fetchProducts = useCallback(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProductsList(data);
      })
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales, fetchProducts]);

  const handleOpenSaleModal = (sale: Sale) => {
    setSelectedSale(sale);
    setEditedItems(sale.items.map((item: SaleItem) => ({ ...item, price: Number(item.price) })));
    setSelectedProductId("");
  };

  const handleCloseModal = () => {
    setSelectedSale(null);
    setEditedItems([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelSale = (saleId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancelar Venda",
      message: "Tem certeza que deseja cancelar esta venda? Ela permanecerá no histórico como Cancelada e os produtos retornarão ao estoque.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
          if (res.ok) {
            handleCloseModal();
            fetchSales();
          }
        } catch (error) {
          console.error("Erro ao cancelar venda:", error);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleQuantityChange = (itemId: number, delta: number) => {
    setEditedItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setEditedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const product = productsList.find((p) => p.id === Number(selectedProductId));
    if (!product) return;

    setEditedItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: -Date.now(),
          productId: product.id,
          quantity: 1,
          price: Number(product.price),
          product: { name: product.name },
        },
      ];
    });
    setSelectedProductId("");
  };

  const handleSaveChanges = async () => {
    if (!selectedSale) return;

    setIsSavingChanges(true);
    try {
      const res = await fetch(`/api/sales/${selectedSale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: Number(item.price),
          })),
        }),
      });

      if (res.ok) {
        fetchSales();
        if (editedItems.length === 0) {
          handleCloseModal();
        }
      } else {
        alert("Falha ao atualizar a venda no servidor.");
      }
    } catch (error) {
      console.error("Erro ao atualizar venda:", error);
      alert("Erro ao processar as alterações.");
    } finally {
      setIsSavingChanges(false);
    }
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

  const totalCompletedSalesAmount = sales
    .filter((s) => s.status !== "CANCELED")
    .reduce((acc, s) => acc + Number(s.total), 0);

  const completedSalesCount = sales.filter((s) => s.status !== "CANCELED").length;
  const canceledSalesCount = sales.filter((s) => s.status === "CANCELED").length;

  const hasChanges =
    selectedSale &&
    JSON.stringify(
      selectedSale.items.map((i) => ({ id: i.productId, q: i.quantity }))
    ) !==
      JSON.stringify(
        editedItems.map((i) => ({ id: i.productId, q: i.quantity }))
      );

  const currentTotal = editedItems.reduce(
    (acc, item) => acc + item.quantity * Number(item.price),
    0
  );

  const paidAmount = selectedSale ? Number(selectedSale.paidAmount) || 0 : 0;
  const currentChange = paidAmount > 0 ? Math.max(0, paidAmount - currentTotal) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans select-none">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="max-w-6xl mx-auto w-full space-y-6 p-6 flex-1 print:hidden">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl">
            <p className="text-xs text-[var(--text-secondary)]">Faturamento Líquido</p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
              R$ {totalCompletedSalesAmount.toFixed(2)}
            </p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl">
            <p className="text-xs text-[var(--text-secondary)]">Vendas Concluídas</p>
            <p className="text-xl font-extrabold text-[var(--accent-color)] font-mono mt-1">
              {completedSalesCount}
            </p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl">
            <p className="text-xs text-[var(--text-secondary)]">Vendas Canceladas</p>
            <p className="text-xl font-extrabold text-red-400 font-mono mt-1">
              {canceledSalesCount}
            </p>
          </div>
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
                  <th className="p-4">Status</th>
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
                    <td className="p-4 text-xs">
                      {sale.status === "CANCELED" ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                          Cancelada
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          Concluída
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-extrabold font-mono text-[var(--accent-color)]">
                      R$ {Number(sale.total).toFixed(2)}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenSaleModal(sale)}
                        className="px-3 py-1.5 bg-[var(--bg-inner)] text-[var(--text-primary)] hover:bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-semibold rounded-lg transition-colors"
                      >
                        Ver Cupom
                      </button>
                      {sale.status !== "CANCELED" && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40 print:p-0 print:bg-transparent print:static print:block">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl print:border-none print:shadow-none print:p-0 print:max-w-full">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 print:hidden">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Comprovante da Venda #{selectedSale.id}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
              >
                ✕
              </button>
            </div>

            {selectedSale.status !== "CANCELED" && (
              <div className="flex gap-2 bg-[var(--bg-inner)] p-2 rounded-xl border border-[var(--border-color)] print:hidden">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[var(--text-primary)] border-none outline-none"
                >
                  <option value="" className="bg-[var(--bg-card)]">
                    Adicionar produto...
                  </option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[var(--bg-card)]">
                      {p.name} - R$ {Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddProduct}
                  disabled={!selectedProductId}
                  className="px-3 py-1 bg-[var(--accent-color)] text-[var(--btn-primary-text)] text-xs font-bold rounded-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>
            )}

            <div
              ref={printRef}
              className="bg-white text-black p-6 rounded-lg font-mono text-xs space-y-3 leading-tight shadow-inner max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:shadow-none"
            >
              <div className="text-center border-b border-black pb-2 space-y-1">
                <p className="font-bold text-sm uppercase">
                  {selectedSale.status === "CANCELED"
                    ? "COMPROVANTE CANCELADO"
                    : "COMPROVANTE DE VENDA"}
                </p>
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

              <div className="border-b border-black pb-2 space-y-2">
                <div className="flex justify-between font-bold border-b border-gray-300 pb-1">
                  <span>ITEM / QTD x UN</span>
                  <span>TOTAL</span>
                </div>
                {editedItems.length === 0 ? (
                  <p className="text-center text-red-600 font-bold py-2">
                    Nenhum item restante. A venda será registrada como CANCELADA.
                  </p>
                ) : (
                  editedItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1 pr-2">
                        <p className="font-bold">{item.product.name}</p>
                        <p className="text-[10px] text-gray-600">
                          {item.quantity} x R$ {Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          R$ {(item.quantity * Number(item.price)).toFixed(2)}
                        </span>
                        {selectedSale.status !== "CANCELED" && (
                          <div className="flex items-center border border-black rounded text-[10px] print:hidden">
                            <button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="px-1.5 py-0.5 hover:bg-gray-200 font-bold border-r border-black"
                            >
                              -
                            </button>
                            <span className="px-1.5">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="px-1.5 py-0.5 hover:bg-gray-200 font-bold border-l border-black"
                            >
                              +
                            </button>
                          </div>
                        )}
                        {selectedSale.status !== "CANCELED" && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 font-bold px-1 print:hidden"
                            title="Remover produto"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>R$ {currentTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>FORMA PAGTO:</span>
                  <span className="uppercase">
                    {translatePaymentMethod(selectedSale.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VALOR PAGO:</span>
                  <span>R$ {paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TROCO:</span>
                  <span>R$ {currentChange.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black pt-2 text-[10px] text-center">
                <p>
                  Trib. Aprox.: R$ {Number(selectedSale.taxTotal).toFixed(2)}{" "}
                  (Lei 12.741/2012)
                </p>
                <p className="mt-1 font-bold">Obrigado pela preferência!</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] font-bold rounded-xl text-xs uppercase tracking-wider transition-opacity"
              >
                Imprimir Cupom
              </button>

              {hasChanges ? (
                <button
                  onClick={handleSaveChanges}
                  disabled={isSavingChanges}
                  className={`flex-1 py-3 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 ${
                    editedItems.length === 0
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isSavingChanges
                    ? "Salvando..."
                    : editedItems.length === 0
                    ? "Confirmar Cancelamento"
                    : "Confirmar Alterações"}
                </button>
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-[var(--bg-inner)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Customizado de Confirmação */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-[var(--bg-inner)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}