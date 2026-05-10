'use client';

import { useState } from 'react';
import {
  HelpCircle, MessageCircle, ChevronDown, ChevronRight,
  UserPlus, Gamepad2, Trophy, ShoppingBag, Zap, Shield,
  BookOpen, Heart, Phone, ExternalLink, ArrowRight, Info,
  ArrowLeft, Calendar, Users, Radio
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/* ═══════════════════════════════════════════════════════
   FAQ Data — Pertanyaan yang Sering Diajukan
   Kategori disesuaikan dengan fitur aktual aplikasi.
   TIDAK menggunakan CMS — cukup update kode jika perlu.
   ═══════════════════════════════════════════════════════ */
const faqData = [
  {
    category: 'Umum',
    icon: Info,
    items: [
      {
        q: 'Apa itu Tarkam IDM?',
        a: 'Tarkam IDM (Idol Meta) adalah platform komunitas kompetisi dance game online yang mempertemukan pemain terbaik dari seluruh kota. Platform ini menyediakan sistem liga, leaderboard, marketplace, dan fitur komunitas lainnya.'
      },
      {
        q: 'Apakah aplikasi ini gratis?',
        a: 'Ya! Semua fitur dasar seperti melihat leaderboard, jadwal pertandingan, dan profil pemain sepenuhnya gratis. Fitur premium seperti skin eksklusif tersedia melalui sistem saweran (donasi).'
      },
      {
        q: 'Bagaimana cara install aplikasi di HP?',
        a: 'Buka aplikasi melalui browser di HP, lalu klik tombol "Install" yang muncul di banner atas. Aplikasi akan terinstall sebagai PWA (Progressive Web App) dan bisa diakses dari home screen.'
      },
    ]
  },
  {
    category: 'Akun & Login',
    icon: UserPlus,
    items: [
      {
        q: 'Bagaimana cara masuk ke aplikasi?',
        a: 'Klik tombol "Login" di header atau sidebar. Pilih tab "Peserta" dan masukkan nickname beserta password yang telah diberikan admin. Jika belum punya akun, hubungi admin melalui Discord atau WhatsApp untuk pendaftaran.'
      },
      {
        q: 'Saya lupa password, bagaimana cara reset?',
        a: 'Hubungi admin melalui Discord atau WhatsApp untuk reset password. Admin akan memverifikasi identitas Anda terlebih dahulu sebelum melakukan reset.'
      },
      {
        q: 'Apa itu nickname?',
        a: 'Nickname adalah nama identitas unik Anda di platform Tarkam IDM. Nickname digunakan untuk login dan akan tampil di leaderboard, profil, serta marketplace. Pastikan nickname Anda mudah dikenali.'
      },
    ]
  },
  {
    category: 'Liga & Pertandingan',
    icon: Trophy,
    items: [
      {
        q: 'Bagaimana cara melihat jadwal pertandingan?',
        a: 'Masuk ke menu divisi (Male/Female), lalu klik tab "Arena Live" di sub-navigasi bawah. Di sana Anda bisa melihat jadwal pertandingan per week beserta skor dan hasil match.'
      },
      {
        q: 'Berapa lama satu season berlangsung?',
        a: 'Satu season Tarkam IDM biasanya berlangsung selama beberapa minggu tergantung jumlah peserta dan jadwal yang ditentukan admin. Di akhir season, juara akan ditentukan berdasarkan hasil pertandingan.'
      },
      {
        q: 'Apa itu Arena Live?',
        a: 'Arena Live adalah fitur untuk melihat jadwal dan hasil pertandingan per week. Anda bisa melihat skor, pemain yang bertanding, dan hasil pertandingan secara lengkap.'
      },
      {
        q: 'Di mana saya bisa baca peraturan liga?',
        a: 'Klik tab "Peraturan" di sub-navigasi bawah saat berada di menu divisi, atau akses melalui Quick Link "Peraturan Liga" di halaman Bantuan ini. Peraturan berisi aturan main, skor, dan ketentuan pertandingan.'
      },
    ]
  },
  {
    category: 'Leaderboard & Komunitas',
    icon: Users,
    items: [
      {
        q: 'Bagaimana cara melihat leaderboard?',
        a: 'Buka menu "Komunitas" di navigasi utama, atau klik Quick Link "Leaderboard" di halaman ini. Leaderboard menampilkan peringkat pemain berdasarkan performa pertandingan di setiap divisi.'
      },
      {
        q: 'Apa perbedaan divisi Male dan Female?',
        a: 'Divisi Male dan Female adalah kategori pertandingan terpisah. Setiap divisi memiliki leaderboard, jadwal pertandingan, dan juara season masing-masing. Pilih divisi sesuai kategori Anda di navigasi utama.'
      },
      {
        q: 'Siapa Juara Season?',
        a: 'Juara Season adalah pemain yang memenangkan pertandingan final di akhir season. Anda bisa melihat juara season sebelumnya di menu Komunitas atau di halaman utama divisi.'
      },
    ]
  },
  {
    category: 'Marketplace',
    icon: ShoppingBag,
    items: [
      {
        q: 'Bagaimana cara menjual item di marketplace?',
        a: 'Buka menu Marketplace, lalu klik tombol "Pasang Iklan". Isi form dengan informasi item yang ingin dijual: nama, deskripsi, harga, kategori, link gambar (maksimal 5), dan nomor WhatsApp. Iklan Anda akan ditinjau admin sebelum ditampilkan.'
      },
      {
        q: 'Berapa lama proses review iklan?',
        a: 'Admin akan meninjau iklan Anda dalam waktu 1x24 jam. Pastikan informasi yang Anda isi lengkap dan sesuai untuk mempercepat proses approval.'
      },
      {
        q: 'Apa saja kategori yang tersedia di marketplace?',
        a: 'Kategori yang tersedia: Ava (avatar/skin), Item (item game), Char (karakter), Jasa (jasa GB, joki, dll), dan Dll (lain-lain).'
      },
      {
        q: 'Bagaimana cara membeli item di marketplace?',
        a: 'Klik pada iklan item yang Anda minati untuk melihat detail lengkap termasuk gambar, harga, dan deskripsi. Lalu klik tombol WhatsApp untuk langsung menghubungi penjual dan melakukan transaksi di luar platform.'
      },
    ]
  },
  {
    category: 'Saweran & Skin',
    icon: Heart,
    items: [
      {
        q: 'Apa itu saweran?',
        a: 'Saweran adalah sistem donasi untuk menambah prize pool turnamen. Donatur akan mendapatkan badge hati eksklusif di profil pemain sebagai tanda apresiasi.'
      },
      {
        q: 'Apa itu skin eksklusif?',
        a: 'Skin eksklusif adalah tampilan khusus di profil pemain yang didapatkan melalui saweran. Skin ini memiliki durasi tertentu dan akan menampilkan badge animasi di profil Anda.'
      },
    ]
  },
];

/* ═══════════════════════════════════════════════════════
   Quick Links Data
   ═══════════════════════════════════════════════════════ */
const quickLinks = [
  { icon: Gamepad2, label: 'Daftar Peserta', desc: 'Bergabung sebagai peserta Tarkam', view: 'register' as const, color: 'text-emerald-400' },
  { icon: Trophy, label: 'Peraturan Liga', desc: 'Baca peraturan lengkap liga', view: 'league' as const, color: 'text-idm-gold-warm' },
  { icon: Users, label: 'Leaderboard', desc: 'Lihat peringkat pemain', view: 'community' as const, color: 'text-cyan-400' },
  { icon: Radio, label: 'Arena Live', desc: 'Jadwal & hasil pertandingan', view: 'dashboard' as const, color: 'text-rose-400' },
];

/* ═══════════════════════════════════════════════════════
   FAQ Accordion Item
   ═══════════════════════════════════════════════════════ */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/40 rounded-2xl overflow-hidden transition-colors hover:border-border/70">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/20"
      >
        <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 text-idm-gold-warm/60 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        <span className="flex-1 text-sm font-medium text-foreground">{question}</span>
      </button>
      {open && (
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out animate-fade-in"
          >
            <div className="px-4 pb-4 pl-11 text-sm text-muted-foreground leading-relaxed">
              {answer}
            </div>
          </div>
        )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BANTUAN VIEW — Help Center
   ═══════════════════════════════════════════════════════ */
export function BantuanView() {
  const { setCurrentView, setDivision, setInitialDashboardTab, division } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleQuickLink = (view: string) => {
    if (view === 'community') {
      setDivision('male');
      setInitialDashboardTab('rankings');
    }
    if (view === 'dashboard') {
      setDivision(division || 'male');
    }
    setCurrentView(view as 'register' | 'league' | 'community' | 'dashboard');
  };

  return (
    <div className="space-y-6">
      {/* ═══ Back Button (Mobile) + Hero Header ═══ */}
      <div className="relative overflow-hidden rounded-2xl border border-idm-gold-warm/20 bg-gradient-to-br from-deep via-mid to-background">
        {/* Gold radial haze */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(212,168,83,0.08) 0%, transparent 65%)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 p-6 sm:p-10">
          {/* Back button for mobile FAB navigation */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className="lg:hidden flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>

          {/* Decorative accent */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-idm-gold-warm/50" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/[0.06]">
              <HelpCircle className="w-3 h-3 text-idm-gold-warm/80" />
              <span className="text-[9px] sm:text-[10px] text-idm-gold-warm font-bold tracking-[0.15em] uppercase">PUSAT BANTUAN</span>
            </div>
            <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-idm-gold-warm/50" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2" style={{
            background: 'linear-gradient(135deg, #f5e6c8 0%, #d4a853 30%, #e5be4a 50%, #f5d77a 70%, #d4a853 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Bantuan
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground/80 max-w-lg">
            Temukan jawaban untuk pertanyaan umum, panduan penggunaan aplikasi, dan informasi kontak untuk bantuan lebih lanjut.
          </p>
        </div>
      </div>

      {/* ═══ Quick Links ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.label}
              onClick={() => handleQuickLink(link.view)}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/70 transition-all text-center"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${link.color.replace('text-', 'bg-').replace(/\/.*/, '/10')}`}>
                <Icon className={`w-5 h-5 ${link.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-idm-gold-warm transition-colors">{link.label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{link.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══ FAQ Section ═══ */}
      <Card className="border-border/40 bg-card/60 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-idm-gold-warm" />
            Pertanyaan yang Sering Diajukan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/30'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              Semua
            </button>
            {faqData.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeCategory === cat.category
                      ? 'bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/30'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.category}
                </button>
              );
            })}
          </div>

          {/* FAQ Items */}
          <div className="space-y-2">
            {faqData
              .filter(cat => !activeCategory || cat.category === activeCategory)
              .map((cat) => (
                <div key={cat.category}>
                  {activeCategory && (
                    <div className="flex items-center gap-2 mb-3 mt-2 first:mt-0">
                      <cat.icon className="w-3.5 h-3.5 text-idm-gold-warm/70" />
                      <span className="text-xs font-semibold text-idm-gold-warm/70 uppercase tracking-wider">{cat.category}</span>
                      <div className="h-px flex-1 bg-border/30" />
                    </div>
                  )}
                  {cat.items.map((item) => (
                    <FaqItem key={item.q} question={item.q} answer={item.a} />
                  ))}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Panduan Singkat (Quick Guide) ═══ */}
      <Card className="border-border/40 bg-card/60 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gamepad2 className="w-4 h-4 text-idm-gold-warm" />
            Panduan Singkat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-idm-gold-warm/10 border border-idm-gold-warm/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-idm-gold-warm">1</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Login</p>
                <p className="text-xs text-muted-foreground mt-0.5">Klik "Login" di header dan login dengan nickname & password yang diberikan admin.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-idm-gold-warm/10 border border-idm-gold-warm/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-idm-gold-warm">2</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Pilih Divisi</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pilih divisi Male atau Female sesuai kategori Anda untuk melihat leaderboard & pertandingan.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-idm-gold-warm/10 border border-idm-gold-warm/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-idm-gold-warm">3</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Cek Arena Live</p>
                <p className="text-xs text-muted-foreground mt-0.5">Lihat jadwal & hasil pertandingan di menu Arena Live. Ikuti match sesuai jadwal yang ditentukan!</p>
              </div>
            </div>
            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-idm-gold-warm/10 border border-idm-gold-warm/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-idm-gold-warm">4</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Raih Juara!</p>
                <p className="text-xs text-muted-foreground mt-0.5">Menangkan pertandingan sepanjang season dan jadilah Juara Season di divisimu!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Hubungi Kami ═══ */}
      <Card className="border-border/40 bg-card/60 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4 text-idm-gold-warm" />
            Hubungi Kami
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Tidak menemukan jawaban? Hubungi kami melalui channel berikut:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Discord */}
            <a
              href="https://discord.gg/tarkamidm"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/5 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/40 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#5865F2]/15 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[#5865F2]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Discord</p>
                <p className="text-xs text-muted-foreground">Tanya jawab & diskusi komunitas</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-[#5865F2]/60 transition-colors shrink-0" />
            </a>
            {/* WhatsApp */}
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 hover:border-[#25D366]/40 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/15 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Bantuan langsung dari admin</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-[#25D366]/60 transition-colors shrink-0" />
            </a>
          </div>

          {/* Admin Help */}
          <div className="mt-4 p-4 sm:p-5 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/15">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-idm-gold-warm shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-idm-gold-warm">Untuk Admin</p>
                <p className="text-xs text-muted-foreground mt-0.5">Login sebagai admin untuk mengelola pemain, pertandingan, marketplace, dan konten. Hubungi Super Admin jika membutuhkan akses.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Footer note ═══ */}
      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground/50">
          <span className="text-gradient-fury font-semibold">Tarkam IDM</span> — Fan Made Edition © 2026
        </p>
      </div>
    </div>
  );
}
