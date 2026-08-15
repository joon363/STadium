import React, { useState } from 'react';
import { VenueNode, MapEdge } from '../../../types/stadium';
import { CampusMapView } from '../../../components/CampusMapView';
import {
  upsertMapVenue,
  deleteMapVenue,
  upsertMapRoad,
  deleteMapRoad,
  resetMapToDefaults,
} from '../../../lib/supabase';
import { MapPin, Waypoints, RotateCcw, Save, Trash2 } from 'lucide-react';

interface MapTabProps {
  mapNodes: VenueNode[];
  setMapNodes: React.Dispatch<React.SetStateAction<VenueNode[]>>;
  mapEdges: MapEdge[];
  setMapEdges: React.Dispatch<React.SetStateAction<MapEdge[]>>;
  setSaveStatus: (msg: string | null) => void;
}

export const MapTab: React.FC<MapTabProps> = ({
  mapNodes,
  setMapNodes,
  mapEdges,
  setMapEdges,
  setSaveStatus,
}) => {
  const [mapEditorMode, setMapEditorMode] = useState<'node' | 'edge'>('node');

  // Selected Node Form State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState<Partial<VenueNode>>({
    name: '',
    category: 'sports',
    x: 50,
    y: 50,
    icon: '📍',
    description: '',
    isEatingZone: false,
    isRestArea: false,
  });

  // Selected Edge Form State
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeForm, setEdgeForm] = useState<Partial<MapEdge>>({
    fromNodeId: '',
    toNodeId: '',
    weightMinutes: 3,
    waypoints: [],
  });

  const handleSaveNode = async () => {
    let targetNode: VenueNode;
    if (selectedNodeId) {
      targetNode = { ...mapNodes.find((n) => n.id === selectedNodeId)!, ...nodeForm } as VenueNode;
    } else {
      targetNode = {
        id: `venue_${Date.now()}`,
        name: nodeForm.name || '새 장소',
        category: (nodeForm.category as any) || 'sports',
        x: nodeForm.x || 50,
        y: nodeForm.y || 50,
        lat: 36.014,
        lng: 129.326,
        description: nodeForm.description || '',
        icon: nodeForm.icon || '📍',
        isEatingZone: nodeForm.isEatingZone || false,
        isRestArea: nodeForm.isRestArea || false,
      };
    }
    const res = await upsertMapVenue(targetNode);
    if (res.success) {
      if (selectedNodeId) {
        setMapNodes(mapNodes.map((n) => (n.id === selectedNodeId ? targetNode : n)));
      } else {
        setMapNodes([...mapNodes, targetNode]);
      }
      setSelectedNodeId(null);
      setNodeForm({
        name: '',
        category: 'sports',
        x: 50,
        y: 50,
        icon: '📍',
        description: '',
        isEatingZone: false,
        isRestArea: false,
      });
      setSaveStatus('✅ Supabase DB에 장소가 성공적으로 저장되었습니다!');
    } else {
      setSaveStatus(`❌ Supabase 저장 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleDeleteNode = async (id: string) => {
    const res = await deleteMapVenue(id);
    if (res.success) {
      setMapNodes(mapNodes.filter((n) => n.id !== id));
      setMapEdges(mapEdges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id));
      if (selectedNodeId === id) setSelectedNodeId(null);
      setSaveStatus('✅ Supabase DB에서 장소가 삭제되었습니다.');
    } else {
      setSaveStatus(`❌ Supabase 삭제 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleSaveEdge = async () => {
    if (!edgeForm.fromNodeId || !edgeForm.toNodeId) return;
    let targetEdge: MapEdge;
    if (selectedEdgeId) {
      targetEdge = { ...mapEdges.find((e) => e.id === selectedEdgeId)!, ...edgeForm } as MapEdge;
    } else {
      targetEdge = {
        id: `edge_${Date.now()}`,
        fromNodeId: edgeForm.fromNodeId || '',
        toNodeId: edgeForm.toNodeId || '',
        weightMinutes: Number(edgeForm.weightMinutes) || 1,
        waypoints: edgeForm.waypoints || [],
      };
    }
    const res = await upsertMapRoad(targetEdge);
    if (res.success) {
      if (selectedEdgeId) {
        setMapEdges(mapEdges.map((e) => (e.id === selectedEdgeId ? targetEdge : e)));
      } else {
        setMapEdges([...mapEdges, targetEdge]);
      }
      setSelectedEdgeId(null);
      setEdgeForm({
        fromNodeId: mapNodes[0]?.id || '',
        toNodeId: mapNodes[1]?.id || '',
        weightMinutes: 3,
        waypoints: [],
      });
      setSaveStatus('✅ Supabase DB에 도로 경로가 성공적으로 저장되었습니다!');
    } else {
      setSaveStatus(`❌ Supabase 저장 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleDeleteEdge = async (id: string) => {
    const res = await deleteMapRoad(id);
    if (res.success) {
      setMapEdges(mapEdges.filter((e) => e.id !== id));
      if (selectedEdgeId === id) setSelectedEdgeId(null);
      setSaveStatus('✅ Supabase DB에서 도로 경로가 삭제되었습니다.');
    } else {
      setSaveStatus(`❌ Supabase 삭제 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleResetMapDefaults = async () => {
    if (!window.confirm('정말로 모든 지도 데이터(장소 및 도로 경로)를 초기화하시겠습니까?')) return;
    const res = await resetMapToDefaults([], []);
    if (res.success) {
      setMapNodes([]);
      setMapEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setSaveStatus('✅ Supabase DB 지도 데이터가 초기화되었습니다.');
    } else {
      setSaveStatus(`❌ Supabase 초기화 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-gray-900">
            📍 캠퍼스 장소 & 도로(가중치 / 최단길찾기) 비주얼 편집기
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            지도 위를 직접 클릭하여 장소(노드) 위치와 도로(다중 세그먼트 웨이포인트 & 소요시간
            분)를 설정하실 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetMapDefaults}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 초기화</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Banner */}
      <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200">
        <span className="text-xs font-bold text-slate-700 ml-2">편집 모드 선택:</span>
        <button
          onClick={() => setMapEditorMode('node')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
            mapEditorMode === 'node'
              ? 'bg-postech text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>📍 장소(노드) 클릭 배치 & 편집</span>
        </button>

        <button
          onClick={() => setMapEditorMode('edge')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
            mapEditorMode === 'edge'
              ? 'bg-postech text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Waypoints className="w-3.5 h-3.5" />
          <span>🛣️ 도로 경로 (직선 여러개 연결 & 소요시간 가중치) 편집</span>
        </button>
      </div>

      {/* Editor Layout: Left Map Interactive Preview (60%), Right Properties Panel (40%) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Interactive Visual Map Preview */}
        <div className="col-span-7 border border-slate-300 rounded-xl overflow-hidden bg-slate-950 relative min-h-[460px] flex flex-col">
          <div className="absolute top-2 left-2 z-20 bg-slate-900/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded border border-slate-700 shadow-md pointer-events-none">
            {mapEditorMode === 'node'
              ? '💡 지도를 드래그하여 이동/확대 후 클릭하면 장소 (X, Y) 좌표가 변경됩니다.'
              : '💡 지도를 드래그하여 이동/확대 후 클릭하면 선택한 도로에 웨이포인트가 추가됩니다.'}
          </div>

          <CampusMapView
            nodes={mapNodes}
            edges={mapEdges}
            mode="admin"
            adminEditorMode={mapEditorMode}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onNodeClick={(node) => {
              setSelectedNodeId(node.id);
              setNodeForm(node);
              setMapEditorMode('node');
            }}
            onEdgeClick={(edge) => {
              setSelectedEdgeId(edge.id);
              setEdgeForm(edge);
              setMapEditorMode('edge');
            }}
            onMapClick={({ x, y }) => {
              if (mapEditorMode === 'node') {
                setNodeForm((prev) => ({ ...prev, x, y }));
              } else if (mapEditorMode === 'edge') {
                setEdgeForm((prev) => ({
                  ...prev,
                  waypoints: [...(prev.waypoints || []), { x, y }],
                }));
              }
            }}
          />
        </div>

        {/* Right Column: Properties & Editing Form (40%) */}
        <div className="col-span-5 space-y-4">
          {mapEditorMode === 'node' ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
                  <MapPin className="w-4 h-4 text-postech" />
                  <span>{selectedNodeId ? '장소 정보 수정' : '새 장소 추가'}</span>
                </div>
                {selectedNodeId && (
                  <button
                    onClick={() => {
                      setSelectedNodeId(null);
                      setNodeForm({
                        name: '',
                        category: 'sports',
                        x: 50,
                        y: 50,
                        icon: '📍',
                        description: '',
                      });
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900"
                  >
                    + 신규 작성
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">장소명</label>
                  <input
                    type="text"
                    value={nodeForm.name || ''}
                    onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                    placeholder="예: POSTECH 체육관"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      아이콘 (이모지)
                    </label>
                    <input
                      type="text"
                      value={nodeForm.icon || '📍'}
                      onChange={(e) => setNodeForm({ ...nodeForm, icon: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-center font-bold text-base"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">카테고리</label>
                    <select
                      value={nodeForm.category || 'sports'}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, category: e.target.value as any })
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold"
                    >
                      <option value="sports">경기장 (sports)</option>
                      <option value="food">음식/푸드 (food)</option>
                      <option value="rest">휴식/쉼터 (rest)</option>
                      <option value="facility">기타시설 (facility)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2 border border-slate-200 rounded">
                  <div>
                    <label className="font-bold text-slate-600 text-[10px]">X 위치 (%)</label>
                    <input
                      type="number"
                      value={nodeForm.x || 0}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, x: Number(e.target.value) })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 text-[10px]">Y 위치 (%)</label>
                    <input
                      type="number"
                      value={nodeForm.y || 0}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, y: Number(e.target.value) })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">장소 설명</label>
                  <input
                    type="text"
                    value={nodeForm.description || ''}
                    onChange={(e) =>
                      setNodeForm({ ...nodeForm, description: e.target.value })
                    }
                    placeholder="장소 관련 추가 안내 문구"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeForm.isEatingZone || false}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, isEatingZone: e.target.checked })
                      }
                    />
                    <span>취식 공간</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeForm.isRestArea || false}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, isRestArea: e.target.checked })
                      }
                    />
                    <span>휴식 공간</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {selectedNodeId && (
                    <button
                      onClick={() => handleDeleteNode(selectedNodeId)}
                      className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>장소 삭제</span>
                    </button>
                  )}
                  <button
                    onClick={handleSaveNode}
                    className="ml-auto px-4 py-2 bg-postech text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>장소 저장</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
                  <Waypoints className="w-4 h-4 text-postech" />
                  <span>
                    {selectedEdgeId ? '도로(경로/가중치) 수정' : '새 도로(경로) 연결'}
                  </span>
                </div>
                {selectedEdgeId && (
                  <button
                    onClick={() => {
                      setSelectedEdgeId(null);
                      setEdgeForm({
                        fromNodeId: mapNodes[0]?.id || '',
                        toNodeId: mapNodes[1]?.id || '',
                        weightMinutes: 3,
                        waypoints: [],
                      });
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900"
                  >
                    + 신규 작성
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">출발 장소</label>
                  <select
                    value={edgeForm.fromNodeId || ''}
                    onChange={(e) => setEdgeForm({ ...edgeForm, fromNodeId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold"
                  >
                    {mapNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon} {n.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">도착 장소</label>
                  <select
                    value={edgeForm.toNodeId || ''}
                    onChange={(e) => setEdgeForm({ ...edgeForm, toNodeId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold"
                  >
                    {mapNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon} {n.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    소요시간 가중치 (분 / walking minutes)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={edgeForm.weightMinutes || 1}
                      onChange={(e) =>
                        setEdgeForm({ ...edgeForm, weightMinutes: Number(e.target.value) })
                      }
                      className="bg-white border border-slate-300 rounded px-3 py-1.5 w-24 font-bold text-sm text-center"
                    />
                    <span className="font-bold text-slate-700">분 소요</span>
                  </div>
                </div>

                {/* Waypoints */}
                <div className="bg-white border border-slate-200 rounded p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px]">
                      다중 연결 웨이포인트 ({edgeForm.waypoints?.length || 0}개 점)
                    </span>
                    <button
                      onClick={() => setEdgeForm({ ...edgeForm, waypoints: [] })}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      웨이포인트 초기화
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    지도를 클릭하면 도로가 지나가는 중간 굴곡점(웨이포인트)이 추가되어
                    곡선/꺾인 도로를 만듭니다.
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {(edgeForm.waypoints || []).map((wp, wpIdx) => (
                      <span
                        key={wpIdx}
                        className="bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                      >
                        <span>
                          #{wpIdx + 1}: ({wp.x}, {wp.y})
                        </span>
                        <button
                          onClick={() => {
                            const updatedWps = [...(edgeForm.waypoints || [])];
                            updatedWps.splice(wpIdx, 1);
                            setEdgeForm({ ...edgeForm, waypoints: updatedWps });
                          }}
                          className="text-rose-500 font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {selectedEdgeId && (
                    <button
                      onClick={() => handleDeleteEdge(selectedEdgeId)}
                      className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>도로 삭제</span>
                    </button>
                  )}
                  <button
                    onClick={handleSaveEdge}
                    className="ml-auto px-4 py-2 bg-postech text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>도로 경로 저장</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Existing Map Edges summary */}
          <div className="bg-slate-900 text-white rounded-xl p-3 space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 text-xs border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>등록된 도로 경로 리스트 ({mapEdges.length}개)</span>
            </h4>
            <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
              {mapEdges.map((edge) => {
                const fromNode = mapNodes.find((n) => n.id === edge.fromNodeId);
                const toNode = mapNodes.find((n) => n.id === edge.toNodeId);
                const isSelected = selectedEdgeId === edge.id;
                return (
                  <div
                    key={edge.id}
                    onClick={() => {
                      setSelectedEdgeId(edge.id);
                      setEdgeForm(edge);
                      setMapEditorMode('edge');
                    }}
                    className={`p-1.5 rounded cursor-pointer flex items-center justify-between text-[11px] font-bold transition-colors ${
                      isSelected
                        ? 'bg-rose-950 border border-rose-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="truncate">
                      {fromNode?.name || edge.fromNodeId} ➔ {toNode?.name || edge.toNodeId}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 shrink-0 ml-2">
                      {edge.weightMinutes}분 ({edge.waypoints?.length || 0}개 점)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
