import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import shaka from 'shaka-player/dist/shaka-player.ui.js';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal = ({ isOpen, onClose }: VideoModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAndInitVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('vsl_video')
          .select('video_url')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data?.video_url) return;
        
        setVideoUrl(data.video_url);

        if (!videoRef.current) return;

        if (!shaka.Player.isBrowserSupported()) {
          console.error('[VSL] Shaka Player not supported');
          return;
        }

        const player = new shaka.Player(videoRef.current);
        playerRef.current = player;

        player.configure({
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 15,
          }
        });

        await player.load(data.video_url);
        
        if (videoRef.current) {
          videoRef.current.play();
        }
      } catch (err) {
        console.error('[VSL] Error loading video:', err);
      }
    };

    fetchAndInitVideo();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="bg-black rounded-lg overflow-hidden">
          {videoUrl && (
            <video
              ref={videoRef}
              className="w-full h-auto"
              controls
              playsInline
              preload="auto"
            />
          )}
        </div>
      </div>
    </div>
  );
};
