import rawSnapshot from './archivedSnapshot.json';
import {
  BoothItem,
  ContactConfig,
  FAQItem,
  FoodTruckItem,
  MapEdge,
  NoticeItem,
  RawScheduledMatch,
  SponsorItem,
  StageItem,
  VenueNode,
  YouTubeLiveItem,
} from '../types/stadium';
import { TournamentTreeData } from '../types/tournamentTree';

export interface ArchivedSnapshot {
  matches: RawScheduledMatch[];
  tournamentTrees: Record<string, TournamentTreeData>;
  stagePerformances: StageItem[];
  youtubeLiveList: YouTubeLiveItem[];
  stageDelayMinutes: number;
  booths: BoothItem[];
  foodTrucks: FoodTruckItem[];
  sponsors: SponsorItem[];
  notices: NoticeItem[];
  faqs: FAQItem[];
  contactConfig: ContactConfig;
  mapData: { nodes: VenueNode[]; edges: MapEdge[] };
}

export const ARCHIVED_SNAPSHOT = rawSnapshot as unknown as ArchivedSnapshot;
