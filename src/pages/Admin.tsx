import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEFAULT_RAW_SCHEDULE_FLAT,
  RawScheduledMatch,
  STAGE_TIMETABLE,
  StageItem,
  SCHOOLS,
  VenueNode,
  MapEdge,
  MapWaypoint,
  VENUE_NODES,
  DEFAULT_MAP_EDGES,
} from '../config/stadiumConfig';
import {
  verifyAdminPassword,
  updateAdminPasswordInSupabase,
  getSupabaseMatches,
  updateSupabaseMatch,
  getSupabaseStagePerformances,
  updateSupabaseStagePerformance,
  getSupabaseMapData,
  upsertMapVenue,
  deleteMapVenue,
  upsertMapRoad,
  deleteMapRoad,
  resetMapToDefaults,
  isSupabaseConfigured,
} from '../lib/supabase';
import { CampusMapView } from '../components/CampusMapView';
import {
  ShieldCheck,
  Lock,
  Trophy,
  Music,
  Save,
  KeyRound,
  Database,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  MapPin,
  Plus,
  Trash2,
  Waypoints,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();

  // Auth Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'matches' | 'stage' | 'map' | 'settings'>('matches');

  // Data States
  const [matches, setMatches] = useState<RawScheduledMatch[]>(DEFAULT_RAW_SCHEDULE_FLAT);
  const [stageItems, setStageItems] = useState<StageItem[]>(STAGE_TIMETABLE);

  // Map Editor States
  const [mapNodes, setMapNodes] = useState<VenueNode[]>([]);
  const [mapEdges, setMapEdges] = useState<MapEdge[]>([]);
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

  // Change Password State
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load Data on Login
  const loadAdminData = async () => {
    setIsSaving(true);
    try {
      const fetchedMatches = await getSupabaseMatches();
      const fetchedStage = await getSupabaseStagePerformances();
      const fetchedMap = await getSupabaseMapData();

      if (fetchedMatches && fetchedMatches.length > 0) {
        setMatches(fetchedMatches);
      }
      if (fetchedStage && fetchedStage.length > 0) {
        setStageItems(fetchedStage);
      }
      if (fetchedMap) {
        if (fetchedMap.nodes && fetchedMap.nodes.length > 0) {
          setMapNodes(fetchedMap.nodes);
        }
        if (fetchedMap.edges && fetchedMap.edges.length > 0) {
          setMapEdges(fetchedMap.edges);
        }
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError(null);

    const isValid = await verifyAdminPassword(inputPassword);
    setIsVerifying(false);

    if (isValid) {
      setIsAuthenticated(true);
      loadAdminData();
    } else {
      setAuthError('비밀번호가 일치하지 않습니다.');
    }
  };

  // Match Change Handler
  const handleMatchChange = (index: number, field: keyof RawScheduledMatch, value: any) => {
    const updated = [...matches];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setMatches(updated);
  };

  // Save Single Match
  const handleSaveMatch = async (match: RawScheduledMatch) => {
    setIsSaving(true);
    setSaveStatus(null);
    const success = await updateSupabaseMatch(match);
    setIsSaving(false);
    if (success) {
      setSaveStatus(`경기 [${match.round} - ${match.sportName}] 정보가 저장되었습니다.`);
    } else {
      setSaveStatus('저장 중 오류가 발생했습니다.');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Save All Matches
  const handleSaveAllMatches = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    let allOk = true;
    for (const m of matches) {
      const ok = await updateSupabaseMatch(m);
      if (!ok) allOk = false;
    }
    setIsSaving(false);
    if (allOk) {
      setSaveStatus('전체 경기 일정이 저장되었습니다.');
    } else {
      setSaveStatus('일부 경기 저장 실패.');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Stage Change Handler
  const handleStageChange = (index: number, field: keyof StageItem, value: any) => {
    const updated = [...stageItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setStageItems(updated);
  };

  // Save Single Stage Performance
  const handleSaveStage = async (index: number, item: StageItem) => {
    setIsSaving(true);
    setSaveStatus(null);
    const success = await updateSupabaseStagePerformance(index, item);
    setIsSaving(false);
    if (success) {
      setSaveStatus(`공연 [${item.clubName}] 정보가 저장되었습니다.`);
    } else {
      setSaveStatus('저장 중 오류가 발생했습니다.');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // --- Map Editor Handlers ---

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
      setNodeForm({ name: '', category: 'sports', x: 50, y: 50, icon: '📍', description: '', isEatingZone: false, isRestArea: false });
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
      setEdgeForm({ fromNodeId: mapNodes[0]?.id || '', toNodeId: mapNodes[1]?.id || '', weightMinutes: 3, waypoints: [] });
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

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setSaveStatus('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveStatus('새 비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setIsSaving(true);
    const ok = await updateAdminPasswordInSupabase(newPassword);
    setIsSaving(false);

    if (ok) {
      setSaveStatus('관리자 비밀번호가 성공적으로 변경되었습니다.');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setSaveStatus('비밀번호 변경 실패.');
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // 1. Password Lock View (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-postech text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-extrabold text-xl">2026 STadium 관리자 웹</h1>
            <p className="text-xs text-slate-400">
              실시간 경기 스코어, 타임라인 및 지도/도로 편집 (비밀번호 입력)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                관리자 비밀번호
              </label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full bg-slate-900 border border-slate-700 px-3.5 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-postech"
              />
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-postech hover:bg-postech-dark text-white font-black rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isVerifying ? '검증 중...' : '관리자 로그인'}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>일반 사용자 화면으로 돌아가기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard View
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      {/* Top Admin Header Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-postech text-white flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight">2026 STadium 통합 관리자 시스템</h1>
            <p className="text-[11px] text-slate-400">16:9 PC 최적화 웹 대시보드</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            disabled={isSaving}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            사용자 웹으로 이동
          </button>
        </div>
      </header>

      {/* Main 16:9 Desktop Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 pt-2 rounded-t-xl shadow-2xs">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'matches'
                ? 'bg-white text-postech border-postech shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 border-transparent'
              }`}
          >
            <Trophy className="w-4 h-4" />
            <span>운동경기 스코어 & 일정</span>
          </button>

          <button
            onClick={() => setActiveTab('stage')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'stage'
                ? 'bg-white text-postech border-postech shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 border-transparent'
              }`}
          >
            <Music className="w-4 h-4" />
            <span>체육관 무대 공연</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'map'
                ? 'bg-white text-postech border-postech shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 border-transparent'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>📍 장소 & 도로(길찾기 가중치) 편집</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'settings'
                ? 'bg-white text-postech border-postech shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 border-transparent'
              }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>관리자 설정 & Supabase</span>
          </button>
        </div>

        {/* Tab 1: Sports Match Schedule Management */}
        {activeTab === 'matches' && (
          <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-gray-900">
                운동경기 스코어 & 시간 설정
              </h2>
              <button
                onClick={handleSaveAllMatches}
                disabled={isSaving}
                className="px-4 py-2 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>전체 경기 변경사항 저장</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="p-3">종목</th>
                    <th className="p-3">라운드</th>
                    <th className="p-3">팀1 vs 팀2</th>
                    <th className="p-3">최종/현재 스코어</th>
                    <th className="p-3">시작~종료 시각</th>
                    <th className="p-3">경기 장소</th>
                    <th className="p-3 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {matches.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/80">
                      <td className="p-3 font-bold text-gray-900">
                        {item.icon} {item.sportName}
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={item.round}
                          onChange={(e) => handleMatchChange(idx, 'round', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-28 font-semibold"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={item.team1}
                            onChange={(e) => handleMatchChange(idx, 'team1', e.target.value)}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-20 font-bold"
                          />
                          <span>vs</span>
                          <input
                            type="text"
                            value={item.team2}
                            onChange={(e) => handleMatchChange(idx, 'team2', e.target.value)}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-20 font-bold"
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.score1Final}
                            onChange={(e) =>
                              handleMatchChange(idx, 'score1Final', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-12 text-center font-bold"
                          />
                          <span>:</span>
                          <input
                            type="number"
                            value={item.score2Final}
                            onChange={(e) =>
                              handleMatchChange(idx, 'score2Final', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-12 text-center font-bold"
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.startHour}
                            onChange={(e) =>
                              handleMatchChange(idx, 'startHour', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                          <span>:</span>
                          <input
                            type="number"
                            value={item.startMinute}
                            onChange={(e) =>
                              handleMatchChange(idx, 'startMinute', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                          <span>~</span>
                          <input
                            type="number"
                            value={item.endHour}
                            onChange={(e) =>
                              handleMatchChange(idx, 'endHour', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                          <span>:</span>
                          <input
                            type="number"
                            value={item.endMinute}
                            onChange={(e) =>
                              handleMatchChange(idx, 'endMinute', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={item.venue}
                          onChange={(e) => handleMatchChange(idx, 'venue', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-28"
                        />
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSaveMatch(item)}
                          disabled={isSaving}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 transition-colors"
                        >
                          저장
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Stage Performance Management */}
        {activeTab === 'stage' && (
          <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-4">
            <h2 className="font-extrabold text-base text-gray-900">
              체육관 메인 무대 공연 타임라인 설정
            </h2>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="p-3">학교</th>
                    <th className="p-3">동아리명</th>
                    <th className="p-3">장르</th>
                    <th className="p-3">곡명 / 세트리스트</th>
                    <th className="p-3">공연 시각 (시작~종료)</th>
                    <th className="p-3 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {stageItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="p-3">
                        <select
                          value={item.school}
                          onChange={(e) => handleStageChange(idx, 'school', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold"
                        >
                          {Object.keys(SCHOOLS).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={item.clubName}
                          onChange={(e) => handleStageChange(idx, 'clubName', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-40 font-bold"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={item.genre}
                          onChange={(e) => handleStageChange(idx, 'genre', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-28"
                        />
                      </td>

                      <td className="p-3">
                        <textarea
                          rows={2}
                          value={item.songTitle}
                          onChange={(e) => handleStageChange(idx, 'songTitle', e.target.value)}
                          placeholder="엔터(Enter)로 여러 곡 입력 가능"
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-56 font-medium leading-normal resize-y"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.startHour}
                            onChange={(e) =>
                              handleStageChange(idx, 'startHour', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                          <span>:</span>
                          <input
                            type="number"
                            value={item.startMinute}
                            onChange={(e) =>
                              handleStageChange(idx, 'startMinute', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                          <span>~</span>
                          <input
                            type="number"
                            value={item.endHour}
                            onChange={(e) =>
                              handleStageChange(idx, 'endHour', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                          <span>:</span>
                          <input
                            type="number"
                            value={item.endMinute}
                            onChange={(e) =>
                              handleStageChange(idx, 'endMinute', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                          />
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSaveStage(idx, item)}
                          disabled={isSaving}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 transition-colors"
                        >
                          저장
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Map, Place & Multi-segment Road Edge Editor */}
        {activeTab === 'map' && (
          <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base text-gray-900">
                  📍 캠퍼스 장소 & 도로(가중치 / 최단길찾기) 비주얼 편집기
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  지도 위를 직접 클릭하여 장소(노드) 위치와 도로(다중 세그먼트 웨이포인트 & 소요시간 분)를 설정하실 수 있습니다.
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
              <span className="text-xs font-black text-slate-700 ml-2">편집 모드 선택:</span>
              <button
                onClick={() => setMapEditorMode('node')}
                className={`px-3 py-1.5 rounded-md text-xs font-black flex items-center gap-1.5 transition-colors ${mapEditorMode === 'node'
                    ? 'bg-postech text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>📍 장소(노드) 클릭 배치 & 편집</span>
              </button>

              <button
                onClick={() => setMapEditorMode('edge')}
                className={`px-3 py-1.5 rounded-md text-xs font-black flex items-center gap-1.5 transition-colors ${mapEditorMode === 'edge'
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
                            setNodeForm({ name: '', category: 'sports', x: 50, y: 50, icon: '📍', description: '' });
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
                          <label className="font-bold text-slate-700 block mb-1">아이콘 (이모지)</label>
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
                            onChange={(e) => setNodeForm({ ...nodeForm, category: e.target.value as any })}
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
                            onChange={(e) => setNodeForm({ ...nodeForm, x: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-600 text-[10px]">Y 위치 (%)</label>
                          <input
                            type="number"
                            value={nodeForm.y || 0}
                            onChange={(e) => setNodeForm({ ...nodeForm, y: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">장소 설명</label>
                        <input
                          type="text"
                          value={nodeForm.description || ''}
                          onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
                          placeholder="장소 관련 추가 안내 문구"
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={nodeForm.isEatingZone || false}
                            onChange={(e) => setNodeForm({ ...nodeForm, isEatingZone: e.target.checked })}
                          />
                          <span>취식 공간</span>
                        </label>
                        <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={nodeForm.isRestArea || false}
                            onChange={(e) => setNodeForm({ ...nodeForm, isRestArea: e.target.checked })}
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
                        <span>{selectedEdgeId ? '도로(경로/가중치) 수정' : '새 도로(경로) 연결'}</span>
                      </div>
                      {selectedEdgeId && (
                        <button
                          onClick={() => {
                            setSelectedEdgeId(null);
                            setEdgeForm({ fromNodeId: mapNodes[0]?.id || '', toNodeId: mapNodes[1]?.id || '', weightMinutes: 3, waypoints: [] });
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
                            onChange={(e) => setEdgeForm({ ...edgeForm, weightMinutes: Number(e.target.value) })}
                            className="bg-white border border-slate-300 rounded px-3 py-1.5 w-24 font-black text-sm text-center"
                          />
                          <span className="font-bold text-slate-700">분 소요</span>
                        </div>
                      </div>

                      {/* Waypoints (Multi-segment path points) */}
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
                          지도를 클릭하면 도로가 지나가는 중간 굴곡점(웨이포인트)이 추가되어 곡선/꺾인 도로를 만듭니다.
                        </p>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {(edgeForm.waypoints || []).map((wp, wpIdx) => (
                            <span
                              key={wpIdx}
                              className="bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                            >
                              <span>#{wpIdx + 1}: ({wp.x}, {wp.y})</span>
                              <button
                                onClick={() => {
                                  const updatedWps = [...(edgeForm.waypoints || [])];
                                  updatedWps.splice(wpIdx, 1);
                                  setEdgeForm({ ...edgeForm, waypoints: updatedWps });
                                }}
                                className="text-rose-500 font-black ml-0.5"
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

                {/* List of Existing Map Nodes & Edges summary */}
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
                          className={`p-1.5 rounded cursor-pointer flex items-center justify-between text-[11px] font-semibold transition-colors ${isSelected ? 'bg-rose-950 border border-rose-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
        )}

        {/* Tab 4: Admin Settings & Password Change */}
        {activeTab === 'settings' && (
          <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
            <h2 className="font-extrabold text-base text-gray-900">
              관리자 설정 및 Supabase 연동 상태
            </h2>

            {/* Supabase Status Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                <Database className="w-4 h-4 text-postech" />
                <span>Supabase 연결 상태</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">연동 상태:</span>
                  {isSupabaseConfigured ? (
                    <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      연동 활성화 (데이터베이스 동기화중)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      로컬 모드 (Supabase 환경변수 미설정)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                <KeyRound className="w-4 h-4 text-postech" />
                <span>관리자 비밀번호 변경</span>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    새 관리자 비밀번호
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-postech"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-postech"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>비밀번호 변경 저장</span>
                </button>
              </form>
            </div>
          </div>
        )}




        {/* Global Save Status Message */}
        {saveStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2 flex items-center gap-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
