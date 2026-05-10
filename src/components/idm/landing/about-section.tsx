'use client';

import { Heart, Flame } from 'lucide-react';
import { AnimatedSection, SectionHeader } from './shared';

interface AboutSectionProps {
  cmsSections: Record<string, any>;
  cmsSettings: Record<string, string>;
}

export function AboutSection({ cmsSections, cmsSettings }: AboutSectionProps) {
  // CMS data with fallbacks
  const aboutSection = cmsSections.about;
  const sectionTitle = aboutSection?.title || 'Dari Pemain, Untuk Pemain';
  const sectionSubtitle = aboutSection?.subtitle || 'Cerita Kami';
  const sectionDescription = aboutSection?.description || 'Bagaimana Tarkam IDM lahir dari semangat komunitas yang tidak ingin gamenya sepi';

  // Origin story text
  const originStory = cmsSettings.about_origin_story || 'Idol Meta dari Lyto Game — sebuah rhythm game yang menghidupkan panggung virtual. Dari komunitas pemain yang tidak ingin gamenya mati, Tarkam IDM lahir — bukan dari perusahaan, bukan dari sponsor besar, tapi dari semangat Tarkam.';

  // Bottom tagline
  const bottomTagline = cmsSettings.about_tagline || 'By Players, For Players';

  // Parse origin story — take just the first paragraph for brevity
  const firstParagraph = originStory.split('\n\n')[0];

  // Highlight key words
  const highlighted = firstParagraph
    .replace(/Idol Meta/g, '<span class="text-[#d4a853] font-semibold">Idol Meta</span>')
    .replace(/Tarkam IDM/g, '<span class="text-[#d4a853] font-semibold">Tarkam IDM</span>')
    .replace(/Tarkam/g, '<span class="text-[#d4a853] font-semibold">Tarkam</span>');

  return (
    <section id="about" role="region" aria-label="Cerita Kami" className="relative py-12 sm:py-16 px-4 overflow-hidden bg-deep">
      {/* Background — subtle warm glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.04) 0%, transparent 50%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <AnimatedSection>
          {/* Simple centered text block with gold accents */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4a853]/40" />
            <Flame className="w-3.5 h-3.5 text-[#d4a853]/60" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4a853]/40" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#d4a853] mb-3">{sectionTitle}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto" dangerouslySetInnerHTML={{ __html: highlighted }} />
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4a853]/20" />
            <span className="text-[10px] font-bold text-[#d4a853]/40 uppercase tracking-widest">{bottomTagline}</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4a853]/20" />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
