'use client'

import { Lightbulb, Waves, UtensilsCrossed, TreePine, Landmark, MoreHorizontal, BedDouble, MapPin } from 'lucide-react'

const CATEGORY_META = {
  hotel:   { label: 'Hébergement',       color: '#C4826A', Icon: BedDouble },
  beach:   { label: 'Plage / Surf',       color: '#7EAFC4', Icon: Waves },
  food:    { label: 'Resto / Beach Club', color: '#D4905A', Icon: UtensilsCrossed },
  nature:  { label: 'Cascade / Rando',    color: '#8AB48A', Icon: TreePine },
  culture: { label: 'Temple / Culture',   color: '#B08AC4', Icon: Landmark },
  other:   { label: 'Autre',              color: '#C4A882', Icon: MoreHorizontal },
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

const idrToEur = (idr) => {
  if (!idr || isNaN(idr)) return null
  return (parseFloat(idr) * 0.000057).toFixed(0)
}

export default function IdeaBox({ allPins }) {
  const undatedPins = allPins.filter(p => !p.planned_date)

  const byCategory = undatedPins.reduce((acc, pin) => {
    const c = pin.category || 'other'
    if (!acc[c]) acc[c] = []
    acc[c].push(pin)
    return acc
  }, {})

  const categoryOrder = ['hotel', 'beach', 'food', 'nature', 'culture', 'other']
  const presentCategories = categoryOrder.filter(c => byCategory[c]?.length > 0)

  if (undatedPins.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-black text-[#2C1A0E] mb-6">Boîte à idées</h1>
        <div className="warm-card p-8 rounded-2xl text-center anim-scale-in">
          <Lightbulb size={32} className="mx-auto mb-3 text-[#C4A090]" />
          <p className="text-sm font-bold text-[#9C7A6A]">Aucune idée pour l'instant.</p>
          <p className="text-xs text-[#C4A090] mt-1">Place un pin sans date pour le retrouver ici.</p>
        </div>
      </div>
    )
  }

  // Compteur global pour le stagger inter-sections
  let globalCardIndex = 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-black text-[#2C1A0E]">Boîte à idées</h1>
        <span className="text-sm font-black text-[#9C7A6A]">{undatedPins.length} lieu{undatedPins.length > 1 ? 'x' : ''}</span>
      </div>

      {presentCategories.map((catId, sectionIdx) => {
        const meta = CATEGORY_META[catId] || CATEGORY_META.other
        const Icon = meta.Icon
        const pins = byCategory[catId]

        return (
          <div
            key={catId}
            className="anim-fade-up"
            style={{ animationDelay: `${sectionIdx * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-2 px-1">
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center anim-pop"
                style={{ background: meta.color, animationDelay: `${sectionIdx * 60 + 40}ms` }}
              >
                <Icon size={11} color="white" strokeWidth={2.2} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#9C7A6A]">{meta.label}</p>
            </div>

            <div className="space-y-2">
              {pins.map((pin) => {
                const cardDelay = globalCardIndex * 45 + sectionIdx * 60
                globalCardIndex++
                return (
                  <PinCard key={pin.id} pin={pin} meta={meta} delay={cardDelay} />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PinCard({ pin, meta, delay }) {
  const Icon = meta.Icon
  const zone = nearestStage(pin.lat, pin.lng)

  return (
    <div
      className="flex items-stretch rounded-2xl overflow-hidden anim-slide-right"
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
          <Icon size={15} color={meta.color} strokeWidth={2.2} />
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
        <img
          src={pin.image_url}
          alt={pin.title}
          className="w-20 flex-shrink-0 object-cover"
        />
      )}
    </div>
  )
}
