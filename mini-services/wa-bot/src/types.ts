/**
 * IDM WA Bot - Type Definitions
 */

export interface BotConfig {
  port: number;
  databaseUrl: string;
  directDatabaseUrl: string;
  idmApiUrl: string;
  adminNumbers: string[];
  groupJids: string[];
  sessionName: string;
  welcomeMessage: string;
  logLevel: string;
}

export interface PlayerData {
  id: string;
  gamertag: string;
  name: string;
  division: string;
  tier: string;
  points: number;
  totalWins: number;
  totalMvp: number;
  matches: number;
  streak: number;
  maxStreak: number;
  avatar?: string;
  club?: string;
}

export interface TournamentData {
  id: string;
  name: string;
  weekNumber: number;
  division: string;
  status: string;
  format: string;
  scheduledAt?: string;
}

export interface MatchData {
  id: string;
  round: number;
  matchNumber: number;
  team1: { name: string };
  team2: { name: string };
  score1: number | null;
  score2: number | null;
  status: string;
  mvpPlayer?: { gamertag: string } | null;
  scheduledAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  gamertag: string;
  name: string;
  division: string;
  tier: string;
  points: number;
  totalWins: number;
  totalMvp: number;
  matches: number;
  streak: number;
  club?: string;
}

export interface ClubData {
  id: string;
  name: string;
  logo?: string;
  division: string;
  wins: number;
  losses: number;
  points: number;
  members?: { gamertag: string; role: string }[];
}

export interface WaRegistration {
  id: string;
  waNumber: string;
  gamertag: string;
  name: string;
  division: string;
  city: string;
  clubName: string | null;
  verificationCode: string;
  status: string;
  assignedTier: string | null;
  playerId: string | null;
  tournamentId: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface SeasonData {
  id: string;
  name: string;
  number: number;
  division: string;
  status: string;
}

export interface CommandContext {
  from: string;
  sender: string;
  senderName: string;
  isGroup: boolean;
  groupId?: string;
  isFromMe: boolean;
  quotedMsg?: unknown;
  args: string[];
  rawText: string;
  command: string;
}

export interface BotStatus {
  service: string;
  version: string;
  waStatus: 'connecting' | 'connected' | 'disconnected' | 'banned';
  phoneNumber?: string;
  batteryLevel?: number;
  uptime: number;
  messagesReceived: number;
  messagesSent: number;
  commandsProcessed: number;
  lastConnectedAt?: string;
  startTime: string;
}

export interface AdminSession {
  jid: string;
  role: 'admin' | 'super_admin';
  authenticatedAt: string;
}

/** Database row types for direct PostgreSQL queries */
export interface DbRow {
  id: string;
  [key: string]: unknown;
}
