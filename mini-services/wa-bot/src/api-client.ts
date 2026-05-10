/**
 * IDM WA Bot - API Client
 * HTTP client to call main IDM app API endpoints
 */

import type { BotConfig } from './types';

export class ApiClient {
  private baseUrl: string;

  constructor(config: BotConfig) {
    this.baseUrl = config.idmApiUrl.replace(/\/+$/, '');
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
      }

      return await res.json() as T;
    } catch (err: any) {
      if (err.name === 'TimeoutError') throw new Error('API timeout (15s)');
      throw err;
    }
  }

  // ─── Stats ────────────────────────────

  async getStats(division: string) {
    return this.fetch(`/api/stats?division=${division}`);
  }

  // ─── Players ──────────────────────────

  async searchPlayers(query: string) {
    return this.fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
  }

  async getPlayer(id: string) {
    return this.fetch(`/api/players/${id}`);
  }

  // ─── Leaderboard ─────────────────────

  async getLeaderboard(division: string) {
    return this.fetch(`/api/leaderboard?division=${division}`);
  }

  // ─── Tournaments ─────────────────────

  async getTournamentStatus() {
    return this.fetch('/api/tournament-status');
  }

  async getTournaments(division: string) {
    return this.fetch(`/api/tournaments?division=${division}`);
  }

  // ─── Seasons ─────────────────────────

  async getSeasons(division?: string) {
    const params = division ? `?division=${division}` : '';
    return this.fetch(`/api/seasons${params}`);
  }

  // ─── Clubs ───────────────────────────

  async getClubs(division?: string) {
    const params = division ? `?division=${division}` : '';
    return this.fetch(`/api/clubs${params}`);
  }

  // ─── Matches ─────────────────────────

  async getLiveMatches() {
    return this.fetch('/api/matches/live-count');
  }

  async getNextMatch() {
    return this.fetch('/api/matches/next');
  }

  async getRecentMatches() {
    return this.fetch('/api/matches/recent');
  }

  // ─── WA Registrations ────────────────

  async getWaRegistrations(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.fetch(`/api/wa-registrations${params}`);
  }

  async approveWaRegistration(id: string, assignedTier?: string) {
    return this.fetch(`/api/wa-registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved', assignedTier }),
    });
  }

  // ─── Rankings ────────────────────────

  async getRankings(division: string) {
    return this.fetch(`/api/rankings?division=${division}`);
  }

  // ─── League ──────────────────────────

  async getLeagueStandings(division: string) {
    return this.fetch(`/api/league/standings?division=${division}`);
  }
}
