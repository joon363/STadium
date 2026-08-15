import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CampusMapView } from '../components/CampusMapView';
import {
  VenueNode,
  MapEdge,
  NavigationResult,
  findShortestPath
} from '../config/stadiumConfig';
import {
  Utensils,
  Coffee,
  Info,
  Navigation,
  Clock,
  X
} from 'lucide-react';

export const CampusMap: React.FC = () => {
  const [nodes, setNodes] = useState<VenueNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);

  // Overlay toggles
  const [showEatingZones, setShowEatingZones] = useState<boolean>(false);
  const [showRestAreas, setShowRestAreas] = useState<boolean>(false);
  const [showVenueInfo, setShowVenueInfo] = useState<boolean>(true);

  // User location / GPS
  const [userCoords, setUserCoords] = useState<{ x: number; y: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Navigation (Dijkstra)
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [startVenue, setStartVenue] = useState<string>('');
  const [destVenue, setDestVenue] = useState<string>('');

  const [selectedNode, setSelectedNode] = useState<VenueNode | null>(null);

  // Fetch nodes & edges from Supabase
  const fetchMapData = async () => {
    try {
      if (!supabase) return;
      const [nodesRes, edgesRes] = await Promise.all([
        supabase.from('map_nodes').select('*'),
        supabase.from('map_edges').select('*'),
      ]);

      if (nodesRes.data && nodesRes.data.length > 0) {
        setNodes(nodesRes.data as VenueNode[]);
        if (!startVenue) setStartVenue(nodesRes.data[0].id);
        if (!destVenue && nodesRes.data.length > 1) setDestVenue(nodesRes.data[1].id);
      }
      if (edgesRes.data && edgesRes.data.length > 0) {
        setEdges(edgesRes.data as MapEdge[]);
      }
    } catch (err) {
      console.error('Failed to load map data', err);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Compute shortest path via Dijkstra
  const navResult: NavigationResult | null = useMemo(() => {
    if (!isNavigating || !startVenue || !destVenue || nodes.length === 0) {
      return null;
    }
    return findShortestPath(startVenue, destVenue, nodes, edges);
  }, [isNavigating, startVenue, destVenue, nodes, edges]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-gray-900 relative overflow-hidden select-none">
      {/* Top Header Controls Overlay (Clean White Theme) */}
      <div className="absolute top-0 left-0 right-0 z-30 p-2.5 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs flex flex-col gap-2">
        {/* Filter Toggle Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setShowEatingZones((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs ${showEatingZones
              ? 'bg-amber-50 text-amber-700 border border-amber-300 font-bold'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>취식 공간</span>
          </button>

          <button
            onClick={() => setShowRestAreas((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs ${showRestAreas
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>휴식 공간</span>
          </button>

          <button
            onClick={() => setShowVenueInfo((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs ${showVenueInfo
              ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>장소 정보</span>
          </button>

          <button
            onClick={() => setIsNavigating((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs ${isNavigating
              ? 'bg-postech text-white border border-rose-600 font-bold'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>길찾기</span>
          </button>
        </div>

        {gpsError && (
          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-center font-medium">
            ⚠️ {gpsError}
          </div>
        )}

        {/* Navigation Selection & Result Box */}
        {isNavigating && (
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 block mb-0.5">출발지</label>
                <select
                  value={startVenue}
                  onChange={(e) => setStartVenue(e.target.value)}
                  className="w-full bg-white text-gray-900 rounded-lg p-1.5 border border-gray-300 font-bold text-xs shadow-2xs focus:outline-none focus:border-postech"
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-500 block mb-0.5">목적지</label>
                <select
                  value={destVenue}
                  onChange={(e) => setDestVenue(e.target.value)}
                  className="w-full bg-white text-gray-900 rounded-lg p-1.5 border border-gray-300 font-bold text-xs shadow-2xs focus:outline-none focus:border-postech"
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {navResult && (
              <div className="flex items-center justify-between text-xs bg-white border border-rose-200 rounded-lg p-2 font-bold shadow-2xs">
                <div className="flex items-center gap-1.5 text-postech font-bold">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>예상 소요시간: 약 {navResult.totalMinutes}분</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Map Interactive Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-900">
        <CampusMapView
          nodes={nodes}
          edges={edges}
          mode="user"
          showEatingZones={showEatingZones}
          showRestAreas={showRestAreas}
          showVenueInfo={showVenueInfo}
          userCoords={userCoords}
          isNavigating={isNavigating}
          navResult={navResult}
          onNodeClick={(node) => setSelectedNode(node)}
        />
      </div>

      {/* Venue Detail Modal Sheet (Clean White Theme) */}
      {selectedNode && (
        <div className="absolute bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 p-4 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-150">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedNode.icon}</span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">{selectedNode.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedNode.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
