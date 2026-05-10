/**
 * Shared data interfaces for IDM League stats API response.
 * All components should import from here instead of defining locally.
 */

export interface SeasonData {
  id: string;
  name: string;
  number: number;
  status: string;
}

export interface TournamentTeamPlayer {
  player: {
    id: string;
    name: string;
    gamertag: string;
    tier: string;
    points: number;
  };
}

export interface TournamentTeam {
  id: string;
  name: string;
  isWinner: boolean;
  power: number;
  teamPlayers: TournamentTeamPlayer[];
}

export interface TournamentMatch {
  id: string;
  score1: number | null;
  score2: number | null;
  status: string;
  round?: number;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  mvpPlayer: { id: string; name: string; gamertag: string } | null;
}

export interface TournamentDonation {
  id: string;
  donorName: string;
  amount: number;
  message: string | null;
}

export interface ActiveTournament {
  id: string;
  name: string;
  weekNumber: number;
  status: string;
  prizePool: number;
  bpm: number;
  location: string;
  scheduledAt: string;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  donations: TournamentDonation[];
}

export interface TopPlayer {
  id: string;
  name: string;
  gamertag: string;
  avatar?: string | null;
  tier: string;
  points: number;
  totalWins: number;
  streak: number;
  maxStreak: number;
  totalMvp: number;
  matches: number;
  club?: string;
  division?: string;
}

export interface ClubData {
  id: string;
  name: string;
  logo?: string | null;
  wins: number;
  losses: number;
  points: number;
  gameDiff: number;
  _count?: { members: number };
}

export interface MatchResult {
  id: string;
  score1: number;
  score2: number;
  club1: { name: string };
  club2: { name: string };
  week: number;
}

export interface UpcomingMatch {
  id: string;
  club1: { name: string };
  club2: { name: string };
  week: number;
}

export interface SeasonProgress {
  totalWeeks: number;
  completedWeeks: number;
  percentage: number;
}

export interface TopDonor {
  donorName: string;
  totalAmount: number;
  donationCount: number;
}

export interface TopDonorEnriched extends TopDonor {
  tier: string;
  tierColor: string;
  tierIcon: string;
}

export interface WeeklyChampion {
  weekNumber: number;
  tournamentName: string;
  prizePool: number;
  completedAt: string | null;
  winnerTeam: {
    name: string;
    players: {
      id: string;
      gamertag: string;
      avatar?: string | null;
      tier: string;
      points: number;
      totalWins: number;
      totalMvp: number;
      streak: number;
      matches: number;
    }[];
  } | null;
  mvp: { id: string; gamertag: string; avatar?: string | null; tier: string; totalMvp: number; points: number } | null;
}

export interface MvpHallOfFameEntry {
  id: string;
  gamertag: string;
  avatar?: string | null;
  tier: string;
  totalMvp: number;
  points: number;
  totalWins: number;
  streak: number;
  weekNumber: number;
  tournamentName: string;
  division?: 'male' | 'female';
}

export interface TournamentSummary {
  id: string;
  name: string;
  weekNumber: number;
  status: string;
  prizePool: number;
}

/**
 * Main StatsData interface — matches /api/stats response.
 * All optional enrichment fields are marked as optional.
 */
export interface StatsData {
  hasData: boolean;
  division: string;
  season: SeasonData;
  activeTournament: ActiveTournament | null;
  totalPlayers: number;
  totalPrizePool: number;
  seasonDonationTotal: number;
  topPlayers: TopPlayer[];
  recentMatches: MatchResult[];
  upcomingMatches: UpcomingMatch[];
  seasonProgress: SeasonProgress;
  topDonors: TopDonor[];
  clubs: ClubData[];
  weeklyChampions: WeeklyChampion[];
  mvpHallOfFame: MvpHallOfFameEntry[];
  /** Optional: included in landing page enriched response */
  tournaments?: TournamentSummary[];
  /** Optional: enriched topDonors with tier info (landing page) */
  topDonorsEnriched?: TopDonorEnriched[];
}
