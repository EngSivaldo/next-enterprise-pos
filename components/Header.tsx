"use client";

import React from "react";
import { useTheme } from "../context/ThemeContext";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="w-full h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 flex items-center justify-between text-[var(--text-primary)]">
      <div className="flex items-center gap-6 font-bold text-lg">
        <span>⚡ PDV SYSTEM</span>
      </div>

      <div className="flex items-center gap-2 text-xs bg-[var(--bg-inner)] p-1 rounded-lg border border-[var(--border-color)]">
        <button
          onClick={() => setTheme("dark")}
          className={`px-3 py-1.5 rounded-md transition-all ${
            theme === "dark"
              ? "bg-[var(--accent-color)] text-white font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          🌙 Escuro
        </button>
        <button
          onClick={() => setTheme("light")}
          className={`px-3 py-1.5 rounded-md transition-all ${
            theme === "light"
              ? "bg-[var(--accent-color)] text-white font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          ☀️ Claro
        </button>
        <button
          onClick={() => setTheme("vibrant")}
          className={`px-3 py-1.5 rounded-md transition-all ${
            theme === "vibrant"
              ? "bg-[var(--accent-color)] text-white font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          🎨 Colorido
        </button>
      </div>
    </header>
  );
}