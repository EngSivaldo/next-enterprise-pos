"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CashRegisterPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState<any>(null);

  // Estados dos Modais
  const [modalType, setModalType] = useState<"OPEN" | "CLOSE" | "SANGRIA" | "SUPRIMENTO" | null>(null);
  const [pin, setPin] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Carregar status atual do caixa
  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/cash-register");
      const data = await res.json();
      setIsOpen(data.isOpen);
      setShiftData(data.register);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  // Submit do Form / Validação por PIN
  async function handleAction(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const reportedAmount = parseFloat(amount) || 0;
    const expectedAmount = shiftData?.calculatedBalance || 0;

    if (modalType === "CLOSE" && reportedAmount !== expectedAmount) {
      const diff = reportedAmount - expectedAmount;
      const typeStr = diff < 0 ? `QUEBRA DE CAIXA de R$ ${Math.abs(diff).toFixed(2)}` : `SOBRA DE CAIXA de R$ ${diff.toFixed(2)}`;
      
      const confirmClose = window.confirm(
        `Atenção! Existe uma divergência nos valores:\n\n` +
        `• Esperado pelo sistema: R$ ${expectedAmount.toFixed(2)}\n` +
        `• Contado por você: R$ ${reportedAmount.toFixed(2)}\n\n` +
        `Será registrada uma ${typeStr}.\n\nDeseja fechar o caixa mesmo assim?`
      );

      if (!confirmClose) return;
    }

    let payload: any = { pin };

    if (modalType === "OPEN") {
      payload = { ...payload, action: "OPEN", initialBalance: amount };
    } else if (modalType === "CLOSE") {
      payload = { ...payload, action: "CLOSE", finalBalance: amount };
    } else if (modalType === "SANGRIA") {
      payload = { ...payload, action: "TRANSACTION", type: "CASH_OUT", amount, reason };
    } else if (modalType === "SUPRIMENTO") {
      payload = { ...payload, action: "TRANSACTION", type: "CASH_IN", amount, reason };
    }

    const res = await fetch("/api/cash-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || "Ocorreu um erro ao processar.");
      return;
    }

    if (modalType === "OPEN") {
      router.push("/pos");
      return;
    }

    setModalType(null);
    setPin("");
    setAmount("");
    setReason("");
    fetchStatus();
  }

  const reportedNum = parseFloat(amount) || 0;
  const expectedNum = shiftData?.calculatedBalance || 0;
  const currentDiff = reportedNum - expectedNum;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Turno de Caixa</h1>
          <p className="text-slate-400 text-sm">Abertura, fechamento e movimentações com validação por PIN de Gerente</p>
        </div>
        
        <div className="flex gap-3">
          {isOpen && (
            <Link 
              href="/pos" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              🛒 Ir para o PDV
            </Link>
          )}
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-slate-700">
            Menu Principal
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Carregando informações do caixa...</div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Card de Status */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status Atual</span>
              <div className="flex items-center gap-3 mt-1">
                <span className={`h-3 w-3 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <h2 className="text-xl font-bold text-white">{isOpen ? "CAIXA ABERTO" : "CAIXA FECHADO"}</h2>
              </div>
              {isOpen && shiftData && (
                <p className="text-xs text-slate-300 mt-2">
                  Aberto por <strong className="text-white">{shiftData.user?.name}</strong> em{" "}
                  {new Date(shiftData.openedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>

            <div>
              {isOpen ? (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Fundo + Transações Estimadas</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    R$ {(shiftData?.calculatedBalance || 0).toFixed(2)}
                  </span>
                  <button
                    onClick={() => { setModalType("CLOSE"); setErrorMsg(""); setAmount(""); }}
                    className="block mt-2 bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2 rounded-lg font-medium ml-auto transition"
                  >
                    Fechar Caixa
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setModalType("OPEN"); setErrorMsg(""); setAmount(""); }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  Abrir Turno de Caixa
                </button>
              )}
            </div>
          </div>

          {/* Opções de Movimentação */}
          {isOpen && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setModalType("SANGRIA"); setErrorMsg(""); setAmount(""); }}
                className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-500 text-left transition shadow-md"
              >
                <div className="text-rose-400 font-semibold mb-1">💸 Realizar Sangria</div>
                <div className="text-xs text-slate-400">Retirada de dinheiro em espécie do caixa</div>
              </button>

              <button
                onClick={() => { setModalType("SUPRIMENTO"); setErrorMsg(""); setAmount(""); }}
                className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-500 text-left transition shadow-md"
              >
                <div className="text-emerald-400 font-semibold mb-1">💵 Adicionar Suprimento</div>
                <div className="text-xs text-slate-400">Injeção de reforço de fundo de troco</div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Operação / Validação por PIN */}
      {modalType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-1 text-white">
              {modalType === "OPEN" && "Abertura de Caixa"}
              {modalType === "CLOSE" && "Fechamento de Caixa"}
              {modalType === "SANGRIA" && "Realizar Sangria"}
              {modalType === "SUPRIMENTO" && "Adicionar Suprimento"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {modalType === "OPEN" && "Informe o fundo inicial e o PIN do Gerente/Admin"}
              {modalType === "CLOSE" && "Informe o saldo contado e o PIN do Gerente/Admin"}
              {modalType === "SANGRIA" && "Digite o valor de saída e confirme com seu PIN"}
              {modalType === "SUPRIMENTO" && "Digite o valor de entrada e confirme com seu PIN"}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {modalType === "OPEN" && "Fundo Inicial (R$)"}
                  {modalType === "CLOSE" && "Valor em Caixa na Contagem (R$)"}
                  {(modalType === "SANGRIA" || modalType === "SUPRIMENTO") && "Valor (R$)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>

              {/* Destaque de Divergência no Modal de Fechamento */}
              {modalType === "CLOSE" && amount !== "" && (
                <div className={`p-3 rounded-lg border text-xs ${
                  currentDiff === 0 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : currentDiff < 0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}>
                  <div className="flex justify-between">
                    <span>Esperado pelo Sistema:</span>
                    <strong>R$ {expectedNum.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-slate-700/50">
                    <span>Diferença Apurada:</span>
                    <strong>
                      {currentDiff === 0 && "Sem diferença (OK)"}
                      {currentDiff < 0 && `Quebra: -R$ ${Math.abs(currentDiff).toFixed(2)}`}
                      {currentDiff > 0 && `Sobra: +R$ ${currentDiff.toFixed(2)}`}
                    </strong>
                  </div>
                </div>
              )}

              {(modalType === "SANGRIA" || modalType === "SUPRIMENTO") && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Motivo / Observação</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Pagamento de fornecedor rápido"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">PIN do Gerente / Operador</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tracking-widest text-center text-lg"
                  placeholder="••••"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="w-1/2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}