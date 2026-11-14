import React, { useState, useMemo } from 'react';
import {
  MatchResultType,
  RawScheduledMatch,
  SportKey,
  SCHOOLS,
} from '../../../types/stadium';
import {
  TournamentTreeData,
  TournamentGameNode,
  convertTreeToMatches,
  propagateTournamentTreeWinners,
  isGameNodeConfirmed,
} from '../../../types/tournamentTree';
import { AdminTournamentBuilder } from '../../../components/AdminTournamentBuilder';
import {
  syncSupabaseSportMatches,
  updateSupabaseTournamentTree,
} from '../../../lib/supabase';
import { getEventDate } from '../../../utils/matchEvaluator';
import { calculateOverallStandings, SPORT_POINTS_TABLE } from '../../../utils/standingsCalculator';
import { Trophy, Clock, Save, Trash2, CheckCircle2, Edit3, RotateCcw, Award } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { TranslationKey } from '../../../locales/ko';
import {
  encodeBilingual,
  getLocalizedValue,
  localizeRoundName,
  localizeTeamPlaceholder,
  localizeVenueName,
  parseBilingual,
} from '../../../utils/bilingual';
import { finalizeBilingualText } from '../../../utils/autoTranslate';

interface MatchesTabProps {
  matches: RawScheduledMatch[];
  setMatches: React.Dispatch<React.SetStateAction<RawScheduledMatch[]>>;
  tournamentTrees: Record<string, TournamentTreeData>;
  setTournamentTrees: React.Dispatch<React.SetStateAction<Record<string, TournamentTreeData>>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

const SPORT_OPTIONS: {
  key: SportKey;
  labelKey: TranslationKey;
  koName: string;
  enName: string;
  icon: string;
}[] = [
  { key: 'soccer', labelKey: 'sports.soccer', koName: '축구', enName: 'Soccer', icon: '⚽' },
  { key: 'baseball', labelKey: 'sports.baseball', koName: '야구', enName: 'Baseball', icon: '⚾' },
  { key: 'lol', labelKey: 'sports.lol', koName: 'LoL', enName: 'LoL', icon: '🎮' },
  {
    key: 'badminton_men',
    labelKey: 'sports.badmintonMen',
    koName: '배드민턴 (남복)',
    enName: 'Badminton (MD)',
    icon: '🏸',
  },
  {
    key: 'badminton_women',
    labelKey: 'sports.badmintonWomen',
    koName: '배드민턴 (여복)',
    enName: 'Badminton (WD)',
    icon: '🏸',
  },
  {
    key: 'badminton_mixed',
    labelKey: 'sports.badmintonMixed',
    koName: '배드민턴 (혼복)',
    enName: 'Badminton (XD)',
    icon: '🏸',
  },
  {
    key: 'basketball',
    labelKey: 'sports.basketball',
    koName: '농구',
    enName: 'Basketball',
    icon: '🏀',
  },
];

const MiniBilingualInput: React.FC<{
  value: string;
  onChange: (encoded: string) => void;
  placeholderKo?: string;
  placeholderEn?: string;
  widthClass?: string;
  bold?: boolean;
}> = ({
  value,
  onChange,
  placeholderKo = 'KOR',
  placeholderEn = 'ENG (auto)',
  widthClass = 'w-28',
  bold = false,
}) => {
  const { ko, en } = parseBilingual(value);
  return (
    <div className={`space-y-0.5 ${widthClass}`} onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        value={ko}
        placeholder={placeholderKo}
        onChange={(e) => onChange(encodeBilingual(e.target.value, en))}
        className={`w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-slate-900 ${
          bold ? 'font-bold' : ''
        }`}
      />
      <input
        type="text"
        value={en}
        placeholder={placeholderEn}
        onChange={(e) => onChange(encodeBilingual(ko, e.target.value))}
        className="w-full bg-indigo-50/40 border border-indigo-200 rounded px-1.5 py-0.5 text-[10px] text-indigo-900"
      />
    </div>
  );
};

export const MatchesTab: React.FC<MatchesTabProps> = ({
  matches,
  setMatches,
  tournamentTrees,
  setTournamentTrees,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const { language, t } = useLanguage();
  const [selectedSportKey, setSelectedSportKey] = useState<SportKey>('soccer');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingGameIds, setEditingGameIds] = useState<Record<string, boolean>>({});

  const currentSportInfo =
    SPORT_OPTIONS.find((s) => s.key === selectedSportKey) || SPORT_OPTIONS[0];
  const currentSportLabel = t(currentSportInfo.labelKey);

  const currentTree: TournamentTreeData = useMemo(() => {
    const raw = tournamentTrees[selectedSportKey] || {
      sportKey: selectedSportKey,
      nodes: {},
      manualRanks: {},
    };
    return propagateTournamentTreeWinners(raw);
  }, [tournamentTrees, selectedSportKey]);

  const nodes = currentTree.nodes || {};
  const allNodeList = Object.values(nodes);

  // Group nodes: Team nodes (level 0) & Game nodes (level >= 1)
  const teamNodes = allNodeList
    .filter((n) => n.type === 'team')
    .sort((a: any, b: any) => (a.colIndex || 0) - (b.colIndex || 0));

  const gameNodes = allNodeList
    .filter((n) => n.type === 'game')
    .sort((a: any, b: any) => (a.level || 1) - (b.level || 1));

  const isPlaceholderTeam = (name: string) =>
    name.includes('승자') ||
    name.includes('패자') ||
    name.includes('Winner') ||
    name.includes('Loser');

  // Auto-populate English fields in tree nodes before persisting
  const finalizeTreeBilingualFields = async (
    rawTree: TournamentTreeData
  ): Promise<TournamentTreeData> => {
    const nextNodes = { ...(rawTree.nodes || {}) };
    await Promise.all(
      Object.entries(nextNodes).map(async ([id, node]) => {
        if (node.type !== 'game') return;
        const koRound = parseBilingual(node.roundName).ko;
        const roundFixed =
          node.roundName && !node.roundName.includes(' ||| ')
            ? encodeBilingual(koRound, localizeRoundName(koRound, 'en'))
            : await finalizeBilingualText(node.roundName);

        const venueFixed =
          node.venue && !node.venue.includes(' ||| ')
            ? (() => {
                const koV = parseBilingual(node.venue).ko;
                const mapped = localizeVenueName(koV, 'en');
                return mapped !== koV ? encodeBilingual(koV, mapped) : finalizeBilingualText(node.venue);
              })()
            : finalizeBilingualText(node.venue || '');

        const finalizeTeam = async (team: string) => {
          if (!team || SCHOOLS[team]) return team;
          if (!team.includes(' ||| ') && isPlaceholderTeam(team)) {
            const koT = parseBilingual(team).ko;
            return encodeBilingual(koT, localizeTeamPlaceholder(koT, 'en'));
          }
          return finalizeBilingualText(team);
        };

        const [resolvedVenue, resolvedT1, resolvedT2] = await Promise.all([
          Promise.resolve(venueFixed),
          finalizeTeam(node.team1),
          finalizeTeam(node.team2),
        ]);

        nextNodes[id] = {
          ...node,
          roundName: roundFixed,
          venue: resolvedVenue,
          team1: resolvedT1,
          team2: resolvedT2,
        };
      })
    );
    return { ...rawTree, nodes: nextNodes };
  };

  // Persist a sport's tournament tree & synchronized matches in bulk
  const saveSportTreeAndMatches = async (
    sKey: SportKey,
    rawTargetTree: TournamentTreeData,
    customSuccessMsg?: string
  ) => {
    setIsSaving(true);
    try {
      const bilingualTree = await finalizeTreeBilingualFields(rawTargetTree);
      const propagated = propagateTournamentTreeWinners(bilingualTree);
      setTournamentTrees((prev) => ({ ...prev, [sKey]: propagated }));

      const sInfo = SPORT_OPTIONS.find((s) => s.key === sKey) || SPORT_OPTIONS[0];
      const sportNameEncoded = encodeBilingual(sInfo.koName, sInfo.enName);
      const updatedSportMatches = convertTreeToMatches(propagated, sportNameEncoded, sInfo.icon);

      const [treeOk, matchesOk] = await Promise.all([
        updateSupabaseTournamentTree(sKey, propagated),
        syncSupabaseSportMatches(sKey, updatedSportMatches),
      ]);

      setMatches((prev) => [...prev.filter((m) => m.sportKey !== sKey), ...updatedSportMatches]);

      if (treeOk && matchesOk) {
        setSaveStatus(
          customSuccessMsg || t('admin.matches.treeSaved', { sport: t(sInfo.labelKey) })
        );
      } else {
        setSaveStatus(t('admin.matches.treeSaveErr'));
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handleSaveTournamentTree = async (sKey: SportKey) => {
    const targetTree = tournamentTrees[sKey] || { sportKey: sKey, nodes: {}, manualRanks: {} };
    await saveSportTreeAndMatches(sKey, targetTree);
  };

  // Determine active status of a game node (using Nov 14 event date)
  const getGameNodeStatus = (game: TournamentGameNode): 'before' | 'live' | 'after' => {
    if (isGameNodeConfirmed(game)) return 'after';
    const now = new Date();
    const start = getEventDate(now, game.startHour, game.startMinute);
    const end = getEventDate(now, game.endHour, game.endMinute);
    const nowMs = now.getTime();
    if (nowMs >= start.getTime() && nowMs <= end.getTime()) return 'live';
    return 'before';
  };

  // Helper to check if a child node is a game (has dependent game)
  const getChildGame = (childId: string): TournamentGameNode | null => {
    const node = nodes[childId];
    if (node && node.type === 'game') return node;
    return null;
  };

  // Update a team node's school name in treeData
  const handleTeamNodeSchoolChange = (nodeId: string, newSchoolName: string) => {
    const targetNode = nodes[nodeId];
    if (!targetNode || targetNode.type !== 'team') return;

    const updatedNode = { ...targetNode, teamName: newSchoolName };
    const rawNodes = { ...nodes, [nodeId]: updatedNode };
    const rawTree = { ...currentTree, nodes: rawNodes };
    const newTree = propagateTournamentTreeWinners(rawTree);

    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: newTree }));
  };

  // Update a game node's field in treeData
  const handleGameNodeChange = (
    nodeId: string,
    field: keyof TournamentGameNode,
    value: any
  ) => {
    const targetNode = nodes[nodeId];
    if (!targetNode || targetNode.type !== 'game') return;

    const updatedNode: TournamentGameNode = { ...targetNode, [field]: value };
    const rawNodes = { ...nodes, [nodeId]: updatedNode };
    const rawTree = { ...currentTree, nodes: rawNodes };
    const newTree = propagateTournamentTreeWinners(rawTree);

    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: newTree }));
  };

  // Confirm final score / result for a single game node
  const handleConfirmGameScore = async (gNode: TournamentGameNode) => {
    const rType: MatchResultType = gNode.resultType || 'normal';

    if (
      rType !== 'cancelled' &&
      (isPlaceholderTeam(gNode.team1) || isPlaceholderTeam(gNode.team2))
    ) {
      alert(t('admin.matches.alertUnresolvedTeams'));
      return;
    }

    if (rType === 'normal' && gNode.score1 === gNode.score2) {
      alert(t('admin.matches.alertDrawNotAllowed'));
      return;
    }

    const confirmedNode: TournamentGameNode = {
      ...gNode,
      isConfirmed: true,
      status: 'after',
      isLive: false,
      resultType: rType,
    };

    const rawNodes = { ...nodes, [gNode.id]: confirmedNode };
    const nextTree = propagateTournamentTreeWinners({
      ...currentTree,
      nodes: rawNodes,
    });

    setEditingGameIds((prev) => {
      const next = { ...prev };
      delete next[gNode.id];
      return next;
    });

    const roundDisplay = getLocalizedValue(gNode.roundName, language, (ko) =>
      localizeRoundName(ko, language)
    );
    await saveSportTreeAndMatches(
      selectedSportKey,
      nextTree,
      t('admin.matches.confirmedToast', { sport: currentSportLabel, round: roundDisplay })
    );
  };

  // Unlock a confirmed game node for editing
  const handleStartEditGameScore = (gameId: string) => {
    setEditingGameIds((prev) => ({ ...prev, [gameId]: true }));
  };

  // Revert a confirmed game node back to unconfirmed VS state
  const handleResetGameUnconfirmed = async (gNode: TournamentGameNode) => {
    const resetNode: TournamentGameNode = {
      ...gNode,
      score1: 0,
      score2: 0,
      isConfirmed: false,
      status: 'before',
      isLive: false,
      resultType: 'normal',
    };

    const rawNodes = { ...nodes, [gNode.id]: resetNode };
    const nextTree = propagateTournamentTreeWinners({
      ...currentTree,
      nodes: rawNodes,
    });

    setEditingGameIds((prev) => {
      const next = { ...prev };
      delete next[gNode.id];
      return next;
    });

    const roundDisplay = getLocalizedValue(gNode.roundName, language, (ko) =>
      localizeRoundName(ko, language)
    );
    await saveSportTreeAndMatches(
      selectedSportKey,
      nextTree,
      t('admin.matches.unconfirmedToast', { sport: currentSportLabel, round: roundDisplay })
    );
  };

  // Update manual rank for a school in the current sport
  const handleManualRankChange = (schoolId: string, rankVal: number) => {
    const currentManual = { ...(currentTree.manualRanks || {}) };
    if (rankVal <= 0) {
      delete currentManual[schoolId];
    } else {
      currentManual[schoolId] = rankVal;
    }
    const nextTree: TournamentTreeData = {
      ...currentTree,
      manualRanks: currentManual,
    };
    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: nextTree }));
  };

  // Force-assign a podium slot (1st / 2nd / 3rd) cleanly to a single school (or revert that rank to auto)
  const handleQuickPodiumRank = (targetRank: 1 | 2 | 3, schoolId: string) => {
    const currentManual = { ...(currentTree.manualRanks || {}) };
    for (const [sid, val] of Object.entries(currentManual)) {
      if (Number(val) === targetRank) {
        delete currentManual[sid];
      }
    }
    if (schoolId) {
      currentManual[schoolId] = targetRank;
    }
    const nextTree: TournamentTreeData = {
      ...currentTree,
      manualRanks: currentManual,
    };
    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: nextTree }));
  };

  // Clear all manual rank overrides for the current sport
  const handleResetManualRanks = () => {
    const nextTree: TournamentTreeData = {
      ...currentTree,
      manualRanks: {},
    };
    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: nextTree }));
  };

  // Compute live preview of overall and current-sport standings
  const overallStandingsPreview = useMemo(
    () =>
      calculateOverallStandings(
        matches,
        new Date(),
        {
          ...tournamentTrees,
          [selectedSportKey]: currentTree,
        },
        language
      ),
    [matches, tournamentTrees, selectedSportKey, currentTree, language]
  );

  const currentStandingsPreview = useMemo(() => {
    const map: Record<string, { rank: number; points: number; isTied?: boolean }> = {};
    for (const st of overallStandingsPreview) {
      const sp = st.breakdown[selectedSportKey];
      if (sp) {
        map[st.schoolId] = { rank: sp.rank, points: sp.points, isTied: sp.isTied };
      }
    }
    return map;
  }, [overallStandingsPreview, selectedSportKey]);

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    if (!confirm(t('admin.matches.confirmDeleteNode'))) return;
    const updated = { ...nodes };
    delete updated[nodeId];

    Object.keys(updated).forEach((k) => {
      const n = updated[k];
      if (n.type === 'game' && (n.child1Id === nodeId || n.child2Id === nodeId)) {
        delete updated[k];
      }
    });

    const newTree = { ...currentTree, nodes: updated };
    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: newTree }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const SCHOOL_OPTIONS = Object.keys(SCHOOLS);

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-4 w-full">
      {/* Header & Sport Selector Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 pb-3 w-full">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>{t('admin.matches.title')}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('admin.matches.subtitle')}</p>
        </div>

        {/* Sport Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
          {SPORT_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setSelectedSportKey(s.key);
                setSelectedNodeId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                selectedSportKey === s.key
                  ? 'bg-postech text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{s.icon}</span>
              <span>{t(s.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Unified 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Visual Tournament Tree Canvas */}
        <div className="lg:col-span-6">
          <AdminTournamentBuilder
            sportKey={selectedSportKey}
            treeData={currentTree}
            onChange={(newTree) => {
              setTournamentTrees((prev) => ({
                ...prev,
                [selectedSportKey]: newTree,
              }));
            }}
            onSave={() => handleSaveTournamentTree(selectedSportKey)}
            isSaving={isSaving}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            onSelectGame={(game) => setSelectedNodeId(game ? game.id : null)}
          />
        </div>

        {/* Right Column: Node List */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          {/* Table Header & Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-postech" />
              <h3 className="font-extrabold text-sm text-slate-800">
                {t('admin.matches.nodeListHeader', {
                  icon: currentSportInfo.icon,
                  sport: currentSportLabel,
                  count: allNodeList.length,
                })}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSaveTournamentTree(selectedSportKey)}
                disabled={isSaving}
                className="px-3 py-1.5 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('admin.matches.saveTreeAll')}</span>
              </button>
            </div>
          </div>

          {/* Node List Container */}
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] no-scrollbar space-y-4 pr-1">
            {allNodeList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-2">
                <p className="font-bold text-xs">{t('admin.matches.noNodes')}</p>
                <p className="text-[11px]">{t('admin.matches.noNodesHint')}</p>
              </div>
            ) : (
              <>
                {/* 1. Team Nodes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>{t('admin.matches.teamNodesTitle', { count: teamNodes.length })}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {t('admin.matches.teamNodeHint')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {teamNodes.map((tNode: any, idx: number) => {
                      const isSelected = selectedNodeId === tNode.id;
                      const school = SCHOOLS[tNode.teamName];

                      return (
                        <div
                          key={tNode.id}
                          onClick={() => setSelectedNodeId(tNode.id)}
                          className={`p-2.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'ring-2 ring-postech border-postech bg-rose-50/50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {school && (
                                <span
                                  style={{ backgroundColor: school.color }}
                                  className="w-2 h-4 rounded-xs shrink-0"
                                />
                              )}
                              <select
                                value={tNode.teamName}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleTeamNodeSchoolChange(tNode.id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-extrabold text-slate-900 focus:ring-1 focus:ring-postech focus:outline-hidden"
                              >
                                {SCHOOL_OPTIONS.map((sch) => (
                                  <option key={sch} value={sch}>
                                    {sch}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(tNode.id);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title={t('admin.matches.deleteTeamTitle')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Game Nodes */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{t('admin.matches.gameNodesTitle', { count: gameNodes.length })}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {t('admin.matches.gameNodeHint')}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-x-auto w-full">
                    <table className="w-full text-left text-xs min-w-[820px]">
                      <thead className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200 whitespace-nowrap">
                        <tr>
                          <th className="p-2.5 whitespace-nowrap">{t('admin.matches.colRound')}</th>
                          <th className="p-2.5 whitespace-nowrap">
                            {t('admin.matches.colMatchup')}
                          </th>
                          <th className="p-2.5 whitespace-nowrap">
                            {t('admin.matches.colResult')}
                          </th>
                          <th className="p-2.5 whitespace-nowrap">
                            {t('admin.matches.colConfirm')}
                          </th>
                          <th className="p-2.5 whitespace-nowrap">{t('admin.matches.colTime')}</th>
                          <th className="p-2.5 whitespace-nowrap">{t('admin.matches.colVenue')}</th>
                          <th className="p-2.5 text-right whitespace-nowrap">
                            {t('admin.matches.colDelete')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium whitespace-nowrap">
                        {gameNodes.map((gNode: TournamentGameNode) => {
                          const isSelected = selectedNodeId === gNode.id;
                          const t1School = SCHOOLS[gNode.team1];
                          const t2School = SCHOOLS[gNode.team2];
                          const currentStatus = getGameNodeStatus(gNode);
                          const isConfirmed = isGameNodeConfirmed(gNode);
                          const isEditingScore = !isConfirmed || Boolean(editingGameIds[gNode.id]);
                          const resultType: MatchResultType = gNode.resultType || 'normal';

                          const child1Game = getChildGame(gNode.child1Id);
                          const child2Game = getChildGame(gNode.child2Id);
                          const isT1Locked = Boolean(
                            child1Game && child1Game.resultType !== 'cancelled'
                          );
                          const isT2Locked = Boolean(
                            child2Game && child2Game.resultType !== 'cancelled'
                          );

                          const team1Display = getLocalizedValue(gNode.team1, language, (ko) =>
                            localizeTeamPlaceholder(ko, language)
                          );
                          const team2Display = getLocalizedValue(gNode.team2, language, (ko) =>
                            localizeTeamPlaceholder(ko, language)
                          );

                          return (
                            <tr
                              key={gNode.id}
                              onClick={() => setSelectedNodeId(gNode.id)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50/80 ring-1 ring-amber-300'
                                  : isConfirmed
                                    ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                                    : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Round Name (KOR / ENG) */}
                              <td className="p-2">
                                <MiniBilingualInput
                                  value={gNode.roundName}
                                  onChange={(val) =>
                                    handleGameNodeChange(gNode.id, 'roundName', val)
                                  }
                                  widthClass="w-28"
                                  bold
                                />
                              </td>

                              {/* Teams with Dependency Lock */}
                              <td className="p-2">
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-0.5">
                                    {t1School && (
                                      <span
                                        style={{ backgroundColor: t1School.color }}
                                        className="w-1.5 h-3 rounded-xs shrink-0"
                                      />
                                    )}
                                    <input
                                      type="text"
                                      value={isT1Locked ? team1Display : gNode.team1}
                                      disabled={isT1Locked}
                                      title={
                                        isT1Locked && child1Game
                                          ? t('admin.matches.lockedChildTip', {
                                              round: getLocalizedValue(
                                                child1Game.roundName,
                                                language,
                                                (ko) => localizeRoundName(ko, language)
                                              ),
                                            })
                                          : undefined
                                      }
                                      onChange={(e) =>
                                        handleGameNodeChange(gNode.id, 'team1', e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-24 rounded px-1.5 py-1 text-xs font-bold transition-colors ${
                                        isT1Locked
                                          ? 'bg-slate-100/90 text-slate-500 border border-slate-200 cursor-not-allowed italic'
                                          : 'bg-slate-50 border border-slate-300 text-slate-900'
                                      }`}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold">vs</span>
                                  <div className="flex items-center gap-0.5">
                                    {t2School && (
                                      <span
                                        style={{ backgroundColor: t2School.color }}
                                        className="w-1.5 h-3 rounded-xs shrink-0"
                                      />
                                    )}
                                    <input
                                      type="text"
                                      value={isT2Locked ? team2Display : gNode.team2}
                                      disabled={isT2Locked}
                                      title={
                                        isT2Locked && child2Game
                                          ? t('admin.matches.lockedChildTip', {
                                              round: getLocalizedValue(
                                                child2Game.roundName,
                                                language,
                                                (ko) => localizeRoundName(ko, language)
                                              ),
                                            })
                                          : undefined
                                      }
                                      onChange={(e) =>
                                        handleGameNodeChange(gNode.id, 'team2', e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-24 rounded px-1.5 py-1 text-xs font-bold transition-colors ${
                                        isT2Locked
                                          ? 'bg-slate-100/90 text-slate-500 border border-slate-200 cursor-not-allowed italic'
                                          : 'bg-slate-50 border border-slate-300 text-slate-900'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Result Type & Scores */}
                              <td className="p-2">
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={resultType}
                                    disabled={!isEditingScore}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleGameNodeChange(
                                        gNode.id,
                                        'resultType',
                                        e.target.value as MatchResultType
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`rounded px-1.5 py-1 text-[11px] font-bold border ${
                                      !isEditingScore
                                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                        : resultType === 'cancelled'
                                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                                          : resultType !== 'normal'
                                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                                            : 'bg-slate-50 text-slate-800 border-slate-300'
                                    }`}
                                  >
                                    <option value="normal">{t('admin.matches.resNormal')}</option>
                                    <option value="team1_forfeit_win">
                                      {t('admin.matches.resForfeit', { team: team1Display })}
                                    </option>
                                    <option value="team2_forfeit_win">
                                      {t('admin.matches.resForfeit', { team: team2Display })}
                                    </option>
                                    <option value="cancelled">
                                      {t('admin.matches.resCancelled')}
                                    </option>
                                  </select>

                                  {resultType === 'normal' && (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        disabled={!isEditingScore}
                                        value={gNode.score1 ?? 0}
                                        onChange={(e) =>
                                          handleGameNodeChange(
                                            gNode.id,
                                            'score1',
                                            Math.max(0, parseInt(e.target.value) || 0)
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        className={`w-11 rounded px-1 py-1 text-xs font-black text-center border ${
                                          !isEditingScore
                                            ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                                            : 'bg-white border-slate-300 text-slate-900'
                                        }`}
                                      />
                                      <span className="text-slate-400 font-bold">:</span>
                                      <input
                                        type="number"
                                        min={0}
                                        disabled={!isEditingScore}
                                        value={gNode.score2 ?? 0}
                                        onChange={(e) =>
                                          handleGameNodeChange(
                                            gNode.id,
                                            'score2',
                                            Math.max(0, parseInt(e.target.value) || 0)
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        className={`w-11 rounded px-1 py-1 text-xs font-black text-center border ${
                                          !isEditingScore
                                            ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                                            : 'bg-white border-slate-300 text-slate-900'
                                        }`}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Two-Button Final Score Confirmation / Edit Action */}
                              <td className="p-2">
                                {isEditingScore ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmGameScore(gNode);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{t('admin.matches.confirmBtn')}</span>
                                    </button>

                                    {isConfirmed && (
                                      <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleResetGameUnconfirmed(gNode);
                                        }}
                                        title={t('admin.matches.unconfirmTitle')}
                                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>{t('admin.matches.unconfirmBtn')}</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                                      {t('admin.matches.confirmedBadge')}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditGameScore(gNode.id);
                                      }}
                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>{t('admin.matches.editBtn')}</span>
                                    </button>
                                  </div>
                                )}
                                {!isConfirmed && (
                                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">
                                    {currentStatus === 'live'
                                      ? t('admin.matches.liveVsHint')
                                      : t('admin.matches.pendingVsHint')}
                                  </span>
                                )}
                              </td>

                              {/* Time */}
                              <td className="p-2">
                                <div className="flex items-center gap-0.5 text-[11px]">
                                  <input
                                    type="number"
                                    value={gNode.startHour}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'startHour',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                  <span>:</span>
                                  <input
                                    type="number"
                                    value={gNode.startMinute}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'startMinute',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                  <span>~</span>
                                  <input
                                    type="number"
                                    value={gNode.endHour}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'endHour',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                  <span>:</span>
                                  <input
                                    type="number"
                                    value={gNode.endMinute}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'endMinute',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                </div>
                              </td>

                              {/* Venue (KOR / ENG) */}
                              <td className="p-2">
                                <MiniBilingualInput
                                  value={gNode.venue || ''}
                                  onChange={(val) => handleGameNodeChange(gNode.id, 'venue', val)}
                                  placeholderKo={t('admin.matches.venuePh')}
                                  widthClass="w-24"
                                />
                              </td>

                                {/* Delete Action */}
                              <td className="p-2 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNode(gNode.id);
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title={t('admin.matches.deleteGameTitle')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium border-t border-slate-200 pt-2">
            {t('admin.matches.footerHint')}
          </div>
        </div>
      </div>

      {/* 3. Final Rankings & Forced 1st/2nd/3rd Place Override Panel (Always Visible) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-extrabold text-slate-800">
              {t('admin.matches.rankTitle', { sport: currentSportLabel })}
            </span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
              {t('admin.matches.rankPointsBadge', {
                p1: SPORT_POINTS_TABLE[selectedSportKey]?.[1] || 0,
                p2: SPORT_POINTS_TABLE[selectedSportKey]?.[2] || 0,
                p3: SPORT_POINTS_TABLE[selectedSportKey]?.[3] || 0,
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {Object.keys(currentTree.manualRanks || {}).length > 0 && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleResetManualRanks}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('admin.matches.rankResetBtn')}</span>
              </button>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                saveSportTreeAndMatches(
                  selectedSportKey,
                  currentTree,
                  t('admin.matches.rankSavedToast', { sport: currentSportLabel })
                )
              }
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>{t('admin.matches.rankSaveBtn')}</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          {selectedSportKey === 'soccer'
            ? t('admin.matches.rankGuideSoccer')
            : selectedSportKey === 'lol'
              ? t('admin.matches.rankGuideLol')
              : t('admin.matches.rankGuideOther')}
        </p>

        {/* Quick Podium Pickers: Force 1st / 2nd / 3rd directly */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(
            [
              { rank: 1 as const, labelKey: 'admin.matches.rankQuick1' as const },
              { rank: 2 as const, labelKey: 'admin.matches.rankQuick2' as const },
              { rank: 3 as const, labelKey: 'admin.matches.rankQuick3' as const },
            ]
          ).map(({ rank, labelKey }) => {
            const manualSchoolsForRank = SCHOOL_OPTIONS.filter(
              (sid) => Number(currentTree.manualRanks?.[sid]) === rank
            );
            const selectedManualSchool =
              manualSchoolsForRank.length === 1 ? manualSchoolsForRank[0] : '';
            const effectiveSchoolsForRank = SCHOOL_OPTIONS.filter(
              (sid) => currentStandingsPreview[sid]?.rank === rank
            );
            const autoLabel =
              effectiveSchoolsForRank.length > 0
                ? t('admin.matches.rankQuickAuto', {
                    school: effectiveSchoolsForRank.join(', '),
                  })
                : t('admin.matches.rankQuickAutoNone');

            return (
              <div
                key={rank}
                className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col gap-1 shadow-2xs"
              >
                <span className="text-[11px] font-extrabold text-slate-700">{t(labelKey)}</span>
                <select
                  value={selectedManualSchool}
                  onChange={(e) => handleQuickPodiumRank(rank, e.target.value)}
                  className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold border ${
                    selectedManualSchool
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="">{autoLabel}</option>
                  {SCHOOL_OPTIONS.map((sid) => (
                    <option key={sid} value={sid}>
                      {SCHOOLS[sid].shortName}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Per-School Override Cards (supports ties or explicit 4th+ / '-') */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SCHOOL_OPTIONS.map((sid) => {
            const sch = SCHOOLS[sid];
            const manualVal = currentTree.manualRanks?.[sid] || 0;
            const preview = currentStandingsPreview[sid] || { rank: 0, points: 0 };
            const isPodium = preview.rank >= 1 && preview.rank <= 3 && preview.points > 0;

            return (
              <div
                key={sid}
                className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col gap-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      style={{ backgroundColor: sch.color }}
                      className="w-2 h-3.5 rounded-xs shrink-0"
                    />
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {sch.shortName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 ${
                      isPodium
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {isPodium
                      ? `${
                          preview.isTied
                            ? t('admin.matches.rankTied', { rank: preview.rank })
                            : t('admin.matches.rankNth', { rank: preview.rank })
                        } (+${preview.points}pt)`
                      : t('admin.matches.rankUnset')}
                  </span>
                </div>

                <select
                  value={manualVal}
                  onChange={(e) =>
                    handleManualRankChange(sid, parseInt(e.target.value) || 0)
                  }
                  className={`w-full rounded-lg px-2 py-1 text-[11px] font-bold border ${
                    manualVal > 0
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <option value={0}>{t('admin.matches.rankOptAuto')}</option>
                  <option value={1}>{t('admin.matches.rankOpt1')}</option>
                  <option value={2}>{t('admin.matches.rankOpt2')}</option>
                  <option value={3}>{t('admin.matches.rankOpt3')}</option>
                  <option value={4}>{t('admin.matches.rankOpt4')}</option>
                </select>
              </div>
            );
          })}
        </div>

        {/* Live Overall Standings Strip */}
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-extrabold text-slate-600 shrink-0">
            {t('admin.matches.rankOverallPreview')}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {overallStandingsPreview.map((st) => (
              <span
                key={st.schoolId}
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-800"
              >
                <span className="text-slate-500">
                  {st.totalPoints > 0
                    ? st.isTied
                      ? t('admin.matches.rankTied', { rank: st.rank })
                      : t('admin.matches.rankNth', { rank: st.rank })
                    : '-'}
                </span>
                <span
                  style={{ backgroundColor: st.color }}
                  className="w-1.5 h-3 rounded-xs shrink-0"
                />
                <span className="font-extrabold">{st.shortName}</span>
                <span className="text-postech font-extrabold">{st.totalPoints}pt</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
