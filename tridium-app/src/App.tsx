import { Link, Route, Routes, Navigate } from 'react-router-dom'
import Session3D1Netflix from './pages/Session3D1Netflix'
import LucyDashboard from './pages/lucy_dashboard_i_os_liquid_react'
import LuddyCRM360 from './pages/luddy_crm_360_i_os_liquid_react'
import CheckoutIOSLiquid from './pages/checkout_i_os_liquid_glassmorphism_react_tailwind'
import { AttributionExplorer } from './pages/attribution_explorer_budget_co_pilot_i_os_liquid_react'
import IntegrationsHubAdmin from './pages/integrations_hub_admin_i_os_liquid_react'
import KankanCRM from './pages/kankan_crm_i_os_liquid_react'

function Home() { return <Session3D1Netflix /> }

export default function App() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f1a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 text-white">
          <div className="font-semibold">Tridium</div>
          <nav className="flex flex-wrap gap-3 text-sm text-white/80">
            <Link className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20" to="/">Home</Link>
            <Link className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20" to="/lucy/dashboard">Lucy</Link>
            <Link className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20" to="/luddy/crm">Luddy CRM</Link>
            <Link className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20" to="/kankan/crm">Kankan CRM</Link>
            <Link className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20" to="/checkout">Checkout</Link>
            <Link className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20" to="/analytics">Analytics</Link>
            <Link className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20" to="/integrations">Integrations</Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lucy/dashboard" element={<LucyDashboard />} />
        <Route path="/luddy/crm" element={<LuddyCRM360 />} />
        <Route path="/kankan/crm" element={<KankanCRM />} />
        <Route path="/checkout" element={<CheckoutIOSLiquid />} />
        <Route path="/analytics" element={<AttributionExplorer />} />
        <Route path="/integrations" element={<IntegrationsHubAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
