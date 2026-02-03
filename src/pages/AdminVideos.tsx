import { useEffect, useState } from 'react';
import { supabase, supabasePublic } from '@/integrations/supabase/client';
import { VideoSlotCard } from '@/components/admin/VideoSlotCard';
import { ImageSlotCard } from '@/components/admin/ImageSlotCard';
import { Video, ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define all video slots in the project
const VIDEO_SLOTS = [
  {
    page_key: 'home_vsl',
    title: 'VSL Principal',
    description: 'Vídeo de vendas da página inicial',
    route: '/',
  },
  {
    page_key: 'thankyou_upsell',
    title: 'Upsell - Página de Obrigado',
    description: 'VSL do Club Copy & Scale',
    route: '/thankyou',
  },
];

// Define all image slots in the project
const IMAGE_SLOTS = [
  {
    page_key: 'thankyou_banner',
    title: 'Banner Club Copy & Scale',
    description: 'Imagem do banner na página de obrigado',
    route: '/thankyou',
  },
];

interface VideoData {
  id: string;
  video_url: string;
  created_at: string;
  page_key: string;
}

interface ImageData {
  id: string;
  image_url: string;
  created_at: string;
  page_key: string;
}

const AdminVideos = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (isInitialLog: boolean = false) => {
    if (isInitialLog) setLoading(true);

    try {
      console.log("[ADMIN] Fetching media data with public client...");
      const [videosResult, imagesResult] = await Promise.all([
        supabasePublic
          .from('vsl_video')
          .select('*')
          .order('created_at', { ascending: false }),
        supabasePublic
          .from('banner_images')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      console.log("[ADMIN] Videos result:", videosResult.data?.length || 0, "rows found");
      console.log("[ADMIN] Images result:", imagesResult.data?.length || 0, "rows found");

      setVideos((videosResult.data as VideoData[]) || []);
      setImages((imagesResult.data as ImageData[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVideoForSlot = (pageKey: string) => {
    return videos.find(v => v.page_key === pageKey) || null;
  };

  const getImageForSlot = (pageKey: string) => {
    return images.find(i => i.page_key === pageKey) || null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            GESTÃO DE MÍDIAS
          </h1>
          <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">
            CONTROLE DE ASSETS VISUAIS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs"
          >
            LIMPAR CONEXÃO
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchData(false)}
            disabled={loading}
            className="border-white/10 hover:bg-white/5 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            ATUALIZAR
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-96 bg-white/5 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Video Slots */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-l-2 border-purple-500 pl-4">
              <h2 className="text-lg font-orbitron font-bold text-gray-200">SLOTS DE VÍDEO</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {VIDEO_SLOTS.map(slot => (
                <div key={slot.page_key} className="bg-[#0f0f16] rounded-xl border border-white/5 overflow-hidden transition-all hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(147,51,234,0.1)]">
                  <VideoSlotCard
                    slot={slot as any}
                    video={getVideoForSlot(slot.page_key) as any}
                    onVideoUpdated={fetchData}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Image Slots */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-l-2 border-pink-500 pl-4">
              <h2 className="text-lg font-orbitron font-bold text-gray-200">SLOTS DE IMAGEM</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {IMAGE_SLOTS.map(slot => (
                <div key={slot.page_key} className="bg-[#0f0f16] rounded-xl border border-white/5 overflow-hidden transition-all hover:border-pink-500/30 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                  <ImageSlotCard
                    slot={slot as any}
                    image={getImageForSlot(slot.page_key) as any}
                    onImageUpdated={fetchData}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminVideos;
