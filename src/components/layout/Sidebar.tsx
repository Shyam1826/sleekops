import {
  LayoutDashboard,
  Upload,
  Table2,
  Globe,
  GitMerge,
  Zap,
  ChevronRight,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react'
import type { View } from '../../types'

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
}

const navItems: { id: View; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload & Ingestion', icon: Upload, badge: '3' },
  { id: 'inspector', label: 'Data Inspector', icon: Table2 },
  { id: 'gis', label: 'Logistics Control', icon: Globe },
]

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen bg-slate-950 border-r border-slate-800/60">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-blue-600 rounded-lg rotate-3" />
            <div className="absolute inset-0 bg-blue-500 rounded-lg -rotate-3 opacity-60" />
            <div className="relative flex items-center justify-center w-8 h-8">
              <GitMerge className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Retrace</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Logistics Intelligence</p>
          </div>
        </div>
      </div>

      {/* Status pill */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-emerald-400">Pipeline Active</span>
          <Zap className="w-3 h-3 text-emerald-500 ml-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="section-title px-2">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/80 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </button>
          )
        })}

        <div className="pt-4">
          <p className="section-title px-2">System</p>
          <button 
            onClick={() => onNavigate('alerts')}
            className={`nav-item w-full ${currentView === 'alerts' ? 'nav-item-active' : 'nav-item-inactive'}`}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/80 text-[10px] font-bold text-white">
              2
            </span>
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className={`nav-item w-full ${currentView === 'settings' ? 'nav-item-active' : 'nav-item-inactive'}`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button 
            onClick={() => onNavigate('documentation')}
            className={`nav-item w-full ${currentView === 'documentation' ? 'nav-item-active' : 'nav-item-inactive'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Documentation</span>
          </button>
        </div>
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">AK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">Alex Keller</p>
            <p className="text-[10px] text-slate-500 truncate">Operations Lead</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <p className="text-[10px] text-slate-700 text-center mt-2 font-mono">v2.4.1-enterprise</p>
      </div>
    </aside>
  )
}
