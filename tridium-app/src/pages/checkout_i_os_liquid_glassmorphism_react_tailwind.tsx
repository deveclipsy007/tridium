import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Landmark, Bitcoin, QrCode, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Ticket, ChevronRight } from "lucide-react";

/**
 * Checkout iOS Liquid — Glassmorphism
 * -------------------------------------------------
 * Design goals:
 * - iOS-style translucent glass (glassmorphism) with animated “liquid” blobs
 * - Soft gradients, subtle borders, inner noise and depth via shadows
 * - Microinteractions (hover/press) for a premium feel
 * - Ready-to-wire API calls (create intent / confirm / webhook)
 *
 * API CONTRACT (wire your gateway here)
 * -------------------------------------------------
 * POST /api/payments/intent
 *   Body: { amount: number, currency: "BRL"|"USD", method: "card"|"pix"|"boleto"|"crypto", metadata?: object }
 *   Returns: { clientSecret: string, intentId: string }
 *
 * POST /api/payments/confirm
 *   Body: { intentId: string, paymentMethodId?: string, extra?: object }
 *   Returns: { status: "succeeded"|"requires_action"|"processing"|"failed", receiptUrl?: string }
 *
 * POST /api/payments/webhook
 *   Use for provider events (PIX cobrada, cartão autorizado, etc.)
 *
 * Notes:
 * - Envie sempre um header "Idempotency-Key" único por tentativa de pagamento.
 * - Para cartão, NÃO colete PAN/CVV manualmente aqui. Use o SDK do gateway (ex: Stripe Elements, Pagar.me, Asaas, Malga) p/ tokenizar.
 * - Este componente suporta MOCK_MODE para demo sem backend.
 */

const MOCK_MODE = true;

type Method = "card" | "pix" | "boleto" | "crypto";

const methods: Array<{ id: Method; label: string; icon: React.ReactNode }> = [
  { id: "card", label: "Cartão", icon: <CreditCard className="w-4 h-4" /> },
  { id: "pix", label: "PIX", icon: <QrCode className="w-4 h-4" /> },
  { id: "boleto", label: "Boleto", icon: <Landmark className="w-4 h-4" /> },
  { id: "crypto", label: "Cripto", icon: <Bitcoin className="w-4 h-4" /> },
];

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CheckoutIOSLiquid() {
  const [method, setMethod] = useState<Method>("card");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string; url?: string }>(null);
  const [coupon, setCoupon] = useState("");

  const pricing = useMemo(() => {
    const subtotal = 49700; // em centavos
    const discount = coupon.trim().toUpperCase() === "GAMBIT10" ? Math.round(subtotal * 0.1) : 0;
    const fees = method === "boleto" ? 390 : method === "crypto" ? 0 : 0; // exemplo
    const total = Math.max(subtotal - discount + fees, 0);
    return { subtotal, discount, fees, total };
  }, [coupon, method]);

  async function api(url: string, body: any) {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 1000));
      if (url.endsWith("intent")) return { clientSecret: "mock_secret", intentId: "pi_mock_123" };
      if (url.endsWith("confirm")) return { status: "succeeded", receiptUrl: "https://example.com/receipt/mock" } as const;
      throw new Error("Unknown mock endpoint");
    }
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function handlePay() {
    try {
      setLoading(true);
      setStatus(null);

      // 1) Cria Intent no backend
      const intent = await api("/api/payments/intent", {
        amount: pricing.total,
        currency: "BRL",
        method,
        metadata: { coupon: coupon || undefined },
      });

      // 2) Confirma conforme método (exemplos simplificados)
      if (method === "card") {
        // Aqui você usaria o SDK do gateway para criar o paymentMethodId com inputs seguros
        const paymentMethodId = "pm_mock_visa"; // placeholder
        const conf = await api("/api/payments/confirm", { intentId: intent.intentId, paymentMethodId });
        if (conf.status === "succeeded") {
          setStatus({ ok: true, msg: "Pagamento aprovado!", url: (conf as any).receiptUrl });
        } else if (conf.status === "requires_action") {
          setStatus({ ok: true, msg: "Ação adicional necessária (3DS)." });
        } else if (conf.status === "processing") {
          setStatus({ ok: true, msg: "Processando..." });
        } else {
          setStatus({ ok: false, msg: "Falha no pagamento." });
        }
      }

      if (method === "pix") {
        setStatus({ ok: true, msg: "Copia e cola/QR gerado. Aguardando confirmação do PIX..." });
      }

      if (method === "boleto") {
        setStatus({ ok: true, msg: "Boleto gerado. O status será atualizado após compensação." });
      }

      if (method === "crypto") {
        setStatus({ ok: true, msg: "Endereço de carteira gerado. Aguarde confirmações na rede." });
      }
    } catch (err: any) {
      setStatus({ ok: false, msg: err?.message || "Erro inesperado" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(1200px_700px_at_-10%_-10%,#5b8cff33,transparent_60%),radial-gradient(1200px_700px_at_110%_10%,#ff78b633,transparent_60%),linear-gradient(180deg,#0a0b10,#0b0f1a)]">
      {/* Animated liquid blobs */}
      <LiquidBlobs />

      {/* Grain / noise overlay for realism */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'1600\\' height=\\'900\\'><filter id=\\'n\\'><feTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.65\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\'/></filter><rect width=\\'100%\\' height=\\'100%\\' filter=\\'url(%23n)\\' opacity=\\'0.5\\'/></svg>')" }} />

      <div className="relative mx-auto max-w-5xl px-4 py-10 md:py-16">
        {/* Brand/Header */}
        <div className="mb-6 flex items-center justify-between text-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm uppercase tracking-widest text-white/70">Checkout Seguro</div>
              <div className="text-xl font-semibold">DX Infinite</div>
            </div>
          </div>
          <div className="text-sm text-white/60">Compatível com {" "}
            <span className="font-medium text-white">Cartão · PIX · Boleto · Cripto</span>
          </div>
        </div>

        {/* Glass Panel */}
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            {/* subtle inner highlight border */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 [mask:linear-gradient(#fff,transparent_30%)]" />

            <h2 className="mb-4 text-lg font-semibold text-white/90">Informações de Pagamento</h2>

            {/* Method selector */}
            <div className="mb-5 grid grid-cols-4 gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`group relative flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all ${
                    method === m.id
                      ? "border-white/25 bg-white/15 text-white backdrop-blur-md"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                  {method === m.id && (
                    <motion.div layoutId="pill" className="absolute inset-0 -z-10 rounded-2xl" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  )}
                </button>
              ))}
            </div>

            {method === "card" && <CardFields />}
            {method === "pix" && <PixFields />}
            {method === "boleto" && <BoletoFields />}
            {method === "crypto" && <CryptoFields />}

            {/* Coupon */}
            <div className="mt-6 flex items-center gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50"><Ticket className="w-4 h-4" /></div>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Cupom (ex: GAMBIT10)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-9 py-3 text-white placeholder-white/40 outline-none focus:border-white/20 focus:bg-white/10"
                />
              </div>
              <button onClick={() => setCoupon("")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10">Limpar</button>
            </div>

            {/* Pay button */}
            <div className="mt-6">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePay}
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/40 to-white/20 px-4 py-4 text-center text-base font-semibold text-[#0b0f1a] backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(120%_100%_at_50%_0%,#000,transparent_70%)]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.95), rgba(255,255,255,0.7))", backgroundSize: "200% 100%" }} />
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processando...</span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">Pagar agora <ChevronRight className="h-4 w-4" /></span>
                )}
              </motion.button>

              {/* Status */}
              {status && (
                <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  status.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-400/10 text-rose-200"
                }`}
                >
                  {status.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{status.msg}</span>
                  {status.url && (
                    <a className="ml-auto underline underline-offset-4" href={status.url} target="_blank">Ver recibo</a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 [mask:linear-gradient(#fff,transparent_30%)]" />

            <h3 className="mb-4 text-lg font-semibold text-white/90">Resumo</h3>
            <div className="space-y-3 text-white/85">
              <Row label="Produto" value="Assinatura DX Infinite (mensal)" />
              <Row label="Subtotal" value={BRL(pricing.subtotal / 100)} />
              <Row label="Taxas" value={BRL(pricing.fees / 100)} />
              <Row label="Desconto" value={`- ${BRL(pricing.discount / 100)}`} />
              <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Row label={<span className="font-semibold text-white">Total</span>} value={<span className="font-semibold text-white">{BRL(pricing.total / 100)}</span>} />
            </div>

            <div className="mt-6 text-xs text-white/60">
              Pagamentos protegidos com criptografia. Ao continuar, você concorda com os termos e a política de privacidade.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-white/70">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Field({ label, placeholder, disabled = false }: { label: string; placeholder?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-white/60">{label}</div>
      <input
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-white/20 focus:bg-white/10 disabled:opacity-60"
      />
    </label>
  );
}

function CardFields() {
  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
        Para cartão, insira aqui os elementos do SDK do seu gateway (ex: Stripe Elements, Pagar.me, Asaas, Malga). Não manipule PAN/CVV diretamente neste form.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome impresso" placeholder="João da Silva" />
        <Field label="CPF" placeholder="000.000.000-00" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Nº do cartão (via SDK)" placeholder="•••• •••• •••• ••••" disabled />
        <Field label="Validade" placeholder="MM/AA" disabled />
        <Field label="CVV" placeholder="•••" disabled />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="E-mail" placeholder="voce@email.com" />
        <Field label="Telefone" placeholder="(11) 99999-9999" />
      </div>
    </div>
  );
}

function PixFields() {
  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
        Gere um QR Code/Copia-e-Cola ao confirmar. Atualize o status via webhook.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome completo" placeholder="João da Silva" />
        <Field label="CPF" placeholder="000.000.000-00" />
      </div>
      <Field label="E-mail (envio do comprovante)" placeholder="voce@email.com" />
    </div>
  );
}

function BoletoFields() {
  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
        O boleto será gerado após confirmação. Exiba o PDF/link e salve o vencimento.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome completo" placeholder="João da Silva" />
        <Field label="CPF" placeholder="000.000.000-00" />
      </div>
      <Field label="Endereço" placeholder="Rua Exemplo, 123" />
    </div>
  );
}

function CryptoFields() {
  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
        Gera um endereço temporário (ex: USDT/TRC20). Confirme por callbacks de rede.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="E-mail" placeholder="voce@email.com" />
        <Field label="Carteira preferida (opcional)" placeholder="0x..." />
      </div>
    </div>
  );
}

function LiquidBlobs() {
  return (
    <>
      <motion.div
        className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#6ea0ff] opacity-20 blur-3xl"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-20 h-96 w-96 rounded-full bg-[#ff8cb9] opacity-20 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7bffd1] opacity-[0.12] blur-[100px]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
      />
    </>
  );
}
