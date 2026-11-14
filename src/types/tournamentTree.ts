import { SportKey, MatchResultType } from './stadium';

export interface TournamentLeafNode {
  id: string; // e.g. "team-1"
  type: 'team';
  teamName: string; // e.g. "POSTECH", "KAIST", "GIST", "UNIST", "DGIST", "KENTECH"
  colIndex: number; // 0, 1, 2, 3, 4, 5... (horizontal order along bottom baseline)
  level: 0; // always 0 for baseline leaf teams
}

export type MatchStatus = 'before' | 'live' | 'after';

export interface TournamentGameNode {
  id: string; // e.g. "game-1", "match-123"
  type: 'game';
  roundName: string; // e.g. "예선 1경기", "본선1", "결선", "3·4위전"
  child1Id: string; // left child node id (can be team or game)
  child2Id: string; // right child node id (can be team or game)
  team1: string; // display team1 or "[Child 1 승자]"
  team2: string; // display team2 or "[Child 2 승자]"
  score1: number;
  score2: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  venue: string;
  isLive?: boolean;
  status?: MatchStatus; // 'before' (경기 전) | 'live' (경기 중) | 'after' (경기 후)
  isConfirmed?: boolean; // 최종 점수 확정 여부
  resultType?: MatchResultType; // 'normal' | 'team1_forfeit_win' | 'team2_forfeit_win' | 'cancelled'
  isThirdPlace?: boolean; // 3·4위전 여부 (자식 노드의 패자가 진출)
  level: number; // max(child1.level, child2.level) + 1
}

export type TournamentNode = TournamentLeafNode | TournamentGameNode;

export interface TournamentTreeData {
  sportKey: SportKey;
  nodes: Record<string, TournamentNode>;
  manualRanks?: Record<string, number>; // schoolId -> rank (1, 2, 3...)
  updatedAt?: number;
}

export interface ComputedPositionNode {
  node: TournamentNode;
  x: number; // center X
  y: number; // top Y
  width: number;
  height: number;
  level: number;
}

export interface ComputedSvgLine {
  id: string;
  path: string;
  isLive: boolean;
  strokeColor: string;
}

// Re-export layout & presets from their dedicated utility modules for backward compatibility
export {
  computeTournamentTreeLayout,
  propagateTournamentTreeWinners,
  isThirdPlaceGameNode,
  isGameNodeConfirmed,
  getConfirmedGameWinner,
  getConfirmedGameLoser,
} from '../utils/tournamentLayout';
export {
  createPhoto1Preset,
  createPhoto2Preset,
  create4TeamPreset,
  convertTreeToMatches,
} from '../utils/tournamentPresets';
