import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Megaphone, MessageCircle, Play, Info, ArrowRight, X, CreditCard } from "lucide-react";

export type RowItem = { title: string; subtitle: string; href: string; color: string };
export type Agent = {
  id: "clio" | "lucy" | "luddy";
  short: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  pitch: string;
  caption: string;
  primary: { label: string; href: string };
  shortcuts: { label: string; href: string; icon: React.ReactNode }[];
};

const AGENTS: Record<"clio" | "lucy" | "luddy", Agent> = {
  clio: {
    id: "clio",
    short: "Clio",
    title: "Clio — Criação",
    subtitle: "Creative Lab • Ad Library • LP Builder",
    color: "#6EA0FF",
    icon: <PenTool className="h-3.5 w-3.5" />,
    pitch: "Crie peças, páginas e públicos que disparam o CTR.",
    caption: "Creative Lab com variações, biblioteca de referências e LPs iOS‑like.",
    primary: { label: "Entrar no Creative Lab", href: "/clio/creative-lab" },
    shortcuts: [
      { label: "Creative Lab", href: "/clio/creative-lab", icon: <PenTool className="h-4 w-4" /> },
      { label: "Ad Library", href: "/clio/ad-library", icon: <Play className="h-4 w-4" /> },
      { label: "LP Builder", href: "/clio/lp-builder", icon: <ArrowRight className="h-4 w-4" /> },
    ],
  },
  lucy: {
    id: "lucy",
    short: "Lucy",
    title: "Lucy — Engajamento & Mídia",
    subtitle: "Campaign Studio • Inbox • Automations",
    color: "#FF8CB9",
    icon: <Megaphone className="h-3.5 w-3.5" />,
    pitch: "Orquestre canais e mantenha o funil sempre pulsando.",
    caption: "Campaign Studio multi‑canal + Inbox Omnicanal com SLA e prioridade.",
    primary: { label: "Entrar no Campaign Studio", href: "/lucy/campaign-studio" },
    shortcuts: [
      { label: "Campaign Studio", href: "/lucy/campaign-studio", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Inbox Omnicanal", href: "/lucy/inbox", icon: <MessageCircle className="h-4 w-4" /> },
      { label: "Sequências & Automations", href: "/lucy/automations", icon: <ArrowRight className="h-4 w-4" /> },
    ],
  },
  luddy: {
    id: "luddy",
    short: "Luddy",
    title: "Luddy — Conversão & CRM",
    subtitle: "CRM 360 • Checkout • Agenda",
    color: "#7BFFD1",
    icon: <CreditCard className="h-3.5 w-3.5" />,
    pitch: "Feche mais rápido com pipeline claro e checkout líquido.",
    caption: "Linha do tempo anúncio→chat→pagamento + PIX/Cartão (Asaas/Stripe).",
    primary: { label: "Entrar no CRM 360", href: "/luddy/crm" },
    shortcuts: [
      { label: "CRM 360", href: "/luddy/crm", icon: <MessageCircle className="h-4 w-4" /> },
      { label: "Checkout", href: "/luddy/checkout", icon: <CreditCard className="h-4 w-4" /> },
      { label: "Agenda", href: "/luddy/calendar", icon: <ArrowRight className="h-4 w-4" /> },
    ],
  },
};

const DATA: Record<"clio" | "lucy" | "luddy", RowItem[]> = {
  clio: [
    { title: "Brief de campanha", subtitle: "Segmento/Oferta/Ângulos", href: "/clio/creative-lab", color: AGENTS.clio.color },
    { title: "LP iOS‑like", subtitle: "Componentes prontos", href: "/clio/lp-builder", color: AGENTS.clio.color },
    { title: "Biblioteca de criativos", subtitle: "Top desempenho", href: "/clio/ad-library", color: AGENTS.clio.color },
    { title: "Audience Builder", subtitle: "Lookalike/Remarketing", href: "/clio/audiences", color: AGENTS.clio.color },
    { title: "Atribuição", subtitle: "Multi‑touch/Paths", href: "/clio/attribution", color: AGENTS.clio.color },
  ],
  lucy: [
    { title: "Campaign Studio", subtitle: "Meta/Google/TikTok/LinkedIn", href: "/lucy/campaign-studio", color: AGENTS.lucy.color },
    { title: "Inbox hoje", subtitle: "Prioridade/SLA", href: "/lucy/inbox", color: AGENTS.lucy.color },
    { title: "Automations", subtitle: "Nutrição/Reativação", href: "/lucy/automations", color: AGENTS.lucy.color },
    { title: "Knowledge/RAG", subtitle: "Ofertas/FAQ", href: "/lucy/knowledge", color: AGENTS.lucy.color },
    { title: "Reputação", subtitle: "Avaliações/Provas", href: "/lucy/reputation", color: AGENTS.lucy.color },
  ],
  luddy: [
    { title: "CRM 360", subtitle: "Linha do tempo unificada", href: "/luddy/crm", color: AGENTS.luddy.color },
    { title: "Checkout", subtitle: "PIX/Cartão/Assinaturas", href: "/luddy/checkout", color: AGENTS.luddy.color },
    { title: "Agenda", subtitle: "Anti‑no‑show", href: "/luddy/calendar", color: AGENTS.luddy.color },
    { title: "Propostas", subtitle: "Assinatura/Validade", href: "/luddy/proposals", color: AGENTS.luddy.color },
    { title: "Relatórios de Vendas", subtitle: "Conversão por origem", href: "/luddy/sales-reports", color: AGENTS.luddy.color },
  ],
};

function posterBg(color: string) {
  return `radial-gradient(60% 60% at 10% 0%, ${color}26, transparent 60%),radial-gradient(60% 60% at 100% 100%, ${color}1f, transparent 60%),linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`;
}
function heroBg(color: string) {
  return `radial-gradient(70% 70% at 20% 0%, ${color}2e, transparent 60%),radial-gradient(70% 70% at 100% 60%, ${color}24, transparent 60%),linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`;
}

function Row({ title, items, onSelect }: { title: string; items: RowItem[]; onSelect: (it: RowItem) => void }) {
  return (
    <section className="mb-6">
      <div className="mb-2 text-sm font-medium text-white/90">{title}</div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
        {items.map((it, i) => (
          <Poster key={i} it={it} onSelect={() => onSelect(it)} />
        ))}
      </div>
    </section>
  );
}

function Poster({ it, onSelect }: { it: RowItem; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className="group relative h-40 w-72 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left outline-none transition-transform hover:-translate-y-0.5">
      <div className="absolute inset-0" style={{ background: posterBg(it.color) }} />
      <div className="absolute inset-0 flex items-end p-3">
        <div>
          <div className="text-sm font-medium text-white/90">{it.title}</div>
          <div className="text-xs text-white/70">{it.subtitle}</div>
        </div>
      </div>
      <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80 backdrop-blur-md">
        <Play className="h-4 w-4" /> Ver
      </div>
    </button>
  );
}

function SectionBanner({ agent, onDetails }: { agent: Agent; onDetails: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl">
      <div className="absolute inset-0" style={{ background: heroBg(agent.color) }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
      <div className="relative z-10 grid gap-3 p-4 md:grid-cols-3 md:p-6">
        <div className="md:col-span-2">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
            {agent.icon}
            <span>{agent.title}</span>
          </div>
          <div className="mt-2 text-xl font-semibold">{agent.pitch}</div>
          <div className="text-white/70">{agent.caption}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={agent.primary.href} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-4 py-2 font-semibold text-[#0b0f1a] hover:bg-white/30">
              Entrar <Play className="h-4 w-4" />
            </a>
            <button onClick={onDetails} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-white/90 hover:bg-white/20">
              Ver sessões <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {agent && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <div className="relative h-56 w-full md:h-72" style={{ background: heroBg(agent.color) }}>
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
                {agent.icon}
                <span>{agent.title}</span>
              </div>
              <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-2 text-white/80 backdrop-blur-md hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-xl font-semibold">{agent.pitch}</div>
                <div className="text-white/70">{agent.caption}</div>
              </div>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="text-sm uppercase tracking-widest text-white/60">Sessões</div>
                <div className="mt-2 grid gap-2">
                  {agent.shortcuts.map((s) => (
                    <a key={s.href} href={s.href} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                      <div className="inline-flex items-center gap-2 text-white/90">
                        {s.icon}
                        <div className="text-sm">{s.label}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/60 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm uppercase tracking-widest text-white/60">Ações</div>
                <div className="mt-2 grid gap-2">
                  <a href={agent.primary.href} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-4 py-2 font-semibold text-[#0b0f1a] hover:bg-white/30">
                    Entrar em {agent.short} <Play className="h-4 w-4" />
                  </a>
                  <a href="/lucy/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-white/90 hover:bg-white/20">
                    Ver Dashboard <Info className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TopNavTransparent() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-40">
      <div
        className={`pointer-events-auto mx-auto mt-3 flex max-w-[1200px] items-center justify-between px-4 py-2 transition-all`}
        style={{
          background: scrolled ? "rgba(255,255,255,0.10)" : "transparent",
          borderColor: scrolled ? "rgba(255,255,255,0.18)" : "transparent",
          boxShadow: scrolled ? "0 18px 60px -28px rgba(0,0,0,0.35)" : "none",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderWidth: scrolled ? 1 : 0,
          borderRadius: scrolled ? 16 : 0,
        }}
      >
        <div className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md" />
          <span className="text-sm font-semibold tracking-wider text-white/90">Tridium</span>
        </div>
        <nav className="hidden items-center gap-3 text-sm text-white/80 md:flex">
          <a href="#rows" className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/20">Agentes</a>
          <a href="/lucy/dashboard" className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/20">Dashboard</a>
          <a href="/kankan/crm" className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/20">Kankan CRM</a>
          <a href="/integrations" className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/20">Integrações</a>
        </nav>
      </div>
    </header>
  );
}

function DarkLiquidBackground() {
  return (
    <>
      <motion.div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#6ea0ff] opacity-20 blur-3xl" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }} />
      <motion.div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-[#ff8cb9] opacity-20 blur-3xl" animate={{ y: [0, 30, 0], x: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }} />
      <motion.div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7bffd1] opacity-[0.12] blur-[100px]" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a0b10,#0b0f1a)]" />
    </>
  );
}

export default function Session3D1Netflix() {
  const [open, setOpen] = React.useState<Agent | null>(null);
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden text-white">
      <DarkLiquidBackground />
      <TopNavTransparent />

      <section className="relative h-[70vh] w-full">
        <div className="absolute inset-0 h-full w-full bg-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_-10%_-10%,#5b8cff33,transparent_60%),radial-gradient(1200px_700px_at_110%_10%,#ff78b633,transparent_60%),linear-gradient(180deg,rgba(0,0,0,0.30),rgba(0,0,0,0.55)_45%,rgba(0,0,0,0.80))]" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-end gap-3 px-4 pb-10">
          <h1 className="max-w-[20ch] text-4xl font-semibold md:text-6xl">Escolha seu Agente e decole</h1>
          <p className="max-w-[60ch] text-white/80">
            <span className="font-semibold">Clio</span> cria. <span className="font-semibold">Lucy</span> engaja. <span className="font-semibold">Luddy</span> converte.
            Seu cockpit unificado, com métricas e atalhos prontos.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <a href="#rows" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-5 py-2 font-semibold text-[#0b0f1a] hover:bg-white/30">
              Escolher Agente <Play className="h-4 w-4" />
            </a>
            <a href="/lucy/dashboard" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-2 text-white/90 hover:bg-white/20">
              Ir para Dashboard <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <main id="rows" className="relative z-10 mx-auto max-w-[1200px] space-y-8 px-4 py-8 md:py-10">
        <SectionBanner agent={AGENTS.clio} onDetails={() => setOpen(AGENTS.clio)} />
        <Row title="Clio — Criativos e LPs" items={DATA.clio} onSelect={() => setOpen(AGENTS.clio)} />

        <SectionBanner agent={AGENTS.lucy} onDetails={() => setOpen(AGENTS.lucy)} />
        <Row title="Lucy — Campanhas e Inbox" items={DATA.lucy} onSelect={() => setOpen(AGENTS.lucy)} />

        <SectionBanner agent={AGENTS.luddy} onDetails={() => setOpen(AGENTS.luddy)} />
        <Row title="Luddy — CRM & Checkout" items={DATA.luddy} onSelect={() => setOpen(AGENTS.luddy)} />
      </main>

      <AgentModal agent={open} onClose={() => setOpen(null)} />

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
