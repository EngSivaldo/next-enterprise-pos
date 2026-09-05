"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { isValidDocument, maskDocument, maskPhone } from "@/lib/validators";
import { Header } from "@/components/Header";

interface Customer {
  id: number;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [docError, setDocError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = () => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar clientes:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = maskDocument(rawValue);
    setDocument(formatted);

    const clean = formatted.replace(/\D/g, "");

    // Só valida se tiver preenchido totalmente (11 dígitos para CPF ou 14 para CNPJ)
    if (clean.length === 11 || clean.length === 14) {
      if (!isValidDocument(clean)) {
        setDocError("CPF ou CNPJ inválido");
      } else {
        setDocError("");
      }
    } else if (clean.length > 0) {
      setDocError("Digite todos os números do CPF (11) ou CNPJ (14)");
    } else {
      setDocError("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPhone(e.target.value));
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (document.trim() !== "" && !isValidDocument(document)) {
      setDocError("Insira um CPF/CNPJ válido para prosseguir.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, document, phone, email, address }),
      });

      if (res.ok) {
        setName("");
        setDocument("");
        setPhone("");
        setEmail("");
        setAddress("");
        setDocError("");
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        alert("Erro ao cadastrar cliente. Verifique se o CPF/CNPJ já existe.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col">
      {/* Header Global com Seletor de Temas */}
      <Header />

      <div className="max-w-6xl mx-auto w-full space-y-6 p-6 flex-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Base de Clientes</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Gerenciamento de clientes cadastrados no sistema</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-bold bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] rounded-xl transition-opacity"
            >
              + Novo Cliente
            </button>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-inner)] rounded-xl border border-[var(--border-color)] transition-colors"
            >
              Menu Principal
            </Link>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">Carregando clientes...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">Nenhum cliente cadastrado. Clique em &quot;+ Novo Cliente&quot; para adicionar.</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-inner)] text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Nome / Razão Social</th>
                  <th className="p-4">CPF / CNPJ</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Endereço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[var(--bg-inner)]/50 transition-colors">
                    <td className="p-4 font-semibold text-[var(--accent-color)]">#{customer.id}</td>
                    <td className="p-4 font-medium text-[var(--text-primary)]">{customer.name}</td>
                    <td className="p-4 text-[var(--text-primary)]">{customer.document || "-"}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{customer.phone || "-"}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{customer.email || "-"}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{customer.address || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Cadastro de Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Cadastrar Novo Cliente</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Nome Completo / Razão Social *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  value={document}
                  onChange={handleDocumentChange}
                  className={`w-full bg-[var(--bg-inner)] border rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none ${
                    docError ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[var(--accent-color)]"
                  }`}
                />
                {docError && <p className="text-red-400 text-xs mt-1">{docError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Endereço</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
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
                  disabled={isSubmitting || !!docError}
                  className="flex-1 py-2.5 bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] font-bold rounded-xl text-xs disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}