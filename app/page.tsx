"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

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