"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function CashRegisterPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [initialBalance, setInitialBalance] = useState("100.00");

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col">
      {/* Header Global com Seletor de Temas */}
      <Header />

      <div className="max-w-4xl mx-auto w-full space-y-6 p-6 flex-1">
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
            <div className="text-right">
              <span className="text-xs text-[var(--text-secondary)] block">Fundo de Troco Inicial</span>
              <span className="text-lg font-bold text-[var(--text-primary)]">R$ {initialBalance}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 bg-[var(--bg-inner)] border border-[var(--border-color)] hover:border-[var(--accent-color)] rounded-xl text-left transition-all">
              <span className="text-rose-400 font-bold block mb-1">💸 Realizar Sangria</span>
              <span className="text-xs text-[var(--text-secondary)]">Retirada de valor em dinheiro do caixa</span>
            </button>
            <button className="p-4 bg-[var(--bg-inner)] border border-[var(--border-color)] hover:border-[var(--accent-color)] rounded-xl text-left transition-all">
              <span className="text-emerald-400 font-bold block mb-1">💵 Adicionar Suprimento</span>
              <span className="text-xs text-[var(--text-secondary)]">Injeção de fundo de troco adicional</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}