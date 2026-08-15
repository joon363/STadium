export interface School {
  id: string;
  name: string;
  shortName: string;
  logoText: string;
  logoUrl: string;
  color: string;
  bgLight: string;
  textColor: string;
}

export { SCHOOLS } from '../constants/schools';

export type SportKey = 'soccer' | 'baseball' | 'lol' | 'badminton' | 'basketball';

export interface RawScheduledMatch {
  id: string;
  sportKey: SportKey;
  sportName: string;
  icon: string;
  team1: string;
  team2: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  venue: string;
  round: string;
  score1Final: number;
  score2Final: number;
  winningTeamFinal?: string | null;
  subtitle?: string;
}

export interface MatchItem {
  id: string;
  sportKey: SportKey;
  sportName: string;
  icon: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  isLive: boolean;
  statusText: string;
  venue: string;
  winningTeam: string | null;
  startTimeObj: Date;
  endTimeObj: Date;
  timeRangeText: string;
  round: string;
  subtitle?: string;
  countdownText?: string;
}

export interface SportConfig {
  key: SportKey;
  name: string;
  icon: string;
  path: string;
  liveMatch: MatchItem;
  schedule: MatchItem[];
}

export interface SportScoreBreakdown {
  sportKey: SportKey;
  sportName: string;
  rank: number;
  points: number;
}

export interface SchoolStanding {
  schoolId: string;
  schoolName: string;
  shortName: string;
  logoText: string;
  logoUrl: string;
  color: string;
  bgLight: string;
  textColor: string;
  rank: number;
  totalPoints: number;
  breakdown: Record<SportKey, SportScoreBreakdown>;
}

export interface StageItem {
  school: string;
  clubName: string;
  category: string; // e.g. '밴드', '댄스', '힙합', '응원단', '기타'
  genre?: string;
  songTitle: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface EvaluatedStagePerformance {
  school: string;
  clubName: string;
  category: string;
  genre?: string;
  songTitle: string;
  statusText: string;
  nextClubName: string;
  nextRemainingText: string;
  isLive: boolean;
}

export interface VenueNode {
  id: string;
  name: string;
  category: 'sports' | 'food' | 'rest' | 'facility';
  x: number;
  y: number;
  lat: number;
  lng: number;
  description: string;
  icon: string;
  isEatingZone?: boolean;
  isRestArea?: boolean;
}

export interface MapWaypoint {
  x: number;
  y: number;
}

export interface MapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  weightMinutes: number;
  waypoints?: MapWaypoint[];
}

export interface NavigationResult {
  totalMinutes: number;
  pathWaypoints: MapWaypoint[];
  edgeIds: string[];
}

export interface BoothItem {
  id: string;
  name: string;
  operator: string;
  location: string;
  category: string;
  description: string;
  operatingHours: string;
  icon: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface SponsorItem {
  id: string;
  name: string;
  tier: 'main' | 'platinum' | 'gold' | 'silver' | 'bronze' | string;
  logoUrl: string;
  description: string;
  websiteUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export interface FoodTruckItem {
  id: string;
  name: string;
  menuSummary: string;
  location: string;
  operatingHours: string;
  icon: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface NoticeItem {
  id?: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt?: string;
}

export interface FAQItem {
  id?: number;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
}

export interface ContactLeader {
  role: string;
  name: string;
  phone: string;
  dept: string;
}

export interface ContactConfig {
  generalLeaders: ContactLeader[];
  deptLeads: ContactLeader[];
  links: {
    kakaoOpenChat: string;
    instagram: string;
    youtube: string;
  };
}
