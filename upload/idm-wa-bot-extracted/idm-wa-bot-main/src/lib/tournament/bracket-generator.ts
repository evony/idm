// @ts-nocheck
import { Team, Match, Tournament, BracketType, MatchStatus } from '@prisma/client';

// Match interface for bracket generation
interface BracketMatch {
  round: number;
  matchNumber: number;
  homeTeamId?: string;
  awayTeamId?: string;
  bracket?: BracketType;
  bracketRound?: string;
  status: MatchStatus;
}

// Generate Single Elimination Bracket
export function generateSingleElimination(teams: string[], tournamentId: string): BracketMatch[] {
  const matches: BracketMatch[] = [];
  const teamCount = teams.length;
  const rounds = Math.ceil(Math.log2(teamCount));
  const totalSlots = Math.pow(2, rounds);
  
  // Create seeded bracket (first round may have byes)
  const shuffledTeams = shuffleArray([...teams]);
  const seededSlots: (string | null)[] = new Array(totalSlots).fill(null);
  
  // Distribute teams across slots
  shuffledTeams.forEach((team, index) => {
    seededSlots[index] = team;
  });
  
  // Generate matches for each round
  let matchNumber = 1;
  
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = totalSlots / Math.pow(2, round);
    
    for (let i = 0; i < matchesInRound; i++) {
      const match: BracketMatch = {
        round,
        matchNumber: matchNumber++,
        bracket: BracketType.SINGLE_ELIMINATION,
        status: MatchStatus.PENDING
      };
      
      // First round: assign teams from seeded slots
      if (round === 1) {
        const slotIndex = i * 2;
        match.homeTeamId = seededSlots[slotIndex] || undefined;
        match.awayTeamId = seededSlots[slotIndex + 1] || undefined;
        
        // Handle byes
        if (!match.homeTeamId && match.awayTeamId) {
          match.status = MatchStatus.BYE;
        } else if (match.homeTeamId && !match.awayTeamId) {
          match.status = MatchStatus.BYE;
        }
      }
      
      matches.push(match);
    }
  }
  
  return matches;
}

// Generate Double Elimination Bracket
export function generateDoubleElimination(teams: string[], tournamentId: string): {
  upperBracket: BracketMatch[];
  lowerBracket: BracketMatch[];
} {
  const upperBracket = generateSingleElimination(teams, tournamentId).map(m => ({
    ...m,
    bracket: BracketType.DOUBLE_ELIMINATION,
    bracketRound: 'UPPER'
  }));
  
  const teamCount = teams.length;
  const rounds = Math.ceil(Math.log2(teamCount));
  const lowerBracket: BracketMatch[] = [];
  
  let matchNumber = upperBracket.length + 1;
  
  // Lower bracket has more rounds
  for (let round = 1; round <= rounds * 2 - 2; round++) {
    // Calculate matches in this round of lower bracket
    const matchesInRound = calculateLowerBracketMatches(round, rounds);
    
    for (let i = 0; i < matchesInRound; i++) {
      lowerBracket.push({
        round,
        matchNumber: matchNumber++,
        bracket: BracketType.DOUBLE_ELIMINATION,
        bracketRound: 'LOWER',
        status: MatchStatus.PENDING
      });
    }
  }
  
  // Grand Final
  lowerBracket.push({
    round: rounds * 2 - 1,
    matchNumber: matchNumber,
    bracket: BracketType.DOUBLE_ELIMINATION,
    bracketRound: 'GRAND_FINAL',
    status: MatchStatus.PENDING
  });
  
  return { upperBracket, lowerBracket };
}

function calculateLowerBracketMatches(round: number, totalRounds: number): number {
  // Lower bracket matches pattern: 1,1,2,2,4,4... for power of 2 tournament
  const pattern = Math.pow(2, Math.floor((round - 1) / 2));
  return Math.min(pattern, Math.pow(2, totalRounds - 2));
}

// Generate Round Robin Matches
export function generateRoundRobin(teams: string[], tournamentId: string): BracketMatch[] {
  const matches: BracketMatch[] = [];
  const teamCount = teams.length;
  let matchNumber = 1;
  
  // If odd number of teams, add a "bye" team
  const effectiveTeams = teamCount % 2 === 0 ? teams : [...teams, 'BYE'];
  const n = effectiveTeams.length;
  
  // Round-robin scheduling algorithm
  for (let round = 0; round < n - 1; round++) {
    for (let match = 0; match < n / 2; match++) {
      const home = (round + match) % (n - 1);
      let away = (n - 1 - match + round) % (n - 1);
      
      // Last team stays fixed
      if (match === 0) {
        away = n - 1;
      }
      
      const homeTeam = effectiveTeams[home];
      const awayTeam = effectiveTeams[away];
      
      // Skip bye matches
      if (homeTeam !== 'BYE' && awayTeam !== 'BYE') {
        matches.push({
          round: round + 1,
          matchNumber: matchNumber++,
          bracket: BracketType.ROUND_ROBIN,
          status: MatchStatus.PENDING,
          homeTeamId: homeTeam,
          awayTeamId: awayTeam
        });
      }
    }
  }
  
  return matches;
}

// Generate Group Stage
export function generateGroupStage(
  teams: string[],
  groupCount: number,
  tournamentId: string
): { groups: { name: string; teams: string[] }[]; matches: BracketMatch[] } {
  const shuffledTeams = shuffleArray([...teams]);
  const groups: { name: string; teams: string[] }[] = [];
  const matches: BracketMatch[] = [];
  
  // Create groups
  const teamsPerGroup = Math.ceil(teams.length / groupCount);
  
  for (let i = 0; i < groupCount; i++) {
    const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
    groups.push({
      name: `Group ${String.fromCharCode(65 + i)}`, // A, B, C...
      teams: groupTeams
    });
    
    // Generate round robin matches for this group
    const groupMatches = generateRoundRobin(groupTeams, tournamentId);
    
    groupMatches.forEach(m => {
      matches.push({
        ...m,
        bracket: BracketType.GROUP_STAGE
      });
    });
  }
  
  return { groups, matches };
}

// Generate Swiss System
export function generateSwiss(
  teams: string[],
  rounds: number,
  tournamentId: string
): BracketMatch[] {
  const matches: BracketMatch[] = [];
  let matchNumber = 1;
  
  // Round 1: Random pairing
  const shuffledTeams = shuffleArray([...teams]);
  
  for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
    matches.push({
      round: 1,
      matchNumber: matchNumber++,
      bracket: BracketType.SWISS,
      status: MatchStatus.PENDING,
      homeTeamId: shuffledTeams[i],
      awayTeamId: shuffledTeams[i + 1]
    });
  }
  
  // Subsequent rounds will be generated based on scores
  // (Placeholder matches for scheduling)
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.floor(teams.length / 2);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round,
        matchNumber: matchNumber++,
        bracket: BracketType.SWISS,
        status: MatchStatus.PENDING
      });
    }
  }
  
  return matches;
}

// Generate Playoff Bracket (Seeded)
export function generatePlayoff(
  teams: { id: string; seed: number; wins: number; points: number }[],
  tournamentId: string
): BracketMatch[] {
  const matches: BracketMatch[] = [];
  const sortedTeams = [...teams].sort((a, b) => {
    // Sort by wins, then points, then seed
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.points !== a.points) return b.points - a.points;
    return a.seed - b.seed;
  });
  
  const teamCount = sortedTeams.length;
  const rounds = Math.ceil(Math.log2(teamCount));
  
  // Create seeded bracket (1v8, 2v7, 3v6, 4v5 pattern)
  let matchNumber = 1;
  
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    
    for (let i = 0; i < matchesInRound; i++) {
      const match: BracketMatch = {
        round,
        matchNumber: matchNumber++,
        bracket: BracketType.PLAYOFF,
        status: MatchStatus.PENDING
      };
      
      if (round === 1) {
        // Seed-based pairing: 1v8, 4v5, 2v7, 3v6
        const highSeed = i + 1;
        const lowSeed = teamCount - i;
        
        match.homeTeamId = sortedTeams[highSeed - 1]?.id;
        match.awayTeamId = sortedTeams[lowSeed - 1]?.id;
      }
      
      matches.push(match);
    }
  }
  
  return matches;
}

// Helper functions
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateTotalRounds(teamCount: number): number {
  return Math.ceil(Math.log2(teamCount));
}

export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function getNextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function getRoundName(round: number, totalRounds: number): string {
  const remaining = totalRounds - round + 1;
  
  switch (remaining) {
    case 1:
      return 'Grand Final';
    case 2:
      return 'Semi Final';
    case 3:
      return 'Quarter Final';
    default:
      return `Round ${round}`;
  }
}

export function getBracketRoundLabel(bracketRound: string | null): string {
  switch (bracketRound) {
    case 'UPPER':
      return 'Upper Bracket';
    case 'LOWER':
      return 'Lower Bracket';
    case 'GRAND_FINAL':
      return 'Grand Final';
    default:
      return '';
  }
}
