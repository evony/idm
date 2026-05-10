'use client';

import { useState } from 'react';
// framer-motion removed — using CSS stagger-item classes instead
import {
  UserPlus, X, Loader2, MapPin, Phone, Users, Music, CheckCircle2, AlertTriangle, Ban, Info, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RegistrationPaymentInfo } from './registration-payment-info';
// animations import removed — using CSS stagger-item classes

interface SimilarPlayer {
  id: string;
  name: string;
  gamertag: string;
  division: string;
  city: string;
  phone: string | null;
  registrationStatus: string;
  isActive: boolean;
  matchType: 'exact_name' | 'similar_name' | 'phone_match';
  matchDetails: {
    nameMatch: boolean;
    cityMatch: boolean;
    phoneMatch: boolean;
    nameDifferent: boolean;
  };
}

export function RegistrationForm() {
  const dt = useDivisionTheme();
  const [division, setDivision] = useState<'male' | 'female'>('male');
  const [formData, setFormData] = useState({
    name: '',
    joki: '',
    phone: '',
    city: '',
    clubProfileId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovedList, setShowApprovedList] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    gamertag?: string;
  } | null>(null);

  // Warning state for duplicate names
  const [warningState, setWarningState] = useState<{
    show: boolean;
    isBlocked: boolean;
    isHighRisk: boolean;
    canReRegister: boolean;
    isApprovedPlayer: boolean;
    alreadyInTournament: boolean;
    reRegisterPlayerId: string | null;
    message: string;
    similarPlayers: SimilarPlayer[];
  } | null>(null);

  // Fetch clubs for dropdown
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', division],
    queryFn: async () => {
      const res = await fetch(`/api/stats?division=${division}`);
      return res.json();
    },
  });

  // Determine if registration is open for the selected division
  // 'setup' = tournament exists but admin hasn't opened registration yet
  const tournamentStatus = stats?.activeTournament?.status;
  const isRegistrationOpen = tournamentStatus === 'registration' || tournamentStatus === 'approval';

  // Fetch ClubProfiles (global, not season-specific) for the dropdown
  const { data: clubProfiles } = useQuery({
    queryKey: ['register-club-profiles'],
    queryFn: async () => {
      const res = await fetch('/api/clubs?unified=true');
      const data = await res.json();
      return data as Array<{ id: string; name: string; logo: string | null; memberCount: number }>;
    },
  });

  // Fetch approved participants for the active tournament
  const { data: approvedParticipants } = useQuery({
    queryKey: ['approved-participants', division, stats?.season?.id],
    queryFn: async () => {
      if (!stats?.season?.id) return [];
      const res = await fetch(`/api/tournaments?seasonId=${stats.season.id}`);
      const tournaments = await res.json();
      // Find the active tournament (not completed)
      const active = tournaments.find((t: { status: string; division?: string }) =>
        !['completed', 'finalization'].includes(t.status)
      );
      if (!active?.participations) return [];
      return active.participations
        .filter((p: { status: string }) => ['approved', 'assigned'].includes(p.status))
        .map((p: { player: { id: string; gamertag: string; name: string; tier: string; points: number }; tierOverride?: string | null }) => ({
          id: p.player.id,
          gamertag: p.player.gamertag,
          name: p.player.name,
          tier: p.tierOverride || p.player.tier || 'B',
          points: p.player.points,
        }));
    },
    enabled: !!stats?.season?.id && showApprovedList,
  });

  const handleSubmit = async (force = false) => {
    if (!formData.name.trim() || !formData.city.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          joki: formData.joki || null,
          phone: formData.phone,
          city: formData.city,
          clubProfileId: formData.clubProfileId || null,
          division,
          force,
        }),
      });

      const data = await res.json();

      // Handle blocked response (pending in queue or already in tournament)
      if (data.blocked) {
        setWarningState({
          show: true,
          isBlocked: true,
          isHighRisk: true,
          canReRegister: false,
          isApprovedPlayer: false,
          alreadyInTournament: data.alreadyInTournament || false,
          reRegisterPlayerId: null,
          message: data.error || data.message,
          similarPlayers: data.similarPlayers || [],
        });
        setIsSubmitting(false);
        return;
      }

      // Handle re-registration available response (approved player or rejected/inactive)
      if (data.canReRegister) {
        setWarningState({
          show: true,
          isBlocked: false,
          isHighRisk: data.isHighRisk || false,
          canReRegister: true,
          isApprovedPlayer: data.isApprovedPlayer || false,
          alreadyInTournament: false,
          reRegisterPlayerId: data.reRegisterPlayerId,
          message: data.message,
          similarPlayers: data.similarPlayers || [],
        });
        setIsSubmitting(false);
        return;
      }

      // Handle warning response (similar name)
      if (data.warning && !force) {
        setWarningState({
          show: true,
          isBlocked: false,
          isHighRisk: data.isHighRisk || false,
          canReRegister: false,
          isApprovedPlayer: false,
          alreadyInTournament: false,
          reRegisterPlayerId: null,
          message: data.message,
          similarPlayers: data.similarPlayers,
        });
        setIsSubmitting(false);
        return;
      }

      if (res.ok || data.success) {
        setSubmitResult({
          success: true,
          message: data.message,
          gamertag: data.player?.gamertag,
        });
        setFormData({ name: '', joki: '', phone: '', city: '', clubProfileId: '' });
        setWarningState(null);
        toast.success('Pendaftaran berhasil!', { description: 'Silakan lakukan pembayaran registrasi di bawah.' });
      } else if (data.registrationClosed) {
        setSubmitResult({
          success: false,
          message: data.error || 'Pendaftaran belum dibuka. Hubungi admin untuk informasi lebih lanjut.',
        });
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Gagal mendaftar',
        });
      }
    } catch {
      setSubmitResult({
        success: false,
        message: 'Terjadi kesalahan jaringan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWarning = () => {
    if (warningState?.isBlocked) return; // Cannot confirm if blocked
    setWarningState(prev => prev ? { ...prev, show: false } : null);
    handleSubmit(true); // Force submit
  };

  const handleReRegister = () => {
    if (!warningState?.canReRegister || !warningState?.reRegisterPlayerId) return;
    setWarningState(prev => prev ? { ...prev, show: false } : null);
    handleReRegisterSubmit(warningState.reRegisterPlayerId, warningState.isApprovedPlayer);
  };

  const handleReRegisterSubmit = async (reRegisterPlayerId: string, isApprovedPlayer: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          joki: formData.joki || null,
          phone: formData.phone,
          city: formData.city,
          clubProfileId: formData.clubProfileId || null,
          division,
          reRegister: true,
          reRegisterPlayerId,
          isApprovedPlayer,
        }),
      });

      const data = await res.json();

      if (res.ok || data.success) {
        setSubmitResult({
          success: true,
          message: data.message,
          gamertag: data.player?.gamertag || data.tournament?.name,
        });
        setFormData({ name: '', joki: '', phone: '', city: '', clubProfileId: '' });
        setWarningState(null);
        toast.success('Daftar ulang berhasil!', { description: 'Silakan lakukan pembayaran registrasi di bawah.' });
      } else if (data.registrationClosed) {
        setSubmitResult({
          success: false,
          message: data.error || 'Pendaftaran belum dibuka. Hubungi admin untuk informasi lebih lanjut.',
        });
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Gagal mendaftar ulang',
        });
      }
    } catch {
      setSubmitResult({
        success: false,
        message: 'Terjadi kesalahan jaringan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelWarning = () => {
    setWarningState(null);
  };

  const divisionEmoji = division === 'male' ? '🕺' : '💃';

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="stagger-item stagger-d0 text-center mb-2">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${division === 'male' ? 'bg-idm-male/10' : 'bg-idm-female/10'} mb-3`}>
          <UserPlus className={`w-7 h-7 ${division === 'male' ? 'text-idm-male' : 'text-idm-female'}`} />
        </div>
        <h2 className="text-xl font-bold text-gradient-fury">Daftar Peserta</h2>
        <p className="text-xs text-muted-foreground mt-1">Isi form berikut untuk mendaftar sebagai peserta IDM League</p>
      </div>

      {/* Success State */}
      {submitResult && (
        <div className="stagger-item-subtle">
          <Card className={`${
              submitResult.success
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-red-500/30 bg-red-500/5'
            } ${dt.casinoCard}`}>
            <CardContent className="p-5 relative z-10">
              {submitResult.success ? (
                <>
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    </div>
                    <h3 className="text-base font-bold text-green-500 mb-1">Pendaftaran Berhasil!</h3>
                    {submitResult.gamertag && (
                      <p className="text-sm font-medium mb-2">
                        Nickname kamu: <span className={`${division === 'male' ? 'text-idm-male' : 'text-idm-female'} font-bold`}>{submitResult.gamertag}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{submitResult.message}</p>
                  </div>

                  {/* Payment Info */}
                  <RegistrationPaymentInfo />

                  <div className="mt-4 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSubmitResult(null)}
                    >
                      Daftar Lagi
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <X className="w-7 h-7 text-red-500 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-red-500 mb-1">Gagal Mendaftar</h3>
                  <p className="text-xs text-muted-foreground">{submitResult.message}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setSubmitResult(null)}
                  >
                    Coba Lagi
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* Warning Dialog */}
      {warningState?.show && (
        <div className="stagger-item-subtle">
          <Card className={`${
              warningState.isBlocked
                ? warningState.alreadyInTournament
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-red-500/50 bg-red-500/5'
                : warningState.canReRegister
                  ? warningState.isApprovedPlayer
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-cyan-500/30 bg-cyan-500/5'
                  : warningState.isHighRisk
                    ? 'border-orange-500/30 bg-orange-500/5'
                    : 'border-yellow-500/30 bg-yellow-500/5'
            } ${dt.casinoCard}`}>
              <CardContent className="p-5 relative z-10">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    warningState.isBlocked
                      ? warningState.alreadyInTournament
                        ? 'bg-blue-500/10'
                        : 'bg-red-500/10'
                      : warningState.canReRegister
                        ? warningState.isApprovedPlayer
                          ? 'bg-green-500/10'
                          : 'bg-cyan-500/10'
                        : warningState.isHighRisk
                          ? 'bg-orange-500/10'
                          : 'bg-yellow-500/10'
                  }`}>
                    {warningState.isBlocked ? (
                      warningState.alreadyInTournament ? (
                        <Info className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Ban className="w-5 h-5 text-red-500" />
                      )
                    ) : warningState.canReRegister ? (
                      warningState.isApprovedPlayer ? (
                        <Music className="w-5 h-5 text-green-500" />
                      ) : (
                        <UserPlus className="w-5 h-5 text-cyan-500" />
                      )
                    ) : warningState.isHighRisk ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-base font-bold mb-1 ${
                      warningState.isBlocked
                        ? warningState.alreadyInTournament
                          ? 'text-blue-500'
                          : 'text-red-500'
                        : warningState.canReRegister
                          ? warningState.isApprovedPlayer
                            ? 'text-green-500'
                            : 'text-cyan-500'
                          : warningState.isHighRisk
                            ? 'text-orange-500'
                            : 'text-yellow-500'
                    }`}>
                      {warningState.isBlocked
                        ? warningState.alreadyInTournament
                          ? 'Sudah Terdaftar di Turnamen!'
                          : 'Pendaftaran Diblokir!'
                        : warningState.canReRegister
                          ? warningState.isApprovedPlayer
                            ? 'Daftar Ulang Turnamen!'
                            : 'Daftar Ulang Tersedia!'
                          : warningState.isHighRisk
                            ? 'Kemungkinan Duplikat!'
                            : 'Nama Mirip Terdeteksi!'}
                    </h3>
                    <p className="text-xs text-muted-foreground">{warningState.message}</p>
                  </div>
                </div>

                {/* Similar players list */}
                {warningState.similarPlayers.length > 0 && (
                  <div className="mb-4 p-4 sm:p-5 rounded-lg bg-muted/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Data yang cocok:</p>
                    <div className="space-y-2">
                      {warningState.similarPlayers.slice(0, 3).map((player) => (
                        <div key={player.id} className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium">{player.name}</span>
                            <span className="text-muted-foreground ml-1">(@{player.gamertag})</span>
                            {player.matchDetails.nameMatch && (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px]">Nama Sama</span>
                            )}
                            {player.matchDetails.phoneMatch && !player.matchDetails.nameMatch && (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">WA Sama</span>
                            )}
                            {/* Show player status */}
                            {player.registrationStatus && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                                player.registrationStatus === 'approved'
                                  ? 'bg-green-500/10 text-green-400'
                                  : player.registrationStatus === 'rejected'
                                    ? 'bg-red-500/10 text-red-400'
                                    : player.registrationStatus === 'pending'
                                      ? 'bg-yellow-500/10 text-yellow-400'
                                      : 'bg-muted text-muted-foreground'
                              }`}>
                                {player.registrationStatus === 'approved' ? 'Aktif' : player.registrationStatus === 'rejected' ? 'Ditolak' : player.registrationStatus === 'pending' ? 'Menunggu' : player.registrationStatus}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            {player.matchDetails.cityMatch && (
                              <div className="flex items-center gap-1 text-orange-400">
                                <MapPin className="w-3 h-3" />
                                <span>{player.city}</span>
                              </div>
                            )}
                            {player.matchDetails.phoneMatch && (
                              <div className="flex items-center gap-1 text-orange-400">
                                <Phone className="w-3 h-3" />
                                <span>{player.phone}</span>
                              </div>
                            )}
                            {!player.matchDetails.cityMatch && !player.matchDetails.phoneMatch && (
                              <span className="text-muted-foreground">{player.city}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved player re-register info (daftar ulang turnamen) */}
                {warningState.canReRegister && warningState.isApprovedPlayer && (
                  <div className="mb-4 p-4 sm:p-5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-2">
                      <Music className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-400">
                        <p><strong>Daftar Ulang Turnamen:</strong> Data Anda sudah terverifikasi. Anda akan didaftarkan ke turnamen minggu ini. Admin akan menyetujui dan menentukan tier Anda.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Re-registration info (rejected/inactive player) */}
                {warningState.canReRegister && !warningState.isApprovedPlayer && (
                  <div className="mb-4 p-4 sm:p-5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-start gap-2">
                      <UserPlus className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-cyan-400">
                        <p><strong>Daftar Ulang:</strong> Data Anda akan diperbarui dan status dikembalikan ke &quot;Menunggu Persetujuan&quot;. Anda juga otomatis terdaftar di turnamen minggu ini.</p>
                        <p className="mt-1 text-muted-foreground">Tier akan di-reset ke B dan admin akan menentukan tier yang sesuai.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Already in tournament message */}
                {warningState.isBlocked && warningState.alreadyInTournament && (
                  <div className="mb-4 p-4 sm:p-5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-400">
                          <strong>Sudah Terdaftar:</strong> Anda sudah terdaftar di turnamen minggu ini. Tidak perlu mendaftar lagi. Tunggu persetujuan admin atau hubungi admin jika ada kendala.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-[10px] border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                          onClick={() => setShowApprovedList(!showApprovedList)}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          {showApprovedList ? 'Tutup Daftar Peserta' : 'Lihat Peserta Disetujui'}
                          {showApprovedList ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blocked message (pending in queue) */}
                {warningState.isBlocked && !warningState.alreadyInTournament && (
                  <div className="mb-4 p-4 sm:p-5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-400">
                        <strong>Saran:</strong> Pendaftaran Anda sudah dalam antrian. Silakan tunggu admin menyetujui atau hubungi admin jika ada kendala.
                      </p>
                    </div>
                  </div>
                )}

                {/* High risk message (non re-register, non blocked) */}
                {warningState.isHighRisk && !warningState.isBlocked && !warningState.canReRegister && (
                  <div className="mb-4 p-4 sm:p-5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-400">
                      <strong>Perhatian:</strong> Jika ini adalah Anda, tidak perlu mendaftar ulang. Hubungi admin jika lupa nickname.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelWarning}
                    disabled={isSubmitting}
                  >
                    {warningState.isBlocked ? 'Tutup' : 'Batalkan'}
                  </Button>
                  {warningState.canReRegister && (
                    <Button
                      size="sm"
                      className={`flex-1 text-white ${
                        warningState.isApprovedPlayer
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-cyan-500 hover:bg-cyan-600'
                      }`}
                      onClick={handleReRegister}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : warningState.isApprovedPlayer ? (
                        <Music className="w-4 h-4 mr-1" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-1" />
                      )}
                      {isSubmitting ? 'Memproses...' : 'Daftar Ulang'}
                    </Button>
                  )}
                  {!warningState.isBlocked && !warningState.canReRegister && (
                    <Button
                      size="sm"
                      className={`flex-1 ${warningState.isHighRisk ? 'bg-orange-500 hover:bg-orange-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`}
                      onClick={handleConfirmWarning}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 mr-1" />
                      )}
                      {isSubmitting ? 'Memproses...' : 'Tetap Daftar'}
                    </Button>
                  )}
                </div>
              </CardContent>
          </Card>
        </div>
      )}

      {/* Approved Participants List */}
      {showApprovedList && (
        <div className="stagger-item-subtle">
          <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-400">
                    <CheckCircle2 className="w-4 h-4" /> Peserta Disetujui
                  </h3>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => setShowApprovedList(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {(approvedParticipants?.length || 0) === 0 ? (
                  <div className="py-4 text-center">
                    <Users className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Belum ada peserta yang disetujui</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                    {approvedParticipants.map((p: { id: string; gamertag: string; name: string; tier: string; points: number }, idx: number) => {
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-background/50 border border-blue-500/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[9px] font-bold text-blue-400 shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-medium truncate block">{p.gamertag}</span>
                              <span className="text-[10px] text-muted-foreground">{p.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground">{p.points}pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
          </Card>
        </div>
      )}

      {/* Registration Closed Gate — show when tournament registration is not open */}
      {!submitResult && !warningState?.show && !isRegistrationOpen && !statsLoading && stats && (
        <div className="stagger-item stagger-d1">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 mb-4">
                <Clock className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-amber-400 mb-2">Pendaftaran Belum Dibuka</h3>
              <p className="text-xs text-muted-foreground mb-1">
                Turnamen <span className={`font-semibold ${division === 'male' ? 'text-idm-male' : 'text-idm-female'}`}>{division === 'male' ? '🕺 Male' : '💃 Female'}</span> belum membuka pendaftaran.
              </p>
              <p className="text-[10px] text-muted-foreground/70 mb-4">
                Hubungi admin atau nantikan pengumuman pembukaan pendaftaran.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const otherDiv = division === 'male' ? 'female' : 'male';
                  setDivision(otherDiv);
                }}
                className="text-xs"
              >
                Coba Divisi {division === 'male' ? '💃 Female' : '🕺 Male'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registration Form — only show when registration is open */}
      {!submitResult && !warningState?.show && (isRegistrationOpen || statsLoading || !stats) && (
        <div className="stagger-item stagger-d1">
          <Card className={`${dt.casinoCard}`}>
            <div className={dt.casinoBar} />
            <CardContent className="p-5 relative z-10 space-y-4">
              {/* Division Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Division</label>
                <div className="flex items-center bg-muted rounded-2xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => { setDivision('male'); setFormData(p => ({ ...p, clubProfileId: '' })); }}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      division === 'male'
                        ? 'bg-idm-male text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🕺 Male
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDivision('female'); setFormData(p => ({ ...p, clubProfileId: '' })); }}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      division === 'female'
                        ? 'bg-idm-female text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    💃 Female
                  </button>
                </div>
              </div>

              {/* Nama/Nick - Wajib */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Nama / Nick <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Masukkan nama atau nickname kamu"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="pl-9 glass"
                    maxLength={30}
                  />
                </div>
              </div>

              {/* Joki - Optional */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Joki <span className="text-muted-foreground/70 text-[10px]">(opsional)</span>
                </label>
                <Input
                  placeholder="Nama joki jika dimainkan orang lain"
                  value={formData.joki}
                  onChange={(e) => setFormData(p => ({ ...p, joki: e.target.value }))}
                  className="glass"
                  maxLength={30}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Diisi jika player dijokikan oleh player lain</p>
              </div>

              {/* No WhatsApp - Wajib */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  No. WhatsApp <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="pl-9 glass"
                    type="tel"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Kota - Wajib */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Kota <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Contoh: Makassar, Jakarta, Bandung"
                    value={formData.city}
                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                    className="pl-9 glass"
                    maxLength={30}
                  />
                </div>
              </div>

              {/* Club - Optional */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Club <span className="text-muted-foreground/70 text-[10px]">(opsional)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Select
                    value={formData.clubProfileId}
                    onValueChange={(val) => setFormData(p => ({ ...p, clubProfileId: val === '_none' ? '' : val }))}
                  >
                    <SelectTrigger className="pl-9 glass">
                      <SelectValue placeholder="Pilih Club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Tanpa Club</SelectItem>
                      {clubProfiles?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] text-idm-gold-warm mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Club anda belum ada dalam daftar list club? Hubungi admin untuk membuat club
                </p>
              </div>

              {/* Submit Button */}
              <Button
                className={`w-full font-semibold ${
                  division === 'male'
                    ? 'bg-idm-male hover:bg-idm-male/90 text-white'
                    : 'bg-idm-female hover:bg-idm-female/90 text-white'
                }`}
                size="lg"
                disabled={!formData.name.trim() || !formData.city.trim() || !formData.phone.trim() || isSubmitting}
                onClick={() => handleSubmit(false)}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Mendaftar...' : `Daftar ${divisionEmoji} ${division === 'male' ? 'Male' : 'Female'}`}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                Pendaftaran akan diverifikasi oleh admin sebelum disetujui
              </p>

              {/* View Approved Participants Toggle */}
              <button
                type="button"
                onClick={() => setShowApprovedList(!showApprovedList)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                {showApprovedList ? 'Tutup Daftar Peserta' : 'Lihat Peserta Disetujui'}
                {showApprovedList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
