'use client'

import { useState, useEffect } from 'react'
import BaliMap from '@/components/Map'
import BottomNav from '@/components/BottomNav'
import Agenda from '@/components/Agenda'
import IdeaBox from '@/components/IdeaBox'
import Converter from '@/components/Converter'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [activeTab, setActiveTab] = useState('map')
  const [allPins, setAllPins] = useState([])
  // Chaque fois qu'on navigue vers un onglet, on incrémente sa clé
  // → remonte le wrapper interne → rejoue l'animation d'entrée
  const [tabKeys, setTabKeys] = useState({ agenda: 0, saved: 0, converter: 0 })

  const loadPins = async () => {
    const { data, error } = await supabase.from('pins').select('*')
    if (data && !error) setAllPins(data)
  }

  useEffect(() => { loadPins() }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab !== 'map') {
      setTabKeys(prev => ({ ...prev, [tab]: (prev[tab] ?? 0) + 1 }))
    }
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#FFF8F4]">

      {/* VUE 1 : CARTE — jamais démontée (Mapbox) */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
        <BaliMap allPins={allPins} onPinSaved={loadPins} />
      </div>

      {/* VUE 2 : AGENDA */}
      <div className={`absolute inset-0 z-10 overflow-y-auto ${activeTab === 'agenda' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div key={tabKeys.agenda} className="anim-fade-up pb-nav-safe">
          <Agenda allPins={allPins} onPinUpdated={loadPins} />
        </div>
      </div>

      {/* VUE 3 : BOÎTE À IDÉES */}
      <div className={`absolute inset-0 z-10 overflow-y-auto ${activeTab === 'saved' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div key={tabKeys.saved} className="anim-fade-up pb-nav-safe">
          <IdeaBox allPins={allPins} onPinUpdated={loadPins} />
        </div>
      </div>

      {/* VUE 4 : CONVERTISSEUR */}
      <div className={`absolute inset-0 z-10 overflow-y-auto ${activeTab === 'converter' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div key={tabKeys.converter} className="anim-fade-up pb-nav-safe">
          <Converter />
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

    </main>
  )
}
