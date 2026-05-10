'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, UserPlus } from 'lucide-react'
import type { PlayerData } from '@/lib/types'
import { tierColor } from '@/lib/types'

export function PlayerManager() {
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [division, setDivision] = useState('MALE')

  // Form
  const [name, setName] = useState('')
  const [tier, setTier] = useState('B')
  const [clubName, setClubName] = useState('')

  const loadPlayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/players?division=${division}`)
      const data = await res.json()
      setPlayers(data.players || [])
    } catch (err) {
      console.error('Failed to load players:', err)
    } finally {
      setLoading(false)
    }
  }, [division])

  useEffect(() => {
    setLoading(true)
    loadPlayers()
  }, [loadPlayers])

  const handleCreate = async () => {
    if (!name || !division) return
    setCreating(true)
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          division,
          tier,
          clubName: clubName || undefined,
        }),
      })
      if (res.ok) {
        setName('')
        setClubName('')
        setTier('B')
        loadPlayers()
      }
    } catch (err) {
      console.error('Failed to create player:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (playerId: string) => {
    if (!confirm('Hapus pemain ini?')) return
    try {
      await fetch(`/api/players/${playerId}`, { method: 'DELETE' })
      loadPlayers()
    } catch (err) {
      console.error('Failed to delete player:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Player Form */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Tambah Pemain
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Nama</Label>
            <Input
              placeholder="Nama pemain"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <Label className="text-xs">Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">S (Pro)</SelectItem>
                <SelectItem value="A">A (Mid)</SelectItem>
                <SelectItem value="B">B (New)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label className="text-xs">Klub (opsional)</Label>
            <Input
              placeholder="Nama klub"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className="h-8 text-xs bg-background/50 border-border/30 mt-1"
            />
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={creating || !name}
          className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Tambah Pemain
        </Button>
      </div>

      {/* Player List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Pemain {division === 'MALE' ? '♂' : '♀'}</h4>
          <Select value={division} onValueChange={setDivision}>
            <SelectTrigger className="h-7 w-24 text-[10px] bg-background/50 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">♂ Male</SelectItem>
              <SelectItem value="FEMALE">♀ Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/20 bg-card/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tierColor(p.tier)}`}>
                    {p.tier}
                  </span>
                  <span className="text-xs font-medium">{p.name}</span>
                  {p.clubName && (
                    <span className="text-[10px] text-muted-foreground">({p.clubName})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{p.totalPoints}pts</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pemain</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
