'use client'

import { useState } from 'react'
import { CalendarDays, Clock, BedDouble, Waves, UtensilsCrossed, TreePine, Landmark, MoreHorizontal, Umbrella, Music, Bookmark } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CATEGORY_META = {
  hotel:      { label: 'Hébergement',    color: '#C4826A', Icon: BedDouble },
  beach:      { label: 'Plage / Surf',   color: '#7EAFC4', Icon: Waves },
  restaurant: { label: 'Restaurant',    color: '#D4905A', Icon: UtensilsCrossed },
  food:       { label: 'Restaurant',    color: '#D4905A', Icon: UtensilsCrossed },
  beach_club: { label: 'Beach Club',    color: '#E8A85A', Icon: Umbrella },
  nightclub:  { label: 'Boîte de nuit',color: '#8B7AB8', Icon: Music },
  nature:     { label: 'Cascade / Rando',color: '#8AB48A', Icon: TreePine },
  culture:    { label: 'Temple / Culture',color: '#B08AC4', Icon: Landmark },
  other:      { label: 'Autre',          color: '#C4A882', Icon: MoreHorizontal },
}

const getCatMeta = (cat) =>
  CATEGORY_META[cat] ?? (cat?.startsWith('other_') ? CATEGORY_META.other : CATEGORY_META.other)

const STAGE_GRADIENTS = [
  'linear-gradient(150deg,#C4826A,#E8704A)',
  'linear-gradient(150deg,#7EAFC4,#4A8FAA)',
  'linear-gradient(150deg,#8AB48A,#5A8A5A)',
  'linear-gradient(150deg,#B08AC4,#8060A8)',
  'linear-gradient(150deg,#D4905A,#B86A30)',
  'linear-gradient(150deg,#A8C4B4,#6A9880)',
  'linear-gradient(150deg,#C4A882,#A07850)',
]

import { idrToEur } from '../lib/currency'

const fmtShort = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

const fmtMedium = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const dateRange = (from, toExclusive) => {
  const dates = []
  const cur = new Date(from + 'T00:00:00')
  const end = toExclusive ? new Date(toExclusive + 'T00:00:00') : null
  while (!end || cur < end) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
    if (!end) break
  }
  return dates
}

const buildStages = (allPins) => {
  const datedPins = allPins.filter(p => p.planned_date)
  const hotels = datedPins
    .filter(p => p.category === 'hotel')
    .sort((a, b) => a.planned_date.localeCompare(b.planned_date))

  if (hotels.length === 0) {
    const allDates = [...new Set(datedPins.map(p => p.planned_date))].sort()
    if (allDates.length === 0) return []
    return [{ id: 'all', hotel: null, name: 'Mon voyage', dates: allDates, pins: datedPins }]
  }

  const stages = hotels.map((hotel, i) => {
    const nextHotel = hotels[i + 1]
    let stageDates
    if (nextHotel) {
      stageDates = dateRange(hotel.planned_date, nextHotel.planned_date)
    } else {
      stageDates = [hotel.planned_date]
      const extra = [...new Set(datedPins.map(p => p.planned_date))]
        .filter(d => d > hotel.planned_date).sort()
      stageDates = [...stageDates, ...extra]
    }
    return {
      id: hotel.id, hotel, name: hotel.title,
      dates: stageDates,
      pins: datedPins.filter(p => stageDates.includes(p.planned_date)),
    }
  })

  const covered = new Set(stages.flatMap(s => s.dates))
  const orphans = [...new Set(datedPins.map(p => p.planned_date))]
    .filter(d => !covered.has(d)).sort()
  if (orphans.length > 0) {
    stages.unshift({ id: 'orphan', hotel: null, name: 'Arrivée',
      dates: orphans, pins: datedPins.filter(p => orphans.includes(p.planned_date)) })
  }

  return stages
}

export default function Agenda({ allPins, onPinUpdated }) {
  const stages = buildStages(allPins)
  const [activeStageIdx, setActiveStageIdx] = useState(0)

  const totalBudget = allPins.reduce((sum, p) => sum + (parseFloat(p.cost_idr) || 0), 0)

  if (stages.length === 0) {
    return (
      <div className="px-6 pb-6 page-safe-top">
        <h1 className="text-3xl font-black text-[#2C1A0E] mb-6">Mon Itinéraire</h1>
        <div className="warm-card p-8 rounded-2xl text-center">
          <CalendarDays size={32} className="mx-auto mb-3 text-[#C4A090]" />
          <p className="text-sm font-bold text-[#9C7A6A]">Aucune activité planifiée.</p>
          <p className="text-xs text-[#C4A090] mt-1">Place des pins avec une date sur la carte.</p>
        </div>
      </div>
    )
  }

  const idx = Math.min(activeStageIdx, stages.length - 1)
  const activeStage = stages[idx]
  const gradient = STAGE_GRADIENTS[idx % STAGE_GRADIENTS.length]

  return (
    <div className="pb-4 page-safe-top">

      {/* Header */}
      <div className="px-5 mb-4">
        <h1 className="text-3xl font-black text-[#2C1A0E]">Mon Itinéraire</h1>
        {totalBudget > 0 && (
          <p className="text-sm font-bold text-[#9C7A6A] mt-1">
            Budget total ·{' '}
            <span className="text-[#E8704A] font-black">{totalBudget.toLocaleString()} IDR</span>
            <span className="text-[#C4A090]"> ≈ {idrToEur(totalBudget)} €</span>
          </p>
        )}
      </div>

      {/* Sélecteur d'étapes */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
        {stages.map((stage, i) => {
          const isActive = idx === i
          const g = STAGE_GRADIENTS[i % STAGE_GRADIENTS.length]
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageIdx(i)}
              className="flex-shrink-0 flex flex-col items-start rounded-2xl px-3.5 py-3 active:scale-95"
              style={{
                background: isActive ? g : 'rgba(0,0,0,0.055)',
                boxShadow: isActive ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.30s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white/70' : 'text-[#C4A090]'}`}>
                Étape {i + 1}
              </span>
              <span className={`text-[12px] font-black mt-0.5 whitespace-nowrap ${isActive ? 'text-white' : 'text-[#6B4A3A]'}`}>
                {stage.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Étape active */}
      <div className="px-4">
        <StageCard
          key={activeStage.id}
          stage={activeStage}
          stageIndex={idx}
          gradient={gradient}
          onPinUpdated={onPinUpdated}
        />
      </div>

    </div>
  )
}

function StageCard({ stage, stageIndex, gradient, onPinUpdated }) {
  const [activeDate, setActiveDate] = useState(stage.dates[0] || null)

  const activePins = stage.pins.filter(p => p.planned_date === activeDate)
  const activities = activePins
    .filter(p => p.category !== 'hotel')
    .sort((a, b) => (a.planned_time || '99:99').localeCompare(b.planned_time || '99:99'))
  const dayCost = activePins.reduce((sum, p) => sum + (parseFloat(p.cost_idr) || 0), 0)
  const stageCost = stage.pins.reduce((sum, p) => sum + (parseFloat(p.cost_idr) || 0), 0)

  const range = stage.dates.length > 1
    ? `${fmtMedium(stage.dates[0])} – ${fmtMedium(stage.dates[stage.dates.length - 1])}`
    : stage.dates.length === 1 ? fmtMedium(stage.dates[0]) : ''

  return (
    <div
      className="rounded-3xl overflow-hidden anim-scale-in"
      style={{
        background: 'rgba(255,248,244,0.90)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 6px 28px rgba(140,70,40,0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      {/* Photo header */}
      <div className="relative h-44 overflow-hidden">
        {stage.hotel?.image_url
          ? <img
              src={stage.hotel.image_url}
              alt={stage.name}
              className="w-full h-full object-cover anim-ken-burns"
            />
          : <div className="w-full h-full" style={{ background: gradient }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-2.5 py-1">
          <p className="text-white text-[10px] font-black uppercase tracking-widest">
            Étape {stageIndex + 1} · {stage.dates.length} jour{stage.dates.length !== 1 ? 's' : ''}
          </p>
        </div>

        {stageCost > 0 && (
          <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1">
            <p className="text-white text-[10px] font-black">{stageCost.toLocaleString()} IDR</p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <p className="text-white text-[22px] font-black leading-tight">{stage.name}</p>
          {range && <p className="text-white/65 text-[11px] font-bold mt-0.5 capitalize">{range}</p>}
        </div>
      </div>

      {/* Day tabs */}
      {stage.dates.length > 0 && (
        <div className="flex gap-1.5 px-4 py-3 overflow-x-auto no-scrollbar border-b border-black/5">
          {stage.dates.map((date) => {
            const isActive = activeDate === date
            return (
              <button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`flex-shrink-0 text-[11px] font-black px-3 py-1.5 rounded-full
                  ${isActive ? 'text-white' : 'bg-black/6 text-[#9C7A6A]'}`}
                style={{
                  background: isActive ? gradient : undefined,
                  transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {fmtShort(date)}
              </button>
            )
          })}
        </div>
      )}

      {/* Day content — key change replays activity stagger */}
      <div key={activeDate} className="px-4 py-3 space-y-2">
        {activities.length === 0 ? (
          <p className="text-center text-xs text-[#C4A090] font-medium py-3 anim-fade-up">
            Aucune activité ce jour
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-[9px] top-3 bottom-3 w-px bg-[#E8C4B0]/45" />
            <div className="space-y-2">
              {activities.map((pin, i) => (
                <ActivityRow key={pin.id} pin={pin} index={i} onUnschedule={onPinUpdated} />
              ))}
            </div>
          </div>
        )}

        {dayCost > 0 && (
          <div
            className="flex justify-between items-center rounded-2xl px-4 py-2.5 mt-1 anim-fade-up"
            style={{
              background: 'rgba(232,112,74,0.08)',
              animationDelay: `${activities.length * 55 + 40}ms`,
            }}
          >
            <p className="text-xs font-black text-[#E8704A]">Budget du jour</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-[#E8704A]">{dayCost.toLocaleString()} IDR</span>
              <span className="text-xs font-bold text-[#9C7A6A]">≈ {idrToEur(dayCost)} €</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityRow({ pin, index, onUnschedule }) {
  const meta = getCatMeta(pin.category)
  const time = pin.planned_time ? String(pin.planned_time).slice(0, 5) : null

  const handleUnschedule = async () => {
    await supabase.from('pins').update({ planned_date: null, planned_time: null }).eq('id', pin.id)
    onUnschedule?.()
  }

  return (
    <div
      className="flex items-center gap-3 anim-fade-up"
      style={{ '--i': index, animationDelay: `${index * 55}ms` }}
    >
      <div
        className="w-[18px] h-[18px] rounded-full flex-shrink-0 z-10 border-2 border-white flex items-center justify-center anim-pop"
        style={{ background: meta.color, animationDelay: `${index * 55 + 80}ms` }}
      >
        <meta.Icon size={9} color="white" strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0 bg-white/55 border border-white/70 rounded-2xl overflow-hidden">
        <div className="flex items-stretch">
          <div className="flex-1 min-w-0 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-black text-[#2C1A0E] truncate">{pin.title}</p>
                <p className="text-[10px] font-bold text-[#9C7A6A] mt-0.5">{meta.label}</p>
                {pin.notes && <p className="text-[11px] text-[#C4A090] truncate mt-0.5">{pin.notes}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {time && (
                  <span
                    className="flex items-center gap-1 text-[11px] font-black text-[#E8704A] rounded-full px-2 py-0.5"
                    style={{ background: 'rgba(232,112,74,0.12)' }}
                  >
                    <Clock size={8} />
                    {time}
                  </span>
                )}
                {pin.cost_idr > 0 && (
                  <span className="text-[10px] font-bold text-[#9C7A6A]">
                    {parseFloat(pin.cost_idr).toLocaleString()} IDR
                  </span>
                )}
                <button
                  onClick={handleUnschedule}
                  title="Retirer de l'agenda"
                  className="text-[#C4A090] active:text-[#E8704A] transition-colors mt-0.5"
                >
                  <Bookmark size={11} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
          {pin.image_url && (
            <img src={pin.image_url} alt={pin.title} className="w-16 flex-shrink-0 object-cover" />
          )}
        </div>
      </div>
    </div>
  )
}
