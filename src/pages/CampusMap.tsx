import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VenueNode,
  MapEdge,
  findShortestPath,
} from '../config/stadiumConfig';
import { getSupabaseMapData } from '../lib/supabase';
import { CampusMapView } from '../components/CampusMapView';
import {
  ArrowLeft,
  Compass,
  Navigation,
  Utensils,
  Coffee,
  Info,
  Clock,
} from 'lucide-react';

export const CampusMap: React.FC = () => {
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<VenueNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);

  useEffect(() => {
    let isMounted = true;
    getSupabaseMapData().then((fetched) => {
      if (isMounted && fetched) {
        if (fetched.nodes && fetched.nodes.length > 0) {
          setNodes(fetched.nodes);
          setStartVenue((prev) => prev || fetched.nodes[0]?.id || '');
          setDestVenue((prev) => prev || fetched.nodes[1]?.id || fetched.nodes[0]?.id || '');
        }
        if (fetched.edges && fetched.edges.length > 0) {
          setEdges(fetched.edges);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filters
  const [showEatingZones, setShowEatingZones] = useState(false);
  const [showRestAreas, setShowRestAreas] = useState(false);
  const [showVenueInfo, setShowVenueInfo] = useState(true);

  // Navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [startVenue, setStartVenue] = useState<string>('');
  const [destVenue, setDestVenue] = useState<string>('');

  // Selected Node Sheet
  const [selectedNode, setSelectedNode] = useState<VenueNode | null>(null);

  // GPS User Location State
  const [userCoords, setUserCoords] = useState<{ x: number; y: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Compute Shortest Path via Dijkstra Algorithm
  const navResult = useMemo(() => {
    if (!isNavigating || !startVenue || !destVenue) return null;
    return findShortestPath(startVenue, destVenue, nodes, edges);
  }, [isNavigating, startVenue, destVenue, nodes, edges]);

  // HTML5 GPS Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('사용 중인 브라우저가 GPS 위치 제공을 지원하지 않습니다.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Convert POSTECH GPS bounds to map canvas percentages
        const minLat = 36.0079;
        const maxLat = 36.0204;
        const minLng = 129.3155;
        const maxLng = 129.3270;

        const clampedLat = Math.max(minLat, Math.min(maxLat, latitude));
        const clampedLng = Math.max(minLng, Math.min(maxLng, longitude));

        const percentX = ((clampedLng - minLng) / (maxLng - minLng)) * 100;
        const percentY = (1 - (clampedLat - minLat) / (maxLat - minLat)) * 100;

        setUserCoords({ x: percentX, y: percentY });
        setGpsLoading(false);
      },
      () => {
        setUserCoords({ x: 48, y: 48 });
        setGpsError('GPS 권한이 필요합니다. 기본 포항 캠퍼스 위치로 표시합니다.');
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-57px)] w-full bg-slate-950 text-white relative overflow-hidden select-none">
      {/* Top Header Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="touch-target p-2 rounded-lg bg-slate-800 text-white border border-slate-700 active:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bold text-sm text-white">POSTECH 2D 캠퍼스맵</h1>
              <p className="text-[10px] text-slate-400">드래그/줌 & 내 위치/최단 길찾기</p>
            </div>
          </div>

          <button
            onClick={handleGetLocation}
            disabled={gpsLoading}
            className="touch-target px-3 py-1.5 bg-postech hover:bg-postech-dark text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? '위치 확인중...' : '내 위치'}</span>
          </button>
        </div>

        {/* Filter Toggle Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => setShowEatingZones((prev) => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${showEatingZones
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>취식 공간</span>
          </button>

          <button
            onClick={() => setShowRestAreas((prev) => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${showRestAreas
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>휴식 공간</span>
          </button>

          <button
            onClick={() => setShowVenueInfo((prev) => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${showVenueInfo
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>장소 정보</span>
          </button>

          <button
            onClick={() => setIsNavigating((prev) => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${isNavigating
              ? 'bg-postech text-white border border-rose-400'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>길찾기</span>
          </button>
        </div>

        {gpsError && (
          <div className="text-[10px] text-amber-300 bg-slate-900 border border-amber-500/30 px-2 py-1 rounded-md text-center">
            ⚠️ {gpsError}
          </div>
        )}

        {/* Navigation Selection & Dijkstra Result Box */}
        {isNavigating && (
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 space-y-2 mt-1">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">출발지</label>
                <select
                  value={startVenue}
                  onChange={(e) => setStartVenue(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-md p-1.5 border border-slate-700 font-medium"
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">목적지</label>
                <select
                  value={destVenue}
                  onChange={(e) => setDestVenue(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-md p-1.5 border border-slate-700 font-medium"
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
              <div className="flex items-center justify-between text-xs bg-slate-950 border border-rose-500/40 rounded-md p-2 font-bold">
                <div className="flex items-center gap-1.5 text-rose-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>예상 소요시간: 약 {navResult.totalMinutes}분</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Map Interactive Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
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

      {/* Venue Detail Modal Sheet */}
      {selectedNode && (
        <div className="absolute bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-700 p-4 rounded-t-xl shadow-2xl">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedNode.icon}</span>
              <div>
                <h3 className="font-extrabold text-base text-white">{selectedNode.name}</h3>
                <p className="text-xs text-slate-400 font-medium">{selectedNode.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
