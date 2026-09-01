import "./globals.css";
import React from "react";

export const metadata = {
  title: "PDV System - Dark Mode",
  description: "Professional POS Interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
