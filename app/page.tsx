"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function HomePage() {
  const menuOptions = [
    {
      title: "Frente de Caixa (PDV)",
      description: "Abertura de vendas, passagem de itens, troco e emissão de cupons.",
      href: "/pos",
      icon: "🛒",
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500",
    },
    {
      title: "Controle de Estoque",
      description: "Consulta de produtos, quantidade disponível e alertas de estoque baixo.",
      href: "/inventory",
      icon: "📦",
      color: "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:border-blue-500",
    },
    {
      title: "Histórico de Vendas",
      description: "Relatório de vendas concluídas, reimpressão de cupons e estornos.",
      href: "/sales",
      icon: "📄",
      color: "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:border-purple-500",
    },
    {
      title: "Gestão de Fornecedores",
      description: "Cadastro de fornecedores e controle de entradas de mercadorias.",
      href: "/suppliers",
      icon: "🚚",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:border-amber-500",
    },
    {
      title: "Cadastro de Clientes",
      description: "Base de dados dos clientes para emissão rápida de documentos fiscais.",
      href: "/customers",
      icon: "👥",
      color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:border-cyan-500",
    },
    {
      title: "Abertura / Fechamento de Caixa",
      description: "Controle de turnos, sangrias, suprimentos e conferência de valores.",
      href: "/cash-register",
      icon: "💰",
      color: "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:border-rose-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col">
      {/* Header Global com Seletor de Temas */}
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col justify-center">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Selecione um Módulo</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Acessee rapidamente as opções do sistema abaixo:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {menuOptions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] shadow-xl bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-color)]`}
            >
              <div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-[var(--accent-color)]">
                Acessar módulo <span className="ml-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}