'use client'

import { useState } from 'react'
import { useTournament } from '@/hooks/use-tournament'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, Trophy, Users, Swords, CheckCircle, Coins, Heart } from 'lucide-react'
import { TournamentManager } from './tournament-manager'
import { PlayerManager } from './player-manager'
import { MatchManager } from './match-manager'
import { ApprovalQueue } from './approval-queue'

type AdminTab = 'tournament' | 'approval' | 'match' | 'players' | 'donations'

export function AdminPanel() {
  const { adminOpen, setAdminOpen } = useTournament()
  const [activeTab, setActiveTab] = useState<AdminTab>('tournament')

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'tournament', label: 'Tournament', icon: <Trophy className="h-4 w-4" /> },
    { key: 'approval', label: 'Approval', icon: <CheckCircle className="h-4 w-4" /> },
    { key: 'match', label: 'Match', icon: <Swords className="h-4 w-4" /> },
    { key: 'players', label: 'Players', icon: <Users className="h-4 w-4" /> },
    { key: 'donations', label: 'Donations', icon: <Coins className="h-4 w-4" /> },
  ]

  return (
    <Sheet open={adminOpen} onOpenChange={setAdminOpen}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 bg-background border-border/50">
        <SheetHeader className="p-4 border-b border-border/30">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Panel
          </SheetTitle>
        </SheetHeader>

        {/* Tab buttons */}
        <div className="flex items-center gap-1 p-2 border-b border-border/20 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 text-xs whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4">
            {activeTab === 'tournament' && <TournamentManager />}
            {activeTab === 'approval' && <ApprovalQueue />}
            {activeTab === 'match' && <MatchManager />}
            {activeTab === 'players' && <PlayerManager />}
            {activeTab === 'donations' && <DonationsView />}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function DonationsView() {
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch('/api/donations?limit=50')
      .then(r => r.json())
      .then(d => { setDonations(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  })

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Coins className="h-4 w-4 text-amber-500" />
        Semua Donasi
      </h3>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada donasi</p>
      ) : (
        <div className="space-y-2">
          {donations.map((d: any) => (
            <div key={d.id} className="rounded-lg border border-border/30 bg-card/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{d.isAnonymous ? '👤 Anonymous' : d.donorName}</span>
                <span className="text-sm font-semibold text-amber-500">
                  Rp {d.amount?.toLocaleString('id-ID')}
                </span>
              </div>
              {d.message && (
                <p className="text-xs text-muted-foreground mt-1">&quot;{d.message}&quot;</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/60">
                <span>{d.tournament?.name || 'Unknown'}</span>
                <span>•</span>
                <span>{new Date(d.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
