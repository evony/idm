'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      {show && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="animate-fade-enter-sm fixed right-4 bottom-24 sm:bottom-8 z-50 w-11 h-11 rounded-full bg-idm-gold-warm/15 border border-idm-gold-warm/30 flex items-center justify-center text-idm-gold-warm hover:bg-idm-gold-warm/20 hover:border-idm-gold-warm/50 hover:shadow-[0_0_20px_rgba(212,168,83,0.2)] transition-all duration-300 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
