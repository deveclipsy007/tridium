import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitBranch, Shuffle, Gauge, TrendingUp, Calculator, ChevronRight, Info, SlidersHorizontal, Rocket, Wallet, BarChart2, ArrowRightLeft, Equal, Sparkles, RefreshCcw
} from "lucide-react";

/**
 * Attribution Explorer + Budget Co‑Pilot — iOS‑Liquid
 * -------------------------------------------------
 * Este arquivo entrega **duas páginas** no mesmo estilo, prontas para usar
 * como tabs ou exportar como rotas separadas no Next (App Router):
 *  - <AttributionExplorer />
 *  - <BudgetCoPilot />
 *
 * Ambas usam **MOCK=true** por padrão. Para plugar nos agregadores reais:
 *  - Attribution: GET /api/metrics/attribution?range=7d&model=multi
 *  - Budget:     GET /api/ads/budget?range=30d  +  POST /api/ads/budget/simulate
 */

const MOCK = true;
const wait = (ms:number)=>new Promise(r=>setTimeout(r,ms));
const pct = (n:number)=>`${Math.round(n*100)}%`;
const brl = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

// ---------------------------------------------------------------------------
// Wrapper opcional (tabs). Exporte por padrão para visualizar agora.
// ---------------------------------------------------------------------------
export default function AttributionBudgetSuite(){
  const [tab, setTab] = useState<'attr'|'budget'>('attr');
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(1200px_700px_at_-10%_-10%,#5b8cff33,transparent_60%),radial-gradient(1200px_700px_at_110%_10%,#ff78b633,transparent_60%),linear-gradient(180deg,#0a0b10,#0b0f1a)]">
      <LiquidBlobs />
      <div className="relative mx-auto max-w-[1400px] px-4 py-6 md:py-10 text-white">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              {tab==='attr' ? <GitBranch className="h-5 w-5"/> : <Calculator className="h-5 w-5"/>}
            </div>
            <div>
              <div className="text-sm uppercase tracking-widest text-white/60">Tridium • Analytics</div>
              <div className="text-xl font-semibold">{tab==='attr' ? 'Attribution Explorer' : 'Budget Co‑Pilot'}</div>
            </div>
          </div>
          <div className="inline-flex gap-2">
            <TabButton active={tab==='attr'} onClick={()=>setTab('attr')}>Attribution</TabButton>
            <TabButton active={tab==='budget'} onClick={()=>setTab('budget')}>Budget</TabButton>
          </div>
        </div>
        {tab==='attr' ? <AttributionExplorer/> : <BudgetCoPilot/>}
      </div>
    </div>
  );
}

function TabButton({active,children,onClick}:{active?:boolean;children:React.ReactNode;onClick?:()=>void}){
  return <button onClick={onClick} className={`rounded-2xl border px-3 py-2 text-sm ${active? 'border-white/25 bg-white/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}>{children}</button>
}

// ---------------------------------------------------------------------------
// Attribution Explorer
// ---------------------------------------------------------------------------
export function AttributionExplorer(){
  const [range,setRange] = useState<'7d'|'30d'|'90d'>('30d');
  const [model,setModel] = useState<'multi'|'last'>('multi');
  const [data,setData] = useState<any|null>(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{(async()=>{
    setLoading(true);
    const d = await loadAttribution(range, model);
    setData(d); setLoading(false);
  })()},[range,model]);

  const kpi = useMemo(()=>{
    if(!data) return { conv:0, rev:0, roi:0, lift:0 };
    const base = data.kpis;
    return { conv: base.conversions, rev: base.revenue, roi: base.roi, lift: base.liftVsLast };
  },[data]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <RangePill label="7d" active={range==='7d'} onClick={()=>setRange('7d')}/>
        <RangePill label="30d" active={range==='30d'} onClick={()=>setRange('30d')}/>
        <RangePill label="90d" active={range==='90d'} onClick={()=>setRange('90d')}/>
        <div className="ml-2 inline-flex items-center gap-1 rounded-2xl border border-white/15 bg-white/10 p-1 text-xs">
          <ModeBtn active={model==='multi'} onClick={()=>setModel('multi')} icon={<Shuffle className="h-3 w-3"/>} label="Multi‑touch"/>
          <ModeBtn active={model==='last'} onClick={()=>setModel('last')} icon={<Equal className="h-3 w-3"/>} label="Last‑click"/>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Gauge className="h-4 w-4"/>} title="Conversões" value={loading? '—' : String(kpi.conv)} hint="Total atribuído"/>
        <KpiCard icon={<Wallet className="h-4 w-4"/>} title="Receita atribuída" value={loading? '—' : brl(kpi.rev)} hint="Multi‑touch agrega contribuição parcial"/>
        <KpiCard icon={<TrendingUp className="h-4 w-4"/>} title="ROI" value={loading? '—' : `${kpi.roi.toFixed(1)}x`} hint="Receita / gasto"/>
        <KpiCard icon={<ArrowRightLeft className="h-4 w-4"/>} title="Lift vs Last‑click" value={loading? '—' : pct(kpi.lift)} hint="Variação do multi‑touch"/>
      </div>

      {/* Top caminhos */}
      <GlassPanel>
        <div className="mb-2 flex items-center justify-between text-white/80">
          <div className="inline-flex items-center gap-2"><GitBranch className="h-4 w-4"/> Top caminhos de conversão</div>
          <span className="text-xs text-white/60">{model==='multi'?"Modelo: Multi‑touch (data‑driven)":"Modelo: Last‑click"}</span>
        </div>
        {loading ? <Skeleton rows={6}/> : (
          <div className="space-y-2">
            {data.paths.map((p:any,i:number)=> (
              <PathRow key={i} path={p.sequence} conv={p.conversions} rev={p.revenue} share={p.share} delta={p.deltaVsLast}/>
            ))}
          </div>
        )}
        <div className="mt-3 text-xs text-white/60 inline-flex items-center gap-2"><Info className="h-3 w-3"/> O *delta* compara a importância do caminho quando o modelo muda para last‑click.</div>
      </GlassPanel>

      {/* Por canal */}
      <GlassPanel>
        <div className="mb-2 flex items-center justify-between text-white/80">
          <div className="inline-flex items-center gap-2"><BarChart2 className="h-4 w-4"/> Performance por canal</div>
          <span className="text-xs text-white/60">CPL, Conv%, Receita atribuída</span>
        </div>
        {loading ? <Skeleton rows={5}/> : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {data.channels.map((c:any)=> <ChannelCard key={c.name} c={c} />)}
          </div>
        )}
      </GlassPanel>

      {/* Explicabilidade */}
      <GlassPanel>
        <div className="mb-2 flex items-center justify-between text-white/80">
          <div className="inline-flex items-center gap-2"><Info className="h-4 w-4"/> Por que o modelo decidiu assim?</div>
          <span className="text-xs text-white/60">Shapley‑like (explicação simplificada)</span>
        </div>
        {loading ? <Skeleton rows={3}/> : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-white/80">
            {data.explain.slice(0,4).map((t:string,i:number)=>(<li key={i}>{t}</li>))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}

async function loadAttribution(range:string, model:'multi'|'last'){
  if(!MOCK){
    const res = await fetch(`/api/metrics/attribution?range=${range}&model=${model}`); return res.json();
  }
  await wait(250);
  const base = range==='7d'?1: range==='30d'?1.8:2.6;
  const conv = Math.round(420*base*(model==='multi'?1.06:1));
  const revenue = Math.round(210000*base*(model==='multi'?1.08:1));
  const roi = 2.2 + (model==='multi'?0.2:0);
  const channels = [
    { name:'Meta', cpl: 16.9, conv: 0.12, revenue: Math.round(110000*base), share: 0.52 },
    { name:'Google', cpl: 21.4, conv: 0.09, revenue: Math.round(72000*base), share: 0.34 },
    { name:'TikTok', cpl: 12.2, conv: 0.08, revenue: Math.round(24000*base), share: 0.14 },
  ];
  const seqs = [
    { sequence:['Meta','WhatsApp','Luddy'], conversions: Math.round(130*base), revenue: Math.round(68000*base), share: 0.31, deltaVsLast: +0.12 },
    { sequence:['Google','LP','Luddy'], conversions: Math.round(90*base), revenue: Math.round(52000*base), share: 0.24, deltaVsLast: +0.05 },
    { sequence:['TikTok','DM','Lucy','Luddy'], conversions: Math.round(48*base), revenue: Math.round(21000*base), share: 0.11, deltaVsLast: +0.03 },
    { sequence:['Meta','LP','Email','Luddy'], conversions: Math.round(42*base), revenue: Math.round(20000*base), share: 0.10, deltaVsLast: +0.02 },
    { sequence:['Google','WhatsApp','Luddy'], conversions: Math.round(36*base), revenue: Math.round(18000*base), share: 0.08, deltaVsLast: -0.04 },
  ];
  const explain = [
    'Meta contribuiu em 52% das conversões com ganho marginal alto nas primeiras interações.',
    'Caminhos com DM→Lucy aumentam probabilidade em +18% vs LP direto.',
    'Last‑click subestima TikTok em campanhas de topo; multi‑touch corrige +0.03 share.',
    'Sequências com Email intermediário têm LTV +12% apesar de CPL maior.'
  ];
  return { kpis:{ conversions:conv, revenue, roi, liftVsLast: 0.09 }, channels, paths: seqs, explain };
}

function PathRow({path,conv,rev,share,delta}:{path:string[];conv:number;rev:number;share:number;delta:number}){
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1 text-white/80">
          {path.map((p,i)=> (
            <span key={i} className="inline-flex items-center gap-1">{i>0 && <ChevronRight className="h-3 w-3 text-white/40"/>}<span className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-xs">{p}</span></span>
          ))}
        </div>
        <div className="mt-1 text-xs text-white/60">Participação {pct(share)}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-white">{conv}</div>
          <div className="text-xs text-white/60">convs</div>
        </div>
        <div className="text-right">
          <div className="text-white">{brl(rev)}</div>
          <div className="text-xs text-white/60">receita</div>
        </div>
        <span className={`rounded-lg border px-2 py-0.5 text-xs ${delta>=0? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100':'border-rose-300/30 bg-rose-300/10 text-rose-100'}`}>{delta>=0?'+':''}{(delta*100).toFixed(0)}pp</span>
      </div>
    </div>
  );
}

function ChannelCard({c}:{c:any}){
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
        <div>{c.name}</div>
        <div className="rounded-lg border border-white/10 bg-white/10 px-2 py-0.5">Share {pct(c.share)}</div>
      </div>
      <div className="text-sm text-white/80">CPL <span className="text-white">{brl(c.cpl)}</span> • Conv <span className="text-white">{pct(c.conv)}</span></div>
      <div className="mt-1 text-xs text-white/60">Receita atribuída</div>
      <div className="text-white">{brl(c.revenue)}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Budget Co‑Pilot
// ---------------------------------------------------------------------------
export function BudgetCoPilot(){
  const [range,setRange] = useState<'7d'|'30d'|'90d'>('30d');
  const [base,setBase] = useState<any|null>(null);
  const [sim,setSim] = useState<any|null>(null);
  const [loading,setLoading] = useState(true);
  const [totalDelta,setTotalDelta] = useState(0); // variação de orçamento (% do total)

  useEffect(()=>{(async()=>{
    setLoading(true);
    const b = await loadBudget(range); setBase(b); setSim(null); setTotalDelta(0); setLoading(false);
  })()},[range]);

  async function simulate(){
    const r = await simulateBudget(base, totalDelta); setSim(r);
  }

  const rows = sim?.allocation || base?.channels || [];
  const totalSpend = rows.reduce((a:number,c:any)=>a+c.spend,0);
  const totalLeads = rows.reduce((a:number,c:any)=>a+c.leads,0);
  const roi = (rows.reduce((a:number,c:any)=>a+c.revenue,0) / Math.max(1,totalSpend));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <RangePill label="7d" active={range==='7d'} onClick={()=>setRange('7d')}/>
        <RangePill label="30d" active={range==='30d'} onClick={()=>setRange('30d')}/>
        <RangePill label="90d" active={range==='90d'} onClick={()=>setRange('90d')}/>
        <div className="ml-2 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm">
          <SlidersHorizontal className="h-4 w-4"/>
          <span className="text-white/70">Variação total</span>
          <input type="range" min={-30} max={30} step={1} value={totalDelta} onChange={e=>setTotalDelta(Number(e.target.value))}/>
          <span className="w-10 text-right">{totalDelta}%</span>
        </div>
        <button onClick={simulate} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-3 py-2 text-sm font-semibold text-[#0b0f1a] backdrop-blur-md hover:bg-white/30">
          <Sparkles className="h-4 w-4"/> Simular
        </button>
        <button onClick={()=>{setSim(null); setTotalDelta(0);}} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20"><RefreshCcw className="h-4 w-4"/> Reset</button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Wallet className="h-4 w-4"/>} title="Gasto total" value={loading? '—' : brl(totalSpend)} hint={sim? 'após simulação' : 'baseline'} />
        <KpiCard icon={<TrendingUp className="h-4 w-4"/>} title="ROI estimado" value={loading? '—' : `${roi.toFixed(2)}x`} hint="Receita / gasto" />
        <KpiCard icon={<Gauge className="h-4 w-4"/>} title="Leads" value={loading? '—' : String(totalLeads)} hint="Volume total esperado" />
        <KpiCard icon={<Rocket className="h-4 w-4"/>} title={sim? 'Uplift esperado':'Potencial'} value={loading? '—' : (sim? pct(sim.uplift) : '—')} hint={sim? 'comparado ao baseline' : 'rode uma simulação'} />
      </div>

      <GlassPanel>
        <div className="mb-2 flex items-center justify-between text-white/80">
          <div className="inline-flex items-center gap-2"><Calculator className="h-4 w-4"/> Alocação por canal</div>
          <span className="text-xs text-white/60">Respostas marginais e saturação</span>
        </div>
        {loading? <Skeleton rows={6}/> : (
          <div className="space-y-2">
            {rows.map((c:any)=> <BudgetRow key={c.name} row={c} />)}
          </div>
        )}
        {sim && <div className="mt-3 text-xs text-emerald-200/80">Sugestão aplicada: {sim.note}</div>}
      </GlassPanel>

      <GlassPanel>
        <div className="mb-2 flex items-center justify-between text-white/80">
          <div className="inline-flex items-center gap-2"><BarChart2 className="h-4 w-4"/> Curva de resposta (mock)</div>
          <span className="text-xs text-white/60">Diminishing returns</span>
        </div>
        <div className="h-40 rounded-xl border border-white/10 bg-white/5 p-2"><ResponseCurve values={genCurve()} /></div>
        <div className="mt-2 text-xs text-white/60">Cada canal tem uma curva — o Co‑Pilot desloca orçamento até equalizar o **ROI marginal**.</div>
      </GlassPanel>
    </div>
  );
}

async function loadBudget(range:string){
  if(!MOCK){ const r = await fetch(`/api/ads/budget?range=${range}`); return r.json(); }
  await wait(240);
  const f = range==='7d'?1: range==='30d'?1.8:2.7;
  return {
    channels:[
      { name:'Meta', spend: 4200*f, leads: Math.round(230*f), revenue: 4200*f*2.4, roi: 2.4, marginal: 0.18 },
      { name:'Google', spend: 3800*f, leads: Math.round(210*f), revenue: 3800*f*1.8, roi: 1.8, marginal: 0.12 },
      { name:'TikTok', spend: 1200*f, leads: Math.round(110*f), revenue: 1200*f*1.6, roi: 1.6, marginal: 0.20 },
    ]
  };
}

async function simulateBudget(base:any, delta:number){
  if(!MOCK){
    const r = await fetch('/api/ads/budget/simulate',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ delta }) });
    return r.json();
  }
  await wait(200);
  const tot = base.channels.reduce((a:number,c:any)=>a+c.spend,0);
  const shift = tot * (delta/100);
  // Estratégia: tirar de canal de menor ROI marginal e colocar no maior.
  const up = [...base.channels].sort((a,b)=>b.marginal-a.marginal);
  const hi = up[0], mid = up[1], lo = up[2];
  const alloc = base.channels.map((c:any)=> ({...c}));
  const inc = Math.max(0, shift);
  const dec = Math.max(0, -shift);
  alloc.find((x:any)=>x.name===hi.name)!.spend += inc;
  alloc.find((x:any)=>x.name===lo.name)!.spend -= dec;
  // Recalcula outputs com saturação simples
  const allocation = alloc.map((c:any)=> rewriteChannel(c));
  const rev0 = base.channels.reduce((a:number,c:any)=>a+c.revenue,0);
  const rev1 = allocation.reduce((a:number,c:any)=>a+c.revenue,0);
  const uplift = (rev1 - rev0) / Math.max(1, rev0);
  return { allocation, uplift, note: `+${delta}% total (de ${lo.name} → ${hi.name})` };
}

function rewriteChannel(c:{name:string;spend:number;roi:number;leads:number;revenue:number}){
  // ROI marginal decai ~log; leads ~ sqrt(spend)
  const leads = Math.round(Math.sqrt(c.spend) * 11);
  const revenue = c.spend * (Math.max(1.2, Math.log10(Math.max(10,c.spend))));
  const roi = revenue / Math.max(1,c.spend);
  return { ...c, leads, revenue, roi };
}

function BudgetRow({row}:{row:any}){
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
      <div className="text-white/80">{row.name}</div>
      <div className="hidden items-center gap-3 text-white/70 md:flex">
        <span>Leads <span className="text-white">{row.leads}</span></span>
        <span>ROI <span className="text-white">{row.roi.toFixed(2)}x</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white/60">Gasto</span>
        <span className="text-white">{brl(row.spend)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI primitives (iOS‑Liquid)
// ---------------------------------------------------------------------------
function RangePill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border px-3 py-2 text-sm ${active ? "border-white/25 bg-white/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>{label}</button>
  );
}

function ModeBtn({active, icon, label, onClick}:{active?:boolean; icon:React.ReactNode; label:string; onClick?:()=>void}){
  return <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 ${active? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'}`}>{icon} {label}</button>
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
        <div key={i} className="h-8 w-full animate-pulse rounded-xl bg-white/10" />
      ))}
    </div>
  );
}

function ResponseCurve({ values }:{values:number[]}){
  const w=520,h=120,p=10; const max=Math.max(...values,1);
  const pts = values.map((v,i)=>[p + (i*(w-p*2))/(values.length-1), h-p - (v/max)*(h-p*2)] as const);
  const d = pts.map((p,i)=> i?`L ${p[0]} ${p[1]}`:`M ${p[0]} ${p[1]}`).join(' ');
  const area = `${d} L ${w-p} ${h-p} L ${p} ${h-p} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <path d={area} fill="#7bffd122"/>
      <path d={d} stroke="#7bffd1" strokeWidth={2} fill="none"/>
    </svg>
  );
}

function genCurve(){
  const n=32; const arr:number[]=[]; let x=1; for(let i=0;i<n;i++){ x += Math.max(0.2, 1 - (i/18)); arr.push(x + Math.random()*0.8); } return arr;
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
