"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface Supplier {
  id: number;
  corporateName: string;
  tradeName?: string;
  cnpj: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [corporateName, setCorporateName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans select-none">
      <Header />

      <main className="max-w-6xl mx-auto w-full space-y-6 p-6 flex-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Gestão de Fornecedores
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Cadastro de parceiros e informações de contato
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-bold bg-[var(--accent-color)] text-[var(--btn-primary-text)] hover:opacity-90 rounded-xl transition-opacity"
            >
              + Novo Fornecedor
            </button>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-inner)] rounded-xl border border-[var(--border-color)] transition-colors"
            >
              Menu Principal
            </Link>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 text-center text-[var(--text-secondary)] text-sm shadow-xl">
          Nenhum fornecedor cadastrado até o momento. Utilize o botão acima para adicionar.
        </div>
      </main>

      {/* Modal Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Cadastrar Fornecedor
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
              >
                ✕
              </button>
            </div>

            <form className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={corporateName}
                  onChange={(e) => setCorporateName(e.target.value)}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)] placeholder:text-[var(--text-secondary)]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Contato/Representante
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-[var(--bg-inner)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] font-bold rounded-xl text-xs transition-opacity"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}