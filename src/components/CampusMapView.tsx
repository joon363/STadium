import React, { useState, useRef, useMemo } from 'react';
import { VenueNode, MapEdge, NavigationResult } from '../config/stadiumConfig';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface CampusMapViewProps {
  nodes: VenueNode[];
  edges: MapEdge[];
  mode?: 'user' | 'admin';
  adminEditorMode?: 'node' | 'edge';
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;

  onNodeClick?: (node: VenueNode) => void;
  onEdgeClick?: (edge: MapEdge) => void;
  onMapClick?: (coords: { x: number; y: number }) => void;

  showEatingZones?: boolean;
  showRestAreas?: boolean;
  showVenueInfo?: boolean;
  userCoords?: { x: number; y: number } | null;
  isNavigating?: boolean;
  navResult?: NavigationResult | null;
}

export const CampusMapView: React.FC<CampusMapViewProps> = ({
  nodes,
  edges,
  mode = 'user',
  adminEditorMode = 'node',
  selectedNodeId = null,
  selectedEdgeId = null,
  onNodeClick,
  onEdgeClick,
  onMapClick,
  showEatingZones = false,
  showRestAreas = false,
  showVenueInfo = true,
  userCoords = null,
  isNavigating = false,
  navResult = null,
}) => {
  // Zoom & Pan Internal State
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map Node Lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, VenueNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Zoom Controls
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.8));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

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

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
      dragDistanceRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    dragDistanceRef.current += 5;
    setPosition({
      x: e.touches[0].clientX - touchStartRef.current.x,
      y: e.touches[0].clientY - touchStartRef.current.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // SVG Click Handler for Node / Waypoint Placement
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragDistanceRef.current > 5) return; // Prevent click if user was panning

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
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden bg-slate-950 flex items-center justify-center select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
          <image href="/map.png" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" />

          {/* Road Network Lines & Weight Badges */}
          {edges.map((edge) => {
            const fromNode = nodeMap.get(edge.fromNodeId);
            const toNode = nodeMap.get(edge.toNodeId);
            if (!fromNode || !toNode) return null;

            const isSelected = selectedEdgeId === edge.id;
            const isPathActive = isNavigating && navResult && navResult.edgeIds.length > 0;
            const isOnPath = isPathActive && pathEdgeSet.has(edge.id);
            const isNonPathInNavMode = isPathActive && !isOnPath;

            const pts = [fromNode, ...(edge.waypoints || []), toNode];
            const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

            const midWp =
              edge.waypoints && edge.waypoints.length > 0
                ? edge.waypoints[Math.floor(edge.waypoints.length / 2)]
                : { x: (fromNode.x + toNode.x) / 2, y: (fromNode.y + toNode.y) / 2 };

            // Determine stroke color & width
            const strokeColor = isSelected
              ? '#f43f5e'
              : isOnPath
              ? '#f43f5e'
              : isNonPathInNavMode
              ? '#334155'
              : mode === 'admin'
              ? '#64748b'
              : '#475569';

            const strokeWidth = isSelected || isOnPath ? 2.5 / scale : isNonPathInNavMode ? 0.8 / scale : 1.2 / scale;
            const strokeDash = isSelected || isOnPath ? `${2 / scale},${2 / scale}` : `${1 / scale},${1 / scale}`;
            const groupOpacity = isNonPathInNavMode ? 0.35 : 1;

            return (
              <g
                key={edge.id}
                opacity={groupOpacity}
                className={mode === 'admin' ? 'cursor-pointer' : ''}
                onClick={(e) => {
                  if (mode === 'admin' && onEdgeClick) {
                    e.stopPropagation();
                    onEdgeClick(edge);
                  }
                }}
              >
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                />

                {/* Intermediate Waypoints (shown in admin mode or when selected) */}
                {(edge.waypoints || []).map((wp, wpIdx) => (
                  <circle
                    key={wpIdx}
                    cx={wp.x}
                    cy={wp.y}
                    r={(isOnPath ? 2 : 1.5) / scale}
                    fill={isSelected || isOnPath ? '#f43f5e' : '#94a3b8'}
                  />
                ))}

                {/* Weight Badge */}
                <g transform={`translate(${midWp.x}, ${midWp.y}) scale(${1 / scale}) translate(${-midWp.x}, ${-midWp.y})`}>
                  <rect
                    x={midWp.x - 3.5}
                    y={midWp.y - 2.5}
                    width="7"
                    height="4.5"
                    rx="1"
                    fill="#1e293b"
                    stroke={isSelected || isOnPath ? '#f43f5e' : '#475569'}
                    strokeWidth="0.4"
                  />
                  <text
                    x={midWp.x}
                    y={midWp.y + 0.8}
                    fill={isSelected || isOnPath ? '#fb7185' : '#94a3b8'}
                    fontSize="2.2"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {edge.weightMinutes}분
                  </text>
                </g>
              </g>
            );
          })}

          {/* Eating Zones Overlay */}
          {showEatingZones && (
            <g>
              <polygon
                points="45,55 60,55 58,68 43,68"
                fill="#d97706"
                opacity="0.3"
                stroke="#f59e0b"
                strokeWidth={0.8 / scale}
              />
            </g>
          )}

          {/* Rest Area Overlay */}
          {showRestAreas && (
            <g>
              <circle
                cx="65"
                cy="42"
                r="7"
                fill="#059669"
                opacity="0.25"
                stroke="#10b981"
                strokeWidth={0.8 / scale}
              />
            </g>
          )}

          {/* Active Navigation Polyline Overlay */}
          {isNavigating && navResult && navResult.pathWaypoints.length > 0 && (
            <g>
              <polyline
                points={navResult.pathWaypoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#C80036"
                strokeWidth={2.5 / scale}
                strokeDasharray={`${2 / scale},${2 / scale}`}
              />
              {navResult.pathWaypoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={(idx === 0 || idx === navResult.pathWaypoints.length - 1 ? 2.5 : 1.2) / scale}
                  fill={idx === 0 ? '#C80036' : idx === navResult.pathWaypoints.length - 1 ? '#f43f5e' : '#fb7185'}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Render Node Pins Layer */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isEating = node.isEatingZone && showEatingZones;
          const isRest = node.isRestArea && showRestAreas;

          return (
            <div
              key={node.id}
              style={{
                top: `${node.y}%`,
                left: `${node.x}%`,
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onNodeClick) onNodeClick(node);
              }}
              className={`absolute cursor-pointer z-20 ${isSelected ? 'z-30' : ''}`}
            >
              {/* Node Icon Badge */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-md border-2 transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white border-white ring-4 ring-rose-500/50'
                    : isEating
                    ? 'bg-amber-600 text-white border-slate-900'
                    : isRest
                    ? 'bg-emerald-600 text-white border-slate-900'
                    : 'bg-postech text-white border-slate-900'
                }`}
              >
                {node.icon}
              </div>

              {/* Node Label */}
              {showVenueInfo && (
                <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap border border-slate-700 shadow-sm">
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

      {/* Floating Zoom Controls Box */}
      <div className="absolute right-3 bottom-6 z-30 flex flex-col gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-700 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-md text-white hover:bg-slate-800 transition-colors"
          title="확대 (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-md text-white hover:bg-slate-800 transition-colors"
          title="축소 (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="줌 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
