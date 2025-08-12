import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Search,
  PlayCircle,
  Briefcase,
  BadgeDollarSign,
  Link as LinkIcon,
  ShieldCheck,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Settings2,
  ExternalLink,
  Eye,
  EyeOff,
  ServerCog,
} from "lucide-react";

/**
 * Integrations Hub (Admin) — iOS‑Liquid
 * ----------------------------------------------------------------
 * Conectores: Meta, Google, TikTok, LinkedIn, Asaas.
 *  - Botão Connect/Reconnect (OAuth simulado para ads; API Key para Asaas)
 *  - Sandbox/Prod toggle (somente visual, guarda em state)
 *  - Webhook status + instalar (mock chama endpoints sugeridos do gateway)
 *  - Testes rápidos: ping, rate‑limit, último sync
 *  - UI glassmorphism + blobs
 *
 * Para produção, troque MOCK=false e implemente os endpoints no Gateway:
 *  - GET  /api/admin/integrations/:provider/oauth-url
 *  - POST /api/admin/integrations/:provider/disconnect
 *  - GET  /api/admin/integrations/:provider/status
 *  - POST /api/admin/asaas/webhook  (já sugerido no blueprint)
 */

const MOCK = true;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Provider = "meta" | "google" | "tiktok" | "linkedin" | "asaas";

type Integration = {
  provider: Provider;
  label: string;
  icon: React.ReactNode;
  connected: boolean;
  sandbox: boolean;
  account?: string;
  lastSync?: string;
  webhooks?: { configured: boolean; url?: string };
  scopes?: string[];
  rate?: { used: number; limit: number };
  needsKey?: boolean; // Asaas
};

function nowISO() {
  return new Date().toISOString();
}

export default function IntegrationsHubAdmin() {
  const [list, setList] = useState<Integration[]>([
    { provider: "meta", label: "Meta Ads", icon: <Megaphone className="h-4 w-4" />, connected: false, sandbox: true, scopes: ["ads_read", "ads_manage", "offline_access"], rate: { used: 0, limit: 2000 } },
    { provider: "google", label: "Google Ads", icon: <Search className="h-4 w-4" />, connected: false, sandbox: true, scopes: ["adwords", "offline_access"], rate: { used: 0, limit: 2000 } },
    { provider: "tiktok", label: "TikTok Ads", icon: <PlayCircle className="h-4 w-4" />, connected: false, sandbox: true, scopes: ["ads.read", "ads.manage"], rate: { used: 0, limit: 1000 } },
    { provider: "linkedin", label: "LinkedIn Ads", icon: <Briefcase className="h-4 w-4" />, connected: false, sandbox: true, scopes: ["r_ads", "rw_ads"], rate: { used: 0, limit: 800 } },
    { provider: "asaas", label: "Asaas (PIX/Boleto/Cartão)", icon: <BadgeDollarSign className="h-4 w-4" />, connected: false, sandbox: true, needsKey: true, webhooks: { configured: false } },
  ]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (!MOCK) refreshAll();
  }, []);

  async function refreshAll() {
    setBusy("refresh");
    try {
      const refreshed = await Promise.all(
        list.map(async (i) => ({ ...i, ...(await fetchStatus(i.provider)) }))
      );
      setList(refreshed);
    } catch (e) {
      console.warn(e);
    } finally {
      setBusy(null);
    }
  }

  function webhookUrl(p: Provider) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://app.local";
    const map: Record<Provider, string> = {
      meta: `${origin}/api/webhooks/meta`,
      google: `${origin}/api/webhooks/google`,
      tiktok: `${origin}/api/webhooks/tiktok`,
      linkedin: `${origin}/api/webhooks/linkedin`,
      asaas: `${origin}/api/webhooks/asaas`,
    };
    return map[p];
  }

  async function fetchStatus(p: Provider) {
    if (MOCK) {
      await wait(200);
      return {};
    }
    const r = await fetch(`/api/admin/integrations/${p}/status`);
    return r.json();
  }

  async function connect(p: Provider) {
    setBusy(p);
    try {
      if (p === "asaas") {
        if (!apiKey && MOCK) throw new Error("Informe a API Key da Asaas");
        // salvar key e marcar conectado
        if (MOCK) {
          await wait(300);
          mutate(p, (x) => {
            x.connected = true; x.account = "sandbox@asaas"; x.webhooks = { configured: false, url: webhookUrl("asaas") }; x.lastSync = nowISO();
          });
          return;
        }
        await fetch(`/api/admin/integrations/asaas/connect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      } else {
        if (MOCK) {
          await wait(400);
          mutate(p, (x) => { x.connected = true; x.account = `${p}-acct-001`; x.lastSync = nowISO(); });
          return;
        }
        const r = await fetch(`/api/admin/integrations/${p}/oauth-url`);
        const { url } = await r.json();
        window.location.href = url;
      }
    } catch (e) {
      alert(String(e));
    } finally { setBusy(null); }
  }

  async function disconnect(p: Provider) {
    setBusy(p + ":disc");
    try {
      if (MOCK) {
        await wait(200);
        mutate(p, (x) => { x.connected = false; x.account = undefined; });
        return;
      }
      await fetch(`/api/admin/integrations/${p}/disconnect`, { method: "POST" });
    } finally { setBusy(null); }
  }

  async function installWebhook(p: Provider) {
    setBusy(p + ":wh");
    try {
      if (MOCK) {
        await wait(250);
        mutate(p, (x) => { x.webhooks = { configured: true, url: webhookUrl(p) }; });
        return;
      }
      if (p === "asaas") {
        const r = await fetch(`/api/admin/asaas/webhook`, { method: "POST" });
        if (!r.ok) throw new Error(await r.text());
      } else {
        await fetch(`/api/admin/${p}/webhook`, { method: "POST" });
      }
    } catch (e) {
      alert(String(e));
    } finally { setBusy(null); }
  }

  function mutate(p: Provider, f: (x: Integration) => void) {
    setList((prev) => prev.map((i) => (i.provider === p ? { ...i, ...(f(i), i) } : i)));
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(1200px_700px_at_-10%_-10%,#5b8cff33,transparent_60%),radial-gradient(1200px_700px_at_110%_10%,#ff78b633,transparent_60%),linear-gradient(180deg,#0a0b10,#0b0f1a)]">
      <LiquidBlobs />

      <div className="relative mx-auto max-w-[1400px] px-4 py-6 md:py-10 text-white">
        {/* Topbar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              <ServerCog className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-widest text-white/60">Tridium • Admin</div>
              <div className="text-xl font-semibold">Integrations Hub</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshAll} disabled={busy==="refresh"} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20 disabled:opacity-60">
              <RefreshCcw className="h-4 w-4" /> Atualizar status
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-3 py-2 text-sm font-semibold text-[#0b0f1a] backdrop-blur-md hover:bg-white/30">
              <Settings2 className="h-4 w-4" /> Preferências
            </button>
          </div>
        </div>

        {/* Grid de integrações */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((it) => (
            <IntegrationCard key={it.provider} it={it} onConnect={() => connect(it.provider)} onDisconnect={() => disconnect(it.provider)} onInstallWebhook={() => installWebhook(it.provider)} onToggleSandbox={(v) => mutate(it.provider, (x) => { x.sandbox = v; })} />
          ))}
        </div>

        {/* Asaas Key Drawer (inline simples) */}
        <div className="mt-6">
          <GlassPanel>
            <div className="mb-2 flex items-center justify-between text-white/80">
              <div className="inline-flex items-center gap-2"><BadgeDollarSign className="h-4 w-4" /> Chave da Asaas (API Key)</div>
              <span className="text-xs text-white/60">Sandbox ou Produção (definido no card)</span>
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50"><LinkIcon className="h-4 w-4" /></div>
                <input value={apiKey} onChange={(e)=>setApiKey(e.target.value)} type={showKey? 'text':'password'} placeholder="insira sua API Key da Asaas" className="w-full rounded-2xl border border-white/15 bg-white/10 px-9 py-2 text-white placeholder-white/50 outline-none focus:border-white/25 focus:bg-white/15" />
                <button onClick={()=>setShowKey(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70">{showKey? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}</button>
              </div>
              <button onClick={()=>connect('asaas')} disabled={busy==='asaas'} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-3 py-2 text-sm font-semibold text-[#0b0f1a] backdrop-blur-md hover:bg-white/30 disabled:opacity-60">{busy==='asaas'? 'Conectando...' : 'Salvar e Conectar'}</button>
            </div>
            <div className="mt-2 text-xs text-white/60">* A chave é armazenada no **Vault** do servidor (não no cliente). Use env <code>ASAAS_API_KEY</code> por tenant quando possível.</div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ it, onConnect, onDisconnect, onInstallWebhook, onToggleSandbox }: { it: Integration; onConnect: () => void; onDisconnect: () => void; onInstallWebhook: () => void; onToggleSandbox: (v: boolean) => void; }) {
  const badge = it.connected ? (
    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[11px] text-emerald-100"><CheckCircle2 className="h-3 w-3"/> Conectado</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] text-amber-100"><AlertTriangle className="h-3 w-3"/> Desconectado</span>
  );
  const rateTxt = it.rate ? `${it.rate.used}/${it.rate.limit}` : "—";
  const whUrl = it.webhooks?.url || "—";
  return (
    <GlassPanel>
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-white/80">{it.icon} <span className="font-semibold">{it.label}</span></div>
        {badge}
      </div>
      <div className="grid gap-2 text-sm text-white/80">
        <div className="flex items-center justify-between">
          <span>Ambiente</span>
          <div className="inline-flex items-center gap-2">
            <Toggle checked={it.sandbox} onChange={(v)=>onToggleSandbox(v)} label={it.sandbox? 'Sandbox':'Produção'} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Conta</span>
          <span className="text-white/60">{it.account || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Último sync</span>
          <span className="text-white/60">{it.lastSync ? new Date(it.lastSync).toLocaleString('pt-BR') : '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Rate‑limit</span>
          <span className="text-white/60">{rateTxt}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Webhooks</span>
          <div className="inline-flex items-center gap-2">
            {it.webhooks?.configured ? (
              <span className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[11px] text-emerald-100">Ativo</span>
            ) : (
              <span className="rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-white/70">Inativo</span>
            )}
            <button onClick={onInstallWebhook} className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/20">Instalar</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>URL do webhook</span>
          <a className="truncate text-right text-white/60 hover:text-white" href={whUrl} target="_blank" rel="noreferrer">{whUrl} {whUrl !== '—' && <ExternalLink className="ml-1 inline h-3 w-3"/>}</a>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-white/60">Escopos: {it.scopes?.join(', ') || (it.needsKey? 'api_key' : '—')}</div>
        <div className="inline-flex gap-2">
          {!it.connected ? (
            <button onClick={onConnect} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-3 py-2 text-sm font-semibold text-[#0b0f1a] backdrop-blur-md hover:bg-white/30"><LinkIcon className="h-4 w-4"/> Conectar</button>
          ) : (
            <button onClick={onDisconnect} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20">Desconectar</button>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

function Toggle({ checked, onChange, label }: { checked?: boolean; onChange?: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange && onChange(!checked)} className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${checked ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/10 text-white/70'}`}>
      <ShieldCheck className="h-3 w-3" /> {label || (checked ? 'On' : 'Off')}
    </button>
  );
}

function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 text-white/90 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 [mask:linear-gradient(#fff,transparent_30%)]" />
      {children}
    </div>
  );
}

function LiquidBlobs() {
  return (
    <>
      <motion.div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#6ea0ff] opacity-20 blur-3xl" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }} />
      <motion.div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-[#ff8cb9] opacity-20 blur-3xl" animate={{ y: [0, 30, 0], x: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }} />
      <motion.div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7bffd1] opacity-[0.12] blur-[100px]" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }} />
    </>
  );
}
