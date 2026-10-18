import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Filter, 
  MapPin, 
  Layers, 
  AlertTriangle, 
  Eye, 
  Sparkles,
  Info
} from 'lucide-react';
import api from '../../api/client';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { VARANASI_CENTER, CIVIC_CATEGORIES } from '../../utils/constants';

// Clean modern SVG circle markers for Leaflet
const createPinIcon = (priority = 'medium') => {
  const colorMap = {
    critical: '#e11d48',
    high: '#d97706',
    medium: '#2563eb',
    low: '#10b981',
  };
  const color = colorMap[priority.toLowerCase()] || '#4f46e5';

  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

export const GeospatialMapPage = () => {
  const navigate = useNavigate();

  const [points, setPoints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [totalGeocoded, setTotalGeocoded] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showClusters, setShowClusters] = useState(true);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPriority) params.append('priority', selectedPriority);

      const res = await api.get(`/map/complaints?${params.toString()}`);
      setPoints(res.data.complaints);
      setClusters(res.data.clusters);
      setTotalGeocoded(res.data.total_geocoded);
    } catch (err) {
      console.error("Map fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [selectedCategory, selectedStatus, selectedPriority]);

  return (
    <div className="space-y-4">
      {/* Top Map Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Geospatial Grievance Map & Hotspots</h2>
          <p className="text-xs text-slate-500">Only verified coordinates are plotted; text-only locations excluded from map</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {totalGeocoded} Geocoded Points
          </span>
          <span className="flex items-center gap-1.5 text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            {clusters.length} Cluster Overlays
          </span>
        </div>
      </div>

      {/* Floating Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
          <Filter className="h-3 w-3" /> Map Filters:
        </span>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
        >
          <option value="">All Categories</option>
          {CIVIC_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer ml-auto text-slate-700 font-medium">
          <input
            type="checkbox"
            checked={showClusters}
            onChange={(e) => setShowClusters(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show DBSCAN Recurring Clusters
        </label>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="h-[620px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-2xs relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-20 flex items-center justify-center">
            <LoadingSpinner text="Rendering geospatial points..." />
          </div>
        )}

        <MapContainer
          center={VARANASI_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* CartoDB Positron clean map tiles for professional civic interface */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* DBSCAN Candidate Cluster Overlays */}
          {showClusters && clusters.map((cl) => {
            if (!cl.centroid_lat || !cl.centroid_lon) return null;
            return (
              <Circle
                key={`clust-${cl.id}`}
                center={[cl.centroid_lat, cl.centroid_lon]}
                radius={cl.spread_radius_meters || 400}
                pathOptions={{
                  color: '#4f46e5',
                  fillColor: '#6366f1',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '4, 4'
                }}
              >
                <Popup>
                  <div className="p-3 space-y-1.5 max-w-xs text-xs">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Candidate Recurring Cluster</span>
                    <h4 className="font-bold text-slate-900">{cl.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      {cl.complaint_count} correlated complaints within {Math.round(cl.spread_radius_meters || 400)}m radius.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => navigate('/clusters')}
                        className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-[11px] transition-colors"
                      >
                        Inspect Cluster Details →
                      </button>
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Individual Grievance Markers */}
          {points.map((p) => {
            if (!p.latitude || !p.longitude) return null;
            return (
              <Marker
                key={`pt-${p.id}`}
                position={[p.latitude, p.longitude]}
                icon={createPinIcon(p.priority)}
              >
                <Popup>
                  <div className="p-3 space-y-2 max-w-xs text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-indigo-600 text-[11px]">{p.reference_no}</span>
                      <StatusBadge status={p.status} size="xs" />
                    </div>
                    <h4 className="font-bold text-slate-900 leading-snug">{p.title}</h4>
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge category={p.category} size="xs" />
                      <PriorityBadge priority={p.priority} size="xs" />
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.locality || 'Varanasi'}
                    </p>
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/complaints/${p.id}`)}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Complaint Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-600">
        <span className="font-bold text-slate-900 text-xs">Marker Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-600" /> Critical Hazard
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500" /> High Priority
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-600" /> Medium Priority
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" /> Low Priority
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="h-3 w-3 rounded-full border-2 border-dashed border-indigo-600 bg-indigo-100" /> Candidate DBSCAN Cluster Radius
        </span>
      </div>
    </div>
  );
};
