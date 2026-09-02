"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  costPrice?: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Edição State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);

  // Modal Novo Produto State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(5);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newCostPrice, setNewCostPrice] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = () => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar estoque:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditStock(product.stock);
    setEditPrice(product.price);
    setEditCostPrice(product.costPrice || 0);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProduct.id,
          stock: editStock,
          price: editPrice,
          costPrice: editCostPrice,
        }),
      });

      if (res.ok) {
        setSelectedProduct(null);
        fetchProducts();
      } else {
        alert("Erro ao atualizar o produto.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          stock: newStock,
          minStock: newMinStock,
          price: newPrice,
          costPrice: newCostPrice,
        }),
      });

      if (res.ok) {
        setIsNewModalOpen(false);
        setNewName("");
        setNewStock(0);
        setNewMinStock(5);
        setNewPrice(0);
        setNewCostPrice(0);
        fetchProducts();
      } else {
        alert("Erro ao cadastrar novo produto.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col">
      <Header />

      <div className="max-w-6xl mx-auto w-full space-y-6 p-6 flex-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Controle de Estoque</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Gestão de produtos, preços e ajuste de quantidades</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 text-xs font-bold bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] rounded-xl transition-opacity"
            >
              + Novo Produto
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
            <div className="p-8 text-center text-[var(--text-secondary)]">Carregando itens...</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-inner)] text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Preço Custo</th>
                  <th className="p-4">Preço Venda</th>
                  <th className="p-4">Estoque Atual</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[var(--bg-inner)]/50 transition-colors">
                    <td className="p-4 font-semibold text-[var(--accent-color)]">#{product.id}</td>
                    <td className="p-4 font-medium text-[var(--text-primary)]">{product.name}</td>
                    <td className="p-4 text-[var(--text-secondary)]">R$ {Number(product.costPrice || 0).toFixed(2)}</td>
                    <td className="p-4 text-[var(--accent-color)] font-bold">R$ {Number(product.price).toFixed(2)}</td>
                    <td className="p-4 font-semibold text-[var(--text-primary)]">{product.stock} un</td>
                    <td className="p-4">
                      {product.stock <= (product.minStock || 5) ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Estoque Baixo
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="px-3 py-1.5 bg-[var(--bg-inner)] text-[var(--text-primary)] hover:bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-semibold rounded-lg transition-colors"
                      >
                        Ajustar / Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Editar Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Editar: {selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Estoque Atual (Unidades)</label>
                <input
                  type="number"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 bg-[var(--bg-inner)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] font-bold rounded-xl text-xs transition-opacity"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Novo Produto */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Cadastrar Novo Produto</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Preço Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Preço Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2.5 bg-[var(--bg-inner)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[var(--accent-color)] hover:opacity-90 text-[var(--btn-primary-text)] font-bold rounded-xl text-xs transition-opacity"
                >
                  {isSubmitting ? "Cadastrando..." : "Cadastrar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}