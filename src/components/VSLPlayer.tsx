import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import shaka from 'shaka-player';

export const VSLPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unmuteListenersAdded = useRef(false);

  useEffect(() => {
    fetchVideoUrl();
  }, []);

  const fetchVideoUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('vsl_video')
        .select('video_url')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.video_url) {
        setVideoUrl(data.video_url);
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      setError('Não foi possível carregar o vídeo.');
    }
  };

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const initPlayer = async () => {
      try {
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          setError('Seu navegador não suporta o player de vídeo.');
          return;
        }

        const player = new shaka.Player(videoRef.current!);
        playerRef.current = player;

        player.configure({
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 15,
          }
        });

        await player.load(videoUrl);

        // Autoplay muted (required by browsers)
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => {
            console.log('Autoplay prevented:', e);
          });
        }

        // Unmute on first interaction
        if (!unmuteListenersAdded.current) {
          const unmuteVideo = () => {
            if (videoRef.current) {
              videoRef.current.muted = false;
              document.removeEventListener('click', unmuteVideo);
              document.removeEventListener('touchstart', unmuteVideo);
              document.removeEventListener('scroll', unmuteVideo);
            }
          };

          document.addEventListener('click', unmuteVideo, { once: true });
          document.addEventListener('touchstart', unmuteVideo, { once: true });
          document.addEventListener('scroll', unmuteVideo, { once: true });
          unmuteListenersAdded.current = true;
        }

      } catch (err) {
        console.error('Error initializing player:', err);
        setError('O vídeo não pôde ser carregado. Tente novamente em alguns segundos.');
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoUrl]);

  if (error) {
    return (
      <div className="w-full py-16 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-full py-16 text-center">
        <p className="text-muted-foreground">O vídeo da VSL ainda não foi configurado.</p>
      </div>
    );
  }

  return (
    <section id="vsl-video" className="w-full bg-[#0A0A0A] py-8">
      <div className="container mx-auto px-4">
        <video
          ref={videoRef}
          className="w-full max-w-4xl mx-auto rounded-lg"
          controls
          playsInline
        />
      </div>
    </section>
  );
};
