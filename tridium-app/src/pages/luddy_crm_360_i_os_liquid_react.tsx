import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Rocket,
  MessageCircle,
  MessageSquare,
  Megaphone,
  MousePointerClick,
  Link as LinkIcon,
  FileText,
  CalendarDays,
  DollarSign,
  CreditCard,
  Receipt,
  ShieldCheck,
  Filter,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * Luddy CRM 360 — Linha do tempo unificada (anúncio → chat → pagamento)
 * ---------------------------------------------------------------------
 * Estética: iOS‑Liquid (glassmorphism + blobs) 
 * Foco: visão 360º por lead, costurando eventos de origem (ad/UTM), inbox, tarefas,
 * propostas e pagamentos (Asaas mock). Pronto pra plugar no Gateway.
 *
 * -> Troque MOCK=false para fetchar dados reais dos endpoints indicados.
 * Endpoints sugeridos:
 *  - GET  /api/luddy/leads?query=...            (lista de leads)
 *  - GET  /api/luddy/leads/:id/timeline         (linha do tempo unificada)
 *  - POST /api/payments/asaas/intent            (criar cobrança PIX/boleto/cartão)
 */

const MOCK = true;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Tipos
export type Lead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  value?: number; // em BRL
  stage?: string; // Prospect/Qualificação/Proposta/Fechamento
  tags?: string[];
  source?: { channel?: string; campaign?: string; adset?: string; creative?: string; utm?: Record<string, string> };
};

export type TimelineEvent = {
  id: string;
  at: string; // ISO
  type:
    | "ad.impression"
    | "ad.click"
    | "lp.view"
    | "thread.message"
    | "task.created"
    | "proposal.sent"
    | "proposal.accepted"
    | "meeting.scheduled"
    | "payment.intent"
    | "payment.confirmed"
    | "payment.failed";
  author?: string; // user/bot/canal
  channel?: string; // whatsapp|instagram|email|chat|meta|google|tiktok
  body?: string; // texto mensagem/nota
  meta?: Record<string, any>;
};

// ------------------------------
// Mock API
// ------------------------------
async function apiListLeads(query: string): Promise<Lead[]> {
  if (!MOCK) {
    const r = await fetch(`/api/luddy/leads?query=${encodeURIComponent(query)}`);
    return r.json();
  }
  await wait(180);
  const leads: Lead[] = [
    { id: "LD-3021", name: "Clínica Vitta", value: 1990, stage: "Qualificação", tags: ["clínica", "meta"], source: { channel: "Meta", campaign: "Lançamento Clínicas", adset: "SP-CPA", creative: "IMG-101" } },
    { id: "LD-3027", name: "HopeCann", value: 4970, stage: "Proposta", tags: ["cannabis", "google"], source: { channel: "Google", campaign: "Pesquisa Clínicas", adset: "BR-Exact", creative: "KW-CLINICA" } },
    { id: "LD-3042", name: "DX Infinite 8", value: 9900, stage: "Fechamento", tags: ["cursos", "tiktok"], source: { channel: "TikTok", campaign: "Top Funil Cursos", adset: "BR-TOF", creative: "VID-77" } },
  ];
  if (!query) return leads;
  const q = query.toLowerCase();
  return leads.filter((l) => [l.id, l.name, l.stage, ...(l.tags || [])].join(" ").toLowerCase().includes(q));
}

async function apiGetTimeline(leadId: string): Promise<{ lead: Lead; events: TimelineEvent[] }>{
  if (!MOCK) {
    const r = await fetch(`/api/luddy/leads/${leadId}/timeline`);
    return r.json();
  }
  await wait(200);
  const now = Date.now();
  const pick = (id: string): Lead =>
    ({
      "LD-3021": { id: "LD-3021", name: "Clínica Vitta", value: 1990, stage: "Qualificação", tags: ["clínica", "meta"] },
      "LD-3027": { id: "LD-3027", name: "HopeCann", value: 4970, stage: "Proposta", tags: ["cannabis", "google"] },
      "LD-3042": { id: "LD-3042", name: "DX Infinite 8", value: 9900, stage: "Fechamento", tags: ["cursos", "tiktok"] },
    } as Record<string, Lead>)[id] || { id, name: id };
  const events: TimelineEvent[] = [
    { id: "e1", at: iso(now - 1000 * 60 * 120), type: "ad.impression", channel: "Meta", meta: { campaign: "Lançamento Clínicas", adset: "SP-CPA", creative: "IMG-101" } },
    { id: "e2", at: iso(now - 1000 * 60 * 118), type: "ad.click", channel: "Meta", meta: { url: "https://lp.tridium.com/clinicas" } },
    { id: "e3", at: iso(now - 1000 * 60 * 116), type: "lp.view", meta: { lp: "/clinicas/consulta" } },
    { id: "e4", at: iso(now - 1000 * 60 * 90), type: "thread.message", channel: "whatsapp", author: "lead", body: "Oi, quero entender mais sobre agendamento." },
    { id: "e5", at: iso(now - 1000 * 60 * 88), type: "thread.message", channel: "whatsapp", author: "agent:Yohann", body: "Claro! Posso te mandar uma proposta e um link de agenda?" },
    { id: "e6", at: iso(now - 1000 * 60 * 70), type: "proposal.sent", author: "agent:Yohann", meta: { proposalId: "P-8831", value: 1990 } },
    { id: "e7", at: iso(now - 1000 * 60 * 62), type: "meeting.scheduled", meta: { when: iso(now + 1000 * 60 * 120), link: "https://meet.google.com/xyz-123" } },
    { id: "e8", at: iso(now - 1000 * 60 * 30), type: "payment.intent", meta: { provider: "asaas", method: "pix", amount: 1990 } },
    { id: "e9", at: iso(now - 1000 * 60 * 10), type: "payment.confirmed", meta: { provider: "asaas", invoiceUrl: "https://sandbox.asaas.com/invoice/mock_1990" } },
  ];
  return { lead: pick(leadId), events };
}

async function apiPaymentsIntent(body: { amount: number; method: "pix" | "boleto" | "card"; meta?: any }): Promise<{ intentId: string; invoiceUrl?: string }>{
  if (!MOCK) {
    const r = await fetch("/api/payments/asaas/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  }
  await wait(250);
  return { intentId: `mock_${Math.floor(body.amount * 100)}`, invoiceUrl: `https://sandbox.asaas.com/invoice/mock_${Math.floor(body.amount * 100)}` };
}

function iso(t: number) { return new Date(t).toISOString(); }

// ------------------------------
// Página principal
// ------------------------------
export default function LuddyCRM360() {
  const [q, setQ] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState<{ ad: boolean; chat: boolean; sys: boolean; pay: boolean }>({ ad: true, chat: true, sys: true, pay: true });

  useEffect(() => { loadLeads(); }, []);
  async function loadLeads() {
    setLoading(true);
    const rows = await apiListLeads(q);
    setLeads(rows);
    setSelected(rows[0] || null);
    setLoading(false);
  }

  useEffect(() => { if (selected) loadTimeline(selected.id); }, [selected?.id]);
  async function loadTimeline(leadId: string) {
    const { lead, events } = await apiGetTimeline(leadId);
    setSelected(lead); setEvents(events);
  }

  const kpis = useMemo(() => computeKpis(events), [events]);
  const filtered = useMemo(() => events.filter((e) => matchFilter(e, filters)), [events, filters]);

  async function createPix() {
    if (!selected) return;
    setSending(true);
    const amount = selected.value || 1990;
    const r = await apiPaymentsIntent({ amount, method: "pix", meta: { leadId: selected.id } });
    setSending(false);
    if (r.invoiceUrl) window.open(r.invoiceUrl, "_blank");
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(1200px_700px_at_-10%_-10%,#5b8cff33,transparent_60%),radial-gradient(1200px_700px_at_110%_10%,#ff78b633,transparent_60%),linear-gradient(180deg,#0a0b10,#0b0f1a)]">
      <LiquidBlobs />

      <div className="relative mx-auto max-w-[1400px] px-4 py-6 md:py-10 text-white">
        {/* Topbar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md"><Users className="h-5 w-5" /></div>
            <div>
              <div className="text-sm uppercase tracking-widest text-white/60">Tridium • Luddy</div>
              <div className="text-xl font-semibold">CRM 360 — Anúncio → Chat → Pagamento</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={createPix} disabled={!selected || sending} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-3 py-2 text-sm font-semibold text-[#0b0f1a] backdrop-blur-md hover:bg-white/30 disabled:opacity-60"><DollarSign className="h-4 w-4" /> Cobrança PIX</button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20"><FileText className="h-4 w-4" /> Nova proposta</button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20"><CalendarDays className="h-4 w-4" /> Agendar</button>
          </div>
        </div>

        {/* Layout 2 colunas */}
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Coluna esquerda: Leads */}
          <GlassPanel>
            <div className="mb-2 flex items-center justify-between text-white/80">
              <div className="inline-flex items-center gap-2"><Search className="h-4 w-4" /> Leads</div>
              <button onClick={loadLeads} className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20">Atualizar</button>
            </div>
            <div className="relative mb-2">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50"><Filter className="h-4 w-4" /></div>
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') loadLeads(); }} placeholder="Buscar por nome/etapa/tag" className="w-full rounded-2xl border border-white/15 bg-white/10 px-9 py-2 text-white placeholder-white/50 outline-none focus:border-white/25 focus:bg-white/15" />
            </div>
            <div className="h-[60vh] space-y-2 overflow-y-auto pr-1">
              {loading ? <Skeleton rows={6} /> : leads.map((l) => (
                <button key={l.id} onClick={() => setSelected(l)} className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${selected?.id === l.id ? "border-white/25 bg-white/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-center justify-between">
                    <div className="truncate text-white">{l.name}</div>
                    <div className="text-xs text-white/60">{l.stage || "—"}</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">{l.tags?.slice(0, 3).map((t) => <span key={t} className="mr-1 rounded border border-white/10 bg-white/10 px-1">{t}</span>)}</div>
                </button>
              ))}
              {!loading && leads.length === 0 && <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-white/60">Nada encontrado</div>}
            </div>
          </GlassPanel>

          {/* Coluna direita: Timeline + KPIs + Origens */}
          <div className="space-y-4">
            {/* KPIs do lead */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Etapa" value={selected?.stage || "—"} hint="Pipeline" icon={<Rocket className="h-4 w-4" />} />
              <KpiCard title="Ticket" value={selected?.value ? BRL(selected.value) : "—"} hint="Valor estimado" icon={<DollarSign className="h-4 w-4" />} />
              <KpiCard title="1º contato" value={kpis.firstContact} hint="Tempo até resposta" icon={<MessageCircle className="h-4 w-4" />} />
              <KpiCard title="Status pagamento" value={kpis.payStatus} hint="Último evento" icon={<Receipt className="h-4 w-4" />} />
            </div>

            {/* Origens e vínculos */}
            <GlassPanel>
              <div className="mb-2 flex items-center justify-between text-white/80">
                <div className="inline-flex items-center gap-2"><Megaphone className="h-4 w-4" /> Origem & vínculos</div>
                <span className="text-xs text-white/60">UTM/campanha/criativo</span>
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <InfoRow label="Canal" value={selected?.source?.channel || "—"} />
                <InfoRow label="Campanha" value={selected?.source?.campaign || "—"} />
                <InfoRow label="Conjunto" value={selected?.source?.adset || "—"} />
                <InfoRow label="Criativo" value={selected?.source?.creative || "—"} />
                <InfoRow label="UTM" value={formatUtm(selected?.source?.utm)} />
              </div>
            </GlassPanel>

            {/* Filtros timeline */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill active={filters.ad} onClick={() => setFilters({ ...filters, ad: !filters.ad })} label="Anúncios" />
              <FilterPill active={filters.chat} onClick={() => setFilters({ ...filters, chat: !filters.chat })} label="Chat" />
              <FilterPill active={filters.sys} onClick={() => setFilters({ ...filters, sys: !filters.sys })} label="Sistema" />
              <FilterPill active={filters.pay} onClick={() => setFilters({ ...filters, pay: !filters.pay })} label="Pagamentos" />
            </div>

            {/* Timeline */}
            <GlassPanel>
              <div className="mb-2 text-white/80">Linha do tempo</div>
              <div className="h-[56vh] overflow-y-auto pr-1">
                <ul className="relative ml-3 space-y-3 border-l border-white/10 pl-4">
                  {filtered.map((ev) => (
                    <li key={ev.id} className="relative">
                      <span className="absolute -left-[9px] top-1.5 inline-block h-3 w-3 rounded-full bg-white/30 ring-2 ring-white/10" />
                      <TimelineItem ev={ev} />
                    </li>
                  ))}
                  {filtered.length === 0 && <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-white/60">Sem eventos para os filtros selecionados</div>}
                </ul>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// Subcomponentes
// ------------------------------
function TimelineItem({ ev }: { ev: TimelineEvent }) {
  const time = new Date(ev.at).toLocaleString("pt-BR", { hour12: false });
  const line =
    ev.type === "ad.impression" ? (
      <Line icon={<Megaphone className="h-4 w-4" />} title="Impressão de anúncio" subtitle={`${ev.channel || "—"} • ${time}`} details={fmtMeta(ev.meta)} />
    ) : ev.type === "ad.click" ? (
      <Line icon={<MousePointerClick className="h-4 w-4" />} title="Clique no anúncio" subtitle={`${ev.channel || "—"} • ${time}`} details={fmtMeta(ev.meta)} />
    ) : ev.type === "lp.view" ? (
      <Line icon={<LinkIcon className="h-4 w-4" />} title="Visitou a Landing Page" subtitle={time} details={fmtMeta(ev.meta)} />
    ) : ev.type === "thread.message" ? (
      <ChatBubble who={ev.author || "lead"} channel={ev.channel} time={time} body={ev.body || ""} />
    ) : ev.type === "proposal.sent" ? (
      <Line icon={<FileText className="h-4 w-4" />} title="Proposta enviada" subtitle={time} details={`#${ev.meta?.proposalId} • ${BRL(ev.meta?.value || 0)}`} />
    ) : ev.type === "proposal.accepted" ? (
      <Line icon={<CheckCircle2 className="h-4 w-4" />} title="Proposta aceita" subtitle={time} />
    ) : ev.type === "meeting.scheduled" ? (
      <Line icon={<CalendarDays className="h-4 w-4" />} title="Reunião agendada" subtitle={time} details={`${new Date(ev.meta?.when).toLocaleString("pt-BR", { hour12: false })} • ${ev.meta?.link || ""}`} />
    ) : ev.type === "payment.intent" ? (
      <Line icon={<CreditCard className="h-4 w-4" />} title="Cobrança gerada" subtitle={time} details={`${String(ev.meta?.provider).toUpperCase()} • ${String(ev.meta?.method || "").toUpperCase()} • ${BRL(ev.meta?.amount || 0)}`} />
    ) : ev.type === "payment.confirmed" ? (
      <Line icon={<ShieldCheck className="h-4 w-4" />} title="Pagamento confirmado" subtitle={time} link={ev.meta?.invoiceUrl} linkLabel="Ver invoice" />
    ) : (
      <Line icon={<AlertTriangle className="h-4 w-4" />} title={ev.type} subtitle={time} />
    );
  return line;
}

function Line({ icon, title, subtitle, details, link, linkLabel }: { icon: React.ReactNode; title: string; subtitle?: string; details?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white/80">
      <div className="mb-1 inline-flex items-center gap-2 text-white/80">{icon} <span className="font-medium text-white">{title}</span></div>
      {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
      {details && <div className="mt-1 text-xs text-white/70">{details}</div>}
      {link && (
        <div className="mt-2 text-right">
          <a href={link} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[12px] hover:bg-white/20">
            {linkLabel || "abrir"} <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function ChatBubble({ who, channel, time, body }: { who: string; channel?: string; time: string; body: string }) {
  const mine = who?.startsWith("agent");
  return (
    <div className={`rounded-2xl border p-2 text-sm ${mine ? "border-white/15 bg-white/10" : "border-white/10 bg-white/5"}`}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <div className="inline-flex items-center gap-2 text-white/70"><MessageSquare className="h-3.5 w-3.5" /> {mine ? who.split(":")[1] || "Agente" : "Lead"} {channel && <span className="rounded border border-white/10 bg-white/10 px-1">{channel}</span>}</div>
        <div className="text-white/50">{time}</div>
      </div>
      <div className="whitespace-pre-wrap text-white/90">{body}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
      <div className="text-xs text-white/60">{label}</div>
      <div className="truncate text-white/80">{value || "—"}</div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border px-3 py-2 text-sm ${active ? "border-white/25 bg-white/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>{label}</button>
  );
}

function KpiCard({ icon, title, value, hint }: { icon: React.ReactNode; title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white/90 backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-white/80">{icon} {title}</div>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/60">{hint}</div>}
    </div>
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

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white/10" />
      ))}
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

// ------------------------------
// Helpers
// ------------------------------
function matchFilter(e: TimelineEvent, f: { ad: boolean; chat: boolean; sys: boolean; pay: boolean }) {
  if ((e.type.startsWith("ad.") || e.type === "lp.view") && !f.ad) return false;
  if (e.type === "thread.message" && !f.chat) return false;
  if (["task.created", "proposal.sent", "proposal.accepted", "meeting.scheduled"].includes(e.type) && !f.sys) return false;
  if (e.type.startsWith("payment.") && !f.pay) return false;
  return true;
}

function fmtMeta(m?: Record<string, any>) {
  if (!m) return "";
  const keys = Object.keys(m);
  if (!keys.length) return "";
  return keys.map((k) => `${k}: ${String(m[k])}`).join(" • ");
}

/**
 * Formata objeto UTM em string legível.
 * - Mantém ordem comum first: source, medium, campaign, content, term
 * - Oculta valores vazios e limita cada valor a 64 chars para não quebrar layout
 */
function formatUtm(utm?: Record<string, string>): string {
  if (!utm) return "—";
  const preferred = ["source", "medium", "campaign", "content", "term"] as const;
  const entries: [string, string][] = [];
  // adiciona preferidos na ordem
  preferred.forEach((k) => {
    const v = utm[k];
    if (v) entries.push([k, v]);
  });
  // adiciona quaisquer extras
  Object.keys(utm).forEach((k) => {
    if (!preferred.includes(k as any) && utm[k]) entries.push([k, utm[k]!]);
  });
  if (!entries.length) return "—";
  const safe = (s: string) => (s.length > 64 ? s.slice(0, 61) + "…" : s);
  return entries.map(([k, v]) => `${k}: ${safe(String(v))}`).join(" • ");
}

function computeKpis(evts: TimelineEvent[]) {
  const firstMsg = evts.find((e) => e.type === "thread.message" && (e.author || "").startsWith("agent"));
  const firstLead = evts.find((e) => e.type === "thread.message" && (e.author || "") === "lead");
  const firstContactMin = firstMsg && firstLead ? Math.max(0, (new Date(firstMsg.at).getTime() - new Date(firstLead.at).getTime()) / 60000) : null;
  const pay = (evts as any).findLast ? (evts as any).findLast((e: TimelineEvent) => e.type.startsWith("payment.")) : [...evts].reverse().find((e) => e.type.startsWith("payment."));
  const payStatus = pay ? (pay.type === "payment.confirmed" ? "Confirmado" : pay.type === "payment.intent" ? "Pendente" : "Falhou") : "—";
  return {
    firstContact: firstContactMin === null ? "—" : `${firstContactMin.toFixed(1)} min`,
    payStatus,
  } as const;
}

// ------------------------------
// Dev Tests (executados apenas no browser uma vez)
// ------------------------------
(function __TRIDIUM_DEV_TESTS__(){
  if (typeof window === 'undefined') return;
  const w: any = window as any;
  if (w.__TRIDIUM_TESTS_DONE__) return; // evita rodar 2x em HMR
  w.__TRIDIUM_TESTS_DONE__ = true;
  try {
    // Testes de formatUtm
    console.assert(formatUtm(undefined) === '—', 'formatUtm: vazio deve ser —');
    const s = formatUtm({ source:'google', medium:'cpc', campaign:'brand', extra:'x' });
    console.assert(s.includes('source: google') && s.includes('medium: cpc') && s.includes('campaign: brand') && s.includes('extra: x'), 'formatUtm: concatena e preserva extras');

    // Testes de computeKpis
    const now = Date.now();
    const evts: TimelineEvent[] = [
      { id:'1', at: new Date(now).toISOString(), type:'thread.message', author:'lead' },
      { id:'2', at: new Date(now+120000).toISOString(), type:'thread.message', author:'agent:Bot' },
      { id:'3', at: new Date(now+180000).toISOString(), type:'payment.intent' },
      { id:'4', at: new Date(now+240000).toISOString(), type:'payment.confirmed' },
    ];
    const k = computeKpis(evts);
    console.assert(k.firstContact !== '—' && k.payStatus === 'Confirmado', 'computeKpis: deveria calcular 1º contato e status pagamento');
  } catch(e) {
    console.warn('Dev tests falharam:', e);
  }
})();
