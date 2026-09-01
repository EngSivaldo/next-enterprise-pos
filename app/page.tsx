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
    }, 4000);
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
          <span className="text-sm font-medium text-emerald-40