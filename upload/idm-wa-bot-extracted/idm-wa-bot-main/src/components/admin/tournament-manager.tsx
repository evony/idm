'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Play, Shuffle, Trophy, Loader2 } from 'lucide-react'
import type { SeasonData, TournamentData } from '@/lib/types'
import { statusLabel, statusColor, formatRupiah } from '@/lib/types'

export function TournamentManager() {
  const [seasons, setSeasons] = useState<SeasonData[]>([])
  const [tournaments, setTournaments] = useState<TournamentData[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null)

  // Form state
  const [seasonId, setSeasonId] = useState('')
  const [name, setName] = useState('')
  const [weekNumber, setWeekNumber] = useState('')
  const [division, setDivision] = useState('MALE')
  const [scheduledAt, setScheduledAt] = useState('')
  const [bpm, setBpm] = useState('130')
  const [area, setArea] = useState('Online')

  const loadData = useCallback(async () => {
    try {
      const [seasonsRes, tournamentsRes] = await Promise.all([
        fetch('/api/seasons'),
        fetch('/api/tournaments'),
      ])
      const seasonsData = await seasonsRes.json()
      const tournamentsData = await tournamentsRes.json()
      setSeasons(Array.isArray(seasonsData) ? seasonsData : [])
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : [])
      if (seasonsData.length > 0 && !seasonId) {
        const activeSeason = seasonsData.find((s: SeasonData) => s.isActive)
        setSeasonId(activeSeason?.id || seasonsData[0]?.id)
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err)
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async () => {
    if (!seasonId || !name || !weekNumber || !division || !scheduledAt) return
    setCreating(true)
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonId,
          name,
          weekNumber: Number(weekNumber),
          division,
          scheduledAt,
          bpm: Number(bpm) || 130,
          area,
        }),
      })
      if (res.ok) {
        setName('')
        setWeekNumber('')
        setScheduledAt('')
        setBpm('130')
        loadData()
      }
    } catch (err) {
      console.error('Failed to create tournament:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleGenerateTeams = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/generate-teams`, { method: 'POST' })
      if (res.ok) loadData()
    } catch (err) {
      console.error('Failed to generate teams:', err)
    }
  }

  const handleGenerateBracket = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/generate-bracket`, { method: 'POST' })
      if (res.ok) loadData()
    } catch (err) {
      console.error('Failed to generate bracket:', err)
    }
  }

  const handleFinalize = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/finalize`, { method: 'POST' })
      if (res.ok) loadData()
    } catch (err) {
      console.error('Failed to finalize:', err)
    }
  }

  const handleDelete = async (tournamentId: string) => {
    if (!confirm('Hapus tournament ini?')) return
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (err) {
      console.error('Failed to delete tournament:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Tournament Form */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Buat Tournament Baru
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Season</Label>
            <Select value={seasonId} onValueChange={setSeasonId}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30 mt-1">
                <SelectValue placeholder="Pilih Season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.isActive ? '(Aktif)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label className="text-xs">Nama Tournament</Label>
            <Input
              placeholder="Week 6 - Male Division"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs bg-background/50 border-border/30 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Week</Label>
            <Input
              type="number"
              placeholder="6"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="h-8 text-xs bg-background/50 border-border/30 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Division</Label>
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">♂ Male</SelectItem>
                <SelectItem value="FEMALE">♀ Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Jadwal</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-8 text-xs bg-background/50 border-border/30 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">BPM</Label>
            <Input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              className="h-8 text-xs bg-background/50 border-border/30 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Area</Label>
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-8 text-xs bg-background/50 border-border/30 mt-1"
            />
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={creating || !name || !weekNumber || !seasonId}
          className="w-full mt-3 bg-primary hover:bg-primary/90 text-white"
          size="sm"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Buat Tournament
        </Button>
      </div>

      {/* Tournament List */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Semua Tournament</h4>
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="rounded-lg border border-border/20 bg-card/50 p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[9px] ${statusColor(t.status)}`}>
                      {statusLabel(t.status)}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">
                      {t.division === 'MALE' ? '♂' : '♀'} {t.division}
                    </Badge>
                  </div>
                </div>
                <span className="text-xs text-amber-500 font-semibold">{formatRupiah(t.prizePool)}</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                <span>👥 {t._count.participants}</span>
                <span>🏟️ {t._count.teams}</span>
                <span>⚔️ {t._count.matches}</span>
                <span>💰 {t._count.donations}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {t.status === 'REGISTRATION' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] border-green-500/30 text-green-500"
                      onClick={() => handleGenerateTeams(t.id)}
                    >
                      <Shuffle className="h-3 w-3 mr-1" />
                      Generate Tim
                    </Button>
                  </>
                )}
                {t.status === 'APPROVAL' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-green-500/30 text-green-500"
                    onClick={() => handleGenerateTeams(t.id)}
                  >
                    <Shuffle className="h-3 w-3 mr-1" />
                    Generate Tim
                  </Button>
                )}
                {t.status === 'TEAM_GENERATION' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-blue-500/30 text-blue-500"
                    onClick={() => handleGenerateBracket(t.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Generate Bracket
                  </Button>
                )}
                {t.status === 'SCORING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-amber-500/30 text-amber-500"
                    onClick={() => handleFinalize(t.id)}
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    Finalisasi
                  </Button>
                )}
                {t.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] text-red-500"
                    onClick={() => handleDelete(t.id)}
                  >
                    Hapus
                  </Button>
                )}
              </div>
            </div>
          ))}
          {tournaments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada tournament</p>
          )}
        </div>
      </div>
    </div>
  )
}
