'use client'

import { Map, CalendarDays, Bookmark, Calculator } from 'lucide-react'

const tabs = [
  { id: 'map',       label: 'Carte',   icon: Map },
  { id: 'agenda',    label: 'Agenda',  icon: CalendarDays },
  { id: 'saved',     label: 'À caler', icon: Bookmark },
  { id: 'converter', label: 'Monnaie', icon: Calculator },
]

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="fixed bottom-nav-position left-1/2 -translate-x-1/2 z-[60] glass rounded-full px-1.5 py-1.5 flex items-center gap-0.5">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-full font-black text-[11px] tracking-wide
              ${isActive
                ? 'px-4 py-2 text-white shadow-[0_4px_16px_rgba(232,112,74,0.45)]'
                : 'px-3 py-2 text-[#9C7A6A]'
              }`}
            style={{
              background: isActive ? 'linear-gradient(135deg,#E8704A,#F5956A)' : 'transparent',
              transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Icon
              size={19}
              strokeWidth={isActive ? 2.5 : 1.8}
              style={{ transition: 'stroke-width 0.22s ease' }}
            />
            <span
              style={{
                maxWidth: isActive ? '4rem' : '0px',
                opacity: isActive ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-width 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
