import React, { useState, useEffect, useCallback } from 'react';
import {
  RawScheduledMatch,
  StageItem,
  VenueNode,
  MapEdge,
  SportKey,
} from '../../config/stadiumConfig';
import {
  TournamentTreeData,
} from '../../types/tournamentTree';
import {
  getSupabaseMatches,
  getSupabaseTournamentTree,
  getSupabaseStagePerformances,
  getSupabaseMapData,
  getSupabaseBooths,
  getSupabaseFoodTrucks,
  getSupabaseSponsors,
  getSupabaseNotices,
  getSupabaseFAQs,
  getSupabaseYoutubeLiveUrl,
  BoothItem,
  SponsorItem,
  FoodTruckItem,
  NoticeItem,
  FAQItem,
} from '../../lib/supabase';
import { AdminTab } from './types';
import { AdminAuthGate } from './components/AdminAuthGate';
import { AdminHeader } from './components/AdminHeader';
import { MatchesTab } from './tabs/MatchesTab';
import { StageTab } from './tabs/StageTab';
import { MapTab } from './tabs/MapTab';
import { BoothsTab } from './tabs/BoothsTab';
import { FoodTrucksTab } from './tabs/FoodTrucksTab';
import { SponsorsTab } from './tabs/SponsorsTab';
import { NoticesTab } from './tabs/NoticesTab';
import { FaqsTab } from './tabs/FaqsTab';
import { ContactTab } from './tabs/ContactTab';
import { SettingsTab } from './tabs/SettingsTab';

export const Admin: React.FC = () => {
  // Auth Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('matches');

  // Status & Notification States
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Domain Entity States
  const [matches, setMatches] = useState<RawScheduledMatch[]>([]);
  const [stageItems, setStageItems] = useState<StageItem[]>([]);
  const [mapNodes, setMapNodes] = useState<VenueNode[]>([]);
  const [mapEdges, setMapEdges] = useState<MapEdge[]>([]);
  const [booths, setBooths] = useState<BoothItem[]>([]);
  const [foodTrucks, setFoodTrucks] = useState<FoodTruckItem[]>([]);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState<string>(
    'https://www.youtube.com/@stadium_official'
  );
  const [tournamentTrees, setTournamentTrees] = useState<Record<string, TournamentTreeData>>({});

  // Lazy tab data loaders tracker
  const [loadedTabs, setLoadedTabs] = useState<Set<AdminTab>>(new Set(['matches']));

  // Load matches & tournament tree on login
  const loadMatchesData = useCallback(async (force = false) => {
    try {
      const fetchedMatches = await getSupabaseMatches(force);
      if (fetchedMatches && fetchedMatches.length > 0) {
        setMatches(fetchedMatches);
      }

      const sportsList: SportKey[] = [
        'soccer',
        'baseball',
        'lol',
        'badminton_men',
        'badminton_women',
        'badminton_mixed',
        'basketball',
      ];
      const loadedTrees: Record<string, TournamentTreeData> = {};
      for (const sKey of sportsList) {
        const tree = await getSupabaseTournamentTree(sKey, force);
        if (tree && Object.keys(tree.nodes || {}).length > 0) {
          loadedTrees[sKey] = tree;
        } else {
          loadedTrees[sKey] = { sportKey: sKey, nodes: {} };
        }
      }
      setTournamentTrees(loadedTrees);
    } catch (err) {
      console.error('Failed to load matches data:', err);
    }
  }, []);

  // Load specific tab data on activation (Lazy fetch with cache)
  const loadTabData = useCallback(async (tab: AdminTab, force = false) => {
    try {
      switch (tab) {
        case 'matches':
          await loadMatchesData(force);
          break;
        case 'stage': {
          const fetchedStage = await getSupabaseStagePerformances(force);
          if (fetchedStage && fetchedStage.length > 0) setStageItems(fetchedStage);
          break;
        }
        case 'map': {
          const fetchedMap = await getSupabaseMapData(force);
          if (fetchedMap) {
            if (fetchedMap.nodes && fetchedMap.nodes.length > 0) setMapNodes(fetchedMap.nodes);
            if (fetchedMap.edges && fetchedMap.edges.length > 0) setMapEdges(fetchedMap.edges);
          }
          break;
        }
        case 'booths': {
          const fetchedBooths = await getSupabaseBooths(force);
          setBooths(fetchedBooths);
          break;
        }
        case 'foodtrucks': {
          const fetchedTrucks = await getSupabaseFoodTrucks(force);
          setFoodTrucks(fetchedTrucks);
          break;
        }
        case 'sponsors': {
          const fetchedSponsors = await getSupabaseSponsors(force);
          setSponsors(fetchedSponsors);
          break;
        }
        case 'notices': {
          const fetchedNotices = await getSupabaseNotices(force);
          setNotices(fetchedNotices);
          break;
        }
        case 'faqs': {
          const fetchedFaqs = await getSupabaseFAQs(force);
          setFaqs(fetchedFaqs);
          break;
        }
        case 'settings': {
          const yt = await getSupabaseYoutubeLiveUrl(force);
          if (yt) setYoutubeLiveUrl(yt);
          break;
        }
      }
    } catch (err) {
      console.error(`Error loading data for tab ${tab}:`, err);
    }
  }, [loadMatchesData]);

  // When switching tabs, load the data for that tab if not loaded yet
  useEffect(() => {
    if (isAuthenticated) {
      if (!loadedTabs.has(activeTab)) {
        loadTabData(activeTab, false);
        setLoadedTabs((prev) => new Set([...prev, activeTab]));
      }
    }
  }, [activeTab, isAuthenticated, loadedTabs, loadTabData]);

  // Reload current active tab or all
  const handleRefresh = async () => {
    setIsSaving(true);
    await loadTabData(activeTab, true);
    setIsSaving(false);
    setSaveStatus('데이터를 최신 상태로 새로고침했습니다.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // 1. Unauthenticated Login Gate
  if (!isAuthenticated) {
    return (
      <AdminAuthGate
        onSuccess={() => {
          setIsAuthenticated(true);
          loadTabData('matches', false);
        }}
      />
    );
  }

  // 2. Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isLoading={isSaving}
        saveStatus={saveStatus}
      />

      {/* Main 16:9 Desktop Workspace Layout */}
      <div className="flex-1 w-full p-4 sm:p-6 flex flex-col space-y-4">
        {activeTab === 'matches' && (
          <MatchesTab
            matches={matches}
            setMatches={setMatches}
            tournamentTrees={tournamentTrees}
            setTournamentTrees={setTournamentTrees}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'stage' && (
          <StageTab
            stageItems={stageItems}
            setStageItems={setStageItems}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'map' && (
          <MapTab
            mapNodes={mapNodes}
            setMapNodes={setMapNodes}
            mapEdges={mapEdges}
            setMapEdges={setMapEdges}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'booths' && (
          <BoothsTab
            booths={booths}
            setBooths={setBooths}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'foodtrucks' && (
          <FoodTrucksTab
            foodTrucks={foodTrucks}
            setFoodTrucks={setFoodTrucks}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'sponsors' && (
          <SponsorsTab
            sponsors={sponsors}
            setSponsors={setSponsors}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'notices' && (
          <NoticesTab
            notices={notices}
            setNotices={setNotices}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'faqs' && (
          <FaqsTab
            faqs={faqs}
            setFaqs={setFaqs}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}

        {activeTab === 'contact' && (
          <ContactTab setSaveStatus={setSaveStatus} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            youtubeLiveUrl={youtubeLiveUrl}
            setYoutubeLiveUrl={setYoutubeLiveUrl}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            setSaveStatus={setSaveStatus}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
