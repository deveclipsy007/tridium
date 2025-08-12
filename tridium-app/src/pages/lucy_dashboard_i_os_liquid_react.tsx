import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  Zap,
  MessageCircleMore,
  Rocket,
  TrendingUp,
  Inbox,
  Clock,
  Percent,
  Star,
  BarChart2,
  Settings2,
  Megaphone,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

/**
 * Lucy Dashboard — iOS‑Liquid
 * -------------------------------------------------
 * KPIs (Lucy): resposta em 1º contato, % leads reativados, taxa de avanço de etapa, NPS/reviews
 * Extras: tempo médio de 1ª resposta, SLAs, performance por canal, campanhas, automations
 * Estética: glassmorphism + fundo líquido
 * Mock de dados: pronto pra visualizar. Troque MOCK=false e faça fetch real se quiser.
 */

const MOCK = true;

// Util
const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Mock data loader
async function loadData(range: string) {
  if (!MOCK) return { } as any;
  await wait(200);
  const seed = range === "7d" ? 1 : range === "30d" ? 2 : range === "90d" ? 3 : 0.7;
  return {
    kpis: {
      firstContactResp: 0.81 - 0.02 * seed, // resposta em 1º contato
      reactivated: 0.23 + 0.01 * seed,
      stageAdvance: 0.39 + 0.005 * seed,
      nps: 62 + 2 * seed,
      avgFirstRespMin: 4.2 - 0.2 * seed,
      slaBreaches: Math.max(0, 5 - seed),
    },
    channels: [
      { name: "Meta", spend: 4200 * seed, leads: Math.round(230 * seed), cpl: 18 / seed, ctr: 0.031 + 0.001 * seed, cpm: 12.9, conv: 0.11 + 0.01 * seed, roi: 2.4 + 0.1 * seed },
      { name: "Google", spend: 3800 * seed, leads: Math.round(210 * seed), cpl: 20 / seed, ctr: 0.026 + 0.001 * seed, cpm: 14.1, conv: 0.09 + 0.008 * seed, roi: 1.8 + 0.06 * seed },
    ],
    inbox: [
      { channel: "WhatsApp", open: 14, avgWait: "2m", sla: 0.96 },
      { channel: "Instagram DM", open: 8, avgWait: "4m", sla: 0.92 },
      { channel: "E‑mail", open: 5, avgWait: "12m", sla: 0.88 },
      { channel: "Chat do site", open: 2, avgWait: "1m", sla: 0.98 },
    ],
    campaigns: [
      { name: "Lançamento — Clínicas", channel: "Meta", cpm: 12.3, ctr: 0.032, cpl: 16.9, conv: 0.12 },
      { name: "Pesquisa — Cursos", channel: "Google", cpm: 14.8, ctr: 0.027, cpl: 21.4, conv: 0.09 },
      { name: "Retarget — Estética", channel: "Meta", cpm: 10.9, ctr: 0.041, cpl: 12.7, conv: 0.15 },
    ],
    flows: [
      { name: "Nutrição 7d", sent: 1250, open: 0.56, click: 0.18, conv: 0.07 },
      { name: "Reativação 14d", sent: 640, open: 0.48, click: 0.14, conv: 0.05 },
      { name: "Abandono de carrinho", sent: 310, open: 0.61, click: 0.22, conv: 0.11 },
    ],
    reputation: { rating: 4.6, reviews: 312, delta: +12 },
  };
}

export default function LucyDashboard() {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "90d">("7d");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const d = await loadData(range);
      setData(d);
      setLoading(false);
    })();
  }, [range]);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(1200px_700px_at_-10%_-10%,#5b8cff33,transparent_60%),radial-gradient(1200px_700px_at_110%_10%,#ff78b633,transparent_60%),linear-gradient(180deg,#0a0b10,#0b0f1a)]">
      <LiquidBlobs />

      <div className="relative mx-auto max-w-[1400px] px-4 py-6 md:py-10">
        {/* Topbar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-widest text-white/60">Tridium • Lucy</div>
              <div className="text-xl font-semibold">Dashboard — Engajamento & Mídia</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RangePill label="Hoje" active={range === "today"} onClick={() => setRange("today")} />
            <RangePill label="7d" active={range === "7d"} onClick={() => setRange("7d")} />
            <RangePill label="30d" active={range === "30d"} onClick={() => setRange("30d")} />
            <RangePill label="90d" active={range === "90d"} onClick={() => setRange("90d")} />
            <button className="ml-2 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-3 py-2 text-sm font-semibold text-[#0b0f1a] backdrop-blur-md hover:bg-white/30">
              <Megaphone className="h-4 w-4" /> Nova campanha
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
              <Settings2 className="h-4 w-4" /> Regras
            </button>
          </div>
        </div>

        {/* KPIs principais */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={<MessageSquare className="h-4 w-4" />} title="Resp. 1º contato" value={loading ? "—" : pct(data.kpis.firstContactResp)} hint="% dos 1ºs contatos respondidos até 5min" trend="+3%" />
          <KpiCard icon={<Zap className="h-4 w-4" />} title="Leads reativados" value={loading ? "—" : pct(data.kpis.reactivated)} hint="% reengajados nos últimos envios" trend="+1%" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} title="Avanço de etapa" value={loading ? "—" : pct(data.kpis.stageAdvance)} hint="% que avançaram no pipeline (Lucy→Luddy)" trend="+2%" />
          <KpiCard icon={<Star className="h-4 w-4" />} title="NPS" value={loading ? "—" : String(Math.round(data.kpis.nps))} hint="Satisfação dos contatos" trend="+4" />
        </div>

        {/* SLA e tempo de resposta */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <GlassPanel>
            <div className="flex items-center justify-between">
              <div className="text-white/80">Tempo médio para 1ª resposta</div>
              <Clock className="h-4 w-4 text-white/60" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">{loading ? "—" : `${data.kpis.avgFirstRespMin.toFixed(1)} min`}</div>
            <div className="mt-2 text-xs text-white/60">Meta: até 5 min</div>
          </GlassPanel>
          <GlassPanel>
            <div className="flex items-center justify-between">
              <div className="text-white/80">Violações de SLA (24h)</div>
              <Gauge className="h-4 w-4 text-white/60" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">{loading ? "—" : data.kpis.slaBreaches}</div>
            <div className="mt-2 text-xs text-white/60">Ações: priorizar fila e reduzir cadência de canais críticos</div>
          </GlassPanel>
          <GlassPanel>
            <div className="mb-2 text-white/80">Inbox por canal</div>
            <div className="grid grid-cols-2 gap-2">
              {loading ? (
                <Skeleton rows={4} />
              ) : (
                data.inbox.map((c: any) => (
                  <div key={c.channel} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-white/80">
                    <div className="flex items-center justify-between">
                      <span>{c.channel}</span>
                      <span className="text-white/60">SLA {pct(c.sla)}</span>
                    </div>
                    <div className="mt-1 text-white">{c.open} abertos • espera {c.avgWait}</div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>

        {/* Performance por canal */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <GlassPanel>
            <div className="mb-2 flex items-center justify-between text-white/80">
              <div className="inline-flex items-center gap-2"><BarChart2 className="h-4 w-4" /> ROI por canal</div>
              <span className="text-xs text-white/60">Último período</span>
            </div>
            {loading ? (
              <Skeleton rows={6} />
            ) : (
              <div className="space-y-2">
                {data.channels.map((ch: any) => (
                  <ChannelRow key={ch.name} name={ch.name} roi={ch.roi} cpl={ch.cpl} ctr={ch.ctr} spend={ch.spend} leads={ch.leads} />
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel>
            <div className="mb-2 flex items-center justify-between text-white/80">
              <div className="inline-flex items-center gap-2"><Inbox className="h-4 w-4" /> Conversas ao longo do tempo</div>
              <span className="text-xs text-white/60">Série (mock)</span>
            </div>
            <div className="h-36 rounded-xl border border-white/10 bg-white/5 p-2">
              <Sparkline values={genSpark(32)} />
            </div>
            <div className="mt-2 text-xs text-white/60">Picos indicam campanhas/automations disparadas</div>
          </GlassPanel>
        </div>

        {/* Campanhas e Automations */}
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <GlassPanel>
            <div className="mb-2 flex items-center justify-between text-white/80">
              <div className="inline-flex items-center gap-2"><Megaphone className="h-4 w-4" /> Top campanhas</div>
              <a className="text-xs text-white/60 hover:text-white" href="#">ver todas</a>
            </div>
            {loading ? <Skeleton rows={5} /> : <CampaignTable rows={data.campaigns} />}
          </GlassPanel>

          <GlassPanel>
            <div className="mb-2 flex items-center justify-between text-white/80">
              <div className="inline-flex items-center gap-2"><Settings2 className="h-4 w-4" /> Automations</div>
              <a className="text-xs text-white/60 hover:text-white" href="#">abrir</a>
            </div>
            {loading ? <Skeleton rows={5} /> : <FlowsTable rows={data.flows} />}
          </GlassPanel>
        </div>

        {/* Reputação */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <GlassPanel>
            <div className="mb-1 text-white/80">Reputação (últimos 30d)</div>
            {loading ? (
              <Skeleton rows={2} />
            ) : (
              <div className="flex items-end justify-between">
                <div className="text-4xl font-semibold text-white">{data.reputation.rating.toFixed(1)}</div>
                <div className="text-right text-white/70">
                  <div className="text-sm">{data.reputation.reviews} reviews</div>
                  <div className="text-xs text-emerald-300/80">+{data.reputation.delta} no período</div>
                </div>
              </div>
            )}
          </GlassPanel>

          <GlassPanel>
            <div className="mb-1 text-white/80">NPS (distribuição)</div>
            <div className="grid grid-cols-3 gap-2 text-xs text-white/80">
              <Bar label="Detratores" value={22} />
              <Bar label="Neutros" value={16} />
              <Bar label="Promotores" value={62} />
            </div>
            <div className="mt-2 text-xs text-white/60">* NPS = Promotores − Detratores</div>
          </GlassPanel>

          <GlassPanel>
            <div className="mb-1 text-white/80">Atalhos</div>
            <div className="grid grid-cols-2 gap-2">
              <Shortcut label="Abrir Inbox" icon={<MessageCircleMore className="h-4 w-4" />} />
              <Shortcut label="Criar Campanha" icon={<Megaphone className="h-4 w-4" />} />
              <Shortcut label="Sequências" icon={<Settings2 className="h-4 w-4" />} />
              <Shortcut label="Playbooks" icon={<Percent className="h-4 w-4" />} />
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

// --------------------------------
// Components
// --------------------------------
function RangePill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border px-3 py-2 text-sm ${active ? "border-white/25 bg-white/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>{label}</button>
  );
}

function KpiCard({ icon, title, value, hint, trend }: { icon: React.ReactNode; title: string; value: string; hint?: string; trend?: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white/90 backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-white/80">{icon} {title}</div>
        {trend && <div className="text-xs text-emerald-300/80">{trend}</div>}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/60">{hint}</div>}
    </div>
  );
}

function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-white/90">
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 [mask:linear-gradient(#fff,transparent_30%)]" />
      {children}
    </div>
  );
}

function ChannelRow({ name, roi, cpl, ctr, spend, leads }: any) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
      <div className="text-white/80">{name}</div>
      <div className="hidden items-center gap-2 text-white/70 md:flex">
        <span>CTR {pct(ctr)}</span>
        <span>CPL {fmtBRL(cpl)}</span>
        <span>Leads {leads}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white/60">Gasto</span>
        <span className="text-white">{fmtBRL(spend)}</span>
        <span className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-200">ROI {roi.toFixed(1)}x</span>
      </div>
    </div>
  );
}

function CampaignTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm text-white/85">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-3 py-2">Campanha</th>
            <th className="px-3 py-2">Canal</th>
            <th className="px-3 py-2">CPM</th>
            <th className="px-3 py-2">CTR</th>
            <th className="px-3 py-2">CPL</th>
            <th className="px-3 py-2">Conv.</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2 text-white/70">{r.channel}</td>
              <td className="px-3 py-2">{fmtBRL(r.cpm)}</td>
              <td className="px-3 py-2">{pct(r.ctr)}</td>
              <td className="px-3 py-2">{fmtBRL(r.cpl)}</td>
              <td className="px-3 py-2">{pct(r.conv)}</td>
              <td className="px-3 py-2 text-right"><a className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20" href="#">ver <ChevronRight className="h-3 w-3" /></a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowsTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm text-white/85">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-3 py-2">Fluxo</th>
            <th className="px-3 py-2">Enviados</th>
            <th className="px-3 py-2">Abertura</th>
            <th className="px-3 py-2">Clique</th>
            <th className="px-3 py-2">Conversão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2">{r.sent}</td>
              <td className="px-3 py-2">{pct(r.open)}</td>
              <td className="px-3 py-2">{pct(r.click)}</td>
              <td className="px-3 py-2">{pct(r.conv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 520, h = 110, pad = 8;
  const max = Math.max(...values) || 1;
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / (values.length - 1), h - pad - (v / max) * (h - pad * 2)] as const);
  const d = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const area = `${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <path d={area} fill="#7bffd122" />
      <path d={d} stroke="#7bffd1" strokeWidth={2} fill="none" />
    </svg>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 text-xs text-white/60">{label}</div>
      <div className="h-8 w-full rounded-lg border border-white/10 bg-white/5">
        <div className="h-8 rounded-lg bg-white/20" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-1 text-right text-xs text-white/80">{value}%</div>
    </div>
  );
}

function Shortcut({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20">
      {icon} {label}
    </button>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 w-full animate-pulse rounded-xl bg-white/10" />
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

// Helpers
function genSpark(n: number) {
  const arr = Array.from({ length: n }, () => 0).map((_, i) => 7 + Math.sin(i / 2.6) * 3 + Math.random() * 2);
  return arr.map((x) => Math.max(1, Math.round(x)));
}
