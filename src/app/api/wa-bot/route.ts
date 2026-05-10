/**
 * WA Bot Status API
 * GET /api/wa-bot
 *
 * Proxies status info from the WA bot mini-service (port 3004)
 * Falls back to "not running" if bot is offline
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Direct fetch to WA bot mini-service on port 3004
    const res = await fetch('http://localhost:3004/status', {
      signal: AbortSignal.timeout(3000),
      headers: {
        'Accept': 'application/json',
      },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      service: 'idm-wa-bot',
      waStatus: 'offline',
      message: 'WA Bot service is not running. Start it with: cd mini-services/wa-bot && npm start',
      commands: [
        { cmd: 'p help', desc: 'Bantuan & daftar command', usage: 'p help' },
        { cmd: 'p daftar', desc: 'Daftar peserta turnamen', usage: 'p daftar <nickname> <M/F> [nama] [club]' },
        { cmd: 'p info', desc: 'Cek status registrasi', usage: 'p info' },
        { cmd: 'p batal', desc: 'Batalkan registrasi', usage: 'p batal' },
        { cmd: 'p ranking', desc: 'Top 10 leaderboard', usage: 'p ranking' },
        { cmd: 'p status', desc: 'Cek stats pemain', usage: 'p status [nickname]' },
        { cmd: 'p recap', desc: 'Recap turnamen', usage: 'p recap' },
        { cmd: 'p next', desc: 'Match selanjutnya', usage: 'p next' },
        { cmd: 'p live', desc: 'Match sedang berlangsung', usage: 'p live' },
        { cmd: 'p result', desc: 'Admin: Input hasil match', usage: 'p result <matchId> <skor1>-<skor2>' },
        { cmd: 'p mvp', desc: 'Admin: Set MVP', usage: 'p mvp <matchId> <nickname>' },
        { cmd: 'p start', desc: 'Admin: Mulai turnamen', usage: 'p start <tournamentId>' },
        { cmd: 'p end', desc: 'Admin: Akhiri turnamen', usage: 'p end <tournamentId>' },
        { cmd: 'p broadcast', desc: 'Admin: Broadcast pesan', usage: 'p broadcast <pesan>' },
      ],
    }, { status: 503 })
  }
}
