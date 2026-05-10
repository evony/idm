'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube URLs
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // Already an embed URL
  if (url.includes('/embed/')) return url;

  // Direct video URL (mp4, webm, etc.)
  if (/\.(mp4|webm|ogg)$/i.test(url)) return url;

  // Fallback: return as-is (might be an embeddable URL)
  return url;
}

export function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) return null;

  const isDirectVideo = /\.(mp4|webm|ogg)$/i.test(embedUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border/50 bg-black/95 backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Video player for {title}</DialogDescription>
        </DialogHeader>

        {/* Custom close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
          aria-label="Close video"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video container — 16:9 aspect ratio */}
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          {isDirectVideo ? (
            <video
              src={embedUrl}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>

        {/* Title bar */}
        <div className="px-4 py-3 bg-black/80 border-t border-white/10">
          <p className="text-sm font-semibold text-white/90 truncate">{title}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
