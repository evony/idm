'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Image as ImageIcon,
  Loader2,
  FolderOpen,
  ChevronRight,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';

interface CloudinaryImage {
  public_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

interface CloudinaryPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, publicId: string) => void;
  currentImage?: string | null;
}

export function CloudinaryPicker({ open, onClose, onSelect, currentImage }: CloudinaryPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
  const [currentFolder, setCurrentFolder] = useState('');
  const [folders, setFolders] = useState<{ name: string; path: string }[]>([]);

  // Fetch images from Cloudinary
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cloudinary-images', currentFolder],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('max_results', '100');
      if (currentFolder) {
        params.append('prefix', currentFolder);
      }
      const res = await fetch(`/api/cloudinary/images?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch images');
      return res.json();
    },
    enabled: open,
  });

  // Fetch folders
  useEffect(() => {
    if (open) {
      fetch('/api/cloudinary/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_folders' }),
      })
        .then(res => res.json())
        .then(data => setFolders(data.folders || []))
        .catch(console.error);
    }
  }, [open]);

  // Filter images by search
  const filteredImages = (data?.images || []).filter((img: CloudinaryImage) =>
    img.public_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSelect = () => {
    if (selectedImage) {
      console.log('Cloudinary: Selecting image:', selectedImage.url);
      onSelect(selectedImage.url, selectedImage.public_id);
      onClose();
      setSelectedImage(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedImage(null);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Pilih Gambar dari Cloudinary
          </DialogTitle>
        </DialogHeader>

        {/* Search and folder navigation */}
        <div className="flex items-center gap-2 py-2 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari gambar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Folder breadcrumb */}
        {folders.length > 0 && (
          <div className="flex items-center gap-1 py-2 text-xs overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setCurrentFolder('')}
            >
              <FolderOpen className="w-3 h-3 mr-1" />
              Root
            </Button>
            {currentFolder && currentFolder.split('/').map((part, i, arr) => (
              <span key={i} className="flex items-center">
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setCurrentFolder(arr.slice(0, i + 1).join('/'))}
                >
                  {part}
                </Button>
              </span>
            ))}
          </div>
        )}

        {/* Folders */}
        {folders.length > 0 && !currentFolder && (
          <div className="flex gap-2 py-2 overflow-x-auto">
            {folders.map((folder) => (
              <Button
                key={folder.path}
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setCurrentFolder(folder.path)}
              >
                <FolderOpen className="w-4 h-4 mr-1.5" />
                {folder.name}
              </Button>
            ))}
          </div>
        )}

        {/* Images grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat gambar...</span>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <p>Tidak ada gambar ditemukan</p>
              {searchQuery && <p className="text-sm">Coba ubah kata kunci pencarian</p>}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
              <AnimatePresence>
                {filteredImages.map((img: CloudinaryImage) => (
                  <motion.div
                    key={img.public_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImage?.public_id === img.public_id
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img.url}
                      alt={img.public_id}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage?.public_id === img.public_id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <p className="text-[9px] text-white truncate">{img.public_id.split('/').pop()}</p>
                      <p className="text-[8px] text-white/70">{img.width}×{img.height}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {filteredImages.length} gambar ditemukan
            {currentImage && (
              <span className="ml-2 text-primary">
                • Current: {currentImage.split('/').pop()?.split('?')[0]}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button onClick={handleSelect} disabled={!selectedImage}>
              {selectedImage ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Pilih Gambar
                </>
              ) : (
                'Pilih gambar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
