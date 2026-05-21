// Seed des 7 étapes du voyage — à exécuter une seule fois
const SUPA_URL  = 'https://vfncsrpcmdmomxvbrdtd.supabase.co'
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbmNzcnBjbWRtb214dmJyZHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDMzOTgsImV4cCI6MjA5NDkxOTM5OH0.VvbLv3WgF1PHXcmjoksOLm9OAkdu-bACMcYawb-hM4E'

// Photos optimisées pour zone header h-44 (176px hauteur, largeur mobile ~390px)
// Paramètres Unsplash: w=1600&h=700&fit=crop&crop=center&q=95 → panoramique HD
const stages = [
  {
    title: 'Uluwatu',
    planned_date: '2026-05-30',
    lat: -8.8291, lng: 115.0849,
    notes: 'Sud de Bali — falaises, temple, surf',
    image_url: 'https://images.unsplash.com/photo-1604009506718-f2cdc8571516?w=1600&h=700&fit=crop&crop=center&q=95',
  },
  {
    title: 'Ubud',
    planned_date: '2026-06-02',
    lat: -8.5069, lng: 115.2625,
    notes: 'Rizières, temples, forêt des singes',
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&h=700&fit=crop&crop=center&q=95',
  },
  {
    title: 'Sidemen',
    planned_date: '2026-06-04',
    lat: -8.5085, lng: 115.5565,
    notes: 'Est de Bali — vue sur le Mont Agung',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=700&fit=crop&crop=center&q=95',
  },
  {
    title: 'Nusa Penida',
    planned_date: '2026-06-06',
    lat: -8.7275, lng: 115.5443,
    notes: 'Île — Kelingking Beach, manta rays',
    image_url: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1600&h=700&fit=crop&crop=top&q=95',
  },
  {
    title: 'Îles Gilis',
    planned_date: '2026-06-08',
    lat: -8.3524, lng: 116.0375,
    notes: 'Gili Trawangan — snorkeling, tortues',
    image_url: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=1600&h=700&fit=crop&crop=center&q=95',
  },
  {
    title: 'Lombok',
    planned_date: '2026-06-10',
    lat: -8.8873, lng: 116.3058,
    notes: 'Kuta Lombok — plages sauvages, Rinjani',
    image_url: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=1600&h=700&fit=crop&crop=center&q=95',
  },
  {
    title: 'Canggu',
    planned_date: '2026-06-14',
    lat: -8.6478, lng: 115.1385,
    notes: 'Nord-ouest — surf, beach clubs, rice fields',
    image_url: 'https://images.unsplash.com/photo-1559628233-100c798642d4?w=1600&h=700&fit=crop&crop=center&q=95',
  },
]

const pins = stages.map(s => ({
  ...s,
  category: 'hotel',
  status: 'todo',
  cost_idr: null,
  website_url: null,
  planned_time: null,
}))

const res = await fetch(`${SUPA_URL}/rest/v1/pins`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation',
  },
  body: JSON.stringify(pins),
})

const data = await res.json()

if (!res.ok) {
  console.error('❌ Erreur Supabase:', data)
  process.exit(1)
}

console.log(`✅ ${data.length} étapes insérées :`)
data.forEach(p => console.log(`   — ${p.title} (${p.planned_date})  id: ${p.id}`))
