"use client"; // Necessário para usar useState e outros hooks do React

import React, { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

const products: Product[] = [
  { id: 1, name: "Refrigerante", price: 5.50 },
  { id: 2, name: "Salgadinho", price: 3.00 },
  { id: 3, name: "Chocolate", price: 4.25 },
  { id: 4, name: "Água Mineral", price: 2.00 },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const finalizeSale = (method: "money" | "pix") => {
    alert(`Venda finalizada com ${method === "money" ? "Dinheiro" : "Pix"}! Total: R$ ${calculateTotal().toFixed(2)}`);
    setCart([]); // Limpar o carrinho após a venda
  };

  return (
    <div className="min-h-screen bg-gray-100 flex p-4">
      {/* Coluna de Busca de Produtos */}
      <div className="w-1/2 bg-white rounded-lg shadow-md p-6 mr-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Buscar Produtos</h2>
        <input
          type="text"
          placeholder="Digite o nome do produto..."
          className="p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex-grow overflow-y-auto">
          {filteredProducts.length > 0 ? (
            <ul className="space-y-3">
              {filteredProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md shadow-sm border border-gray-200"
                >
                  <span className="text-lg text-gray-700">{product.name} - R$ {product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    Adicionar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center mt-8">Nenhum produto encontrado.</p>
          )}
        </div>
      </div>

      {/* Coluna do Carrinho de Compras e Finalização */}
      <div className="w-1/2 bg-white rounded-lg shadow-md p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Carrinho de Compras</h2>
        <div className="flex-grow overflow-y-auto mb-4 border-b pb-4">
          {cart.length > 0 ? (
            <ul className="space-y-3">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-blue-50 rounded-md shadow-sm border border-blue-200"
                >
                  <span className="text-lg text-gray-700">
                    {item.name} ({item.quantity}) - R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center mt-8">Carrinho vazio.</p>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Total: R$ {calculateTotal().toFixed(2)}</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => finalizeSale("money")}
              className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-md text-xl font-semibold hover:bg-blue-700 transition-colors"
              disabled={cart.length === 0}
            >
              Finalizar (Dinheiro)
            </button>
            <button
              onClick={() => finalizeSale("pix")}
              className="flex-1 px-5 py-3 bg-purple-600 text-white rounded-md text-xl font-semibold hover:bg-purple-700 transition-colors"
              disabled={cart.length === 0}
            >
              Finalizar (Pix)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
