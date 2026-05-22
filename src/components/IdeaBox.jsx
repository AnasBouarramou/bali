'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { supabase } from '../lib/supabase'
import { idrToEur } from '../lib/currency'
import {
  Lightbulb, Waves, UtensilsCrossed, TreePine, Landmark, MoreHorizontal,
  BedDouble, MapPin, Umbrella, Music, CalendarDays, Clock, X,
} from 'lucide-react'

const CATEGORY_META = {
  hotel:      { label: 'Hébergement',     color: '#C4826A', Icon: BedDouble },
  beach:      { label: 'Plage / Surf',    color: '#7EAFC4', Icon: Waves },
  restaurant: { label: 'Restaurant',      color: '#D4905A', Icon: UtensilsCrossed },
  food:       { label: 'Restaurant',      color: '#D4905A', Icon: UtensilsCrossed },
  beach_club: { label: 'Beach Club',      color: '#E8A85A', Icon: Umbrella },
  nightclub:  { label: 'Boîte de nuit',   color: '#8B7AB8', Icon: Music },
  nature:     { label: 'Cascade / Rando', color: '#8AB48A', Icon: TreePine },
  culture:    { label: 'Temple / Culture',color: '#B08AC4', Icon: Landmark },
  other:      { label: 'Autre',           color: '#C4A882', Icon: MoreHorizontal },
}

const getCatMeta = (cat) =>
  CATEGORY_META[cat] ?? (cat?.startsWith('other_') ? CATEGORY_META.other : CATEGORY_META.other)

const normCat = (cat) => {
  if (cat === 'food') return 'restaurant'
  if (cat?.startsWith('other_')) return 'other'
  return cat
}

const STAGES = [
  { name: 'Uluwatu',     lat: -8.8291, lng: 115.0849 },
  { name: 'Ubud',        lat: -8.5069, lng: 115.2625 },
  { name: 'Sidemen',     lat: -8.5085, lng: 115.5565 },
  { name: 'Nusa Penida', lat: -8.7275, lng: 115.5443 },
  { name: 'Îles Gilis',  lat: -8.3524, lng: 116.0375 },
  { name: 'Lombok',      lat: -8.8873, lng: 116.3058 },
  { name: 'Canggu',      lat: -8.6478, lng: 115.1385 },
]

const nearestStage = (lat, lng) => {
  if (!lat || !lng) return null
  let best = null, bestDist = Infinity
  for (const s of STAGES) {
    const d = (s.lat - lat) ** 2 + (s.lng - lng) ** 2
    if (d < bestDist) { bestDist = d; best = s.name }
  }
  return best
}

const CATEGORY_ORDER = ['hotel', 'beach', 'restaurant', 'beach_club', 'nightclub', 'nature', 'culture', 'other']

export default function IdeaBox({ allPins, onPinUpdated }) {
  const [selectedPin, setSelectedPin] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [assignDate, setAssignDate] = useState('')
  const [assignTime, setAssignTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const openPin = (pin) => {
    setSelectedPin(pin)
    setShowDatePicker(false)
    setAssignDate('')
    setAssignTime('')
  }

  const closePin = () => {
    setSelectedPin(null)
    setShowDatePicker(false)
  }

  const handleAssignDate = async () => {
    if (!assignDate || !selectedPin) return
    setIsSaving(true)
    const { error } = await supabase.from('pins')
      .update({ planned_date: assignDate, planned_time: assignTime || null })
      .eq('id', selectedPin.id)
    setIsSaving(false)
    if (!error) {
      closePin()
      onPinUpdated?.()
    }
  }

  const undatedPins = allPins.filter(p => !p.planned_date)

  const byCategory = undatedPins.reduce((acc, pin) => {
    const c = normCat(pin.category) || 'other'
    if (!acc[c]) acc[c] = []
    acc[c].push(pin)
    return acc
  }, {})

  const presentCategories = CATEGORY_ORDER.filter(c => byCategory[c]?.length > 0)

  if (undatedPins.length === 0) {
    return (
      <div className="px-6 pb-6 page-safe-top">
        <h1 className="text-3xl font-black text-[#2C1A0E] mb-6">Boîte à idées</h1>
        <div className="warm-card p-8 rounded-2xl text-center anim-scale-in">
          <Lightbulb size={32} className="mx-auto mb-3 text-[#C4A090]" />
          <p className="text-sm font-bold text-[#9C7A6A]">Aucune idée pour l'instant.</p>
          <p className="text-xs text-[#C4A090] mt-1">Place un pin sans date pour le retrouver ici.</p>
        </div>
      </div>
    )
  }

  let globalCardIndex = 0

  return (
    <>
      <div className="px-6 pb-6 space-y-5 page-safe-top">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-black text-[#2C1A0E]">Boîte à idées</h1>
          <span className="text-sm font-black text-[#9C7A6A]">{undatedPins.length} lieu{undatedPins.length > 1 ? 'x' : ''}</span>
        </div>

        {presentCategories.map((catId, sectionIdx) => {
          const meta = CATEGORY_META[catId] || CATEGORY_META.other
          const SectionIcon = meta.Icon
          const pins = byCategory[catId]

          return (
            <div key={catId} className="anim-fade-up" style={{ animationDelay: `${sectionIdx * 60}ms` }}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center anim-pop"
                  style={{ background: meta.color, animationDelay: `${sectionIdx * 60 + 40}ms` }}
                >
                  <SectionIcon size={11} color="white" strokeWidth={2.2} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9C7A6A]">{meta.label}</p>
              </div>

              <div className="space-y-2">
                {pins.map((pin) => {
                  const cardDelay = globalCardIndex * 45 + sectionIdx * 60
                  globalCardIndex++
                  return (
                    <PinCard key={pin.id} pin={pin} delay={cardDelay} onTap={openPin} />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Drawer fiche pin ── */}
      <Drawer.Root open={!!selectedPin} onOpenChange={(open) => { if (!open) closePin() }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-[#2C1A0E]/25 z-40 backdrop-blur-[2px]" />
          <Drawer.Content
            className="flex flex-col fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] max-w-md mx-auto rounded-t-[32px] overflow-hidden"
            style={{
              background: 'rgba(255,248,244,0.92)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderTop: '1px solid rgba(255,255,255,0.68)',
              boxShadow: '0 -12px 50px rgba(140,70,40,0.14), inset 0 1px 0 rgba(255,255,255,0.60)',
            }}
          >
            <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-[#D4B4A4]/55 mt-4 mb-1" />

            {selectedPin && (
              <div className="overflow-y-auto px-6 pb-nav-safe space-y-4 pt-2">

                {selectedPin.image_url && (
                  <img
                    src={selectedPin.image_url}
                    alt={selectedPin.title}
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-[#F0E4DA] text-[#9C7A6A] px-3 py-1 rounded-full">
                      {getCatMeta(selectedPin.category).label}
                    </span>
                    <Drawer.Title className="font-black text-[24px] leading-tight mt-2 text-[#2C1A0E]">
                      {selectedPin.title}
                    </Drawer.Title>
                    {nearestStage(selectedPin.lat, selectedPin.lng) && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 mt-1"
                        style={{ background: 'rgba(196,130,106,0.13)', color: '#C4826A' }}
                      >
                        <MapPin size={8} strokeWidth={2.5} />
                        {nearestStage(selectedPin.lat, selectedPin.lng)}
                      </span>
                    )}
                  </div>
                  <button onClick={closePin} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'rgba(0,0,0,0.055)' }}>
                    <X size={15} className="text-[#9C7A6A]" />
                  </button>
                </div>

                {selectedPin.notes && (
                  <div className="warm-card p-4 rounded-2xl text-sm text-[#6B4A3A] font-medium leading-relaxed">
                    {selectedPin.notes}
                  </div>
                )}

                {selectedPin.cost_idr > 0 && (
                  <div className="warm-card p-4 rounded-2xl flex justify-between items-center">
                    <p className="text-sm font-black text-[#2C1A0E]">{parseFloat(selectedPin.cost_idr).toLocaleString()} IDR</p>
                    <p className="text-sm font-bold text-[#E8704A]">≈ {idrToEur(selectedPin.cost_idr, 2)} €</p>
                  </div>
                )}

                {/* ── Attribuer une date ── */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1.5px solid rgba(232,112,74,0.20)', background: 'rgba(232,112,74,0.04)' }}
                >
                  {!showDatePicker ? (
                    <button
                      onClick={() => setShowDatePicker(true)}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-white/40 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,112,74,0.12)' }}>
                        <CalendarDays size={16} className="text-[#E8704A]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#E8704A]">Attribuer une date</p>
                        <p className="text-[11px] font-medium text-[#C4A090]">Ajouter à l'itinéraire</p>
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9C7A6A]">Choisir une date</p>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={assignDate}
                          onChange={(e) => setAssignDate(e.target.value)}
                          className="warm-input flex-1"
                        />
                        <input
                          type="time"
                          value={assignTime}
                          onChange={(e) => setAssignTime(e.target.value)}
                          className="warm-input flex-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-black text-[#9C7A6A]"
                          style={{ background: 'rgba(0,0,0,0.055)' }}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleAssignDate}
                          disabled={!assignDate || isSaving}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-opacity"
                          style={{ background: 'linear-gradient(135deg,#E8704A,#F5956A)' }}
                        >
                          {isSaving ? 'Enregistrement…' : 'Confirmer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

function PinCard({ pin, delay, onTap }) {
  const meta = getCatMeta(pin.category)
  const PinIcon = meta.Icon
  const zone = nearestStage(pin.lat, pin.lng)

  return (
    <div
      onClick={() => onTap(pin)}
      className="flex items-stretch rounded-2xl overflow-hidden anim-slide-right cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: 'rgba(255,248,244,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.62)',
        boxShadow: '0 2px 12px rgba(140,70,40,0.06)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3">
        <div
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: meta.color + '22', border: `1.5px solid ${meta.color}40` }}
        >
          <PinIcon size={15} color={meta.color} strokeWidth={2.2} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-[#2C1A0E] truncate">{pin.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {zone && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider rounded-full px-1.5 py-0.5"
                style={{ background: 'rgba(196,130,106,0.13)', color: '#C4826A' }}
              >
                <MapPin size={7} strokeWidth={2.5} />
                {zone}
              </span>
            )}
            {pin.notes && (
              <p className="text-xs text-[#9C7A6A] font-medium truncate">{pin.notes}</p>
            )}
          </div>
        </div>

        {pin.cost_idr > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-black text-[#E8704A]">{parseFloat(pin.cost_idr).toLocaleString()}</p>
            <p className="text-[10px] font-bold text-[#9C7A6A]">≈ {idrToEur(pin.cost_idr)} €</p>
          </div>
        )}
      </div>

      {pin.image_url && (
        <img src={pin.image_url} alt={pin.title} className="w-20 flex-shrink-0 object-cover" />
      )}
    </div>
  )
}
