import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';

interface YouTubePlayerProps {
    videoId: string;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    autoPlay?: boolean;
}

// Helper to extract YouTube video ID from various URL formats
export function extractYouTubeId(url: string): string | null {
    if (!url) return null;

    // Already just an ID (11 chars, alphanumeric + - + _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
    }

    return null;
}

// Check if a URL is a YouTube URL
export function isYouTubeUrl(url: string): boolean {
    if (!url) return false;
    return /youtu\.?be/i.test(url) || extractYouTubeId(url) !== null;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: (() => void) | undefined;
        _ytApiLoaded?: boolean;
        _ytApiCallbacks?: (() => void)[];
    }
}

function loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
        if (window._ytApiLoaded && window.YT?.Player) {
            resolve();
            return;
        }

        if (!window._ytApiCallbacks) {
            window._ytApiCallbacks = [];
        }
        window._ytApiCallbacks.push(resolve);

        if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            return; // Script already loading
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            window._ytApiLoaded = true;
            window._ytApiCallbacks?.forEach(cb => cb());
            window._ytApiCallbacks = [];
        };
    });
}

export const YouTubePlayer = ({
    videoId,
    onTimeUpdate,
    onPlay,
    onPause,
    onEnded,
    autoPlay = true
}: YouTubePlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const outerRef = useRef<HTMLDivElement>(null);

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(true);
    // When ended=true, show black overlay to block YouTube's recommendation screen
    const [isEnded, setIsEnded] = useState(false);

    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

    // Format time helper
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Initialize YouTube Player
    useEffect(() => {
        let destroyed = false;

        const init = async () => {
            await loadYouTubeAPI();
            if (destroyed || !containerRef.current) return;

            // Create a unique div for the player
            const playerDiv = document.createElement('div');
            playerDiv.id = `yt-player-${videoId}-${Date.now()}`;
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(playerDiv);

            playerRef.current = new window.YT.Player(playerDiv.id, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: autoPlay ? 1 : 0,
                    mute: 1,          // Must start muted for autoplay
                    controls: 0,      // Hide native YouTube controls
                    modestbranding: 1,
                    rel: 0,           // No related videos at end
                    showinfo: 0,
                    iv_load_policy: 3, // No annotations
                    fs: 0,
                    disablekb: 1,
                    playsinline: 1,
                    origin: window.location.origin,
                    enablejsapi: 1,
                    // cc_load_policy: 0 = REMOVIDO — para não suprimir legendas do vídeo
                    autohide: 1,
                    loop: 0,          // We handle loop manually to avoid flicker
                },
                events: {
                    onReady: (event: any) => {
                        if (destroyed) return;
                        setIsReady(true);
                        setIsBuffering(false);
                        setDuration(event.target.getDuration());

                        if (autoPlay) {
                            event.target.playVideo();
                        }
                    },
                    onStateChange: (event: any) => {
                        if (destroyed) return;

                        switch (event.data) {
                            case window.YT.PlayerState.PLAYING:
                                setIsPlaying(true);
                                setIsBuffering(false);
                                setIsEnded(false); // Clear ended state when resuming
                                onPlay?.();
                                break;

                            case window.YT.PlayerState.PAUSED:
                                setIsPlaying(false);
                                onPause?.();
                                break;

                            case window.YT.PlayerState.ENDED:
                                // ✅ FIX: Show black overlay immediately, then restart after 300ms
                                setIsEnded(true);
                                setIsPlaying(false);
                                onEnded?.();

                                // Restart video automatically after brief pause
                                setTimeout(() => {
                                    if (!destroyed && playerRef.current?.seekTo) {
                                        playerRef.current.seekTo(0, true);
                                        playerRef.current.playVideo();
                                        setProgress(0);
                                        setCurrentTime(0);
                                        setIsEnded(false);
                                    }
                                }, 800);
                                break;

                            case window.YT.PlayerState.BUFFERING:
                                setIsBuffering(true);
                                break;
                        }
                    },
                },
            });
        };

        init();

        return () => {
            destroyed = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            try {
                playerRef.current?.destroy();
            } catch (e) { /* ignore */ }
        };
    }, [videoId]);

    // Progress tracking interval
    useEffect(() => {
        if (!isReady) return;

        intervalRef.current = setInterval(() => {
            try {
                const player = playerRef.current;
                if (!player?.getCurrentTime) return;

                const ct = player.getCurrentTime();
                const dur = player.getDuration();

                setCurrentTime(ct);
                setDuration(dur);
                setProgress(dur > 0 ? (ct / dur) * 100 : 0);

                onTimeUpdate?.(ct, dur);
            } catch (e) { /* player might be destroyed */ }
        }, 500);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isReady, onTimeUpdate]);

    // Auto-hide controls
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        if (isPlaying) {
            hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    // Unmute on first click anywhere
    useEffect(() => {
        const handleFirstInteraction = () => {
            if (playerRef.current?.unMute) {
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
                setIsMuted(false);
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('scroll', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('scroll', handleFirstInteraction);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('scroll', handleFirstInteraction);
        };
    }, []);

    // Player controls
    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isEnded) {
            // If ended, restart
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
            setIsEnded(false);
            return;
        }
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
            playerRef.current.setVolume(100);
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        playerRef.current.seekTo(percent * duration, true);
    };

    const handleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const container = outerRef.current;
        if (container?.requestFullscreen) {
            container.requestFullscreen();
        }
    };

    return (
        <div
            ref={outerRef}
            className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden cursor-pointer group"
            onMouseMove={resetControlsTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
            style={{
                boxShadow: '0 0 0 4px rgba(0,0,0,1), 0 0 0 6px rgba(168,85,247,0.2), 0 20px 60px rgba(0,0,0,0.9)',
            }}
        >
            {/* YouTube iframe — tamanho normal (sem zoom) para não cortar legendas */}
            <div
                ref={containerRef}
                className="absolute inset-0 z-0"
                style={{ pointerEvents: 'none' }}
            />

            {/* ===== OVERLAYS DE CAMUFLAGEM ===== */}

            {/*
                BARRA TOPO — cobre: logo do canal, nome do canal, botões "Assistir depois" e "Compartilhar"
                Altura generosa de 80px garante cobertura total em qualquer tamanho de tela.
                Opacidade 100% no topo → fade para transparente embaixo (preserva o conteúdo do vídeo).
            */}
            <div
                className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
                style={{
                    height: '80px',
                    background: 'linear-gradient(to bottom, #000000 0%, rgba(0,0,0,0.97) 50%, rgba(0,0,0,0.5) 80%, transparent 100%)',
                }}
            />

            {/* CANTOS SUPERIORES — reforço extra para os dois cantos onde a UI do YouTube aparece */}
            <div
                className="absolute top-0 left-0 z-10 pointer-events-none"
                style={{
                    width: '260px',
                    height: '80px',
                    background: 'linear-gradient(145deg, #000000 0%, rgba(0,0,0,0.98) 60%, transparent 100%)',
                }}
            />
            <div
                className="absolute top-0 right-0 z-10 pointer-events-none"
                style={{
                    width: '320px',
                    height: '80px',
                    background: 'linear-gradient(215deg, #000000 0%, rgba(0,0,0,0.98) 60%, transparent 100%)',
                }}
            />

            {/* CANTO INFERIOR DIREITO — watermark/logo do YouTube */}
            <div
                className="absolute bottom-0 right-0 z-10 pointer-events-none"
                style={{
                    width: '140px',
                    height: '56px',
                    background: 'linear-gradient(315deg, #000000 0%, rgba(0,0,0,0.95) 50%, transparent 100%)',
                }}
            />

            {/* FAIXAS LATERAIS — disfarçam quaisquer elementos nas bordas */}
            <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-black z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 bottom-0 w-[4px] bg-black z-10 pointer-events-none" />

            {/* ===== FIM DOS OVERLAYS ===== */}

            {/* ✅ OVERLAY DE FIM DE VÍDEO — bloqueia a tela de recomendações do YouTube */}
            {isEnded && (
                <div className="absolute inset-0 z-25 flex items-center justify-center bg-black">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)] cursor-pointer hover:scale-110 transition-transform"
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        >
                            <Play className="w-10 h-10 text-white fill-white ml-1" />
                        </div>
                        <span className="text-white/70 text-sm tracking-wider">Reiniciando...</span>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {isBuffering && !isEnded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                        <span className="text-emerald-500 text-xs tracking-widest animate-pulse">CARREGANDO...</span>
                    </div>
                </div>
            )}

            {/* Big play button when paused */}
            {!isPlaying && isReady && !isBuffering && !isEnded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-110 transition-transform duration-300">
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                </div>
            )}

            {/* Bottom controls bar (PandaVideo style) */}
            <div
                className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress bar */}
                <div
                    className="w-full h-1.5 bg-white/10 cursor-pointer group/progress hover:h-2.5 transition-all"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-r-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-t from-black via-black/90 to-black/60">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="text-white hover:text-emerald-400 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                        </button>
                        <button onClick={toggleMute} className="text-white hover:text-emerald-400 transition-colors">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <span className="text-white/60 text-[10px] font-mono tracking-wider">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleFullscreen} className="text-white hover:text-emerald-400 transition-colors">
                            <Maximize className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Frame decorativo interno — dá aparência de player premium */}
            <div
                className="absolute inset-0 z-[5] pointer-events-none rounded-2xl"
                style={{
                    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.04), inset 0 0 40px rgba(0,0,0,0.4)',
                }}
            />
        </div>
    );
};

export default YouTubePlayer;
