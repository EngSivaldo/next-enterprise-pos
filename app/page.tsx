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

  const finalizeSale = (method: "money" | "pix" | "card") => {
    const total = calculateSubtotal();
    alert(`Venda finalizada via ${method.toUpperCase()}!\nTotal: R$ ${total.toFixed(2)}`);
    setCart([]);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 gap-4">
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