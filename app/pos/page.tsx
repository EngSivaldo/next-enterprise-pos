"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  taxPercentage: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CompletedSale {
  id: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  customerName?: string | null;
  customerDocument?: string | null;
  taxTotal: number;
  createdAt: string;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
}

type ThemeMode = "dark" | "light" | "vibrant";

export default function PDVPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  // Estados da Modal de Pagamento
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("MONEY");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [shouldEmitReceipt, setShouldEmitReceipt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do Comprovante de Venda
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Carrega produtos
  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar produtos:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`O produto "${product.name}" está sem estoque.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          alert(`Estoque máximo atingido para "${product.name}". Restam ${product.stock} un.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Estoque insuficiente. Disponível: ${item.product.stock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const paidNumber = parseFloat(paidAmount) || 0;
  const changeNumber = paidNumber > totalCart ? paidNumber - totalCart : 0;

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      alert("Adicione pelo menos um produto ao carrinho para continuar.");
      return;
    }
    setPaidAmount("");
    setIsPaymentModalOpen(true);
  };

  const handleFinalizeSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "MONEY" && paidNumber < totalCart) {
      alert("O valor recebido é menor do que o total da venda.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        paymentMethod,
        paidAmount: paymentMethod === "MONEY" ? paidNumber : totalCart,
        customerName: customerName.trim() || null,
        customerDocument: customerDocument.trim() || null,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saleData = await res.json();
        setCart([]);
        setIsPaymentModalOpen(false);
        setCustomerName("");
        setCustomerDocument("");
        setPaidAmount("");
        fetchProducts();

        if (shouldEmitReceipt) {
          setCompletedSale(saleData);
        } else {
          alert("Venda finalizada com sucesso!");
        }
      } else {
        const errData = await res.json();
        alert(`Erro ao realizar venda: ${errData.error || "Erro desconhecido."}`);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Erro ao conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const themeStyles = {
    dark: {
      bg: "bg-[var(--bg-inner)] text-[var(--text-primary)]",
      header: "bg-[var(--bg-main)] border-[var(--border-color)]",
      card: "bg-[var(--bg-main)] border-[var(--border-color)]",
      innerCard: "bg-[var(--bg-inner)] border-[var(--border-color)]",
      tableHeader: "bg-[var(--bg-inner)]/80 text-[var(--text-secondary)] border-[var(--border-color)]",
      tableRowEven: "bg-[var(--bg-main)]/40",
      tableRowOdd: "bg-[var(--bg-inner)]/20",
      accentText: "text-emerald-400",
      primaryBtn: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
      modalBg: "bg-[var(--bg-main)] border-[var(--border-color)]",
    },
    light: {
      bg: "bg-gray-100 text-gray-900",
      header: "bg-white border-gray-200 shadow-sm",
      card: "bg-white border-gray-200 shadow-md",
      innerCard: "bg-gray-50 border-gray-200",
      tableHeader: "bg-gray-200 text-gray-700 border-gray-300",
      tableRowEven: "bg-white",
      tableRowOdd: "bg-gray-50",
      accentText: "text-blue-600",
      primaryBtn: "bg-blue-600 hover:bg-blue-500 text-[var(--text-primary)]",
      modalBg: "bg-white border-gray-200 text-gray-900",
    },
    vibrant: {
      bg: "bg-[var(--bg-main)] text-[var(--text-primary)]",
      header: "bg-indigo-950 border-indigo-800",
      card: "bg-slate-850 bg-indigo-950/30 border-indigo-900/50 shadow-xl",
      innerCard: "bg-[var(--bg-inner)]/80 border-indigo-900/40",
      tableHeader: "bg-indigo-950 text-indigo-200 border-indigo-900",
      tableRowEven: "bg-[var(--bg-main)]/60",
      tableRowOdd: "bg-indigo-950/20",
      accentText: "text-cyan-400",
      primaryBtn: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
      modalBg: "bg-[var(--bg-main)] border-indigo-800 text-[var(--text-primary)]",
    },
  }[theme];

  return (
    <div className={`min-h-screen ${themeStyles.bg} flex flex-col font-sans select-none transition-colors duration-300`}>
      {/* Header Corporativo com Seletor de Cores */}
      <header className={`${themeStyles.header} border-b px-6 py-3 flex justify-between items-center shadow-md`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              CAIXA 01 - ABERTO
            </span>
          </div>
          <div className="h-4 w-[1px] bg-gray-500/30"></div>
          <span className="text-xs opacity-75 font-medium">Operador: <strong>SISTEMA ADMIN</strong></span>
        </div>

        <div className="flex items-center gap-4">
          {/* Seletor de Temas */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setTheme("dark")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                theme === "dark" ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow" : "opacity-60 hover:opacity-100"
              }`}
            >
              🌙 Escuro
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                theme === "light" ? "bg-white text-gray-900 shadow" : "opacity-60 hover:opacity-100"
              }`}
            >
              ☀️ Claro
            </button>
            <button
              onClick={() => setTheme("vibrant")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                theme === "vibrant" ? "bg-indigo-600 text-[var(--text-primary)] shadow" : "opacity-60 hover:opacity-100"
              }`}
            >
              🎨 Colorido
            </button>
          </div>

          <Link
            href="/sales"
            className="px-4 py-1.5 text-xs font-semibold bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg transition-all flex items-center gap-2"
          >
            <span>📜</span> Histórico de Vendas
          </Link>
        </div>
      </header>

      {/* Grid Principal do PDV */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 max-w-[1600px] w-full mx-auto">
        {/* Lado Esquerdo: Busca e Tabela de Produtos */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className={`${themeStyles.card} border rounded-xl p-3 shadow-sm flex items-center gap-3`}>
            <span className="opacity-50 text-lg pl-2">🔍</span>
            <input
              type="text"
              placeholder="Digite o nome ou código do produto para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-base focus:outline-none font-medium"
              autoFocus
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="opacity-50 hover:opacity-100 pr-2">
                ✕
              </button>
            )}
          </div>

          <div className={`flex-1 ${themeStyles.card} border rounded-xl overflow-hidden shadow-lg flex flex-col`}>
            <div className={`${themeStyles.innerCard} border-b px-4 py-3 flex justify-between items-center`}>
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                Catálogo de Produtos ({filteredProducts.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {loading ? (
                <div className="text-center py-20 opacity-50 text-sm">Carregando catálogo de produtos...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 opacity-50 text-sm">Nenhum produto cadastrado ou encontrado.</div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead className={`${themeStyles.tableHeader} sticky top-0 z-10 border-b text-[11px] font-bold uppercase tracking-wider`}>
                    <tr>
                      <th className="py-3 px-4">Cód.</th>
                      <th className="py-3 px-4">Descrição do Produto</th>
                      <th className="py-3 px-4 text-center">Estoque</th>
                      <th className="py-3 px-4 text-right">Preço Un.</th>
                      <th className="py-3 px-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((product, idx) => {
                      const isOutOfStock = product.stock <= 0;
                      return (
                        <tr
                          key={product.id}
                          className={`transition-colors ${
                            idx % 2 === 0 ? themeStyles.tableRowEven : themeStyles.tableRowOdd
                          } ${isOutOfStock ? "opacity-40" : ""}`}
                        >
                          <td className="py-3 px-4 font-mono text-xs font-bold opacity-60">
                            #{String(product.id).padStart(3, "0")}
                          </td>
                          <td className="py-3 px-4 font-semibold">{product.name}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                                isOutOfStock
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                  : "bg-black/20"
                              }`}
                            >
                              {product.stock} un
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-extrabold font-mono ${themeStyles.accentText}`}>
                            R$ {Number(product.price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => addToCart(product)}
                              disabled={isOutOfStock}
                              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wide uppercase transition-all shadow-sm ${
                                !isOutOfStock
                                  ? `${themeStyles.primaryBtn} active:scale-95 cursor-pointer`
                                  : "bg-gray-500/20 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              + Incluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Carrinho de Compras */}
        <div className={`lg:col-span-5 ${themeStyles.card} border rounded-xl p-5 flex flex-col justify-between shadow-2xl`}>
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Itens da Venda</h2>
              </div>
              <span className="text-xs bg-black/20 font-bold px-2.5 py-1 rounded-full border border-white/10">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "itens"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-20 opacity-40 text-sm flex flex-col items-center gap-2">
                <span className="text-3xl opacity-30">📦</span>
                <span>Caixa livre. Aguardando inserção de produtos...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
                {cart.map((item, index) => (
                  <div
                    key={item.product.id}
                    className={`${themeStyles.innerCard} p-3 rounded-xl border flex justify-between items-center text-sm transition-colors`}
                  >
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <span className="text-xs font-mono font-bold opacity-50 w-5">{index + 1}.</span>
                      <div>
                        <p className="font-semibold line-clamp-1">{item.product.name}</p>
                        <p className="text-xs opacity-60 font-mono">
                          {item.quantity}x R$ {Number(item.product.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-black/20 border border-white/10 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="px-2 py-1 font-bold hover:text-red-400 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="px-2 py-1 font-bold hover:text-emerald-400 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <span className={`font-mono font-extrabold w-20 text-right ${themeStyles.accentText}`}>
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="opacity-50 hover:opacity-100 hover:text-red-400 text-xs p-1 transition-colors"
                        title="Remover Item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal e Botão Principal */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className={`${themeStyles.innerCard} p-4 rounded-xl border flex justify-between items-center`}>
              <div>
                <span className="text-xs font-bold opacity-60 uppercase tracking-wider block">
                  SUBTOTAL DA VENDA
                </span>
                <span className="text-xs opacity-50">Impostos inclusos</span>
              </div>
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${themeStyles.accentText}`}>
                R$ {totalCart.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className={`w-full py-4 font-black rounded-xl text-base tracking-wide uppercase transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-500/20 disabled:text-gray-500 disabled:cursor-not-allowed ${themeStyles.primaryBtn}`}
            >
              <span>💳</span> RECEBER PAGAMENTO
            </button>
          </div>
        </div>
      </div>

      {/* Footer com Atalhos */}
      <footer className={`${themeStyles.header} border-t px-6 py-2 flex justify-between items-center text-[11px] opacity-75`}>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><kbd className="bg-black/20 px-1.5 py-0.5 rounded border border-white/10 font-mono font-bold">F2</kbd> Pagamento</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-black/20 px-1.5 py-0.5 rounded border border-white/10 font-mono font-bold">F4</kbd> Buscar Produto</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-black/20 px-1.5 py-0.5 rounded border border-white/10 font-mono font-bold">ESC</kbd> Cancelar</span>
        </div>
        <div>PDV v1.0.0 — Sistema Comercial</div>
      </footer>

      {/* Modal de Pagamento Integrada */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${themeStyles.modalBg} border rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>💰</span> Confirmar Pagamento
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="opacity-60 hover:opacity-100 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFinalizeSale} className="space-y-4 text-sm">
              <div className={`${themeStyles.innerCard} p-3.5 rounded-xl border space-y-3`}>
                <p className="text-xs font-bold opacity-60 uppercase tracking-wider">
                  Identificação do Cliente (Opcional)
                </p>
                <div>
                  <label className="block text-xs opacity-75 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Silva"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-75 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs opacity-75 mb-1 font-semibold">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="MONEY">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                </select>
              </div>

              {paymentMethod === "MONEY" && (
                <div className={`${themeStyles.innerCard} grid grid-cols-2 gap-3 p-3.5 rounded-xl border`}>
                  <div>
                    <label className="block text-xs opacity-60 mb-1">Valor Recebido (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs opacity-60 mb-1">Troco a Devolver</label>
                    <div className={`px-3 py-2 bg-black/20 rounded-lg border border-white/10 font-mono font-extrabold ${themeStyles.accentText}`}>
                      R$ {changeNumber.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="emitReceipt"
                  checked={shouldEmitReceipt}
                  onChange={(e) => setShouldEmitReceipt(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="emitReceipt" className="text-xs opacity-80 cursor-pointer">
                  Emitir/Exibir cupom de comprovante após finalizar
                </label>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="opacity-60 text-xs font-bold uppercase">Total da Venda:</span>
                <span className={`text-2xl font-extrabold font-mono ${themeStyles.accentText}`}>R$ {totalCart.toFixed(2)}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-3 bg-black/20 hover:bg-black/30 border border-white/10 font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 font-black rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md ${themeStyles.primaryBtn}`}
                >
                  {isSubmitting ? "Processando..." : "Finalizar Venda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal do Cupom para Impressão */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`${themeStyles.modalBg} border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl`}>
            <div
              ref={printRef}
              className="bg-white text-black p-6 rounded-lg font-mono text-xs space-y-3 leading-tight shadow-inner"
            >
              <div className="text-center border-b border-black pb-2 space-y-1">
                <p className="font-bold text-sm uppercase">COMPROVANTE DE VENDA</p>
                <p>PDV SISTEMA COMERCIAL</p>
                <p>CNPJ: 00.000.000/0001-00</p>
                <p className="text-[10px]">{new Date(completedSale.createdAt).toLocaleString("pt-BR")}</p>
                <p className="font-bold">VENDA Nº #{completedSale.id}</p>
              </div>

              {(completedSale.customerName || completedSale.customerDocument) && (
                <div className="border-b border-black pb-2">
                  <p className="font-bold">CONSUMIDOR:</p>
                  {completedSale.customerName && <p>NOME: {completedSale.customerName}</p>}
                  {completedSale.customerDocument && <p>CPF/CNPJ: {completedSale.customerDocument}</p>}
                </div>
              )}

              <div className="border-b border-black pb-2 space-y-1">
                <div className="flex justify-between font-bold border-b border-gray-300 pb-1">
                  <span>ITEM / QTD x UN</span>
                  <span>TOTAL</span>
                </div>
                {completedSale.items.map((item) => (
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
                  <span>R$ {Number(completedSale.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>FORMA PAGTO:</span>
                  <span className="uppercase">{completedSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>VALOR PAGO:</span>
                  <span>R$ {Number(completedSale.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TROCO:</span>
                  <span>R$ {Number(completedSale.changeAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black pt-2 text-[10px] text-center">
                <p>Trib. Aprox.: R$ {Number(completedSale.taxTotal).toFixed(2)} (Lei 12.741/2012)</p>
                <p className="mt-1 font-bold">Obrigado pela preferência!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className={`flex-1 py-3 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors ${themeStyles.primaryBtn}`}
              >
                Imprimir Cupom
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-3 bg-black/20 hover:bg-black/30 border border-white/10 font-semibold rounded-xl text-xs uppercase tracking-wider"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}