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
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';
import { getLocalizedValue, localizeVenueName } from '../../../utils/bilingual';

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
  const { language, t } = useLanguage();
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
    const [bilingualName, bilingualDesc] = await Promise.all([
      finalizeBilingualText(nodeForm.name || t('admin.map.defaultNewNode')),
      finalizeBilingualText(nodeForm.description || ''),
    ]);

    let targetNode: VenueNode;
    if (selectedNodeId) {
      targetNode = {
        ...mapNodes.find((n) => n.id === selectedNodeId)!,
        ...nodeForm,
        name: bilingualName,
        description: bilingualDesc,
      } as VenueNode;
    } else {
      targetNode = {
        id: `venue_${Date.now()}`,
        name: bilingualName,
        category: (nodeForm.category as any) || 'sports',
        x: nodeForm.x || 50,
        y: nodeForm.y || 50,
        lat: 36.014,
        lng: 129.326,
        description: bilingualDesc,
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
      setSaveStatus(t('admin.map.nodeSaved'));
    } else {
      setSaveStatus(t('admin.map.dbSaveFail', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleDeleteNode = async (id: string) => {
    const res = await deleteMapVenue(id);
    if (res.success) {
      setMapNodes(mapNodes.filter((n) => n.id !== id));
      setMapEdges(mapEdges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id));
      if (selectedNodeId === id) setSelectedNodeId(null);
      setSaveStatus(t('admin.map.nodeDeleted'));
    } else {
      setSaveStatus(t('admin.map.dbDeleteFail', { error: res.error || '' }));
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
      setSaveStatus(t('admin.map.edgeSaved'));
    } else {
      setSaveStatus(t('admin.map.dbSaveFail', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleDeleteEdge = async (id: string) => {
    const res = await deleteMapRoad(id);
    if (res.success) {
      setMapEdges(mapEdges.filter((e) => e.id !== id));
      if (selectedEdgeId === id) setSelectedEdgeId(null);
      setSaveStatus(t('admin.map.edgeDeleted'));
    } else {
      setSaveStatus(t('admin.map.dbDeleteFail', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleResetMapDefaults = async () => {
    if (!window.confirm(t('admin.map.confirmReset'))) return;
    const res = await resetMapToDefaults([], []);
    if (res.success) {
      setMapNodes([]);
      setMapEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setSaveStatus(t('admin.map.resetSuccess'));
    } else {
      setSaveStatus(t('admin.map.resetFail', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-gray-900">{t('admin.map.title')}</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{t('admin.map.desc')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetMapDefaults}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('admin.map.resetBtn')}</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Banner */}
      <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200">
        <span className="text-xs font-bold text-slate-700 ml-2">{t('admin.map.modeLabel')}</span>
        <button
          onClick={() => setMapEditorMode('node')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
            mapEditorMode === 'node'
              ? 'bg-postech text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{t('admin.map.modeNode')}</span>
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
          <span>{t('admin.map.modeEdge')}</span>
        </button>
      </div>

      {/* Editor Layout: Left Map Interactive Preview (60%), Right Properties Panel (40%) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Interactive Visual Map Preview */}
        <div className="col-span-7 border border-slate-300 rounded-xl overflow-hidden bg-slate-950 relative min-h-[460px] flex flex-col">
          <div className="absolute top-2 left-2 z-20 bg-slate-900/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded border border-slate-700 shadow-md pointer-events-none">
            {mapEditorMode === 'node' ? t('admin.map.hintNode') : t('admin.map.hintEdge')}
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
                  <span>{selectedNodeId ? t('admin.map.nodeEdit') : t('admin.map.nodeNew')}</span>
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
                    {t('admin.map.newForm')}
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <BilingualField
                  label={t('admin.map.nodeName')}
                  required
                  value={nodeForm.name || ''}
                  onChange={(val) => setNodeForm({ ...nodeForm, name: val })}
                  placeholderKo={t('admin.map.nodeNamePhKo')}
                  inputClassName="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {t('admin.map.nodeIcon')}
                    </label>
                    <input
                      type="text"
                      value={nodeForm.icon || '📍'}
                      onChange={(e) => setNodeForm({ ...nodeForm, icon: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-center font-bold text-base"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {t('admin.map.nodeCat')}
                    </label>
                    <select
                      value={nodeForm.category || 'sports'}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, category: e.target.value as any })
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold"
                    >
                      <option value="sports">{t('admin.map.catSports')}</option>
                      <option value="food">{t('admin.map.catFood')}</option>
                      <option value="rest">{t('admin.map.catRest')}</option>
                      <option value="facility">{t('admin.map.catFacility')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2 border border-slate-200 rounded">
                  <div>
                    <label className="font-bold text-slate-600 text-[10px]">
                      {t('admin.map.posX')}
                    </label>
                    <input
                      type="number"
                      value={nodeForm.x || 0}
                      onChange={(e) => setNodeForm({ ...nodeForm, x: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 text-[10px]">
                      {t('admin.map.posY')}
                    </label>
                    <input
                      type="number"
                      value={nodeForm.y || 0}
                      onChange={(e) => setNodeForm({ ...nodeForm, y: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                </div>

                <BilingualField
                  label={t('admin.map.nodeDesc')}
                  value={nodeForm.description || ''}
                  onChange={(val) => setNodeForm({ ...nodeForm, description: val })}
                  placeholderKo={t('admin.map.nodeDescPhKo')}
                  inputClassName="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeForm.isEatingZone || false}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, isEatingZone: e.target.checked })
                      }
                    />
                    <span>{t('admin.map.eatingZone')}</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeForm.isRestArea || false}
                      onChange={(e) => setNodeForm({ ...nodeForm, isRestArea: e.target.checked })}
                    />
                    <span>{t('admin.map.restArea')}</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {selectedNodeId && (
                    <button
                      onClick={() => handleDeleteNode(selectedNodeId)}
                      className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('admin.map.deleteNode')}</span>
                    </button>
                  )}
                  <button
                    onClick={handleSaveNode}
                    className="ml-auto px-4 py-2 bg-postech text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t('admin.map.saveNode')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
                  <Waypoints className="w-4 h-4 text-postech" />
                  <span>{selectedEdgeId ? t('admin.map.edgeEdit') : t('admin.map.edgeNew')}</span>
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
                    {t('admin.map.newForm')}
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t('admin.map.fromNode')}
                  </label>
                  <select
                    value={edgeForm.fromNodeId || ''}
                    onChange={(e) => setEdgeForm({ ...edgeForm, fromNodeId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold"
                  >
                    {mapNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon}{' '}
                        {getLocalizedValue(n.name, language, (ko) =>
                          localizeVenueName(ko, language)
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t('admin.map.toNode')}
                  </label>
                  <select
                    value={edgeForm.toNodeId || ''}
                    onChange={(e) => setEdgeForm({ ...edgeForm, toNodeId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold"
                  >
                    {mapNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon}{' '}
                        {getLocalizedValue(n.name, language, (ko) =>
                          localizeVenueName(ko, language)
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t('admin.map.weightLabel')}
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
                    <span className="font-bold text-slate-700">{t('admin.map.minSuffix')}</span>
                  </div>
                </div>

                {/* Waypoints */}
                <div className="bg-white border border-slate-200 rounded p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px]">
                      {t('admin.map.waypointsTitle', { count: edgeForm.waypoints?.length || 0 })}
                    </span>
                    <button
                      onClick={() => setEdgeForm({ ...edgeForm, waypoints: [] })}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      {t('admin.map.waypointsClear')}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">{t('admin.map.waypointsDesc')}</p>
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
                      <span>{t('admin.map.deleteEdge')}</span>
                    </button>
                  )}
                  <button
                    onClick={handleSaveEdge}
                    className="ml-auto px-4 py-2 bg-postech text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t('admin.map.saveEdge')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Existing Map Edges summary */}
          <div className="bg-slate-900 text-white rounded-xl p-3 space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 text-xs border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>{t('admin.map.edgeListTitle', { count: mapEdges.length })}</span>
            </h4>
            <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
              {mapEdges.map((edge) => {
                const fromNode = mapNodes.find((n) => n.id === edge.fromNodeId);
                const toNode = mapNodes.find((n) => n.id === edge.toNodeId);
                const isSelected = selectedEdgeId === edge.id;
                const fromLabel = fromNode
                  ? getLocalizedValue(fromNode.name, language, (ko) =>
                      localizeVenueName(ko, language)
                    )
                  : edge.fromNodeId;
                const toLabel = toNode
                  ? getLocalizedValue(toNode.name, language, (ko) =>
                      localizeVenueName(ko, language)
                    )
                  : edge.toNodeId;
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
                      {fromLabel} ➔ {toLabel}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 shrink-0 ml-2">
                      {t('admin.map.edgeSummary', {
                        min: edge.weightMinutes,
                        count: edge.waypoints?.length || 0,
                      })}
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
