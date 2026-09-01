"use client";

import React, { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const products: Product[] = [
  { id: 1, name: "Refrigerante 350ml", price: 5.50, category: "Bebidas" },
  { id: 2, name: "Salgadinho Batata", price: 3.00, category: "Snacks" },
  { id: 3, name: "Chocolate Barra", price: 4.25, category: "Doces" },
  { id: 4, name: "Água Mineral 500ml", price: 2.00, category: "Bebidas" },
  { id: 5, name: "Energético 473ml", price: 9.00, category: "Bebidas" },
  { id: 6, name: "Sanduíche Natural", price: 8.50, category: "Lanches" },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modal & Success States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"money" | "pix" | "card" | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [isConfirmingSale, setIsConfirmingSale] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categories = ["Todos", "Bebidas", "Snacks", "Doces", "Lanches"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleOpenCheckout = (method: "money" | "pix" | "card") => {
    const total = calculateSubtotal();
    if (total === 0) {
      alert("O carrinho está vazio!");
      return;
    }
    setPaymentMethod(method);
    setAmountReceived("");
    setIsConfirmingSale(false);
    setIsModalOpen(true);
  };

  const handleProceedToConfirmation = () => {
    const total = calculateSubtotal();
    if (paymentMethod === "money") {
      const received = parseFloat(amountReceived) || 0;
      if (received < total) {
        alert("O valor recebido é menor que o total a pagar!");
        return;
      }
    }
    setIsConfirmingSale(true);
  };

  const confirmSale = () => {
    const methodText = paymentMethod === "money" ? "Dinheiro" : paymentMethod === "pix" ? "PIX" : "Cartão";
    
    setIsModalOpen(false);
    setIsConfirmingSale(false);
    setCart([]);
    setSuccessMessage(`Venda finalizada com sucesso via ${methodText}!`);
    
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const subtotal = calculateSubtotal();
  const numericReceived = parseFloat(amountReceived) || 0;
  const changeDue = numericReceived > subtotal ? numericReceived - subtotal : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 gap-4 relative">
      {/* Top Bar */}
      <header className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 text-white p-2 rounded-lg font-bold text-xl">PDV</div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Caixa 01 - Principal</h1>
            <p className="text-xs text-slate-400">Operador: João Silva</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-emerald-400">Sistema Online</span>
        </div>
      </header>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-900/90 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between">
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white text-xs font-bold">✕</button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* Left Column: Product Grid & Search */}
        <section className="w-7/12 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col shadow-lg">
          <div className="flex flex-col gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-200">Catálogo de Produtos</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pesquisar produto por nome..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between text-left transition-all hover:shadow-md hover:shadow-emerald-950/20 group"
                  >
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">
                        {product.category}
                      </span>
                      <h3 className="font-medium text-slate-200 mt-2 text-sm group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-base font-bold text-slate-100">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        Adicionar
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p className="text-sm">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Cart & Checkout */}
        <section className="w-5/12 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col shadow-lg">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Carrinho Atual</h2>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 mb-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-200 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400">R$ {item.price.toFixed(2)} un</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="text-sm font-bold text-emerald-400">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Remover item"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p className="text-sm">O carrinho está vazio</p>
                <p className="text-xs text-slate-600 mt-1">Selecione produtos ao lado</p>
              </div>
            )}
          </div>

          {/* Summary & Checkout Actions */}
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-base font-medium text-slate-300">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-slate-100">
              <span>Total a Pagar</span>
              <span className="text-emerald-400">R$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => handleOpenCheckout("money")}
                className="bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
              >
                Dinheiro
              </button>
              <button
                onClick={() => handleOpenCheckout("pix")}
                className="bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
              >
                PIX
              </button>
              <button
                onClick={() => handleOpenCheckout("card")}
                className="bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
              >
                Cartão
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Checkout Modal / Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">
                {isConfirmingSale
                  ? "Confirmação de Venda"
                  : `Finalizar Pagamento - ${paymentMethod?.toUpperCase()}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {!isConfirmingSale ? (
              <>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Total da Compra:</span>
                    <span className="font-bold text-emerald-400">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  {paymentMethod === "money" && (
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Valor Recebido (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-sm font-medium text-slate-300">Troco:</span>
                        <span className={`text-base font-bold ${changeDue >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          R$ {changeDue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "pix" && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 my-2">
                      <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xl mb-1">
                        ✓
                      </div>
                      <p className="text-sm font-medium text-slate-200">Aguardando Confirmação PIX</p>
                      <p className="text-xs text-slate-400">O cliente deve escanear o QR Code no terminal de pagamento.</p>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 my-2">
                      <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xl mb-1">
                        💳
                      </div>
                      <p className="text-sm font-medium text-slate-200">Insira ou aproxime o cartão</p>
                      <p className="text-xs text-slate-400">Aguardando processamento na maquininha...</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProceedToConfirmation}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/40"
                  >
                    Confirmar Venda
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <p className="text-base text-slate-200">Deseja realmente finalizar esta venda?</p>
                  <div className="text-2xl font-bold text-emerald-400">
                    R$ {subtotal.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-400">Esta ação não poderá ser desfeita após a confirmação.</p>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setIsConfirmingSale(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-slate-700"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={confirmSale}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/40"
                  >
                    Sim, Finalizar Venda
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
