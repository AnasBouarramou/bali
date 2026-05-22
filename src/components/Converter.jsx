'use client'

import { useState } from 'react'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'

import { IDR_PER_EUR } from '../lib/currency'

const QUICK_IDR = [
  { label: '50K',   value: 50_000 },
  { label: '100K',  value: 100_000 },
  { label: '200K',  value: 200_000 },
  { label: '500K',  value: 500_000 },
  { label: '1M',    value: 1_000_000 },
  { label: '2M',    value: 2_000_000 },
]

const REFS = [
  { label: 'Eau minérale (1,5L)',     idr: 5_000 },
  { label: 'Nasi goreng warung',      idr: 30_000 },
  { label: 'Café local',              idr: 20_000 },
  { label: 'Bintang (bière)',         idr: 35_000 },
  { label: 'Plat resto moyen',        idr: 80_000 },
  { label: 'Scooter / jour',          idr: 70_000 },
  { label: 'Taxi Gojek (5 km)',       idr: 25_000 },
  { label: 'Entrée temple',           idr: 50_000 },
  { label: 'Massage 1h',              idr: 150_000 },
  { label: 'Beach club sunset',       idr: 500_000 },
]

const fmt = (n) => Math.round(n).toLocaleString('fr-FR')

export default function Converter() {
  const [idr, setIdr] = useState('')
  const [eur, setEur] = useState('')

  const onIdrChange = (v) => {
    setIdr(v)
    const n = parseFloat(v.replace(/\s/g, '').replace(',', '.'))
    setEur(isNaN(n) ? '' : (n / IDR_PER_EUR).toFixed(2))
  }

  const onEurChange = (v) => {
    setEur(v)
    const n = parseFloat(v.replace(/\s/g, '').replace(',', '.'))
    setIdr(isNaN(n) ? '' : Math.round(n * IDR_PER_EUR).toString())
  }

  const pickQuick = (val) => {
    setIdr(val.toString())
    setEur((val / IDR_PER_EUR).toFixed(2))
  }

  const reset = () => { setIdr(''); setEur('') }

  return (
    <div className="px-5 pb-10 space-y-5 page-safe-top">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[#2C1A0E]">Convertisseur</h1>
        <button onClick={reset} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.055)' }}>
          <RefreshCw size={14} className="text-[#9C7A6A]" />
        </button>
      </div>

      {/* Rate info */}
      <p className="text-[11px] font-bold text-[#C4A090]">1 EUR ≈ {IDR_PER_EUR.toLocaleString('fr-FR')} IDR</p>

      {/* Converter card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,248,244,0.92)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: '0 6px 28px rgba(140,70,40,0.10)',
        }}
      >
        {/* IDR field */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#C4A090] mb-1.5">Roupies indonésiennes</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#9C7A6A] w-8">Rp</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={idr}
              onChange={e => onIdrChange(e.target.value)}
              className="flex-1 text-3xl font-black text-[#2C1A0E] bg-transparent outline-none placeholder:text-[#D4B4A0] min-w-0"
            />
          </div>
          {idr && (
            <p className="text-xs text-[#C4A090] font-bold mt-1 pl-11">
              {fmt(parseFloat(idr))} IDR
            </p>
          )}
        </div>

        {/* Divider with swap icon */}
        <div className="flex items-center gap-3 px-5 py-1">
          <div className="flex-1 h-px bg-[#E8D0C4]/50" />
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#E8704A,#F5956A)', boxShadow: '0 2px 8px rgba(232,112,74,0.35)' }}
          >
            <ArrowLeftRight size={12} color="white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 h-px bg-[#E8D0C4]/50" />
        </div>

        {/* EUR field */}
        <div className="px-5 pt-4 pb-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#C4A090] mb-1.5">Euros</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#9C7A6A] w-8">€</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={eur}
              onChange={e => onEurChange(e.target.value)}
              className="flex-1 text-3xl font-black text-[#2C1A0E] bg-transparent outline-none placeholder:text-[#D4B4A0] min-w-0"
            />
          </div>
          {eur && (
            <p className="text-xs text-[#C4A090] font-bold mt-1 pl-11">
              {parseFloat(eur).toFixed(2)} €
            </p>
          )}
        </div>
      </div>

      {/* Quick IDR picks */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#C4A090] mb-2.5">Montants rapides IDR</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_IDR.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => pickQuick(value)}
              className="rounded-2xl py-3 flex flex-col items-center gap-0.5 transition-all active:scale-95"
              style={{ background: 'rgba(0,0,0,0.045)' }}
            >
              <span className="text-sm font-black text-[#2C1A0E]">{label}</span>
              <span className="text-[10px] font-bold text-[#9C7A6A]">≈ {(value / IDR_PER_EUR).toFixed(2)} €</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reference prices */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#C4A090] mb-2.5">Prix de référence Bali</p>
        <div
          className="rounded-3xl overflow-hidden divide-y"
          style={{
            background: 'rgba(255,248,244,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.65)',
            boxShadow: '0 4px 20px rgba(140,70,40,0.08)',
            divideColor: 'rgba(232,208,196,0.3)',
          }}
        >
          {REFS.map(({ label, idr: refIdr }, i) => (
            <button
              key={i}
              onClick={() => pickQuick(refIdr)}
              className="w-full flex items-center justify-between px-4 py-3 transition-all active:bg-black/5"
              style={{ borderTop: i > 0 ? '1px solid rgba(232,208,196,0.25)' : 'none' }}
            >
              <span className="text-sm font-bold text-[#2C1A0E] text-left">{label}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-black text-[#E8704A]">{refIdr.toLocaleString('fr-FR')} Rp</span>
                <span className="text-xs font-bold text-[#9C7A6A] w-12 text-right">≈ {(refIdr / IDR_PER_EUR).toFixed(2)} €</span>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
