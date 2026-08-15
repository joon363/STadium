import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getSupabaseMapData,
  getSupabaseBooths,
  getSupabaseFoodTrucks,
  BoothItem,
  FoodTruckItem,
} from '../lib/supabase';
import { CampusMapView } from '../components/CampusMapView';
import { VenueNode, MapEdge, NavigationResult, findShortestPath } from '../config/stadiumConfig';
import {
  Utensils,
  Coffee,
  Info,
  Navigation,
  Clock,
  Store,
  Truck,
  MapPin,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const CampusMap: React.FC = () => {
  const [nodes, setNodes] = useState<VenueNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [loadingMap, setLoadingMap] = useState<boolean>(true);

  // Booths & Food Trucks Data from Supabase
  const [booths, setBooths] = useState<BoothItem[]>([]);
  const [foodTrucks, setFoodTrucks] = useState<FoodTruckItem[]>([]);

  // Bottom Sheet Drawer State (Always visible, starts in collapsed state at very bottom)
  const [sheetTab, setSheetTab] = useState<'booth' | 'foodtruck' | 'venue'>('booth');
  const [snapState, setSnapState] = useState<'collapsed' | 'mid' | 'expanded'>('collapsed');

  // Highlight State for Selected Venue Node
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  // Drag Gesture States
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const touchStartRef = useRef<{ y: number; time: number }>({ y: 0, time: 0 });

  // Overlay toggles
  const [showEatingZones, setShowEatingZones] = useState<boolean>(false);
  const [showRestAreas, setShowRestAreas] = useState<boolean>(false);
  const [showVenueInfo, setShowVenueInfo] = useState<boolean>(true);

  // User location / GPS
  const [userCoords] = useState<{ x: number; y: number } | null>(null);
  const [gpsError] = useState<string | null>(null);

  // Navigation (Dijkstra)
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [startVenue, setStartVenue] = useState<string>('');
  const [destVenue, setDestVenue] = useState<string>('');

  const [selectedNode, setSelectedNode] = useState<VenueNode | null>(null);

  // Fetch all map nodes, edges, booths, and food trucks from Supabase (Cached 0ms)
  useEffect(() => {
    let isMounted = true;
    const loadAllMapContent = async () => {
      try {
        const [mapData, fetchedBooths, fetchedTrucks] = await Promise.all([
          getSupabaseMapData(),
          getSupabaseBooths(),
          getSupabaseFoodTrucks(),
        ]);

        if (isMounted) {
          if (mapData) {
            setNodes(mapData.nodes);
            setEdges(mapData.edges);
            if (mapData.nodes.length > 0) {
              setStartVenue(mapData.nodes[0].id);
              if (mapData.nodes.length > 1) setDestVenue(mapData.nodes[1].id);
            }
          }
          setBooths(fetchedBooths.filter((b) => b.isActive));
          setFoodTrucks(fetchedTrucks.filter((t) => t.isActive));
        }
      } catch (err) {
        console.error('Failed to load map content:', err);
      } finally {
        if (isMounted) setLoadingMap(false);
      }
    };

    loadAllMapContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute shortest path via Dijkstra
  const navResult: NavigationResult | null = useMemo(() => {
    if (!isNavigating || !startVenue || !destVenue || nodes.length === 0) {
      return null;
    }
    return findShortestPath(startVenue, destVenue, nodes, edges);
  }, [isNavigating, startVenue, destVenue, nodes, edges]);

  // Handle Selecting a Venue from Map or Sheet
  const handleSelectVenue = (node: VenueNode) => {
    setSelectedNode(node);
    setSheetTab('venue');
    setSnapState('mid');
    setHighlightedNodeId(node.id);

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedNodeId(null);
    }, 2200);
  };

  // Touch Gesture Handlers for Resizable Snap Sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current.y;
    setDragOffsetY(deltaY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = dragOffsetY;
    const timeDelta = Math.max(1, Date.now() - touchStartRef.current.time);
    const velocity = deltaY / timeDelta;

    setDragOffsetY(0);

    // Extreme snap points calculation based on flick & drag
    if (velocity < -0.2 || deltaY < -40) {
      // Dragging UP
      if (snapState === 'collapsed') setSnapState('mid');
      else if (snapState === 'mid') setSnapState('expanded');
    } else if (velocity > 0.2 || deltaY > 40) {
      // Dragging DOWN
      if (snapState === 'expanded') setSnapState('mid');
      else if (snapState === 'mid') setSnapState('collapsed');
    }
  };

  const cycleSnapState = () => {
    if (snapState === 'collapsed') setSnapState('mid');
    else if (snapState === 'mid') setSnapState('expanded');
    else setSnapState('collapsed');
  };

  // Compute Height for 3 Extreme Snap Points
  const getSheetHeight = () => {
    let baseHeight = 350; // 'mid' (~45vh)
    if (snapState === 'collapsed') baseHeight = 56; // extreme bottom minimal peek
    if (snapState === 'expanded') baseHeight = Math.min(window.innerHeight * 0.88, 680); // extreme top full view

    if (isDragging) {
      const calculated = baseHeight - dragOffsetY;
      return Math.max(54, Math.min(window.innerHeight * 0.9, calculated));
    }
    return baseHeight;
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-gray-900 relative overflow-hidden select-none overscroll-none touch-none">
      {/* Top Controls Overlay (Transparent Floating Chips directly on Map) */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2 pointer-events-none">
        {/* Filter Toggle Chips */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setShowEatingZones((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-md backdrop-blur-md ${showEatingZones
              ? 'bg-amber-600 text-white border border-amber-400 font-extrabold ring-2 ring-amber-300/50'
              : 'bg-white/85 text-gray-800 border border-white/70 hover:bg-white/95'
              }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>취식 공간</span>
          </button>

          <button
            onClick={() => setShowRestAreas((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-md backdrop-blur-md ${showRestAreas
              ? 'bg-emerald-500 text-white border border-emerald-400 font-extrabold ring-2 ring-emerald-300/50'
              : 'bg-white/85 text-gray-800 border border-white/70 hover:bg-white/95'
              }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>휴식 공간</span>
          </button>

          <button
            onClick={() => setShowVenueInfo((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-md backdrop-blur-md ${showVenueInfo
              ? 'bg-blue-500 text-white border border-blue-400 font-extrabold ring-2 ring-blue-300/50'
              : 'bg-white/85 text-gray-800 border border-white/70 hover:bg-white/95'
              }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>장소 정보</span>
          </button>

          <button
            onClick={() => setIsNavigating((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-md backdrop-blur-md ${isNavigating
              ? 'bg-postech text-white border border-rose-400 font-extrabold ring-2 ring-rose-300/50'
              : 'bg-white/85 text-gray-800 border border-white/70 hover:bg-white/95'
              }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>길찾기</span>
          </button>
        </div>

        {gpsError && (
          <div className="pointer-events-auto text-[10px] text-amber-900 bg-amber-50/90 backdrop-blur-md border border-amber-200 px-2.5 py-1 rounded-lg text-center font-bold shadow-md">
            ⚠️ {gpsError}
          </div>
        )}

        {/* Navigation Selection & Result Box */}
        {isNavigating && (
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-white/80 space-y-2 shadow-xl">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">
                  출발지
                </label>
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
                <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">
                  목적지
                </label>
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
              <div className="flex items-center justify-between text-xs bg-white/80 border border-rose-200 rounded-lg p-2 font-bold shadow-2xs">
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
      <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-900 overscroll-none touch-none">
        <CampusMapView
          nodes={nodes}
          edges={edges}
          isLoading={loadingMap}
          mode="user"
          showEatingZones={showEatingZones}
          showRestAreas={showRestAreas}
          showVenueInfo={showVenueInfo}
          userCoords={userCoords}
          isNavigating={isNavigating}
          startVenue={startVenue}
          destVenue={destVenue}
          navResult={navResult}
          onNodeClick={(node) => handleSelectVenue(node)}
        />
      </div>

      {/* Interactive Resizable 3-Snap Point Bottom Sheet Drawer (Always visible above BottomNav at bottom-[54px]) */}
      <div
        style={{ height: `${getSheetHeight()}px` }}
        className={`fixed bottom-[54px] inset-x-0 z-30 w-full bg-white border-t border-gray-200/90 rounded-t-3xl shadow-2xl flex flex-col text-gray-900 ${isDragging ? '' : 'transition-all duration-200 ease-out'
          }`}
      >
        {/* Top Drag Handlebar & Touch Gesture Receiver */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-1.5 px-3 pb-1 border-b border-gray-100 flex flex-col items-center relative cursor-grab active:cursor-grabbing shrink-0 select-none touch-none"
        >
          {/* Drag Handle Bar Pill */}
          <div
            onClick={cycleSnapState}
            className="w-12 h-1.5 bg-gray-300 hover:bg-gray-400 rounded-full cursor-pointer mb-1.5 transition-colors"
          />

          {/* Tab Switcher Header */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl">
              <button
                onClick={() => {
                  setSheetTab('booth');
                  if (snapState === 'collapsed') setSnapState('mid');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sheetTab === 'booth'
                  ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                부스 ({booths.length})
              </button>

              <button
                onClick={() => {
                  setSheetTab('foodtruck');
                  if (snapState === 'collapsed') setSnapState('mid');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sheetTab === 'foodtruck'
                  ? 'bg-orange-500 text-white shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                푸드트럭 ({foodTrucks.length})
              </button>

              <button
                onClick={() => {
                  setSheetTab('venue');
                  if (snapState === 'collapsed') setSnapState('mid');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sheetTab === 'venue'
                  ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                📍 행사 장소 ({nodes.length})
              </button>
            </div>

            <button
              onClick={cycleSnapState}
              className="p-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              title="크기 조절"
            >
              {snapState === 'expanded' ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Sheet Body Content List (Visible when expanded or mid) */}
        {snapState !== 'collapsed' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {/* Booths Tab */}
            {sheetTab === 'booth' &&
              (booths.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-gray-400">
                  등록된 부스가 없습니다.
                </div>
              ) : (
                booths.map((b) => (
                  <div
                    key={b.id}
                    className="bg-gray-50/80 border border-gray-200 rounded-2xl p-2.5 flex items-start justify-between gap-2.5 shadow-2xs hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-lg shrink-0">
                        {b.icon || '🎪'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs text-gray-900 truncate">
                            {b.name}
                          </h4>
                          {b.operator && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              {b.operator}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed mt-0.5">
                          {b.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-1">
                          <span className="flex items-center gap-0.5 text-gray-600">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            {b.location}
                          </span>
                          <span>• {b.operatingHours}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ))}

            {/* Food Trucks Tab */}
            {sheetTab === 'foodtruck' &&
              (foodTrucks.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-gray-400">
                  등록된 푸드트럭이 없습니다.
                </div>
              ) : (
                foodTrucks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-gray-50/80 border border-gray-200 rounded-2xl p-2.5 flex items-start justify-between gap-2.5 shadow-2xs hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-lg shrink-0">
                        {t.icon || '🚚'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-gray-900 truncate">{t.name}</h4>
                        <p className="text-[11px] text-gray-700 font-bold leading-relaxed mt-0.5 text-orange-700">
                          메뉴: {t.menuSummary}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-1">
                          <span className="flex items-center gap-0.5 text-gray-600">
                            <MapPin className="w-3 h-3 text-orange-600" />
                            {t.location}
                          </span>
                          <span>• {t.operatingHours}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ))}

            {/* Event Venues Tab (행사 장소) with Flash Border Highlight Effect */}
            {sheetTab === 'venue' && (
              <div className="space-y-2.5">

                {/* All Venues List */}
                <div className="pt-1 space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-500 px-1">
                    전체 행사 장소 ({nodes.length})
                  </div>
                  {nodes.map((node) => {
                    const isCurrentlySelected = selectedNode?.id === node.id;
                    const isHighlighted = highlightedNodeId === node.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => handleSelectVenue(node)}
                        className={`rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all duration-300 ${isHighlighted
                          ? 'bg-blue-50 border-2 border-blue-500 ring-2 ring-blue-200 shadow-sm'
                          : isCurrentlySelected
                            ? 'bg-blue-50/60 border border-blue-300'
                            : 'bg-white border border-gray-200/90 hover:border-gray-300 shadow-2xs'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl">{node.icon || '📍'}</span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-gray-900 truncate">
                              {node.name}
                            </h4>
                            <p className="text-[10px] text-gray-500 truncate">{node.description}</p>
                          </div>
                        </div>
                        {isCurrentlySelected && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.2 rounded">
                            선택됨
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
