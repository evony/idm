'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Swords, Loader2, Star } from 'lucide-react'
import type { TournamentData } from '@/lib/types'
import { statusLabel, statusColor } from '@/lib/types'

export function MatchManager() {
  const [tournaments, setTournaments] = useState<TournamentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [tournamentDetail, setTournamentDetail] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Match result form
  const [matchId, setMatchId] = useState('')
  const [teamScores, setTeamScores] = useState<Record<string, string>>({})
  const [mvpPlayerId, setMvpPlayerId] = useState('')

  const loadTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/tournaments')
      const data = await res.json()
      setTournaments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load tournaments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments])

  const loadTournamentDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`)
      const data = await res.json()
      setTournamentDetail(data)
      if (data.matches?.length > 0) {
        const pendingMatch = data.matches.find((m: any) => m.status !== 'COMPLETED')
        if (pendingMatch) setMatchId(pendingMatch.id)
      }
    } catch (err) {
      console.error('Failed to load tournament detail:', err)
    }
  }

  useEffect(() => {
    if (selectedTournamentId) {
      loadTournamentDetail(selectedTournamentId)
    }
  }, [selectedTournamentId])

  const handleSubmitResult = async () => {
    if (!matchId || Object.keys(teamScores).length === 0) return
    setSubmitting(true)
    try {
      const scores: Record<string, number> = {}
      for (const [key, val] of Object.entries(teamScores)) {
        scores[key] = Number(val)
      }

      const res = await fetch(`/api/tournaments/${selectedTournamentId}/match-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          teamScores: scores,
          mvpPlayerId: mvpPlayerId || undefined,
        }),
      })
      if (res.ok) {
        setTeamScores({})
        setMvpPlayerId('')
        loadTournamentDetail(selectedTournamentId)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to submit result')
      }
    } catch (err) {
      console.error('Failed to submit match result:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const activeTournaments = tournaments.filter(t =>
    ['BRACKET_GENERATED', 'MATCH_IN_PROGRESS', 'SCORING'].includes(t.status)
  )

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Swords className="h-4 w-4 text-red-500" />
        Input Match Result
      </h4>

      {/* Tournament select */}
      <div>
        <Label className="text-xs">Tournament</Label>
        <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
          <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30 mt-1">
            <SelectValue placeholder="Pilih tournament..." />
          </SelectTrigger>
          <SelectContent>
            {activeTournaments.length > 0 ? (
              activeTournaments.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({statusLabel(t.status)})
                </SelectItem>
              ))
            ) : (
              tournaments
                .filter(t => t.status !== 'COMPLETED')
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({statusLabel(t.status)})
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </div>

      {tournamentDetail && (
        <>
          {/* Match select */}
          {tournamentDetail.matches?.length > 0 && (
            <div>
              <Label className="text-xs">Match</Label>
              <Select value={matchId} onValueChange={setMatchId}>
                <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30 mt-1">
                  <SelectValue placeholder="Pilih match..." />
                </SelectTrigger>
                <SelectContent>
                  {tournamentDetail.matches.map((m: any) => (
                    <SelectItem key={m.id} value={m.id} disabled={m.status === 'COMPLETED'}>
                      R{m.round}M{m.matchNumber} - {m.status === 'COMPLETED' ? '✅' : '⏳'}{' '}
                      {m.teams?.map((mt: any) => mt.team?.name).join(' vs ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Score input */}
          {matchId && tournamentDetail.matches && (() => {
            const match = tournamentDetail.matches.find((m: any) => m.id === matchId)
            if (!match || match.status === 'COMPLETED') return null

            return (
              <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <Label className="text-xs font-semibold">Skor</Label>
                {match.teams?.map((mt: any) => (
                  <div key={mt.id} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] min-w-[80px]">
                      {mt.team?.name}
                    </Badge>
                    <Input
                      type="number"
                      placeholder="Score"
                      value={teamScores[mt.teamId] || ''}
                      onChange={(e) => setTeamScores(prev => ({ ...prev, [mt.teamId]: e.target.value }))}
                      className="h-8 text-xs bg-background/50 border-border/30"
                    />
                  </div>
                ))}

                {/* MVP select */}
                {tournamentDetail.teams?.length > 0 && (
                  <div>
                    <Label className="text-xs">MVP (opsional)</Label>
                    <Select value={mvpPlayerId} onValueChange={setMvpPlayerId}>
                      <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30 mt-1">
                        <SelectValue placeholder="Pilih MVP..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentDetail.teams.flatMap((t: any) =>
                          t.participants?.map((p: any) => (
                            <SelectItem key={p.player.id} value={p.player.id}>
                              {p.player.name} ({t.name})
                            </SelectItem>
                          )) || []
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleSubmitResult}
                  disabled={submitting || Object.values(teamScores).some(v => !v)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Star className="h-4 w-4 mr-1" />}
                  Submit Result
                </Button>
              </div>
            )
          })()}

          {/* Completed matches */}
          {tournamentDetail.matches?.filter((m: any) => m.status === 'COMPLETED').length > 0 && (
            <div>
              <Label className="text-xs font-semibold mb-2 block">Match Selesai</Label>
              <div className="space-y-1.5">
                {tournamentDetail.matches
                  .filter((m: any) => m.status === 'COMPLETED')
                  .map((m: any) => (
                    <div key={m.id} className="rounded-lg border border-green-500/10 bg-green-500/5 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">R{m.round}M{m.matchNumber}</span>
                        {m.mvpPlayer && <span className="text-amber-400">⭐ {m.mvpPlayer.name}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.teams?.map((mt: any) => (
                          <span key={mt.id} className={mt.result === 'WIN' ? 'text-green-400 font-semibold' : 'text-muted-foreground'}>
                            {mt.team?.name} {mt.score}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {!selectedTournamentId && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Pilih tournament terlebih dahulu
        </p>
      )}
    </div>
  )
}
