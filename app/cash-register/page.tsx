"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function CashRegisterPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [initialBalance, setInitialBalance] = useState("100.00");

  // Modal control states
  const [activeModal, setActiveModal] = useState<"sangria" | "suprimento" | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val)) return;

    const current = parseFloat(initialBalance);
    if (activeModal === "sangria") {
      setInitialBalance((current - val).toFixed(2));
    } else if (activeModal === "suprimento") {
      setInitialBalance((current + val).toFixed(2));
    }

    setAmount("");
    setReason("");
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans select-none">
      <Header />

      <main className="max-w-4xl mx-auto w-full space-y-6 p-6 flex-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Turno de Caixa</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Abertura, fechamento e conferência de troco inicial</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-inner)] rounded-xl border border-[var(--border-color)] transition-colors"
          >
            Menu Principal
          </Link>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <span className="text-xs text-[var(--text-secondary)] block">Status Atual do Caixa</span>
              <span className={`text-lg font-bold ${isOpen ? "text-emerald-400" : "text-rose-400"}`}>
                {isOpen ? "● CAIXA ABERTO" : "○ CAIXA FECHADO"}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs text-[var(--text-secondary)] block">Fundo em Caixa</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">R$ {initialBalance}</span>
              </div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  isOpen
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              >
                {isOpen ? "Fechar Caixa" : "Abrir Caixa"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              disabled={!isOpen}
              onClick={() => setActiveModal("sangria")}
              className="p-4 bg-[var(--bg-inner)] border border-[var(--border-color)] hover:border-[var(--accent-color)] rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-rose-400 font-bold block mb-1 group-hover:translate-x-1 transition-transform">💸 Realizar Sangria</span>
              <span className="text-xs text-[var(--text-secondary)]">Retirada de valor em dinheiro do caixa</span>
            </button>
            <button
              disabled={!isOpen}
              onClick={() => setActiveModal("suprimento")}
              className="p-4 bg-[var(--bg-inner)] border border-[var(--border-color)] hover:border-[var(--accent-color)] rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-emerald-400 font-bold block mb-1 group-hover:translate-x-1 transition-transform">💵 Adicionar Suprimento</span>
              <span className="text-xs text-[var(--text-secondary)]">Injeção de fundo de troco adicional</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Sangria / Suprimento */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {activeModal === "sangria" ? "💸 Realizar Sangria" : "💵 Adicionar Suprimento"}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            <form onSubmit={handleTransaction} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Valor (R$) *</label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Motivo / Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento fornecedor, Sangria de segurança"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-[var(--bg-inner)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[var(--accent-color)] text-[var(--btn-primary-text)] font-bold rounded-xl text-xs hover:opacity-90 transition-opacity"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}