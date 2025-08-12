import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KanbanSquare,
  Search,
  Plus,
  ChevronRight,
  BadgeDollarSign,
  Phone,
  Mail,
  Send,
  X,
  Edit,
  FileText,
  MoveRight,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

/**
 * Kankan CRM — iOS‑Liquid (Glassmorphism)
 * -------------------------------------------------
 * Objetivo
 *  - Visualizar o CRM do módulo Kankan alinhado ao esqueleto Tridium
 *  - Pipeline Kanban + Contatos + Drawer de Lead (atividade e cobrança)
 *  - Ações rápidas (mover etapas, faturar via Asaas mock), fundo líquido
 *  - Contrato de API compatível com Gateway (/api/payments/asaas/intent)
 *
 * Como usar
 *  - Este componente é auto-suficiente e mocka dados localmente (MOCK_MODE)
 *  - Para plugar no backend, altere MOCK_MODE=false e implemente os apiXXX
 */

const MOCK_MODE = true;

type Stage = { id: string; name: string; wipLimit?: number };
type Lead = {
  id: string;
  name: string;
  company?: string;
  value: number; // centavos BRL
  stageId: string;
  owner?: string;
  phone?: string;
  email?: string;
  score?: number; // 0-100
  tags?: string[];
  source?: string;
};

type Activity = {
  id: string;
  leadId: string;
  type: "note" | "call" | "email" | "whatsapp" | "status";
  body: string;
  at: string; // ISO
  author: string;
};

// -----------------------------
// Dados iniciais (MOCK)
// -----------------------------
const STAGES: Stage[] = [
  { id: "s1", name: "Prospect" },
  { id: "s2", name: "Qualificação" },
  { id: "s3", name: "Proposta" },
  { id: "s4", name: "Fechamento" },
  { id: "won", name: "Ganho" },
  { id: "lost", name: "Perdido" },
];

const SEED_LEADS: Lead[] = [
  { id: "L-1001", name: "Clínica Vitta", company: "Vitta Group", value: 497000, stageId: "s2", owner: "Yohann", phone: "+55 11 99999-9999", email: "contato@vitta.com", score: 82, tags: ["PIX", "Demo"], source: "Meta" },
  { id: "L-1002", name: "SandGreen", company: "SandGreen", value: 189900, stageId: "s1", owner: "Luddy", phone: "+55 21 98888-8888", email: "hello@sandgreen.com", score: 64, tags: ["Agendamento", "SaaS"], source: "Google" },
  { id: "L-1003", name: "HopeCann", company: "HopeCann", value: 990000, stageId: "s3", owner: "Clio", phone: "+55 31 97777-7777", email: "contact@hopecann.com", score: 90, tags: ["Enterprise"], source: "Indicação" },
  { id: "L-1004", name: "DX Infinite 8", company: "DXI8", value: 299900, stageId: "s4", owner: "Yohann", phone: "+55 19 96666-6666", email: "team@dxi8.com", score: 76, tags: ["Consultoria"], source: "Instagram" },
];

let ACTS: Activity[] = [
  { id: "A-1", leadId: "L-1003", type: "note", body: "Enviada proposta v2 com escopo de automações.", at: new Date().toISOString(), author: "Luddy" },
  { id: "A-2", leadId: "L-1001", type: "call", body: "Discovery call de 30 min.", at: new Date().toISOString(), author: "Yohann" },
];

// -----------------------------
// Helpers
// -----------------------------
const BRL = (v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// -----------------------------
// API (mockável)
// -----------------------------
async function apiGet<T>(path: string): Promise<T> {
  if (MOCK_MODE) {
    await wait(250);
    if (path.startsWith("/api/crm/stages")) return STAGES as any;
    if (path.startsWith("/api/crm/leads")) return SEED_LEADS as any;
    if (path.startsWith("/api/crm/activities")) {
      const leadId = new URLSearchParams(path.split("?")[1]).get("leadId");
      return ACTS.filter((a) => a.leadId === leadId) as any;
    }
    return [] as any;
  }
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  if (MOCK_MODE) {
    await wait(250);
    if (path === "/api/crm/leads") {
      const id = `L-${Math.floor(Math.random() * 99999)}`;
      SEED_LEADS.unshift({ id, stageId: body.stageId || "s1", value: body.value || 0, name: body.name, company: body.company, owner: body.owner, email: body.email, phone: body.phone, score: 50, tags: body.tags || [] });
      return { id } as any;
    }
    if (path === "/api/crm/activities") {
      const id = `A-${Math.floor(Math.random() * 99999)}`;
      const act: Activity = { id, leadId: body.leadId, type: body.type, body: body.body, at: new Date().toISOString(), author: body.author || "System" };
      ACTS.unshift(act);
      return { id } as any;
    }
    if (path === "/api/payments/asaas/intent") {
      return { intentId: `mock_${body.amount}`, invoiceUrl: `https://sandbox.asaas.com/invoice/mock_${body.amount}` } as any;
    }
    return { ok: true } as any;
  }
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPatch<T>(path: string, body: any): Promise<T> {
  if (MOCK_MODE) {
    await wait(200);
    if (path.startsWith("/api/crm/leads/")) {
      const id = path.split("/").pop();
      const i = SEED_LEADS.findIndex((x) => x.id === id);
      if (i >= 0) SEED_LEADS[i] = { ...SEED_LEADS[i], ...body };
      if (body.stageId) ACTS.unshift({ id: `A-${Math.random()}`, leadId: id!, type: "status", body: `Moveu para ${body.stageName || body.stageId}`, at: new Date().toISOString(), author: body.author || "System" });
      return { ok: true } as any;
    }
    return { ok: true } as any;
  }
  const res = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// -----------------------------
// Componente principal
// -----------------------------
export default function KankanCRM() {
  const [view, setView] = useState<"pipeline" | "contacts" | "reports">("pipeline");
  const [stages] = useState<Stage[]>(STAGES);
  const [leads, setLeads] = useState<Lead[]>(SEED_LEADS);
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; lead?: Lead | null }>({ open: false });
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => [l.name, l.company, l.email, l.phone, l.source].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [query, leads]);

  function openLead(lead: Lead) { setDrawer({ open: true, lead }); }
  function closeDrawer() { setDrawer({ open: false, lead: null }); }

  async function moveLead(leadId: string, toStageId: string) {
    const stage = stages.find((s) => s.id === toStageId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stageId: toStageId } : l)));
    await apiPatch(`/api/crm/leads/${leadId}`, { stageId: toStageId, stageName: stage?.name, author: "Kankan" });
    setToast({ ok: true, msg: `Movido para ${stage?.name}` });
    setTimeout(() => setToast(null), 1800);
  }

  async function quickAddLead() {
    const name = prompt("Nome do lead?");
    if (!name) return;
    const res = await apiPost<{ id: string }>("/api/crm/leads", { name, stageId: "s1" });
    const lead: Lead = { id: res.id, name, stageId: "s1", value: 0 };
    setLeads((prev) => [lead, ...prev]);
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(1200px_700px_at_-10%_-10%,#5b8cff33,transparent_60%),radial-gradient(1200px_700px_at_110%_10%,#ff78b633,transparent_60%),linear-gradient(180deg,#0a0b10,#0b0f1a)]">
      <LiquidBlobs />

      <div className="relative mx-auto max-w-[1400px] px-4 py-6 md:py-10">
        {/* Topbar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/90">
            <div className="h-9 w-9 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md flex items-center justify-center">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm tracking-widest uppercase text-white/60">Tridium • Kankan</div>
              <div className="text-xl font-semibold">CRM — iOS Liquid</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50"><Search className="w-4 h-4" /></div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar lead, empresa, origem..." className="w-[260px] rounded-2xl border border-white/15 bg-white/10 px-9 py-2 text-white placeholder-white/50 outline-none focus:border-white/25 focus:bg-white/15" />
            </div>
            <button onClick={quickAddLead} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-3 py-2 text-sm text-[#0b0f1a] font-semibold backdrop-blur-md hover:bg-white/30">
              <Plus className="w-4 h-4" /> Novo lead
            </button>
          </div>
        </div>

        {/* Navbar */}
        <div className="mb-6 flex gap-2">
          <NavPill active={view === "pipeline"} onClick={() => setView("pipeline")} icon={<KanbanSquare className="w-4 h-4" />} label="Pipeline" />
          <NavPill active={view === "contacts"} onClick={() => setView("contacts")} icon={<ClipboardList className="w-4 h-4" />} label="Contatos" />
          <NavPill active={view === "reports"} onClick={() => setView("reports")} icon={<FileText className="w-4 h-4" />} label="Relatórios" />
        </div>

        {view === "pipeline" && <PipelineBoard stages={stages} leads={filtered} onOpen={openLead} onMove={moveLead} />}
        {view === "contacts" && <ContactsTable leads={filtered} onOpen={openLead} />}
        {view === "reports" && <ReportsMock leads={filtered} />}
      </div>

      <LeadDrawer open={drawer.open} lead={drawer.lead || undefined} onClose={closeDrawer} onMove={moveLead} />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 border backdrop-blur-xl ${toast.ok ? "bg-emerald-400/15 border-emerald-400/30 text-emerald-100" : "bg-rose-400/15 border-rose-400/30 text-rose-100"}`}>
            {toast.ok ? <CheckCircle2 className="inline w-4 h-4 mr-2" /> : <AlertCircle className="inline w-4 h-4 mr-2" />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -----------------------------
// Subcomponentes
// -----------------------------
function NavPill({ active, onClick, icon, label, disabled }: { active?: boolean; onClick?: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick} className={`group relative inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all ${active ? "border-white/25 bg-white/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="navpill" className="absolute inset-0 -z-10 rounded-2xl" />}
    </button>
  );
}

function PipelineBoard({ stages, leads, onOpen, onMove }: { stages: Stage[]; leads: Lead[]; onOpen: (l: Lead) => void; onMove: (id: string, toStageId: string) => void; }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {stages.map((stage) => (
        <StageColumn key={stage.id} stage={stage} leads={leads.filter((l) => l.stageId === stage.id)} onOpen={onOpen} onMove={onMove} />
      ))}
    </div>
  );
}

function StageColumn({ stage, leads, onOpen, onMove }: { stage: Stage; leads: Lead[]; onOpen: (l: Lead) => void; onMove: (id: string, toStageId: string) => void; }) {
  const ref = useRef<HTMLDivElement>(null);

  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/id");
    if (id) onMove(id, stage.id);
    ref.current?.classList.remove("ring-emerald-400/40");
  }
  function onDragEnter() { ref.current?.classList.add("ring-emerald-400/40"); }
  function onDragLeave() { ref.current?.classList.remove("ring-emerald-400/40"); }

  const total = leads.reduce((acc, l) => acc + l.value, 0);

  return (
    <div ref={ref} onDragOver={onDragOver} onDrop={onDrop} onDragEnter={onDragEnter} onDragLeave={onDragLeave} className="relative h-[72vh] rounded-3xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 [mask:linear-gradient(#fff,transparent_30%)]" />
      <div className="mb-2 flex items-center justify-between text-white/80">
        <div className="font-semibold">{stage.name}</div>
        <div className="text-xs text-white/60">{leads.length} • {BRL(total)}</div>
      </div>
      <div className="scrollbar-thin h-[calc(72vh-42px)] space-y-2 overflow-y-auto pr-1">
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} onOpen={() => onOpen(l)} />
        ))}
        {leads.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-white/20 p-4 text-center text-white/50">Solte leads aqui</div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  return (
    <motion.div layout className="group select-none rounded-2xl border border-white/15 bg-white/10 text-white/90 backdrop-blur-xl hover:bg-white/15">
      <div
        className="cursor-grab p-3"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/id", lead.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDoubleClick={onOpen}
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="font-medium">{lead.name}</div>
          <div className="text-xs text-white/60">{lead.company}</div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="text-white/70">{lead.owner || "—"} • {lead.source || "—"}</div>
          <div className="inline-flex items-center gap-1 text-white">
            <BadgeDollarSign className="w-4 h-4" /> {BRL(lead.value)}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-white/60">
          <div>Score {lead.score ?? 0}</div>
          <button onClick={onOpen} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/20">Ver <ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </motion.div>
  );
}

function ContactsTable({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  return (
    <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 [mask:linear-gradient(#fff,transparent_30%)]" />
      <table className="w-full text-left text-sm text-white/85">
        <thead className="text-white/60">
          <tr>
            <th className="py-2">Nome</th>
            <th className="py-2">Empresa</th>
            <th className="py-2">Origem</th>
            <th className="py-2">E-mail</th>
            <th className="py-2">Telefone</th>
            <th className="py-2">Valor</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-white/10">
              <td className="py-2">{l.name}</td>
              <td className="py-2 text-white/70">{l.company}</td>
              <td className="py-2 text-white/70">{l.source}</td>
              <td className="py-2 text-white/70">{l.email}</td>
              <td className="py-2 text-white/70">{l.phone}</td>
              <td className="py-2">{BRL(l.value)}</td>
              <td className="py-2 text-right"><button onClick={() => onOpen(l)} className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Ver</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportsMock({ leads }: { leads: Lead[] }) {
  const byStage = useMemo(() => {
    const m = new Map<string, number>();
    leads.forEach((l) => m.set(l.stageId, (m.get(l.stageId) || 0) + 1));
    return m;
  }, [leads]);
  return (
    <div className="grid gap-4 md:grid-cols-3 text-white/80">
      {["s1","s2","s3","s4","won","lost"].map((k) => (
        <div key={k} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
          <div className="text-xs text-white/60">{STAGES.find(s=>s.id===k)?.name}</div>
          <div className="mt-1 text-2xl font-semibold">{byStage.get(k) || 0} leads</div>
        </div>
      ))}
    </div>
  );
}

function LeadDrawer({ open, lead, onClose, onMove }: { open: boolean; lead?: Lead; onClose: () => void; onMove: (id: string, toStageId: string) => void; }) {
  const [tab, setTab] = useState<"overview" | "activity" | "payments">("overview");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!lead) return null;
  const l = lead as Lead;

  async function addActivity(type: Activity["type"]) {
    if (!note.trim()) return;
    setBusy(true);
    await apiPost("/api/crm/activities", { leadId: l.id, type, body: note, author: "Kankan" });
    setNote("");
    setBusy(false);
  }

  async function createInvoice(method: "pix" | "boleto" | "card") {
    setBusy(true);
    const r = await apiPost<{ intentId: string; invoiceUrl?: string }>("/api/payments/asaas/intent", { amount: l.value / 100, method });
    setBusy(false);
    if (r?.invoiceUrl) window.open(r.invoiceUrl, "_blank");
  }

  async function quickStage(to: string, label: string) {
    await apiPatch(`/api/crm/leads/${l.id}`, { stageId: to, stageName: label, author: "Kankan" });
    onMove(l.id, to);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: "spring", stiffness: 260, damping: 30 }} className="fixed right-0 top-0 z-50 h-full w-[420px] border-l border-white/15 bg-white/10 backdrop-blur-2xl p-4 text-white">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/60">Lead</div>
              <div className="text-lg font-semibold">{lead.name}</div>
              <div className="text-xs text-white/60">{lead.company} • {BRL(lead.value)}</div>
            </div>
            <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/10 p-2 hover:bg-white/20"><X className="w-4 h-4" /></button>
          </div>

          {/* Quick actions */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <QuickAction onClick={() => quickStage("s2", "Qualificação")} label="Qualificar" icon={<MoveRight className="w-4 h-4" />} />
            <QuickAction onClick={() => quickStage("s3", "Proposta")} label="Proposta" icon={<FileText className="w-4 h-4" />} />
            <QuickAction onClick={() => setTab("payments")} label="Faturar" icon={<BadgeDollarSign className="w-4 h-4" />} />
          </div>

          {/* Tabs */}
          <div className="mb-3 inline-flex rounded-2xl border border-white/15 bg-white/10 p-1 text-xs">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>Visão</TabBtn>
            <TabBtn active={tab === "activity"} onClick={() => setTab("activity")}>Atividade</TabBtn>
            <TabBtn active={tab === "payments"} onClick={() => setTab("payments")}>Cobranças</TabBtn>
          </div>

          {tab === "overview" && (
            <div className="space-y-2 text-sm text-white/80">
              <InfoRow k="Responsável" v={lead.owner || "—"} />
              <InfoRow k="E-mail" v={lead.email || "—"} />
              <InfoRow k="Telefone" v={lead.phone || "—"} />
              <InfoRow k="Score" v={(lead.score ?? 0).toString()} />
              <InfoRow k="Origem" v={lead.source || "—"} />
              <InfoRow k="Tags" v={(lead.tags || []).join(", ") || "—"} />
            </div>
          )}

          {tab === "activity" && (
            <ActivityFeed leadId={lead.id} />
          )}

          {tab === "payments" && (
            <div className="space-y-2">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-sm text-white/80">
                <div className="mb-2 text-white/90">Criar cobrança (Asaas)</div>
                <div className="grid grid-cols-3 gap-2">
                  <SmallBtn onClick={() => createInvoice("pix")} icon={<BadgeDollarSign className="w-3 h-3" />} label="PIX" />
                  <SmallBtn onClick={() => createInvoice("boleto")} icon={<BadgeDollarSign className="w-3 h-3" />} label="Boleto" />
                  <SmallBtn onClick={() => createInvoice("card")} icon={<BadgeDollarSign className="w-3 h-3" />} label="Cartão" />
                </div>
                <div className="mt-2 text-xs text-white/60">* Em modo mock abre invoice sandbox.</div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-xs text-white/70">
                <div className="mb-1 font-medium text-white/80">Regras anti-no-show</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Lembrete 24h/2h antes <span className="opacity-60">(Lucy/Automations)</span></li>
                  <li>Confirmação automática por WhatsApp</li>
                  <li>Calendário integrado (Google/Meet)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-2">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Adicionar nota / registrar call / mensagem..." className="h-20 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/20 focus:bg-white/10" />
            <div className="mt-2 flex items-center justify-end gap-2">
              <SmallBtn onClick={() => addActivity("note")} disabled={!note || busy} icon={<Edit className="w-3 h-3" />} label="Nota" />
              <SmallBtn onClick={() => addActivity("call")} disabled={!note || busy} icon={<Phone className="w-3 h-3" />} label="Call" />
              <SmallBtn onClick={() => addActivity("email")} disabled={!note || busy} icon={<Mail className="w-3 h-3" />} label="E-mail" />
              <SmallBtn onClick={() => addActivity("whatsapp")} disabled={!note || busy} icon={<Send className="w-3 h-3" />} label="Whats" />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ActivityFeed({ leadId }: { leadId: string }) {
  const [items, setItems] = useState<Activity[] | null>(null);
  useEffect(() => { (async () => { const r = await apiGet<Activity[]>(`/api/crm/activities?leadId=${leadId}`); setItems(r); })(); }, [leadId]);
  if (!items) return <div className="text-white/60">Carregando...</div>;
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-white/50">Sem atividades ainda.</div>}
      {items.map((a) => (
        <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white/85">
          <div className="mb-1 text-xs text-white/60">{a.type.toUpperCase()} • {fmt(a.at)} • {a.author}</div>
          <div>{a.body}</div>
        </div>
      ))}
    </div>
  );
}

function QuickAction({ onClick, label, icon }: { onClick?: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/20">
      {icon} {label}
    </button>
  );
}

function TabBtn({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-xl px-3 py-1 ${active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"}`}>{children}</button>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-white/60">{k}</div>
      <div className="text-white/90">{v}</div>
    </div>
  );
}

function SmallBtn({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button disabled={disabled} onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/20 disabled:opacity-50">
      {icon} {label}
    </button>
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
