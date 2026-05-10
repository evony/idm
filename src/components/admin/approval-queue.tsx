'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react'
import type { TournamentData } from '@/lib/types'
import { tierColor, statusLabel } from '@/lib/types'

export function ApprovalQueue() {
  const [tournaments, setTournaments] = useState<TournamentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [tournamentDetail, setTournamentDetail] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const loadTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/tournaments?status=REGISTRATION')
      const data = await res.json()
      setTournaments(Array.isArray(data) ? data : [])

      // Also load approval status tournaments
      const res2 = await fetch('/api/tournaments?status=APPROVAL')
      const data2 = await res2.json()
      if (Array.isArray(data2)) {
        setTournaments(prev => [...prev, ...data2])
      }
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
    } catch (err) {
      console.error('Failed to load tournament detail:', err)
    }
  }

  useEffect(() => {
    if (selectedTournamentId) {
      loadTournamentDetail(selectedTournamentId)
    }
  }, [selectedTournamentId])

  const handleApprove = async (participantId: string, assignedTier?: string) => {
    setProcessing(participantId)
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          status: 'APPROVED',
          assignedTier,
        }),
      })
      if (res.ok) {
        loadTournamentDetail(selectedTournamentId)
      }
    } catch (err) {
      console.error('Failed to approve:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (participantId: string) => {
    setProcessing(participantId)
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          status: 'REJECTED',
        }),
      })
      if (res.ok) {
        loadTournamentDetail(selectedTournamentId)
      }
    } catch (err) {
      console.error('Failed to reject:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handleApproveAll = async () => {
    if (!tournamentDetail) return
    const pending = tournamentDetail.participants?.filter((p: any) => p.status === 'PENDING') || []
    for (const p of pending) {
      await handleApprove(p.id, p.assignedTier || p.player?.tier)
    }
  }

  const pendingParticipants = tournamentDetail?.participants?.filter((p: any) => p.status === 'PENDING') || []
  const approvedParticipants = tournamentDetail?.participants?.filter((p: any) => p.status === 'APPROVED') || []

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Users className="h-4 w-4 text-purple-400" />
        Approval Queue
      </h4>

      {/* Tournament select */}
      <div>
        <Label className="text-xs">Tournament</Label>
        <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
          <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30 mt-1">
            <SelectValue placeholder="Pilih tournament..." />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} ({statusLabel(t.status)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tournamentDetail && (
        <>
          {/* Pending */}
          {pendingParticipants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">
                  Menunggu ({pendingParticipants.length})
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] border-green-500/30 text-green-500"
                  onClick={handleApproveAll}
                >
                  Approve Semua
                </Button>
              </div>
              <div className="space-y-1.5">
                {pendingParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[9px] ${tierColor(p.assignedTier || p.player?.tier)}`}>
                        {p.assignedTier || p.player?.tier || 'B'}
                      </Badge>
                      <span className="text-xs">{p.player?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        onValueChange={(tier) => handleApprove(p.id, tier)}
                      >
                        <SelectTrigger className="h-6 w-16 text-[9px] bg-background/50 border-border/30">
                          <SelectValue placeholder="Tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-green-400"
                        onClick={() => handleApprove(p.id, p.assignedTier || p.player?.tier)}
                        disabled={processing === p.id}
                      >
                        {processing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500"
                        onClick={() => handleReject(p.id)}
                        disabled={processing === p.id}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved */}
          {approvedParticipants.length > 0 && (
            <div>
              <Label className="text-xs font-semibold mb-2 block">
                Approved ({approvedParticipants.length})
              </Label>
              <div className="space-y-1">
                {approvedParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg border border-green-500/10 bg-green-500/5 px-3 py-1.5 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <Badge variant="outline" className={`text-[9px] ${tierColor(p.assignedTier || p.player?.tier)}`}>
                      {p.assignedTier || p.player?.tier}
                    </Badge>
                    <span>{p.player?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingParticipants.length === 0 && approvedParticipants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada peserta</p>
          )}
        </>
      )}

      {!selectedTournamentId && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Pilih tournament untuk melihat approval queue
        </p>
      )}
    </div>
  )
}
