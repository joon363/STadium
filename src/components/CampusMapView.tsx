import React, { useState, useRef, useMemo, useEffect } from 'react';
import { VenueNode, MapEdge, NavigationResult } from '../config/stadiumConfig';
import { Search, Loader2 } from 'lucide-react';

export interface CampusMapViewProps {
  nodes: VenueNode[];
  edges: MapEdge[];
  mode?: 'user' | 'admin';
  adminEditorMode?: 'node' | 'edge';
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  isLoading?: boolean;

  onNodeClick?: (node: VenueNode) => void;
  onEdgeClick?: (edge: MapEdge) => void;
  onMapClick?: (coords: { x: number; y: number }) => void;

  showEatingZones?: boolean;
  showRestAreas?: boolean;
  showVenueNames?: boolean;
  showSportsVenues?: boolean;
  showGeneralVenues?: boolean;
  showPaths?: boolean;
  showVenueInfo?: boolean;
  userCoords?: { x: number; y: number } | null;
  isNavigating?: boolean;
  startVenue?: string;
  destVenue?: string;
  navResult?: NavigationResult | null;
}

const MIN_SCALE = 0.9;
const MAX_SCALE = 4.5;

// Global memory cache for map image
let isMapImagePreloadedInMemory = false;

export const CampusMapView: React.FC<CampusMapViewProps> = ({
  nodes,
  edges,
  selectedNodeId = null,
  selectedEdgeId = null,
  isLoading = false,
  onNodeClick,
  onMapClick,
  showEatingZones = false,
  showRestAreas = false,
  showVenueNames,
  showSportsVenues = true,
  showGeneralVenues = true,
  showPaths = true,
  showVenueInfo = true,
  userCoords = null,
  isNavigating = false,
  startVenue = '',
  destVenue = '',
  navResult = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showNames = showVenueNames !== undefined ? showVenueNames : showVenueInfo;

  // Zoom & Pan Internal State
  const [scale, setScale] = useState<number>(1.8);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMapImageLoaded, setIsMapImageLoaded] = useState<boolean>(isMapImagePreloadedInMemory);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1.8);

  // Preload and cache map.png
  useEffect(() => {
    if (isMapImagePreloadedInMemory) {
      setIsMapImageLoaded(true);
      return;
    }

    const img = new Image();
    img.src = '/hqmap.jpg';
    img.onload = () => {
      isMapImagePreloadedInMemory = true;
      setIsMapImageLoaded(true);
    };
    img.onerror = () => {
      setIsMapImageLoaded(true);
    };
  }, []);

  // Compute scale so map fills the screen vertically on mount and resize
  useEffect(() => {
    const calculateFitScale = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          const fitScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, clientHeight / clientWidth));
          setScale(fitScale);
        }
      }
    };

    calculateFitScale();
    window.addEventListener('resize', calculateFitScale);
    return () => window.removeEventListener('resize', calculateFitScale);
  }, []);

  // Map Node Lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, VenueNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = Math.abs(e.clientX - (dragStartRef.current.x + position.x));
    const dy = Math.abs(e.clientY - (dragStartRef.current.y + position.y));
    dragDistanceRef.current += dx + dy;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers with Strict Pinch-to-Zoom Clamping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
      dragDistanceRef.current = 0;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      dragDistanceRef.current += 5;
      setPosition({
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y,
      });
    } else if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = currentDist / pinchStartDistRef.current;
      const targetScale = pinchStartScaleRef.current * scaleFactor;
      // Clamped strictly between MIN_SCALE and MAX_SCALE
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchStartDistRef.current = null;
  };

  // SVG Click Handler
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragDistanceRef.current > 5) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (onMapClick) {
      onMapClick({ x, y });
    }
  };

  // Path Edge Lookup for Navigation Mode
  const pathEdgeSet = useMemo(() => {
    if (!isNavigating || !navResult || !navResult.edgeIds) return new Set<string>();
    return new Set<string>(navResult.edgeIds);
  }, [isNavigating, navResult]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden bg-slate-950 flex items-center justify-center select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Spinner Overlay on Initial Load */}
      {(!isMapImageLoaded || isLoading || nodes.length === 0) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xs text-white gap-2.5 pointer-events-none select-none">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <div className="text-xs font-bold text-slate-300">캠퍼스 지도를 불러오는 중...</div>
        </div>
      )}

      {/* Map Content Wrapper */}
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        className="relative w-full aspect-square max-h-full"
      >
        {/* SVG Base & Road Overlay Layer */}
        <svg
          onClick={handleSvgClick}
          className="w-full h-full select-none cursor-crosshair"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Base Terrain */}
          <rect width="100" height="100" fill="#0f172a" />
          <image
            href="/hqmap.jpg"
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Road Network Lines & Weight Badges */}
          {edges.map((edge) => {
            const fromNode = nodeMap.get(edge.fromNodeId);
            const toNode = nodeMap.get(edge.toNodeId);
            if (!fromNode || !toNode) return null;

            const isSelected = selectedEdgeId === edge.id;
            const isPathActive = isNavigating && navResult && navResult.edgeIds.length > 0;
            const isOnPath = isPathActive && pathEdgeSet.has(edge.id);
            const isNonPathInNavMode = isPathActive && !isOnPath;

            // If showPaths is false, hide edges unless it is on active navigation path
            if (!showPaths && !isOnPath) return null;

            const pts = [fromNode, ...(edge.waypoints || []), toNode];
            const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

            const midWp =
              edge.waypoints && edge.waypoints.length > 0
                ? edge.waypoints[Math.floor(edge.waypoints.length / 2)]
                : {
                    x: (fromNode.x + toNode.x) / 2,
                    y: (fromNode.y + toNode.y) / 2,
                  };

            return (
              <g key={edge.id}>
                {/* Background Shadow Stroke (Slimmer width) */}
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={isOnPath ? '#ffffff' : '#000000'}
                  strokeWidth={isOnPath ? 1.8 : isSelected ? 1.4 : 0.8}
                  strokeOpacity={isNonPathInNavMode ? 0.2 : 0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Main Visible Road Path (Slimmer width) */}
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={
                    isOnPath
                      ? '#e11d48'
                      : isSelected
                        ? '#3b82f6'
                        : isNonPathInNavMode
                          ? '#475569'
                          : '#94a3b8'
                  }
                  strokeWidth={isOnPath ? 1.2 : isSelected ? 1.0 : 0.6}
                  strokeOpacity={isNonPathInNavMode ? 0.3 : 0.9}
                  strokeDasharray={isNonPathInNavMode ? '1 1' : 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Weight Minutes Badge */}
                {(!isNavigating || isOnPath) && (
                  <g
                    transform={`translate(${midWp.x}, ${midWp.y}) scale(${1 / scale})`}
                    className="pointer-events-none select-none"
                  >
                    <rect
                      x="-3.5"
                      y="-1.8"
                      width="7"
                      height="3.6"
                      rx="1"
                      fill={isOnPath ? '#e11d48' : '#1e293b'}
                      stroke={isOnPath ? '#ffffff' : '#475569'}
                      strokeWidth="0.3"
                    />
                    <text
                      x="0"
                      y="0.7"
                      fill="#ffffff"
                      fontSize="2.2"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {edge.weightMinutes}분
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Venue Nodes (POIs) */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isNavStart = isNavigating && startVenue === node.id;
          const isNavDest = isNavigating && destVenue === node.id;

          const isSports = node.category === 'sports';
          const isCategoryVisible = isSports ? showSportsVenues : showGeneralVenues;
          const isMustShow = isSelected || isNavStart || isNavDest;

          if (!isCategoryVisible && !isMustShow) return null;

          const isEatingHighlighted = showEatingZones && node.isEatingZone;
          const isRestHighlighted = showRestAreas && node.isRestArea;

          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onNodeClick) onNodeClick(node);
              }}
              style={{
                top: `${node.y}%`,
                left: `${node.x}%`,
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="absolute z-20 flex flex-col items-center cursor-pointer group"
            >
              {/* Pin Icon Bubble */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                  isNavDest
                    ? 'bg-rose-600 ring-4 ring-rose-300 scale-125 text-white'
                    : isNavStart
                      ? 'bg-blue-600 ring-4 ring-blue-300 scale-125 text-white'
                      : isSelected
                        ? 'bg-blue-600 ring-4 ring-blue-300 scale-125 text-white'
                        : isEatingHighlighted
                          ? 'bg-amber-500 ring-4 ring-amber-300 scale-115 text-white'
                          : isRestHighlighted
                            ? 'bg-emerald-500 ring-4 ring-emerald-300 scale-115 text-white'
                            : 'bg-white/95 border border-gray-300 hover:scale-110 text-gray-800'
                }`}
              >
                <span className="text-xs">{node.icon || '📍'}</span>
              </div>

              {/* Venue Name Label */}
              {showNames && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/95 text-gray-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap border border-gray-200 shadow-md">
                  {node.name}
                </div>
              )}
            </div>
          );
        })}

        {/* GPS User Location Marker Pin */}
        {userCoords && (
          <div
            style={{
              top: `${userCoords.y}%`,
              left: `${userCoords.x}%`,
              transform: `translate(-50%, -50%) scale(${1 / scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="absolute z-30 pointer-events-none"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-md">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md whitespace-nowrap">
              📍 내 위치
            </div>
          </div>
        )}
      </div>

      {/* Floating Minimalist Zoom Slider (Transparent, No Background, Prevents Map Drag) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2.5 top-20 z-20 flex flex-col items-center gap-1 select-none pointer-events-auto"
      >
        <Search className="w-3.5 h-3.5 text-white/80 drop-shadow-md mb-0.5" />

        {/* Compact Vertical Slider */}
        <div className="h-24 flex items-center justify-center">
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.05}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-20 h-1 accent-rose-500 cursor-pointer -rotate-90 rounded-full bg-white/30 backdrop-blur-xs"
            title={`줌: ${scale.toFixed(1)}x`}
          />
        </div>
      </div>
    </div>
  );
};
