'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Drawer } from 'vaul'
import { ChevronLeft, ChevronRight, BedDouble, ExternalLink, CalendarDays, Clock, Pencil, Trash2, Camera, AlertCircle, X, Waves, UtensilsCrossed, TreePine, Landmark, MoreHorizontal, Umbrella, Music, ShoppingBag, Coffee, Star, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { idrToEur } from '../lib/currency'

const CATEGORIES = [
  { id: 'hotel',      label: 'Hébergement',    short: 'Hôtel',   color: '#C4826A', Icon: BedDouble },
  { id: 'beach',      label: 'Plage / Surf',   short: 'Plage',   color: '#7EAFC4', Icon: Waves },
  { id: 'restaurant', label: 'Restaurant',     short: 'Resto',   color: '#D4905A', Icon: UtensilsCrossed },
  { id: 'beach_club', label: 'Beach Club',     short: 'B.Club',  color: '#E8A85A', Icon: Umbrella },
  { id: 'nightclub',  label: 'Boîte de nuit', short: 'Nuit',    color: '#8B7AB8', Icon: Music },
  { id: 'nature',     label: 'Cascade / Rando',short: 'Nature',  color: '#8AB48A', Icon: TreePine },
  { id: 'culture',    label: 'Temple / Culture',short: 'Culture',color: '#B08AC4', Icon: Landmark },
  { id: 'other',      label: 'Autre',          short: 'Autre',   color: '#C4A882', Icon: MoreHorizontal },
]

const OTHER_ICONS = [
  { id: 'other',          Icon: MoreHorizontal, label: 'Défaut'   },
  { id: 'other_shopping', Icon: ShoppingBag,    label: 'Shopping' },
  { id: 'other_coffee',   Icon: Coffee,         label: 'Café'     },
  { id: 'other_camera',   Icon: Camera,         label: 'Photo'    },
  { id: 'other_star',     Icon: Star,           label: 'Top'      },
  { id: 'other_health',   Icon: Heart,          label: 'Santé'    },
]

// Normalise les valeurs legacy (food) et variantes other_*
const normCat = (cat) => {
  if (cat === 'food') return 'restaurant'
  if (cat?.startsWith('other_')) return 'other'
  return cat
}

// Lucide SVG path data (24x24 viewBox) inlined for imperative Mapbox marker creation
const ICON_PATHS = {
  hotel:          `<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>`,
  beach:          `<path d="M2 12q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 17q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 7q2.5 2 5 0t5 0 5 0 5 0"/>`,
  restaurant:     `<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>`,
  food:           `<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>`,
  beach_club:     `<path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/>`,
  nightclub:      `<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,
  nature:         `<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>`,
  culture:        `<path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>`,
  other:          `<path d="M5 12h14"/><path d="M12 5v14"/>`,
  other_shopping: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
  other_coffee:   `<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" x2="6" y1="1" y2="4"/><line x1="10" x2="10" y1="1" y2="4"/><line x1="14" x2="14" y1="1" y2="4"/>`,
  other_camera:   `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>`,
  other_star:     `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  other_health:   `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`,
}

const createMarkerElement = (category, color, orderNum = null) => {
  const el = document.createElement('div')
  el.style.cssText = 'width:34px;height:42px;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.22));'
  const paths = ICON_PATHS[category] || ICON_PATHS.other
  const badge = orderNum !== null
    ? `<circle cx="26" cy="7" r="6.5" fill="white" stroke="${color}" stroke-width="1.5"/>
       <text x="26" y="7" text-anchor="middle" dominant-baseline="central" font-size="7" font-weight="900" fill="${color}" font-family="-apple-system,sans-serif">${orderNum}</text>`
    : ''
  el.innerHTML = `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 2C10.4 2 5 7.4 5 14C5 22.5 17 40 17 40C17 40 29 22.5 29 14C29 7.4 23.6 2 17 2Z" fill="${color}"/>
    <g transform="translate(10,7) scale(0.583)" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">${paths}</g>
    ${badge}
  </svg>`
  return el
}

export default function BaliMap({ allPins, onPinSaved }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  const searchSessionRef = useRef(null)
  const searchDebounceRef = useRef(null)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [clickedLocation, setClickedLocation] = useState(null)
  const [selectedPin, setSelectedPin] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')
  const [userCoords, setUserCoords] = useState(null)
  const [travelTimes, setTravelTimes] = useState({ scooter: null, walking: null })
  const [travelFrom, setTravelFrom] = useState(null)
  const [editingPin, setEditingPin] = useState(null)
  const [timeConflict, setTimeConflict] = useState(null)
  
  // NOUVEAU : États pour l'API Stormglass
  const [tideData, setTideData] = useState(null)
  const [isLoadingTide, setIsLoadingTide] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState('all')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [costIdr, setCostIdr] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [hasDate, setHasDate] = useState(false)
  const [plannedDate, setPlannedDate] = useState('')
  const [plannedTime, setPlannedTime] = useState('')
  const [imageFile, setImageFile] = useState(null)

  // 🌊 VRAIE API STORMGLASS : Appel réseau pour les marées
  const fetchRealTides = async (lat, lng, dateStr) => {
    setIsLoadingTide(true)
    try {
      // On prend la date prévue du pin, ou la date du jour par défaut
      const targetDate = dateStr ? new Date(dateStr) : new Date()
      // L'API attend un format strict (ISO)
      const start = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString()
      
      const res = await fetch(`https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start}`, {
        headers: {
          'Authorization': process.env.NEXT_PUBLIC_STORMGLASS_KEY
        }
      })
      const data = await res.json()
      
      // On garde uniquement les marées de la journée demandée
      if (data && data.data) {
        const targetDayString = targetDate.toISOString().split('T')[0]
        const dailyTides = data.data.filter(t => t.time.startsWith(targetDayString))
        setTideData(dailyTides)
      } else {
        setTideData([])
      }
    } catch (err) {
      console.error("Erreur API Marée :", err)
      setTideData([])
    }
    setIsLoadingTide(false)
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserCoords({ lng: position.coords.longitude, lat: position.coords.latitude })
      )
    }
  }, [])

  useEffect(() => {
    if (map.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [115.1889, -8.4095],
      zoom: 9.5
    })

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    })
    map.current.addControl(geolocate, 'bottom-right')
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.current.on('load', () => setIsMapLoaded(true))

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      openCreationForm(lng, lat)
    })
  }, [])

  const openCreationForm = (lng, lat, forcedTitle = '') => {
    setSelectedPin(null)
    setClickedLocation({ lng, lat })
    setTitle(forcedTitle)
    setCategory('other')
    setCostIdr('')
    setWebsiteUrl('')
    setNotes('')
    setHasDate(true)
    setPlannedDate(dateFilter !== 'all' ? dateFilter : '')
    setPlannedTime('')
    setImageFile(null)
    setTravelTimes({ scooter: null, walking: null })
    setTideData(null) // Reset de la marée
    setIsDrawerOpen(true)
  }

  useEffect(() => {
    if (isMapLoaded) renderMarkers(allPins, dateFilter, categoryFilter)
  }, [isMapLoaded, dateFilter, categoryFilter, allPins])

  const renderMarkers = (pins, filter, catFilter = 'all') => {
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Clear previous route layers
    if (map.current.getLayer('route-arrows')) map.current.removeLayer('route-arrows')
    if (map.current.getLayer('route-line')) map.current.removeLayer('route-line')
    if (map.current.getSource('route')) map.current.removeSource('route')

    const filteredPins = filter === 'all' ? pins : pins.filter(p => p.planned_date === filter)
    const visiblePins = catFilter === 'all' ? filteredPins : filteredPins.filter(p => {
      if (catFilter === 'other') return p.category === 'other' || p.category?.startsWith('other_')
      if (catFilter === 'restaurant') return p.category === 'restaurant' || p.category === 'food'
      return p.category === catFilter
    })

    const hotelDuJour = filteredPins.find(p => p.category === 'hotel')
    if (hotelDuJour && map.current) {
      map.current.flyTo({ center: [hotelDuJour.lng, hotelDuJour.lat], zoom: 11, essential: true })
    }

    // Draw itinerary route when a specific day is selected
    if (filter !== 'all') {
      const routePins = filteredPins
        .filter(p => p.category === 'hotel' || p.planned_time)
        .sort((a, b) => {
          if (a.category === 'hotel') return -1
          if (b.category === 'hotel') return 1
          return (a.planned_time || '').localeCompare(b.planned_time || '')
        })

      if (routePins.length >= 2) {
        // Generate arrow image via canvas (▶ glyph not available in Mapbox SDF fonts)
        if (!map.current.hasImage('route-arrow')) {
          const size = 20
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#FF6B4A'
          ctx.beginPath()
          ctx.moveTo(3, 4)
          ctx.lineTo(17, 10)
          ctx.lineTo(3, 16)
          ctx.closePath()
          ctx.fill()
          const { data } = ctx.getImageData(0, 0, size, size)
          map.current.addImage('route-arrow', { width: size, height: size, data })
        }

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: routePins.map(p => [p.lng, p.lat]) }
          }
        })

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#E8704A', 'line-width': 3.5, 'line-opacity': 0.7 }
        })

        map.current.addLayer({
          id: 'route-arrows',
          type: 'symbol',
          source: 'route',
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 55,
            'icon-image': 'route-arrow',
            'icon-size': 0.75,
            'icon-rotation-alignment': 'map',
            'icon-keep-upright': false,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          }
        })
      }
    }

    // Build order map for numbered badges (only in daily view)
    const orderMap = {}
    if (filter !== 'all') {
      const orderedPins = filteredPins
        .filter(p => p.category === 'hotel' || p.planned_time)
        .sort((a, b) => {
          if (a.category === 'hotel') return -1
          if (b.category === 'hotel') return 1
          return (a.planned_time || '').localeCompare(b.planned_time || '')
        })
      orderedPins.forEach((p, i) => { orderMap[p.id] = i + 1 })
    }

    visiblePins.forEach(pin => {
      const catConfig = CATEGORIES.find(c => c.id === pin.category)
        || CATEGORIES.find(c => c.id === normCat(pin.category))
        || CATEGORIES[CATEGORIES.length - 1]
      const orderNum = orderMap[pin.id] ?? null
      const markerEl = createMarkerElement(pin.category, catConfig.color, orderNum)
      const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map.current)

      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedPin(pin)
        calculateTravelTimes(pin, filteredPins)
        
        // 🌊 Lancement de la VRAIE requête de marée
        if (pin.category === 'beach') {
          fetchRealTides(pin.lat, pin.lng, pin.planned_date)
        } else {
          setTideData(null)
        }

        setIsDrawerOpen(true)
      })

      markersRef.current.push(marker)
    })
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    clearTimeout(searchDebounceRef.current)

    if (query.trim().length < 2) { setSearchResults([]); return }

    // Photon (Komoot) — Elasticsearch sur OSM, autocomplete précis avec proximité
    // bbox: lon_min,lat_min,lon_max,lat_max
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=-8.4095&lon=115.1889&limit=10&lang=en&bbox=114.4,-8.9,115.7,-8.0`
        )
        const data = await res.json()
        setSearchResults(data.features || [])
      } catch (err) {
        console.error(err)
      }
    }, 300)
  }

  const selectSearchResult = (result) => {
    setSearchResults([])
    setSearchQuery('')
    const [lng, lat] = result.geometry.coordinates
    const p = result.properties
    const name = p.name || (p.housenumber ? `${p.housenumber} ${p.street}` : p.street) || ''
    map.current.flyTo({ center: [lng, lat], zoom: 17, essential: true })
    openCreationForm(lng, lat, name)
  }

  const calculateTravelTimes = async (targetPin, currentDayPins) => {
    setTravelTimes({ scooter: 'Calcul...', walking: 'Calcul...' })
    setTravelFrom(null)

    // Find the activity just before targetPin in the day's chronological order
    const sorted = [...currentDayPins]
      .filter(p => p.category === 'hotel' || p.planned_time)
      .sort((a, b) => {
        if (a.category === 'hotel') return -1
        if (b.category === 'hotel') return 1
        return (a.planned_time || '').localeCompare(b.planned_time || '')
      })
    const idx = sorted.findIndex(p => p.id === targetPin.id)
    const prevPin = idx > 0 ? sorted[idx - 1] : null

    let startLng, startLat, fromLabel
    if (prevPin) {
      startLng = prevPin.lng
      startLat = prevPin.lat
      fromLabel = prevPin.title
    } else if (userCoords?.lng) {
      startLng = userCoords.lng
      startLat = userCoords.lat
      fromLabel = 'Ma position'
    } else {
      const hotel = currentDayPins.find(p => p.category === 'hotel' && p.id !== targetPin.id)
      if (hotel) { startLng = hotel.lng; startLat = hotel.lat; fromLabel = hotel.title }
    }

    if (!startLng || !startLat) {
      setTravelTimes({ scooter: '—', walking: '—' })
      return
    }
    setTravelFrom(fromLabel)

    try {
      const [scooterRes, walkingRes] = await Promise.all([
        fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${targetPin.lng},${targetPin.lat}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&overview=false`),
        fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${startLng},${startLat};${targetPin.lng},${targetPin.lat}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&overview=false`)
      ])
      const [scooterData, walkingData] = await Promise.all([scooterRes.json(), walkingRes.json()])
      const scooterMin = scooterData.routes?.[0] ? Math.round(scooterData.routes[0].duration / 60) : null
      const walkingMin = walkingData.routes?.[0] ? Math.round(walkingData.routes[0].duration / 60) : null
      setTravelTimes({
        scooter: scooterMin ? `${scooterMin} min` : 'N/A',
        walking: walkingMin ? `${walkingMin} min` : 'N/A'
      })
    } catch {
      setTravelTimes({ scooter: 'Erreur', walking: 'Erreur' })
    }
  }

  const handleSavePin = async () => {
    if (!title.trim()) return alert("Il faut un nom pour ce repère !")

    if (hasDate && plannedDate && plannedTime && category !== 'hotel') {
      const conflict = allPins.find(p =>
        p.planned_date === plannedDate &&
        String(p.planned_time).slice(0, 5) === plannedTime &&
        p.id !== editingPin?.id
      )
      if (conflict) { setTimeConflict(conflict); return }
    }

    setIsSaving(true)
    let finalImageUrl = editingPin?.image_url ?? null

    if (imageFile) {
      setUploadStatus('Upload de la photo...')
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
        finalImageUrl = publicUrl
      }
    }

    setUploadStatus(editingPin ? 'Mise à jour...' : 'Sauvegarde...')
    const pinData = {
      title, category,
      cost_idr: costIdr ? parseFloat(costIdr) : null,
      image_url: finalImageUrl,
      website_url: websiteUrl, notes,
      planned_date: hasDate ? (plannedDate || null) : null,
      planned_time: hasDate && category !== 'hotel' ? (plannedTime || null) : null,
      lat: clickedLocation.lat, lng: clickedLocation.lng, status: 'todo'
    }

    const { error } = editingPin
      ? await supabase.from('pins').update(pinData).eq('id', editingPin.id)
      : await supabase.from('pins').insert([pinData])

    setIsSaving(false)
    setUploadStatus('')
    setEditingPin(null)

    if (!error) {
      setIsDrawerOpen(false)
      onPinSaved()
    } else {
      alert('Erreur : ' + error.message)
    }
  }

  const handleEdit = () => {
    const pin = selectedPin
    setTitle(pin.title)
    setCategory(pin.category)
    setCostIdr(pin.cost_idr ?? '')
    setWebsiteUrl(pin.website_url ?? '')
    setNotes(pin.notes ?? '')
    setHasDate(!!pin.planned_date)
    setPlannedDate(pin.planned_date ?? '')
    setPlannedTime(pin.planned_time ? String(pin.planned_time).slice(0, 5) : '')
    setClickedLocation({ lat: pin.lat, lng: pin.lng })
    setEditingPin(pin)
    setSelectedPin(null)
    setImageFile(null)
    setTideData(null)
    setTravelTimes({ scooter: null, walking: null })
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${selectedPin.title}" ?`)) return
    const { error } = await supabase.from('pins').delete().eq('id', selectedPin.id)
    if (!error) {
      setIsDrawerOpen(false)
      setSelectedPin(null)
      onPinSaved()
    } else {
      alert('Erreur : ' + error.message)
    }
  }

  const navDates = ['all', ...[...new Set(allPins.map(p => p.planned_date).filter(Boolean))].sort()]
  const navIndex = navDates.indexOf(dateFilter)
  const hotelDuJour = dateFilter !== 'all'
    ? allPins.find(p => p.planned_date === dateFilter && p.category === 'hotel')
    : null

  return (
    <>
      {/* ── OVERLAYS CARTE ── */}
      <div className="absolute left-4 right-4 z-10 max-w-md mx-auto space-y-2" style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}>

        {/* Barre de recherche */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center px-4 py-1 gap-2">
            <svg className="w-4 h-4 text-[#C4A090] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Chercher à Bali…"
              className="w-full bg-transparent border-0 text-[#2C1A0E] font-semibold py-3 focus:outline-none placeholder:text-[#C4A090]"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="border-t border-white/40 max-h-52 overflow-y-auto">
              {searchResults.map((res, i) => {
                const p = res.properties
                const name = p.name || (p.housenumber ? `${p.housenumber} ${p.street}` : p.street) || '—'
                const sub = [p.city || p.district || p.locality, p.state].filter(Boolean).join(', ')
                return (
                  <button
                    key={`${p.osm_id}-${i}`}
                    onClick={() => selectSearchResult(res)}
                    className="w-full text-left px-4 py-3.5 active:bg-white/60 border-b border-white/30 last:border-0 transition-colors"
                  >
                    <p className="text-xs font-black text-[#2C1A0E] truncate">{name}</p>
                    {sub && (
                      <p className="text-[10px] font-medium text-[#9C7A6A] truncate mt-0.5 capitalize">{sub}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCategoryFilter('all')}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black transition-all active:scale-95"
            style={categoryFilter === 'all'
              ? { background: '#2C1A0E', color: 'white', boxShadow: '0 2px 10px rgba(44,26,14,0.3)' }
              : { background: 'rgba(255,250,246,0.78)', color: '#9C7A6A', border: '1px solid rgba(255,255,255,0.62)' }}
          >
            Tout
          </button>
          {CATEGORIES.map((cat) => {
            const isActive = categoryFilter === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(isActive ? 'all' : cat.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black transition-all active:scale-95"
                style={isActive
                  ? { background: cat.color, color: 'white', boxShadow: `0 2px 10px ${cat.color}55` }
                  : { background: 'rgba(255,250,246,0.78)', color: '#9C7A6A', border: '1px solid rgba(255,255,255,0.62)' }}
              >
                <cat.Icon size={10} strokeWidth={2.2} />
                {cat.short}
              </button>
            )
          })}
        </div>

        {/* Navigateur de dates */}
        <div className="flex items-center justify-center gap-2">
          <div className="glass flex items-center gap-1 rounded-full px-1 py-1">
            <button
              onClick={() => navIndex > 0 && setDateFilter(navDates[navIndex - 1])}
              disabled={navIndex === 0}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-25 active:bg-white/70"
            >
              <ChevronLeft size={16} className="text-[#9C7A6A]" />
            </button>
            <span className="text-xs font-black text-[#2C1A0E] w-[72px] text-center select-none">
              {dateFilter === 'all'
                ? 'Vue globale'
                : new Date(dateFilter + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <button
              onClick={() => navIndex < navDates.length - 1 && setDateFilter(navDates[navIndex + 1])}
              disabled={navIndex === navDates.length - 1}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-25 active:bg-white/70"
            >
              <ChevronRight size={16} className="text-[#9C7A6A]" />
            </button>
          </div>

          {hotelDuJour && (
            <button
              onClick={() => map.current?.flyTo({ center: [hotelDuJour.lng, hotelDuJour.lat], zoom: 13, essential: true })}
              className="glass flex items-center gap-1.5 text-[#C4826A] text-xs font-black px-3 py-2 rounded-full transition-all active:scale-95"
            >
              <BedDouble size={13} />
              Hôtel
            </button>
          )}
        </div>
      </div>

      {/* Carte Mapbox */}
      <div style={{ width: '100vw', height: '100vh' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── DRAWER ── */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={(open) => { setIsDrawerOpen(open); if (!open) { setEditingPin(null) } }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-[#2C1A0E]/25 z-40 backdrop-blur-[2px]" />
          <Drawer.Content
            className="flex flex-col fixed bottom-0 left-0 right-0 z-50 h-[82vh] max-w-md mx-auto rounded-t-[32px] overflow-hidden"
            style={{
              background: 'rgba(255, 248, 244, 0.92)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderTop: '1px solid rgba(255,255,255,0.68)',
              boxShadow: '0 -12px 50px rgba(140,70,40,0.14), inset 0 1px 0 rgba(255,255,255,0.60)',
            }}
          >
            <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-[#D4B4A4]/55 mt-4 mb-1" />

            <div className="overflow-y-auto px-6 pb-nav-safe text-[#2C1A0E]">

              {selectedPin ? (
                /* ── VUE PIN ── */
                <div className="space-y-4 pt-2">

                  {selectedPin.image_url && (
                    <img src={selectedPin.image_url} alt={selectedPin.title} className="w-full h-52 object-cover rounded-2xl" />
                  )}

                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-[#F0E4DA] text-[#9C7A6A] px-3 py-1 rounded-full">
                        {CATEGORIES.find(c => c.id === selectedPin.category)?.label || 'Point'}
                      </span>
                      <Drawer.Title className="font-black text-[26px] leading-tight mt-2 text-[#2C1A0E]">
                        {selectedPin.title}
                      </Drawer.Title>
                    </div>
                    <div className="flex gap-1.5 pt-1 flex-shrink-0">
                      <button
                        onClick={handleEdit}
                        className="w-11 h-11 rounded-full bg-white/60 border border-white/70 flex items-center justify-center text-[#9C7A6A] active:scale-90 transition-all"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-11 h-11 rounded-full flex items-center justify-center text-red-400 active:scale-90 transition-all"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {(selectedPin.planned_date || selectedPin.planned_time) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedPin.planned_date && (
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-[#F0E4DA] text-[#9C7A6A] px-3 py-1.5 rounded-full">
                          <CalendarDays size={11} />
                          {new Date(selectedPin.planned_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                        </span>
                      )}
                      {selectedPin.planned_time && (
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-[#E8704A]/10 text-[#E8704A] px-3 py-1.5 rounded-full">
                          <Clock size={11} />
                          {String(selectedPin.planned_time).slice(0, 5)}
                        </span>
                      )}
                    </div>
                  )}

                  {selectedPin.website_url && (
                    <a
                      href={selectedPin.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-[#9C7A6A] font-semibold active:bg-white/70 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Voir le site
                    </a>
                  )}

                  {tideData !== null && (
                    <div className="warm-card p-4 rounded-2xl space-y-2.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9C7A6A]">Marées du jour</p>
                      {isLoadingTide ? (
                        <p className="text-sm font-semibold text-[#C4A090]">Chargement…</p>
                      ) : tideData.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {tideData.map((tide, idx) => (
                            <div key={idx} className="bg-white/60 border border-white/60 p-2.5 rounded-xl text-center">
                              <p className="text-[10px] font-black uppercase text-[#9C7A6A]">
                                {tide.type === 'high' ? 'Haute' : 'Basse'}
                              </p>
                              <p className="text-base font-black text-[#2C1A0E]">
                                {new Date(tide.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[#C4A090]">Aucune donnée pour ce spot.</p>
                      )}
                    </div>
                  )}

                  <div className="warm-card p-4 rounded-2xl space-y-2.5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9C7A6A]">Temps de trajet</p>
                      {travelFrom && (
                        <p className="text-[11px] font-bold text-[#C4A090] mt-0.5 truncate">depuis · {travelFrom}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/60 border border-white/60 p-2.5 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-[#9C7A6A]">Scooter</p>
                        <p className="text-lg font-black text-[#2C1A0E]">{travelTimes.scooter || '--'}</p>
                      </div>
                      <div className="bg-white/60 border border-white/60 p-2.5 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-[#9C7A6A]">À pied</p>
                        <p className="text-lg font-black text-[#2C1A0E]">{travelTimes.walking || '--'}</p>
                      </div>
                    </div>
                  </div>

                  {selectedPin.cost_idr > 0 && (
                    <div className="warm-card p-4 rounded-2xl flex justify-between items-center">
                      <p className="text-sm font-black text-[#2C1A0E]">{parseFloat(selectedPin.cost_idr).toLocaleString()} IDR</p>
                      <p className="text-sm font-bold text-[#E8704A]">≈ {idrToEur(selectedPin.cost_idr, 2)} €</p>
                    </div>
                  )}

                  {selectedPin.notes && (
                    <div className="warm-card p-4 rounded-2xl text-sm text-[#6B4A3A] font-medium leading-relaxed">
                      {selectedPin.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <a href={`https://grab.onelink.me/2734612351?pid=inapp&c=open_maps&drop_lat=${selectedPin.lat}&drop_lng=${selectedPin.lng}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 bg-[#00B14F] text-white text-center font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-transform shadow-[0_4px_16px_rgba(0,177,79,0.28)]">
                      Grab
                    </a>
                    <a href={`gojek://intent/map?lat=${selectedPin.lat}&lng=${selectedPin.lng}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 bg-[#00AA13] text-white text-center font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-transform shadow-[0_4px_16px_rgba(0,170,19,0.28)]">
                      Gojek
                    </a>
                  </div>

                </div>
              ) : (
                /* ── FORMULAIRE ── */
                <div className="space-y-3 pt-2">
                  <Drawer.Title className="font-black text-2xl text-[#2C1A0E]">
                    {editingPin ? 'Modifier le spot' : 'Nouveau spot'}
                  </Drawer.Title>

                  {/* ── Photo en haut ── */}
                  <label className="block cursor-pointer">
                    {(imageFile || editingPin?.image_url) ? (
                      <div className="relative h-40 rounded-2xl overflow-hidden group">
                        <img
                          src={imageFile ? URL.createObjectURL(imageFile) : editingPin.image_url}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-black">Changer la photo</p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="h-28 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors"
                        style={{ border: '2px dashed #E8C4B0', background: 'rgba(255,240,232,0.35)' }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,112,74,0.12)' }}>
                          <Camera size={18} className="text-[#E8704A]" />
                        </div>
                        <p className="text-[11px] font-black text-[#9C7A6A]">Ajouter une photo</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="hidden" />
                  </label>

                  {/* ── Nom ── */}
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nom du lieu *"
                    className="warm-input w-full"
                  />

                  {/* ── Catégorie colorée ── */}
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => {
                      const isActive = category === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className="flex items-center gap-2.5 py-2.5 px-3 rounded-2xl text-xs font-black text-left transition-all duration-200"
                          style={isActive ? {
                            background: cat.color,
                            border: '1.5px solid transparent',
                            color: 'white',
                            boxShadow: `0 4px 16px ${cat.color}60`
                          } : {
                            background: `${cat.color}18`,
                            border: `1.5px solid ${cat.color}40`,
                            color: cat.color
                          }}
                        >
                          <cat.Icon size={13} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                          {cat.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* ── Palette icône pour "Autre" ── */}
                  {(category === 'other' || category.startsWith('other_')) && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9C7A6A] mb-2 px-1">Personnaliser l'icône</p>
                      <div className="flex gap-2 flex-wrap">
                        {OTHER_ICONS.map(({ id, Icon: OtherIcon, label }) => {
                          const isActive = category === id
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setCategory(id)}
                              className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-[10px] font-black transition-all active:scale-95"
                              style={isActive ? {
                                background: '#C4A882',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(196,168,130,0.40)'
                              } : {
                                background: 'rgba(196,168,130,0.12)',
                                border: '1.5px solid rgba(196,168,130,0.30)',
                                color: '#C4A882'
                              }}
                            >
                              <OtherIcon size={16} strokeWidth={isActive ? 2.5 : 2} />
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Toggle date / boîte à idées ── */}
                  <div className="bg-[#F0E4DA]/60 rounded-full p-1 flex">
                    <button
                      type="button"
                      onClick={() => setHasDate(true)}
                      className={`flex-1 text-xs font-black py-2 px-3 rounded-full transition-all duration-200 flex items-center justify-center gap-1.5
                        ${hasDate ? 'bg-white shadow text-[#E8704A]' : 'text-[#9C7A6A]'}`}
                    >
                      <CalendarDays size={11} />
                      Caler une date
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHasDate(false); setPlannedDate(''); setPlannedTime(''); setTimeConflict(null) }}
                      className={`flex-1 text-xs font-black py-2 px-3 rounded-full transition-all duration-200
                        ${!hasDate ? 'bg-white shadow text-[#2C1A0E]' : 'text-[#9C7A6A]'}`}
                    >
                      Boîte à idées
                    </button>
                  </div>

                  {/* ── Date + heure ── */}
                  {hasDate && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={plannedDate}
                        onChange={(e) => setPlannedDate(e.target.value)}
                        className="warm-input flex-1"
                      />
                      {category !== 'hotel' && (
                        <input
                          type="time"
                          value={plannedTime}
                          onChange={(e) => { setPlannedTime(e.target.value); setTimeConflict(null) }}
                          className="warm-input flex-1"
                        />
                      )}
                    </div>
                  )}

                  {/* ── Popup conflit d'horaire ── */}
                  {timeConflict && (
                    <div
                      className="flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}
                    >
                      <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-red-600">Créneau déjà pris</p>
                        <p className="text-[10px] text-red-400 mt-0.5 truncate">
                          "{timeConflict.title}" est déjà prévu à {String(timeConflict.planned_time).slice(0, 5)}
                        </p>
                      </div>
                      <button onClick={() => setTimeConflict(null)} className="text-red-300 flex-shrink-0 mt-0.5">
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {/* ── Coût ── */}
                  <div className="relative">
                    <input
                      type="number"
                      value={costIdr}
                      onChange={(e) => setCostIdr(e.target.value)}
                      placeholder="Coût estimé (IDR)"
                      className="warm-input w-full"
                      style={{ paddingRight: '4.5rem' }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#C4A090]">
                      ≈ {idrToEur(costIdr, 2)} €
                    </span>
                  </div>

                  {/* ── Site web ── */}
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="Site web (optionnel)"
                    className="warm-input w-full"
                  />

                  {/* ── Notes ── */}
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes perso…"
                    rows={2}
                    className="warm-input w-full resize-none"
                  />

                  <button
                    onClick={handleSavePin}
                    disabled={isSaving}
                    className="w-full font-black py-4 rounded-2xl text-white text-sm tracking-wide disabled:opacity-50 active:scale-95 transition-all shadow-[0_8px_24px_rgba(232,112,74,0.38)]"
                    style={{ background: 'linear-gradient(135deg,#E8704A,#F5956A)' }}
                  >
                    {isSaving ? (uploadStatus || 'Enregistrement…') : editingPin ? 'Enregistrer les modifications' : 'Ajouter au carnet'}
                  </button>
                </div>
              )}

            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}