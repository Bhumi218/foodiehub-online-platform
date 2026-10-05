import React, { useEffect, useRef, useState } from 'react';
import { Order } from '../../types';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Bike,
  Store,
  Compass,
  Maximize2,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

interface LiveDeliveryMapProps {
  order: Order;
  className?: string;
}

export const LiveDeliveryMap: React.FC<LiveDeliveryMapProps> = ({ order, className = '' }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Derived or default coordinates
  const restLat = order.restaurantLat || 28.625;
  const restLng = order.restaurantLng || 77.205;
  const custLat = order.deliveryLat || 28.608;
  const custLng = order.deliveryLng || 77.225;

  // Local simulated rider coords if not yet in order document
  const [simulatedPct, setSimulatedPct] = useState<number>(() => {
    if (order.riderStatus === 'delivered' || order.orderStatus === 'DELIVERED') return 1;
    if (order.riderStatus === 'arriving') return 0.85;
    if (order.riderStatus === 'on_the_way' || order.orderStatus === 'OUT_FOR_DELIVERY') return 0.45;
    if (order.riderStatus === 'picked_up') return 0.2;
    return 0.05;
  });

  // Calculate rider coordinate along the curved route
  const getInterpolatedCoords = (pct: number) => {
    // Add a natural curve to make it look like real city roads instead of a straight line
    const curveOffset = Math.sin(pct * Math.PI) * 0.003;
    const lat = restLat + (custLat - restLat) * pct + curveOffset * 0.5;
    const lng = restLng + (custLng - restLng) * pct + curveOffset;
    return { lat, lng };
  };

  const currentCoords =
    order.riderCurrentLat && order.riderCurrentLng
      ? { lat: order.riderCurrentLat, lng: order.riderCurrentLng }
      : getInterpolatedCoords(simulatedPct);

  // Smooth periodic animation when out for delivery
  useEffect(() => {
    const isOut =
      order.orderStatus === 'OUT_FOR_DELIVERY' ||
      order.riderStatus === 'on_the_way' ||
      order.riderStatus === 'picked_up';

    if (!isOut) return;

    const interval = setInterval(() => {
      setSimulatedPct((prev) => {
        if (prev >= 0.95) return 0.95;
        return Number((prev + 0.015).toFixed(4));
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [order.orderStatus, order.riderStatus]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy any existing instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Sleek CartoDB Positron / OSM tiles with Zomato food delivery feel
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Restaurant Icon
      const restaurantIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-10 h-10 rounded-2xl bg-amber-600 text-white shadow-xl flex items-center justify-center ring-4 ring-amber-100 border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="absolute -bottom-6 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-md">
              ${order.restaurantName || 'Restaurant'}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([restLat, restLng], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup(`<b>${order.restaurantName || 'Restaurant Kitchen'}</b><br/>Food prep & pickup hub`);

      // Customer Home Icon
      const homeIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-10 h-10 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-center ring-4 ring-emerald-100 border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div class="absolute -bottom-6 px-2 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-md">
              Your Delivery Address
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([custLat, custLng], { icon: homeIcon })
        .addTo(map)
        .bindPopup(`<b>Delivery Address</b><br/>${order.deliveryAddress?.address || order.customerName}`);

      // Rider Marker (Zomato-style animated bike)
      const riderName = order.riderName || 'Vikram Singh';
      const riderIcon = L.divIcon({
        className: 'custom-leaflet-rider-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-12 h-12 rounded-full bg-orange-500/30 animate-ping"></span>
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-2xl flex items-center justify-center ring-4 ring-orange-200 border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="5" cy="18" r="3" stroke-width="2" />
                <circle cx="19" cy="18" r="3" stroke-width="2" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18V9l4-3h3m-7 3l-4 4h4" />
              </svg>
            </div>
            <div class="absolute -top-7 px-2.5 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-full shadow-lg whitespace-nowrap border border-orange-400">
              🛵 ${riderName}
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const riderMarker = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: riderIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      riderMarkerRef.current = riderMarker;

      // Draw Route Polyline
      // Generate intermediate waypoints for a realistic curved path
      const points: [number, number][] = [];
      for (let i = 0; i <= 20; i++) {
        const step = i / 20;
        const pt = getInterpolatedCoords(step);
        points.push([pt.lat, pt.lng]);
      }

      const polyline = L.polyline(points, {
        color: '#f97316',
        weight: 5,
        opacity: 0.85,
        dashArray: '10, 10',
      }).addTo(map);
      routeLineRef.current = polyline;

      // Fit bounds to show both restaurant, rider, and customer
      const bounds = L.latLngBounds([[restLat, restLng], [custLat, custLng], [currentCoords.lat, currentCoords.lng]]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('Leaflet map initialization warning:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [restLat, restLng, custLat, custLng]);

  // Update Rider position dynamically on map
  useEffect(() => {
    if (riderMarkerRef.current && mapInstanceRef.current) {
      riderMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
    }
  }, [currentCoords.lat, currentCoords.lng]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [restLat, restLng],
        [custLat, custLng],
        [currentCoords.lat, currentCoords.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  };

  const remainingKm = Math.max(0.4, Number((3.4 * (1 - simulatedPct)).toFixed(1)));
  const remainingMins = Math.max(2, Math.round(remainingKm * 4 + 2));

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-stone-200 shadow-md bg-stone-100 ${className}`}>
      {/* Map Header / Live Tracker Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-stone-200/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center animate-pulse">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                Live GPS Route
              </span>
            </div>
            <p className="text-xs font-black text-stone-900">
              {order.orderStatus === 'DELIVERED'
                ? 'Delivered at Doorstep ✓'
                : `${remainingMins} mins • ${remainingKm} km away`}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={handleRecenter}
            className="p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-stone-200 text-stone-700 hover:text-orange-600 transition cursor-pointer"
            title="Re-center route"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-80 sm:h-96 z-0" />

      {/* Map Footer Route Details Bar */}
      <div className="bg-white/95 backdrop-blur-md p-3.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-700">
          <Store className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="font-bold text-stone-900 truncate max-w-[130px] sm:max-w-[200px]">
            {order.restaurantName}
          </span>
          <span className="text-stone-300">→</span>
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[200px] text-stone-600">
            {order.deliveryAddress?.city || 'Home'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-stone-500">
          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Live Turn-by-Turn GPS
          </span>
        </div>
      </div>
    </div>
  );
};
